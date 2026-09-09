Algorithme DemoPourChaqueEtEnsemble

// ═══════════════════════════════════════════════════════════════════════════
// Démonstration & Test natif PSC :
// - Boucles 'Pour chaque <var> dans <collection>'
// - Type 'ensemble' (déclaration Lexique et inline)
// - Prédicat 'estDans(col, element)' sur ensemble, table, domaine et liste
// - Support des identifiants avec accents (noeud, élément)
// ═══════════════════════════════════════════════════════════════════════════

Fonction compterElements(col : ensemble) : entier
Lexique :
    cpt : entier
    elem : chaîne
Début
    cpt ← 0
    Pour chaque elem dans col Faire
        cpt ← cpt + 1
    fpour
    retourner cpt
Fin

Lexique :
    ens_noeuds : ensemble
    graphe_adj : table
    dom : ensemble
    liste_nombres : liste
    noeud : chaîne
    s : chaîne
    n : entier
    nb_total : entier
    trouve : booléen

Début
    écrire("=== TEST 1 : Pour chaque sur ensemble / tableau ===")
    ens_noeuds ← ["sommetA", "sommetB", "sommetC"]
    Pour chaque noeud dans ens_noeuds Faire
        écrire("Visite du noeud : ", noeud)
    fpour

    écrire("=== TEST 2 : Type ensemble déclaré directement (inline) ===")
    ens_local : ensemble
    ens_local ← ["alpha", "beta", "gamma"]
    Pour chaque s dans ens_local Faire
        écrire("Element local : ", s)
    fpour

    écrire("=== TEST 3 : Table, domaine(t) et Pour chaque ===")
    graphe_adj ← table("sommetA", 10, "sommetB", 20, "sommetC", 30)
    dom ← domaine(graphe_adj)
    Pour chaque s dans dom Faire
        écrire("Clé dans domaine : ", s)
    fpour

    écrire("=== TEST 4 : Pour chaque directement sur table ===")
    Pour chaque cle dans graphe_adj Faire
        écrire("Clé directe : ", cle)
    fpour

    écrire("=== TEST 5 : Pour chaque sur TDA Liste chaînée ===")
    liste_nombres ← listeVide()
    liste_nombres ← ajoutQueueListe(liste_nombres, 100)
    liste_nombres ← ajoutQueueListe(liste_nombres, 200)
    liste_nombres ← ajoutQueueListe(liste_nombres, 300)
    Pour chaque n dans liste_nombres Faire
        écrire("Valeur liste : ", n)
    fpour

    écrire("=== TEST 6 : Fonction estDans sur différents types ===")
    trouve ← estDans(ens_noeuds, "sommetB")
    écrire("sommetB dans ens_noeuds (attendu: vrai) : ", trouve)
    trouve ← estDans(ens_noeuds, "sommetInconnu")
    écrire("sommetInconnu dans ens_noeuds (attendu: faux) : ", trouve)

    trouve ← estDans(dom, "sommetA")
    écrire("sommetA dans dom (attendu: vrai) : ", trouve)

    trouve ← estDans(graphe_adj, "sommetC")
    écrire("sommetC dans table graphe_adj (attendu: vrai) : ", trouve)
    trouve ← estDans(graphe_adj, "sommetZ")
    écrire("sommetZ dans table graphe_adj (attendu: faux) : ", trouve)

    trouve ← estDans(liste_nombres, 200)
    écrire("200 dans liste_nombres (attendu: vrai) : ", trouve)
    trouve ← estDans(liste_nombres, 999)
    écrire("999 dans liste_nombres (attendu: faux) : ", trouve)

    écrire("=== TEST 7 : Variables de boucle avec caractères accentués ===")
    Pour chaque élément dans ens_noeuds Faire
        écrire("Elément accentué : ", élément)
    fpour

    écrire("=== TEST 8 : Appel de fonction avec Pour chaque ===")
    nb_total ← compterElements(ens_noeuds)
    écrire("Nombre total d'éléments comptés : ", nb_total)

    écrire("=== TEST 9 : Pour chaque avec syntaxe sans Faire mais avec deux-points (:) ===")
    Pour chaque noeud dans ens_noeuds :
        écrire("Noeud (sans Faire avec :) : ", noeud)
    fpour

    écrire("=== TEST 10 : Pour chaque avec syntaxe Faire et deux-points (Faire :) ===")
    Pour chaque noeud dans ens_noeuds Faire :
        écrire("Noeud (Faire :) : ", noeud)
    fpour

    écrire("=== SUCCÈS TOTAL DE TOUS LES TESTS PSC ===")
Fin
