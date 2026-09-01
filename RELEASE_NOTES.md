# 🚀 Release v0.3.0 — PseudoCode Language Interpreter

Cette version **v0.3.0** apporte une refonte majeure du moteur de l'extension, enrichit considérablement le support des structures de données (TDA), optimise le linter en temps réel et ajoute le support officiel pour **VSCodium** et l'installation manuelle via `.vsix`.

---

## ✨ Nouveautés & Fonctionnalités Clés

### 🏗️ Support étendu des Types Abstraits de Données (TDA)
- **Structures composites & types avancés :** Support complet des Piles, Files, Listes Symétriques, Tableaux associatifs et Structures composites.
- **Fonctions intégrées enrichies :** Plus de 58 fonctions natives disponibles avec vérification d'arité et typage automatique.
- **Comparaison d'égalité composite :** Comparaison profonde et manipulation optimisée des structures.

### 🎨 Coloration Syntaxique & Grammaire Améliorée
- **Générateur automatique TextMate :** Coloration précise des mots-clés de structure, types de données, variables et fonctions.
- **Support Unicode étendu :** Prise en charge transparente des identifiants avec accents et caractères spéciaux français.
- **Remplacement automatique des symboles :**
  - `<-` → `←`
  - `<=` → `≤`
  - `>=` → `≥`
  - `!=` ou `=/` → `≠`

### ⚡ Exécution & Transpileur Optimisés
- **Nouveau gestionnaire I/O :** Amélioration des fonctions `lire()` et `écrire()` avec typage dynamique fluide.
- **Support des parenthèses imbriquées :** Analyse syntaxique robuste pour les appels de fonctions complexes et initialisations de données.
- **Gestion automatique des fichiers temporaires :** Nettoyage silencieux des fichiers d'exécution.

### 🔍 Diagnostic & Linter en Temps Réel
- Détection instantanée des blocs mal fermés (`Si`/`fsi`, `Pour`/`fpour`, etc.).
- Analyse des variables composites et suggestions en direct dans l'éditeur.

---

## 📦 Installation & Compatibilité

### Sur Visual Studio Code :
Installez l'extension directement depuis la [Marketplace Visual Studio](https://marketplace.visualstudio.com/items?itemName=LucasM54.PseudoCode-Interpreter) ou recherchez `PseudoCode-Interpreter` dans l'onglet Extensions (`Ctrl+Shift+X`).

### Sur VSCodium / Installation Manuelle (.VSIX) :
1. Téléchargez le fichier **`pseudocode-interpreter-0.3.0.vsix`** ci-dessous (section *Assets*).
2. Dans VSCodium (ou VS Code), ouvrez l'onglet **Extensions** (`Ctrl+Shift+X`).
3. Cliquez sur le menu `···` en haut à droite > **Installer depuis un VSIX...** (*Install from VSIX...*).
4. Sélectionnez le fichier téléchargé.

*(Ou en ligne de commande : `codium --install-extension pseudocode-interpreter-0.3.0.vsix`)*

---

## 🛠️ Journal des Modifications Techniques (Changelog)

- **Architecture :** Modularisation du code source (`src/services/`, `src/autoEdits/`, `src/definitions.ts`).
- **CI/CD :** Ajout du pipeline GitHub Actions pour la compilation et publication automatisée des releases.
- **Compatibilité :** Mise à jour du moteur VS Code (`^1.104.0`) et ajout d'`activationEvents` explicites pour une activation instantanée.
