#!/usr/bin/env node
/**
 * Test unitaire pour le CompletionProvider
 */

const assert = require('assert');

// 1. Mock minimal de vscode
const Module = require('module');
const originalRequire = Module.prototype.require;

const mockVscode = {
    CompletionItem: class {
        constructor(label, kind) {
            this.label = label;
            this.kind = kind;
            this.detail = '';
            this.sortText = '';
            this.insertText = '';
            this.documentation = '';
        }
    },
    CompletionItemKind: {
        Variable: 5,
        Function: 2,
        Snippet: 14,
        TypeParameter: 24,
        Struct: 21,
        Constructor: 3,
        Field: 4,
        Method: 1,
        Operator: 11,
        Constant: 20,
        Keyword: 13
    },
    SnippetString: class {
        constructor(value) {
            this.value = value;
        }
    },
    MarkdownString: class {
        constructor(value) {
            this.value = value;
        }
        appendMarkdown() {}
        appendCodeblock() {}
    },
    Position: class {
        constructor(line, character) {
            this.line = line;
            this.character = character;
        }
    },
    Range: class {
        constructor(start, end) {
            this.start = start;
            this.end = end;
        }
    },
    Location: class {},
    WorkspaceEdit: class {
        constructor() {
            this.edits = [];
        }
        replace(uri, range, newText) {
            this.edits.push({ uri, range, newText });
        }
    }
};

Module.prototype.require = function (modulePath) {
    if (modulePath === 'vscode') {
        return mockVscode;
    }
    return originalRequire.apply(this, arguments);
};

// 2. Importer les providers compilés
const { PscCompletionProvider } = require('./out/completionProvider');
const { PscRenameProvider } = require('./out/renameProvider');

function createMockDocument(lines, version = 1) {
    return {
        uri: { toString: () => 'test://file.psc' },
        version,
        lineCount: lines.length,
        lineAt: (i) => ({ text: lines[i] }),
        getText: (range) => {
            if (!range) return lines.join('\n');
            const line = lines[range.start.line];
            return line.substring(range.start.character, range.end.character);
        },
        getWordRangeAtPosition: (position, regex) => {
            const line = lines[position.line];
            if (!line) return undefined;
            const flags = regex.flags ? (regex.flags.includes('g') ? regex.flags : regex.flags + 'g') : 'gu';
            const re = new RegExp(regex.source, flags);
            let m;
            while ((m = re.exec(line)) !== null) {
                if (position.character >= m.index && position.character <= m.index + m[0].length) {
                    return new mockVscode.Range(
                        new mockVscode.Position(position.line, m.index),
                        new mockVscode.Position(position.line, m.index + m[0].length)
                    );
                }
            }
            return undefined;
        }
    };
}

console.log('===============================================================');
console.log('  TEST : Autocomplétion et en-têtes de fonctions');
console.log('===============================================================');

const provider = new PscCompletionProvider();

// Test 1: Saisie du nom de fonction dans le snippet
// Ligne: "Fonction zef(params) : type"
// Curseur juste après "zef" (caractère 12)
{
    const lines = [
        'Fonction zef(params) : type',
        'Début',
        '\t',
        'Fin'
    ];
    const doc = createMockDocument(lines, 1);
    const pos = new mockVscode.Position(0, 12);
    const items = provider.provideCompletionItems(doc, pos, {}, {});

    assert.strictEqual(items.length, 0, 'Aucune complétion ne doit être proposée lors de la frappe du nom de la fonction');
    console.log('  ✓ Test 1 : Aucune complétion sur "Fonction zef|" (pas de duplication sur Tab)');
}

// Test 2: Saisie du paramètre dans l'en-tête
// Curseur sur le nom du paramètre
{
    const lines = [
        'Fonction zef(params) : type',
        'Début',
        '\t',
        'Fin'
    ];
    const doc = createMockDocument(lines, 2);
    const pos = new mockVscode.Position(0, 19);
    const items = provider.provideCompletionItems(doc, pos, {}, {});

    assert.strictEqual(items.length, 0, 'Aucune complétion ne doit être proposée sur le nom du paramètre');
    console.log('  ✓ Test 2 : Aucune complétion sur le nom du paramètre');
}

