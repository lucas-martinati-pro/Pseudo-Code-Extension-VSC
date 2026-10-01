Algorithme DemoABR
// Démo ABR : lexique français-anglais + opérations de base

MotTraduction = <francais : chaîne, anglais : chaîne>

lex : abr
abrNum : abr
trad : chaîne
k3 : entier

Début
    écrire("=== DEMO ABR ===")

    // 1. Lexique français-anglais
    lex ← abrVide()
    insertionABR(lex, "chat", "cat")
    insertionABR(lex, "chien", "dog")
    insertionABR(lex, "oiseau", "bird")
    insertionABR(lex, "arbre", "tree")

    écrire("ABR lexique : ", lex)
    écrire("estABR(lex) : ", estABR(lex))
    écrire("hauteur(lex) : ", hauteur(lex))

    trad ← rechercheABR(lex, "chien")
    écrire("recherche chien : ", trad)

    trad ← rechercheABR(lex, "poisson")
    écrire("recherche poisson (absent, chaine vide) : [", trad, "]")

    // 2. Suppression en préservant BST
    suppressionABR(lex, "chien")
    écrire("apres suppression chien : ", lex)
    écrire("estABR apres suppression : ", estABR(lex))
    écrire("recherche chien apres suppression : [", rechercheABR(lex, "chien"), "]")

    // 3. ABR numérique + k-ième plus petit
    abrNum ← abrVide()
    insertionABR(abrNum, 50)
    insertionABR(abrNum, 30)
    insertionABR(abrNum, 70)
    insertionABR(abrNum, 20)
    insertionABR(abrNum, 40)
    insertionABR(abrNum, 60)
    insertionABR(abrNum, 80)

    écrire("ABR numérique : ", abrNum)
    écrire("estABR(num) : ", estABR(abrNum))
    écrire("k=1 : ", kemePlusPetit(abrNum, 1))
    écrire("k=3 : ", kemePlusPetit(abrNum, 3))
    écrire("k=7 : ", kemePlusPetit(abrNum, 7))

    // 4. Cas dégénéré : clés triées [1..7] -> hauteur n-1, O(n)
    deg : abr
    deg ← abrVide()
    Pour i de 1 à 7 Faire :
        insertionABR(deg, i)
    fpour
    écrire("ABR dégénéré [1..7] : ", deg)
    écrire("hauteur dégénéré (attendu 7) : ", hauteur(deg))
    écrire("hauteur équilibré 7 noeuds (attendu 3) : ", hauteur(abrNum))
    écrire("estABR degeneré : ", estABR(deg))

    // 5. estABR sur arbre non-BST construit à la main
    mauvais ← créerarb(10)
    adjfg(mauvais, racine(mauvais), 20)
    adjfd(mauvais, racine(mauvais), 5)
    écrire("mauvais arbre : ", mauvais)
    écrire("estABR(mauvais) attendu Faux : ", estABR(mauvais))

    écrire("=== FIN DEMO ABR ===")
Fin
