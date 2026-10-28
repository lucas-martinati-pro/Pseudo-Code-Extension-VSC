Algorithme DemoABR
// Démo ABR : lexique français-anglais + opérations de base

MotTraduction = <francais : chaîne, anglais : chaîne>

lex : abr
abrNum : abr
trad : chaîne

Début
    écrire("=== DEMO ABR ===")

    // 1. Lexique français-anglais
    lex ← abrVide()
    insertionABR(lex, "chat", "cat")
    insertionABR(lex, "chien", "dog")
    insertionABR(lex, "oiseau", "bird")
    insertionABR(lex, "arbre", "tree")

    écrire("ABR lexique : ", lex)
    écrire("hauteur(lex) : ", hauteur(lex))

    trad ← rechercheABR(lex, "chien")
    écrire("recherche chien : ", trad)

    trad ← rechercheABR(lex, "poisson")
    écrire("recherche poisson (absent, chaine vide) : [", trad, "]")

    // 2. Suppression en préservant BST
    suppressionABR(lex, "chien")
    écrire("apres suppression chien : ", lex)
    écrire("recherche chien apres suppression : [", rechercheABR(lex, "chien"), "]")

    // 3. ABR numérique
    abrNum ← abrVide()
    insertionABR(abrNum, 50)
    insertionABR(abrNum, 30)
    insertionABR(abrNum, 70)
    insertionABR(abrNum, 20)
    insertionABR(abrNum, 40)
    insertionABR(abrNum, 60)
    insertionABR(abrNum, 80)

    écrire("ABR numérique : ", abrNum)

    // 4. Cas dégénéré : clés triées [1..7] -> hauteur n-1, O(n)
    deg : abr
    deg ← abrVide()
    Pour i de 1 à 7 Faire :
        insertionABR(deg, i)
    fpour
    écrire("ABR dégénéré [1..7] : ", deg)
    écrire("hauteur dégénéré (attendu 7) : ", hauteur(deg))
    écrire("hauteur équilibré 7 noeuds (attendu 3) : ", hauteur(abrNum))

    écrire("=== FIN DEMO ABR ===")
Fin
