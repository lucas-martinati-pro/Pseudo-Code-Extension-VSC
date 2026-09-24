/**
 * Registre central des définitions pour le langage Pseudo-Code (Source Unique de Vérité).
 * 
 * ⚠️ IMPORTANT : Ce fichier alimente automatiquement l'ensemble de l'extension :
 * 1. La grammaire TextMate (syntaxes/psc.tmLanguage.json) :
 *    - Les fonctions intégrées (support-functions), les mots-clés, opérateurs et types y sont
 *      synchronisés automatiquement par 'npm run generate-grammar' (inclus dans 'npm run compile').
 *    - NE PAS modifier manuellement support-functions dans syntaxes/psc.tmLanguage.json.
 * 2. Le Linter / Diagnostics :
 *    - KNOWN_IDENTIFIERS et BUILTIN_FUNCTION_ARITY sont directement dérivés de ce registre.
 * 3. L'Autocomplétion & Signature Help :
 *    - Les signatures, snippets, catégories et documentations proviennent de ce registre.
 * 4. L'Exécuteur / Transpileur vers Lua :
 *    - Les fonctions et opérateurs sont transpilés via les équivalents et helpers Lua définis ici.
 */

export interface PscType {
    name: string;
    aliases: string[];
    description?: string;
}

export interface PscFunction {
    name: string;
    arity: number | number[];
    luaHelper: string;
    isMutator?: boolean; // Si vrai, l'appel est transformé en réaffectation du 1er argument (ex: ajout(l, v) -> l = ajout(l, v))
    description?: string;
    signature?: string;
    snippet?: string;
    category?: string;
    targetType?: string | string[]; // Type(s) ciblé(s) pour la complétion par point (ex: 'liste', 'table', ['chaîne', 'tableau'])
    methodSnippet?: string; // Snippet spécifique pour l'appel sous forme de méthode
}

export interface PscKeyword {
    name: string;
    type: 'control' | 'block' | 'boolean' | 'operator' | 'io' | 'modifier' | 'other';
    luaEquivalent?: string;
    description?: string;
}

