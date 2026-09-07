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
    Location: class {}
};

Module.prototype.require = function (modulePath) {
    if (modulePath === 'vscode') {
        return mockVscode;
    }
    return originalRequire.apply(this, arguments);
};

// 2. Importer le provider compilé
const { PscCompletionProvider } = require('./out/completionProvider');

function createMockDocument(lines, version = 1) {
    return {
        uri: { toString: () => 'test://file.psc' },
        version,
        lineCount: lines.length,
        lineAt: (i) => ({ text: lines[i] }),
        getText: () => lines.join('\n')
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

console.log('===============================================================');
console.log('  TOUS LES TESTS DU COMPLETION PROVIDER ONT RÉUSSI !');
console.log('===============================================================');
