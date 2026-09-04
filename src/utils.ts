/**
 * Fonctions utilitaires réutilisables
 */

import { TYPE_MAPPING } from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// REGEX PRÉ-COMPILÉES (éviter la recompilation à chaque appel)
// ═══════════════════════════════════════════════════════════════════════════════
const REGEX_DOUBLE_QUOTES = /"[^"]*"/g;
const REGEX_SINGLE_QUOTES = /'(?:\\.|[^\\'])'/g;
const REGEX_FIELD_ACCESS = /([\p{L}_][\p{L}0-9_]*)\.([\p{L}_][\p{L}0-9_]*)/gu;
const REGEX_BRACKET_FIELD_ACCESS = /(\])\.([\p{L}_][\p{L}0-9_]*)/gu;
const REGEX_DOT_FIELD = /\.[\p{L}_][\p{L}0-9_]*/gu;
const REGEX_SIMPLE_IDENTIFIER = /^[\p{L}_][\p{L}0-9_]*$/u;
const REGEX_INOUT = /\bInOut\b/i;

const OPEN_BRACKETS = new Set(['(', '[', '{']);
const CLOSE_BRACKETS = new Set([')', ']', '}']);

/**
 * Normalise un type (gère les variantes avec/sans accent)
 */
export function normalizeType(rawType: string): string {
    return TYPE_MAPPING[rawType.toLowerCase()] || rawType;
}

/**
 * Découpe intelligemment une chaîne d'arguments en tenant compte des parenthèses, crochets et quotes
 */
export function smartSplitArgs(argsStr: string): string[] {
    const trimmed = argsStr.trim();
    if (!trimmed) return [];

    const args: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';
    const len = argsStr.length;

    for (let i = 0; i < len; i++) {
        const char = argsStr[i];

        if (!inString) {
            if (char === '"' || char === "'") {
                inString = true;
                stringChar = char;
                current += char;
            } else if (OPEN_BRACKETS.has(char)) {
                depth++;
                current += char;
            } else if (CLOSE_BRACKETS.has(char)) {
                depth--;
                current += char;
            } else if (char === ',' && depth === 0) {
                args.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        } else {
            current += char;
            if (char === stringChar && argsStr[i - 1] !== '\\') {
                inString = false;
            }
        }
    }

    const final = current.trim();
    if (final) {
        args.push(final);
    }

    return args;
}

/**
 * Trouve la parenthèse fermante correspondante
 * OPTIMISÉ: Boucle simple sans regex
 */
export function findMatchingParen(str: string, startPos: number): number {
    let depth = 1;
    const len = str.length;
    for (let i = startPos + 1; i < len; i++) {
        const c = str[i];
        if (c === '(') depth++;
        else if (c === ')') {
            if (--depth === 0) return i;
        }
    }
    return -1;
}

/**
 * Nettoie une ligne des commentaires
 * OPTIMISÉ: Algorithme simplifié avec indexOf
 */
export function cleanLineFromComments(lineText: string, initialInBlockComment: boolean): { text: string; inBlockComment: boolean } {
    let currentIndex = 0;
    let inBlockComment = initialInBlockComment;

    // Gestion du commentaire bloc en cours
    if (inBlockComment) {
        const endCommentIndex = lineText.indexOf('*/');
        if (endCommentIndex !== -1) {
            inBlockComment = false;
            currentIndex = endCommentIndex + 2;
        } else {
            return { text: '', inBlockComment: true };
        }
    }

    // Cas simple: pas de commentaire dans la ligne restante
    const startBlockIndex = lineText.indexOf('/*', currentIndex);
    const startLineIndex = lineText.indexOf('//', currentIndex);

    if (startBlockIndex === -1 && startLineIndex === -1) {
        return { text: lineText.substring(currentIndex), inBlockComment: false };
    }

    // Construction du résultat
    let result = '';

    while (currentIndex < lineText.length) {
        const blockIdx = lineText.indexOf('/*', currentIndex);
        const lineIdx = lineText.indexOf('//', currentIndex);

        if (blockIdx !== -1 && (lineIdx === -1 || blockIdx < lineIdx)) {
            result += lineText.substring(currentIndex, blockIdx);
            const endBlockIdx = lineText.indexOf('*/', blockIdx + 2);
            if (endBlockIdx !== -1) {
                currentIndex = endBlockIdx + 2;
            } else {
                return { text: result, inBlockComment: true };
            }
        } else if (lineIdx !== -1) {
            result += lineText.substring(currentIndex, lineIdx);
            return { text: result, inBlockComment: false };
        } else {
            result += lineText.substring(currentIndex);
            break;
        }
    }

    return { text: result, inBlockComment };
}

/**
 * Supprime les strings d'une expression pour éviter de les analyser
 * OPTIMISÉ: Utilise des regex pré-compilées
 */
export function maskStrings(text: string): string {
    // Reset lastIndex pour les regex globales
    REGEX_DOUBLE_QUOTES.lastIndex = 0;
    REGEX_SINGLE_QUOTES.lastIndex = 0;

    return text
        .replace(REGEX_DOUBLE_QUOTES, match => ' '.repeat(match.length))
        .replace(REGEX_SINGLE_QUOTES, match => ' '.repeat(match.length));
}

/**
 * Protège les chaînes de caractères d'une ligne avant la transpilation
 * en les remplaçant par des marqueurs temporaires __PSC_STR_n__
 */
export function protectStrings(text: string): { text: string; strings: string[] } {
    const strings: string[] = [];
    const protectedText = text.replace(/"(?:\\.|[^\\"])*"|'(?:\\.|[^\\'])*'/g, (m) => {
        const id = strings.length;
        strings.push(m);
        return `__PSC_STR_${id}__`;
    });
    return { text: protectedText, strings };
}

