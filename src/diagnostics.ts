import * as vscode from 'vscode';
import { KNOWN_IDENTIFIERS, PATTERNS, BUILTIN_FUNCTION_ARITY } from './constants';
import { cleanLineFromComments, maskStrings, maskFieldAccess, smartSplitArgs, findMatchingParen } from './utils';

// ═══════════════════════════════════════════════════════════════════════════════
// REGEX PRÉ-COMPILÉES (éviter la recompilation à chaque ligne)
// ═══════════════════════════════════════════════════════════════════════════════
const REGEX_POUR_LOOP = /^\s*Pour\s+([\p{L}_][\p{L}0-9_]*)/iu;
const REGEX_PARAM_SPLIT = /,(?![^(\[]*[)\]])/g;
const REGEX_INOUT = /\bInOut\b/i;
const REGEX_IDENTIFIER_START = /^([\p{L}_][\p{L}0-9_]*)/u;
const REGEX_NUMBER = /^\d+(\.\d+)?$/;
const REGEX_IDENT_CHAR = /[\p{L}_]/u;
const REGEX_IDENT_CHAR_FULL = /[\p{L}0-9_]/u;
const REGEX_IDENTIFIER_EXTRACT = /^[\p{L}_][\p{L}0-9_]*/u;
const REGEX_WHITESPACE = /\s/;

// Patterns pour la détection des blocs
const REGEX_OPEN_SI = /^\s*Si\b/i;
const REGEX_OPEN_SINON_SI = /^\s*Sinon\s+si\b/i;
const REGEX_OPEN_POUR = /^\s*Pour\b/i;
const REGEX_OPEN_TANT_QUE = /^\s*Tant\s+que\b/i;
const REGEX_OPEN_DEBUT = /^\s*Début\b/i;
const REGEX_CLOSE_FSI = /^\s*fsi\b/i;
const REGEX_CLOSE_FPOUR = /^\s*fpour\b/i;
const REGEX_CLOSE_FTQ = /^\s*(ftq|ftant)\b/i;
const REGEX_CLOSE_FIN = /^\s*Fin\b/i;

const REGEX_LEXIQUE_LINE = /^\s*Lexique\s*:?\s*$/i;
const REGEX_VAR_DECL_IN_LEXIQUE = /^\s*([\p{L}_][\p{L}0-9_]*(?:\s*,\s*[\p{L}_][\p{L}0-9_]*)*)\s*:\s*.+/iu;

// Cache pour les identifiants connus en minuscules (optimisation lookup)
const KNOWN_IDENTIFIERS_LOWER = new Set([...KNOWN_IDENTIFIERS].map(id => id.toLowerCase()));

// Types de blocs ouvrants et leurs fermetures attendues
type BlockType = 'Si' | 'Pour' | 'TantQue' | 'Début';
interface BlockInfo {
    type: BlockType;
    lineNumber: number;
    lineText: string;
}

