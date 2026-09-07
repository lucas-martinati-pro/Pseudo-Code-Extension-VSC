#!/usr/bin/env node
/**
 * Script de test pour les fichiers .psc du repository
 * Teste la transpilation vers Lua, vérifie la syntaxe Lua et valide l'exécution
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { transpileToLua } = require('./out/executor');

// Dossiers ou fichiers par défaut (exemples du repository uniquement)
const defaultFolders = [
    path.join(__dirname, 'examples')
];

// Permettre de passer des dossiers ou fichiers personnalisés en argument CLI si souhaité
const cliArgs = process.argv.slice(2);
const targets = cliArgs.length > 0 ? cliArgs : defaultFolders;

// Trouver tous les fichiers .psc récursivement
function findPscFiles(dir, files = []) {
    try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            try {
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    findPscFiles(fullPath, files);
                } else if (item.endsWith('.psc')) {
                    files.push(fullPath);
                }
            } catch (e) {
                // Ignorer les fichiers inaccessibles
            }
        }
    } catch (e) {
        console.error(`Erreur accès dossier ${dir}: ${e.message}`);
    }
    return files;
}

// Couleurs pour le terminal
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Extraire les fonctions d'un fichier PSC
function extractFunctions(pscCode) {
    const functionRegex = /^\s*Fonction\s+([\p{L}_][\p{L}0-9_]*)\s*\(/gium;
    const functions = [];
    let match;
    while ((match = functionRegex.exec(pscCode)) !== null) {
        functions.push(match[1]);
    }
    return functions;
}

// Résultats
const results = {
    total: 0,
    transpileSuccess: 0,
    transpileFail: 0,
    syntaxCheckSuccess: 0,
    syntaxCheckFail: 0,
    executionSuccess: 0,
    executionFail: 0,
    functions: [],
    errors: []
};

console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.cyan}    Test de l'extension Pseudo-Code Interpreter${colors.reset}`);
console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

// Trouver tous les fichiers
const allFiles = [];
for (const target of targets) {
    const resolvedTarget = path.resolve(target);
    if (fs.existsSync(resolvedTarget)) {
        const stat = fs.statSync(resolvedTarget);
        if (stat.isDirectory()) {
            findPscFiles(resolvedTarget, allFiles);
        } else if (resolvedTarget.endsWith('.psc')) {
            allFiles.push(resolvedTarget);
        }
    } else {
        console.warn(`${colors.yellow}Avertissement : chemin introuvable : ${target}${colors.reset}`);
    }
}

console.log(`${colors.blue}Fichiers trouvés: ${allFiles.length}${colors.reset}\n`);

// Tester chaque fichier
for (const file of allFiles) {
    results.total++;
    const relativePath = path.relative(__dirname, file);
    
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.yellow}📄 ${relativePath}${colors.reset}`);
    
    try {
        const pscCode = fs.readFileSync(file, 'utf8');
        
        // Extraire les fonctions
        const funcs = extractFunctions(pscCode);
        results.functions.push({ file: relativePath, functions: funcs });
        
        console.log(`   Fonctions: ${funcs.length > 0 ? funcs.join(', ') : '(aucune)'}`);
        
        // Tenter la transpilation
        let luaCode;
        try {
            luaCode = transpileToLua(pscCode);
            results.transpileSuccess++;
            console.log(`   ${colors.green}✓ Transpilation réussie${colors.reset}`);
            
            // Sauvegarder le code Lua temporairement
            const tempLuaFile = path.join(os.tmpdir(), `psc_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.lua`);
            fs.writeFileSync(tempLuaFile, luaCode, 'utf8');
            
            // Vérifier la syntaxe Lua
            let syntaxOk = false;
            try {
                execSync(`luac -p "${tempLuaFile}"`, { stdio: 'pipe' });
                results.syntaxCheckSuccess++;
                syntaxOk = true;
                console.log(`   ${colors.green}✓ Syntaxe Lua valide${colors.reset}`);
            } catch (luaError) {
                results.syntaxCheckFail++;
                const errorMsg = luaError.stderr ? luaError.stderr.toString() : luaError.message;
                console.log(`   ${colors.red}✗ Erreur syntaxe Lua:${colors.reset}`);
                console.log(`     ${errorMsg.trim()}`);
                results.errors.push({
                    file: relativePath,
                    type: 'lua_syntax',
                    error: errorMsg.trim()
                });
                
                // Afficher les lignes problématiques du Lua généré
                const lines = luaCode.split('\n');
                const match = errorMsg.match(/:(\d+):/);
                if (match) {
                    const lineNum = parseInt(match[1]);
                    console.log(`     ${colors.cyan}Ligne ${lineNum}:${colors.reset} ${lines[lineNum - 1] || '(vide)'}`);
                }
            }
            
            // Si la syntaxe est valide, tester l'exécution
            if (syntaxOk) {
                try {
                    execSync(`lua "${tempLuaFile}"`, { stdio: 'pipe' });
                    results.executionSuccess++;
                    console.log(`   ${colors.green}✓ Exécution Lua réussie${colors.reset}`);
                } catch (execError) {
                    results.executionFail++;
                    const execMsg = execError.stderr ? execError.stderr.toString() : execError.message;
                    console.log(`   ${colors.yellow}⚠ Exécution terminée avec erreur : ${execMsg.trim()}${colors.reset}`);
                }
            }
            
            // Nettoyer
            if (fs.existsSync(tempLuaFile)) {
                fs.unlinkSync(tempLuaFile);
            }
            
        } catch (transpileError) {
            results.transpileFail++;
            console.log(`   ${colors.red}✗ Erreur transpilation: ${transpileError.message}${colors.reset}`);
            results.errors.push({
                file: relativePath,
                type: 'transpile',
                error: transpileError.message
            });
        }
        
    } catch (readError) {
        console.log(`   ${colors.red}✗ Erreur lecture: ${readError.message}${colors.reset}`);
        results.errors.push({
            file: relativePath,
            type: 'read',
            error: readError.message
        });
    }
}

// Résumé
console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.cyan}    RÉSUMÉ${colors.reset}`);
console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`\nFichiers testés: ${results.total}`);
console.log(`${colors.green}Transpilation réussie: ${results.transpileSuccess}/${results.total}${colors.reset}`);
console.log(`${colors.green}Syntaxe Lua valide: ${results.syntaxCheckSuccess}/${results.total}${colors.reset}`);
console.log(`${colors.green}Exécution Lua réussie: ${results.executionSuccess}/${results.total}${colors.reset}`);

if (results.errors.length > 0) {
    console.log(`\n${colors.red}Erreurs (${results.errors.length}):${colors.reset}`);
    for (const err of results.errors) {
        console.log(`  - ${err.file} [${err.type}]: ${err.error.substring(0, 100)}`);
    }
}

// Lister toutes les fonctions
console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.cyan}    FONCTIONS DÉTECTÉES${colors.reset}`);
console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);

let totalFunctions = 0;
for (const entry of results.functions) {
    if (entry.functions.length > 0) {
        console.log(`\n${colors.yellow}${entry.file}:${colors.reset}`);
        for (const func of entry.functions) {
            console.log(`  - ${func}`);
            totalFunctions++;
        }
    }
}
console.log(`\n${colors.blue}Total fonctions: ${totalFunctions}${colors.reset}`);

// Écrire le rapport JSON
const reportPath = path.join(os.tmpdir(), 'psc_test_report.json');
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`\n${colors.blue}Rapport détaillé: ${reportPath}${colors.reset}\n`);

if (results.errors.length > 0) {
    process.exit(1);
}
