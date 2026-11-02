import { PSC_DEFINITIONS } from './definitions';
import { extractFunctionParams, findMatchingParen, maskStrings, parseCompositeFields } from './utils';

export interface FunctionSignature {
    params: ReturnType<typeof extractFunctionParams>;
    returnType: string;
}

/** Types connus du document ; un type inconnu ne produit pas d'erreur spéculative. */
export class DiagnosticTypes {
    readonly functions = new Map<string, FunctionSignature>();
    readonly aliases = new Map<string, string>();
    readonly composites = new Map<string, ReturnType<typeof parseCompositeFields>>();
    readonly scopes: Map<string, string>[] = [new Map()];

    normalize(type: string, seen = new Set<string>()): string {
        const name = type.trim().toLowerCase();
        if (seen.has(name)) return name;
        const alias = this.aliases.get(name);
        if (alias) {
            seen.add(name);
            return this.normalize(alias, seen);
        }
        const builtin = PSC_DEFINITIONS.types.find(t => t.aliases.includes(name));
        if (builtin) return builtin.name;
        // Conserver les types d'éléments des conteneurs, normaliser leurs alias.
        const container = /^([\p{L}_][\p{L}0-9_]*)\s*[([]\s*(.+)\s*[)\]]$/u.exec(name);
        if (container) return `${this.normalize(container[1], new Set(seen))}(${this.normalize(container[2], new Set(seen))})`;
        return name;
    }

    compatible(actual: string, expected: string): boolean {
        const a = this.normalize(actual);
        const e = this.normalize(expected);
        return a === e || (a === 'entier' && e === 'réel');
    }

    infer(expression: string): string | undefined {
        const text = expression.trim();
        if (!text) return undefined;
        if (text.startsWith('(') && findMatchingParen(maskStrings(text), 0) === text.length - 1) {
            return this.infer(text.slice(1, -1));
        }
        if (/^"(?:[^"\\]|\\.)*"$/u.test(text)) return 'chaîne';
        if (/^'(?:[^'\\]|\\.)'$/u.test(text)) return 'caractère';
        if (/^[+-]?\d+$/u.test(text)) return 'entier';
        if (/^[+-]?\d+\.\d+$/u.test(text)) return 'réel';
        if (/^(vrai|faux)$/iu.test(text)) return 'booléen';
        if (/^[\p{L}_][\p{L}0-9_]*$/u.test(text)) {
            for (let i = this.scopes.length - 1; i >= 0; i--) {
                if (this.scopes[i].has(text)) return this.scopes[i].get(text) || undefined;
            }
        }
        const call = /^([\p{L}_][\p{L}0-9_]*)\s*\(/u.exec(text);
        if (call && findMatchingParen(maskStrings(text), text.indexOf('(')) === text.length - 1) {
            const signature = this.functions.get(call[1]);
            if (signature) return signature.returnType || undefined;
            const builtin = PSC_DEFINITIONS.functions.find(f => f.name.toLowerCase() === call[1].toLowerCase());
            // Les signatures des primitives peuvent contenir des types génériques :
            // n'inférer que les types concrets déclarés dans le registre.
            const returnType = builtin?.signature?.match(/\)\s*:\s*([^:]+)$/u)?.[1].trim();
            if (returnType && PSC_DEFINITIONS.types.some(t => t.aliases.includes(returnType.toLowerCase()))) return returnType;
        }
        const field = /^(.*)\.([\p{L}_][\p{L}0-9_]*)$/u.exec(text);
        if (field) {
            const owner = this.infer(field[1]);
            if (owner) return this.composites.get(this.normalize(owner))?.find(f => f.name === field[2])?.type;
        }
        const indexed = /^([\p{L}_][\p{L}0-9_]*)\s*\[.*\]$/u.exec(text);
        if (indexed) {
            const owner = this.infer(indexed[1]);
            if (owner) {
                const normalized = this.normalize(owner);
                return /^tableau\s+(.+?)\s*\[/u.exec(normalized)?.[1] || /^(?:tableau|liste)\((.+)\)$/u.exec(normalized)?.[1];
            }
        }
        return undefined;
    }
}
