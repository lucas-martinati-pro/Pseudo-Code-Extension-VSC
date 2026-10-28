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
const REGEX_AFTER_DOT = /(?:[\])]|[\p{L}_][\p{L}0-9_]*)\.[\p{L}0-9_]*$/u;
const REGEX_COMPOSITE_TYPE = /^([\p{L}_][\p{L}0-9_]*)\s*(?:=\s*)?<\s*(.+?)\s*>$/iu;
const REGEX_TYPE_ALIAS = /^\s*(?:Soit\s+)?([\p{L}_][\p{L}0-9_]*)\s*=\s*(?!<)(.+)$/iu;
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

/** Méthodes associées à chaque type intégré (dérivées automatiquement de PSC_DEFINITIONS) */
function buildTypeMethods(): Record<string, TypeMethod[]> {
    const map: Record<string, TypeMethod[]> = {};
    for (const f of PSC_DEFINITIONS.functions) {
        if (!f.targetType) continue;
        const displayName = f.signature ? f.signature.split('(')[0].trim() : f.name;
        const targets = Array.isArray(f.targetType) ? f.targetType : [f.targetType];
        for (const target of targets) {
            const key = target.toLowerCase();
            if (!map[key]) {
                map[key] = [];
            }
            map[key].push({
                name: displayName,
                signature: f.signature || `${displayName}(...)`,
                snippet: f.methodSnippet || f.snippet || `${displayName}($1)`,
                description: f.description || ''
            });
        }
    }
    return map;
}

const TYPE_METHODS: Record<string, TypeMethod[]> = buildTypeMethods();

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
// TYPES DISPONIBLES (dérivés automatiquement de PSC_DEFINITIONS.types)
// ═══════════════════════════════════════════════════════════════════════════════

const BUILTIN_TYPES: Array<{ label: string; detail: string }> = PSC_DEFINITIONS.types.map(t => ({
    label: t.name,
    detail: t.description || t.name
}));

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYSE DU DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════════

export interface DocumentAnalysis {
    variables: Map<string, string>;
    userFunctions: Map<string, { params: string; returnType: string; fullSignature: string }>;
    compositeTypes: Map<string, Array<{ name: string; type: string }>>;
    openBlocks: Array<{ block: BlockDefinition; line: number }>;
    currentFunctionName: string | null;
    currentFunctionParams: Array<{ name: string; type: string }>;
    /** nom de variable → type de base résolu (sans 'tableau', sans '[...]') */
    variableTypes: Map<string, string>;
    /** nom de variable → type d'élément si conteneur (ex: 'MotTraduction') */
    variableElementTypes: Map<string, string>;
    /** nom d'alias (en minuscules) → { baseType: string; elementType?: string; raw: string } */
    typeAliases: Map<string, { baseType: string; elementType?: string; raw: string }>;
}

interface TypeInfo {
    baseType: string;
    elementType?: string;
}

/**
 * Analyse et résout le type de base et d'élément (si conteneur paramétré).
 * Gère les alias ('Lexique' → arbin(MotTraduction)), les types paramétrés ('arbin(MotTraduction)', 'liste[entier]'), etc.
 */