// Test 3: Type de paramètre après ':'
{
    const lines = [
        'Fonction zef(x : ) : type',
        'Début',
        '\t',
        'Fin'
    ];
    const doc = createMockDocument(lines, 3);
    const pos = new mockVscode.Position(0, 17); // après "x : "
    const items = provider.provideCompletionItems(doc, pos, {}, {});

    assert.ok(items.length > 0, 'Des types doivent être proposés après ":" dans les paramètres');
    const hasEntier = items.some(it => it.label === 'entier');
    assert.ok(hasEntier, 'Le type entier doit être proposé');
    const entierItem = items.find(it => it.label === 'entier');
    assert.strictEqual(entierItem.insertText.value, 'entier', 'insertText ne doit pas ajouter d\'espace superflu si déjà présent');
    console.log('  ✓ Test 3 : Types proposés après ":" dans les paramètres (sans espace en trop)');
}

// Test 4: Type de retour après ')' et ':'
{
    const lines = [
        'Fonction zef(params) : ',
        'Début',
        '\t',
        'Fin'
    ];
    const doc = createMockDocument(lines, 4);
    const pos = new mockVscode.Position(0, 23); // après ": "
    const items = provider.provideCompletionItems(doc, pos, {}, {});

    assert.ok(items.length > 0, 'Des types doivent être proposés pour le type de retour');
    const hasReel = items.some(it => it.label === 'réel');
    assert.ok(hasReel, 'Le type réel doit être proposé');
    console.log('  ✓ Test 4 : Types proposés pour le type de retour');
}

// Test 4b: Type de retour partiel (ex: "Fonction zef(params) : en")
{
    const lines = [
        'Fonction zef(params) : en',
        'Début',
        '\t',
        'Fin'
    ];
    const doc = createMockDocument(lines, 41);
    const pos = new mockVscode.Position(0, 25); // après ": en"
    const items = provider.provideCompletionItems(doc, pos, {}, {});

    assert.ok(items.length > 0, 'Des types doivent être proposés même si un préfixe est déjà saisi');
    const hasEntier = items.some(it => it.label === 'entier');
    assert.ok(hasEntier, 'Le type entier doit être proposé lors de la frappe');
    console.log('  ✓ Test 4b : Types proposés avec préfixe partiel');
}

// Test 5: Dans le corps de la fonction, la fonction et ses paramètres sont disponibles
{
    const lines = [
        'Fonction zef(param1 : entier) : entier',
        'Début',
        '\t',
        'Fin'
    ];
    const doc = createMockDocument(lines, 5);
    const pos = new mockVscode.Position(2, 1); // ligne 2 (corps)
    const items = provider.provideCompletionItems(doc, pos, {}, {});

    const hasZef = items.some(it => it.label === 'zef');
    assert.ok(hasZef, 'La fonction zef doit être disponible dans son corps (récursion)');

    const hasParam1 = items.some(it => it.label === 'param1');
    assert.ok(hasParam1, 'Le paramètre param1 doit être disponible dans le corps');
    console.log('  ✓ Test 5 : Fonction et paramètres bien disponibles dans le corps de la fonction');
}

// Test 6: Algorithme header
{
    const lines = [
        'Algorithme MonAlgo',
        'Début',
        '\t',
        'Fin'
    ];
    const doc = createMockDocument(lines, 6);
    const pos = new mockVscode.Position(0, 18);
    const items = provider.provideCompletionItems(doc, pos, {}, {});

    assert.strictEqual(items.length, 0, 'Aucune complétion sur la ligne Algorithme');
    console.log('  ✓ Test 6 : Aucune complétion sur la ligne Algorithme');
}

