# Guide d'extension du langage Pseudo-Code (PSC)

## 📝 Source unique de vérité : `src/definitions.ts`

Toutes les définitions du langage (**types**, **mots-clés**, **fonctions intégrées** et **méthodes par type**) sont centralisées dans **`src/definitions.ts`**.  
C'est le **seul fichier** de configuration du langage que vous devez modifier pour ajouter de nouvelles fonctionnalités.

---

## 1️⃣ Ajouter une nouvelle fonction ou méthode

Ouvrez `src/definitions.ts` et ajoutez votre fonction dans l'array `functions` :

```typescript
functions: [
    // ... fonctions existantes ...
    
    { 
        name: 'maFonction',                 // Nom en minuscules
        arity: 2,                           // Nombre de paramètres attendus (ou [1, 2]optionnel)
        luaHelper: '__psc_ma_fonction',     // Nom de la fonction Lua helper dans constants.ts
        isMutator: false,                   // true si modifie le 1er argument (ex: ajoutTable)
        description: 'Description claire de la fonction',
        signature: 'maFonction(x, y) : type',
        snippet: 'maFonction(${1:x}, ${2:y})',
        category: 'MaCatégorie',
        targetType: 'monType'               // (Optionnel) Associe la fonction comme méthode pour ce type lors de la complétion 'var.' !
    }
]
```

### Paramètres :
- `name` : Nom en minuscules (insensible à la casse dans PSC).
- `arity` : Nombre de paramètres ou tableau d'arités acceptées.
- `luaHelper` : Helper Lua exécutant la fonction.
- `targetType` *(optionnel)* : Nom du type (ou tableau de types `['typeA', 'typeB']`) auquel rattacher la fonction pour la complétion contextuelle par point (`var.maFonction`).
- `methodSnippet` *(optionnel)* : Snippet adapté pour l'appel sous forme de méthode (par défaut `${name}(\${VAR}, ...)`).

Si nécessaire, ajoutez l'implémentation Lua du helper dans `src/constants.ts` (`LUA_HELPERS`).

---

## 2️⃣ Ajouter un nouveau type de données

Dans `src/definitions.ts`, ajoutez une entrée dans l'array `types` :

```typescript
types: [
    // ... types existants ...
    { 
        name: 'graphe', 
        aliases: ['graphe'], 
        description: 'Graphe orienté ou non (TDA)' 
    }
]
```

**Automatiquement** :
- ✅ Proposé dans l'autocomplétion des types (`BUILTIN_TYPES`).
- ✅ Reconnu par la grammaire TextMate (`storage.type`).
- ✅ Reconnu par le Linter (pas d'erreur "identifiant non déclaré").
- ✅ Compatible avec la complétion contextuelle par point (`resolveBaseType`).

---

## 3️⃣ Ajouter un nouveau mot-clé

Dans `src/definitions.ts`, ajoutez une entrée dans l'array `keywords` :

```typescript
keywords: [
    // ... mots-clés existants ...
    { 
        name: 'repeter', 
        type: 'control', 
        luaEquivalent: 'repeat', 
        description: '**Répéter** — Boucle avec test en fin de bloc' 
    }
]
```

**Automatiquement** :
- ✅ Coloration syntaxique mise à jour par la génération de grammaire TextMate.
- ✅ Documentation Markdown affichée au survol (Hover).
- ✅ Complétion intelligente et exclusion automatique des variables tableaux.

---

## 4️⃣ Écrire des tests : Fichiers `.psc` dans `examples/`

**Ne créez pas de scripts de test JavaScript verbeux !**  
Pour tester une nouvelle syntaxe ou fonctionnalité, écrivez directement du Pseudo-Code natif :

1. Créez un fichier `.psc` dans le dossier `examples/` (par exemple `examples/TEST_MA_FONCTIONNALITE.psc`).
2. Écrivez votre algorithme PSC complet avec déclarations, boucles, appels et affichages `écrire(...)`.
3. Lancez la suite de tests :
   ```bash
   npm test
   ```
   Le script `test-all-files.js` découvre **automatiquement** tous les fichiers `.psc` dans `examples/`, les transpile vers Lua, vérifie la syntaxe avec `luac -p` et valide leur exécution complète avec `lua`.

---

## 🔄 Cycle de développement

```bash
# 1. Compiler le code TypeScript et régénérer la grammaire TextMate
npm run compile

# 2. Exécuter tous les tests (fichiers .psc dans examples/ inclus)
npm test
```

---

## 📚 Architecture

```
src/definitions.ts (SOURCE UNIQUE DE VÉRITÉ)
    │
    ├──► scripts/generate-grammar.ts ──► syntaxes/psc.tmLanguage.json (Coloration)
    ├──► src/constants.ts            ──► KNOWN_IDENTIFIERS & TYPE_MAPPING
    ├──► src/completionProvider.ts   ──► Complétions types, méthodes, mots-clés, hover
    ├──► src/diagnostics.ts          ──► Linter temps réel & vérification d'arité
    └──► src/executor.ts             ──► Transpilation Lua & exécution
```
