const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { transpileToLua } = require('./out/executor');
const { encodeIdentifier } = require('./out/utils');

console.log('===============================================================');
console.log('  TEST : Support des caractères spéciaux dans les fonctions');
console.log('===============================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  ✓ ${message}`);
    } else {
        console.error(`  ✗ ÉCHEC : ${message}`);
    }
}

// Test 1 : Encodage d'identifiant et distinction é vs e
console.log('--- Test 1 : Distinction des identifiants (name mangling) ---');
assert(encodeIdentifier('aritéSymbole') === 'arit_eacute_Symbole', 'aritéSymbole -> arit_eacute_Symbole');
assert(encodeIdentifier('ariteSymbole') === 'ariteSymbole', 'ariteSymbole reste ariteSymbole (distinction respectée)');
assert(encodeIdentifier('aritéSymbole') !== encodeIdentifier('ariteSymbole'), 'aritéSymbole et ariteSymbole sont bien distincts');
assert(encodeIdentifier('lireSymbole') === 'lireSymbole', 'lireSymbole (ASCII) reste intact');
assert(encodeIdentifier('getExpression') === 'getExpression', 'getExpression (ASCII) reste intact');
assert(encodeIdentifier('coût') === 'co_ucirc_t', 'coût -> co_ucirc_t');
assert(encodeIdentifier('àFaire') === '_agrave_Faire', 'àFaire -> _agrave_Faire');
assert(encodeIdentifier('Élément') === '_Eacute_l_eacute_ment', 'Élément -> _Eacute_l_eacute_ment');
assert(encodeIdentifier('générerClé') === 'g_eacute_n_eacute_rerCl_eacute_', 'générerClé -> g_eacute_n_eacute_rerCl_eacute_');

// Test 2 : Déclaration et appel de aritéSymbole
console.log('\n--- Test 2 : Déclaration et appel de aritéSymbole ---');
const psc1 = `
Algorithme TestArite
Fonction aritéSymbole(symbole : chaîne) : entier
Début
    Si symbole = "+" ou symbole = "*" Alors :
        retourner 2
    Sinon :
        retourner 1
    fsi
Fin

Début
    écrire("Arité de + : ", aritéSymbole("+"))
    écrire("Arité de x : ", aritéSymbole("x"))
Fin
`;

const lua1 = transpileToLua(psc1);
assert(lua1.includes('function arit_eacute_Symbole(symbole)'), 'Lua contient la fonction encodée arit_eacute_Symbole');
assert(lua1.includes('arit_eacute_Symbole("+")'), 'Lua appelle arit_eacute_Symbole');

// Vérification de syntaxe avec luac -p
const tempFile1 = '/tmp/test_arite_1.lua';
fs.writeFileSync(tempFile1, lua1, 'utf8');
try {
    execSync(`luac -p "${tempFile1}"`);
    assert(true, 'luac valide la syntaxe Lua générée sans erreur');
} catch (e) {
    assert(false, `Erreur luac: ${e.message}`);
}

// Exécution avec lua
try {
    const output = execSync(`lua "${tempFile1}"`).toString();
    assert(output.includes('2') && output.includes('1'), 'Exécution Lua correcte : produit les sorties attendues');
} catch (e) {
    assert(false, `Erreur exécution lua: ${e.message}`);
}
fs.unlinkSync(tempFile1);

// Test 3 : Coexistence de aritéSymbole et ariteSymbole (différenciation é vs e)
console.log('\n--- Test 3 : Coexistence de aritéSymbole et ariteSymbole ---');
const psc2 = `
Algorithme TestCoexistence
Fonction aritéSymbole(s : chaîne) : entier
Début
    retourner 10
Fin

Fonction ariteSymbole(s : chaîne) : entier
Début
    retourner 20
Fin

Début
    écrire("Avec accent : ", aritéSymbole("a"))
    écrire("Sans accent : ", ariteSymbole("a"))
Fin
`;

const lua2 = transpileToLua(psc2);
assert(lua2.includes('function arit_eacute_Symbole(s)'), 'Contient la fonction avec é');
assert(lua2.includes('function ariteSymbole(s)'), 'Contient la fonction sans é');

const tempFile2 = '/tmp/test_coexistence.lua';
fs.writeFileSync(tempFile2, lua2, 'utf8');
try {
    const output = execSync(`lua "${tempFile2}"`).toString();
    assert(output.includes('10') && output.includes('20'), 'Les deux fonctions sont distinctes et retournent leurs valeurs respectives');
} catch (e) {
    assert(false, `Erreur: ${e.message}`);
}
fs.unlinkSync(tempFile2);

