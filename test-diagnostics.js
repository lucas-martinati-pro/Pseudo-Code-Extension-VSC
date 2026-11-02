#!/usr/bin/env node
const assert = require('assert');
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (name) {
    if (name === 'vscode') return {
        Range: class { constructor(...coordinates) { this.coordinates = coordinates; } },
        Diagnostic: class { constructor(range, message, severity) { Object.assign(this, { range, message, severity }); } },
        DiagnosticSeverity: { Error: 0 }
    };
    return originalRequire.apply(this, arguments);
};
const { refreshDiagnostics } = require('./out/diagnostics');
Module.prototype.require = originalRequire;

function diagnose(source) {
    const lines = source.split('\n');
    let result;
    refreshDiagnostics({
        languageId: 'psc', uri: 'test://names.psc', lineCount: lines.length,
        lineAt: i => ({ text: lines[i], lineNumber: i })
    }, { set: (_, diagnostics) => { result = diagnostics; } });
    return result;
}

for (const name of ['longueur', 'racine', 'fichierOuvrir', 'calcul']) {
    const header = 'Fonction calcul(x : entier) : entier\nDébut\nretourner x\nFin\n';
    assert.deepStrictEqual(diagnose(header + `Début\n${name} ← 3\nécrire(${name})\nFin`), []);
    assert.deepStrictEqual(diagnose(header + `Début\n${name} : entier\nécrire(${name})\nFin`), []);
    const errors = diagnose(header + `Début\nécrire(${name})\nFin`);
    assert.strictEqual(errors.length, 1, `${name} sans valeur doit être signalé`);
    assert.match(errors[0].message, /avant d'avoir reçu une valeur/);
}
assert.deepStrictEqual(diagnose('Début\nlongueur ← longueur("abc")\nécrire(longueur)\nFin'), []);
assert.deepStrictEqual(diagnose('Fonction calcul(longueur : entier) : entier\nDébut\nretourner longueur\nFin'), []);
assert.deepStrictEqual(diagnose('Lexique\nlongueur : entier\nDébut\nécrire(longueur)\nFin'), []);
assert.strictEqual(diagnose('Début\nlongueur ← 3\nx ← longueur()\nFin').length, 1, 'Les appels gardent leur contrôle d’arité');
assert.strictEqual(diagnose('Début\nSi vrai Alors\nlongueur ← 3\nfsi\nécrire(longueur)\nFin').length, 1, 'Les variables gardent leur portée');

const grammar = require('./syntaxes/psc.tmLanguage.json');
const builtinPattern = new RegExp(grammar.repository['support-functions'].match.replace('(?i)', ''), 'i');
assert.ok(builtinPattern.test('longueur ("abc")'));
assert.ok(!builtinPattern.test('longueur ← 3'));
assert.ok(!builtinPattern.test('résultat ← longueur + 1'));
console.log('✓ Diagnostics et coloration : variables homonymes de fonctions');

// Les appels sont contrôlés contre la signature actuelle, même déclarée plus bas.
const caller = `Lexique = arbin(chaîne)
Fonction appel(mot : chaîne, lex : Lexique, racine : Noeud) : chaîne
Début
retourner traduction(mot, lex, racine)
Fin
`;
const originalSignature = `Fonction traduction(mot : chaîne, lex : Lexique, racine : Noeud) : chaîne
Début
retourner mot
Fin`;
assert.deepStrictEqual(diagnose(caller + originalSignature), []);
const reordered = originalSignature.replace('mot : chaîne, lex : Lexique, racine : Noeud', 'lex : Lexique, racine : Noeud, mot : chaîne');
const mismatches = diagnose(caller + reordered);
assert.strictEqual(mismatches.length, 3);
assert.ok(mismatches.every(d => /Argument [123] de 'traduction'/.test(d.message)));
assert.deepStrictEqual(diagnose(caller.replace('traduction(mot, lex, racine)', 'traduction(lex, racine, mot)') + reordered), []);

const numberFunction = `Fonction nombre(x : entier) : entier
Début
retourner x
Fin
`;
assert.strictEqual(diagnose(numberFunction + 'Début\nécrire(nombre("abc"))\nFin').length, 1, 'Appel imbriqué');
assert.strictEqual(diagnose(numberFunction + 'Début\nx ← nombre()\nFin').length, 1, 'Arité utilisateur');
assert.deepStrictEqual(diagnose(numberFunction + 'Début\nx ← 42\nécrire(nombre(x))\nFin'), []);
assert.deepStrictEqual(diagnose(numberFunction + 'Début\nécrire(nombre(nombre(1)))\nFin'), []);
assert.strictEqual(diagnose(numberFunction + 'Début\nx ← "abc"\nécrire(nombre(x))\nFin').length, 1);
assert.strictEqual(diagnose(numberFunction + 'Début\nx : chaîne\nx ← lire()\nécrire(nombre(x))\nFin').length, 1);
assert.deepStrictEqual(diagnose(numberFunction + 'Début\nx ← lire()\nécrire(nombre(x))\nFin'), [], 'Type inconnu : pas de faux positif');
assert.deepStrictEqual(diagnose('Fonction test(x : reel) : réel\nDébut\nretourner x\nFin\nDébut\nécrire(test(1), test(1.5))\nFin'), []);
assert.deepStrictEqual(diagnose('Texte = chaîne\nFonction test(x : Texte) : chaîne\nDébut\nretourner x\nFin\nDébut\nécrire(test("abc"))\nFin'), []);
assert.deepStrictEqual(diagnose('Fonction f(x : chaîne) : chaîne\nDébut\nretourner x\nFin\nFonction g(x : entier) : entier\nDébut\nretourner x\nFin\nDébut\nx ← 1\nécrire(g(x))\nFin'), [], 'Les types des paramètres ne fuient pas dans les autres fonctions');
assert.strictEqual(diagnose(numberFunction + 'Point = <nom : chaîne>\nDébut\np : Point\nécrire(nombre(p.nom))\nFin').length, 1);
assert.strictEqual(diagnose(numberFunction + 'Début\nt : tableau chaîne[0..3]\nécrire(nombre(t[0]))\nFin').length, 1);
console.log('✓ Types des arguments, signatures modifiées, alias, portées et appels imbriqués');

for (const name of ['chaîne', 'entier', 'Lexique', 'MotTraduction']) {
    const types = 'MotTraduction = <mot : chaîne>\nLexique = arbin(MotTraduction)\n';
    assert.deepStrictEqual(diagnose(types + `Début\n${name} ← 1\nécrire(${name})\nFin`), []);
    assert.strictEqual(diagnose(types + `Début\nécrire(${name})\nFin`).length, 1, `${name} doit être initialisé comme une variable`);
    assert.deepStrictEqual(diagnose(types + `Fonction test(${name} : entier) : entier\nDébut\nretourner ${name}\nFin`), []);
}
assert.strictEqual(diagnose('Début\nLexique ← absent\nFin').length, 1, 'Ne pas ignorer les affectations à Lexique');
console.log('✓ Variables homonymes de types et du bloc Lexique');
