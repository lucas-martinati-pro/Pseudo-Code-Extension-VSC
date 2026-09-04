import * as vscode from 'vscode';
import { KNOWN_IDENTIFIERS_LOWER, PATTERNS, BUILTIN_FUNCTION_ARITY } from './constants';
import { cleanLineFromComments, maskStrings, maskFieldAccess, smartSplitArgs, findMatchingParen, extractFunctionParams, extractPourLoopVar } from './utils';
import { BlockDefinition, findOpeningBlock, findClosingBlock } from './blocks';

// ═══════════════════════════════════════════════════════════════════════════════
// REGEX PRÉ-COMPILÉES (éviter la recompilation à chaque ligne)
// ═══════════════════════════════════════════════════════════════════════════════
const REGEX_IDENTIFIER_START = /^([\p{L}_][\p{L}0-9_]*)/u;
const REGEX_NUMBER = /^\d+(\.\d+)?$/;
const REGEX_IDENT_CHAR = /[\p{L}_]/u;
const REGEX_IDENT_CHAR_FULL = /[\p{L}0-9_]/u;
const REGEX_IDENTIFIER_EXTRACT = /^[\p{L}_][\p{L}0-9_]*/u;
const REGEX_WHITESPACE = /\s/;

const REGEX_LEXIQUE_LINE = /^\s*Lexique\s*:?\s*$/i;
const REGEX_VAR_DECL_IN_LEXIQUE = /^\s*([\p{L}_][\p{L}0-9_]*(?:\s*,\s*[\p{L}_][\p{L}0-9_]*)*)\s*:\s*.+/iu;

// Informations sur les blocs ouverts
interface BlockInfo {
    block: BlockDefinition;
    lineNumber: number;
    lineText: string;
}

/**
 * Cœur du Linter avec gestion de la portée lexicale, déclaration implicite et vérification des blocs.
 */
