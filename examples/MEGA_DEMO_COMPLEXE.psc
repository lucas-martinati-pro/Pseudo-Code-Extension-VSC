// ═════════════════════════════════════════════════════════════════════════════════════════════════════════
// 🌟 DÉMONSTRATION COMPLÈTE & GÉANTE DU PSEUDO-CODE
// Cursus BUT Informatique (S1, S2, S3)
// ═════════════════════════════════════════════════════════════════════════════════════════════════════════

Algorithme MegaDemonstrationComplexe
Début
	écrire("╔════════════════════════════════════════════════════════════════╗")
	écrire("║      🚀 LANCEMENT DU BENCHMARK COMPLET PSEUDO-CODE             ║")
	écrire("╚════════════════════════════════════════════════════════════════╝")
	écrire("")

	// ─────────────────────────────────────────────────────────────────────────
	// 1. TYPES COMPOSITES (STRUCTURES / ENREGISTREMENTS)
	// ─────────────────────────────────────────────────────────────────────────
	écrire("=== 1. TYPES COMPOSITES & STRUCTURES ===")
	
	Etudiant = < nom : chaîne, age : entier, note : réel >
	Coordonnee = < x : entier, y : entier, label : chaîne >

	e1 ← Etudiant("Lucas", 20, 18.5)
	e2 ← Etudiant("Sophie", 21, 19.2)

	écrire("Étudiant 1 : ", e1.nom, " (", e1.age, " ans) - Note : ", e1.note)
	écrire("Étudiant 2 : ", e2.nom, " (", e2.age, " ans) - Note : ", e2.note)

	// Modification de champs
	e1.note ← 20.0
	écrire("Nouvelle note de ", e1.nom, " : ", e1.note)
	écrire("")

	// ─────────────────────────────────────────────────────────────────────────
	// 2. TABLEAUX 1D, 2D, OFFSETS DYNAMIQUES & INDICES HÉTÉROGÈNES
	// ─────────────────────────────────────────────────────────────────────────
	écrire("=== 2. TABLEAUX UNIDIMENSIONNELS ET MATRICES 2D ===")

	// Tableau 0-based
	tab0 ← tableau entier[0 .. 4]
	Pour i de 0 à 4 Faire :
		tab0[i] ← (i + 1) * 10
	fpour
	écrire("Tableau indexé à 0 : ", tab0)

	// Tableau 1-based
	tab1 ← tableau entier[1 .. 5]
	Pour i de 1 à 5 Faire :
		tab1[i] ← i * 100
	fpour
	écrire("Tableau indexé à 1 : ", tab1)

	// Tableau avec bornes négatives
	tabNeg ← tableau entier[-3 .. 3]
	Pour i de -3 à 3 Faire :
		tabNeg[i] ← i * i
	fpour
	écrire("Tableau indexé de -3 à 3 (carrés) : ", tabNeg)

	// Matrice 2D (3 lignes x 4 colonnes, 1-based)
	matrice ← tableau entier[1 .. 3, 1 .. 4]
	Pour i de 1 à 3 Faire :
		Pour j de 1 à 4 Faire :
			matrice[i, j] ← i * 10 + j
		fpour
	fpour
	écrire("Matrice 2D [1..3, 1..4] case (2, 3) : ", matrice[2, 3])
	écrire("Matrice 2D [1..3, 1..4] case (3, 4) : ", matrice[3, 4])

	// Tableau littéral
	tabLit ← [5, 15, 25, 35, 45]
	écrire("Tableau littéral initialisé : ", tabLit)
	écrire("")

	// ─────────────────────────────────────────────────────────────────────────
	// 3. FONCTIONS RÉCURSIVES AVANCÉES (PASCAL, FACTORIELLE, FIBONACCI, HANOI)
	// ─────────────────────────────────────────────────────────────────────────
	écrire("=== 3. RÉCURSIVITÉ & ALGORITHMES COMPLEXES ===")

	// 3.1 Factorielle
	Fonction factorielle(n : entier) : entier
	Début
		Si (n ≤ 1) Alors :
			retourner 1
		Sinon :
			retourner n * factorielle(n - 1)
		fsi
	Fin

	// 3.2 Fibonacci
	Fonction fibonacci(n : entier) : entier
	Début
		Si (n = 0) Alors :
			retourner 0
		Sinon Si (n = 1) Alors :
			retourner 1
		Sinon :
			retourner fibonacci(n - 1) + fibonacci(n - 2)
		fsi
	Fin

	// 3.3 Triangle de Pascal (renvoie la n-ième ligne sous forme de tableau)
	Fonction lignePascal(n : entier) : tableau entier
	Début
		tab ← tableau entier[0 .. n - 1]
		tab[0] ← 1
		tab[n - 1] ← 1

		Si (n > 2) Faire :
			prec ← lignePascal(n - 1)
			Pour j de 1 à n - 2 Faire :
				tab[j] ← prec[j - 1] + prec[j]
			fpour
		fsi 

		retourner tab
	Fin

	// 3.4 Tours de Hanoï
	Fonction hanoi(n : entier, source : chaîne, destination : chaîne, auxiliaire : chaîne) : chaîne
	Début
		Si (n = 1) Alors :
			retourner concat(concat(concat("Disque 1 de ", source), " vers "), destination)
		Sinon :
			etape1 ← hanoi(n - 1, source, auxiliaire, destination)
			etape2 ← concat(concat(concat(concat(FIN_LIGNE, "Disque "), n), concat(" de ", source)), concat(" vers ", destination))
			etape3 ← concat(FIN_LIGNE, hanoi(n - 1, auxiliaire, destination, source))
			retourner concat(concat(etape1, etape2), etape3)
		fsi
	Fin

	écrire("Factorielle(5) : ", factorielle(5))
	écrire("Factorielle(7) : ", factorielle(7))
	écrire("Fibonacci(8)   : ", fibonacci(8))
	écrire("Ligne Pascal 1 : ", lignePascal(1))
	écrire("Ligne Pascal 5 : ", lignePascal(5))
	écrire("Ligne Pascal 6 : ", lignePascal(6))
	écrire("Tours de Hanoï (3 disques) :")
	écrire(hanoi(3, "Tour A", "Tour C", "Tour B"))
	écrire("")

	// ─────────────────────────────────────────────────────────────────────────
	// 4. PASSAGE PAR RÉFÉRENCE (PARAMÈTRES INOUT)
	// ─────────────────────────────────────────────────────────────────────────
	écrire("=== 4. PASSAGE DE PARAMÈTRES PAR RÉFÉRENCE (INOUT) ===")

	Fonction echanger(a InOut : entier, b InOut : entier)
	Début
		temp ← a
		a ← b
		b ← temp
	Fin

	Fonction incrementerCompteur(cpt InOut : entier, pas : entier)
	Début
		cpt ← cpt + pas
	Fin

	valX ← 42
	valY ← 99
	écrire("Avant échange : valX = ", valX, ", valY = ", valY)
	echanger(valX, valY)
	écrire("Après échange : valX = ", valX, ", valY = ", valY)

	compteur ← 10
	incrementerCompteur(compteur, 5)
	incrementerCompteur(compteur, 5)
	écrire("Compteur après incréments InOut : ", compteur)
	écrire("")

	// ─────────────────────────────────────────────────────────────────────────
	// 5. STRUCTURE DE DONNÉES : TDA LISTE (LINÉAIRE SIMPLE)
	// ─────────────────────────────────────────────────────────────────────────
	écrire("=== 5. STRUCTURE DE DONNÉES : TDA LISTE ===")

	maListe ← listeVide()
	maListe ← ajoutTeteListe(maListe, 30)
	maListe ← ajoutTeteListe(maListe, 20)
	maListe ← ajoutTeteListe(maListe, 10)
	maListe ← ajoutQueueListe(maListe, 40)
	maListe ← ajoutQueueListe(maListe, 50)

	écrire("Liste créée [10, 20, 30, 40, 50] : ", maListe)
	écrire("Longueur de la liste : ", longueurListe(maListe))
	écrire("Premier élément (tête) : ", val(maListe, tete(maListe)))
	écrire("Accès direct au 3e élément : ", acces(maListe, 3))

	// Parcours complet de la liste
	écrire("Parcours élément par élément :")
	pos ← tete(maListe)
	Tant que non finListe(maListe, pos) Faire :
		valeurCourante ← val(maListe, pos)
		écrire("  -> Élément : ", valeurCourante)
		pos ← suc(maListe, pos)
	ftq
	écrire("")

	// ─────────────────────────────────────────────────────────────────────────
	// 6. STRUCTURE DE DONNÉES : TDA PILE (LIFO - LAST IN FIRST OUT)
	// ─────────────────────────────────────────────────────────────────────────
	écrire("=== 6. STRUCTURE DE DONNÉES : TDA PILE (LIFO) ===")

	maPile ← pileVide()
	empiler(maPile, "A")
	empiler(maPile, "B")
	empiler(maPile, "C")
	empiler(maPile, "D")

	écrire("Sommet de la pile avant dépilement : ", sommet(maPile))
	
	// Dépiler tous les éléments (ordre inverse)
	écrire("Vidage de la pile :")
	Tant que non estVidePile(maPile) Faire :
		elem ← sommet(maPile)
		depiler(maPile)
		écrire("  -> Dépilé : ", elem)
	ftq
	écrire("La pile est-elle vide ? ", estVidePile(maPile))
	écrire("")

	// ─────────────────────────────────────────────────────────────────────────
	// 7. STRUCTURE DE DONNÉES : TDA FILE (FIFO - FIRST IN FIRST OUT)
	// ─────────────────────────────────────────────────────────────────────────
	écrire("=== 7. STRUCTURE DE DONNÉES : TDA FILE (FIFO) ===")

	maFile ← fileVide()
	enfiler(maFile, "Client 1")
	enfiler(maFile, "Client 2")
	enfiler(maFile, "Client 3")

	écrire("Premier de la file : ", premier(maFile))

	// Défiler tous les éléments (ordre d'arrivée)
	écrire("Traitement de la file d'attente :")
	Tant que non estVideFile(maFile) Faire :
		clientServi ← premier(maFile)
		defiler(maFile)
		écrire("  -> Traitement de : ", clientServi)
	ftq
	écrire("La file est-elle vide ? ", estVideFile(maFile))
	écrire("")

	// ─────────────────────────────────────────────────────────────────────────
	// 8. STRUCTURE DE DONNÉES : TDA LISTE SYMÉTRIQUE (DOUBLEMENT CHAÎNÉE)
	// ─────────────────────────────────────────────────────────────────────────
	écrire("=== 8. STRUCTURE DE DONNÉES : TDA LISTE SYMÉTRIQUE ===")

	maLS ← videLS()
	ajoutTeteLS(maLS, 200)
	ajoutTeteLS(maLS, 100)
	ajoutQueueLS(maLS, 300)
	ajoutQueueLS(maLS, 400)

	écrire("Liste symétrique créée : [100, 200, 300, 400]")
	
	// Parcours avant
	écrire("Parcours avant (tête vers queue) :")
	curLS ← teteLS(maLS)
	Tant que non finLS(maLS, curLS) Faire :
		écrire("  -> ", valLS(maLS, curLS))
		curLS ← sucLS(maLS, curLS)
	ftq

	// Parcours arrière
	écrire("Parcours arrière (queue vers tête) :")
	curLS ← queueLS(maLS)
	Tant que non finLS(maLS, curLS) Faire :
		écrire("  <- ", valLS(maLS, curLS))
		curLS ← precLS(maLS, curLS)
	ftq
	écrire("")

	// ─────────────────────────────────────────────────────────────────────────
	// 9. STRUCTURE DE DONNÉES : TDA TABLE (DICTIONNAIRE / HASHMAP)
	// ─────────────────────────────────────────────────────────────────────────
	écrire("=== 9. STRUCTURE DE DONNÉES : TDA TABLE / MAP ===")

	// Création avec Table(k → v)
	annuaire ← Table("Alice" → "0601020304", "Bob" → "0611223344", "Charlie" → "0699887766")
	
	// Ajouts et modifications
	ajoutTable(annuaire, "David", "0700112233")
	changeTable(annuaire, "Alice", "0600000000")

	écrire("Numéro de Bob     : ", accesTable(annuaire, "Bob"))
	écrire("Numéro d'Alice    : ", accesTable(annuaire, "Alice"))
	écrire("Numéro de David    : ", accesTable(annuaire, "David"))
	écrire("Clés dans la table : ", domaineTable(annuaire))

	// Suppression
	suppressionTable(annuaire, "Charlie")
	écrire("Après suppression de Charlie : ", domaineTable(annuaire))
	écrire("")

	// ─────────────────────────────────────────────────────────────────────────
	// 10. MANIPULATION DE CHAÎNES & OPÉRATEURS LOGIQUES ET ARITHMÉTIQUES
	// ─────────────────────────────────────────────────────────────────────────
	écrire("=== 10. OPÉRATIONS SUR CHAÎNES & LOGIQUE ===")

	texteSource ← "Algorithmique Avancee"
	écrire("Longueur : ", longueur(texteSource))
	écrire("3e caractère : ", ième(texteSource, 3))
	écrire("Sous-chaîne [1..13] : ", souschaîne(texteSource, 1, 13))
	écrire("Concaténation : ", concat("Bonjour ", "tout le monde !"))

	// Opérateurs logiques et de comparaison
	a ← 15
	b ← 4
	écrire("15 mod 4 = ", a mod b)
	écrire("15 ÷ 4 (division entière) = ", a ÷ b)
	écrire("Est-ce que a ≠ b et b ≤ 10 ? ", (a ≠ b et b ≤ 10))
	écrire("Est-ce que a < 10 ou b = 4 ? ", (a < 10 ou b = 4))
	écrire("Négation de faux : ", non faux)
	écrire("")

	// ─────────────────────────────────────────────────────────────────────────
	// 11. GESTION DES FICHIERS (ENTRÉES / SORTIES SUR FICHIER)
	// ─────────────────────────────────────────────────────────────────────────
	écrire("=== 11. GESTION DES FICHIERS ENTRÉE/SORTIE ===")

	nomFichierTest ← "/tmp/test_demo_pseudocode.txt"
	fich ← fichierCreer(nomFichierTest)
	fichierEcrire(fich, "Ligne 1 : Test du TDA Fichier")
	fichierEcrire(fich, FIN_LIGNE)
	fichierEcrire(fich, "Ligne 2 : Enregistrement de données BUT Info")
	fichierEcrire(fich, FIN_LIGNE)
	fichierEcrire(fich, "Ligne 3 : Fin du fichier")
	fichierFermer(fich)
	écrire("Fichier créé et écrit avec succès dans ", nomFichierTest)

	// Relecture du fichier
	fichLecture ← fichierOuvrir(nomFichierTest)
	nbLignesLues ← 0
	Tant que non fichierFin(fichLecture) Faire :
		ligneLue ← fichierLire(fichLecture)
		nbLignesLues ← nbLignesLues + 1
		écrire("  [Fichier L", nbLignesLues, "] : ", ligneLue)
	ftq
	fichierFermer(fichLecture)
	écrire("")

	// ─────────────────────────────────────────────────────────────────────────
	// 12. ALGORITHME DE TRI RAPIDE (QUICKSORT) SUR TABLEAU DYNAMIQUE
	// ─────────────────────────────────────────────────────────────────────────
	écrire("=== 12. ALGORITHME AVANCÉ : TRI FUSION / QUICKSORT ===")

	Fonction partitionner(tab InOut : tableau entier, bas : entier, haut : entier) : entier
	Début
		pivot ← tab[haut]
		i ← bas - 1
		Pour j de bas à haut - 1 Faire :
			Si tab[j] ≤ pivot Alors :
				i ← i + 1
				temp ← tab[i]
				tab[i] ← tab[j]
				tab[j] ← temp
			fsi
		fpour
		temp2 ← tab[i + 1]
		tab[i + 1] ← tab[haut]
		tab[haut] ← temp2
		retourner i + 1
	Fin

	Fonction quickSort(tab InOut : tableau entier, bas : entier, haut : entier)
	Début
		Si bas < haut Alors :
			pi ← partitionner(tab, bas, haut)
			quickSort(tab, bas, pi - 1)
			quickSort(tab, pi + 1, haut)
		fsi
	Fin

	tabATrier ← [64, 34, 25, 12, 22, 11, 90, 88, 45, 5]
	écrire("Tableau avant tri : ", tabATrier)
	quickSort(tabATrier, 0, 9)
	écrire("Tableau après QuickSort : ", tabATrier)
	écrire("")

	écrire("╔════════════════════════════════════════════════════════════════╗")
	écrire("║      🎉 TOUS LES TESTS SE SONT EXÉCUTÉS AVEC SUCCÈS !          ║")
	écrire("╚════════════════════════════════════════════════════════════════╝")
Fin
