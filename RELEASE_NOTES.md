# 🚀 Release v0.4.0 — PseudoCode Language Interpreter

Cette version **v0.4.0** est une mise à jour majeure axée sur la **robustesse du transpileur d'exécution**, le **scoping strict des variables locales et de récursion**, le **support avancé des tableaux multidimensionnels avec bornes personnalisées**, la **génération automatique des constructeurs de structures composites**, ainsi que l'enrichissement de l'autocomplétion, du survol (Hover) et du linter.

---

## ✨ Nouveautés & Améliorations Majeures

### 🧠 Scoping Strict des Variables Locales & Fonctions Récursives
- **Scoping par fonction :** Les variables locales et variables d'index de boucle sont déclarées localement (`local var`) au sommet de chaque fonction.
- **Isolation de la récursion :** Les appels récursifs (ex: Triangle de Pascal, Hanoï, Factorielle, QuickSort) ne partagent plus d'espace mémoire global et n'écrasent plus leurs variables locales.
- **Support des paramètres `InOut` :** Réaffectation automatique des variables passées par référence lors des retours de fonctions.

### 🔢 Tableaux à Bornes Libres & Matrices Multidimensionnelles
- **Indices de départ personnalisés :** Déclaration et indexation de tableaux avec n'importe quelle borne :
  - 0-based : `tab ← tableau entier[0 .. n - 1]`
  - 1-based : `tab ← tableau entier[1 .. n]`
  - Bornes relatives / négatives : `tab ← tableau entier[-5 .. 5]`
- **Matrices multidimensionnelles à bornes hétérogènes :** `M ← tableau entier[1 .. 3, 0 .. 5]` avec instanciation automatique des sous-tables Lua et conversion des accès `M[i, j]`.
- **Récursivité sur les indices imbriqués :** `a[b[i]]` transforme correctement tous les niveaux d'accès.
- **Protection des chaînes et mots-clés :** `retourner [1, 2]` et les chaînes contenant des crochets (`"élément [0]"`) sont préservés fidèlement.

### 🏗️ Types Composites (Enregistrements / Structures)
- **Génération automatique de constructeurs :** La déclaration `Etudiant = < nom : chaîne, age : entier >` crée automatiquement le constructeur `Etudiant(nom, age)`.
- **Affectation de propriétés d'objets :** Prise en charge des assignations de champs (`p.age = 20`, `tab[i].val = 5`).

### 📦 TDAs Complets & Prêts à l'Emploi
- **TDA Liste :** `listeVide`, `ajoutTeteListe`, `ajoutQueueListe`, `val`, `suc`, `finListe`, `longueurListe`, `acces`.
- **TDA Pile (LIFO) :** `pileVide`, `empiler`, `depiler`, `sommet`, `estVidePile`.
- **TDA File (FIFO) :** `fileVide`, `enfiler`, `defiler`, `premier`, `estVideFile`.
- **TDA Liste Symétrique :** `videLS`, `ajoutTeteLS`, `ajoutQueueLS`, `teteLS`, `queueLS`, `sucLS`, `precLS`, `suppressionLS`.
- **TDA Table (Map / Dictionnaire) :** `Table("clé" → "valeur")`, `ajoutTable`, `suppressionTable`, `changeTable`, `accesTable`, `domaineTable`, `estDans`.

### 🔍 Diagnostic & Linter Zéro Faux Positif
- **Reconnaissance des en-têtes `Algorithme <Nom>` et `Lexique` :** Plus de faux avertissement sur le nom de l'algorithme.
- **Support de tous les opérateurs d'affectation :** Prise en charge transparente de `←`, `<-` et `=`.
- **Enrichissement de `KNOWN_IDENTIFIERS` :** Intégration automatique de toutes les fonctions de la bibliothèque standard dans le linter.

### 💡 Autocomplétion, Hover & IntelliSense
- **Hover sur fonctions intégrées :** Affichage de la documentation, de la signature et de la description au survol de la souris.
- **Go to Definition :** Navigation vers la déclaration des fonctions et types personnalisés.
- **Déduplication des suggestions :** Nettoyage des doublons (`écrire`, `lire`) dans la complétion.

---

## 📦 Installation & Compatibilité

### Sur Visual Studio Code :
Installez l'extension directement depuis la [Marketplace Visual Studio](https://marketplace.visualstudio.com/items?itemName=LucasM54.PseudoCode-Interpreter) ou recherchez `PseudoCode-Interpreter` dans l'onglet Extensions (`Ctrl+Shift+X`).

### Sur VSCodium / Installation Manuelle (.VSIX) :
1. Téléchargez le fichier **`pseudocode-interpreter-0.4.0.vsix`** ci-dessous (section *Assets*).
2. Dans VSCodium (ou VS Code), ouvrez l'onglet **Extensions** (`Ctrl+Shift+X`).
3. Cliquez sur le menu `···` en haut à droite > **Installer depuis un VSIX...** (*Install from VSIX...*).
4. Sélectionnez le fichier téléchargé.

---

## 🧪 Benchmark & Fichier de Démonstration

Un fichier complet de benchmark regroupant toutes les fonctionnalités et algorithmes avancés est disponible dans le dépôt :
📁 **`examples/MEGA_DEMO_COMPLEXE.psc`**