/**
 * Restaure les chaînes de caractères protégées après les remplacements
 */
export function restoreStrings(text: string, strings: string[]): string {
    if (strings.length === 0) return text;
    return text.replace(/__PSC_STR_(\d+)__/g, (_, id) => strings[parseInt(id, 10)] ?? '');
}

/**
 * Supprime les accès aux champs (obj.field) pour ne garder que les variables de base
 * OPTIMISÉ: Limite le nombre d'itérations et utilise des regex pré-compilées
 */
export function maskFieldAccess(text: string): string {
    let result = text;
    let maxIterations = 10; // Éviter les boucles infinies

    while (maxIterations-- > 0) {
        const before = result;

        // Reset lastIndex pour les regex globales
        REGEX_FIELD_ACCESS.lastIndex = 0;
        REGEX_BRACKET_FIELD_ACCESS.lastIndex = 0;
        REGEX_DOT_FIELD.lastIndex = 0;

        // Remplacer variable.champ
        result = result.replace(REGEX_FIELD_ACCESS,
            (_, base, field) => base + ' '.repeat(field.length + 1));

        // Remplacer ].champ
        result = result.replace(REGEX_BRACKET_FIELD_ACCESS,
            (_, bracket, field) => bracket + ' '.repeat(field.length + 1));

        // Supprimer .champ restants
        result = result.replace(REGEX_DOT_FIELD,
            match => ' '.repeat(match.length));

        if (before === result) break;
    }

    return result;
}

/**
 * Vérifie si un identifiant est simple (pas d'index ou d'accès aux champs)
 */
export function isSimpleIdentifier(identifier: string): boolean {
    return REGEX_SIMPLE_IDENTIFIER.test(identifier);
}

const REGEX_POUR_VAR = /^\s*Pour\s+([\p{L}_][\p{L}0-9_]*)/iu;

/**
 * Extrait le nom de la variable d'itération d'une boucle Pour.
 * Supporte : 'Pour i de ...', 'Pour i allant de ...', 'Pour elem de tab Faire'
 */
export function extractPourLoopVar(lineText: string): string | undefined {
    const match = REGEX_POUR_VAR.exec(lineText);
    return match ? match[1] : undefined;
}

/**
 * Découpe une chaîne de paramètres ou de champs par virgule tout en respectant
 * l'imbrication des parenthèses (), crochets [] et chevrons <> (types composites).
 */
