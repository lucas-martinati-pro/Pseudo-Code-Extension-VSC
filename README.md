<div align="center">

<img src="icons/extension-logo.png" alt="PseudoCode Logo" width="128" height="128" />

# Pseudo-Code Language Interpreter (PSC)

**L'environnement de développement intégré (IDE) complet pour l'algorithmique en français dans VS Code et VSCodium.**

[![Version](https://img.shields.io/visual-studio-marketplace/v/LucasM54.PseudoCode-Interpreter?style=for-the-badge&logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=LucasM54.PseudoCode-Interpreter)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/LucasM54.PseudoCode-Interpreter?style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=LucasM54.PseudoCode-Interpreter)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/LucasM54.PseudoCode-Interpreter?style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=LucasM54.PseudoCode-Interpreter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-100%25%20Passing-success?style=for-the-badge&logo=githubactions)](examples/)

<p align="center">
  <a href="#-fonctionnalités-phares">Fonctionnalités</a> •
  <a href="#-guide-de-démarrage-rapide">Démarrage Rapide</a> •
  <a href="#-référence-complète-de-la-syntaxe">Syntaxe PSC</a> •
  <a href="#-types-de-données-abstraits-tda">TDA & Primitives</a> •
  <a href="#-snippets-de-code-intelligents">Extraits (Snippets)</a> •
  <a href="#-configuration--raccourcis">Configuration</a> •
  <a href="#-prérequis-pour-lexécution">Prérequis & Installation</a>
</p>

![Aperçu de l'extension Pseudo-Code](images/preview.png)

</div>

---

## 🌟 Pourquoi cette extension ?

Contrairement aux simples colorateurs de texte, **PseudoCode Language Interpreter** offre une véritable chaîne d'outils professionnelle adaptée à l'apprentissage et à l'enseignement de l'informatique (Lycée, BTS, BUT Informatique, CPGE, Licence) :

- ⚡ **Exécution instantanée en 1 clic :** Plus besoin de réécrire vos algorithmes en Python ou C pour les tester. Cliquez sur ▶️ et voyez le résultat s'afficher immédiatement dans le terminal !
- 🛡️ **Analyse de diagnostics en temps réel (Linter) :** Détecte à la frappe les blocs mal fermés (`Si` sans `fsi`), les fermetures orphelines, les variables non déclarées et les erreurs d'arité dans les appels de fonctions.
- 💡 **IntelliSense complet :** Autocomplétion contextuelle, aide à la signature des paramètres, documentation au survol (Hover), navigation vers la définition (`Ctrl+Clic` / `F12`) et exploration de symboles dans la vue Outline.
- ⌨️ **Remplacement automatique des symboles mathématiques :** Tapez `<-`, `<=`, `>=`, `!=` et ils se transforment automatiquement en `←`, `≤`, `≥`, `≠` !
- 📐 **Formatage automatique de code (`Alt + Maj + F`) :** Réindente parfaitement les blocs, les structures de contrôle et les fonctions en respectant les standards académiques.
- 🌳 **Bibliothèque complète de TDA (Types de Données Abstraits) :** Arbres Binaires récursifs, Listes chaînées, Piles LIFO, Files FIFO, Listes Symétriques, Tables associatives (HashMaps) et Ensembles.

---

## 📑 Sommaire

- [Fonctionnalités Phares](#-fonctionnalités-phares)
- [Guide de Démarrage Rapide](#-guide-de-démarrage-rapide)
- [Référence Complète de la Syntaxe](#-référence-complète-de-la-syntaxe)
  - [Structure d'un Algorithme](#1-structure-d-un-algorithme)
  - [Mots-clés Réservés](#2-mots-clés-réservés)
  - [Types de Données](#3-types-de-données)
  - [Opérateurs & Symboles Automatiques](#4-opérateurs--symboles-automatiques)
  - [Structures de Contrôle](#5-structures-de-contrôle)
  - [Tableaux & Matrices](#6-tableaux--matrices)
  - [Fonctions, Procédures & Paramètres InOut](#7-fonctions-procédures--paramètres-inout)
  - [Types Composites (Structures)](#8-types-composites-structures)
- [Types de Données Abstraits (TDA) & Primitives](#-types-de-données-abstraits-tda)
  - [Arbres Binaires (`arbin`, `noeud`)](#-arbres-binaires-arbin-noeud)
  - [Piles LIFO (`pile`)](#-piles-lifo-pile)
  - [Files FIFO (`file`)](#-files-fifo-file)
  - [Listes Chaînées (`liste`)](#-listes-chaînées-liste)
  - [Listes Symétriques (`listesym`)](#-listes-symétriques-listesym)
  - [Tables Associatives / Dictionnaires (`table`)](#-tables-associatives--dictionnaires-table)
  - [Ensembles (`ensemble`)](#-ensembles-ensemble)
  - [Fichiers Entrées/Sorties (`fichier`)](#-fichiers-entréessorties-fichier)
  - [Opérations sur Chaînes & Utilitaires](#-opérations-sur-chaînes--utilitaires)
- [Snippets de Code Intelligents](#-snippets-de-code-intelligents)
- [Configuration & Raccourcis Clavier](#-configuration--raccourcis-clavier)
- [Prérequis pour l'Exécution (Lua)](#-prérequis-pour-lexécution)
- [Guide d'Installation](#-guide-dinstallation)
- [Développement & Tests](#-développement--tests)
- [Licence](#-licence)

---

## 🚀 Fonctionnalités Phares

### 1. Exécution Instantanée du Code (Play ▶️ / `Ctrl+F5`)
Exécutez vos fichiers `.psc` directement dans VS Code. L'extension transpile à la volée le pseudo-code vers un interpréteur optimisé et affiche les entrées/sorties en temps réel dans le terminal intégré.

![Démonstration de l'exécution](images/execution.png)

### 2. Linter & Diagnostics en Temps Réel
Ne cherchez plus des heures les erreurs de syntaxe :
- Soulignement immédiat des **blocs non fermés** (ex. `Pour` oublié sans son `fpour`).
- Détection des **mots-clés de fermeture inattendus** ou mal appariés.
- Contrôle de la **portée lexicale** et alerte sur les identifiants inconnus.
- Vérification du **nombre d'arguments (arité)** sur les fonctions et primitives intégrées.

### 3. IntelliSense, Survol (Hover) & Définition
- **Autocomplétion intelligente :** Propose les mots-clés, types, fonctions, variables locales/globales et champs de structures.
- **Complétion par point (`.`):** Tapez `arbre.` ou `liste.` pour découvrir instantanément toutes les méthodes applicables au type de votre variable.
- **Aide à la signature (Signature Help) :** Affiche la liste des arguments attendus lors de la frappe d'un appel de fonction `maFonction(`.
- **Aller à la définition (`Ctrl+Clic` / `F12`) :** Sautez instantanément à la déclaration d'une fonction, variable ou type composite.

### 4. Remplacement Automatique des Symboles Mathématiques
L'extension convertit vos frappes standard en symboles algorithmiques élégants à la volée (dans le code hors chaînes et commentaires) :
- `<-` devient automatiquement **`←`** (affectation)
- `<=` devient automatiquement **`≤`** (inférieur ou égal)
- `>=` devient automatiquement **`≥`** (supérieur ou égal)
- `!=` ou `=/` devient automatiquement **`≠`** (différent de)

### 5. Formatage Intelligent de Code (`Alt + Maj + F`)
Réaligne tout le document en un instant avec des indentations logiques pour chaque bloc de code (`Début/Fin`, `Si/fsi`, `Pour/fpour`, `Tant que/ftq`, `Lexique`).

---

## ⚡ Guide de Démarrage Rapide

1. Créez un nouveau fichier nommé `test.psc`.
2. Tapez `algo` et appuyez sur `Tab` : un squelette d'algorithme complet apparaît.
3. Écrivez votre algorithme, par exemple :

```psc
Algorithme Salutation
Début
    écrire("Quel est votre prénom ?")
    nom ← lire()
    écrire("Bonjour, ", nom, " ! Bienvenue dans Pseudo-Code IDE.")

    Pour i de 1 à 3 Faire :
        écrire("Compteur : ", i)
    fpour
Fin

/*
Lexique :
    nom : chaîne
    i : entier
*/
```

4. Cliquez sur le bouton **▶️** en haut à droite de l'éditeur (ou appuyez sur `Ctrl+F5`) pour exécuter !

---

## 📖 Référence Complète de la Syntaxe

### 1. Structure d'un Algorithme

Un programme en pseudo-code se compose généralement d'un **Algorithme** principal, éventuellement précédé ou suivi de **Fonctions**, et d'un bloc **Lexique** déclarant les variables.

```psc
Algorithme MonAlgorithme
Début
    // Instructions exécutées
    écrire("Hello World!")
Fin

/*
Lexique :
    x, y : entier
    message : chaîne
*/
```

> [!TIP]
> Le bloc `Lexique` peut être écrit sous forme de commentaire multiligne `/* Lexique : ... */` ou directement dans le code `Lexique :`. Les déclarations de variables en ligne (`Soit x = 5` ou `x : entier`) sont également pleinement supportées.

---

### 2. Mots-clés Réservés

| Catégorie | Mots-clés |
| :--- | :--- |
| **Structure & Blocs** | `Algorithme`, `Fonction`, `Début`, `Fin`, `Lexique`, `Soit` |
| **Conditions** | `Si`, `Alors`, `Sinon si`, `Sinon`, `fsi` |
| **Boucles** | `Pour`, `de`, `à`, `Faire`, `fpour`, `décroissant`, `Pour chaque`, `dans`, `Tant que`, `ftq`, `ftant` |
| **Fonctions** | `retourner`, `retourne`, `InOut` |
| **Entrées / Sorties** | `écrire`, `lire` |
| **Constantes / Logique**| `vrai`, `faux`, `nil`, `et`, `ou`, `non`, `mod` |

---

### 3. Types de Données

#### Types Simples

| Type | Variantes acceptées | Description | Exemple |
| :--- | :--- | :--- | :--- |
| `entier` | `entier` | Nombre entier relatif | `age : entier` |
| `réel` | `réel`, `reel` | Nombre décimal à virgule flottante | `moyenne : réel` |
| `booléen`| `booléen`, `booleen` | Valeur booléenne (`vrai` ou `faux`) | `estValide : booléen` |
| `caractère` | `caractère`, `caractere` | Caractère unique entre guillemets ou apostrophes | `lettre : caractère` |
| `chaîne` | `chaîne`, `chaine` | Chaîne de caractères UTF-8 | `nom : chaîne` |

#### Types Structurés & TDA

| Type | Description | Déclaration type |
| :--- | :--- | :--- |
| `tableau` | Tableau unidimensionnel, multidimensionnel (matrice) | `tab ← tableau entier[0..9]` ou `[1, 2, 3]` |
| `arbin` | Arbre binaire abstrait (TDA) | `arbre : arbin[entier]` ou `arbre : ArbreBinaire` |
| `noeud` | Référence de nœud d'arbre binaire | `n : Noeud` (ou `nil`) |
| `liste` | Liste simplement chaînée (TDA) | `l : liste` |
| `listesym` | Liste symétrique / doublement chaînée (TDA) | `ls : listesym` |
| `pile` | Pile LIFO (TDA) | `p : pile` |
| `file` | File FIFO (TDA) | `f : file` |
| `table` | Dictionnaire / Table associative clé→valeur | `annuaire : table` |
| `ensemble` | Ensemble d'éléments uniques | `ens : ensemble` |
| `fichier` | Descripteur de fichier d'entrées/sorties | `handle : fichier` |

---

### 4. Opérateurs & Symboles Automatiques

| Opération | Symbole | Raccourci tapé | Exemple |
| :--- | :---: | :---: | :--- |
| **Affectation** | `←` | `<-` | `x ← 10` |
| **Égalité** | `=` | `=` | `Si x = 10 Alors` |
| **Différence** | `≠` | `!=` ou `=/` | `Si x ≠ 0 Alors` |
| **Inférieur / Supérieur** | `<`, `>` | `<`, `>` | `Si a < b Alors` |
| **Inférieur ou égal** | `≤` | `<=` | `Si a ≤ b Alors` |
| **Supérieur ou égal** | `≥` | `>=` | `Si a ≥ b Alors` |
| **Conjonction logique** | `et` | `et` | `Si (a > 0) et (b > 0) Alors` |
| **Disjonction logique** | `ou` | `ou` | `Si (a = 0) ou (b = 0) Alors` |
| **Négation logique** | `non` | `non` | `Si non finListe(l, p) Alors` |
| **Modulo (reste division)**| `mod` | `mod` | `reste ← 17 mod 5` *(vaut 2)* |
| **Division entière** | `÷` | `/` ou `÷` | `quotient ← 17 ÷ 5` *(vaut 3)* |
| **Appartenance** | `estDans` | - | `Si estDans(ens, "alpha") Alors` |

---

### 5. Structures de Contrôle

#### Condition `Si / Sinon si / Sinon / fsi`
```psc
Si note ≥ 16 Alors :
    écrire("Très bien")
Sinon si note ≥ 10 Alors :
    écrire("Admis")
Sinon :
    écrire("Ajourné")
fsi
```

#### Boucle `Pour ... de ... à ... Faire / fpour`
```psc
// Boucle croissante
Pour i de 0 à 9 Faire :
    écrire("Indice : ", i)
fpour

// Boucle décroissante
Pour i de 10 à 1 décroissant Faire :
    écrire("Compte à rebours : ", i)
fpour
```

#### Boucle `Pour chaque ... dans ... Faire / fpour`
Itérez directement sur les éléments d'une collection (ensemble, tableau, table ou liste) :
```psc
Pour chaque s dans ["Paris", "Lyon", "Marseille"] Faire :
    écrire("Ville : ", s)
fpour
```

#### Boucle `Tant que ... Faire / ftq`
```psc
Tant que cpt > 0 Faire :
    écrire("Valeur : ", cpt)
    cpt ← cpt - 1
ftq
```

---

### 6. Tableaux & Matrices

L'interpréteur PSC supporte les tableaux **0-based**, **1-based**, à **bornes négatives**, les **tableaux littéraux**, ainsi que les **matrices 2D** :

```psc
// Tableau 1D avec bornes personnalisées [-5 .. 5]
tabTemp ← tableau réel[-5 .. 5]
tabTemp[0] ← 21.5

// Matrice 2D (3 lignes x 4 colonnes, indexées de 1 à 3 et 1 à 4)
grille ← tableau entier[1 .. 3, 1 .. 4]
grille[2, 3] ← 42

// Tableau littéral
nombres ← [10, 20, 30, 40, 50]
écrire("Premier : ", nombres[0], " - Longueur : ", longueur(nombres))
```

> [!NOTE]
> Les tableaux passés en paramètre avec des bornes dynamiques variables (ex. `tab InOut : Tableau entier[bas..haut]`) sont automatiquement résolus sans décalage d'indice.

---

### 7. Fonctions, Procédures & Paramètres InOut

#### Fonction avec retour typé
```psc
Fonction factorielle(n : entier) : entier
Début
    Si n ≤ 1 Alors :
        retourner 1
    Sinon :
        retourner n * factorielle(n - 1)
    fsi
Fin
```

#### Procédure avec passage par référence (`InOut`)
Le mot-clé `InOut` permet de modifier directement les variables de l'appelant :

```psc
Fonction echanger(a InOut : entier, b InOut : entier)
Début
    temp ← a
    a ← b
    b ← temp
Fin
```

#### Support complet des caractères accentués UTF-8
Vous pouvez utiliser des accents dans les noms de fonctions, de paramètres et de variables en toute sécurité :

```psc
Fonction évaluerOpération(opérateur : chaîne, opérandeGauche : réel, opérandeDroite : réel) : réel
Début
    résultat ← 0.0
    Si opérateur = "+" Alors :
        résultat ← opérandeGauche + opérandeDroite
    fsi
    retourner résultat
Fin
```

---

### 8. Types Composites (Structures)

Déclarez facilement des structures personnalisées avec des champs typés :

```psc
// Déclaration du type composite
Etudiant = < nom : chaîne, age : entier, note : réel >

// Instanciation
e1 ← Etudiant("Lucas", 20, 18.5)

// Lecture et modification de champs
écrire("Nom : ", e1.nom, " - Note : ", e1.note)
e1.note ← 19.5
```

---

## 🗃️ Types de Données Abstraits (TDA)

L'extension intègre nativement une collection complète de TDA exécutables, indispensables pour les cours d'algorithmique et structures de données (BUT S1/S2/S3, CPGE, Licence).

### 🌳 Arbres Binaires (`arbin`, `noeud`)

Support complet des arbres binaires récursifs avec affichage hiérarchique automatique dans `écrire(...)` (ex. `ArbreBin(1(2(nil, 7), 3))`).

```psc
Soit ArbreBinaireEntier = arbin[entier]

// Création d'un arbre avec une racine valant 10
arbre ← créerarb(10)
r ← racine(arbre)

// Ajout de fils gauche et droit
adjfg(arbre, r, 5)
adjfd(arbre, r, 15)

// Affichage et inspection
écrire("Arbre : ", arbre)
écrire("Fils gauche : ", val(arbre, fg(arbre, r))) // 5
écrire("Fils droit  : ", val(arbre, fd(arbre, r))) // 15
```

| Primitive | Signature | Description |
| :--- | :--- | :--- |
| `créerarb(v)` | `créerarb(v : V) : ArbreBinaire` | Crée un arbre binaire dont la racine contient `v`. |
| `arbrevide()` | `arbrevide() : ArbreBinaire` | Instancie un arbre vide (ou teste si l'arbre est vide). |
| `racine(a)` | `racine(a : ArbreBinaire) : Noeud` | Retourne la racine de l'arbre (`nil` si vide). |
| `fg(a, n)` | `fg(a : ArbreBinaire, n : Noeud) : Noeud` | Retourne le fils gauche du nœud `n`. |
| `fd(a, n)` | `fd(a : ArbreBinaire, n : Noeud) : Noeud` | Retourne le fils droit du nœud `n`. |
| `pere(a, n)` | `pere(a : ArbreBinaire, n : Noeud) : Noeud` | Retourne le nœud parent de `n` (`nil` si racine). |
| `val(a, n)` | `val(a : ArbreBinaire, n : Noeud) : V` | Renvoie la valeur stockée dans le nœud `n`. |
| `noeudvide(a, n)`| `noeudvide(a : ArbreBinaire, n : Noeud) : booléen` | Teste si le nœud est vide (`nil`). |
| `adjfg(a, n, v)`| `adjfg(a : ArbreBinaire, n : Noeud, v : V)` | Ajoute un fils gauche contenant la valeur `v` à `n`. |
| `adjfd(a, n, v)`| `adjfd(a : ArbreBinaire, n : Noeud, v : V)` | Ajoute un fils droit contenant la valeur `v` à `n`. |
| `chgarb(a, n, v)`| `chgarb(a : ArbreBinaire, n : Noeud, v : V)` | Modifie la valeur contenue dans le nœud `n`. |
| `supfg(a, n)` | `supfg(a : ArbreBinaire, n : Noeud)` | Supprime tout le sous-arbre gauche de `n`. |
| `supfd(a, n)` | `supfd(a : ArbreBinaire, n : Noeud)` | Supprime tout le sous-arbre droit de `n`. |

---

### 📚 Piles LIFO (`pile`)

```psc
p ← pileVide()
empiler(p, 10)
empiler(p, 20)
écrire("Sommet : ", sommet(p)) // 20
dépiler(p)
écrire("Nouveau sommet : ", sommet(p)) // 10
```

| Primitive | Signature | Description |
| :--- | :--- | :--- |
| `pileVide()` | `pileVide() : Pile` | Crée une nouvelle pile vide. |
| `empiler(p, v)` | `empiler(p : Pile, v)` | Ajoute la valeur `v` au sommet de la pile. |
| `dépiler(p)` | `dépiler(p : Pile)` | Retire l'élément situé au sommet de la pile. |
| `sommet(p)` | `sommet(p : Pile) : élément` | Renvoie la valeur au sommet sans la retirer. |
| `estVidePile(p)`| `estVidePile(p : Pile) : booléen` | Retourne `vrai` si la pile est vide. |

---

### 🎟️ Files FIFO (`file`)

```psc
f ← fileVide()
enfiler(f, "Premier")
enfiler(f, "Deuxième")
écrire("En tête : ", premier(f)) // Premier
défiler(f)
écrire("Nouveau premier : ", premier(f)) // Deuxième
```

| Primitive | Signature | Description |
| :--- | :--- | :--- |
| `fileVide()` | `fileVide() : File` | Crée une nouvelle file vide. |
| `enfiler(f, v)` | `enfiler(f : File, v)` | Enfile la valeur `v` en queue de file. |
| `défiler(f)` | `défiler(f : File)` | Défile le premier élément en tête de file. |
| `premier(f)` | `premier(f : File) : élément` | Renvoie la valeur du premier élément sans le retirer. |
| `estVideFile(f)`| `estVideFile(f : File) : booléen` | Retourne `vrai` si la file est vide. |

---

### 🔗 Listes Chaînées (`liste`)

```psc
l ← listeVide()
l ← ajoutTeteListe(l, 20)
l ← ajoutTeteListe(l, 10)
l ← ajoutQueueListe(l, 30)

pos ← tete(l)
Tant que non finListe(l, pos) Faire :
    écrire("Élément : ", val(l, pos))
    pos ← suc(l, pos)
ftq
```

| Primitive | Signature | Description |
| :--- | :--- | :--- |
| `listeVide()` | `listeVide() : Liste` | Crée une liste chaînée vide. |
| `ajoutTeteListe(l, v)` | `ajoutTeteListe(l : Liste, v) : Liste` | Insère `v` en tête de liste. |
| `ajoutQueueListe(l, v)`| `ajoutQueueListe(l : Liste, v) : Liste` | Insère `v` en fin de liste. |
| `suppressionTeteListe(l)`| `suppressionTeteListe(l : Liste) : Liste` | Supprime la tête de la liste. |
| `suppressionQueueListe(l)`| `suppressionQueueListe(l : Liste) : Liste`| Supprime la queue de la liste. |
| `tete(l)` | `tete(l : Liste) : place` | Retourne la place du premier élément. |
| `suc(l, p)` | `suc(l : Liste, p : place) : place` | Retourne la place suivante après `p`. |
| `val(l, p)` | `val(l : Liste, p : place) : élément` | Retourne la valeur à la position `p`. |
| `finListe(l, p)` | `finListe(l : Liste, p : place) : booléen`| Teste si `p` a dépassé la fin de la liste. |
| `longueurListe(l)` | `longueurListe(l : Liste) : entier` | Renvoie le nombre d'éléments dans la liste. |
| `acces(l, i)` | `acces(l : Liste, i : entier) : élément` | Accède directement au i-ème élément. |

---

### 🔀 Listes Symétriques (`listesym`)

Listes doublement chaînées permettant un parcours bidirectionnel (`sucLS` / `precLS`) :

| Primitive | Description |
| :--- | :--- |
| `videLS()` | Crée une liste symétrique vide. |
| `ajoutTeteLS(l, v)` / `ajoutQueueLS(l, v)` | Ajout en tête ou en queue. |
| `suppressionTeteLS(l)` / `suppressionQueueLS(l)` | Suppression en tête ou en queue. |
| `teteLS(l)` / `queueLS(l)` | Accès à la première ou dernière place. |
| `sucLS(l, p)` / `precLS(l, p)` | Place suivante / place précédente. |
| `valLS(l, p)` | Valeur à la place `p`. |
| `finLS(l, p)` | Teste si `p` correspond à la fin de liste. |

---

### 🗂️ Tables Associatives / Dictionnaires (`table`)

Tables de type clé → valeur permettant des accès rapides par clé :

```psc
annuaire ← Table("Alice" → "0601020304", "Bob" → "0611223344")
ajoutTable(annuaire, "Charlie", "0699887766")

écrire("Numéro de Bob : ", accesTable(annuaire, "Bob"))
écrire("Clés enregistrées : ", domaine(annuaire))
```

| Primitive | Signature | Description |
| :--- | :--- | :--- |
| `tableVide()` | `tableVide() : Table` | Crée une table associative vide. |
| `table(k1, v1, ...)` | `table(...) : Table` | Initialise une table avec des paires clé/valeur. |
| `accesTable(t, clé)` | `accesTable(t : Table, clé) : valeur` | Récupère la valeur associée à la clé. |
| `ajoutTable(t, clé, val)` | `ajoutTable(t : Table, clé, val)` | Insère ou met à jour une entrée. |
| `suppressionTable(t, clé)`| `suppressionTable(t : Table, clé)` | Supprime une entrée par sa clé. |
| `domaine(t)` | `domaine(t : Table) : ensemble` | Renvoie l'ensemble de toutes les clés de la table. |

---

### 🎯 Ensembles (`ensemble`)

```psc
ens ← ["rouge", "vert", "bleu"]
Si estDans(ens, "vert") Alors :
    écrire("La couleur est présente !")
fsi
```

| Primitive / Syntaxe | Description |
| :--- | :--- |
| `estDans(collection, elem)` | Prédicat testant si `elem` appartient à un ensemble, une table ou une liste. |
| `Pour chaque x dans ensemble` | Parcourt séquentiellement tous les éléments uniques de l'ensemble. |

---

### 📁 Fichiers Entrées/Sorties (`fichier`)

```psc
// Écriture dans un fichier
f ← fichierCréer("resultat.txt")
fichierÉcrire(f, "Ligne de données")
fichierFermer(f)

// Lecture ligne par ligne
fLecture ← fichierOuvrir("resultat.txt")
Tant que non fichierFin(fLecture) Faire :
    ligne ← fichierLire(fLecture)
    écrire("Lue : ", ligne)
ftq
fichierFermer(fLecture)
```

---

### 🔤 Opérations sur Chaînes & Utilitaires

| Fonction | Signature | Description | Exemple |
| :--- | :--- | :--- | :--- |
| `longueur(s)` | `longueur(s : chaîne) : entier` | Taille d'une chaîne ou d'un tableau | `longueur("Bonjour")` *(7)* |
| `concat(s1, s2)`| `concat(s1, s2) : chaîne` | Concaténation de deux chaînes | `concat("A", "B")` *("AB")* |
| `souschaîne(s, d, f)`| `souschaîne(s, début, fin) : chaîne` | Extraction de sous-chaîne | `souschaîne("informatique", 1, 4)` *("info")* |
| `ième(s, i)` | `ième(s, i : entier) : caractère` | Caractère à la position `i` (1-based)| `ième("Algo", 1)` *("A")* |
| `chaîneVersEntier(s)`| `chaîneVersEntier(s : chaîne) : entier` | Conversion d'une chaîne en entier | `chaîneVersEntier("42")` *(42)* |
| `comparaison(a, b)`| `comparaison(a, b) : booléen` | Comparaison d'objets, réels ou chaînes| `comparaison(obj1, obj2)` |

---

## ⌨️ Snippets de Code Intelligents

Tapez simplement le préfixe dans l'éditeur et appuyez sur **`Tab`** pour générer la structure :

| Déclencheur (Prefix) | Description du Snippet | Structure insérée |
| :--- | :--- | :--- |
| `algorithme` ou `algo` | **Algorithme principal** | Squelette avec `Algorithme Nom`, `Début`, `Fin` et bloc `Lexique`. |
| `fonction` ou `func` | **Fonction complète** | Fonction avec typage de retour et bloc `Lexique`. |
| `procedure` | **Procédure** | Fonction sans valeur de retour. |
| `pour` | **Boucle Pour** | `Pour i de 0 à n-1 Faire : ... fpour` |
| `pourdec` | **Boucle Pour décroissante** | `Pour i de n-1 à 0 décroissant Faire : ... fpour` |
| `pourtab` | **Parcours de tableau** | Boucle `Pour` préconfigurée avec affectation `tab[i]`. |
| `pourchaque` | **Boucle Pour chaque** | Itération directe sur `ensemble`, `table` ou `liste`. |
| `tantque` ou `tq` | **Boucle Tant que** | `Tant que condition Faire : ... ftq` |
| `si` | **Condition Si** | `Si condition Alors : ... fsi` |
| `sisinon` | **Condition Si / Sinon** | `Si condition Alors : ... Sinon : ... fsi` |
| `sicomplet` | **Condition Si / Sinon si / Sinon** | Structure conditionnelle complète à 3 branches. |
| `ecrire` | **Affichage** | `écrire(valeur)` |
| `lire` | **Saisie standard** | `variable ← lire()` |
| `saisie` | **Invite de saisie** | Message d'invite suivi de la saisie utilisateur. |
| `tableau` | **Déclaration tableau** | `tab ← tableau entier[0..9]` |
| `type` | **Type composite (structure)** | `NomType = < champ1 : type1, champ2 : type2 >` |
| `foncrec` | **Fonction récursive** | Squelette de récursion avec condition d'arrêt et cas général. |
| `fichier` | **Lecture complète de fichier** | Bloc complet : ouverture, boucle `Tant que non fichierFin`, lecture et fermeture. |
| `lexique` | **Bloc Lexique** | En-tête de déclaration de variables. |

---

## ⚙️ Configuration & Raccourcis Clavier

### Raccourcis Clavier Utiles

| Raccourci | Action | Condition |
| :--- | :--- | :--- |
| **`Ctrl + F5`** | **Exécuter le fichier Pseudo-Code actif** | Fichier `.psc` ouvert |
| **`Alt + Maj + F`** | **Formater le document automatiquement** | Fichier `.psc` ouvert |
| **`F12`** ou **`Ctrl + Clic`** | **Aller à la définition** (fonction, variable, type) | Curseur sur un symbole |
| **`Ctrl + Espace`** | **Forcer l'autocomplétion contextuelle** | N'importe où dans le code |
| **`Maj + F12`** | **Afficher toutes les références** d'un symbole | Curseur sur un symbole |

### Paramètres de l'Extension (`settings.json`)

Vous pouvez personnaliser le comportement de l'extension dans les paramètres VS Code (`Ctrl+,`) :

```json
{
  // Activer ou désactiver l'exécution du code (bouton Play et Ctrl+F5)
  "psc.execution.enabled": true,

  // Activer ou désactiver le linter et l'analyse diagnostique en temps réel
  "psc.linter.enabled": true,

  // Activer ou désactiver l'IntelliSense (complétion, survol, navigation)
  "psc.intellisense.enabled": true
}
```

---

## 📋 Prérequis pour l'Exécution

Pour utiliser la fonctionnalité **d'exécution instantanée** (bouton ▶️ ou `Ctrl+F5`), l'interpréteur **Lua** (version 5.3 ou 5.4) doit être présent sur votre machine :

### 🐧 Linux
```bash
# Ubuntu / Debian / Linux Mint
sudo apt update && sudo apt install lua5.4
# ou : sudo apt install lua5.3

# Arch Linux / Manjaro
sudo pacman -S lua

# Fedora / RHEL
sudo dnf install lua
```

### 🍎 macOS
```bash
brew install lua
```

### 🪟 Windows
```powershell
# Via Winget (recommandé)
winget install Lua.Lua

# Ou via Chocolatey
choco install lua
```

> [!NOTE]
> Si vous utilisez uniquement la coloration syntaxique, le linter, les snippets et le formateur de code, l'installation de Lua **n'est pas requise**.

---

## 📦 Guide d'Installation

### Méthode 1 : Marketplace Officielle VS Code (Recommandé)

1. Ouvrez **Visual Studio Code**.
2. Ouvrez le panneau Extensions (`Ctrl+Shift+X` ou `Cmd+Shift+X`).
3. Recherchez **`PseudoCode-Interpreter`** (par Lucas Martinati).
4. Cliquez sur **Installer**.

👉 [Lien direct vers la page Marketplace](https://marketplace.visualstudio.com/items?itemName=LucasM54.PseudoCode-Interpreter)

---

### Méthode 2 : VSCodium / Installation Manuelle (`.vsix`)

1. Rendez-vous sur la page des [Releases GitHub](https://github.com/LucasM548/Pseudo-Code-Extension-VSC/releases) et téléchargez le dernier fichier `.vsix`.
2. Dans VS Code ou VSCodium, ouvrez le panneau des Extensions (`Ctrl+Shift+X`).
3. Cliquez sur le menu **`···`** (en haut à droite du panneau) et sélectionnez **"Installer depuis un VSIX..."**.
4. Sélectionnez le fichier téléchargé.

Ou via votre terminal :
```bash
codium --install-extension pseudocode-interpreter-x.x.x.vsix
```

---

## 🛠️ Développement & Tests

Le projet est conçu selon le principe de **Source Unique de Vérité** (*Single Source of Truth*) :

```
src/definitions.ts (SOURCE UNIQUE DE VÉRITÉ)
    │
    ├──► scripts/generate-grammar.ts ──► syntaxes/psc.tmLanguage.json (Grammaire TextMate)
    ├──► src/constants.ts            ──► KNOWN_IDENTIFIERS & BUILTIN_FUNCTION_ARITY
    ├──► src/completionProvider.ts   ──► Complétions, Hover, Signature Help, Définitions
    ├──► src/diagnostics.ts          ──► Linter temps réel & Détection des blocs
    └──► src/executor.ts             ──► Transpilation Lua & Exécution
```

### Commandes pour les contributeurs

```bash
# 1. Installer les dépendances
npm install

# 2. Compiler le code TypeScript et régénérer la grammaire TextMate
npm run compile

# 3. Lancer l'ensemble des suites de tests automatisées (100% en pseudo-code natif)
npm test

# 4. Packager l'extension en fichier .vsix
npm run package
```

Pour en savoir plus sur l'ajout de nouvelles primitives ou types au langage, consultez le guide dédié : [**`AJOUT_FONCTIONS.md`**](AJOUT_FONCTIONS.md).

---

## 📄 Licence

Ce projet est distribué sous licence libre **MIT**. Consultez le fichier [LICENSE](LICENSE) pour plus de détails.

---

<div align="center">
  Développé avec passion pour rendre l'algorithmique accessible, rigoureuse et agréable.  
  <b>Des questions ou des suggestions ?</b> Ouvrez une issue sur le <a href="https://github.com/LucasM548/Pseudo-Code-Extension-VSC">dépôt GitHub</a> !
</div>
