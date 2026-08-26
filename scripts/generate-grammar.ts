import * as fs from 'fs';
import * as path from 'path';
import { PSC_DEFINITIONS } from '../src/definitions';

/**
 * Générateur automatique de grammaire TextMate
 * Synchronise psc.tmLanguage.json avec definitions.ts pour éliminer la redondance
 */

// Remonter au dossier racine du projet (depuis out/scripts vers la racine)
const projectRoot = path.join(__dirname, '..', '..');
const grammarPath = path.join(projectRoot, 'syntaxes', 'psc.tmLanguage.json');

// Fonction pour parser JSON avec commentaires (JSONC)
function parseJSONC(content: string): any {
    // Retirer les commentaires de type // en début de ligne
    const withoutComments = content.replace(/^\/\/.*$/gm, '');
    return JSON.parse(withoutComments);
}

// Charger la grammaire existante pour conserver la structure
const grammarContent = fs.readFileSync(grammarPath, 'utf-8');
const grammar = parseJSONC(grammarContent);

// Extraire les mots-clés par type
const controlKeywords = PSC_DEFINITIONS.keywords
    .filter(k => k.type === 'control')
    .map(k => k.name);

const blockKeywords = PSC_DEFINITIONS.keywords
    .filter(k => k.type === 'block')
    .map(k => k.name);

const logicalOperators = PSC_DEFINITIONS.keywords
    .filter(k => k.type === 'operator')
    .map(k => k.name);

const ioKeywords = PSC_DEFINITIONS.keywords
    .filter(k => k.type === 'io')
    .map(k => k.name);

const modifierKeywords = PSC_DEFINITIONS.keywords
    .filter(k => k.type === 'modifier')
    .map(k => k.name);

// Extraire les fonctions et types
const supportFunctions = PSC_DEFINITIONS.functions.map(f => f.name);

// Séparer les types normaux de pile/file (traitement spécial)
const baseTypes = PSC_DEFINITIONS.types
    .filter(t => !['pile', 'file'].includes(t.name))
    .flatMap(t => t.aliases);

// Mettre à jour les patterns dans la grammaire
const repository = grammar.repository;

// Pattern d'identifiant Unicode (supporte les accents)
const IDENT_START = '[a-zA-Z\\u00C0-\\u024F_]';
const IDENT_CHAR = '[a-zA-Z0-9\\u00C0-\\u024F_]';

// 1. Mots-clés de contrôle + blocs (Début, Fin, etc.)
if (repository['keywords']) {
    const allKeywords = [...controlKeywords, ...blockKeywords]
        .filter(k => !['tant', 'que'].includes(k));
    repository['keywords'].match = `(?i)\\b(${allKeywords.join('|')}|Tant(?:\\s+que)|Sinon(?:\\s+si)|ftant)\\b`;
}

// 2. Opérateurs logiques
if (repository['logical-operators']) {
    repository['logical-operators'].match = `(?i)\\b(${logicalOperators.join('|')})\\b`;
}

// 3. Fonctions intégrées + I/O (écrire, lire)
if (repository['support-functions']) {
    const allFunctions = [...supportFunctions, ...ioKeywords];
    repository['support-functions'].match = `(?i)\\b(${allFunctions.join('|')})\\b`;
}

// 4. Types et modificateurs
if (repository['storage']) {
    const patterns = repository['storage'].patterns;

    // Mettre à jour le pattern des modificateurs (Lexique, InOut, etc.)
    const modifierPattern = patterns.find((p: any) => p.name === 'storage.modifier');
    if (modifierPattern) {
        modifierPattern.match = `(?i)\\b(${[...modifierKeywords, 'Lexique'].join('|')})\\b`;
    }

    // Mettre à jour le pattern des types de base (sans pile/file)
    const typePatternIndex = patterns.findIndex((p: any) =>
        p.name === 'storage.type' && p.match && p.match.includes('entier')
    );
    if (typePatternIndex !== -1) {
        patterns[typePatternIndex].match = `(?i)\\b(${baseTypes.join('|')}|listesym|InOut)\\b(?!\\s*\\()`;
    }
}

