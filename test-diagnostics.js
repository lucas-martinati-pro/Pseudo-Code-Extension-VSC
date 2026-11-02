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