// Test 4 : Récursivité avec fonction accentuée
console.log('\n--- Test 4 : Récursivité avec nom accentué ---');
const pscRec = `
Algorithme TestRecursivite
Fonction factorielleÉtendue(n : entier) : entier
Début
    Si n <= 1 Alors :
        retourner 1
    Sinon :
        retourner n * factorielleÉtendue(n - 1)
    fsi
Fin

Début
    écrire("Fact 5 = ", factorielleÉtendue(5))
Fin
`;

const luaRec = transpileToLua(pscRec);
const tempFileRec = '/tmp/test_rec.lua';
fs.writeFileSync(tempFileRec, luaRec, 'utf8');
try {
    execSync(`luac -p "${tempFileRec}"`);
    const output = execSync(`lua "${tempFileRec}"`).toString();
    assert(output.includes('120'), 'Fonction récursive avec accent s\'exécute correctement (120)');
} catch (e) {
    assert(false, `Erreur récursion: ${e.message}`);
}
fs.unlinkSync(tempFileRec);

// Test 5 : Paramètres et variables locales avec accents
console.log('\n--- Test 5 : Paramètres et variables locales avec accents ---');
const psc3 = `
Algorithme TestVars
Fonction calculer(paramètre : entier) : entier
Début
    résultat ← paramètre * 2
    retourner résultat
Fin

Début
    écrire("Calcul : ", calculer(21))
Fin
`;

const lua3 = transpileToLua(psc3);
const tempFile3 = '/tmp/test_vars.lua';
fs.writeFileSync(tempFile3, lua3, 'utf8');
try {
    execSync(`luac -p "${tempFile3}"`);
    const output = execSync(`lua "${tempFile3}"`).toString();
    assert(output.includes('42'), 'Paramètres et variables avec accents s\'exécutent correctement (42)');
} catch (e) {
    assert(false, `Erreur: ${e.message}`);
}
fs.unlinkSync(tempFile3);

// Test 6 : Types composites avec accents
console.log('\n--- Test 6 : Types composites avec accents ---');
const pscComp = `
Algorithme TestComposite
Élément < nom : chaîne, priorité : entier >

Début
    e ← Élément("Test", 3)
    écrire(e.nom, " - ", e.priorité)
Fin
`;

const luaComp = transpileToLua(pscComp);
const tempFileComp = '/tmp/test_comp.lua';
fs.writeFileSync(tempFileComp, luaComp, 'utf8');
try {
    execSync(`luac -p "${tempFileComp}"`);
    const output = execSync(`lua "${tempFileComp}"`).toString();
    assert(output.includes('Test') && output.includes('3'), 'Structure avec accents s\'exécute correctement');
} catch (e) {
    assert(false, `Erreur composite: ${e.message}`);
}
fs.unlinkSync(tempFileComp);

// Test 7 : Fichier d'exemples MEGA_DEMO_COMPLEXE.psc du repository
console.log('\n--- Test 7 : Fichier du repository examples/MEGA_DEMO_COMPLEXE.psc ---');
const demoFile = path.join(__dirname, 'examples', 'MEGA_DEMO_COMPLEXE.psc');
assert(fs.existsSync(demoFile), 'examples/MEGA_DEMO_COMPLEXE.psc existe dans le dépôt');

if (fs.existsSync(demoFile)) {
    const content = fs.readFileSync(demoFile, 'utf8');
    const demoLua = transpileToLua(content);
    
    assert(demoLua.includes('function arit_eacute_Symbole(symbole)'), 'MEGA_DEMO_COMPLEXE.psc transpile aritéSymbole en arit_eacute_Symbole');
    assert(demoLua.includes('function ariteSymbole(symbole)'), 'MEGA_DEMO_COMPLEXE.psc conserve ariteSymbole (distinction)');
    
    const tempDemoLua = path.join(os.tmpdir(), `test_demo_${Date.now()}.lua`);
    fs.writeFileSync(tempDemoLua, demoLua, 'utf8');
    try {
        execSync(`luac -p "${tempDemoLua}"`);
        assert(true, 'MEGA_DEMO_COMPLEXE.psc transpile en syntaxe Lua 100% valide');
        
        const output = execSync(`lua "${tempDemoLua}"`).toString();
        assert(output.includes('aritéSymbole') && output.includes('TOUS LES TESTS SE SONT EXÉCUTÉS AVEC SUCCÈS'), 'MEGA_DEMO_COMPLEXE.psc s\'exécute avec succès');
    } catch (e) {
        assert(false, `Erreur: ${e.message}`);
    }
    if (fs.existsSync(tempDemoLua)) fs.unlinkSync(tempDemoLua);
}

console.log('\n===============================================================');
console.log(`  RÉSULTAT : ${passedTests}/${totalTests} tests réussis`);
console.log('===============================================================\n');

if (passedTests !== totalTests) {
    process.exit(1);
}