// Test 7: Structure composite
{
    const lines = [
        'Point = <x : réel, y : >'
    ];
    const doc = createMockDocument(lines, 7);
    const posBeforeColon = new mockVscode.Position(0, 8); // "Point = <x"
    const itemsBefore = provider.provideCompletionItems(doc, posBeforeColon, {}, {});
    assert.strictEqual(itemsBefore.length, 0, 'Aucune complétion pour le nom du champ de structure');

    const posAfterColon = new mockVscode.Position(0, 23); // "Point = <x : réel, y : "
    const itemsAfter = provider.provideCompletionItems(doc, posAfterColon, {}, {});
    assert.ok(itemsAfter.length > 0, 'Des types doivent être proposés pour les champs de structure');
    console.log('  ✓ Test 7 : Champs de types composites correctement traités');
}

// Test 8: Complétion après "." sur phrase : Lexique (arbin) -> fonctions arbin et PAS champs de MotTraduction
{
    const lines = [
        'MotTraduction = < français : chaîne, anglais : chaîne >',
        'Lexique = arbin(MotTraduction)',
        '',
        'Fonction traduction(mot : chaîne, phrase : Lexique) : chaîne',
        'Début',
        '    phrase.',
        'Fin'
    ];
    const doc = createMockDocument(lines, 8);
    const pos = new mockVscode.Position(5, 11); // juste après "phrase."
    const items = provider.provideCompletionItems(doc, pos, {}, {});

    const hasRacine = items.some(it => it.label === 'racine');
    const hasVal = items.some(it => it.label === 'val');
    const hasFg = items.some(it => it.label === 'fg');
    const hasFrancais = items.some(it => it.label === 'français');
    const hasAnglais = items.some(it => it.label === 'anglais');

    assert.ok(hasRacine, 'phrase. doit proposer les fonctions de arbin (racine)');
    assert.ok(hasVal, 'phrase. doit proposer les fonctions de arbin (val)');
    assert.ok(hasFg, 'phrase. doit proposer les fonctions de arbin (fg)');
    assert.strictEqual(hasFrancais, false, 'phrase. ne doit PAS proposer le champ "français" du type de l\'élément');
    assert.strictEqual(hasAnglais, false, 'phrase. ne doit PAS proposer le champ "anglais" du type de l\'élément');
    console.log('  ✓ Test 8 : Complétion sur phrase. propose les méthodes arbin et non les champs de l\'élément');
}

// Test 9: Complétion après "." sur trad (élément obtenu via val(phrase, noeud)) -> propose français et anglais
{
    const lines = [
        'MotTraduction = < français : chaîne, anglais : chaîne >',
        'Lexique = arbin(MotTraduction)',
        '',
        'Fonction traduction(mot : chaîne, phrase : Lexique) : chaîne',
        'Début',
        '    noeud ← racine(phrase)',
        '    Si non noeudVide(phrase, noeud) Alors :',
        '        trad ← val(phrase, noeud)',
        '        trad.',
        '    fsi',
        'Fin'
    ];
    const doc = createMockDocument(lines, 9);
    const pos = new mockVscode.Position(8, 13); // juste après "trad."
    const items = provider.provideCompletionItems(doc, pos, {}, {});

    const hasFrancais = items.some(it => it.label === 'français');
    const hasAnglais = items.some(it => it.label === 'anglais');
    assert.ok(hasFrancais, 'trad. doit proposer "français"');
    assert.ok(hasAnglais, 'trad. doit proposer "anglais"');
    console.log('  ✓ Test 9 : Complétion sur trad. (val(phrase, noeud)) propose français et anglais');
}

// Test 10: Complétion après "." sur val(racine(phrase), phrase). -> propose français et anglais
{
    const lines = [
        'MotTraduction = < français : chaîne, anglais : chaîne >',
        'Lexique = arbin(MotTraduction)',
        '',
        'Fonction traduction(mot : chaîne, phrase : Lexique) : chaîne',
        'Début',
        '    val(racine(phrase), phrase).',
        'Fin'
    ];
    const doc = createMockDocument(lines, 10);
    const pos = new mockVscode.Position(5, 32); // juste après "val(racine(phrase), phrase)."
    const items = provider.provideCompletionItems(doc, pos, {}, {});

    const hasFrancais = items.some(it => it.label === 'français');
    const hasAnglais = items.some(it => it.label === 'anglais');
    assert.ok(hasFrancais, 'val(racine(phrase), phrase). doit proposer "français"');
    assert.ok(hasAnglais, 'val(racine(phrase), phrase). doit proposer "anglais"');
    console.log('  ✓ Test 10 : Complétion directe sur val(racine(phrase), phrase). propose français et anglais');
}

