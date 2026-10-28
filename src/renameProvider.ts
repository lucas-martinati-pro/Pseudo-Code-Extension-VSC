import * as vscode from 'vscode';
import { PSC_DEFINITIONS } from './definitions';
import { isInCommentOrString } from './completionProvider';

/**
 * Ensemble des mots réservés du langage Pseudo-Code
 * (mots-clés, fonctions intégrées, types prédéfinis)
 */
const RESERVED_WORDS = new Set<string>([
    ...PSC_DEFINITIONS.keywords.map(k => k.name.toLowerCase()),
    ...PSC_DEFINITIONS.functions.map(f => f.name.toLowerCase()),
    ...PSC_DEFINITIONS.types.flatMap(t => t.aliases.map(a => a.toLowerCase())),
    // Variantes usuelles
    'si', 'alors', 'sinon', 'fsi', 'pour', 'chaque', 'dans', 'allant', 'de', 'à', 'faire', 'fpour',
    'tant', 'que', 'ftq', 'début', 'debut', 'fin', 'algorithme', 'fonction', 'procédure', 'procedure',
    'retourner', 'retourne', 'vrai', 'faux', 'nil', 'et', 'ou', 'non', 'mod', 'inout', 'soit',
    'entier', 'réel', 'reel', 'booléen', 'booleen', 'chaîne', 'chaine', 'caractère', 'caractere',
    'tableau', 'liste', 'pile', 'file', 'table', 'ensemble', 'fichier', 'arbin', 'noeud', 'abr', 'avl',
    'écrire', 'ecrire', 'lire'
]);

/**
 * Provider de renommage de symbole pour le Pseudo-Code (F2 / Clic droit -> Renommer le symbole)
 */
export class PscRenameProvider implements vscode.RenameProvider {

    prepareRename(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Range | { range: vscode.Range; placeholder: string }> {
        const range = document.getWordRangeAtPosition(position, /[\p{L}_][\p{L}0-9_]*/u);
        if (!range) {
            throw new Error("Aucun symbole sélectionné pour le renommage.");
        }

        const word = document.getText(range);
        const lineText = document.lineAt(position.line).text;

        if (isInCommentOrString(lineText, range.start.character)) {
            throw new Error("Impossible de renommer un élément dans un commentaire ou une chaîne de caractères.");
        }

        if (RESERVED_WORDS.has(word.toLowerCase())) {
            throw new Error(`Impossible de renommer "${word}" car c'est un mot-clé ou une primitive du langage.`);
        }

        return { range, placeholder: word };
    }

    provideRenameEdits(
        document: vscode.TextDocument,
        position: vscode.Position,
        newName: string,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.WorkspaceEdit> {
        const range = document.getWordRangeAtPosition(position, /[\p{L}_][\p{L}0-9_]*/u);
        if (!range) return null;

        const oldName = document.getText(range);
        if (oldName === newName) return null;

        if (!/^[\p{L}_][\p{L}0-9_]*$/u.test(newName)) {
            throw new Error(`"${newName}" n'est pas un nom d'identifiant valide.`);
        }

        if (RESERVED_WORDS.has(newName.toLowerCase())) {
            throw new Error(`"${newName}" est un mot réservé du langage.`);
        }

        const lineAtPos = document.lineAt(position.line).text;
        const textBeforePos = lineAtPos.substring(0, range.start.character).trimEnd();
        const isFieldRename = textBeforePos.endsWith('.') || /=\s*<[^>]*$/u.test(textBeforePos);

        const lineCount = document.lineCount;
        let funcStartLine = -1;
        let funcEndLine = -1;
        let isLocalToFunc = false;

        if (!isFieldRename) {
            // Déterminer si la position courante est à l'intérieur d'une fonction
            for (let i = position.line; i >= 0; i--) {
                const line = document.lineAt(i).text.trim();
                if (/^\s*(?:Fonction|Procédure)\b/iu.test(line)) {
                    funcStartLine = i;
                    break;
                }
                if (/^\s*Fin\b(?!\s+(?:Si|Pour|Tant|Selon|Faire))/iu.test(line) && i < position.line) {
                    break;
                }
            }

            if (funcStartLine !== -1) {
                for (let i = funcStartLine + 1; i < lineCount; i++) {
                    const line = document.lineAt(i).text.trim();
                    if (/^\s*Fin\b(?!\s+(?:Si|Pour|Tant|Selon|Faire))/iu.test(line)) {
                        funcEndLine = i;
                        break;
                    }
                }
                if (funcEndLine === -1) funcEndLine = lineCount - 1;

                const funcDeclLine = document.lineAt(funcStartLine).text;
                const funcNameMatch = /^\s*(?:Fonction|Procédure)\s+([\p{L}_][\p{L}0-9_]*)/iu.exec(funcDeclLine);
                const isFunctionName = funcNameMatch && funcNameMatch[1] === oldName;

                if (!isFunctionName) {
                    // Paramètre de la fonction ?
                    const paramsMatch = /\((.*?)\)/.exec(funcDeclLine);
                    const paramsStr = paramsMatch ? paramsMatch[1] : '';
                    const paramRegex = new RegExp(`\\b${oldName}\\b`, 'u');
                    const isParam = paramRegex.test(paramsStr);

                    // Variable locale déclarée ou assignée dans la fonction ?
                    let isDeclaredLocally = false;
                    for (let i = funcStartLine + 1; i <= funcEndLine; i++) {
                        const lText = document.lineAt(i).text;
                        const assignMatch = new RegExp(`^\\s*${oldName}\\s*(?:←|<-|:=)`, 'u');
                        const declMatch = new RegExp(`^\\s*${oldName}\\s*:`, 'u');
                        if (assignMatch.test(lText) || declMatch.test(lText)) {
                            isDeclaredLocally = true;
                            break;
                        }
                    }

                    if (isParam || isDeclaredLocally) {
                        isLocalToFunc = true;
                    }
                }
            }
        }

        const edit = new vscode.WorkspaceEdit();
        const startLine = isLocalToFunc ? funcStartLine : 0;
        const endLine = isLocalToFunc ? funcEndLine : lineCount - 1;

        const identRegex = /[\p{L}_][\p{L}0-9_]*/gu;
        for (let i = startLine; i <= endLine; i++) {
            const line = document.lineAt(i);
            const lineText = line.text;
            identRegex.lastIndex = 0;
            let match: RegExpExecArray | null;

            while ((match = identRegex.exec(lineText)) !== null) {
                if (match[0] === oldName) {
                    if (!isInCommentOrString(lineText, match.index)) {
                        const isPrecededByDot = match.index > 0 && lineText[match.index - 1] === '.';
                        const inCompositeDef = /=\s*<[^>]*$/u.test(lineText.substring(0, match.index));

                        if (isFieldRename) {
                            // On ne renomme que les champs
                            if (isPrecededByDot || inCompositeDef) {
                                const wordRange = new vscode.Range(
                                    i,
                                    match.index,
                                    i,
                                    match.index + oldName.length
                                );
                                edit.replace(document.uri, wordRange, newName);
                            }
                        } else {
                            // On ne renomme pas les accès aux champs d'autres structures
                            if (!isPrecededByDot && !inCompositeDef) {
                                const wordRange = new vscode.Range(
                                    i,
                                    match.index,
                                    i,
                                    match.index + oldName.length
                                );
                                edit.replace(document.uri, wordRange, newName);
                            }
                        }
                    }
                }
            }
        }

        return edit;
    }
}
