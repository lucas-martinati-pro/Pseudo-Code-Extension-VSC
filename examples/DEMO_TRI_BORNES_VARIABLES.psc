// ═══════════════════════════════════════════════════════════════════════════════
// TEST : Tri rapide (QuickSort) avec bornes variables sur paramètre InOut
// Vérifie que Tableau[borne_inf..borne_sup] ne génère pas de décalage d'indice
// ═══════════════════════════════════════════════════════════════════════════════

Algorithme TestTriRapideBornesVariables

// ─────────────────────────────────────────────────────────────────────────
// Partition de Lomuto avec bornes dynamiques
// ─────────────────────────────────────────────────────────────────────────
Fonction partitionner(gauche : entier, droite : entier, tab InOut : Tableau entier[gauche..droite]) : entier
Début
    pivot ← tab[droite]
    i ← gauche - 1
    Pour j allant de gauche à droite - 1 Faire :
        Si tab[j] ≤ pivot Alors :
            i ← i + 1
            temp ← tab[i]
            tab[i] ← tab[j]
            tab[j] ← temp
        fsi
    fpour
    temp ← tab[i + 1]
    tab[i + 1] ← tab[droite]
    tab[droite] ← temp
    retourner i + 1
Fin

// ─────────────────────────────────────────────────────────────────────────
// Tri rapide récursif — les bornes changent à chaque appel récursif
// ─────────────────────────────────────────────────────────────────────────
Fonction triRapide(gauche : entier, droite : entier, tab InOut : Tableau entier[gauche..droite])
Début
    Si gauche < droite Alors :
        pi ← partitionner(gauche, droite, tab)
        triRapide(gauche, pi - 1, tab)
        triRapide(pi + 1, droite, tab)
    fsi
Fin

// ─────────────────────────────────────────────────────────────────────────
// Vérification que le tableau est trié (bornes fixes 1..10)
// ─────────────────────────────────────────────────────────────────────────
Fonction estTrié(n : entier, tab InOut : Tableau entier[1..10]) : entier
Début
    résultat ← 1
    Pour i allant de 1 à n - 1 Faire :
        Si tab[i] > tab[i + 1] Alors :
            résultat ← 0
        fsi
    fpour
    retourner résultat
Fin

// ─────────────────────────────────────────────────────────────────────────
// Programme principal
// ─────────────────────────────────────────────────────────────────────────
Début
    tab ← [6, 3, 2, 8, 1, 9, 4, 7, 5, 10]

    écrire("Avant tri : ", tab)
    triRapide(1, 10, tab)
    écrire("Après tri : ", tab)

    Si estTrié(10, tab) = 1 Alors :
        écrire("TEST_BORNES_VARIABLES_TRI: OK")
    Sinon :
        écrire("TEST_BORNES_VARIABLES_TRI: ÉCHEC")
    fsi
Fin
