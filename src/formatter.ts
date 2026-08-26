import * as vscode from 'vscode';
import { PATTERNS } from './constants';

export function formatDocument(document: vscode.TextDocument): vscode.TextEdit[] {
    const edits: vscode.TextEdit[] = [];
    let indentationLevel = 0;
    const tabChar = '\t';

    // Patterns pour l'indentation
    const openingPattern = /^\s*(Début|.*(Alors|Faire)\s*:)\s*$/i;
    const closingPattern = PATTERNS.CLOSING_KEYWORDS;

    // Pattern pour détecter les commentaires de bloc multi-lignes
    let inBlockComment = false;

    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const originalText = line.text;
        const trimmedText = originalText.trim();

        // Gestion des commentaires de bloc multi-lignes
        if (inBlockComment) {
            // On est dans un commentaire bloc, appliquer l'indentation courante
            const newText = tabChar.repeat(indentationLevel) + ' * ' + trimmedText.replace(/^\*\s?/, '');
            if (trimmedText.includes('*/')) {
                inBlockComment = false;
                const newEndText = tabChar.repeat(indentationLevel) + ' ' + trimmedText;
                if (newEndText !== originalText) {
                    edits.push(vscode.TextEdit.replace(line.range, newEndText));
                }
            } else if (newText !== originalText && trimmedText !== '') {
                edits.push(vscode.TextEdit.replace(line.range, newText));
            }
            continue;
        }

        if (trimmedText.startsWith('/*')) {
            inBlockComment = !trimmedText.includes('*/');
            // Ne pas reformater la première ligne d'un commentaire bloc, juste indenter
            const newText = tabChar.repeat(indentationLevel) + trimmedText;
            if (newText !== originalText) {
                edits.push(vscode.TextEdit.replace(line.range, newText));
            }
            continue;
        }

        // Préserver les lignes vides (max 1 consécutive)
        if (trimmedText === '') {
            // Vérifier si la ligne précédente était déjà vide
            if (i > 0 && document.lineAt(i - 1).text.trim() === '') {
                // Supprimer les doubles lignes vides
                if (!line.isEmptyOrWhitespace || originalText.length > 0) {
                    edits.push(vscode.TextEdit.replace(line.range, ''));
                }
            } else {
                // Garder une seule ligne vide (nettoyer les espaces résiduels)
                if (originalText !== '') {
                    edits.push(vscode.TextEdit.replace(line.range, ''));
                }
            }
            continue;
        }

        // RÈGLE 1 : Si la ligne est un mot-clé de fermeture (Fin, fsi...) ou 'Sinon' / 'Sinon si',
        // on doit DIMINUER le niveau d'indentation AVANT de l'écrire.
        const isSinon = /^Sinon(?:\s*:)?$/i.test(trimmedText);
        const isSinonSi = /^Sinon\s+si\b/i.test(trimmedText);
        if ((closingPattern.test(trimmedText) || isSinon || isSinonSi) && indentationLevel > 0) {
            indentationLevel--;
        }

        // On applique l'indentation calculée à la ligne actuelle
        const newText = tabChar.repeat(indentationLevel) + trimmedText;
        if (newText !== originalText) {
            edits.push(vscode.TextEdit.replace(line.range, newText));
        }

        // RÈGLE 2 : Si la ligne est un mot-clé d'ouverture (Début, Faire:, Alors:),
        // on doit AUGMENTER le niveau d'indentation pour les lignes SUIVANTES.
        // 'Sinon' et 'Sinon si' créent également un bloc pour les lignes suivantes.
        if (openingPattern.test(trimmedText) || isSinon || isSinonSi) {
            indentationLevel++;
        }
    }

    return edits;
}