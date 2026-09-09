# 🚀 Release v0.4.22 — PseudoCode Language Interpreter

### ✨ Nouveautés Majeures
- **Boucles `Pour chaque <var> dans <collection>` :**
  - Nouvelle syntaxe d'itération directe sur les collections (`ensemble`, `tableau`, `table`, `liste`, `chaîne`).
  - Prise en charge flexible des variantes syntaxiques : avec ou sans `Faire`, avec ou sans `:` (ex. `Pour chaque n dans ens_noeud :` ou `Pour chaque n dans ens_noeud Faire :`).
  - Itérateur universel Lua (`__psc_iter`) gérant automatiquement les tableaux indexés, les tables associatives, les TDA listes chaînées et les ensembles.
  - Linter en temps réel : intégration de la variable d'itération dans la portée lexicale, détection de fermeture de bloc (`fpour`) et vérification de la collection cible.
- **Nouveau type de données `ensemble` :**
  - Déclaration de premier ordre (`ens : ensemble`), dans le `Lexique` ou directement en ligne dans le corps de l'algorithme / des fonctions.
  - Coloration syntaxique TextMate, autocomplétion intelligente et documentation de survol.
- **Prédicat universel d'appartenance `estDans(col, element)` :**
  - Vérification instantanée de l'appartenance d'un élément à un ensemble, un domaine de table (`domaine(t)`), une table associative directe (`table`), une liste chaînée ou un tableau.
  - Retourne un booléen (`Vrai` / `Faux`).
- **Refactoring architectural — Source Unique de Vérité (`src/definitions.ts`) :**
  - Centralisation absolue des types, mots-clés, fonctions et méthodes dans un registre unique.
  - Autocomplétion (`BUILTIN_TYPES`), complétion contextuelle par point (`TYPE_METHODS` avec casse camelCase naturelle) et documentation Markdown de survol (`KEYWORD_DOCS`) générées dynamiquement.

### 🧪 Tests & Démonstrations
- **Tests natifs `.psc` dans `examples/` :**
  - Remplacement des tests JavaScript verbeux par du Pseudo-Code natif dans `examples/DEMO_POUR_CHAQUE_ET_ENSEMBLE.psc`.
  - Exécution et validation automatique de la transpilation, de la syntaxe Lua (`luac -p`) et de l'exécution (`lua`) via `npm test`.

### 🐛 Corrections
- **Déclarations de variables pures :** Prise en charge des déclarations inline (`ens_noeud : ensemble`) sans provoquer d'erreur de syntaxe Lua (`syntax error near ':'`).
- **Tolérance syntaxique de `Pour chaque` :** Isolation stricte de la collection même en cas d'omission de `Faire` avec deux-points terminaux.

---

# 🚀 Release v0.4.21 — PseudoCode Language Interpreter

### 🐛 Corrections
- **Snippets de fonctions & Tabulation :** Correction du bug provoquant la duplication des paramètres lors de l'utilisation de `Tab` après avoir tapé le nom d'une fonction (évite `(params)(params)`).
- **Complétion des en-têtes :** Suppression des suggestions parasites sur les lignes de déclaration (`Fonction`, `Procédure`, `Algorithme`) et exclusion de l'identifiant sous le curseur.
- **Tests :** Ajout de la suite de tests unitaires `test-completions.js` exécutable via `npm test`.

# 🚀 Release v0.4.2 — PseudoCode Language Interpreter

### ✨ Nouveautés & Corrections
- **Support des caractères accentués & spéciaux dans les identificateurs :**
  - Prise en charge des fonctions, procédures, paramètres et variables avec accents (ex. `aritéSymbole`, `évaluerOpération`).
  - Distinction stricte entre caractères accentués et non accentués (ex. `aritéSymbole` et `ariteSymbole` coexistent sans collision).
  - Encodage transparent vers Lua évitant toute erreur de syntaxe UTF-8 (`'(' expected near '<\195>'`).
- **Tests & Portabilité :**
  - Ajout des tests de validation dans `examples/MEGA_DEMO_COMPLEXE.psc` (Section 13).
  - Suite de tests 100 % portable exécutable via `npm test`.