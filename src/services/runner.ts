import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { transpiler } from './transpiler';

// Fichier temporaire fixe (évite l'accumulation de fichiers temporaires)
const TEMP_FILE_NAME = 'psc_output.lua';
const tempFilePath = path.join(os.tmpdir(), TEMP_FILE_NAME);

/**
 * Nettoie les anciens fichiers temporaires PSC (reliquats des versions précédentes)
 */
export function cleanOldTempFiles(): void {
    try {
        const tmpDir = os.tmpdir();
        const files = fs.readdirSync(tmpDir);
        for (const file of files) {
            if (file.startsWith('psc_temp_') && file.endsWith('.lua')) {
                try {
                    fs.unlinkSync(path.join(tmpDir, file));
                } catch {
                    // Ignorer les fichiers verrouillés
                }
            }
        }
    } catch {
        // Ignorer les erreurs d'accès au répertoire temporaire
    }
}

/**
 * Exécute le code Pseudo-Code en le transpilant vers Lua
 */
export function executeCode(document: vscode.TextDocument): void {
    const pscCode = document.getText();

    let luaCode: string;
    try {
        luaCode = transpiler.transpile(pscCode);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Erreur de transpilation : ${message}`);
        return;
    }

    console.log("--- Code Lua généré ---\n", luaCode, "\n--------------------------");

    try {
        fs.writeFileSync(tempFilePath, luaCode, 'utf-8');
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Impossible d'écrire le fichier temporaire : ${message}`);
        return;
    }

    const terminalName = "Pseudo-Code Execution";
    let terminal = vscode.window.terminals.find(t => t.name === terminalName);
    if (!terminal) {
        terminal = vscode.window.createTerminal(terminalName);
    }
    terminal.show(true);

    const command = `lua "${tempFilePath}"`;
    terminal.sendText(command, true);
}
