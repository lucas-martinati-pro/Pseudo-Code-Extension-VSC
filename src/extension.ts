import * as vscode from 'vscode';
import { formatDocument } from './formatter';
import { INCREASE_INDENT_PATTERN, DECREASE_INDENT_PATTERN, ALL_CLOSING_KEYWORDS } from './blocks';
import { executeCode, cleanOldTempFiles } from './services/runner';
import { linter } from './services/linter';
import { handleSymbolReplacement as handleSymbolReplacementImpl } from './autoEdits/symbols';
import { PscCompletionProvider, PscSignatureHelpProvider, PscHoverProvider, PscDefinitionProvider } from './completionProvider';

// Une "collection de diagnostics" est le conteneur de VS Code pour toutes nos erreurs
const diagnosticsCollection = vscode.languages.createDiagnosticCollection('psc');

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS POUR LIRE LES SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

function getConfig() {
    const config = vscode.workspace.getConfiguration('psc');
    return {
        executionEnabled: config.get<boolean>('execution.enabled', true),
        linterEnabled: config.get<boolean>('linter.enabled', true),
        intellisenseEnabled: config.get<boolean>('intellisense.enabled', true)
    };
}

// Disposables gérés dynamiquement pour l'intellisense
let intellisenseDisposables: vscode.Disposable[] = [];

function registerIntellisenseProviders(context: vscode.ExtensionContext) {
    // Nettoyer les anciens providers s'ils existent
    disposeIntellisenseProviders();

    // --- AUTOCOMPLÉTION INTELLIGENTE ---
    intellisenseDisposables.push(vscode.languages.registerCompletionItemProvider(
        'psc',
        new PscCompletionProvider(),
        '.', ':', '('
    ));

    // --- AIDE À LA SIGNATURE (paramètres de fonctions) ---
    intellisenseDisposables.push(vscode.languages.registerSignatureHelpProvider(
        'psc',
        new PscSignatureHelpProvider(),
        { triggerCharacters: ['(', ','], retriggerCharacters: [','] }
    ));

    // --- INFO AU SURVOL (Hover) ---
    intellisenseDisposables.push(vscode.languages.registerHoverProvider(
        'psc',
        new PscHoverProvider()
    ));

    // --- ALLER À LA DÉFINITION (Ctrl+Clic) ---
    intellisenseDisposables.push(vscode.languages.registerDefinitionProvider(
        'psc',
        new PscDefinitionProvider()
    ));

    // Ajouter au contexte pour le nettoyage à la désactivation de l'extension
    context.subscriptions.push(...intellisenseDisposables);
}

function disposeIntellisenseProviders() {
    for (const disposable of intellisenseDisposables) {
        disposable.dispose();
    }
    intellisenseDisposables = [];
}

export function activate(context: vscode.ExtensionContext) {
    console.log('PSC Language Support is now active!');
    cleanOldTempFiles();

    // --- Configuration du langage (indentation automatique et règles onEnter) ---
    const closingLinePattern = new RegExp(`^\\s*(${ALL_CLOSING_KEYWORDS.join('|')})\\b.*$`, 'i');
    context.subscriptions.push(vscode.languages.setLanguageConfiguration('psc', {
        indentationRules: {
            increaseIndentPattern: INCREASE_INDENT_PATTERN,
            decreaseIndentPattern: DECREASE_INDENT_PATTERN
        },
        onEnterRules: [
            {
                beforeText: INCREASE_INDENT_PATTERN,
                afterText: DECREASE_INDENT_PATTERN,
                action: { indentAction: vscode.IndentAction.IndentOutdent }
            },
            {
                beforeText: INCREASE_INDENT_PATTERN,
                action: { indentAction: vscode.IndentAction.Indent }
            },
            {
                beforeText: closingLinePattern,
                action: { indentAction: vscode.IndentAction.None }
            },
            {
                beforeText: /^\s*$/,
                previousLineText: closingLinePattern,
                action: { indentAction: vscode.IndentAction.None }
            }
        ]
    }));

    // --- On garde le code du formateur (toujours actif) ---
    const formattingProvider = vscode.languages.registerDocumentFormattingEditProvider('psc', {
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
            return formatDocument(document);
        }
    });
    context.subscriptions.push(formattingProvider);

    // --- INTELLISENSE (conditionné par psc.intellisense.enabled) ---
    if (getConfig().intellisenseEnabled) {
        registerIntellisenseProviders(context);
    }

    // --- GESTION DE L'ANALYSE (DIAGNOSTICS) ---
    // Conditionné par le setting psc.linter.enabled
    const refreshLinterIfEnabled = (doc: vscode.TextDocument) => {
        if (getConfig().linterEnabled) {
            linter.refresh(doc, diagnosticsCollection);
        } else {
            // Si le linter est désactivé, on efface les diagnostics existants
            diagnosticsCollection.clear();
        }
    };

    if (vscode.window.activeTextEditor) {
        refreshLinterIfEnabled(vscode.window.activeTextEditor.document);
    }
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            refreshLinterIfEnabled(editor.document);
        }
    }));

    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(doc => {
        diagnosticsCollection.delete(doc.uri);
    }));

    // --- GESTION DE LA COMMANDE D'EXÉCUTION ---
    // La commande existe toujours mais vérifie le setting avant d'exécuter
    const executeCommand = vscode.commands.registerCommand('psc.execute', () => {
        if (!getConfig().executionEnabled) {
            vscode.window.showInformationMessage(
                'L\'exécution du pseudo-code est désactivée. Activez le setting "psc.execution.enabled" pour utiliser cette fonctionnalité.'
            );
            return;
        }
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.languageId === 'psc') {
            executeCode(editor.document);
        } else {
            vscode.window.showErrorMessage('Aucun fichier Pseudo-Code actif à exécuter.');
        }
    });
    context.subscriptions.push(executeCommand);

    // --- LOGIQUE DE REMPLACEMENT AUTOMATIQUE ET DIAGNOSTICS ---
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
            refreshLinterIfEnabled(event.document);
        }, 500);
    }));

    // --- RÉACTION AUX CHANGEMENTS DE SETTINGS EN TEMPS RÉEL ---
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('psc.linter.enabled')) {
            // Si le linter vient d'être désactivé, effacer les diagnostics
            // Si activé, relancer l'analyse sur le document actif
            if (vscode.window.activeTextEditor) {
                refreshLinterIfEnabled(vscode.window.activeTextEditor.document);
            }
        }

        if (event.affectsConfiguration('psc.intellisense.enabled')) {
            if (getConfig().intellisenseEnabled) {
                registerIntellisenseProviders(context);
            } else {
                disposeIntellisenseProviders();
            }
        }
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