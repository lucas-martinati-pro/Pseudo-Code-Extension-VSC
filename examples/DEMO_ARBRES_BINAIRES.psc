Algorithme DemoArbresBinaires

// ============================================================================
// DÉCLARATION DE TYPES ALIAS
// ============================================================================
Soit ArbreBinaireEntier = arbin[entier]
Soit ArbreBinaireChaine = arbin[chaine]

// ============================================================================
// FONCTIONS DE PARCOURS (EXERCICE 1)
// ============================================================================

Fonction imprimerPréfixé(arbre : ArbreBinaireChaine, noeud : Noeud)
Début
    Si non noeudVide(arbre, noeud) Alors :
        écrire("Préfixé :", val(arbre, noeud))
        imprimerPréfixé(arbre, fg(arbre, noeud))
        imprimerPréfixé(arbre, fd(arbre, noeud))
    fsi
Fin

Fonction imprimerInfixer(arbre : ArbreBinaireChaine, noeud : Noeud)
Début
    Si non noeudVide(arbre, noeud) Alors :
        imprimerInfixer(arbre, fg(arbre, noeud))
        écrire("Infixé :", val(arbre, noeud))
        imprimerInfixer(arbre, fd(arbre, noeud))
    fsi
Fin

Fonction imprimerPostfixé(arbre : ArbreBinaireChaine, noeud : Noeud)
Début
    Si non noeudVide(arbre, noeud) Alors :
        imprimerPostfixé(arbre, fg(arbre, noeud))
        imprimerPostfixé(arbre, fd(arbre, noeud))
        écrire("Postfixé :", val(arbre, noeud))
    fsi
Fin

// ============================================================================
// COMPTER LES FEUILLES (EXERCICE 2)
// ============================================================================

Fonction compterFeuilles(arbre : ArbreBinaire, noeud : Noeud) : entier
Début
    Si noeudVide(arbre, noeud) Alors :
        retourner 0
    fsi

    Si noeudVide(fg(arbre, noeud)) et noeudVide(fd(arbre, noeud)) Alors :
        retourner 1
    Sinon :
        retourner compterFeuilles(arbre, fg(arbre, noeud)) + compterFeuilles(arbre, fd(arbre, noeud))
    fsi
Fin

// ============================================================================
// ARBRES MIROIRS ET SYMÉTRIE (EXERCICE 3)
// ============================================================================

Fonction sontMiroirs(arbre : ArbreBinaire, n1 : Noeud, n2 : Noeud) : booléen
Début
    Si noeudVide(arbre, n1) et noeudVide(arbre, n2) Alors :
        retourner vrai
    fsi

    // Si un seul est vide c'est faux
    Si noeudVide(arbre, n1) ou noeudVide(arbre, n2) Alors :
        retourner faux
    fsi

    // Les deux existent -> même valeur ET sous-arbres miroirs croisés
    retourner (val(arbre, n1) = val(arbre, n2))
          et sontMiroirs(arbre, fg(arbre, n1), fd(arbre, n2))
          et sontMiroirs(arbre, fd(arbre, n1), fg(arbre, n2))
Fin

Fonction estSymetrique(arbre : ArbreBinaire, r : Noeud) : booléen
Début
    Si noeudVide(arbre, r) Alors :
        retourner vrai
    fsi

    retourner sontMiroirs(arbre, fg(arbre, r), fd(arbre, r))
Fin

// ============================================================================
// PROGRAMME PRINCIPAL
// ============================================================================

a : ArbreBinaireEntier
n : Noeud
arbreChaine : ArbreBinaireChaine
arbreSym : ArbreBinaire
rSym : Noeud
rChaine : Noeud
nbF : entier

Début
    écrire("=== DÉMO DES ARBRES BINAIRES ===")

    // 1. Construction pas à pas (Exemple 1 du cours)
    a <- créerarb(1)
    adjfd(a, racine(a), 3)
    adjfg(a, racine(a), 2)
    n <- fg(a, racine(a))
    adjfd(a, n, 7)

    écrire("Arbre a initial :", a)
    écrire("Racine :", val(a, racine(a)))
    écrire("Fils gauche de racine :", val(a, fg(a, racine(a))))
    écrire("Fils droit de racine :", val(a, fd(a, racine(a))))
    écrire("Fils droit de n (val 7) :", val(a, fd(a, n)))

    // 2. Mise à jour et suppression (Exemple 2 du cours)
    chgarb(a, fg(a, racine(a)), 8)
    écrire("Après chgarb à 8 :", val(a, fg(a, racine(a))))

    supfd(a, racine(a))
    écrire("Fils droit après supfd (vide) :", noeudVide(a, fd(a, racine(a))))

    supfg(a, racine(a))
    écrire("Fils gauche après supfg (vide) :", noeudVide(a, fg(a, racine(a))))

    // 3. Parcours récursifs (Exercice 1)
    arbreChaine <- créerarb("Racine")
    rChaine <- racine(arbreChaine)
    adjfg(arbreChaine, rChaine, "Gauche")
    adjfd(arbreChaine, rChaine, "Droite")

    écrire("--- Parcours Préfixé ---")
    imprimerPréfixé(arbreChaine, rChaine)

    écrire("--- Parcours Infixé ---")
    imprimerInfixer(arbreChaine, rChaine)

    écrire("--- Parcours Postfixé ---")
    imprimerPostfixé(arbreChaine, rChaine)

    // 4. Compter les feuilles (Exercice 2)
    nbF <- compterFeuilles(arbreChaine, rChaine)
    écrire("Nombre de feuilles de arbreChaine :", nbF)

    // 5. Test de symétrie (Exercice 3)
    arbreSym <- créerarb(1)
    rSym <- racine(arbreSym)
    adjfg(arbreSym, rSym, 2)
    adjfd(arbreSym, rSym, 2)
    adjfg(arbreSym, fg(arbreSym, rSym), 3)
    adjfd(arbreSym, fd(arbreSym, rSym), 3)

    écrire("arbreSym est symétrique :", estSymetrique(arbreSym, rSym))

    adjfd(arbreSym, fg(arbreSym, rSym), 4)
    écrire("arbreSym n'est plus symétrique :", estSymetrique(arbreSym, rSym))

    écrire("=== FIN DU TEST ARBRES BINAIRES ===")
Fin
