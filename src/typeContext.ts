import { findMatchingParen, maskStrings } from './utils';

/** Distingue les noms de types des variables homonymes sur une ligne. */
export function isTypeOccurrence(line: string, position: number): boolean {
    const text = maskStrings(line);
    const alias = /^\s*(?:Soit\s+)?[\p{L}_][\p{L}0-9_]*\s*=\s*/iu.exec(text);
    if (alias) {
        const compositeStart = text.indexOf('<', alias[0].length);
        if (compositeStart === alias[0].length) {
            if (position < compositeStart) return true;
            return inTypedList(text, compositeStart + 1, text.lastIndexOf('>'), position);
        }
        return true;
    }
    const signature = /^\s*(?:Fonction|Procédure)\s+[\p{L}_][\p{L}0-9_]*\s*\(/iu.exec(text);
    if (signature) {
        const open = signature[0].length - 1;
        const close = findMatchingParen(text, open);
        if (position > open && (close < 0 || position < close)) {
            return inTypedList(text, open + 1, close < 0 ? text.length : close, position);
        }
        return close >= 0 && position > close && text.slice(close + 1, position).includes(':');
    }
    const declaration = /^\s*(?:Soit\s+)?[\p{L}_][\p{L}0-9_]*(?:\s*,\s*[\p{L}_][\p{L}0-9_]*)*\s*:\s*/iu.exec(text);
    return !!declaration && position >= declaration[0].length;
}

function inTypedList(text: string, start: number, end: number, position: number): boolean {
    if (position < start || position >= end) return false;
    let depth = 0;
    let inType = false;
    for (let i = start; i < position; i++) {
        const ch = text[i];
        if (ch === '(' || ch === '[' || ch === '<') depth++;
        else if (ch === ')' || ch === ']' || ch === '>') depth--;
        else if (depth === 0 && ch === ':') inType = true;
        else if (depth === 0 && ch === ',') inType = false;
    }
    return inType;
}
