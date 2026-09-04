/**
 * Provider d'autocomplétion intelligent pour le langage Pseudo-Code.
 * 
 * Fournit des suggestions contextuelles pour :
 * - Mots-clés du langage (Si, Pour, Tant que, etc.)
 * - Fonctions intégrées avec signatures et descriptions
 * - Variables et fonctions déclarées par l'utilisateur
 * - Types après ':' dans les déclarations
 * - Champs de structures et méthodes de types après '.'
 * - Fermetures de blocs (fsi, fpour, ftq)
 * - Méthodes par type (liste, pile, file, tableau, etc.)
 */

import * as vscode from 'vscode';
import { PSC_DEFINITIONS } from './definitions';
import { TYPE_MAPPING } from './constants';
import { extractFunctionParams, parseCompositeFields, extractPourLoopVar } from './utils';
import {
    BlockDefinition,
    findOpeningBlock,
    findClosingBlock,
    isBlockHeaderOrOpenLine,
    findLastBlockIndex,
    getAllBlockSnippets,
    REGEX_KEYWORD_COLON_CONTEXT,
    REGEX_END_OF_BLOCK_HEADER
} from './blocks';

// ═══════════════════════════════════════════════════════════════════════════════
// REGEX PRÉ-COMPILÉES
// ═══════════════════════════════════════════════════════════════════════════════

const REGEX_FUNC_DECL = /^\s*Fonction\s+([\p{L}_][\p{L}0-9_]*)\s*\(([^)]*)\)/iu;
const REGEX_ASSIGNMENT = /^\s*([\p{L}_][\p{L}0-9_]*)\s*(?:←|<-)/u;
const REGEX_VAR_DECL = /^\s*([\p{L}_][\p{L}0-9_]*(?:\s*,\s*[\p{L}_][\p{L}0-9_]*)*)\s*:\s*/u;
const REGEX_AFTER_DOT = /(?:[\])]|[\p{L}_][\p{L}0-9_]*)\.$/u;
// Capture le nom de la variable avant le '.', même à travers des accès [i] ou des appels ()
const REGEX_DOT_VAR_NAME = /((?:[\p{L}_][\p{L}0-9_]*)(?:\[[^\]]*\])*(?:\([^)]*\))*)\.$/u;
const REGEX_COMPOSITE_TYPE = /^([\p{L}_][\p{L}0-9_]*)\s*(?:=\s*)?<\s*(.+?)\s*>$/iu;
const REGEX_LEXIQUE_LINE = /^\s*Lexique\s*:?\s*$/i;
const REGEX_LINE_COMMENT = /\/\/.*/;

// Contexte de ':' pour les déclarations de types (paramètre, variable, type de retour, champ de structure)
const TYPE_DECLARATION_COLON = /(?:(?:^|[,<(])\s*(?:InOut\s+)?[\p{L}_][\p{L}0-9_]*(?:\s+InOut)?|\))\s*:\s*$/iu;

// ═══════════════════════════════════════════════════════════════════════════════
// MÉTHODES PAR TYPE — fonctions disponibles pour chaque type de données
// ═══════════════════════════════════════════════════════════════════════════════

interface TypeMethod {
    name: string;
    signature: string;
    snippet: string;
    description: string;
}