// Test 11 : Rename Provider - Renommer une variable locale / paramètre
{
    const renameProvider = new PscRenameProvider();
    const lines = [
        'MotTraduction = < français : chaîne, anglais : chaîne >',
        'Lexique = arbin(MotTraduction)',
        '',
        'Fonction traduction(mot : chaîne, phrase : Lexique) : chaîne',
        'Début',
        '    noeud ← racine(phrase)',
        '    Si non noeudVide(phrase, noeud) Alors :',
        '        trad ← val(phrase, noeud)',
        '        Si trad.français = mot Alors :',
        '            retourner trad.anglais',
        '        fsi',
        '    fsi',
        'Fin'
    ];
    const doc = createMockDocument(lines, 11);

    // Renommer le paramètre "mot" sur la ligne 3 (caractère 21)
    const pos = new mockVscode.Position(3, 21);
    const prep = renameProvider.prepareRename(doc, pos, {});
    assert.strictEqual(prep.placeholder, 'mot');

    const edit = renameProvider.provideRenameEdits(doc, pos, 'recherche', {});
    assert.ok(edit && edit.edits.length === 2, 'Doit renommer "mot" dans la signature et dans la comparaison');
    assert.strictEqual(edit.edits[0].newText, 'recherche');
    assert.strictEqual(edit.edits[1].newText, 'recherche');
    console.log('  ✓ Test 11 : Renommage du paramètre "mot" en "recherche" correctement scopé');
}

// Test 12 : Rename Provider - Renommer un champ de structure (ex: .français)
{
    const renameProvider = new PscRenameProvider();
    const lines = [
        'MotTraduction = < français : chaîne, anglais : chaîne >',
        'Lexique = arbin(MotTraduction)',
        '',
        'Fonction traduction(mot : chaîne, phrase : Lexique) : chaîne',
        'Début',
        '    trad ← val(phrase, noeud)',
        '    Si trad.français = mot Alors :',
        '        retourner trad.anglais',
        '    fsi',
        'Fin'
    ];
    const doc = createMockDocument(lines, 12);

    // Curseur sur "français" après "trad." ligne 6 (caractère 13)
    const pos = new mockVscode.Position(6, 13);
    const edit = renameProvider.provideRenameEdits(doc, pos, 'langueFr', {});
    assert.ok(edit && edit.edits.length === 2, 'Doit renommer la déclaration du champ et l\'accès trad.français');
    assert.strictEqual(edit.edits[0].newText, 'langueFr');
    assert.strictEqual(edit.edits[1].newText, 'langueFr');
    console.log('  ✓ Test 12 : Renommage d\'un champ de structure (.français -> .langueFr) sans impacter les variables');
}

// Test 13 : Rename Provider - Refus des mots réservés
{
    const renameProvider = new PscRenameProvider();
    const lines = [
        'Fonction f(x : entier) : entier',
        'Début',
        '    Si x = 0 Alors :',
        '        retourner 0',
        '    fsi',
        'Fin'
    ];
    const doc = createMockDocument(lines, 13);
    const posSi = new mockVscode.Position(2, 5); // sur "Si"

    assert.throws(() => {
        renameProvider.prepareRename(doc, posSi, {});
    }, /mot-clé ou une primitive/);
    console.log('  ✓ Test 13 : Refus de renommer les mots réservés (Si)');
}

console.log('===============================================================');
console.log('  TOUS LES TESTS DU COMPLETION PROVIDER ET RENAME ONT RÉUSSI !');
console.log('===============================================================');

