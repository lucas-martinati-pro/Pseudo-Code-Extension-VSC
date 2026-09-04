# 🚀 Release v0.4.1 — PseudoCode Language Interpreter

Cette mise à jour apporte des améliorations majeures sur l'architecture du langage, la fiabilité des diagnostics, l'expérience de frappe avec l'indentation automatique native, et la personnalisation de l'extension via de nouveaux paramètres utilisateurs.

---

## ✨ Nouveautés & Améliorations Majeures

### 🏗️ Architecture Centralisée & Source Unique de Vérité (SSOT)
- **Registre des définitions centralisé (`src/definitions.ts`) :** Définition unifiée de tous les mots-clés, types, opérateurs, fonctions standards (avec arités, descriptions, signatures, équivalents et helpers Lua).
- **Gestionnaire déclaratif des blocs (`src/blocks.ts`) :** Définition centralisée des structures de contrôle (`Si`, `Pour`, `Tant que`, `Début`...), de leurs continuations (`Sinon`, `Sinon si`), de leurs patterns d'ouverture/fermeture et de leurs snippets associés.
- **Génération automatique de la grammaire TextMate (`scripts/generate-grammar.ts`) :** La syntaxe de coloration (`syntaxes/psc.tmLanguage.json`) est désormais générée automatiquement à partir des définitions TypeScript lors du `npm run compile`. Cela garantit une synchronisation parfaite et élimine tout risque de divergence entre coloration, autocomplétion et exécution.

---

### 🔍 Linter Intelligent & Stratégie "Search-and-Recover"
- **Analyse robuste de la pile de blocs :** Le linter analyse désormais la structure imbriquée des blocs avec un algorithme intelligent de récupération (*search-and-recover*).
- **Précision chirurgicale des erreurs :** Si un mot-clé de fermeture ne correspond pas au bloc attendu, le linter remonte la pile pour identifier les blocs intermédiaires non fermés et surligne directement la ligne d'ouverture manquante (au lieu de déclencher des erreurs en cascade sur le reste du fichier).
- **Détection des fermants orphelins :** Détection et signalement clairs des fermetures inattendues (ex: un `fsi` sans aucun `Si` ouvert).

---

### ⚡ Indentation Automatique Native (`onEnterRules` & Formateur)
- **Indentation automatique à la frappe :** Configuration native via l'API VS Code (`setLanguageConfiguration`) pour indenter automatiquement le curseur lors de l'appui sur `Entrée` après une ligne d'ouverture (`Début`, `Alors`, `Faire`, `Sinon`, `Sinon si`, `Lexique`).
- **Gestion de la dé-indentation (*outdent*) :** Réduction immédiate et fluide du niveau d'indentation lors de la saisie des mots-clés de fermeture (`fsi`, `fpour`, `ftq`, `Fin`, `Sinon`).
- **Affinage du formateur de document (`Alt + Maj + F`) :** Prise en compte améliorée des en-têtes avec deux-points optionnels, des clauses alternatives et des commentaires en bout de ligne.

---

### 💡 IntelliSense & Autocomplétion Contextuelle Affinée
- **Complétion ultra-contextuelle :** 
  - Après `:` : suggestion des types uniquement en contexte de déclaration (évite les suggestions parasites après `Alors :`, `Faire :`, etc.).
  - Fin d'en-tête de bloc : neutralisation des propositions non pertinentes lorsque l'utilisateur s'apprête à passer à la ligne.
- **Fermeture intelligente de blocs :** Proposition dynamique des fermetures adaptées aux blocs ouverts (ex: *« Ferme le Si de la ligne X »*), positionnées intelligemment sans pré-sélection bloquante pour ne pas interférer avec la frappe naturelle.

---

### ⚙️ Paramètres Utilisateur & Synchronisation en Temps Réel
Trois nouveaux paramètres de configuration font leur apparition dans les paramètres VS Code (`psc.*`) avec prise en compte instantanée à chaud :
- **`psc.execution.enabled`** *(booléen, défaut: `true`)* : Active ou désactive le bouton et la commande d'exécution du pseudo-code.
- **`psc.linter.enabled`** *(booléen, défaut: `true`)* : Active ou désactive l'analyse statique et efface immédiatement les marqueurs d'erreur en cas de désactivation.
- **`psc.intellisense.enabled`** *(booléen, défaut: `true`)* : Permet de désactiver/activer à la volée tous les fournisseurs d'autocomplétion, hover, signature et navigation vers les définitions.

---

### 🛠️ Guide Développeur & Outils de Contribution
- **Documentation complète dans le `README.md` :** Ajout d'une section exhaustive pour les contributeurs détaillant l'architecture du projet, les commandes de build (`compile`, `generate-grammar`, `package`), le lancement de l'hôte d'extension (`F5`) et les tests en ligne de commande de la méga-démo (`examples/MEGA_DEMO_COMPLEXE.psc`).

---

## 📦 Installation & Mise à Jour

### Sur Visual Studio Code :
L'extension se met à jour automatiquement. Vous pouvez également la retrouver sur le [Marketplace Visual Studio](https://marketplace.visualstudio.com/items?itemName=LucasM54.PseudoCode-Interpreter) ou dans l'onglet Extensions (`Ctrl+Shift+X`) en cherchant `PseudoCode-Interpreter`.

### Sur VSCodium / Installation Manuelle (.VSIX) :
1. Téléchargez le fichier `.vsix` joint à cette release (section *Assets* ci-dessous).
2. Dans VS Code ou VSCodium, ouvrez l'onglet **Extensions** (`Ctrl+Shift+X`).
3. Cliquez sur le menu `···` (en haut à droite) > **Installer depuis un VSIX...** (*Install from VSIX...*).
