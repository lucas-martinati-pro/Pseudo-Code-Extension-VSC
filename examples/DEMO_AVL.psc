Algorithme DemoAVL
// Démo AVL : équilibre dynamique, rotations, O(log n) garanti

avl : avl
f : entier
h : entier

Début
    écrire("=== DEMO AVL ===")

    // 1. Insertions triées [1..7] : ABR dégénère, AVL reste équilibré
    avl ← avlVide()
    Pour i de 1 à 7 Faire :
        insertionAVL(avl, i)
    fpour
    écrire("AVL après insertions 1..7 : ", avl)
    h ← hauteur(avl)
    écrire("hauteur AVL 7 noeuds (attendu 3) : ", h)
    écrire("estABR(avl) : ", estABR(avl))
    écrire("estAVL(avl) : ", estAVL(avl))
    écrire("k=4 : ", kemePlusPetit(avl, 4))

    // 2. Facteur d'équilibre en tout noeud dans [-1,1]
    r ← racine(avl)
    f ← facteurEquilibre(avl, r)
    écrire("facteur racine dans [-1,1] : ", f)
    écrire("facteur fils gauche : ", facteurEquilibre(avl, fg(avl, r)))
    écrire("facteur fils droit : ", facteurEquilibre(avl, fd(avl, r)))

    // 3. Rotations explicites O(1)
    t ← avlVide()
    insertionABR(t, 30)
    insertionABR(t, 20)
    insertionABR(t, 40)
    insertionABR(t, 10)
    écrire("avant rotation : ", t, " h=", hauteur(t))
    rotationDroite(t, racine(t))
    écrire("apres rotationDroite racine : ", t)
    écrire("estABR apres rotation manuelle (peut être Faux, normal) : ", estABR(t))

    // 4. Double rotations
    t2 ← avlVide()
    insertionAVL(t2, 10)
    insertionAVL(t2, 30)
    insertionAVL(t2, 20)
    écrire("t2 insertion 10,30,20 (cas droite-gauche) : ", t2)
    écrire("estAVL(t2) : ", estAVL(t2))
    écrire("hauteur(t2) attendu 2 : ", hauteur(t2))

    // 5. Suppression AVL avec rééquilibrage
    suppressionAVL(avl, 4)
    écrire("apres suppressionAVL(4) : ", avl)
    écrire("estAVL apres suppression : ", estAVL(avl))
    écrire("hauteur apres suppression : ", hauteur(avl))

    suppressionAVL(avl, 1)
    suppressionAVL(avl, 7)
    écrire("apres suppressions 1 et 7 : ", avl)
    écrire("estAVL final : ", estAVL(avl))

    // 6. Lexique en AVL
    lexAVL ← avlVide()
    insertionAVL(lexAVL, "chat", "cat")
    insertionAVL(lexAVL, "chien", "dog")
    insertionAVL(lexAVL, "oiseau", "bird")
    écrire("lexAVL : ", lexAVL)
    écrire("recherche oiseau : ", rechercheABR(lexAVL, "oiseau"))
    écrire("estAVL(lexAVL) : ", estAVL(lexAVL))

    écrire("=== FIN DEMO AVL ===")
Fin