export function smartSplitParams(paramsStr: string): string[] {
    if (!paramsStr || !paramsStr.trim()) return [];
    const results: string[] = [];
    let current = '';
    let parenDepth = 0;
    let bracketDepth = 0;
    let chevronDepth = 0;

    for (let i = 0; i < paramsStr.length; i++) {
        const char = paramsStr[i];
        if (char === '(') parenDepth++;
        else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
        else if (char === '[') bracketDepth++;
        else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
        else if (char === '<') chevronDepth++;
        else if (char === '>') chevronDepth = Math.max(0, chevronDepth - 1);
        else if (char === ',' && parenDepth === 0 && bracketDepth === 0 && chevronDepth === 0) {
            results.push(current.trim());
            current = '';
            continue;
        }
        current += char;
    }
    if (current.trim()) {
        results.push(current.trim());
    }
    return results;
}

/**
 * Parse les champs d'un type composite : 'champ1 : type1, champ2 : type2'
 */
export function parseCompositeFields(fieldsStr: string): Array<{ name: string; type: string }> {
    if (!fieldsStr || !fieldsStr.trim()) return [];
    const parts = smartSplitParams(fieldsStr);
    const fields: Array<{ name: string; type: string }> = [];

    for (const part of parts) {
        const colonIdx = part.indexOf(':');
        if (colonIdx !== -1) {
            const name = part.substring(0, colonIdx).trim();
            const type = part.substring(colonIdx + 1).trim();
            if (name) {
                fields.push({ name, type });
            }
        }
    }

    return fields;
}

export interface FunctionParamInfo {
    name: string;
    type: string;
    isInOut: boolean;
    arrayStartIndex?: number;
    arrayStartIndices?: Array<string | number>;
}

/**
 * Extrait les paramètres d'une signature de fonction
 * OPTIMISÉ: Boucle for-of et regex pré-compilée
 * Détecte aussi les indices de départ de tableaux dans la syntaxe: tableau type[x .. ...]
 */
export function extractFunctionParams(paramsString: string): FunctionParamInfo[] {
    const trimmed = paramsString.trim();
    if (!trimmed) return [];

    // Trouver la parenthèse fermante
    let depth = 0;
    let endOfParams = -1;
    const len = paramsString.length;

    for (let i = 0; i < len; i++) {
        const c = paramsString[i];
        if (c === '(') depth++;
        else if (c === ')') {
            if (--depth < 0) {
                endOfParams = i;
                break;
            }
        }
    }

    const paramStr = endOfParams !== -1 ? paramsString.substring(0, endOfParams) : paramsString;
    const parts = smartSplitParams(paramStr);
    const params: FunctionParamInfo[] = [];

    for (const part of parts) {
        const colonIdx = part.indexOf(':');
        const namePart = colonIdx !== -1 ? part.substring(0, colonIdx).trim() : part.trim();
        const typePart = colonIdx !== -1 ? part.substring(colonIdx + 1).trim() : '';
        const isInOut = REGEX_INOUT.test(namePart);
        const name = namePart.replace(REGEX_INOUT, '').trim();

        // Détecter les indices de départ pour les paramètres tableau
        // Syntaxe: tableau type[lo1 .. hi1, lo2 .. hi2, ...]
        let arrayStartIndex: number | undefined;
        let arrayStartIndices: Array<string | number> | undefined;
        if (typePart) {
            const arrayMatch = /\btableau\b.*\[([^\]]+)\]/i.exec(typePart);
            if (arrayMatch) {
                const dims = smartSplitArgs(arrayMatch[1]);
                arrayStartIndices = dims.map(d => {
                    const m = d.match(/^\s*(.+?)\s*\.\./);
                    const lo = m ? m[1].trim() : '0';
                    return /^-?\d+$/.test(lo) ? parseInt(lo, 10) : lo;
                });
                if (arrayStartIndices.length > 0 && typeof arrayStartIndices[0] === 'number') {
                    arrayStartIndex = arrayStartIndices[0];
                }
            }
        }

        if (name) {
            params.push({ name, type: typePart, isInOut, arrayStartIndex, arrayStartIndices });
        }
    }

    return params;
}