export function parseTypeInfo(rawType: string, typeAliases?: Map<string, { baseType: string; elementType?: string; raw: string }>): TypeInfo {
    const trimmed = rawType.trim();
    if (!trimmed) return { baseType: '' };

    const lower = trimmed.toLowerCase();
    if (typeAliases && typeAliases.has(lower)) {
        const alias = typeAliases.get(lower)!;
        return { baseType: alias.baseType, elementType: alias.elementType };
    }

    // Types paramétrés : arbin(MotTraduction), arbin[MotTraduction], liste(entier), etc.
    const paramMatch = trimmed.match(/^([\p{L}_][\p{L}0-9_]*)\s*[(\[]\s*([^()\[\]]+?)\s*[)\]]/u);
    if (paramMatch) {
        const rawBase = paramMatch[1].toLowerCase();
        const base = TYPE_MAPPING[rawBase] || (typeAliases?.get(rawBase)?.baseType) || rawBase;
        const rawElem = paramMatch[2].trim();
        const elem = (typeAliases?.get(rawElem.toLowerCase())?.baseType) || rawElem;
        return { baseType: base, elementType: elem };
    }

    const match = trimmed.match(/^[\p{L}_][\p{L}0-9_]*/u);
    if (match) {
        const firstWord = match[0].toLowerCase();
        if (typeAliases && typeAliases.has(firstWord)) {
            const alias = typeAliases.get(firstWord)!;
            return { baseType: alias.baseType, elementType: alias.elementType };
        }
        if (firstWord === 'tableau') {
            const afterTableau = trimmed.substring(match[0].length).trim();
            const elemMatch = afterTableau.match(/^([\p{L}_][\p{L}0-9_]*)/u);
            return {
                baseType: 'tableau',
                elementType: elemMatch ? elemMatch[1] : undefined
            };
        }
        if (TYPE_MAPPING[firstWord]) {
            return { baseType: TYPE_MAPPING[firstWord] };
        }
    }

    const parenIdx = trimmed.indexOf('(');
    const bracketIdx = trimmed.indexOf('[');
    const splitIdx = (parenIdx !== -1 && bracketIdx !== -1)
        ? Math.min(parenIdx, bracketIdx)
        : (parenIdx !== -1 ? parenIdx : bracketIdx);
    const base = (splitIdx !== -1 ? trimmed.substring(0, splitIdx) : trimmed).trim().toLowerCase();
    const resolved = TYPE_MAPPING[base] || (typeAliases?.get(base)?.baseType) || base;
    return { baseType: resolved };
}