export const PSC_DEFINITIONS = {
    types: [
        {
            name: 'entier',
            aliases: ['entier'],
            description: '**entier** — Type numérique représentant un nombre entier relatif signé.\n\n```psc\nx : entier\nx ← 42\n```'
        },
        {
            name: 'réel',
            aliases: ['réel', 'reel'],
            description: '**réel** — Type numérique représentant un nombre décimal à virgule flottante.\n\n```psc\nmoyenne : réel\nmoyenne ← 14.75\n```'
        },
        {
            name: 'booléen',
            aliases: ['booléen', 'booleen'],
            description: '**booléen** — Type logique ne pouvant prendre que deux valeurs : `vrai` ou `faux`.\n\n```psc\nestActif : booléen\nestActif ← vrai\n```'
        },
        {
            name: 'chaîne',
            aliases: ['chaîne', 'chaine'],
            description: '**chaîne** — Séquence ordonnée de caractères textuels encodés en UTF-8.\n\n```psc\nmessage : chaîne\nmessage ← "Bonjour le monde"\n```'
        },
        {
            name: 'caractère',
            aliases: ['caractère', 'caractere'],
            description: '**caractère** — Caractère unique entouré de guillemets simples ou doubles.\n\n```psc\nlettre : caractère\nlettre ← \'A\'\n```'
        },
        {
            name: 'tableau',
            aliases: ['tableau'],
            description: '**tableau** — Structure de données indexée (1D, 2D ou multidimensionnelle) à bornes statiques ou dynamiques.\n\n```psc\ntab ← tableau entier[0..9]\nmatrice ← tableau réel[1..3, 1..3]\n```\n> ⚠️ **Piège classique :** Tout accès hors des bornes déclarées (ex. `tab[15]`) déclenchera une erreur à l\'exécution.'
        },
        {
            name: 'liste',
            aliases: ['liste'],
            description: '**liste** — Type de données abstrait (TDA) représentant une liste simplement chaînée linéaire.\n\n```psc\nl : liste\nl ← listeVide()\nl ← ajoutTeteListe(l, 10)\n```'
        },
        {
            name: 'pile',
            aliases: ['pile'],
            description: '**pile** — Type de données abstrait (TDA) suivant la discipline LIFO (Dernier entré, premier sorti).\n\n```psc\np : pile\np ← pileVide()\nempiler(p, "A")\n```\n> ⚠️ **Attention :** Vérifiez toujours `non estVidePile(p)` avant d\'appeler `sommet(p)` ou `dépiler(p)`.'
        },
        {
            name: 'file',
            aliases: ['file'],
            description: '**file** — Type de données abstrait (TDA) suivant la discipline FIFO (Premier entré, premier sorti).\n\n```psc\nf : file\nf ← fileVide()\nenfiler(f, "Client 1")\n```\n> ⚠️ **Attention :** Vérifiez toujours `non estVideFile(f)` avant d\'appeler `premier(f)` ou `défiler(f)`.'
        },
        {
            name: 'listesym',
            aliases: ['listesym'],
            description: '**listesym** — Type de données abstrait (TDA) pour une liste symétrique (doublement chaînée), permettant un parcours dans les deux sens (`sucLS` et `precLS`).\n\n```psc\nls : listesym\nls ← videLS()\n```'
        },
        {
            name: 'table',
            aliases: ['table'],
            description: '**table** — Type de données abstrait (TDA) associatif (dictionnaire / map) associant des clés uniques à des valeurs.\n\n```psc\nannuaire : table\nannuaire ← table("Alice", "0601020304", "Bob", "0611223344")\n```'
        },
        {
            name: 'ensemble',
            aliases: ['ensemble'],
            description: '**ensemble** — Collection de valeurs uniques non ordonnées. Supporte le test d\'appartenance `estDans` et l\'itération `Pour chaque`.\n\n```psc\nens : ensemble\nens ← ["alpha", "beta", "gamma"]\n```'
        },
        {
            name: 'fichier',
            aliases: ['fichier'],
            description: '**fichier** — Descripteur de fichier pour les opérations d\'entrées/sorties séquentielles sur disque.\n\n```psc\nhandle : fichier\nhandle ← fichierOuvrir("data.txt")\n```\n> 💡 **Bonne pratique :** Toujours refermer le descripteur avec `fichierFermer(handle)` après utilisation.'
        },
        {
            name: 'arbin',
            aliases: ['arbin', 'arbrebinaire', 'arbrebinaireentier', 'arbrebinairechaine', 'arbrebinairechaîne', 'arbrebinairebooleen', 'arbrebinairebooléen', 'arbrebinairereel', 'arbrebinaireréel'],
            description: '**arbin[T]** — Type de données abstrait (TDA) représentant un arbre binaire hiérarchique récursif.\n\n```psc\nSoit ArbreBinaireEntier = arbin[entier]\narbre : ArbreBinaireEntier\narbre ← créerarb(10)\n```\n> ⚠️ **Piège classique :** Un arbre vide ne possède pas de racine (`racine(a) = nil`). Ne jamais appeler `fg`, `fd` ou `val` sur un nœud sans tester `non noeudvide(a, n)`.'
        },
        {
            name: 'noeud',
            aliases: ['noeud', 'nœud'],
            description: '**noeud** — Référence opaque vers un nœud au sein d\'un arbre binaire (ou `nil` si absent).\n\n```psc\nn : Noeud\nn ← racine(arbre)\n```'
        }
    ] as PscType[],

    keywords: [
        // Contrôle
        {
            name: 'soit',
            type: 'control',
            description: '**Soit** — Déclaration de type alias ou de variable locale/globale.\n\n```psc\nSoit ArbreBinaireEntier = arbin[entier]\nSoit cpt = 0\n```'
        },
        {
            name: 'si',
            type: 'control',
            luaEquivalent: 'if',
            description: '**Si** — Structure conditionnelle avec branche(s) alternative(s) facultative(s).\n\n```psc\nSi x > 0 Alors :\n\técrire("Positif")\nSinon si x = 0 Alors :\n\técrire("Nul")\nSinon :\n\técrire("Négatif")\nfsi\n```\n> ⚠️ **Attention :** Le bloc doit impérativement être fermé par `fsi`.'
        },
        {
            name: 'alors',
            type: 'control',
            luaEquivalent: 'then',
            description: '**Alors** — Marqueur clôturant la condition d\'un bloc `Si` ou `Sinon si`.\n\n```psc\nSi condition Alors :\n\t...\nfsi\n```'
        },
        {
            name: 'sinon',
            type: 'control',
            luaEquivalent: 'else',
            description: '**Sinon** — Branche alternative exécutée lorsque toutes les conditions précédentes d\'un `Si` sont fausses.\n\n```psc\nSi x ≥ 10 Alors :\n\técrire("Admis")\nSinon :\n\técrire("Ajourné")\nfsi\n```'
        },
        {
            name: 'fsi',
            type: 'control',
            luaEquivalent: 'end',
            description: '**fsi** — Mot-clé marquant obligatoirement la fin d\'une structure conditionnelle `Si`.\n\n> ⚠️ **Linter :** L\'omission de `fsi` déclenche un avertissement de bloc non fermé.'
        },
        {
            name: 'tant',
            type: 'control',
            luaEquivalent: 'while',
            description: '**Tant que** — Boucle itérative avec pré-condition évaluée avant chaque itération.\n\n```psc\nTant que cpt > 0 Faire :\n\técrire(cpt)\n\tcpt ← cpt - 1\nftq\n```\n> ⚠️ **Piège classique :** Assurez-vous que la condition devienne fausse pour éviter une boucle infinie. Se termine obligatoirement par `ftq`.'
        },
        { name: 'que', type: 'control' },
        {
            name: 'ftq',
            type: 'control',
            luaEquivalent: 'end',
            description: '**ftq** — Mot-clé marquant la fin d\'une boucle `Tant que`.\n\n> 💡 **Variante acceptée :** `ftant`.'
        },
        {
            name: 'pour',
            type: 'control',
            luaEquivalent: 'for',
            description: '**Pour** — Boucle itérative avec variable de contrôle (numérique) ou parcours de collection.\n\n```psc\n// Itération numérique croissante\nPour i de 0 à n-1 Faire :\n\técrire(i)\nfpour\n\n// Itération numérique décroissante\nPour i de 10 à 1 décroissant Faire :\n\técrire(i)\nfpour\n\n// Itération sur collection (ensemble, table, tableau, liste)\nPour chaque elem dans maCollection Faire :\n\técrire(elem)\nfpour\n```\n> ⚠️ **Fermeture obligatoire :** Chaque boucle `Pour` doit se terminer par `fpour`.'
        },
        {
            name: 'chaque',
            type: 'control',
            description: '**chaque** — Utilisé dans `Pour chaque <var> dans <col>` pour itérer sur tous les éléments d\'une collection (ensemble, table, liste, tableau).'
        },
        {
            name: 'dans',
            type: 'control',
            description: '**dans** — Désigne la collection cible au sein d\'une boucle `Pour chaque <var> dans <collection>`.'
        },
        { name: 'allant', type: 'control' },
        { name: 'de', type: 'control' },
        { name: 'à', type: 'control' },
        {
            name: 'faire',
            type: 'control',
            luaEquivalent: 'do',
            description: '**Faire** — Marqueur clôturant l\'en-tête d\'une boucle `Pour` ou `Tant que`.\n\n```psc\nPour i de 1 à 10 Faire :\n\t...\nfpour\n```'
        },
        {
            name: 'fpour',
            type: 'control',
            luaEquivalent: 'end',
            description: '**fpour** — Mot-clé marquant obligatoirement la fin d\'une boucle `Pour` ou `Pour chaque`.'
        },
        {
            name: 'décroissant',
            type: 'control',
            description: '**décroissant** — Modificateur de boucle `Pour` appliquant un pas de décrémentation automatique (-1).\n\n```psc\nPour i de 10 à 0 décroissant Faire :\n\técrire("T-", i)\nfpour\n```'
        },
        {
            name: 'retourner',
            type: 'control',
            luaEquivalent: 'return',
            description: '**retourner** — Interrompt immédiatement l\'exécution d\'une fonction et renvoie la valeur spécifiée à l\'appelant.\n\n```psc\nFonction doubler(x : entier) : entier\nDébut\n\tretourner x * 2\nFin\n```'
        },
        {
            name: 'retourne',
            type: 'control',
            luaEquivalent: 'return',
            description: '**retourne** — Variante de `retourner` pour renvoyer une valeur depuis une fonction.'
        },

        // Blocs
        {
            name: 'début',
            type: 'block',
            description: '**Début** — Marque l\'ouverture du corps d\'instructions d\'un `Algorithme` ou d\'une `Fonction`.\n\nDoit obligatoirement être apparié avec un `Fin`.'
        },
        {
            name: 'fin',
            type: 'block',
            description: '**Fin** — Marque la clôture du corps d\'un `Algorithme` ou d\'une `Fonction`.'
        },
        {
            name: 'algorithme',
            type: 'block',
            description: '**Algorithme** — Déclare le point d\'entrée principal du programme.\n\n```psc\nAlgorithme MonProgramme\nDébut\n\técrire("Bonjour !")\nFin\n```'
        },
        {
            name: 'fonction',
            type: 'block',
            description: '**Fonction** — Déclare un sous-programme avec ou sans valeur de retour.\n\n```psc\nFonction calculerMoyenne(notes : tableau réel[1..n], n : entier) : réel\nDébut\n\t...\nFin\n```'
        },

        // Booléens
        {
            name: 'vrai',
            type: 'boolean',
            luaEquivalent: 'true',
            description: '**vrai** — Valeur constante de vérité logique (`true`).'
        },
        {
            name: 'faux',
            type: 'boolean',
            luaEquivalent: 'false',
            description: '**faux** — Valeur constante de fausseté logique (`false`).'
        },
        {
            name: 'nil',
            type: 'boolean',
            luaEquivalent: 'nil',
            description: '**nil** — Représente l\'absence de valeur, une référence vide (pour un nœud d\'arbre ou une place) ou une clé inexistante dans une table.'
        },

        // Opérateurs
        {
            name: 'et',
            type: 'operator',
            luaEquivalent: 'and',
            description: '**et** — Opérateur de conjonction logique. L\'expression est vraie si et seulement si les deux opérandes sont vrais.\n\n```psc\nSi (age ≥ 18) et (aPermis = vrai) Alors :\n\t...\nfsi\n```'
        },
        {
            name: 'ou',
            type: 'operator',
            luaEquivalent: 'or',
            description: '**ou** — Opérateur de disjonction logique inclusive. L\'expression est vraie si au moins l\'un des deux opérandes est vrai.\n\n```psc\nSi (jour = "Samedi") ou (jour = "Dimanche") Alors :\n\t...\nfsi\n```'
        },
        {
            name: 'non',
            type: 'operator',
            luaEquivalent: 'not',
            description: '**non** — Opérateur de négation logique. Inverse la valeur de vérité de l\'expression qui le suit.\n\n```psc\nSi non finListe(l, p) Alors :\n\t...\nfsi\n```'
        },
        {
            name: 'mod',
            type: 'operator',
            luaEquivalent: '%',
            description: '**mod** — Opérateur modulo : renvoie le reste de la division entière entre deux entiers.\n\n```psc\nreste ← 17 mod 5 // vaut 2\n```'
        },

        // IO
        {
            name: 'écrire',
            type: 'io',
            luaEquivalent: '__psc_write',
            description: '**écrire(...)** — Affiche une ou plusieurs valeurs formatées sur la sortie standard (terminal).\n\n```psc\nécrire("Résultat : ", total, " €")\n```\n> 💡 **Bonus :** Sérialise automatiquement et élégamment les Arbres Binaires (`ArbreBin(...)`), les Piles, les Files, les Tableaux et les Structures composites.'
        },
        {
            name: 'lire',
            type: 'io',
            luaEquivalent: 'io.read',
            description: '**lire()** : chaîne — Lit une ligne de texte saisie par l\'utilisateur depuis l\'entrée standard.\n\n```psc\nécrire("Entrez votre prénom :")\nnom ← lire()\n```'
        },

        // Modificateurs
        {
            name: 'inout',
            type: 'modifier',
            description: '**InOut** — Modificateur de paramètre : passage par référence (entrée/sortie).\n\nPermet à une fonction de modifier directement la variable fournie par l\'appelant.\n\n```psc\nFonction echanger(a InOut : entier, b InOut : entier)\nDébut\n\ttemp ← a\n\ta ← b\n\tb ← temp\nFin\n```\n> ⚠️ **Précondition :** L\'argument passé doit obligatoirement être une variable modifiable (pas un littéral numérique comme `echanger(1, 2)`).'
        }
    ] as PscKeyword[],

    functions: [
        // Opérations sur les chaînes
        {
            name: 'longueur',
            arity: 1,
            luaHelper: '#',
            description: 'Renvoie la longueur d\'une chaîne de caractères ou le nombre d\'éléments d\'un tableau.\n\n```psc\nlen ← longueur("Algorithme") // 10\ntaille ← longueur(tab)\n```',
            signature: 'longueur(s) : entier',
            snippet: 'longueur(${1:s})',
            methodSnippet: 'longueur(${VAR})',
            category: 'Chaînes',
            targetType: ['chaîne', 'chaine', 'tableau']
        },
        {
            name: 'concat',
            arity: 2,
            luaHelper: '..',
            description: 'Concatène deux chaînes de caractères en une seule.\n\n```psc\nphrase ← concat("Bonjour ", nom)\n```',
            signature: 'concat(s1 : chaîne, s2 : chaîne) : chaîne',
            snippet: 'concat(${1:s1}, ${2:s2})',
            methodSnippet: 'concat(${VAR}, ${1:s2})',
            category: 'Chaînes',
            targetType: ['chaîne', 'chaine']
        },
        {
            name: 'souschaîne',
            arity: 3,
            luaHelper: 'string.sub',
            description: 'Extrait la portion de la chaîne comprise entre les indices `début` et `fin` inclus (indexation 1-based).\n\n```psc\nextrait ← souschaîne("Informatique", 1, 4) // "Info"\n```\n> ⚠️ **Précondition :** `1 ≤ début ≤ fin ≤ longueur(s)`.',
            signature: 'souschaîne(s : chaîne, début : entier, fin : entier) : chaîne',
            snippet: 'souschaîne(${1:s}, ${2:début}, ${3:fin})',
            methodSnippet: 'souschaîne(${VAR}, ${1:début}, ${2:fin})',
            category: 'Chaînes',
            targetType: ['chaîne', 'chaine']
        },
        {
            name: 'ième',
            arity: 2,
            luaHelper: 'string.sub',
            description: 'Renvoie le caractère unique situé à la position `i` dans la chaîne `s` (indexation 1-based).\n\n```psc\ncar ← ième("Bonjour", 1) // \'B\'\n```\n> ⚠️ **Précondition :** `1 ≤ i ≤ longueur(s)`.',
            signature: 'ième(s : chaîne, i : entier) : caractère',
            snippet: 'ième(${1:s}, ${2:i})',
            methodSnippet: 'ième(${VAR}, ${1:i})',
            category: 'Chaînes',
            targetType: ['chaîne', 'chaine']
        },
        {
            name: 'chaineversentier',
            arity: 1,
            luaHelper: '__psc_chaineVersEntier',
            description: 'Convertit une représentation textuelle d\'un nombre en entier numérique.\n\n```psc\nval ← chaîneVersEntier("123") // 123\n```\n> ⚠️ **Piège :** Si la chaîne contient des caractères non numériques, renvoie `0`.',
            signature: 'chaîneVersEntier(s : chaîne) : entier',
            snippet: 'chaîneVersEntier(${1:s})',
            methodSnippet: 'chaîneVersEntier(${VAR})',
            category: 'Chaînes',
            targetType: ['chaîne', 'chaine']
        },

        // Fichiers
        {
            name: 'fichierouvrir',
            arity: [1, 2],
            luaHelper: '__psc_fichierOuvrir',
            description: 'Ouvre un fichier sur le disque. Mode optionnel : `"r"` (lecture, par défaut), `"w"` (écriture), `"a"` (ajout).\n\n```psc\nhandle ← fichierOuvrir("donnees.txt")\n```\n> ⚠️ **Piège :** Provoque une erreur si le fichier est ouvert en lecture et n\'existe pas.',
            signature: 'fichierOuvrir(nom : chaîne [, mode : chaîne]) : entier',
            snippet: 'fichierOuvrir(${1:nomFichier})',
            category: 'Fichiers'
        },
        {
            name: 'fichierfermer',
            arity: [0, 1],
            luaHelper: '__psc_fichierFermer',
            description: 'Ferme le descripteur de fichier et libère le verrou système associé.\n\n```psc\nfichierFermer(handle)\n```\n> 💡 **Bonne pratique :** Toujours fermer les fichiers pour s\'assurer que les écritures sont bien vidées sur le disque.',
            signature: 'fichierFermer([handle : entier])',
            snippet: 'fichierFermer(${1:handle})',
            methodSnippet: 'fichierFermer(${VAR})',
            category: 'Fichiers',
            targetType: 'fichier'
        },
        {
            name: 'fichierlire',
            arity: [0, 1],
            luaHelper: '__psc_fichierLire',
            description: 'Lit et renvoie la prochaine ligne de texte du fichier ouvert désigné par `handle`.\n\n```psc\nligne ← fichierLire(handle)\n```',
            signature: 'fichierLire([handle : entier]) : chaîne',
            snippet: 'fichierLire(${1:handle})',
            methodSnippet: 'fichierLire(${VAR})',
            category: 'Fichiers',
            targetType: 'fichier'
        },
        {
            name: 'fichierfin',
            arity: [0, 1],
            luaHelper: '__psc_fichierFin',
            description: 'Prédicat indiquant si la fin du fichier (EOF) a été atteinte.\n\n```psc\nTant que non fichierFin(handle) Faire :\n\tligne ← fichierLire(handle)\n\técrire(ligne)\nftq\n```',
            signature: 'fichierFin([handle : entier]) : booléen',
            snippet: 'fichierFin(${1:handle})',
            methodSnippet: 'fichierFin(${VAR})',
            category: 'Fichiers',
            targetType: 'fichier'
        },
        {
            name: 'fichiercreer',
            arity: 1,
            luaHelper: '__psc_fichierCreer',
            description: 'Crée un nouveau fichier vierge sur le disque en mode écriture (écrase le fichier existant s\'il y en a un).\n\n```psc\nhandle ← fichierCréer("resultat.txt")\n```',
            signature: 'fichierCréer(nom : chaîne) : entier',
            snippet: 'fichierCréer(${1:nomFichier})',
            category: 'Fichiers'
        },
        {
            name: 'fichierecrire',
            arity: 2,
            luaHelper: '__psc_fichierEcrire',
            description: 'Écrit une valeur dans le fichier ouvert désigné par `handle`.\n\n```psc\nfichierÉcrire(handle, "Ligne de données")\nfichierÉcrire(handle, FIN_LIGNE)\n```',
            signature: 'fichierÉcrire(handle : entier, valeur)',
            snippet: 'fichierÉcrire(${1:handle}, ${2:valeur})',
            methodSnippet: 'fichierÉcrire(${VAR}, ${1:valeur})',
            category: 'Fichiers',
            targetType: 'fichier'
        },

        // Comparaison générale
        {
            name: 'comparaison',
            arity: 2,
            luaHelper: '__psc_comparaison',
            description: 'Compare récursivement deux éléments quelconques (structures composites, réels, chaînes, tableaux). Renvoie `vrai` s\'ils sont identiques champ par champ, `faux` sinon.\n\n```psc\nSi comparaison(p1, p2) Alors :\n\técrire("Mêmes coordonnées")\nfsi\n```',
            signature: 'comparaison(a, b) : booléen',
            snippet: 'comparaison(${1:a}, ${2:b})',
            category: 'Autre'
        },

        // TDA Liste & Structures
        {
            name: 'tete',
            arity: 1,
            luaHelper: '__psc_generic_tete',
            description: 'Renvoie la place pointant sur le premier élément de la liste chaînée `l`.\n\n```psc\np ← tete(maListe)\n```',
            signature: 'tete(l : Liste) : place',
            snippet: 'tete(${1:l})',
            methodSnippet: 'tete(${VAR})',
            category: 'Liste',
            targetType: 'liste'
        },
        {
            name: 'val',
            arity: [1, 2],
            luaHelper: '__psc_liste_val',
            description: 'Renvoie la valeur associée à un nœud d\'arbre binaire ou à une place de liste chaînée.\n\n```psc\n// Sur un arbre binaire :\nv ← val(arbre, noeud)\n\n// Sur une liste chaînée :\nv ← val(maListe, p)\n```\n> ⚠️ **Piège classique :** Provoque une erreur d\'exécution si le nœud est `nil` ou si la place est en fin de liste (`finListe`).',
            signature: 'val(col, place_ou_noeud) : élément',
            snippet: 'val(${1:arbre}, ${2:noeud})',
            methodSnippet: 'val(${VAR}, ${1:place_ou_noeud})',
            category: 'Structure',
            targetType: ['liste', 'arbin', 'arbrebinaire', 'noeud']
        },
        {
            name: 'suc',
            arity: 2,
            luaHelper: '__psc_liste_suc',
            description: 'Renvoie la place suivante dans la liste chaînée après la place `p`.\n\n```psc\np ← suc(maListe, p)\n```\n> ⚠️ **Précondition :** `p` ne doit pas déjà être en fin de liste (`non finListe(l, p)`).',
            signature: 'suc(l : Liste, p : place) : place',
            snippet: 'suc(${1:l}, ${2:p})',
            methodSnippet: 'suc(${VAR}, ${1:p})',
            category: 'Liste',
            targetType: 'liste'
        },
        {
            name: 'finliste',
            arity: 2,
            luaHelper: '__psc_liste_fin',
            description: 'Prédicat indiquant si la place `p` a dépassé le dernier élément de la liste `l`.\n\n```psc\nTant que non finListe(l, p) Faire :\n\técrire(val(l, p))\n\tp ← suc(l, p)\nftq\n```',
            signature: 'finListe(l : Liste, p : place) : booléen',
            snippet: 'finListe(${1:l}, ${2:p})',
            methodSnippet: 'finListe(${VAR}, ${1:p})',
            category: 'Liste',
            targetType: 'liste'
        },
        {
            name: 'listevide',
            arity: 0,
            luaHelper: '__psc_liste_vide',
            description: 'Instancie et renvoie une nouvelle liste simplement chaînée vide.\n\n```psc\nmaListe ← listeVide()\n```',
            signature: 'listeVide() : Liste',
            snippet: 'listeVide()',
            category: 'Liste',
            targetType: 'liste'
        },
        {
            name: 'longueurliste',
            arity: 1,
            luaHelper: '__psc_liste_longueur',
            description: 'Renvoie le nombre d\'éléments contenus dans la liste `l`.\n\n```psc\nnb ← longueurListe(maListe)\n```',
            signature: 'longueurListe(l : Liste) : entier',
            snippet: 'longueurListe(${1:l})',
            methodSnippet: 'longueurListe(${VAR})',
            category: 'Liste',
            targetType: 'liste'
        },
        {
            name: 'acces',
            arity: 2,
            luaHelper: '__psc_liste_acces',
            description: 'Accède directement par son rang (1-based) au i-ème élément de la liste chaînée.\n\n```psc\nelem ← acces(maListe, 3)\n```\n> ⚠️ **Précondition :** `1 ≤ i ≤ longueurListe(l)`.',
            signature: 'acces(l : Liste, i : entier) : élément',
            snippet: 'acces(${1:l}, ${2:i})',
            methodSnippet: 'acces(${VAR}, ${1:i})',
            category: 'Liste',
            targetType: 'liste'
        },
        {
            name: 'ajoutteteliste',
            arity: 2,
            luaHelper: '__psc_liste_ajout_tete',
            isMutator: true,
            description: 'Insère une nouvelle valeur `v` en tête de liste et met à jour `l`.\n\n```psc\nl ← ajoutTeteListe(l, 42)\n```',
            signature: 'ajoutTeteListe(l : Liste, v) : Liste',
            snippet: 'ajoutTeteListe(${1:l}, ${2:v})',
            methodSnippet: 'ajoutTeteListe(${VAR}, ${1:v})',
            category: 'Liste',
            targetType: 'liste'
        },
        {
            name: 'suppressionteteliste',
            arity: 1,
            luaHelper: '__psc_liste_suppression_tete',
            isMutator: true,
            description: 'Supprime le premier élément en tête de la liste `l` et met à jour la liste.\n\n```psc\nl ← suppressionTeteListe(l)\n```\n> ⚠️ **Précondition :** La liste ne doit pas être vide.',
            signature: 'suppressionTeteListe(l : Liste) : Liste',
            snippet: 'suppressionTeteListe(${1:l})',
            methodSnippet: 'suppressionTeteListe(${VAR})',
            category: 'Liste',
            targetType: 'liste'
        },
        {
            name: 'ajoutqueueliste',
            arity: 2,
            luaHelper: '__psc_liste_ajout_queue',
            isMutator: true,
            description: 'Insère une nouvelle valeur `v` en dernière position (queue) de la liste `l`.\n\n```psc\nl ← ajoutQueueListe(l, 99)\n```',
            signature: 'ajoutQueueListe(l : Liste, v) : Liste',
            snippet: 'ajoutQueueListe(${1:l}, ${2:v})',
            methodSnippet: 'ajoutQueueListe(${VAR}, ${1:v})',
            category: 'Liste',
            targetType: 'liste'
        },
        {
            name: 'suppressionqueueliste',
            arity: 1,
            luaHelper: '__psc_liste_suppression_queue',
            isMutator: true,
            description: 'Supprime le dernier élément en queue de la liste `l`.\n\n```psc\nl ← suppressionQueueListe(l)\n```\n> ⚠️ **Précondition :** La liste ne doit pas être vide.',
            signature: 'suppressionQueueListe(l : Liste) : Liste',
            snippet: 'suppressionQueueListe(${1:l})',
            methodSnippet: 'suppressionQueueListe(${VAR})',
            category: 'Liste',
            targetType: 'liste'
        },
        {
            name: 'ajoutliste',
            arity: 3,
            luaHelper: '__psc_liste_ajout',
            isMutator: true,
            description: 'Insère une nouvelle valeur `v` à la place `p` spécifiée dans la liste `l`.\n\n```psc\nl ← ajoutListe(l, p, 100)\n```',
            signature: 'ajoutListe(l : Liste, p : place, v) : Liste',
            snippet: 'ajoutListe(${1:l}, ${2:p}, ${3:v})',
            methodSnippet: 'ajoutListe(${VAR}, ${1:p}, ${2:v})',
            category: 'Liste',
            targetType: 'liste'
        },
        {
            name: 'suppressionliste',
            arity: 2,
            luaHelper: '__psc_liste_suppression',
            isMutator: true,
            description: 'Supprime l\'élément situé à la place `p` dans la liste `l`.\n\n```psc\nl ← suppressionListe(l, p)\n```\n> ⚠️ **Précondition :** `non finListe(l, p)`.',
            signature: 'suppressionListe(l : Liste, p : place) : Liste',
            snippet: 'suppressionListe(${1:l}, ${2:p})',
            methodSnippet: 'suppressionListe(${VAR}, ${1:p})',
            category: 'Liste',
            targetType: 'liste'
        },
        {
            name: 'changeliste',
            arity: 3,
            luaHelper: '__psc_liste_change',
            isMutator: true,
            description: 'Remplace en place la valeur stockée à la place `p` par la nouvelle valeur `v`.\n\n```psc\nl ← changeListe(l, p, nouvelleValeur)\n```',
            signature: 'changeListe(l : Liste, p : place, v) : Liste',
            snippet: 'changeListe(${1:l}, ${2:p}, ${3:v})',
            methodSnippet: 'changeListe(${VAR}, ${1:p}, ${2:v})',
            category: 'Liste',
            targetType: 'liste'
        },
        {
            name: 'change',
            arity: 3,
            luaHelper: '__psc_liste_change',
            isMutator: true,
            description: 'Variante raccourcie de `changeListe` pour modifier la valeur à la place `p`.\n\n```psc\nl ← change(l, p, v)\n```',
            signature: 'change(l : Liste, p : place, v) : Liste',
            snippet: 'change(${1:l}, ${2:p}, ${3:v})',
            methodSnippet: 'change(${VAR}, ${1:p}, ${2:v})',
            category: 'Liste',
            targetType: 'liste'
        },

        // TDA ListeSym
        {
            name: 'tetels',
            arity: 1,
            luaHelper: '__psc_listesym_tete',
            description: 'Renvoie la place de tête de la liste symétrique `l`.\n\n```psc\np ← teteLS(maLS)\n```',
            signature: 'teteLS(l : ListeSym) : place',
            snippet: 'teteLS(${1:l})',
            methodSnippet: 'teteLS(${VAR})',
            category: 'Liste Symétrique',
            targetType: 'listesym'
        },
        {
            name: 'queuels',
            arity: 1,
            luaHelper: '__psc_listesym_queue',
            description: 'Renvoie la place de queue (dernier élément) de la liste symétrique `l`.\n\n```psc\np ← queueLS(maLS)\n```',
            signature: 'queueLS(l : ListeSym) : place',
            snippet: 'queueLS(${1:l})',
            methodSnippet: 'queueLS(${VAR})',
            category: 'Liste Symétrique',
            targetType: 'listesym'
        },
        {
            name: 'valls',
            arity: 2,
            luaHelper: '__psc_listesym_val',
            description: 'Renvoie la valeur de l\'élément situé à la place `p` dans la liste symétrique `l`.\n\n```psc\nv ← valLS(maLS, p)\n```\n> ⚠️ **Précondition :** `non finLS(l, p)`.',
            signature: 'valLS(l : ListeSym, p : place) : élément',
            snippet: 'valLS(${1:l}, ${2:p})',
            methodSnippet: 'valLS(${VAR}, ${1:p})',
            category: 'Liste Symétrique',
            targetType: 'listesym'
        },
        {
            name: 'sucls',
            arity: 2,
            luaHelper: '__psc_listesym_suc',
            description: 'Renvoie la place suivante dans la liste symétrique (parcours avant).\n\n```psc\np ← sucLS(maLS, p)\n```',
            signature: 'sucLS(l : ListeSym, p : place) : place',
            snippet: 'sucLS(${1:l}, ${2:p})',
            methodSnippet: 'sucLS(${VAR}, ${1:p})',
            category: 'Liste Symétrique',
            targetType: 'listesym'
        },
        {
            name: 'precls',
            arity: 2,
            luaHelper: '__psc_listesym_prec',
            description: 'Renvoie la place précédente dans la liste symétrique (parcours arrière).\n\n```psc\np ← precLS(maLS, p)\n```',
            signature: 'precLS(l : ListeSym, p : place) : place',
            snippet: 'precLS(${1:l}, ${2:p})',
            methodSnippet: 'precLS(${VAR}, ${1:p})',
            category: 'Liste Symétrique',
            targetType: 'listesym'
        },
        {
            name: 'finls',
            arity: 2,
            luaHelper: '__psc_listesym_fin',
            description: 'Prédicat indiquant si la place `p` a dépassé les bornes de la liste symétrique.\n\n```psc\nTant que non finLS(maLS, p) Faire :\n\técrire(valLS(maLS, p))\n\tp ← sucLS(maLS, p)\nftq\n```',
            signature: 'finLS(l : ListeSym, p : place) : booléen',
            snippet: 'finLS(${1:l}, ${2:p})',
            methodSnippet: 'finLS(${VAR}, ${1:p})',
            category: 'Liste Symétrique',
            targetType: 'listesym'
        },
        {
            name: 'videls',
            arity: 0,
            luaHelper: '__psc_listesym_vide',
            description: 'Instancie et renvoie une nouvelle liste symétrique (doublement chaînée) vide.\n\n```psc\nls ← videLS()\n```',
            signature: 'videLS() : ListeSym',
            snippet: 'videLS()',
            category: 'Liste Symétrique',
            targetType: 'listesym'
        },
        {
            name: 'ajouttetels',
            arity: 2,
            luaHelper: '__psc_listesym_ajout_tete',
            description: 'Insère une valeur `v` en tête de la liste symétrique `l`.\n\n```psc\najoutTeteLS(maLS, 100)\n```',
            signature: 'ajoutTeteLS(l : ListeSym, v)',
            snippet: 'ajoutTeteLS(${1:l}, ${2:v})',
            methodSnippet: 'ajoutTeteLS(${VAR}, ${1:v})',
            category: 'Liste Symétrique',
            targetType: 'listesym'
        },
        {
            name: 'suppressiontetels',
            arity: 1,
            luaHelper: '__psc_listesym_suppression_tete',
            description: 'Supprime la tête de la liste symétrique `l`.\n\n```psc\nsuppressionTeteLS(maLS)\n```\n> ⚠️ **Précondition :** La liste ne doit pas être vide.',
            signature: 'suppressionTeteLS(l : ListeSym)',
            snippet: 'suppressionTeteLS(${1:l})',
            methodSnippet: 'suppressionTeteLS(${VAR})',
            category: 'Liste Symétrique',
            targetType: 'listesym'
        },
        {
            name: 'ajoutqueuels',
            arity: 2,
            luaHelper: '__psc_listesym_ajout_queue',
            description: 'Insère une valeur `v` en queue de la liste symétrique `l`.\n\n```psc\najoutQueueLS(maLS, 400)\n```',
            signature: 'ajoutQueueLS(l : ListeSym, v)',
            snippet: 'ajoutQueueLS(${1:l}, ${2:v})',
            methodSnippet: 'ajoutQueueLS(${VAR}, ${1:v})',
            category: 'Liste Symétrique',
            targetType: 'listesym'
        },
        {
            name: 'suppressionqueuels',
            arity: 1,
            luaHelper: '__psc_listesym_suppression_queue',
            description: 'Supprime la queue de la liste symétrique `l`.\n\n```psc\nsuppressionQueueLS(maLS)\n```\n> ⚠️ **Précondition :** La liste ne doit pas être vide.',
            signature: 'suppressionQueueLS(l : ListeSym)',
            snippet: 'suppressionQueueLS(${1:l})',
            methodSnippet: 'suppressionQueueLS(${VAR})',
            category: 'Liste Symétrique',
            targetType: 'listesym'
        },
        {
            name: 'ajoutls',
            arity: 3,
            luaHelper: '__psc_listesym_ajout',
            description: 'Insère une valeur `v` à la place `p` dans la liste symétrique `l`.\n\n```psc\najoutLS(maLS, p, 250)\n```',
            signature: 'ajoutLS(l : ListeSym, p : place, v)',
            snippet: 'ajoutLS(${1:l}, ${2:p}, ${3:v})',
            methodSnippet: 'ajoutLS(${VAR}, ${1:p}, ${2:v})',
            category: 'Liste Symétrique',
            targetType: 'listesym'
        },
        {
            name: 'suppressionls',
            arity: 2,
            luaHelper: '__psc_listesym_suppression',
            description: 'Supprime l\'élément situé à la place `p` dans la liste symétrique `l`.\n\n```psc\nsuppressionLS(maLS, p)\n```\n> ⚠️ **Précondition :** `non finLS(l, p)`.',
            signature: 'suppressionLS(l : ListeSym, p : place)',
            snippet: 'suppressionLS(${1:l}, ${2:p})',
            methodSnippet: 'suppressionLS(${VAR}, ${1:p})',
            category: 'Liste Symétrique',
            targetType: 'listesym'
        },
        {
            name: 'changels',
            arity: 3,
            luaHelper: '__psc_listesym_change',
            description: 'Modifie la valeur stockée à la place `p` dans la liste symétrique `l`.\n\n```psc\nchangeLS(maLS, p, nouvelleValeur)\n```',
            signature: 'changeLS(l : ListeSym, p : place, v)',
            snippet: 'changeLS(${1:l}, ${2:p}, ${3:v})',
            methodSnippet: 'changeLS(${VAR}, ${1:p}, ${2:v})',
            category: 'Liste Symétrique',
            targetType: 'listesym'
        },

        // TDA Pile
        {
            name: 'pilevide',
            arity: 0,
            luaHelper: '__psc_pile_vide',
            description: 'Instancie et renvoie une nouvelle pile LIFO vide.\n\n```psc\np ← pileVide()\n```',
            signature: 'pileVide() : Pile',
            snippet: 'pileVide()',
            category: 'Pile',
            targetType: 'pile'
        },
        {
            name: 'sommet',
            arity: 1,
            luaHelper: '__psc_pile_sommet',
            description: 'Renvoie la valeur de l\'élément situé au sommet de la pile `p` sans le dépiler.\n\n```psc\nelem ← sommet(maPile)\n```\n> ⚠️ **Précondition / Piège :** La pile ne doit pas être vide ! Vérifiez toujours `non estVidePile(p)`.',
            signature: 'sommet(p : Pile) : élément',
            snippet: 'sommet(${1:p})',
            methodSnippet: 'sommet(${VAR})',
            category: 'Pile',
            targetType: 'pile'
        },
        {
            name: 'estvidepile',
            arity: 1,
            luaHelper: '__psc_pile_est_vide',
            description: 'Prédicat indiquant si la pile `p` ne contient aucun élément.\n\n```psc\nSi estVidePile(maPile) Alors :\n\técrire("Pile vide")\nfsi\n```',
            signature: 'estVidePile(p : Pile) : booléen',
            snippet: 'estVidePile(${1:p})',
            methodSnippet: 'estVidePile(${VAR})',
            category: 'Pile',
            targetType: 'pile'
        },
        {
            name: 'empiler',
            arity: 2,
            luaHelper: '__psc_pile_empiler',
            description: 'Empile une nouvelle valeur `v` au sommet de la pile `p` (LIFO).\n\n```psc\nempiler(maPile, 42)\n```',
            signature: 'empiler(p : Pile, v)',
            snippet: 'empiler(${1:p}, ${2:v})',
            methodSnippet: 'empiler(${VAR}, ${1:v})',
            category: 'Pile',
            targetType: 'pile'
        },
        {
            name: 'depiler',
            arity: 1,
            luaHelper: '__psc_pile_depiler',
            description: 'Retire l\'élément situé au sommet de la pile `p`.\n\n```psc\ndepiler(maPile)\n```\n> ⚠️ **Précondition / Piège :** Ne jamais dépiler une pile vide sous peine d\'erreur à l\'exécution. Toujours vérifier avec `non estVidePile(p)`.',
            signature: 'dépiler(p : Pile)',
            snippet: 'depiler(${1:p})',
            methodSnippet: 'depiler(${VAR})',
            category: 'Pile',
            targetType: 'pile'
        },
        {
            name: 'estvide',
            arity: 1,
            luaHelper: '__psc_pile_est_vide',
            description: 'Prédicat générique indiquant si la structure (pile ou file) est vide.\n\n```psc\nSi estVide(maPile) Alors ...\n```',
            signature: 'estVide(p : Pile) : booléen',
            snippet: 'estVide(${1:p})',
            methodSnippet: 'estVide(${VAR})',
            category: 'Pile',
            targetType: 'pile'
        },

        // TDA File
        {
            name: 'filevide',
            arity: 0,
            luaHelper: '__psc_file_vide',
            description: 'Instancie et renvoie une nouvelle file FIFO vide.\n\n```psc\nf ← fileVide()\n```',
            signature: 'fileVide() : File',
            snippet: 'fileVide()',
            category: 'File',
            targetType: 'file'
        },
        {
            name: 'estvidefile',
            arity: 1,
            luaHelper: '__psc_file_est_vide',
            description: 'Prédicat indiquant si la file `f` ne contient aucun élément.\n\n```psc\nTant que non estVideFile(f) Faire :\n\t...\nftq\n```',
            signature: 'estVideFile(f : File) : booléen',
            snippet: 'estVideFile(${1:f})',
            methodSnippet: 'estVideFile(${VAR})',
            category: 'File',
            targetType: 'file'
        },
        {
            name: 'enfiler',
            arity: 2,
            luaHelper: '__psc_file_enfiler',
            description: 'Enfile une nouvelle valeur `v` en queue de la file `f` (FIFO).\n\n```psc\nenfiler(maFile, "Client 1")\n```',
            signature: 'enfiler(f : File, v)',
            snippet: 'enfiler(${1:f}, ${2:v})',
            methodSnippet: 'enfiler(${VAR}, ${1:v})',
            category: 'File',
            targetType: 'file'
        },
        {
            name: 'defiler',
            arity: 1,
            luaHelper: '__psc_file_defiler',
            description: 'Défile (retire) le premier élément situé en tête de la file `f`.\n\n```psc\ndefiler(maFile)\n```\n> ⚠️ **Précondition / Piège :** Ne jamais défiler une file vide. Vérifiez toujours `non estVideFile(f)`.',
            signature: 'défiler(f : File)',
            snippet: 'defiler(${1:f})',
            methodSnippet: 'defiler(${VAR})',
            category: 'File',
            targetType: 'file'
        },
        {
            name: 'premier',
            arity: 1,
            luaHelper: '__psc_file_premier',
            description: 'Renvoie la valeur du premier élément en tête de file sans le défiler.\n\n```psc\nclientActuel ← premier(maFile)\n```\n> ⚠️ **Précondition :** `non estVideFile(f)`.',
            signature: 'premier(f : File) : élément',
            snippet: 'premier(${1:f})',
            methodSnippet: 'premier(${VAR})',
            category: 'File',
            targetType: 'file'
        },
        {
            name: 'ajoutfile',
            arity: 2,
            luaHelper: '__psc_file_enfiler',
            description: 'Enfile un élément en queue de file (alias de `enfiler`).\n\n```psc\najoutFile(maFile, v)\n```',
            signature: 'ajoutFile(f : File, v)',
            snippet: 'ajoutFile(${1:f}, ${2:v})',
            methodSnippet: 'ajoutFile(${VAR}, ${1:v})',
            category: 'File',
            targetType: 'file'
        },
        {
            name: 'suppressionfile',
            arity: 1,
            luaHelper: '__psc_file_defiler',
            description: 'Défile le premier élément de la file (alias de `défiler`).\n\n```psc\nsuppressionFile(maFile)\n```\n> ⚠️ **Précondition :** `non estVideFile(f)`.',
            signature: 'suppressionFile(f : File)',
            snippet: 'suppressionFile(${1:f})',
            methodSnippet: 'suppressionFile(${VAR})',
            category: 'File',
            targetType: 'file'
        },
        {
            name: 'estfilevide',
            arity: 1,
            luaHelper: '__psc_file_est_vide',
            description: 'Prédicat indiquant si la file est vide (alias de `estVideFile`).\n\n```psc\nSi estFileVide(maFile) Alors ...\n```',
            signature: 'estFileVide(f : File) : booléen',
            snippet: 'estFileVide(${1:f})',
            methodSnippet: 'estFileVide(${VAR})',
            category: 'File',
            targetType: 'file'
        },

        // TDA Table (Dictionnaire/Map: Clé -> Valeur)
        {
            name: 'tablevide',
            arity: 0,
            luaHelper: '__psc_table_vide',
            description: 'Instancie et renvoie une nouvelle table associative (dictionnaire) vide.\n\n```psc\nannuaire ← tableVide()\n```',
            signature: 'tableVide() : Table',
            snippet: 'tableVide()',
            category: 'Table',
            targetType: 'table'
        },
        {
            name: 'table',
            arity: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
            luaHelper: '__psc_table_from_pairs',
            description: 'Constructeur de table associative initialisée avec des paires clé/valeur successives.\n\n```psc\nt ← table("Alice", 20, "Bob", 22, "Charlie", 19)\n```',
            signature: 'table(clé1, val1, clé2, val2, ...)',
            snippet: 'table(${1:clé}, ${2:valeur})',
            category: 'Table'
        },
        {
            name: 'domaine',
            arity: 1,
            luaHelper: '__psc_table_domaine',
            description: 'Renvoie l\'ensemble de toutes les clés existantes dans la table `t`.\n\n```psc\nPour chaque cle dans domaine(maTable) Faire :\n\técrire("Clé : ", cle)\nfpour\n```',
            signature: 'domaine(t : Table) : ensemble',
            snippet: 'domaine(${1:t})',
            methodSnippet: 'domaine(${VAR})',
            category: 'Table',
            targetType: 'table'
        },
        {
            name: 'domainetable',
            arity: 1,
            luaHelper: '__psc_table_domaine',
            description: 'Renvoie l\'ensemble des clés de la table (alias de `domaine`).\n\n```psc\ncles ← domaineTable(maTable)\n```',
            signature: 'domaineTable(t : Table) : ensemble',
            snippet: 'domaineTable(${1:t})',
            methodSnippet: 'domaineTable(${VAR})',
            category: 'Table',
            targetType: 'table'
        },
        {
            name: 'accestable',
            arity: 2,
            luaHelper: '__psc_table_acces',
            description: 'Accède à la valeur associée à la `clé` dans la table `t`.\n\n```psc\ntel ← accesTable(annuaire, "Alice")\n```\n> 💡 **Remarque :** Renvoie `nil` si la clé n\'est pas présente dans la table.',
            signature: 'accesTable(t : Table, clé) : valeur',
            snippet: 'accesTable(${1:t}, ${2:clé})',
            methodSnippet: 'accesTable(${VAR}, ${1:clé})',
            category: 'Table',
            targetType: 'table'
        },
        {
            name: 'ajouttable',
            arity: 3,
            luaHelper: '__psc_table_ajout',
            isMutator: true,
            description: 'Insère ou met à jour une association `clé → valeur` dans la table `t`.\n\n```psc\najoutTable(annuaire, "David", "0701020304")\n```',
            signature: 'ajoutTable(t : Table, clé, valeur)',
            snippet: 'ajoutTable(${1:t}, ${2:clé}, ${3:valeur})',
            methodSnippet: 'ajoutTable(${VAR}, ${1:clé}, ${2:valeur})',
            category: 'Table',
            targetType: 'table'
        },
        {
            name: 'suppressiontable',
            arity: 2,
            luaHelper: '__psc_table_suppression',
            isMutator: true,
            description: 'Supprime l\'association désignée par `clé` dans la table `t`.\n\n```psc\nsuppressionTable(annuaire, "David")\n```',
            signature: 'suppressionTable(t : Table, clé)',
            snippet: 'suppressionTable(${1:t}, ${2:clé})',
            methodSnippet: 'suppressionTable(${VAR}, ${1:clé})',
            category: 'Table',
            targetType: 'table'
        },
        {
            name: 'changetable',
            arity: 3,
            luaHelper: '__psc_table_change',
            isMutator: true,
            description: 'Modifie la valeur associée à la `clé` dans la table `t`.\n\n```psc\nchangeTable(annuaire, "Alice", "0699887766")\n```',
            signature: 'changeTable(t : Table, clé, valeur)',
            snippet: 'changeTable(${1:t}, ${2:clé}, ${3:valeur})',
            methodSnippet: 'changeTable(${VAR}, ${1:clé}, ${2:valeur})',
            category: 'Table',
            targetType: 'table'
        },
        {
            name: 'estdans',
            arity: 2,
            luaHelper: '__psc_ensemble_estdans',
            description: 'Prédicat d\'appartenance universel : vérifie si `élément` appartient à un ensemble, une table, une liste chaînée ou un tableau.\n\n```psc\nSi estDans(domaine(annuaire), "Alice") Alors :\n\técrire("Contact trouvé !")\nfsi\n```',
            signature: 'estDans(col, élément) : booléen',
            snippet: 'estDans(${1:col}, ${2:élément})',
            methodSnippet: 'estDans(${VAR}, ${1:élément})',
            category: 'Ensemble',
            targetType: ['ensemble', 'table', 'liste']
        },
        
        // TDA Arbre Binaire
        {
            name: 'racine',
            arity: 1,
            luaHelper: '__psc_arbin_racine',
            description: 'Renvoie la référence vers le nœud racine de l\'arbre binaire `a`.\n\n```psc\nr ← racine(arbre)\nSi non noeudvide(arbre, r) Alors :\n\técrire("Valeur de la racine : ", val(arbre, r))\nfsi\n```\n> ⚠️ **Précondition / Piège :** Si l\'arbre est vide, `racine(a)` renvoie `nil`. Toujours tester avec `non noeudvide(arbre, r)` avant d\'accéder à ses sous-arbres.',
            signature: 'racine(a : ArbreBinaire) : Noeud',
            snippet: 'racine(${1:a})',
            methodSnippet: 'racine(${VAR})',
            category: 'Arbre Binaire',
            targetType: ['arbin', 'arbrebinaire', 'noeud']
        },
        {
            name: 'fg',
            arity: [1, 2],
            luaHelper: '__psc_arbin_fg',
            description: 'Renvoie la référence vers le fils gauche du nœud `n` dans l\'arbre binaire `a`.\n\n```psc\nfilsGauche ← fg(arbre, n)\n```\n> ⚠️ **Précondition / Piège :** Le nœud `n` ne doit pas être `nil`. Si `n` n\'a pas de fils gauche, la fonction renvoie `nil`.',
            signature: 'fg(a : ArbreBinaire, n : Noeud) : Noeud',
            snippet: 'fg(${1:a}, ${2:n})',
            methodSnippet: 'fg(${VAR}, ${1:n})',
            category: 'Arbre Binaire',
            targetType: ['arbin', 'arbrebinaire', 'noeud']
        },
        {
            name: 'fd',
            arity: [1, 2],
            luaHelper: '__psc_arbin_fd',
            description: 'Renvoie la référence vers le fils droit du nœud `n` dans l\'arbre binaire `a`.\n\n```psc\nfilsDroit ← fd(arbre, n)\n```\n> ⚠️ **Précondition / Piège :** Le nœud `n` ne doit pas être `nil`. Si `n` n\'a pas de fils droit, la fonction renvoie `nil`.',
            signature: 'fd(a : ArbreBinaire, n : Noeud) : Noeud',
            snippet: 'fd(${1:a}, ${2:n})',
            methodSnippet: 'fd(${VAR}, ${1:n})',
            category: 'Arbre Binaire',
            targetType: ['arbin', 'arbrebinaire', 'noeud']
        },
        {
            name: 'noeudvide',
            arity: [1, 2],
            luaHelper: '__psc_arbin_noeudvide',
            description: 'Prédicat testant si la référence de nœud `n` est vide (`nil`).\n\n```psc\nSi non noeudvide(arbre, n) Alors :\n\técrire("Nœud visité : ", val(arbre, n))\nfsi\n```\n> 💡 **Arite flexible :** Accepte `noeudvide(arbre, n)` ou `noeudvide(n)`.',
            signature: 'noeudvide(a : ArbreBinaire, n : Noeud) : booléen',
            snippet: 'noeudvide(${1:a}, ${2:n})',
            methodSnippet: 'noeudvide(${VAR}, ${1:n})',
            category: 'Arbre Binaire',
            targetType: ['arbin', 'arbrebinaire', 'noeud']
        },
        {
            name: 'creerarb',
            arity: [0, 1],
            luaHelper: '__psc_arbin_creer',
            description: 'Crée et instancie un nouvel arbre binaire avec une racine contenant la valeur `v` (ou arbre vide si omis).\n\n```psc\narbre ← créerarb(10)\n```',
            signature: 'créerarb([v : V]) : ArbreBinaire',
            snippet: 'créerarb(${1:v})',
            category: 'Arbre Binaire',
            targetType: ['arbin', 'arbrebinaire']
        },
        {
            name: 'créerarb',
            arity: [0, 1],
            luaHelper: '__psc_arbin_creer',
            description: 'Crée et instancie un nouvel arbre binaire avec une racine contenant la valeur `v` (variante avec accent).\n\n```psc\narbre ← créerarb(10)\n```',
            signature: 'créerarb([v : V]) : ArbreBinaire',
            snippet: 'créerarb(${1:v})',
            category: 'Arbre Binaire',
            targetType: ['arbin', 'arbrebinaire']
        },
        {
            name: 'adjfg',
            arity: 3,
            luaHelper: '__psc_arbin_adjfg',
            description: 'Adjonction d\'un nœud fils gauche avec la valeur `v` au nœud `n` dans l\'arbre `a`.\n\n```psc\nadjfg(arbre, racine(arbre), 5)\n```\n> ⚠️ **Précondition :** `n` ne doit pas être `nil` et ne doit pas posséder déjà un fils gauche (utiliser `supfg` au préalable si nécessaire).',
            signature: 'adjfg(a : ArbreBinaire, n : Noeud, v : V)',
            snippet: 'adjfg(${1:a}, ${2:n}, ${3:v})',
            methodSnippet: 'adjfg(${VAR}, ${1:n}, ${2:v})',
            category: 'Arbre Binaire',
            targetType: ['arbin', 'arbrebinaire', 'noeud']
        },
        {
            name: 'adjfd',
            arity: 3,
            luaHelper: '__psc_arbin_adjfd',
            description: 'Adjonction d\'un nœud fils droit avec la valeur `v` au nœud `n` dans l\'arbre `a`.\n\n```psc\nadjfd(arbre, racine(arbre), 15)\n```\n> ⚠️ **Précondition :** `n` ne doit pas être `nil` et ne doit pas posséder déjà un fils droit (utiliser `supfd` au préalable si nécessaire).',
            signature: 'adjfd(a : ArbreBinaire, n : Noeud, v : V)',
            snippet: 'adjfd(${1:a}, ${2:n}, ${3:v})',
            methodSnippet: 'adjfd(${VAR}, ${1:n}, ${2:v})',
            category: 'Arbre Binaire',
            targetType: ['arbin', 'arbrebinaire', 'noeud']
        },
        {
            name: 'chgarb',
            arity: 3,
            luaHelper: '__psc_arbin_chgarb',
            description: 'Modifie en place la valeur contenue dans le nœud `n` de l\'arbre binaire `a` en lui affectant `v`.\n\n```psc\nchgarb(arbre, n, 42)\n```\n> ⚠️ **Précondition :** Le nœud `n` ne doit pas être `nil`.',
            signature: 'chgarb(a : ArbreBinaire, n : Noeud, v : V)',
            snippet: 'chgarb(${1:a}, ${2:n}, ${3:v})',
            methodSnippet: 'chgarb(${VAR}, ${1:n}, ${2:v})',
            category: 'Arbre Binaire',
            targetType: ['arbin', 'arbrebinaire', 'noeud']
        },
        {
            name: 'supfg',
            arity: 2,
            luaHelper: '__psc_arbin_supfg',
            description: 'Supprime en place l\'intégralité du sous-arbre gauche rattaché au nœud `n`.\n\n```psc\nsupfg(arbre, n)\n```\n> ⚠️ **Attention :** Tous les descendants du sous-arbre gauche de `n` sont détruits.',
            signature: 'supfg(a : ArbreBinaire, n : Noeud)',
            snippet: 'supfg(${1:a}, ${2:n})',
            methodSnippet: 'supfg(${VAR}, ${1:n})',
            category: 'Arbre Binaire',
            targetType: ['arbin', 'arbrebinaire', 'noeud']
        },
        {
            name: 'supfd',
            arity: 2,
            luaHelper: '__psc_arbin_supfd',
            description: 'Supprime en place l\'intégralité du sous-arbre droit rattaché au nœud `n`.\n\n```psc\nsupfd(arbre, n)\n```\n> ⚠️ **Attention :** Tous les descendants du sous-arbre droit de `n` sont détruits.',
            signature: 'supfd(a : ArbreBinaire, n : Noeud)',
            snippet: 'supfd(${1:a}, ${2:n})',
            methodSnippet: 'supfd(${VAR}, ${1:n})',
            category: 'Arbre Binaire',
            targetType: ['arbin', 'arbrebinaire', 'noeud']
        },
        {
            name: 'arbrevide',
            arity: [0, 1],
            luaHelper: '__psc_arbin_vide',
            description: 'Instancie un arbre binaire vide (ou teste si l\'arbre `a` est vide si un argument est fourni).\n\n```psc\nmonArbre ← arbrevide()\n```',
            signature: 'arbreVide([a : ArbreBinaire]) : ArbreBinaire | booléen',
            snippet: 'arbreVide()',
            category: 'Arbre Binaire',
            targetType: ['arbin', 'arbrebinaire']
        },
        {
            name: 'pere',
            arity: [1, 2],
            luaHelper: '__psc_arbin_pere',
            description: 'Renvoie la référence vers le nœud parent (père) de `n` dans l\'arbre `a`.\n\n```psc\nparentNoeud ← pere(arbre, n)\n```\n> 💡 **Remarque :** Renvoie `nil` si `n` est la racine de l\'arbre ou si `n` est `nil`.',
            signature: 'pere(a : ArbreBinaire, n : Noeud) : Noeud',
            snippet: 'pere(${1:a}, ${2:n})',
            methodSnippet: 'pere(${VAR}, ${1:n})',
            category: 'Arbre Binaire',
            targetType: ['arbin', 'arbrebinaire', 'noeud']
        }
    ] as PscFunction[]
};