/** Méthodes associées à chaque type intégré (appelées fonctionnellement avec le type en 1er arg) */
const TYPE_METHODS: Record<string, TypeMethod[]> = {
    'liste': [
        { name: 'tete', signature: 'tete(l) : place', snippet: 'tete(${VAR})', description: 'Retourne la place de tête de la liste' },
        { name: 'val', signature: 'val(l, p) : élément', snippet: 'val(${VAR}, ${1:p})', description: 'Retourne la valeur à la place p' },
        { name: 'suc', signature: 'suc(l, p) : place', snippet: 'suc(${VAR}, ${1:p})', description: 'Retourne la place suivante' },
        { name: 'finListe', signature: 'finListe(l, p) : booléen', snippet: 'finListe(${VAR}, ${1:p})', description: 'Vrai si p est en fin de liste' },
        { name: 'listeVide', signature: 'listeVide() : Liste', snippet: 'listeVide()', description: 'Crée une liste vide' },
        { name: 'ajoutTeteListe', signature: 'ajoutTeteListe(l, v) : Liste', snippet: 'ajoutTeteListe(${VAR}, ${1:v})', description: 'Ajoute en tête de liste' },
        { name: 'suppressionTeteListe', signature: 'suppressionTeteListe(l) : Liste', snippet: 'suppressionTeteListe(${VAR})', description: 'Supprime la tête' },
        { name: 'ajoutQueueListe', signature: 'ajoutQueueListe(l, v) : Liste', snippet: 'ajoutQueueListe(${VAR}, ${1:v})', description: 'Ajoute en queue de liste' },
        { name: 'suppressionQueueListe', signature: 'suppressionQueueListe(l) : Liste', snippet: 'suppressionQueueListe(${VAR})', description: 'Supprime la queue' },
        { name: 'ajoutListe', signature: 'ajoutListe(l, p, v) : Liste', snippet: 'ajoutListe(${VAR}, ${1:p}, ${2:v})', description: 'Ajoute à la place p' },
        { name: 'suppressionListe', signature: 'suppressionListe(l, p) : Liste', snippet: 'suppressionListe(${VAR}, ${1:p})', description: 'Supprime à la place p' },
        { name: 'changeListe', signature: 'changeListe(l, p, v) : Liste', snippet: 'changeListe(${VAR}, ${1:p}, ${2:v})', description: 'Change la valeur à la place p' }
    ],
    'listesym': [
        { name: 'teteLS', signature: 'teteLS(l) : place', snippet: 'teteLS(${VAR})', description: 'Place de tête de la liste symétrique' },
        { name: 'queueLS', signature: 'queueLS(l) : place', snippet: 'queueLS(${VAR})', description: 'Place de queue' },
        { name: 'valLS', signature: 'valLS(l, p) : élément', snippet: 'valLS(${VAR}, ${1:p})', description: 'Valeur à la place p' },
        { name: 'sucLS', signature: 'sucLS(l, p) : place', snippet: 'sucLS(${VAR}, ${1:p})', description: 'Place suivante' },
        { name: 'precLS', signature: 'precLS(l, p) : place', snippet: 'precLS(${VAR}, ${1:p})', description: 'Place précédente' },
        { name: 'finLS', signature: 'finLS(l, p) : booléen', snippet: 'finLS(${VAR}, ${1:p})', description: 'Fin de liste symétrique' },
        { name: 'videLS', signature: 'videLS() : ListeSym', snippet: 'videLS()', description: 'Crée une liste symétrique vide' },
        { name: 'ajoutTeteLS', signature: 'ajoutTeteLS(l, v)', snippet: 'ajoutTeteLS(${VAR}, ${1:v})', description: 'Ajoute en tête' },
        { name: 'suppressionTeteLS', signature: 'suppressionTeteLS(l)', snippet: 'suppressionTeteLS(${VAR})', description: 'Supprime la tête' },
        { name: 'ajoutQueueLS', signature: 'ajoutQueueLS(l, v)', snippet: 'ajoutQueueLS(${VAR}, ${1:v})', description: 'Ajoute en queue' },
        { name: 'suppressionQueueLS', signature: 'suppressionQueueLS(l)', snippet: 'suppressionQueueLS(${VAR})', description: 'Supprime la queue' },
        { name: 'ajoutLS', signature: 'ajoutLS(l, p, v)', snippet: 'ajoutLS(${VAR}, ${1:p}, ${2:v})', description: 'Ajoute à une place' },
        { name: 'suppressionLS', signature: 'suppressionLS(l, p)', snippet: 'suppressionLS(${VAR}, ${1:p})', description: 'Supprime à une place' },
        { name: 'changeLS', signature: 'changeLS(l, p, v)', snippet: 'changeLS(${VAR}, ${1:p}, ${2:v})', description: 'Change la valeur' }
    ],
    'pile': [
        { name: 'pileVide', signature: 'pileVide() : Pile', snippet: 'pileVide()', description: 'Crée une pile vide' },
        { name: 'sommet', signature: 'sommet(p) : élément', snippet: 'sommet(${VAR})', description: 'Élément au sommet de la pile' },
        { name: 'estVidePile', signature: 'estVidePile(p) : booléen', snippet: 'estVidePile(${VAR})', description: 'Vrai si la pile est vide' },
        { name: 'empiler', signature: 'empiler(p, v)', snippet: 'empiler(${VAR}, ${1:v})', description: 'Empile un élément' },
        { name: 'dépiler', signature: 'dépiler(p)', snippet: 'depiler(${VAR})', description: 'Dépile le sommet' }
    ],
    'file': [
        { name: 'fileVide', signature: 'fileVide() : File', snippet: 'fileVide()', description: 'Crée une file vide' },
        { name: 'estVideFile', signature: 'estVideFile(f) : booléen', snippet: 'estVideFile(${VAR})', description: 'Vrai si la file est vide' },
        { name: 'enfiler', signature: 'enfiler(f, v)', snippet: 'enfiler(${VAR}, ${1:v})', description: 'Enfile un élément' },
        { name: 'défiler', signature: 'défiler(f)', snippet: 'defiler(${VAR})', description: 'Défile le premier élément' },
        { name: 'premier', signature: 'premier(f) : élément', snippet: 'premier(${VAR})', description: 'Premier élément de la file' }
    ],
    'table': [
        { name: 'tableVide', signature: 'tableVide() : Table', snippet: 'tableVide()', description: 'Crée une table vide' },
        { name: 'domaine', signature: 'domaine(t) : ensemble', snippet: 'domaine(${VAR})', description: 'Ensemble des clés' },
        { name: 'accesTable', signature: 'accesTable(t, clé) : valeur', snippet: 'accesTable(${VAR}, ${1:clé})', description: 'Accède à une valeur par clé' },
        { name: 'ajoutTable', signature: 'ajoutTable(t, clé, val)', snippet: 'ajoutTable(${VAR}, ${1:clé}, ${2:valeur})', description: 'Ajoute une entrée' },
        { name: 'suppressionTable', signature: 'suppressionTable(t, clé)', snippet: 'suppressionTable(${VAR}, ${1:clé})', description: 'Supprime une entrée' },
        { name: 'changeTable', signature: 'changeTable(t, clé, val)', snippet: 'changeTable(${VAR}, ${1:clé}, ${2:valeur})', description: 'Change la valeur d\'une clé' },
        { name: 'estDans', signature: 'estDans(ensemble, élément) : booléen', snippet: 'estDans(${VAR}, ${1:élément})', description: 'Vérifie si un élément est dans l\'ensemble' }
    ],
    'chaîne': [
        { name: 'longueur', signature: 'longueur(s) : entier', snippet: 'longueur(${VAR})', description: 'Longueur de la chaîne' },
        { name: 'concat', signature: 'concat(s1, s2) : chaîne', snippet: 'concat(${VAR}, ${1:s2})', description: 'Concaténation de deux chaînes' },
        { name: 'souschaîne', signature: 'souschaîne(s, début, fin) : chaîne', snippet: 'souschaîne(${VAR}, ${1:début}, ${2:fin})', description: 'Extrait une sous-chaîne' },
        { name: 'ième', signature: 'ième(s, i) : caractère', snippet: 'ième(${VAR}, ${1:i})', description: 'Caractère à la position i' }
    ],
    'chaine': [
        { name: 'longueur', signature: 'longueur(s) : entier', snippet: 'longueur(${VAR})', description: 'Longueur de la chaîne' },
        { name: 'concat', signature: 'concat(s1, s2) : chaîne', snippet: 'concat(${VAR}, ${1:s2})', description: 'Concaténation de deux chaînes' },
        { name: 'souschaîne', signature: 'souschaîne(s, début, fin) : chaîne', snippet: 'souschaîne(${VAR}, ${1:début}, ${2:fin})', description: 'Extrait une sous-chaîne' },
        { name: 'ième', signature: 'ième(s, i) : caractère', snippet: 'ième(${VAR}, ${1:i})', description: 'Caractère à la position i' }
    ],
    'tableau': [
        { name: 'longueur', signature: 'longueur(tab) : entier', snippet: 'longueur(${VAR})', description: 'Taille du tableau' }
    ],
    'fichier': [
        { name: 'fichierLire', signature: 'fichierLire(handle) : chaîne', snippet: 'fichierLire(${VAR})', description: 'Lit une ligne du fichier' },
        { name: 'fichierEcrire', signature: 'fichierEcrire(handle, valeur)', snippet: 'fichierEcrire(${VAR}, ${1:valeur})', description: 'Écrit dans le fichier' },
        { name: 'fichierFin', signature: 'fichierFin(handle) : booléen', snippet: 'fichierFin(${VAR})', description: 'Vrai si fin de fichier atteinte' },
        { name: 'fichierFermer', signature: 'fichierFermer(handle)', snippet: 'fichierFermer(${VAR})', description: 'Ferme le fichier' }
    ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNATURES DES FONCTIONS INTÉGRÉES
// ═══════════════════════════════════════════════════════════════════════════════

interface BuiltinFunctionInfo {
    name: string;
    signature: string;
    description: string;
    snippet: string;
    category: string;
}

function buildBuiltinFunctions(): BuiltinFunctionInfo[] {
    return PSC_DEFINITIONS.functions.map(f => ({
        name: f.name,
        signature: f.signature || `${f.name}(...)`,
        description: f.description || '',
        snippet: f.snippet || `${f.name}($1)`,
        category: f.category || 'Autre'
    }));
}

const BUILTIN_FUNCTIONS = buildBuiltinFunctions();

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES DISPONIBLES
// ═══════════════════════════════════════════════════════════════════════════════

const BUILTIN_TYPES: Array<{ label: string; detail: string }> = [
    { label: 'entier', detail: 'Nombre entier' },
    { label: 'réel', detail: 'Nombre réel (décimal)' },
    { label: 'booléen', detail: 'Valeur logique (vrai/faux)' },
    { label: 'chaîne', detail: 'Chaîne de caractères' },
    { label: 'caractère', detail: 'Un seul caractère' },
    { label: 'tableau', detail: 'Tableau indexé' },
    { label: 'liste', detail: 'Liste chaînée (TDA)' },
    { label: 'pile', detail: 'Pile LIFO (TDA)' },
    { label: 'file', detail: 'File FIFO (TDA)' },
    { label: 'listesym', detail: 'Liste symétrique (TDA)' },
    { label: 'table', detail: 'Table associative clé→valeur (TDA)' }
];

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYSE DU DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════════

interface DocumentAnalysis {
    variables: Map<string, string>;
    userFunctions: Map<string, { params: string; returnType: string; fullSignature: string }>;
    compositeTypes: Map<string, Array<{ name: string; type: string }>>;
    openBlocks: Array<{ block: BlockDefinition; line: number }>;
    currentFunctionName: string | null;
    currentFunctionParams: Array<{ name: string; type: string }>;
    /** nom de variable → type de base résolu (sans 'tableau', sans '[...]') */
    variableTypes: Map<string, string>;
}

/**
 * Résout le type de base d'une déclaration de type.
 * Ex: "tableau entier[0..n]" → "tableau", "Liste(Etudiant)" → "liste", "chaîne" → "chaîne"
 */
function resolveBaseType(rawType: string): string {
    const t = rawType.trim().toLowerCase();
    // "tableau ..." → "tableau"
    if (/^\s*tableau\b/i.test(rawType)) return 'tableau';
    // "fichier ..." → "fichier"
    if (/^\s*fichier\b/i.test(rawType)) return 'fichier';
    // "Liste(...)" → "liste"
    const parenIdx = t.indexOf('(');
    const base = parenIdx !== -1 ? t.substring(0, parenIdx).trim() : t;
    return TYPE_MAPPING[base] || base;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE MÉMOÏSÉ D'ANALYSE DE DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════════

const analysisCache = new Map<string, { version: number; cursorLine: number; analysis: DocumentAnalysis }>();

function getCachedAnalysis(document: vscode.TextDocument, cursorLine: number): DocumentAnalysis {
    const key = document.uri.toString();
    const cached = analysisCache.get(key);
    if (cached && cached.version === document.version && cached.cursorLine === cursorLine) {
        return cached.analysis;
    }
    const analysis = analyzeDocument(document, cursorLine);
    analysisCache.set(key, { version: document.version, cursorLine, analysis });
    return analysis;
}

function analyzeDocument(document: vscode.TextDocument, cursorLine: number): DocumentAnalysis {
    const variables = new Map<string, string>();
    const userFunctions = new Map<string, { params: string; returnType: string; fullSignature: string }>();
    const compositeTypes = new Map<string, Array<{ name: string; type: string }>>();
    const openBlocks: Array<{ block: BlockDefinition; line: number }> = [];
    const variableTypes = new Map<string, string>();
    let currentFunctionName: string | null = null;
    let currentFunctionParams: Array<{ name: string; type: string }> = [];
    let inLexiqueBlock = false;
    let lastFunctionLine = -1;

    for (let i = 0; i < document.lineCount; i++) {
        const lineText = document.lineAt(i).text;
        const trimmed = lineText.replace(REGEX_LINE_COMMENT, '').trim();
        if (!trimmed) continue;

        // Détection des types composites
        const compositeMatch = REGEX_COMPOSITE_TYPE.exec(trimmed);
        if (compositeMatch) {
            const typeName = compositeMatch[1];
            const fieldsStr = compositeMatch[2];
            const fields = parseCompositeFields(fieldsStr);
            compositeTypes.set(typeName, fields);
            compositeTypes.set(typeName.toLowerCase(), fields);
            continue;
        }

        // Détection des fonctions
        const funcMatch = REGEX_FUNC_DECL.exec(trimmed);
        if (funcMatch) {
            const funcName = funcMatch[1];
            const paramsStr = funcMatch[2] || '';
            const returnMatch = trimmed.match(/\)\s*:\s*(.+)$/i);
            const returnType = returnMatch ? returnMatch[1].trim() : '';
            const fullSig = `${funcName}(${paramsStr})${returnType ? ' : ' + returnType : ''}`;
            userFunctions.set(funcName, { params: paramsStr, returnType, fullSignature: fullSig });

            if (i <= cursorLine) {
                lastFunctionLine = i;
                currentFunctionName = funcName;
                currentFunctionParams = [];
                const params = extractFunctionParams(paramsStr);
                for (const p of params) {
                    if (p.name) {
                        currentFunctionParams.push({ name: p.name, type: p.type });
                        variables.set(p.name, p.type);
                        variableTypes.set(p.name, resolveBaseType(p.type));
                    }
                }
            }
            inLexiqueBlock = false;
            continue;
        }

        // Fin de fonction
        if (/^\s*Fin\b/i.test(trimmed) && lastFunctionLine >= 0) {
            if (cursorLine > i) {
                currentFunctionName = null;
                currentFunctionParams = [];
            }
        }

        // Détection Lexique (aussi dans les blocs /** ... */)
        if (REGEX_LEXIQUE_LINE.test(trimmed) || /^\*?\s*Lexique\s*:?\s*$/i.test(trimmed)) {
            inLexiqueBlock = true;
            continue;
        }

        // Variables dans le Lexique (aussi à l'intérieur de /** ... */)
        if (inLexiqueBlock) {
            if (/^\s*d[ée]but\b/i.test(trimmed) || /^\s*(Algorithme|Fonction)\b/i.test(trimmed) || /^\s*\*\/\s*$/.test(trimmed)) {
                inLexiqueBlock = false;
            } else {
                const varDecl = REGEX_VAR_DECL.exec(trimmed);
                if (varDecl) {
                    const varNames = varDecl[1].split(',').map(v => v.trim());
                    const typeMatch = trimmed.match(/:\s*(.+)$/);
                    const varType = typeMatch ? typeMatch[1].trim() : '';
                    for (const v of varNames) {
                        if (v) {
                            variables.set(v, varType);
                            variableTypes.set(v, resolveBaseType(varType));
                        }
                    }
                }
            }
            continue;
        }

        // Variables par affectation — essayer de deviner le type
        const assignMatch = REGEX_ASSIGNMENT.exec(trimmed);
        if (assignMatch && i <= cursorLine) {
            const varName = assignMatch[1];
            const rhs = trimmed.substring(trimmed.indexOf('←') + 1).trim();
            let guessedType = '';

            // Deviner le type à partir du RHS
            if (/^\s*tableau\b/i.test(rhs)) guessedType = 'tableau';
            else if (/^\s*\[/i.test(rhs)) guessedType = 'tableau';
            else if (/^\s*listeVide\s*\(/i.test(rhs) || /^\s*Liste\s*\(/i.test(rhs) || /^\s*ajoutTeteListe\b/i.test(rhs)) guessedType = 'liste';
            else if (/^\s*pileVide\s*\(/i.test(rhs)) guessedType = 'pile';
            else if (/^\s*fileVide\s*\(/i.test(rhs)) guessedType = 'file';
            else if (/^\s*videLS\s*\(/i.test(rhs)) guessedType = 'listesym';
            else if (/^\s*tableVide\s*\(/i.test(rhs) || /^\s*Table\s*\(/i.test(rhs)) guessedType = 'table';
            else if (/^\s*fichierOuvrir\s*\(/i.test(rhs) || /^\s*fichierCr[ée]+r\s*\(/i.test(rhs)) guessedType = 'fichier';
            else if (/^\s*lire\s*\(/i.test(rhs)) guessedType = '';
            else if (/^"/.test(rhs) || /^\s*concat\s*\(/i.test(rhs)) guessedType = 'chaîne';
            else if (/^\d+$/.test(rhs)) guessedType = 'entier';
            else if (/^\d+[.,]\d+$/.test(rhs)) guessedType = 'réel';
            else if (/^(vrai|faux)$/i.test(rhs)) guessedType = 'booléen';

            variables.set(varName, guessedType);
            if (guessedType) variableTypes.set(varName, guessedType);
        }

        // Variables déclarées avec `:` hors Lexique (inline)
        // Détecte: "x : entier" au milieu du code
        if (i <= cursorLine && !funcMatch) {
            const inlineDecl = /^\s*([\p{L}_][\p{L}0-9_]*)\s*:\s*([\p{L}_][\p{L}0-9_]*(?:\s*[\p{L}_][\p{L}0-9_]*)?(?:\[.*?\])?)/u.exec(trimmed);
            if (inlineDecl && !/^\s*(Si|Pour|Tant|Sinon|Début|Fin|Algorithme|Fonction)\b/i.test(trimmed)) {
                const vName = inlineDecl[1];
                const vType = inlineDecl[2].trim();
                if (!variables.has(vName)) {
                    variables.set(vName, vType);
                    variableTypes.set(vName, resolveBaseType(vType));
                }
            }
        }

        // Variables de boucle Pour
        const pourVar = extractPourLoopVar(trimmed);
        if (pourVar && i <= cursorLine) {
            variables.set(pourVar, 'entier');
            variableTypes.set(pourVar, 'entier');
        }

        // Suivi des blocs ouverts
        if (i <= cursorLine) {
            const openB = findOpeningBlock(trimmed);
            if (openB) {
                openBlocks.push({ block: openB, line: i });
            }
            const closeB = findClosingBlock(trimmed);
            if (closeB) {
                const idx = findLastBlockIndex(openBlocks.map(b => ({ type: b.block.id })), closeB.block.id);
                if (idx >= 0) openBlocks.splice(idx, 1);
            }
        }
    }

    return {
        variables, userFunctions, compositeTypes, openBlocks,
        currentFunctionName, currentFunctionParams, variableTypes
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER DE COMPLÉTION
// ═══════════════════════════════════════════════════════════════════════════════

export class PscCompletionProvider implements vscode.CompletionItemProvider {

    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken,
        _context: vscode.CompletionContext
    ): vscode.CompletionItem[] {
        const lineText = document.lineAt(position.line).text;
        const textBeforeCursor = lineText.substring(0, position.character);
        const trimmedBefore = textBeforeCursor.trim();

        if (isInCommentOrString(lineText, position.character)) {
            return [];
        }

        const analysis = getCachedAnalysis(document, position.line);
        const items: vscode.CompletionItem[] = [];

        // ─── Contexte : après '.' → champs de structure ET méthodes du type ───
        const dotMatch = REGEX_AFTER_DOT.exec(textBeforeCursor);
        if (dotMatch) {
            // Extraire le nom de base de la variable (avant les [i] ou ())
            const fullDotMatch = REGEX_DOT_VAR_NAME.exec(textBeforeCursor);
            let baseVarName = '';
            if (fullDotMatch) {
                // Extraire le vrai nom de la variable : "tab[i]" → "tab", "val(l, p)" → "val"
                const full = fullDotMatch[1];
                const baseMatch = full.match(/^([\p{L}_][\p{L}0-9_]*)/u);
                baseVarName = baseMatch ? baseMatch[1] : '';
            }
            return this.getDotCompletions(baseVarName, analysis);
        }

        // ─── Contexte : après ':' ───
        if (/:\s*$/.test(textBeforeCursor)) {
            // Après un mot-clé de bloc ("Alors :", "Faire :", "Sinon :", etc.) → AUCUNE complétion
            if (REGEX_KEYWORD_COLON_CONTEXT.test(textBeforeCursor)) {
                return [];
            }
            // Après une déclaration (variable, paramètre, retour de fonction, champ) → types
            if (TYPE_DECLARATION_COLON.test(textBeforeCursor)) {
                return this.getTypeCompletions(analysis);
            }
            // Tout autre contexte avec ':' → pas de complétion
            return [];
        }

        // ─── Contexte : fin de ligne d'ouverture de bloc ("Alors", "Faire", "Début", etc.) ───
        // L'en-tête du bloc est terminé, l'utilisateur va faire Entrée → aucune complétion
        if (REGEX_END_OF_BLOCK_HEADER.test(trimmedBefore)) {
            return [];
        }

        // ─── Contexte général : tout le reste ───

        // 1. Variables locales et paramètres (priorité la plus haute)
        for (const [varName, varType] of analysis.variables) {
            const item = new vscode.CompletionItem(varName, vscode.CompletionItemKind.Variable);
            item.detail = varType || 'variable';
            item.sortText = `0_${varName}`;
            if (analysis.currentFunctionParams.some(p => p.name === varName)) {
                item.documentation = new vscode.MarkdownString(`Paramètre de \`${analysis.currentFunctionName}\``);
                item.kind = vscode.CompletionItemKind.TypeParameter;
            }
            items.push(item);
        }

        // 2. Fonctions utilisateur
        for (const [funcName, funcInfo] of analysis.userFunctions) {
            const item = new vscode.CompletionItem(funcName, vscode.CompletionItemKind.Function);
            item.detail = funcInfo.fullSignature;
            item.sortText = `1_${funcName}`;
            const paramSnippet = this.buildParamSnippet(funcInfo.params);
            item.insertText = new vscode.SnippetString(`${funcName}(${paramSnippet})`);
            item.documentation = new vscode.MarkdownString(`**Fonction utilisateur**\n\n\`\`\`psc\nFonction ${funcInfo.fullSignature}\n\`\`\``);
            items.push(item);
        }

        // 3. Mots-clés contextuels et fermetures de blocs
        items.push(...this.getContextualKeywords(trimmedBefore, analysis));

        // 4. Fonctions intégrées — avec boost selon les types en scope
        const typesInScope = new Set<string>();
        for (const [, t] of analysis.variableTypes) {
            typesInScope.add(t.toLowerCase());
        }

        for (const func of BUILTIN_FUNCTIONS) {
            const item = new vscode.CompletionItem(func.name, vscode.CompletionItemKind.Function);
            item.detail = `${func.signature}  [${func.category}]`;

            // Booster les fonctions pertinentes aux types en scope
            const categoryLower = func.category.toLowerCase();
            const isRelevant = (
                (categoryLower === 'liste' && typesInScope.has('liste')) ||
                (categoryLower === 'liste symétrique' && typesInScope.has('listesym')) ||
                (categoryLower === 'pile' && typesInScope.has('pile')) ||
                (categoryLower === 'file' && typesInScope.has('file')) ||
                (categoryLower === 'table' && typesInScope.has('table')) ||
                (categoryLower === 'fichiers' && typesInScope.has('fichier')) ||
                (categoryLower === 'chaînes' && (typesInScope.has('chaîne') || typesInScope.has('chaine')))
            );

            item.sortText = isRelevant ? `2_${func.name}` : `3_${func.category}_${func.name}`;
            item.insertText = new vscode.SnippetString(func.snippet);
            item.documentation = new vscode.MarkdownString(
                `**${func.category}**\n\n\`\`\`psc\n${func.signature}\n\`\`\`\n\n${func.description}`
            );
            if (isRelevant) {
                item.documentation = new vscode.MarkdownString(
                    `⭐ **${func.category}** *(pertinent pour vos variables)*\n\n\`\`\`psc\n${func.signature}\n\`\`\`\n\n${func.description}`
                );
            }
            items.push(item);
        }

        // 5. Types composites déclarés — avec constructeur snippet
        for (const [typeName, fields] of analysis.compositeTypes) {
            if (typeName.charAt(0) === typeName.charAt(0).toLowerCase()) continue;
            // Type comme complétion simple
            const item = new vscode.CompletionItem(typeName, vscode.CompletionItemKind.Struct);
            item.detail = 'Type composite';
            item.sortText = `4_${typeName}`;
            items.push(item);

            // Constructeur avec les champs comme tab-stops
            if (fields.length > 0) {
                const ctorItem = new vscode.CompletionItem(`${typeName}(...)`, vscode.CompletionItemKind.Constructor);
                const fieldStr = fields.map(f => `${f.name} : ${f.type}`).join(', ');
                ctorItem.detail = `${typeName}(${fieldStr})`;
                const params = fields.map((f, idx) => `\${${idx + 1}:${f.name}}`).join(', ');
                ctorItem.insertText = new vscode.SnippetString(`${typeName}(${params})`);
                ctorItem.documentation = new vscode.MarkdownString(
                    `**Constructeur** \`${typeName}\`\n\n\`\`\`psc\n${typeName} = <${fieldStr}>\n\`\`\`\n\nCrée une instance de \`${typeName}\` avec les champs en arguments.`
                );
                ctorItem.sortText = `1z_${typeName}`;
                items.push(ctorItem);
            }
        }

        // 6. Constantes
        items.push(...this.getConstantCompletions());

        return items;
    }

    /**
     * Complétion après '.' — propose les champs de structure ET les méthodes du type
     */
    private getDotCompletions(varName: string, analysis: DocumentAnalysis): vscode.CompletionItem[] {
        const items: vscode.CompletionItem[] = [];
        const typeName = analysis.variableTypes.get(varName);
        const addedNames = new Set<string>();

        // 1. Champs de structure (si c'est un type composite)
        if (typeName) {
            const fields = analysis.compositeTypes.get(typeName) || analysis.compositeTypes.get(typeName.toLowerCase());
            if (fields) {
                for (const field of fields) {
                    const item = new vscode.CompletionItem(field.name, vscode.CompletionItemKind.Field);
                    item.detail = `${field.type}  (champ de ${typeName})`;
                    item.documentation = new vscode.MarkdownString(`Champ \`${field.name}\` de type \`${field.type}\` dans \`${typeName}\``);
                    item.sortText = `0_${field.name}`;
                    items.push(item);
                    addedNames.add(field.name);
                }
            }
        }

        // 2. Méthodes du type (fonctions intégrées qui prennent ce type en 1er argument)
        if (typeName) {
            const resolvedType = typeName.toLowerCase();
            const methods = TYPE_METHODS[resolvedType];
            if (methods) {
                for (const method of methods) {
                    if (addedNames.has(method.name)) continue;
                    const item = new vscode.CompletionItem(method.name, vscode.CompletionItemKind.Method);
                    item.detail = method.signature;
                    item.documentation = new vscode.MarkdownString(
                        `**${resolvedType}** — ${method.description}\n\n\`\`\`psc\n${method.signature}\n\`\`\``
                    );
                    // Juste insérer le nom de la méthode — le point est déjà tapé
                    item.insertText = method.name;
                    item.sortText = `1_${method.name}`;
                    items.push(item);
                    addedNames.add(method.name);
                }
            }
        }

        // 3. Fallback : proposer tous les champs de tous les types composites
        if (items.length === 0) {
            for (const [, fields] of analysis.compositeTypes) {
                for (const field of fields) {
                    if (!addedNames.has(field.name)) {
                        addedNames.add(field.name);
                        const item = new vscode.CompletionItem(field.name, vscode.CompletionItemKind.Field);
                        item.detail = field.type;
                        item.sortText = `0_${field.name}`;
                        items.push(item);
                    }
                }
            }
        }

        return items;
    }

    private buildParamSnippet(paramsStr: string): string {
        if (!paramsStr.trim()) return '';
        const params = extractFunctionParams(paramsStr);
        return params.map((p, idx) => `\${${idx + 1}:${p.name}}`).join(', ');
    }

    /**
     * Complétions de types (après ':' dans une déclaration) — avec espace avant
     */
    private getTypeCompletions(analysis: DocumentAnalysis): vscode.CompletionItem[] {
        const items: vscode.CompletionItem[] = [];

        for (const type of BUILTIN_TYPES) {
            const item = new vscode.CompletionItem(type.label, vscode.CompletionItemKind.TypeParameter);
            item.detail = type.detail;
            item.sortText = `0_${type.label}`;
            if (type.label === 'tableau') {
                item.insertText = new vscode.SnippetString(' tableau ${1:entier}[${2:0}..${3:n-1}]');
            } else {
                item.insertText = new vscode.SnippetString(` ${type.label}`);
            }
            items.push(item);
        }

        for (const [typeName, fields] of analysis.compositeTypes) {
            if (typeName.charAt(0) === typeName.charAt(0).toLowerCase()) continue;
            const item = new vscode.CompletionItem(typeName, vscode.CompletionItemKind.Struct);
            const fieldStr = fields.map(f => `${f.name} : ${f.type}`).join(', ');
            item.detail = `<${fieldStr}>`;
            item.sortText = `1_${typeName}`;
            item.insertText = new vscode.SnippetString(` ${typeName}`);
            item.documentation = new vscode.MarkdownString(`**Type composite** \`${typeName}\`\n\n\`\`\`psc\n${typeName} = <${fieldStr}>\n\`\`\``);
            items.push(item);
        }

        return items;
    }

    /**
     * Mots-clés contextuels — toujours proposés, VSCode filtre automatiquement
     */
    private getContextualKeywords(_trimmedBefore: string, analysis: DocumentAnalysis): vscode.CompletionItem[] {
        const items: vscode.CompletionItem[] = [];

        const structures: Array<{ label: string; filterText?: string; snippet: string; detail: string; sort: string }> = [
            ...getAllBlockSnippets().map(s => ({
                label: s.label,
                filterText: s.filterText,
                snippet: s.body,
                detail: s.detail,
                sort: s.sort
            })),
            { label: 'retourner', filterText: 'retourner', snippet: 'retourner ${1:valeur}', detail: 'Retourne une valeur', sort: '2f' },
            { label: 'retourne', filterText: 'retourne', snippet: 'retourne ${1:valeur}', detail: 'Retourne une valeur (variante)', sort: '2f2' },
            { label: 'écrire', filterText: 'écrire ecrire', snippet: 'écrire(${1:valeur})', detail: 'Affiche une valeur', sort: '2g' },
            { label: 'lire', filterText: 'lire', snippet: 'lire()', detail: 'Lit une valeur depuis l\'entrée', sort: '2g2' },
            { label: 'Lexique', filterText: 'lexique', snippet: '/*\nLexique :\n${1:variable} : ${2:type}\n*/', detail: 'Bloc Lexique pour déclarer les variables', sort: '2m' },
            { label: 'saisie', filterText: 'saisie', snippet: 'écrire("${1:Entrez une valeur : }")\n${2:variable} ← lire()', detail: 'Saisie utilisateur avec message', sort: '2n' },
            { label: 'Fonction récursive', filterText: 'foncrec fonction recursive', snippet: 'Fonction ${1:nomFonction}(${2:n} : ${3:entier}) : ${4:entier}\nDébut\n\tSi (${2:n} = ${5:0}) Alors :\n\t\tretourner ${6:1}\n\tSinon :\n\t\tretourner ${7:${2:n} * ${1:nomFonction}(${2:n}-1)}\n\tfsi\nFin', detail: 'Structure de fonction récursive avec cas de base', sort: '2j2' },
            { label: 'Fichier', filterText: 'fichier', snippet: '${1:handle} ← fichierOuvrir(${2:"fichier.txt"})\nTant que non fichierFin(${1:handle}) Faire :\n\t${3:ligne} ← fichierLire(${1:handle})\n\t${4}\nftq\nfichierFermer(${1:handle})', detail: 'Lecture complète de fichier', sort: '2o' }
        ];

        for (const s of structures) {
            const item = new vscode.CompletionItem(s.label, vscode.CompletionItemKind.Snippet);
            item.detail = s.detail;
            if (s.filterText) {
                item.filterText = s.filterText;
            }
            item.insertText = new vscode.SnippetString(s.snippet);
            item.sortText = s.sort;
            items.push(item);
        }

        // Fermetures de blocs (uniquement si on n'est pas déjà sur une ligne d'ouverture de bloc)
        if (!isBlockHeaderOrOpenLine(_trimmedBefore)) {
            for (let i = analysis.openBlocks.length - 1; i >= 0; i--) {
                const openBlock = analysis.openBlocks[i];
                const closingKeyword = openBlock.block.closeKeywords[0];
                const closingDetail = `Ferme le ${openBlock.block.name} de la ligne ${openBlock.line + 1}`;

                const item = new vscode.CompletionItem(closingKeyword, vscode.CompletionItemKind.Keyword);
                item.detail = closingDetail;
                item.sortText = `1_${String(analysis.openBlocks.length - i).padStart(2, '0')}_${closingKeyword}`;
                // Ne jamais forcer preselect: true pour éviter d'insérer fsi involontairement avec Entrée
                items.push(item);
            }
        }

        // Opérateurs logiques
        const operators = [
            { label: 'et', detail: 'ET logique', insert: 'et' },
            { label: 'ou', detail: 'OU logique', insert: 'ou' },
            { label: 'non', detail: 'NON logique (négation)', insert: 'non' },
            { label: 'mod', detail: 'Modulo (reste de la division entière)', insert: 'mod' },
            { label: '%', detail: 'Modulo (symbole)', insert: '%' },
            { label: '÷', detail: 'Division entière', insert: '÷' },
            { label: 'InOut', detail: 'Paramètre en entrée/sortie (passage par référence)', insert: 'InOut' }
        ];
        for (const op of operators) {
            const item = new vscode.CompletionItem(op.label, vscode.CompletionItemKind.Operator);
            item.detail = op.detail;
            item.insertText = op.insert;
            item.sortText = `5_${op.label}`;
            items.push(item);
        }

        return items;
    }

    private getConstantCompletions(): vscode.CompletionItem[] {
        const items: vscode.CompletionItem[] = [];
        const constants = [
            { label: 'vrai', detail: 'Booléen vrai' },
            { label: 'faux', detail: 'Booléen faux' },
            { label: 'nil', detail: 'Valeur nulle' },
            { label: 'FIN_LIGNE', detail: 'Caractère de fin de ligne' }
        ];
        for (const c of constants) {
            const item = new vscode.CompletionItem(c.label, vscode.CompletionItemKind.Constant);
            item.detail = c.detail;
            item.sortText = `6_${c.label}`;
            items.push(item);
        }
        return items;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER DE SIGNATURE (SignatureHelp)
// ═══════════════════════════════════════════════════════════════════════════════

export class PscSignatureHelpProvider implements vscode.SignatureHelpProvider {
    provideSignatureHelp(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): vscode.SignatureHelp | null {
        const lineText = document.lineAt(position.line).text;
        const textBefore = lineText.substring(0, position.character);

        let depth = 0;
        let openParenIdx = -1;
        for (let i = textBefore.length - 1; i >= 0; i--) {
            if (textBefore[i] === ')') depth++;
            else if (textBefore[i] === '(') {
                if (depth === 0) { openParenIdx = i; break; }
                depth--;
            }
        }
        if (openParenIdx === -1) return null;

        const beforeParen = textBefore.substring(0, openParenIdx).trimEnd();
        const funcNameMatch = beforeParen.match(/([\p{L}_][\p{L}0-9_]*)$/u);
        if (!funcNameMatch) return null;
        const funcName = funcNameMatch[1];

        // Ne pas afficher de signature pour les mots-clés
        if (/^(si|sinon|pour|tant|écrire|ecrire|lire)$/i.test(funcName)) {
            // Quand même afficher pour écrire/lire
            if (!/^(écrire|ecrire|lire)$/i.test(funcName)) return null;
        }

        const argsStr = textBefore.substring(openParenIdx + 1);
        let commaCount = 0;
        let parenDepth = 0;
        for (const c of argsStr) {
            if (c === '(') parenDepth++;
            else if (c === ')') parenDepth--;
            else if (c === ',' && parenDepth === 0) commaCount++;
        }

        // Fonctions intégrées
        const builtin = BUILTIN_FUNCTIONS.find(f => f.name.toLowerCase() === funcName.toLowerCase());
        if (builtin) {
            return this.buildSignatureHelp(builtin.signature, builtin.description, commaCount);
        }

        // Fonctions utilisateur
        const analysis = getCachedAnalysis(document, position.line);
        const userFunc = analysis.userFunctions.get(funcName);
        if (userFunc) {
            const sig = `${funcName}(${userFunc.params})${userFunc.returnType ? ' : ' + userFunc.returnType : ''}`;
            return this.buildSignatureHelp(sig, 'Fonction utilisateur', commaCount);
        }

        return null;
    }

    private buildSignatureHelp(signature: string, description: string, activeParameter: number): vscode.SignatureHelp {
        const help = new vscode.SignatureHelp();
        const sigInfo = new vscode.SignatureInformation(signature, new vscode.MarkdownString(description));

        const parenMatch = signature.match(/\(([^)]*)\)/);
        if (parenMatch) {
            const params = parenMatch[1].split(',');
            for (const p of params) {
                sigInfo.parameters.push(new vscode.ParameterInformation(p.trim()));
            }
        }

        help.signatures = [sigInfo];
        help.activeSignature = 0;
        help.activeParameter = activeParameter;
        return help;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════════════════════════════════

function isInCommentOrString(lineText: string, charPos: number): boolean {
    const commentIdx = lineText.indexOf('//');
    if (commentIdx !== -1 && charPos > commentIdx) return true;

    let inString = false;
    let stringChar = '';
    for (let i = 0; i < charPos && i < lineText.length; i++) {
        const c = lineText[i];
        if (!inString) {
            if (c === '"' || c === "'") { inString = true; stringChar = c; }
        } else if (c === stringChar && lineText[i - 1] !== '\\') {
            inString = false;
        }
    }
    return inString;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER DE HOVER (info au survol)
// ═══════════════════════════════════════════════════════════════════════════════

/** Mots-clés du langage avec leur description pour le hover */
const KEYWORD_DOCS: Record<string, string> = {
    'si': '**Si** — Structure conditionnelle\n\n```psc\nSi condition Alors :\n\t...\nfsi\n```',
    'sinon': '**Sinon** — Branche alternative d\'un Si',
    'fsi': '**fsi** — Fermeture d\'un bloc Si',
    'pour': '**Pour** — Boucle avec compteur\n\n```psc\nPour i de 0 à n-1 Faire :\n\t...\nfpour\n```',
    'fpour': '**fpour** — Fermeture d\'un bloc Pour',
    'tant': '**Tant que** — Boucle conditionnelle\n\n```psc\nTant que condition Faire :\n\t...\nftq\n```',
    'ftq': '**ftq** — Fermeture d\'un bloc Tant que',
    'retourner': '**retourner** — Retourne une valeur depuis une fonction',
    'retourne': '**retourne** — Retourne une valeur depuis une fonction (variante)',
    'début': '**Début** — Début du corps d\'une fonction ou d\'un algorithme',
    'fin': '**Fin** — Fin du corps d\'une fonction ou d\'un algorithme',
    'algorithme': '**Algorithme** — Déclare un algorithme principal',
    'fonction': '**Fonction** — Déclare une fonction\n\n```psc\nFonction nom(params) : type\nDébut\n\t...\nFin\n```',
    'alors': '**Alors** — Suit la condition d\'un Si',
    'faire': '**Faire** — Suit la condition d\'un Tant que ou d\'un Pour',
    'vrai': '**vrai** — Constante booléenne (true)',
    'faux': '**faux** — Constante booléenne (false)',
    'nil': '**nil** — Valeur nulle',
    'et': '**et** — Opérateur logique ET (and)',
    'ou': '**ou** — Opérateur logique OU (or)',
    'non': '**non** — Opérateur logique NON (not)',
    'mod': '**mod** — Opérateur modulo (reste de la division entière)',
    'inout': '**InOut** — Modificateur de paramètre : passage par référence (entrée/sortie)',
    'écrire': '**écrire(valeur)** — Affiche une ou plusieurs valeurs sur la sortie standard',
    'lire': '**lire()** : chaîne — Lit une valeur depuis l\'entrée standard',
    'fin_ligne': '**FIN_LIGNE** — Constante de fin de ligne (\\n)',
    'décroissant': '**décroissant** — Modificateur de boucle Pour pour itérer en ordre décroissant'
};

export class PscHoverProvider implements vscode.HoverProvider {
    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): vscode.Hover | null {
        const wordRange = document.getWordRangeAtPosition(position, /[\p{L}_][\p{L}0-9_]*/u);
        if (!wordRange) return null;

        const word = document.getText(wordRange);
        const lineText = document.lineAt(position.line).text;

        // Ne pas afficher de hover dans les commentaires/chaînes
        if (isInCommentOrString(lineText, wordRange.start.character)) return null;

        // 1. Fonctions intégrées
        const builtin = BUILTIN_FUNCTIONS.find(f => f.name.toLowerCase() === word.toLowerCase());
        if (builtin) {
            const md = new vscode.MarkdownString();
            md.appendMarkdown(`### ${builtin.name}\n\n`);
            md.appendMarkdown(`**Catégorie :** ${builtin.category}\n\n`);
            md.appendCodeblock(builtin.signature, 'psc');
            if (builtin.description) {
                md.appendMarkdown(`\n${builtin.description}`);
            }
            return new vscode.Hover(md, wordRange);
        }

        // 2. Fonctions utilisateur
        const analysis = getCachedAnalysis(document, document.lineCount);
        const userFunc = analysis.userFunctions.get(word);
        if (userFunc) {
            const md = new vscode.MarkdownString();
            md.appendMarkdown(`### ${word} *(fonction utilisateur)*\n\n`);
            md.appendCodeblock(`Fonction ${userFunc.fullSignature}`, 'psc');
            return new vscode.Hover(md, wordRange);
        }

        // 3. Types composites
        const compositeFields = analysis.compositeTypes.get(word) || analysis.compositeTypes.get(word.toLowerCase());
        if (compositeFields && word.charAt(0) === word.charAt(0).toUpperCase()) {
            const md = new vscode.MarkdownString();
            md.appendMarkdown(`### ${word} *(type composite)*\n\n`);
            const fieldStr = compositeFields.map(f => `${f.name} : ${f.type}`).join(', ');
            md.appendCodeblock(`${word} = <${fieldStr}>`, 'psc');
            md.appendMarkdown(`\n**Champs :**\n`);
            for (const f of compositeFields) {
                md.appendMarkdown(`- \`${f.name}\` : ${f.type}\n`);
            }
            return new vscode.Hover(md, wordRange);
        }

        // 4. Variables
        const varType = analysis.variables.get(word);
        if (varType !== undefined) {
            const md = new vscode.MarkdownString();
            const isParam = analysis.currentFunctionParams.some(p => p.name === word);
            if (isParam) {
                md.appendMarkdown(`### ${word} *(paramètre de ${analysis.currentFunctionName})*\n\n`);
            } else {
                md.appendMarkdown(`### ${word} *(variable)*\n\n`);
            }
            if (varType) {
                md.appendCodeblock(`${word} : ${varType}`, 'psc');
            }
            return new vscode.Hover(md, wordRange);
        }

        // 5. Mots-clés du langage
        const kwDoc = KEYWORD_DOCS[word.toLowerCase()];
        if (kwDoc) {
            return new vscode.Hover(new vscode.MarkdownString(kwDoc), wordRange);
        }

        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER DE DÉFINITION (Ctrl+Clic / Go to Definition)
// ═══════════════════════════════════════════════════════════════════════════════

export class PscDefinitionProvider implements vscode.DefinitionProvider {
    provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): vscode.Definition | null {
        const wordRange = document.getWordRangeAtPosition(position, /[\p{L}_][\p{L}0-9_]*/u);
        if (!wordRange) return null;

        const word = document.getText(wordRange);
        const lineText = document.lineAt(position.line).text;

        if (isInCommentOrString(lineText, wordRange.start.character)) return null;

        // Chercher la déclaration de fonction
        const funcRegex = new RegExp(`^\\s*Fonction\\s+${this.escapeRegex(word)}\\s*\\(`, 'iu');
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i).text;
            const match = funcRegex.exec(line);
            if (match) {
                // Position au début du nom de la fonction
                const funcNameStart = line.indexOf(word, match.index);
                return new vscode.Location(
                    document.uri,
                    new vscode.Position(i, funcNameStart >= 0 ? funcNameStart : 0)
                );
            }
        }

        // Chercher la déclaration de type composite
        const typeRegex = new RegExp(`^\\s*${this.escapeRegex(word)}\\s*=\\s*<`, 'iu');
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i).text;
            if (typeRegex.test(line)) {
                return new vscode.Location(
                    document.uri,
                    new vscode.Position(i, line.indexOf(word))
                );
            }
        }

        // Chercher l'affectation (première occurrence)
        const assignRegex = new RegExp(`^\\s*${this.escapeRegex(word)}\\s*(?:←|<-)`, 'u');
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i).text;
            if (assignRegex.test(line)) {
                return new vscode.Location(
                    document.uri,
                    new vscode.Position(i, line.indexOf(word))
                );
            }
        }

        return null;
    }

    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
