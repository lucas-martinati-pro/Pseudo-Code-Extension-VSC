/**
 * Gestion des informations sur les fonctions déclarées (pour gérer les paramètres InOut)
 */

import { PATTERNS } from './constants';
import { extractFunctionParams, isSimpleIdentifier } from './utils';

export interface ParamInfo {
    name: string;
    isInOut: boolean;
    arrayStartIndex?: number;
}

export interface FunctionInfo {
    name: string;
    params: ParamInfo[];
    inOutParamNames: string[];
    /** Map de nom de paramètre tableau → indices de départ par dimension */
    arrayParamStartIndices: Map<string, Array<string | number>>;
    /** Map de nom de variable locale tableau → indices de départ par dimension */
    arrayLocalStartIndices: Map<string, Array<string | number>>;
    /** Variables locales déclarées ou assignées dans le corps de la fonction */
    localVars: string[];
}

/**
 * Registre global des fonctions
 */
export class FunctionRegistry {
    private functions = new Map<string, FunctionInfo>();

    /**
     * Collecte toutes les fonctions du code source
     */
    collect(pscCode: string): void {
        this.functions.clear();
        const lines = pscCode.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const match = PATTERNS.FUNCTION_DECLARATION.exec(line);
            if (match) {
                const name = match[1];
                const paramsString = match[2];
                const params = extractFunctionParams(paramsString);
                const inOutParamNames = params
                    .filter(p => p.isInOut)
                    .map(p => p.name);

                // Collecter les indices de départ des paramètres tableau
                const arrayParamStartIndices = new Map<string, Array<string | number>>();
                for (const p of params) {
                    if (p.arrayStartIndices !== undefined && p.arrayStartIndices.length > 0) {
                        arrayParamStartIndices.set(p.name, p.arrayStartIndices);
                    } else if (p.arrayStartIndex !== undefined) {
                        arrayParamStartIndices.set(p.name, [p.arrayStartIndex]);
                    }
                }

                // Collecter les lignes du corps de la fonction jusqu'à son 'Fin'
                const bodyLines: string[] = [];
                let depth = 0;
                for (let j = i + 1; j < lines.length; j++) {
                    const bodyLine = lines[j].replace(/\/\/.*/, '').trim();
                    if (/^\s*Début\b/i.test(bodyLine)) {
                        depth++;
                        continue;
                    }
                    if (/^\s*(?:Fonction|Algorithme)\b/i.test(bodyLine)) {
                        break;
                    }
                    if (/^\s*Fin\b/i.test(bodyLine)) {
                        if (depth > 0) depth--;
                        if (depth === 0) break;
                        continue;
                    }
                    bodyLines.push(lines[j]);
                }

                const paramNames = params.map(p => p.name);
                const localVars = this.extractLocalVarsFromBody(bodyLines, paramNames);

                this.functions.set(name, {
                    name,
                    params,
                    inOutParamNames,
                    arrayParamStartIndices,
                    arrayLocalStartIndices: new Map<string, Array<string | number>>(),
                    localVars
                });
            }
        }
    }

    /**
     * Extrait les variables locales d'un corps de fonction
     */
    private extractLocalVarsFromBody(bodyLines: string[], paramNames: string[]): string[] {
        const localVars = new Set<string>();
        const paramSet = new Set(paramNames);

        const REGEX_ASSIGN = /^\s*([\p{L}_][\p{L}0-9_]*)(?:\[[^\]]*\]|\.[\p{L}_][\p{L}0-9_]*)*\s*(?:←|<-)/u;
        const REGEX_POUR = /^\s*Pour\s+([\p{L}_][\p{L}0-9_]*)\s+(?:allant\s+)?de\b/iu;
        const REGEX_POUR_TABLE = /^\s*Pour\s+([\p{L}_][\p{L}0-9_]*)\s+de\s+[\p{L}_][\p{L}0-9_]*\s+Faire\b/iu;
        const REGEX_DECL = /^\s*([\p{L}_][\p{L}0-9_]*(?:\s*,\s*[\p{L}_][\p{L}0-9_]*)*)\s*:\s*(?:entier|r[eé]el|bool[eé]en|cha[iî]ne|caract[eè]re|tableau|liste|pile|file|table|[\p{L}_][\p{L}0-9_]*)/iu;
        const REGEX_ARRAY_DECL = /^\s*([\p{L}_][\p{L}0-9_]*)\s*(?:=|\u2190|<-)\s*tableau\b/iu;

        const RESERVED = new Set([
            'si', 'sinon', 'fsi', 'pour', 'fpour', 'tant', 'ftq', 'ftant', 'début', 'debut', 'fin',
            'retourner', 'retourne', 'alors', 'faire', 'vrai', 'faux', 'nil', 'et', 'ou', 'non', 'mod',
            'écrire', 'ecrire', 'lire', 'inout', 'fin_ligne'
        ]);

        for (const line of bodyLines) {
            const cleanLine = line.replace(/\/\/.*/, '').trim();
            if (!cleanLine) continue;

            const assignMatch = REGEX_ASSIGN.exec(cleanLine);
            if (assignMatch) {
                const varName = assignMatch[1];
                if (!paramSet.has(varName) && !RESERVED.has(varName.toLowerCase())) {
                    localVars.add(varName);
                }
            }

            const arrMatch = REGEX_ARRAY_DECL.exec(cleanLine);
            if (arrMatch) {
                const varName = arrMatch[1];
                if (!paramSet.has(varName) && !RESERVED.has(varName.toLowerCase())) {
                    localVars.add(varName);
                }
            }

            const pourMatch = REGEX_POUR.exec(cleanLine) || REGEX_POUR_TABLE.exec(cleanLine);
            if (pourMatch) {
                const varName = pourMatch[1];
                if (!paramSet.has(varName) && !RESERVED.has(varName.toLowerCase())) {
                    localVars.add(varName);
                }
            }

            const declMatch = REGEX_DECL.exec(cleanLine);
            if (declMatch && !/^\s*(?:Si|Pour|Tant|Sinon|Fonction|Algorithme)\b/i.test(cleanLine)) {
                const names = declMatch[1].split(',').map(s => s.trim());
                for (const name of names) {
                    if (name && !paramSet.has(name) && !RESERVED.has(name.toLowerCase())) {
                        localVars.add(name);
                    }
                }
            }
        }

        return Array.from(localVars).sort();
    }

    /**
     * Récupère les informations d'une fonction
     */
    get(functionName: string): FunctionInfo | undefined {
        return this.functions.get(functionName);
    }

    /**
     * Vérifie si une fonction existe
     */
    has(functionName: string): boolean {
        return this.functions.has(functionName);
    }

    /**
     * Récupère les arguments InOut à réassigner lors d'un appel de fonction
     */
    getInOutArgsToReassign(functionName: string, callArgs: string[]): string[] {
        const funcInfo = this.get(functionName);
        if (!funcInfo) return [];

        const argsToReassign: string[] = [];
        funcInfo.params.forEach((param, index) => {
            if (param.isInOut && callArgs[index]) {
                const arg = callArgs[index].trim();
                // S'assurer que c'est un identifiant simple
                if (isSimpleIdentifier(arg)) {
                    argsToReassign.push(arg);
                }
            }
        });

        return argsToReassign;
    }

    /**
     * Retourne tous les noms de fonctions
     */
    getAllFunctionNames(): Set<string> {
        return new Set(this.functions.keys());
    }
}