export function refreshDiagnostics(doc: vscode.TextDocument, collection: vscode.DiagnosticCollection): void {
    if (doc.languageId !== 'psc') {
        return;
    }

    const diagnostics: vscode.Diagnostic[] = [];
    const scopeStack: Set<string>[] = [new Set()];

    const declaredFunctions = new Set<string>();
    const declaredCompositeTypes = new Set<string>();

    // ═══════════════════════════════════════════════════════════════════════════
    // PASSE 1 : Collecter les fonctions, types composites et variables du Lexique
    // ═══════════════════════════════════════════════════════════════════════════
    const lineCount = doc.lineCount;
    let inLexiqueBlock = false;

    for (let i = 0; i < lineCount; i++) {
        const lineText = doc.lineAt(i).text;
        const trimmed = lineText.trim();
        if (!trimmed) continue;

        // Détection fonction (regex pré-compilée)
        const funcMatch = PATTERNS.FUNCTION_DECLARATION.exec(trimmed);
        if (funcMatch) {
            declaredFunctions.add(funcMatch[1]);
            inLexiqueBlock = false;
            continue;
        }

        // Détection type composite
        const typeMatch = PATTERNS.COMPOSITE_TYPE.exec(trimmed);
        if (typeMatch) {
            declaredCompositeTypes.add(typeMatch[1].toLowerCase());
            continue;
        }

        // Détection du début d'un bloc Lexique
        if (REGEX_LEXIQUE_LINE.test(trimmed)) {
            inLexiqueBlock = true;
            continue;
        }

        // Sortie du bloc Lexique (un mot-clé structurel met fin au Lexique)
        if (inLexiqueBlock) {
            if (/^\s*d[ée]but\b/i.test(trimmed) || /^\s*(Algorithme|Fonction)\b/i.test(trimmed) || /^\s*Fin\b/i.test(trimmed)) {
                inLexiqueBlock = false;
            } else {
                // Parser les déclarations de variables dans le Lexique
                const varDecl = REGEX_VAR_DECL_IN_LEXIQUE.exec(trimmed);
                if (varDecl) {
                    const varNames = varDecl[1].split(',').map(v => v.trim());
                    for (const v of varNames) {
                        if (v) {
                            scopeStack[0].add(v); // Ajouter au scope global
                        }
                    }
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PASSE 2 : Analyse avec contexte de portées et vérification des blocs
    // ═══════════════════════════════════════════════════════════════════════════
    let inBlockComment = false;
    const blockStack: BlockInfo[] = [];

    for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
        const line = doc.lineAt(lineIndex);
        const nonCommentText = cleanLineFromComments(line.text, inBlockComment);
        const trimmedText = nonCommentText.text.trim();
        inBlockComment = nonCommentText.inBlockComment;

        if (trimmedText === '' || /^\s*Algorithme\b/i.test(trimmedText) || /^\s*Lexique\b/i.test(trimmedText)) continue;

        // Ignorer les déclarations de types composites
        if (PATTERNS.COMPOSITE_TYPE.test(trimmedText)) continue;

        // ─── Détection des blocs ouvrants ───
        const openingBlock = findOpeningBlock(trimmedText);
        const funcMatch = PATTERNS.FUNCTION_DECLARATION.exec(trimmedText);
        const pourVar = extractPourLoopVar(trimmedText);

        // Suivi des blocs ouvrants
        if (openingBlock) {
            blockStack.push({ block: openingBlock, lineNumber: lineIndex, lineText: trimmedText });
        }

        // ─── Détection des blocs fermants avec recherche intelligente (search-and-recover) ───
        const closeBlock = (closingKeyword: string, expectedBlock: BlockDefinition, closingLineIndex: number, closingText: string) => {
            if (blockStack.length === 0) {
                // Aucun bloc ouvert → fermant orphelin
                const range = new vscode.Range(closingLineIndex, 0, closingLineIndex, closingText.length);
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    `'${closingKeyword}' inattendu : aucun bloc '${expectedBlock.name}' ouvert.`,
                    vscode.DiagnosticSeverity.Error
                ));
                return;
            }

            const lastBlock = blockStack[blockStack.length - 1];
            if (lastBlock.block.id === expectedBlock.id) {
                // Cas normal : le sommet correspond → pop
                blockStack.pop();
                return;
            }

            // Le sommet ne correspond pas → chercher l'ouvrant correspondant plus bas dans la pile
            let matchIndex = -1;
            for (let k = blockStack.length - 1; k >= 0; k--) {
                if (blockStack[k].block.id === expectedBlock.id) {
                    matchIndex = k;
                    break;
                }
            }

            if (matchIndex !== -1) {
                // Trouvé ! Les blocs au-dessus sont non fermés → signaler chacun sur sa ligne d'ouverture
                for (let k = blockStack.length - 1; k > matchIndex; k--) {
                    const unclosed = blockStack[k];
                    const unclosedLine = doc.lineAt(unclosed.lineNumber);
                    const range = new vscode.Range(unclosed.lineNumber, 0, unclosed.lineNumber, unclosedLine.text.length);
                    diagnostics.push(new vscode.Diagnostic(
                        range,
                        `Bloc '${unclosed.block.name}' non fermé. Il manque un '${unclosed.block.expectedClosing}'.`,
                        vscode.DiagnosticSeverity.Error
                    ));
                }
                // Pop tous les blocs du sommet jusqu'à (et y compris) le match
                blockStack.splice(matchIndex);
            } else {
                // Pas trouvé du tout → le fermant est orphelin
                const range = new vscode.Range(closingLineIndex, 0, closingLineIndex, closingText.length);
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    `'${closingKeyword}' inattendu : aucun bloc '${expectedBlock.name}' ouvert.`,
                    vscode.DiagnosticSeverity.Error
                ));
            }
        };

        const closingMatch = findClosingBlock(trimmedText);
        if (closingMatch) {
            closeBlock(closingMatch.keyword, closingMatch.block, lineIndex, trimmedText);
        }

        // ─── Gestion des portées (scope) ───
        if (openingBlock || funcMatch || pourVar) {
            const newScope = new Set<string>();
            if (funcMatch) {
                const params = extractFunctionParams(funcMatch[2]);
                for (const p of params) {
                    newScope.add(p.name);
                }
            }
            if (pourVar) {
                newScope.add(pourVar);
            }
            scopeStack.push(newScope);
        }

        const declarationMatch = PATTERNS.VARIABLE_DECLARATION.exec(trimmedText);
        
        // Détecter les affectations (←, <-, =)
        let assignMatch = trimmedText.match(/^([\p{L}_][\p{L}0-9_]*(?:\s*\[[^\]]*\])?(?:\.[\p{L}_][\p{L}0-9_]*)*)\s*(?:←|<-)\s*(.+)$/u);
        if (!assignMatch && !openingBlock && !PATTERNS.FUNCTION_DECLARATION.test(trimmedText)) {
            assignMatch = trimmedText.match(/^([\p{L}_][\p{L}0-9_]*(?:\s*\[[^\]]*\])?(?:\.[\p{L}_][\p{L}0-9_]*)*)\s*=\s*([^=].*)$/u);
        }

        if (declarationMatch && !PATTERNS.FUNCTION_DECLARATION.test(trimmedText) && !assignMatch) {
            const varNames = declarationMatch[1].split(',');
            const currentScope = scopeStack[scopeStack.length - 1];
            for (const v of varNames) {
                const trimmed = v.trim();
                if (trimmed) currentScope.add(trimmed);
            }
        } else if (assignMatch) {
            const lhsText = assignMatch[1].trim();
            const rhsText = assignMatch[2].trim();
            checkVariablesInExpression(rhsText, scopeStack, declaredFunctions, declaredCompositeTypes, line, diagnostics);
            checkFunctionCallsInExpression(rhsText, declaredFunctions, declaredCompositeTypes, line, diagnostics);

            const lhsVarMatch = REGEX_IDENTIFIER_START.exec(lhsText);
            if (lhsVarMatch) {
                scopeStack[scopeStack.length - 1].add(lhsVarMatch[1]);
                const lhsIndexVars = lhsText.substring(lhsVarMatch[0].length);
                checkVariablesInExpression(lhsIndexVars, scopeStack, declaredFunctions, declaredCompositeTypes, line, diagnostics);
            }
        } else {
            checkVariablesInExpression(trimmedText, scopeStack, declaredFunctions, declaredCompositeTypes, line, diagnostics);
            checkFunctionCallsInExpression(trimmedText, declaredFunctions, declaredCompositeTypes, line, diagnostics);
        }

        if (PATTERNS.CLOSING_KEYWORDS.test(trimmedText) && scopeStack.length > 1) {
            scopeStack.pop();
        }
    }

    // ─── Blocs non fermés à la fin du fichier ───
    for (const unclosed of blockStack) {
        const line = doc.lineAt(unclosed.lineNumber);
        const range = new vscode.Range(unclosed.lineNumber, 0, unclosed.lineNumber, line.text.length);
        diagnostics.push(new vscode.Diagnostic(
            range,
            `Bloc '${unclosed.block.name}' non fermé. Il manque un '${unclosed.block.expectedClosing}'.`,
            vscode.DiagnosticSeverity.Error
        ));
    }

    collection.set(doc.uri, diagnostics);
}