export function resolveBaseType(rawType: string, typeAliases?: Map<string, { baseType: string; elementType?: string; raw: string }>): string {
    return parseTypeInfo(rawType, typeAliases).baseType;
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

export function analyzeDocument(document: vscode.TextDocument, cursorLine: number): DocumentAnalysis {
    const variables = new Map<string, string>();
    const userFunctions = new Map<string, { params: string; returnType: string; fullSignature: string }>();
    const compositeTypes = new Map<string, Array<{ name: string; type: string }>>();
    const openBlocks: Array<{ block: BlockDefinition; line: number }> = [];
    const variableTypes = new Map<string, string>();
    const variableElementTypes = new Map<string, string>();
    const typeAliases = new Map<string, { baseType: string; elementType?: string; raw: string }>();
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

        // Détection des types alias (ex: Lexique = arbin(MotTraduction) ou Soit ArbreBinaireEntier = arbin[entier])
        const aliasMatch = REGEX_TYPE_ALIAS.exec(trimmed);
        if (aliasMatch) {
            const aliasName = aliasMatch[1];
            const rawTarget = aliasMatch[2].trim();
            const info = parseTypeInfo(rawTarget, typeAliases);
            typeAliases.set(aliasName.toLowerCase(), {
                baseType: info.baseType,
                elementType: info.elementType,
                raw: rawTarget
            });
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
            // Ne pas enregistrer la fonction comme appelable si le curseur est sur sa propre ligne de déclaration
            if (i !== cursorLine) {
                userFunctions.set(funcName, { params: paramsStr, returnType, fullSignature: fullSig });
            }

            if (i < cursorLine) {
                lastFunctionLine = i;
                currentFunctionName = funcName;
                currentFunctionParams = [];
                const params = extractFunctionParams(paramsStr);
                for (const p of params) {
                    if (p.name) {
                        currentFunctionParams.push({ name: p.name, type: p.type });
                        variables.set(p.name, p.type);
                        const typeInfo = parseTypeInfo(p.type, typeAliases);
                        variableTypes.set(p.name, typeInfo.baseType);
                        if (typeInfo.elementType) {
                            variableElementTypes.set(p.name, typeInfo.elementType);
                        }
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
                            const typeInfo = parseTypeInfo(varType, typeAliases);
                            variableTypes.set(v, typeInfo.baseType);
                            if (typeInfo.elementType) {
                                variableElementTypes.set(v, typeInfo.elementType);
                            }
                        }
                    }
                }
            }
            continue;
        }

        // Variables par affectation — essayer de deviner le type
        const assignMatch = REGEX_ASSIGNMENT.exec(trimmed);
        if (assignMatch && i < cursorLine) {
            const varName = assignMatch[1];
            const rhs = trimmed.substring(trimmed.indexOf('←') + 1).trim();
            let guessedType = '';
            let guessedElemType = '';

            // 1. val(...) sur un conteneur dont l'élément est connu
            if (/^\s*val\s*\(/i.test(rhs)) {
                const inner = rhs.substring(rhs.indexOf('(') + 1, rhs.lastIndexOf(')')).trim();
                const idents = inner.match(/[\p{L}_][\p{L}0-9_]*/gu) || [];
                for (const id of idents) {
                    if (variableElementTypes.has(id)) {
                        guessedType = variableElementTypes.get(id)!;
                        break;
                    }
                }
            }
            // 2. Fonctions renvoyant un nœud : racine, fg, fd, pere
            else if (/^\s*(?:racine|fg|fd|pere)\s*\(/i.test(rhs)) {
                guessedType = 'noeud';
                const inner = rhs.substring(rhs.indexOf('(') + 1, rhs.lastIndexOf(')')).trim();
                const idents = inner.match(/[\p{L}_][\p{L}0-9_]*/gu) || [];
                for (const id of idents) {
                    if (variableElementTypes.has(id)) {
                        guessedElemType = variableElementTypes.get(id)!;
                        break;
                    }
                }
            }
            else if (/^\s*tableau\b/i.test(rhs)) guessedType = 'tableau';
            else if (/^\s*\[/i.test(rhs)) guessedType = 'tableau';
            else if (/^\s*listeVide\s*\(/i.test(rhs) || /^\s*Liste\s*\(/i.test(rhs) || /^\s*ajoutTeteListe\b/i.test(rhs)) guessedType = 'liste';
            else if (/^\s*pileVide\s*\(/i.test(rhs)) guessedType = 'pile';
            else if (/^\s*fileVide\s*\(/i.test(rhs)) guessedType = 'file';
            else if (/^\s*videLS\s*\(/i.test(rhs)) guessedType = 'listesym';
            else if (/^\s*tableVide\s*\(/i.test(rhs) || /^\s*Table\s*\(/i.test(rhs)) guessedType = 'table';
            else if (/^\s*fichierOuvrir\s*\(/i.test(rhs) || /^\s*fichierCr[ée]+r\s*\(/i.test(rhs)) guessedType = 'fichier';
            else if (/^\s*(abrVide|creerABR|créerABR|insertionABR)\s*\(/i.test(rhs)) guessedType = 'abr';
            else if (/^\s*(avlVide|creerAVL|créerAVL|insertionAVL)\s*\(/i.test(rhs)) guessedType = 'avl';
            else if (/^\s*(créerarb|creerarb)\s*\(/i.test(rhs)) guessedType = 'arbin';
            else if (/^\s*lire\s*\(/i.test(rhs)) guessedType = '';
            else if (/^"/.test(rhs) || /^\s*concat\s*\(/i.test(rhs)) guessedType = 'chaîne';
            else if (/^\d+$/.test(rhs)) guessedType = 'entier';
            else if (/^\d+[.,]\d+$/.test(rhs)) guessedType = 'réel';
            else if (/^(vrai|faux)$/i.test(rhs)) guessedType = 'booléen';

            variables.set(varName, guessedType);
            if (guessedType) variableTypes.set(varName, guessedType);
            if (guessedElemType) variableElementTypes.set(varName, guessedElemType);
        }

        // Variables déclarées avec `:` hors Lexique (inline)
        // Détecte: "x : entier" au milieu du code
        if (i < cursorLine && !funcMatch) {
            const inlineDecl = /^\s*([\p{L}_][\p{L}0-9_]*)\s*:\s*([\p{L}_][\p{L}0-9_]*(?:\s*[\p{L}_][\p{L}0-9_]*)?(?:\[.*?\])?|\([^)]*\))/u.exec(trimmed);
            if (inlineDecl && !/^\s*(Si|Pour|Tant|Sinon|Début|Fin|Algorithme|Fonction)\b/i.test(trimmed)) {
                const vName = inlineDecl[1];
                const vType = inlineDecl[2].trim();
                if (!variables.has(vName)) {
                    variables.set(vName, vType);
                    const typeInfo = parseTypeInfo(vType, typeAliases);
                    variableTypes.set(vName, typeInfo.baseType);
                    if (typeInfo.elementType) {
                        variableElementTypes.set(vName, typeInfo.elementType);
                    }
                }
            }
        }

        // Variables de boucle Pour
        const pourVar = extractPourLoopVar(trimmed);
        if (pourVar && i < cursorLine) {
            const isChaque = /^\s*Pour\s+chaque\b/i.test(trimmed);
            const varType = isChaque ? 'élément' : 'entier';
            variables.set(pourVar, varType);
            variableTypes.set(pourVar, varType);
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
        currentFunctionName, currentFunctionParams, variableTypes,
        variableElementTypes, typeAliases
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// RÉSOLUTION DE TYPE D'EXPRESSION ET PARSING AVANT POINT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extrait l'expression précédant le dernier point '.'
 * Gère correctement les parenthèses, crochets et identifiants imbriqués (ex: 'val(racine(phrase), phrase).', 'tab[i].', 'trad.')
 */
export function extractExprBeforeDot(textBeforeCursor: string): string {
    const dotIdx = textBeforeCursor.lastIndexOf('.');
    if (dotIdx === -1) return '';
    const text = textBeforeCursor.substring(0, dotIdx);
    let i = text.length - 1;
    while (i >= 0 && /\s/.test(text[i])) {
        i--;
    }
    const end = i;
    let parenDepth = 0;
    let bracketDepth = 0;
    while (i >= 0) {
        const char = text[i];
        if (char === ')') {
            parenDepth++;
            i--;
        } else if (char === '(') {
            if (parenDepth > 0) {
                parenDepth--;
                i--;
            } else {
                break;
            }
        } else if (char === ']') {
            bracketDepth++;
            i--;
        } else if (char === '[') {
            if (bracketDepth > 0) {
                bracketDepth--;
                i--;
            } else {
                break;
            }
        } else if (parenDepth > 0 || bracketDepth > 0) {
            i--;
        } else {
            // Hors parenthèses/crochets: accepter les caractères d'identifiants et le point '.'
            if (/[\p{L}0-9_.]/u.test(char)) {
                i--;
            } else {
                break;
            }
        }
    }
    return text.substring(i + 1, end + 1).trim();
}

/**
 * Résout le type effectif d'une expression pour l'autocomplétion par point
 * Renvoie un nom de type normalisé (ex: 'arbin', 'MotTraduction', 'noeud', 'liste', etc.)
 */
export function resolveExpressionType(expr: string, analysis: DocumentAnalysis): string | undefined {
    const trimmed = expr.trim();
    if (!trimmed) return undefined;

    // 1. Accès chaîné par point hors parenthèses / crochets (ex: 'personne.adresse')
    let lastDot = -1;
    let pDepth = 0;
    let bDepth = 0;
    for (let i = trimmed.length - 1; i >= 0; i--) {
        const c = trimmed[i];
        if (c === ')') pDepth++;
        else if (c === '(') pDepth--;
        else if (c === ']') bDepth++;
        else if (c === '[') bDepth--;
        else if (c === '.' && pDepth === 0 && bDepth === 0) {
            lastDot = i;
            break;
        }
    }
    if (lastDot !== -1) {
        const target = trimmed.substring(0, lastDot);
        const field = trimmed.substring(lastDot + 1);
        const targetType = resolveExpressionType(target, analysis);
        if (targetType) {
            const fields = analysis.compositeTypes.get(targetType) || analysis.compositeTypes.get(targetType.toLowerCase());
            if (fields) {
                const found = fields.find(f => f.name.toLowerCase() === field.toLowerCase());
                if (found) {
                    const info = parseTypeInfo(found.type, analysis.typeAliases);
                    return info.baseType;
                }
            }
        }
        return undefined;
    }

    // 2. Accès indicé de conteneur (ex: 'tab[i]')
    if (trimmed.endsWith(']')) {
        const openBracket = trimmed.lastIndexOf('[');
        if (openBracket !== -1) {
            const baseExpr = trimmed.substring(0, openBracket).trim();
            if (analysis.variableElementTypes.has(baseExpr)) {
                return analysis.variableElementTypes.get(baseExpr);
            }
            if (analysis.variableElementTypes.has(baseExpr.toLowerCase())) {
                return analysis.variableElementTypes.get(baseExpr.toLowerCase());
            }
            const baseType = resolveExpressionType(baseExpr, analysis);
            if (baseType) {
                const info = parseTypeInfo(baseType, analysis.typeAliases);
                return info.elementType || info.baseType;
            }
        }
    }

    // 3. Appel de fonction (ex: 'val(racine(phrase), phrase)' ou 'racine(phrase)')
    if (trimmed.endsWith(')')) {
        const openParen = trimmed.indexOf('(');
        if (openParen !== -1) {
            const funcName = trimmed.substring(0, openParen).trim();
            const funcLower = funcName.toLowerCase();
            const innerArgs = trimmed.substring(openParen + 1, trimmed.length - 1);

            // Cas spécial : 'val(arbre, noeud)' ou 'val(noeud, arbre)'
            // Renvoie le type d'élément stocké dans l'arbre / la liste
            if (funcLower === 'val') {
                const idents = innerArgs.match(/[\p{L}_][\p{L}0-9_]*/gu) || [];
                for (const id of idents) {
                    if (analysis.variableElementTypes.has(id)) {
                        return analysis.variableElementTypes.get(id);
                    }
                    if (analysis.variableElementTypes.has(id.toLowerCase())) {
                        return analysis.variableElementTypes.get(id.toLowerCase());
                    }
                }
                return undefined;
            }

            // Primitives arbin renvoyant un nœud
            if (funcLower === 'racine' || funcLower === 'fg' || funcLower === 'fd' || funcLower === 'pere') {
                return 'noeud';
            }

            if (funcLower === 'creerarb' || funcLower === 'créerarb') {
                return 'arbin';
            }

            if (funcLower === 'listevide' || funcLower === 'creerliste') {
                return 'liste';
            }

            if (funcLower === 'pilevide') return 'pile';
            if (funcLower === 'filevide') return 'file';
            if (funcLower === 'tablevide') return 'table';

            // Fonction utilisateur
            const userFunc = analysis.userFunctions.get(funcName);
            if (userFunc && userFunc.returnType) {
                const info = parseTypeInfo(userFunc.returnType, analysis.typeAliases);
                return info.baseType;
            }
        }
    }

    // 4. Identifiant simple (variable, paramètre, nom de type, alias)
    const varName = trimmed;
    if (analysis.variableTypes.has(varName)) {
        return analysis.variableTypes.get(varName);
    }
    if (analysis.variableTypes.has(varName.toLowerCase())) {
        return analysis.variableTypes.get(varName.toLowerCase());
    }

    if (analysis.variables.has(varName)) {
        const raw = analysis.variables.get(varName)!;
        const info = parseTypeInfo(raw, analysis.typeAliases);
        return info.baseType;
    }
    if (analysis.variables.has(varName.toLowerCase())) {
        const raw = analysis.variables.get(varName.toLowerCase())!;
        const info = parseTypeInfo(raw, analysis.typeAliases);
        return info.baseType;
    }

    if (analysis.compositeTypes.has(varName)) {
        return varName;
    }
    if (analysis.compositeTypes.has(varName.toLowerCase())) {
        return varName;
    }

    if (analysis.typeAliases.has(varName.toLowerCase())) {
        return analysis.typeAliases.get(varName.toLowerCase())!.baseType;
    }

    if (TYPE_METHODS[varName.toLowerCase()]) {
        return varName.toLowerCase();
    }

    return undefined;
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
        if (REGEX_AFTER_DOT.test(textBeforeCursor)) {
            const expr = extractExprBeforeDot(textBeforeCursor);
            return this.getDotCompletions(expr, analysis);
        }

        // ─── Contexte : ligne d'en-tête Fonction ou Procédure ───
        if (/^\s*(?:Fonction|Procédure)\b/iu.test(lineText)) {
            const lastColonIdx = textBeforeCursor.lastIndexOf(':');
            if (lastColonIdx !== -1) {
                const afterColon = textBeforeCursor.substring(lastColonIdx + 1);
                if (/^\s*[\p{L}_0-9]*$/u.test(afterColon)) {
                    return this.getTypeCompletions(analysis, textBeforeCursor);
                }
            }
            return [];
        }

        // ─── Contexte : ligne d'en-tête Algorithme ───
        if (/^\s*Algorithme\b/iu.test(lineText)) {
            return [];
        }

        // ─── Contexte : déclaration de type composite ───
        if (/^\s*[\p{L}_][\p{L}0-9_]*\s*=\s*</u.test(lineText)) {
            const lastColonIdx = textBeforeCursor.lastIndexOf(':');
            if (lastColonIdx !== -1) {
                const afterColon = textBeforeCursor.substring(lastColonIdx + 1);
                if (/^\s*[\p{L}_0-9]*$/u.test(afterColon)) {
                    return this.getTypeCompletions(analysis, textBeforeCursor);
                }
            }
            return [];
        }

        // ─── Contexte : après ':' ───
        if (/:\s*[\p{L}_0-9]*$/u.test(textBeforeCursor)) {
            const beforeColonPortion = textBeforeCursor.replace(/:\s*[\p{L}_0-9]*$/u, ':');
            // Après un mot-clé de bloc ("Alors :", "Faire :", "Sinon :", etc.) → AUCUNE complétion
            if (REGEX_KEYWORD_COLON_CONTEXT.test(beforeColonPortion)) {
                return [];
            }
            // Après une déclaration (variable, paramètre, retour de fonction, champ) → types
            if (TYPE_DECLARATION_COLON.test(beforeColonPortion)) {
                return this.getTypeCompletions(analysis, textBeforeCursor);
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
                (categoryLower === 'abr' && (typesInScope.has('abr') || typesInScope.has('arbin'))) ||
                (categoryLower === 'avl' && (typesInScope.has('avl') || typesInScope.has('abr') || typesInScope.has('arbin'))) ||
                (categoryLower === 'arbre binaire' && (typesInScope.has('arbin') || typesInScope.has('abr') || typesInScope.has('avl'))) ||
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
    private getDotCompletions(expr: string, analysis: DocumentAnalysis): vscode.CompletionItem[] {
        const items: vscode.CompletionItem[] = [];
        const resolvedType = resolveExpressionType(expr, analysis);
        const addedNames = new Set<string>();

        // 1. Champs de structure (si c'est un type composite personnalisé)
        if (resolvedType) {
            const fields = analysis.compositeTypes.get(resolvedType) || analysis.compositeTypes.get(resolvedType.toLowerCase());
            if (fields) {
                for (const field of fields) {
                    const item = new vscode.CompletionItem(field.name, vscode.CompletionItemKind.Field);
                    item.detail = `${field.type}  (champ de ${resolvedType})`;
                    item.documentation = new vscode.MarkdownString(`Champ \`${field.name}\` de type \`${field.type}\` dans \`${resolvedType}\``);
                    item.sortText = `0_${field.name}`;
                    items.push(item);
                    addedNames.add(field.name);
                }
            }
        }

        // 2. Méthodes du type (fonctions intégrées rattachées à ce type via targetType)
        if (resolvedType) {
            const key = resolvedType.toLowerCase();
            const methods = TYPE_METHODS[key];
            if (methods) {
                for (const method of methods) {
                    if (addedNames.has(method.name)) continue;
                    const item = new vscode.CompletionItem(method.name, vscode.CompletionItemKind.Method);
                    item.detail = method.signature;
                    item.documentation = new vscode.MarkdownString(
                        `**${key}** — ${method.description}\n\n\`\`\`psc\n${method.signature}\n\`\`\``
                    );
                    item.insertText = method.name;
                    item.sortText = `1_${method.name}`;
                    items.push(item);
                    addedNames.add(method.name);
                }
            }
        }

        // 3. Fallback : UNIQUEMENT si l'expression a un type totalement inconnu (ex: variable non déclarée)
        // Ne PAS proposer les champs si resolvedType est un type primitif (ex: arbin, entier, réel, chaîne...)
        if (items.length === 0 && !resolvedType) {
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
     * Complétions de types (après ':' dans une déclaration) — avec espace si nécessaire
     */
    private getTypeCompletions(analysis: DocumentAnalysis, textBeforeCursor?: string): vscode.CompletionItem[] {
        const items: vscode.CompletionItem[] = [];

        let prefix = ' ';
        if (textBeforeCursor) {
            const lastColonIdx = textBeforeCursor.lastIndexOf(':');
            if (lastColonIdx !== -1) {
                const afterColon = textBeforeCursor.substring(lastColonIdx + 1);
                if (/^\s/.test(afterColon)) {
                    prefix = '';
                }
            }
        }

        for (const type of BUILTIN_TYPES) {
            const item = new vscode.CompletionItem(type.label, vscode.CompletionItemKind.TypeParameter);
            item.detail = type.detail;
            item.sortText = `0_${type.label}`;
            if (type.label === 'tableau') {
                item.insertText = new vscode.SnippetString(`${prefix}tableau \${1:entier}[\${2:0}..\${3:n-1}]`);
            } else {
                item.insertText = new vscode.SnippetString(`${prefix}${type.label}`);
            }
            items.push(item);
        }

        for (const [typeName, fields] of analysis.compositeTypes) {
            if (typeName.charAt(0) === typeName.charAt(0).toLowerCase()) continue;
            const item = new vscode.CompletionItem(typeName, vscode.CompletionItemKind.Struct);
            const fieldStr = fields.map(f => `${f.name} : ${f.type}`).join(', ');
            item.detail = `<${fieldStr}>`;
            item.sortText = `1_${typeName}`;
            item.insertText = new vscode.SnippetString(`${prefix}${typeName}`);
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

export function isInCommentOrString(lineText: string, charPos: number): boolean {
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

/** Mots-clés et types du langage avec leur description pour le hover (dérivés automatiquement de PSC_DEFINITIONS) */
const KEYWORD_DOCS: Record<string, string> = {
    ...Object.fromEntries(
        PSC_DEFINITIONS.keywords
            .filter(k => k.description)
            .map(k => [k.name.toLowerCase(), k.description!])
    ),
    ...Object.fromEntries(
        PSC_DEFINITIONS.types
            .flatMap(t => t.aliases.map(alias => [alias.toLowerCase(), t.description || `**${t.name}** *(type)*`]))
    ),
    'fin_ligne': '**FIN_LIGNE** — Constante de fin de ligne (`\\n`)'
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
                md.appendMarkdown(`\n\n${builtin.description}`);
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
