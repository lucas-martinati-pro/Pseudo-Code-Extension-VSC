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