/**
 * Vérifie tous les identifiants dans une expression donnée.
 * OPTIMISÉ: Utilise des regex pré-compilées et des lookups Set.
 */
function checkVariablesInExpression(
    expression: string,
    scopeStack: Set<string>[],
    declaredFunctions: Set<string>,
    declaredCompositeTypes: Set<string>,
    line: vscode.TextLine,
    diagnostics: vscode.Diagnostic[]
): void {
    // Masquer les strings et les accès aux champs
    let textToCheck = maskStrings(expression);
    textToCheck = maskFieldAccess(textToCheck);

    const regex = PATTERNS.WORD_BOUNDARY_IDENTIFIER;

    const expressionOffsetInLine = line.text.indexOf(expression);
    if (expressionOffsetInLine === -1) return;

    let match;
    while ((match = regex.exec(textToCheck)) !== null) {
        const variable = match[0];
        const indexInExpression = match.index;
        const lowerVar = variable.toLowerCase();

        // OPTIMISÉ: Vérifications avec Sets pré-calculés
        if (KNOWN_IDENTIFIERS_LOWER.has(lowerVar) ||
            declaredFunctions.has(variable) ||
            declaredCompositeTypes.has(lowerVar) ||
            REGEX_NUMBER.test(variable)) {
            continue;
        }

        // Recherche dans les portées (du plus local au plus global)
        let isDeclared = false;
        for (let i = scopeStack.length - 1; i >= 0; i--) {
            if (scopeStack[i].has(variable)) {
                isDeclared = true;
                break;
            }
        }

        if (!isDeclared) {
            const finalColumn = expressionOffsetInLine + indexInExpression;
            const range = new vscode.Range(line.lineNumber, finalColumn, line.lineNumber, finalColumn + variable.length);
            diagnostics.push(new vscode.Diagnostic(range, `L'identifiant '${variable}' est utilisé avant d'avoir reçu une valeur.`, vscode.DiagnosticSeverity.Error));
        }
    }
}

