// ═══════════════════════════════════════════════════════════════════════════════
// TEST : Décalage d'indices pour différents types de bornes de tableaux
// Vérifie que le transpileur gère correctement :
//   - Les bornes variables (identifiants) → pas de décalage
//   - Les bornes littérales 0-indexées    → décalage +1
//   - Les bornes littérales négatives     → décalage correct
//   - Les bornes littérales à 1           → pas de décalage
//   - Plusieurs paramètres tableaux à bornes variables
// ═══════════════════════════════════════════════════════════════════════════════

Algorithme TestDécalagesIndices

// ─────────────────────────────────────────────────────────────────────────
// 1. Bornes variables : copie entre deux tableaux passés en InOut
//    Les bornes debut..fin sont des variables → pas de décalage
// ─────────────────────────────────────────────────────────────────────────
Fonction copierTableau(debut : entier, fin : entier, src InOut : Tableau entier[debut..fin], dest InOut : Tableau entier[debut..fin])
Début
    Pour i allant de debut à fin Faire :
        dest[i] ← src[i]
    fpour
Fin

// ─────────────────────────────────────────────────────────────────────────
// 2. Bornes 0-indexées : somme d'un tableau [0..4]
//    Le transpileur doit appliquer un décalage +1
// ─────────────────────────────────────────────────────────────────────────
Fonction sommeTableau0(tab InOut : Tableau entier[0..4]) : entier
Début
    s ← 0
    Pour i allant de 0 à 4 Faire :
        s ← s + tab[i]
    fpour
    retourner s
Fin

// ─────────────────────────────────────────────────────────────────────────
// 3. Bornes négatives : accès à un tableau [-2..2]
//    Le transpileur doit appliquer un décalage -(−2)+1 = +3
// ─────────────────────────────────────────────────────────────────────────
Fonction accéderNégatif(tab InOut : Tableau entier[-2..2], idx : entier) : entier
Début
    retourner tab[idx]
Fin

// ─────────────────────────────────────────────────────────────────────────
// 4. Bornes 1-indexées : accès direct sans décalage
// ─────────────────────────────────────────────────────────────────────────
Fonction lirePremier(tab InOut : Tableau entier[1..5]) : entier
Début
    retourner tab[1]
Fin

// ─────────────────────────────────────────────────────────────────────────
// 5. Somme récursive avec bornes variables (cas récursif)
//    Vérifie que les accès tab[gauche] fonctionnent quand les bornes
//    changent à chaque appel récursif
// ─────────────────────────────────────────────────────────────────────────
Fonction sommeRéc(gauche : entier, droite : entier, tab InOut : Tableau entier[gauche..droite]) : entier
Début
    Si gauche = droite Alors :
        retourner tab[gauche]
    fsi
    milieu ← (gauche + droite) ÷ 2
    s1 ← sommeRéc(gauche, milieu, tab)
    s2 ← sommeRéc(milieu + 1, droite, tab)
    retourner s1 + s2
Fin

// ─────────────────────────────────────────────────────────────────────────
// Programme principal : exécution de tous les tests
// ─────────────────────────────────────────────────────────────────────────
Début
    nbOK ← 0
    nbTotal ← 0

    // ──── Test 1 : Copie avec bornes variables ────
    nbTotal ← nbTotal + 1
    src ← tableau entier[1..5]
    dest ← tableau entier[1..5]
    src[1] ← 10
    src[2] ← 20
    src[3] ← 30
    src[4] ← 40
    src[5] ← 50
    dest[1] ← 0
    dest[2] ← 0
    dest[3] ← 0
    dest[4] ← 0
    dest[5] ← 0
    copierTableau(1, 5, src, dest)
    ok ← 1
    Pour i allant de 1 à 5 Faire :
        Si dest[i] ≠ src[i] Alors :
            ok ← 0
        fsi
    fpour
    Si ok = 1 Alors :
        écrire("  ✓ Test 1 : Copie avec bornes variables")
        nbOK ← nbOK + 1
    Sinon :
        écrire("  ✗ Test 1 : Copie avec bornes variables")
    fsi

    // ──── Test 2 : Somme tableau 0-indexé ────
    nbTotal ← nbTotal + 1
    tab0 ← [10, 20, 30, 40, 50]
    résultat ← sommeTableau0(tab0)
    Si résultat = 150 Alors :
        écrire("  ✓ Test 2 : Somme tableau 0-indexé = 150")
        nbOK ← nbOK + 1
    Sinon :
        écrire("  ✗ Test 2 : Somme tableau 0-indexé (obtenu : ", résultat, ")")
    fsi

    // ──── Test 3 : Accès tableau à indices négatifs ────
    nbTotal ← nbTotal + 1
    tabNeg ← [100, 200, 300, 400, 500]
    v1 ← accéderNégatif(tabNeg, -2)
    v2 ← accéderNégatif(tabNeg, 0)
    v3 ← accéderNégatif(tabNeg, 2)
    Si v1 = 100 et v2 = 300 et v3 = 500 Alors :
        écrire("  ✓ Test 3 : Accès tableau à indices négatifs [-2]=100, [0]=300, [2]=500")
        nbOK ← nbOK + 1
    Sinon :
        écrire("  ✗ Test 3 : Accès tableau à indices négatifs (", v1, ", ", v2, ", ", v3, ")")
    fsi

    // ──── Test 4 : Accès direct tableau 1-indexé ────
    nbTotal ← nbTotal + 1
    tab1 ← [42, 2, 3, 4, 5]
    Si lirePremier(tab1) = 42 Alors :
        écrire("  ✓ Test 4 : Premier élément tableau 1-indexé = 42")
        nbOK ← nbOK + 1
    Sinon :
        écrire("  ✗ Test 4 : Premier élément tableau 1-indexé")
    fsi

    // ──── Test 5 : Somme récursive avec bornes variables ────
    nbTotal ← nbTotal + 1
    tabSomme ← tableau entier[1..8]
    tabSomme[1] ← 1
    tabSomme[2] ← 2
    tabSomme[3] ← 3
    tabSomme[4] ← 4
    tabSomme[5] ← 5
    tabSomme[6] ← 6
    tabSomme[7] ← 7
    tabSomme[8] ← 8
    résultatSomme ← sommeRéc(1, 8, tabSomme)
    Si résultatSomme = 36 Alors :
        écrire("  ✓ Test 5 : Somme récursive avec bornes variables = 36")
        nbOK ← nbOK + 1
    Sinon :
        écrire("  ✗ Test 5 : Somme récursive (obtenu : ", résultatSomme, ")")
    fsi

    // ──── Résumé ────
    écrire("")
    Si nbOK = nbTotal Alors :
        écrire("TOUS_LES_TESTS_OK (", nbOK, "/", nbTotal, ")")
    Sinon :
        écrire("TESTS_EN_ÉCHEC (", nbOK, "/", nbTotal, ")")
    fsi
Fin