// 5. Constantes (Booléens)
if (repository['constants']) {
    const patterns = repository['constants'].patterns;
    const booleanKeywords = PSC_DEFINITIONS.keywords
        .filter(k => k.type === 'boolean')
        .map(k => k.name);

    const booleanPattern = patterns.find((p: any) => p.name === 'constant.language.boolean');
    if (booleanPattern) {
        booleanPattern.match = `(?i)\\b(${booleanKeywords.join('|')})\\b`;
    }
}

// 6. Mettre à jour les déclarations pour supporter Unicode
if (repository['declarations']) {
    const patterns = repository['declarations'].patterns;

    // Fonction
    const funcPattern = patterns.find((p: any) => p.begin && p.begin.includes('Fonction'));
    if (funcPattern) {
        funcPattern.begin = `(?i)^\\s*(Fonction)\\s+(${IDENT_START}${IDENT_CHAR}*)\\s*(\\()`;
    }

    // Algorithme
    const algoPattern = patterns.find((p: any) => p.match && p.match.includes('Algorithme'));
    if (algoPattern) {
        algoPattern.match = `(?i)^\\s*(Algorithme)(?:\\s+(${IDENT_START}${IDENT_CHAR}*))?`;
    }
}

// 7. Mettre à jour les appels de fonction pour supporter Unicode
if (repository['function-call']) {
    repository['function-call'].match = `(?i)\\b(?!(?:Si|Alors|Sinon|fsi|Pour|Faire|fpour|Tant(?:\\s+que)|ftq|ftant|Début|Fin|et|ou|non)\\b)(${IDENT_START}${IDENT_CHAR}*)(?=\\s*\\()`;
}

// 8. Mettre à jour les variables pour supporter Unicode
if (repository['variables']) {
    repository['variables'].match = `(?i)\\b(?!(?:Si|Alors|Sinon|fsi|Pour|Faire|fpour|Tant(?:\\s+que)|ftq|ftant|Début|Fin|et|ou|non)\\b)[a-zA-Z\\u00C0-\\u024F_][a-zA-Z0-9\\u00C0-\\u024F_]*\\b`;
}

// 9. Mettre à jour la boucle for pour supporter Unicode
if (repository['for-loop']) {
    repository['for-loop'].begin = `(?i)\\b(Pour)\\s+(${IDENT_START}${IDENT_CHAR}*)\\s+(de|allant\\s+de)\\b`;
}

// 10. Mettre à jour la détection de type après deux-points pour supporter Unicode
if (repository['storage']) {
    const patterns = repository['storage'].patterns;
    const typeAfterColonPattern = patterns.find((p: any) =>
        p.name === 'storage.type' && p.match && p.match.includes('(?<=:)')
    );
    if (typeAfterColonPattern) {
        typeAfterColonPattern.match = `(?i)(?<=:)\\s*([A-Z\\u00C0-\\u024F]${IDENT_CHAR}*)\\b(?!\\s*\\()`;
    }

    // Entity name type declaration
    const entityPattern = patterns.find((p: any) => p.name === 'entity.name.type.declaration');
    if (entityPattern) {
        entityPattern.match = `^\\s*([A-Z\\u00C0-\\u024F]${IDENT_CHAR}*)\\s*=`;
    }
}

// Opérateurs Unicode (≤, ≥, ≠, ←, →)
if (repository['operators-comparison']) {
    repository['operators-comparison'].match = '(≤|≥|≠|<=|>=|!=|<>|=/|=|<|>|\\.\\.)';
}

if (repository['operators-assignment']) {
    repository['operators-assignment'].match = '(←|→)';
}

const grammarJson = JSON.stringify(grammar, null, 2);
fs.writeFileSync(grammarPath, grammarJson, 'utf-8');

console.log('✓ Grammaire TextMate mise à jour avec succès !');
console.log(`  - ${controlKeywords.length + blockKeywords.length} mots-clés de contrôle/bloc`);
console.log(`  - ${supportFunctions.length} fonctions intégrées`);
console.log(`  - ${ioKeywords.length} fonctions I/O`);
console.log(`  - ${baseTypes.length} types de base`);
console.log(`  - Support Unicode pour les identifiants activé`);