/**
 * Vérifie les appels de fonction dans une expression.
 * OPTIMISÉ: Parsing manuel plus efficace que des regex répétées.
 */
function checkFunctionCallsInExpression(
    expression: string,
    declaredFunctions: Set<string>,
    declaredCompositeTypes: Set<string>,
    line: vscode.TextLine,
    diagnostics: vscode.Diagnostic[]
): void {
    let masked = maskStrings(expression);
    masked = maskFieldAccess(masked);

    const expressionOffsetInLine = line.text.indexOf(expression);
    if (expressionOffsetInLine === -1) return;

    const len = masked.length;
    let i = 0;

    while (i < len) {
        const ch = masked[i];
        const prev = i > 0 ? masked[i - 1] : ' ';

        // Détection optimisée du début d'identifiant
        if (!REGEX_IDENT_CHAR.test(ch) || REGEX_IDENT_CHAR_FULL.test(prev)) {
            i++;
            continue;
        }

        const idMatch = masked.slice(i).match(REGEX_IDENTIFIER_EXTRACT);
        if (!idMatch) {
            i++;
            continue;
        }

        const funcName = idMatch[0];
        let j = i + funcName.length;

        // Sauter espaces
        while (j < len && REGEX_WHITESPACE.test(masked[j])) j++;

        if (j < len && masked[j] === '(') {
            const closeIdx = findMatchingParen(masked, j);
            if (closeIdx === -1) break;

            const argsStr = expression.slice(j + 1, closeIdx);
            const args = smartSplitArgs(argsStr);
            const arity = args.length;
            const lower = funcName.toLowerCase();

            if (Object.prototype.hasOwnProperty.call(BUILTIN_FUNCTION_ARITY, lower)) {
                const expected = BUILTIN_FUNCTION_ARITY[lower];
                const isValid = Array.isArray(expected) ? expected.includes(arity) : expected === arity;
                if (!isValid) {
                    const startCol = expressionOffsetInLine + i;
                    const range = new vscode.Range(line.lineNumber, startCol, line.lineNumber, startCol + funcName.length);
                    const expectedStr = Array.isArray(expected) ? expected.join(' ou ') : expected.toString();
                    diagnostics.push(new vscode.Diagnostic(
                        range,
                        `La fonction intégrée '${funcName}' attend ${expectedStr} argument(s), mais ${arity} fourni(s).`,
                        vscode.DiagnosticSeverity.Error
                    ));
                }
            } else if (!declaredFunctions.has(funcName) && !KNOWN_IDENTIFIERS_LOWER.has(lower) && !declaredCompositeTypes.has(lower)) {
                const startCol = expressionOffsetInLine + i;
                const range = new vscode.Range(line.lineNumber, startCol, line.lineNumber, startCol + funcName.length);
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    `La fonction '${funcName}' n'est pas déclarée.`,
                    vscode.DiagnosticSeverity.Error
                ));
            }

            i = closeIdx + 1;
            continue;
        }

        i = j;
    }
}