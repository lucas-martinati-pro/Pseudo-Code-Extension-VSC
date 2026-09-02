import * as vscode from 'vscode';
import { formatDocument } from './formatter';
import { executeCode, cleanOldTempFiles } from './services/runner';
import { linter } from './services/linter';
import { handleSymbolReplacement as handleSymbolReplacementImpl } from './autoEdits/symbols';
import { PscCompletionProvider, PscSignatureHelpProvider, PscHoverProvider, PscDefinitionProvider } from './completionProvider';

// Une "collection de diagnostics" est le conteneur de VS Code pour toutes nos erreurs
const diagnosticsCollection = vscode.languages.createDiagnosticCollection('psc');

export function activate(context: vscode.ExtensionContext) {
    console.log('PSC Language Support is now active!');
    cleanOldTempFiles();

    // --- On garde le code du formateur ---
    const formattingProvider = vscode.languages.registerDocumentFormattingEditProvider('psc', {
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
            return formatDocument(document);
        }
    });
    context.subscriptions.push(formattingProvider);

    // --- AUTOCOMPLÉTION INTELLIGENTE ---
    const completionProvider = vscode.languages.registerCompletionItemProvider(
        'psc',
        new PscCompletionProvider(),
        '.', ':', '('
    );
    context.subscriptions.push(completionProvider);

    // --- AIDE À LA SIGNATURE (paramètres de fonctions) ---
    const signatureProvider = vscode.languages.registerSignatureHelpProvider(
        'psc',
        new PscSignatureHelpProvider(),
        { triggerCharacters: ['(', ','], retriggerCharacters: [','] }
    );
    context.subscriptions.push(signatureProvider);

    // --- INFO AU SURVOL (Hover) ---
    const hoverProvider = vscode.languages.registerHoverProvider(
        'psc',
        new PscHoverProvider()
    );
    context.subscriptions.push(hoverProvider);

    // --- ALLER À LA DÉFINITION (Ctrl+Clic) ---
    const definitionProvider = vscode.languages.registerDefinitionProvider(
        'psc',
        new PscDefinitionProvider()
    );
    context.subscriptions.push(definitionProvider);

    // --- GESTION DE L'ANALYSE (DIAGNOSTICS) ---
    if (vscode.window.activeTextEditor) {
        linter.refresh(vscode.window.activeTextEditor.document, diagnosticsCollection);
    }
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            linter.refresh(editor.document, diagnosticsCollection);
        }
    }));

    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(doc => {
        diagnosticsCollection.delete(doc.uri);
    }));

    // --- GESTION DE LA COMMANDE D'EXÉCUTION ---
    const executeCommand = vscode.commands.registerCommand('psc.execute', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.languageId === 'psc') {
            executeCode(editor.document);
        } else {
            vscode.window.showErrorMessage('Aucun fichier Pseudo-Code actif à exécuter.');
        }
    });
    context.subscriptions.push(executeCommand);

    // --- NOUVELLE PARTIE : LOGIQUE DE REMPLACEMENT AUTOMATIQUE ET DIAGNOSTICS ---
    let timeout: any;

    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
        // On s'assure que le document est bien du Pseudo-Code
        if (event.document.languageId !== 'psc') {
            return;
        }

        // On exécute la logique de remplacement pour symboles (flèche, ≤, ≥, ≠)
        // (Doit rester instantané pour l'UX)
        handleSymbolReplacement(event);

        // Debounce pour le linter (éviter de re-parser tout le fichier à chaque frappe)
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            linter.refresh(event.document, diagnosticsCollection);
        }, 500);
    }));
}

/**
 * Remplacements automatiques optimisés pour symboles :
 *  '<-' -> '←'
 *  '<=' -> '≤'
 *  '>=' -> '≥'
 *  '!=' or '=/' -> '≠'
 *
 * Optimisations et garanties :
 * - Ne se déclenche que pour des insertions simples (pas de suppression ou de collage massif).
 * - Ignore les remplacements quand on est dans un commentaire de ligne (//) ou dans une chaîne entre guillemets.
 */
function handleSymbolReplacement(event: vscode.TextDocumentChangeEvent): void {
    handleSymbolReplacementImpl(event);
}

export function deactivate() { }