const EXPECTED_CLOSING: Record<BlockType, string> = {
    'Si': 'fsi',
    'Pour': 'fpour',
    'TantQue': 'ftq/ftant',
    'Début': 'Fin'
};

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
            if (REGEX_OPEN_DEBUT.test(trimmed) || /^\s*(Algorithme|Fonction)\b/i.test(trimmed) || /^\s*Fin\b/i.test(trimmed)) {
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
        const isOpeningBlock = PATTERNS.OPENING_BLOCK.test(trimmedText);
        const funcMatch = PATTERNS.FUNCTION_DECLARATION.exec(trimmedText);
        const pourMatch = REGEX_POUR_LOOP.exec(trimmedText);

        // Suivi des blocs pour vérification de fermeture
        if (REGEX_OPEN_SINON_SI.test(trimmedText)) {
            // Sinon si : ne crée pas un nouveau bloc Si, c'est une continuation
            // On ne touche pas au blockStack
        } else if (REGEX_OPEN_SI.test(trimmedText) && !REGEX_OPEN_SINON_SI.test(trimmedText)) {
            blockStack.push({ type: 'Si', lineNumber: lineIndex, lineText: trimmedText });
        }
        if (REGEX_OPEN_POUR.test(trimmedText)) {
            blockStack.push({ type: 'Pour', lineNumber: lineIndex, lineText: trimmedText });
        }
        if (REGEX_OPEN_TANT_QUE.test(trimmedText)) {
            blockStack.push({ type: 'TantQue', lineNumber: lineIndex, lineText: trimmedText });
        }
        if (REGEX_OPEN_DEBUT.test(trimmedText)) {
            blockStack.push({ type: 'Début', lineNumber: lineIndex, lineText: trimmedText });
        }

        // ─── Détection des blocs fermants avec recherche intelligente ───
        // Stratégie "search-and-recover" :
        // 1. Si le sommet de la pile correspond → pop normal
        // 2. Sinon, chercher l'ouvrant correspondant plus bas dans la pile
        // 3. Si trouvé : signaler les blocs intermédiaires comme non fermés (sur leur ligne d'ouverture)
        // 4. Si non trouvé : signaler le fermant comme orphelin

        const closeBlock = (closingKeyword: string, expectedType: BlockType, closingLineIndex: number, closingText: string) => {
            if (blockStack.length === 0) {
                // Aucun bloc ouvert → fermant orphelin
                const range = new vscode.Range(closingLineIndex, 0, closingLineIndex, closingText.length);
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    `'${closingKeyword}' inattendu : aucun bloc '${expectedType}' ouvert.`,
                    vscode.DiagnosticSeverity.Error
                ));
                return;
            }

            const lastBlock = blockStack[blockStack.length - 1];
            if (lastBlock.type === expectedType) {
                // Cas normal : le sommet correspond → pop
                blockStack.pop();
                return;
            }

            // Le sommet ne correspond pas → chercher l'ouvrant correspondant plus bas dans la pile
            let matchIndex = -1;
            for (let k = blockStack.length - 1; k >= 0; k--) {
                if (blockStack[k].type === expectedType) {
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
                        `Bloc '${unclosed.type}' non fermé. Il manque un '${EXPECTED_CLOSING[unclosed.type]}'.`,
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
                    `'${closingKeyword}' inattendu : aucun bloc '${expectedType}' ouvert.`,
                    vscode.DiagnosticSeverity.Error
                ));
            }
        };

        if (REGEX_CLOSE_FSI.test(trimmedText)) {
            closeBlock('fsi', 'Si', lineIndex, trimmedText);
        } else if (REGEX_CLOSE_FPOUR.test(trimmedText)) {
            closeBlock('fpour', 'Pour', lineIndex, trimmedText);
        } else if (REGEX_CLOSE_FTQ.test(trimmedText)) {
            closeBlock('ftq', 'TantQue', lineIndex, trimmedText);
        } else if (REGEX_CLOSE_FIN.test(trimmedText)) {
            closeBlock('Fin', 'Début', lineIndex, trimmedText);
        }

        // ─── Gestion des portées (scope) ───
        if (isOpeningBlock || funcMatch || pourMatch) {
            const newScope = new Set<string>();
            if (funcMatch) {
                let paramsString = funcMatch[2];

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

                if (endOfParams !== -1) {
                    paramsString = paramsString.substring(0, endOfParams);
                }

                // Extraire les noms de paramètres
                const params = paramsString.split(REGEX_PARAM_SPLIT);
                for (const p of params) {
                    const paramParts = p.trim().split(':');
                    if (paramParts.length >= 1) {
                        const varName = paramParts[0].replace(REGEX_INOUT, '').trim();
                        if (varName) newScope.add(varName);
                    }
                }
            }
            if (pourMatch) {
                newScope.add(pourMatch[1]);
            }
            scopeStack.push(newScope);
        }

        const declarationMatch = PATTERNS.VARIABLE_DECLARATION.exec(trimmedText);
        
        // Détecter les affectations (←, <-, =)
        let assignMatch = trimmedText.match(/^([\p{L}_][\p{L}0-9_]*(?:\s*\[[^\]]*\])?(?:\.[\p{L}_][\p{L}0-9_]*)*)\s*(?:←|<-)\s*(.+)$/u);
        if (!assignMatch && !REGEX_OPEN_SI.test(trimmedText) && !REGEX_OPEN_TANT_QUE.test(trimmedText) && !REGEX_OPEN_POUR.test(trimmedText) && !PATTERNS.FUNCTION_DECLARATION.test(trimmedText)) {
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
            `Bloc '${unclosed.type}' non fermé. Il manque un '${EXPECTED_CLOSING[unclosed.type]}'.`,
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