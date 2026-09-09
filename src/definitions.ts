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
        { name: 'entier', aliases: ['entier'], description: 'Nombre entier' },
        { name: 'réel', aliases: ['réel', 'reel'], description: 'Nombre réel (décimal)' },
        { name: 'booléen', aliases: ['booléen', 'booleen'], description: 'Valeur logique (vrai/faux)' },
        { name: 'chaîne', aliases: ['chaîne', 'chaine'], description: 'Chaîne de caractères' },
        { name: 'caractère', aliases: ['caractère', 'caractere'], description: 'Un seul caractère' },
        { name: 'tableau', aliases: ['tableau'], description: 'Tableau indexé' },
        { name: 'liste', aliases: ['liste'], description: 'Liste chaînée (TDA)' },
        { name: 'pile', aliases: ['pile'], description: 'Pile LIFO (TDA)' },
        { name: 'file', aliases: ['file'], description: 'File FIFO (TDA)' },
        { name: 'listesym', aliases: ['listesym'], description: 'Liste symétrique (TDA)' },
        { name: 'table', aliases: ['table'], description: 'Table associative clé→valeur (TDA)' },
        { name: 'ensemble', aliases: ['ensemble'], description: 'Ensemble de valeurs uniques (TDA)' },
        { name: 'fichier', aliases: ['fichier'], description: 'Descripteur de fichier (TDA)' }
    ] as PscType[],

    keywords: [
        // Contrôle
        { name: 'si', type: 'control', luaEquivalent: 'if', description: '**Si** — Structure conditionnelle\n\n```psc\nSi condition Alors :\n\t...\nfsi\n```' },
        { name: 'alors', type: 'control', luaEquivalent: 'then', description: '**Alors** — Suit la condition d\'un Si' },
        { name: 'sinon', type: 'control', luaEquivalent: 'else', description: '**Sinon** — Branche alternative d\'un Si' },
        { name: 'fsi', type: 'control', luaEquivalent: 'end', description: '**fsi** — Fermeture d\'un bloc Si' },
        { name: 'tant', type: 'control', luaEquivalent: 'while', description: '**Tant que** — Boucle conditionnelle\n\n```psc\nTant que condition Faire :\n\t...\nftq\n```' },
        { name: 'que', type: 'control' },
        { name: 'ftq', type: 'control', luaEquivalent: 'end', description: '**ftq** — Fermeture d\'un bloc Tant que' },
        { name: 'pour', type: 'control', luaEquivalent: 'for', description: '**Pour** — Boucle avec compteur ou itération\n\n```psc\nPour i de 0 à n-1 Faire :\n\t...\nfpour\n```\nou\n```psc\nPour chaque x dans collection Faire :\n\t...\nfpour\n```' },
        { name: 'chaque', type: 'control', description: '**chaque** — Utilisé dans les boucles `Pour chaque x dans ensemble` pour itérer sur une collection' },
        { name: 'dans', type: 'control', description: '**dans** — Utilisé dans les boucles `Pour chaque x dans ensemble` pour spécifier la collection cible' },
        { name: 'allant', type: 'control' },
        { name: 'de', type: 'control' },
        { name: 'à', type: 'control' },
        { name: 'faire', type: 'control', luaEquivalent: 'do', description: '**Faire** — Suit la condition d\'un Tant que ou d\'un Pour' },
        { name: 'fpour', type: 'control', luaEquivalent: 'end', description: '**fpour** — Fermeture d\'un bloc Pour' },
        { name: 'décroissant', type: 'control', description: '**décroissant** — Modificateur de boucle Pour pour itérer en ordre décroissant' },
        { name: 'retourner', type: 'control', luaEquivalent: 'return', description: '**retourner** — Retourne une valeur depuis une fonction' },
        { name: 'retourne', type: 'control', luaEquivalent: 'return', description: '**retourne** — Retourne une valeur depuis une fonction (variante)' },

        // Blocs
        { name: 'début', type: 'block', description: '**Début** — Début du corps d\'une fonction ou d\'un algorithme' },
        { name: 'fin', type: 'block', description: '**Fin** — Fin du corps d\'une fonction ou d\'un algorithme' },
        { name: 'algorithme', type: 'block', description: '**Algorithme** — Déclare un algorithme principal' },
        { name: 'fonction', type: 'block', description: '**Fonction** — Déclare une fonction\n\n```psc\nFonction nom(params) : type\nDébut\n\t...\nFin\n```' },

        // Booléens
        { name: 'vrai', type: 'boolean', luaEquivalent: 'true', description: '**vrai** — Constante booléenne (true)' },
        { name: 'faux', type: 'boolean', luaEquivalent: 'false', description: '**faux** — Constante booléenne (false)' },
        { name: 'nil', type: 'boolean', luaEquivalent: 'nil', description: '**nil** — Valeur nulle' },

        // Opérateurs
        { name: 'et', type: 'operator', luaEquivalent: 'and', description: '**et** — Opérateur logique ET (and)' },
        { name: 'ou', type: 'operator', luaEquivalent: 'or', description: '**ou** — Opérateur logique OU (or)' },
        { name: 'non', type: 'operator', luaEquivalent: 'not', description: '**non** — Opérateur logique NON (not)' },
        { name: 'mod', type: 'operator', luaEquivalent: '%', description: '**mod** — Opérateur modulo (reste de la division entière)' },

        // IO
        { name: 'écrire', type: 'io', luaEquivalent: '__psc_write', description: '**écrire(valeur)** — Affiche une ou plusieurs valeurs sur la sortie standard' },
        { name: 'lire', type: 'io', luaEquivalent: 'io.read', description: '**lire()** : chaîne — Lit une valeur depuis l\'entrée standard' },

        // Modificateurs
        { name: 'inout', type: 'modifier', description: '**InOut** — Modificateur de paramètre : passage par référence (entrée/sortie)' }
    ] as PscKeyword[],

    functions: [
        // Opérations sur les chaînes
        { name: 'longueur', arity: 1, luaHelper: '#', description: 'Longueur de la chaîne ou taille du tableau', signature: 'longueur(s) : entier', snippet: 'longueur(${1:s})', methodSnippet: 'longueur(${VAR})', category: 'Chaînes', targetType: ['chaîne', 'chaine', 'tableau'] },
        { name: 'concat', arity: 2, luaHelper: '..', description: 'Concaténation', signature: 'concat(s1 : chaîne, s2 : chaîne) : chaîne', snippet: 'concat(${1:s1}, ${2:s2})', methodSnippet: 'concat(${VAR}, ${1:s2})', category: 'Chaînes', targetType: ['chaîne', 'chaine'] },
        { name: 'souschaîne', arity: 3, luaHelper: 'string.sub', description: 'Sous-chaîne', signature: 'souschaîne(s : chaîne, début : entier, fin : entier) : chaîne', snippet: 'souschaîne(${1:s}, ${2:début}, ${3:fin})', methodSnippet: 'souschaîne(${VAR}, ${1:début}, ${2:fin})', category: 'Chaînes', targetType: ['chaîne', 'chaine'] },
        { name: 'ième', arity: 2, luaHelper: 'string.sub', description: 'Caractère à la position i', signature: 'ième(s : chaîne, i : entier) : caractère', snippet: 'ième(${1:s}, ${2:i})', methodSnippet: 'ième(${VAR}, ${1:i})', category: 'Chaînes', targetType: ['chaîne', 'chaine'] },
        { name: 'chaineversentier', arity: 1, luaHelper: '__psc_chaineVersEntier', description: 'Convertit une chaîne en entier', signature: 'chaîneVersEntier(s : chaîne) : entier', snippet: 'chaîneVersEntier(${1:s})', methodSnippet: 'chaîneVersEntier(${VAR})', category: 'Chaînes', targetType: ['chaîne', 'chaine'] },

        // Fichiers
        { name: 'fichierouvrir', arity: [1, 2], luaHelper: '__psc_fichierOuvrir', description: 'Ouvre un fichier en lecture ou écriture', signature: 'fichierOuvrir(nom : chaîne [, mode]) : entier', snippet: 'fichierOuvrir(${1:nomFichier})', category: 'Fichiers' },
        { name: 'fichierfermer', arity: [0, 1], luaHelper: '__psc_fichierFermer', description: 'Ferme un fichier', signature: 'fichierFermer([handle : entier])', snippet: 'fichierFermer(${1:handle})', methodSnippet: 'fichierFermer(${VAR})', category: 'Fichiers', targetType: 'fichier' },
        { name: 'fichierlire', arity: [0, 1], luaHelper: '__psc_fichierLire', description: 'Lit une ligne ou valeur dans un fichier', signature: 'fichierLire([handle : entier]) : chaîne', snippet: 'fichierLire(${1:handle})', methodSnippet: 'fichierLire(${VAR})', category: 'Fichiers', targetType: 'fichier' },
        { name: 'fichierfin', arity: [0, 1], luaHelper: '__psc_fichierFin', description: 'Indique si la fin du fichier est atteinte', signature: 'fichierFin([handle : entier]) : booléen', snippet: 'fichierFin(${1:handle})', methodSnippet: 'fichierFin(${VAR})', category: 'Fichiers', targetType: 'fichier' },
        { name: 'fichiercreer', arity: 1, luaHelper: '__psc_fichierCreer', description: 'Crée un nouveau fichier', signature: 'fichierCréer(nom : chaîne) : entier', snippet: 'fichierCréer(${1:nomFichier})', category: 'Fichiers' },
        { name: 'fichierecrire', arity: 2, luaHelper: '__psc_fichierEcrire', description: 'Écrit dans un fichier', signature: 'fichierÉcrire(handle : entier, valeur)', snippet: 'fichierÉcrire(${1:handle}, ${2:valeur})', methodSnippet: 'fichierÉcrire(${VAR}, ${1:valeur})', category: 'Fichiers', targetType: 'fichier' },

        // Comparaison générale
        { name: 'comparaison', arity: 2, luaHelper: '__psc_comparaison', description: 'Compare deux éléments (réels, chaînes, enregistrements/structures)', signature: 'comparaison(a, b) : booléen', snippet: 'comparaison(${1:a}, ${2:b})', category: 'Autre' },

        // TDA Liste
        { name: 'tete', arity: 1, luaHelper: '__psc_generic_tete', description: 'Retourne la place de tête de la liste', signature: 'tete(l : Liste) : place', snippet: 'tete(${1:l})', methodSnippet: 'tete(${VAR})', category: 'Liste', targetType: 'liste' },
        { name: 'val', arity: 2, luaHelper: '__psc_liste_val', description: 'Retourne la valeur à la place p', signature: 'val(l : Liste, p : place) : élément', snippet: 'val(${1:l}, ${2:p})', methodSnippet: 'val(${VAR}, ${1:p})', category: 'Liste', targetType: 'liste' },
        { name: 'suc', arity: 2, luaHelper: '__psc_liste_suc', description: 'Retourne la place suivante', signature: 'suc(l : Liste, p : place) : place', snippet: 'suc(${1:l}, ${2:p})', methodSnippet: 'suc(${VAR}, ${1:p})', category: 'Liste', targetType: 'liste' },
        { name: 'finliste', arity: 2, luaHelper: '__psc_liste_fin', description: 'Vrai si p est en fin de liste', signature: 'finListe(l : Liste, p : place) : booléen', snippet: 'finListe(${1:l}, ${2:p})', methodSnippet: 'finListe(${VAR}, ${1:p})', category: 'Liste', targetType: 'liste' },
        { name: 'listevide', arity: 0, luaHelper: '__psc_liste_vide', description: 'Crée une liste vide', signature: 'listeVide() : Liste', snippet: 'listeVide()', category: 'Liste', targetType: 'liste' },
        { name: 'longueurliste', arity: 1, luaHelper: '__psc_liste_longueur', description: 'Longueur de la liste', signature: 'longueurListe(l : Liste) : entier', snippet: 'longueurListe(${1:l})', methodSnippet: 'longueurListe(${VAR})', category: 'Liste', targetType: 'liste' },
        { name: 'acces', arity: 2, luaHelper: '__psc_liste_acces', description: 'Accès au i-ème élément de la liste', signature: 'acces(l : Liste, i : entier) : élément', snippet: 'acces(${1:l}, ${2:i})', methodSnippet: 'acces(${VAR}, ${1:i})', category: 'Liste', targetType: 'liste' },
        { name: 'ajoutteteliste', arity: 2, luaHelper: '__psc_liste_ajout_tete', isMutator: true, description: 'Ajoute en tête de liste', signature: 'ajoutTeteListe(l : Liste, v) : Liste', snippet: 'ajoutTeteListe(${1:l}, ${2:v})', methodSnippet: 'ajoutTeteListe(${VAR}, ${1:v})', category: 'Liste', targetType: 'liste' },
        { name: 'suppressionteteliste', arity: 1, luaHelper: '__psc_liste_suppression_tete', isMutator: true, description: 'Supprime la tête de liste', signature: 'suppressionTeteListe(l : Liste) : Liste', snippet: 'suppressionTeteListe(${1:l})', methodSnippet: 'suppressionTeteListe(${VAR})', category: 'Liste', targetType: 'liste' },
        { name: 'ajoutqueueliste', arity: 2, luaHelper: '__psc_liste_ajout_queue', isMutator: true, description: 'Ajoute en queue de liste', signature: 'ajoutQueueListe(l : Liste, v) : Liste', snippet: 'ajoutQueueListe(${1:l}, ${2:v})', methodSnippet: 'ajoutQueueListe(${VAR}, ${1:v})', category: 'Liste', targetType: 'liste' },
        { name: 'suppressionqueueliste', arity: 1, luaHelper: '__psc_liste_suppression_queue', isMutator: true, description: 'Supprime la queue de liste', signature: 'suppressionQueueListe(l : Liste) : Liste', snippet: 'suppressionQueueListe(${1:l})', methodSnippet: 'suppressionQueueListe(${VAR})', category: 'Liste', targetType: 'liste' },
        { name: 'ajoutliste', arity: 3, luaHelper: '__psc_liste_ajout', isMutator: true, description: 'Ajoute à la place p', signature: 'ajoutListe(l : Liste, p : place, v) : Liste', snippet: 'ajoutListe(${1:l}, ${2:p}, ${3:v})', methodSnippet: 'ajoutListe(${VAR}, ${1:p}, ${2:v})', category: 'Liste', targetType: 'liste' },
        { name: 'suppressionliste', arity: 2, luaHelper: '__psc_liste_suppression', isMutator: true, description: 'Supprime à la place p', signature: 'suppressionListe(l : Liste, p : place) : Liste', snippet: 'suppressionListe(${1:l}, ${2:p})', methodSnippet: 'suppressionListe(${VAR}, ${1:p})', category: 'Liste', targetType: 'liste' },
        { name: 'changeliste', arity: 3, luaHelper: '__psc_liste_change', isMutator: true, description: 'Change la valeur à la place p', signature: 'changeListe(l : Liste, p : place, v) : Liste', snippet: 'changeListe(${1:l}, ${2:p}, ${3:v})', methodSnippet: 'changeListe(${VAR}, ${1:p}, ${2:v})', category: 'Liste', targetType: 'liste' },
        { name: 'change', arity: 3, luaHelper: '__psc_liste_change', isMutator: true, description: 'Change la valeur à la place p', signature: 'change(l : Liste, p : place, v) : Liste', snippet: 'change(${1:l}, ${2:p}, ${3:v})', methodSnippet: 'change(${VAR}, ${1:p}, ${2:v})', category: 'Liste', targetType: 'liste' },

        // TDA ListeSym
        { name: 'tetels', arity: 1, luaHelper: '__psc_listesym_tete', description: 'Place de tête de la liste symétrique', signature: 'teteLS(l : ListeSym) : place', snippet: 'teteLS(${1:l})', methodSnippet: 'teteLS(${VAR})', category: 'Liste Symétrique', targetType: 'listesym' },
        { name: 'queuels', arity: 1, luaHelper: '__psc_listesym_queue', description: 'Place de queue de la liste symétrique', signature: 'queueLS(l : ListeSym) : place', snippet: 'queueLS(${1:l})', methodSnippet: 'queueLS(${VAR})', category: 'Liste Symétrique', targetType: 'listesym' },
        { name: 'valls', arity: 2, luaHelper: '__psc_listesym_val', description: 'Valeur à la place p', signature: 'valLS(l : ListeSym, p : place) : élément', snippet: 'valLS(${1:l}, ${2:p})', methodSnippet: 'valLS(${VAR}, ${1:p})', category: 'Liste Symétrique', targetType: 'listesym' },
        { name: 'sucls', arity: 2, luaHelper: '__psc_listesym_suc', description: 'Place suivante', signature: 'sucLS(l : ListeSym, p : place) : place', snippet: 'sucLS(${1:l}, ${2:p})', methodSnippet: 'sucLS(${VAR}, ${1:p})', category: 'Liste Symétrique', targetType: 'listesym' },
        { name: 'precls', arity: 2, luaHelper: '__psc_listesym_prec', description: 'Place précédente', signature: 'precLS(l : ListeSym, p : place) : place', snippet: 'precLS(${1:l}, ${2:p})', methodSnippet: 'precLS(${VAR}, ${1:p})', category: 'Liste Symétrique', targetType: 'listesym' },
        { name: 'finls', arity: 2, luaHelper: '__psc_listesym_fin', description: 'Fin de liste symétrique', signature: 'finLS(l : ListeSym, p : place) : booléen', snippet: 'finLS(${1:l}, ${2:p})', methodSnippet: 'finLS(${VAR}, ${1:p})', category: 'Liste Symétrique', targetType: 'listesym' },
        { name: 'videls', arity: 0, luaHelper: '__psc_listesym_vide', description: 'Crée une liste symétrique vide', signature: 'videLS() : ListeSym', snippet: 'videLS()', category: 'Liste Symétrique', targetType: 'listesym' },
        { name: 'ajouttetels', arity: 2, luaHelper: '__psc_listesym_ajout_tete', description: 'Ajoute en tête', signature: 'ajoutTeteLS(l : ListeSym, v)', snippet: 'ajoutTeteLS(${1:l}, ${2:v})', methodSnippet: 'ajoutTeteLS(${VAR}, ${1:v})', category: 'Liste Symétrique', targetType: 'listesym' },
        { name: 'suppressiontetels', arity: 1, luaHelper: '__psc_listesym_suppression_tete', description: 'Supprime la tête', signature: 'suppressionTeteLS(l : ListeSym)', snippet: 'suppressionTeteLS(${1:l})', methodSnippet: 'suppressionTeteLS(${VAR})', category: 'Liste Symétrique', targetType: 'listesym' },
        { name: 'ajoutqueuels', arity: 2, luaHelper: '__psc_listesym_ajout_queue', description: 'Ajoute en queue', signature: 'ajoutQueueLS(l : ListeSym, v)', snippet: 'ajoutQueueLS(${1:l}, ${2:v})', methodSnippet: 'ajoutQueueLS(${VAR}, ${1:v})', category: 'Liste Symétrique', targetType: 'listesym' },
        { name: 'suppressionqueuels', arity: 1, luaHelper: '__psc_listesym_suppression_queue', description: 'Supprime la queue', signature: 'suppressionQueueLS(l : ListeSym)', snippet: 'suppressionQueueLS(${1:l})', methodSnippet: 'suppressionQueueLS(${VAR})', category: 'Liste Symétrique', targetType: 'listesym' },
        { name: 'ajoutls', arity: 3, luaHelper: '__psc_listesym_ajout', description: 'Ajoute à une place', signature: 'ajoutLS(l : ListeSym, p : place, v)', snippet: 'ajoutLS(${1:l}, ${2:p}, ${3:v})', methodSnippet: 'ajoutLS(${VAR}, ${1:p}, ${2:v})', category: 'Liste Symétrique', targetType: 'listesym' },
        { name: 'suppressionls', arity: 2, luaHelper: '__psc_listesym_suppression', description: 'Supprime à une place', signature: 'suppressionLS(l : ListeSym, p : place)', snippet: 'suppressionLS(${1:l}, ${2:p})', methodSnippet: 'suppressionLS(${VAR}, ${1:p})', category: 'Liste Symétrique', targetType: 'listesym' },
        { name: 'changels', arity: 3, luaHelper: '__psc_listesym_change', description: 'Change la valeur à une place', signature: 'changeLS(l : ListeSym, p : place, v)', snippet: 'changeLS(${1:l}, ${2:p}, ${3:v})', methodSnippet: 'changeLS(${VAR}, ${1:p}, ${2:v})', category: 'Liste Symétrique', targetType: 'listesym' },

        // TDA Pile
        { name: 'pilevide', arity: 0, luaHelper: '__psc_pile_vide', description: 'Crée une pile vide', signature: 'pileVide() : Pile', snippet: 'pileVide()', category: 'Pile', targetType: 'pile' },
        { name: 'sommet', arity: 1, luaHelper: '__psc_pile_sommet', description: 'Élément au sommet de la pile', signature: 'sommet(p : Pile) : élément', snippet: 'sommet(${1:p})', methodSnippet: 'sommet(${VAR})', category: 'Pile', targetType: 'pile' },
        { name: 'estvidepile', arity: 1, luaHelper: '__psc_pile_est_vide', description: 'Vrai si la pile est vide', signature: 'estVidePile(p : Pile) : booléen', snippet: 'estVidePile(${1:p})', methodSnippet: 'estVidePile(${VAR})', category: 'Pile', targetType: 'pile' },
        { name: 'empiler', arity: 2, luaHelper: '__psc_pile_empiler', description: 'Empile un élément', signature: 'empiler(p : Pile, v)', snippet: 'empiler(${1:p}, ${2:v})', methodSnippet: 'empiler(${VAR}, ${1:v})', category: 'Pile', targetType: 'pile' },
        { name: 'depiler', arity: 1, luaHelper: '__psc_pile_depiler', description: 'Dépile le sommet', signature: 'dépiler(p : Pile)', snippet: 'depiler(${1:p})', methodSnippet: 'depiler(${VAR})', category: 'Pile', targetType: 'pile' },
        { name: 'estvide', arity: 1, luaHelper: '__psc_pile_est_vide', description: 'Vrai si la pile est vide', signature: 'estVide(p : Pile) : booléen', snippet: 'estVide(${1:p})', methodSnippet: 'estVide(${VAR})', category: 'Pile', targetType: 'pile' },

        // TDA File
        { name: 'filevide', arity: 0, luaHelper: '__psc_file_vide', description: 'Crée une file vide', signature: 'fileVide() : File', snippet: 'fileVide()', category: 'File', targetType: 'file' },
        { name: 'estvidefile', arity: 1, luaHelper: '__psc_file_est_vide', description: 'Vrai si la file est vide', signature: 'estVideFile(f : File) : booléen', snippet: 'estVideFile(${1:f})', methodSnippet: 'estVideFile(${VAR})', category: 'File', targetType: 'file' },
        { name: 'enfiler', arity: 2, luaHelper: '__psc_file_enfiler', description: 'Enfile un élément', signature: 'enfiler(f : File, v)', snippet: 'enfiler(${1:f}, ${2:v})', methodSnippet: 'enfiler(${VAR}, ${1:v})', category: 'File', targetType: 'file' },
        { name: 'defiler', arity: 1, luaHelper: '__psc_file_defiler', description: 'Défile le premier élément', signature: 'défiler(f : File)', snippet: 'defiler(${1:f})', methodSnippet: 'defiler(${VAR})', category: 'File', targetType: 'file' },
        { name: 'premier', arity: 1, luaHelper: '__psc_file_premier', description: 'Premier élément de la file', signature: 'premier(f : File) : élément', snippet: 'premier(${1:f})', methodSnippet: 'premier(${VAR})', category: 'File', targetType: 'file' },
        { name: 'ajoutfile', arity: 2, luaHelper: '__psc_file_enfiler', description: 'Enfile un élément (alias)', signature: 'ajoutFile(f : File, v)', snippet: 'ajoutFile(${1:f}, ${2:v})', methodSnippet: 'ajoutFile(${VAR}, ${1:v})', category: 'File', targetType: 'file' },
        { name: 'suppressionfile', arity: 1, luaHelper: '__psc_file_defiler', description: 'Défile le premier élément (alias)', signature: 'suppressionFile(f : File)', snippet: 'suppressionFile(${1:f})', methodSnippet: 'suppressionFile(${VAR})', category: 'File', targetType: 'file' },
        { name: 'estfilevide', arity: 1, luaHelper: '__psc_file_est_vide', description: 'Vrai si la file est vide (alias)', signature: 'estFileVide(f : File) : booléen', snippet: 'estFileVide(${1:f})', methodSnippet: 'estFileVide(${VAR})', category: 'File', targetType: 'file' },

        // TDA Table (Dictionnaire/Map: Clé -> Valeur)
        { name: 'tablevide', arity: 0, luaHelper: '__psc_table_vide', description: 'Crée une table vide', signature: 'tableVide() : Table', snippet: 'tableVide()', category: 'Table', targetType: 'table' },
        { name: 'table', arity: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], luaHelper: '__psc_table_from_pairs', description: 'Constructeur de table avec paires clé-valeur', signature: 'table(clé1, val1, ...)', snippet: 'table(${1:clé}, ${2:valeur})', category: 'Table' },
        { name: 'domaine', arity: 1, luaHelper: '__psc_table_domaine', description: 'Ensemble des clés de la table', signature: 'domaine(t : Table) : ensemble', snippet: 'domaine(${1:t})', methodSnippet: 'domaine(${VAR})', category: 'Table', targetType: 'table' },
        { name: 'domainetable', arity: 1, luaHelper: '__psc_table_domaine', description: 'Ensemble des clés de la table', signature: 'domaineTable(t : Table) : ensemble', snippet: 'domaineTable(${1:t})', methodSnippet: 'domaineTable(${VAR})', category: 'Table', targetType: 'table' },
        { name: 'accestable', arity: 2, luaHelper: '__psc_table_acces', description: 'Accède à une valeur par clé', signature: 'accesTable(t : Table, clé) : valeur', snippet: 'accesTable(${1:t}, ${2:clé})', methodSnippet: 'accesTable(${VAR}, ${1:clé})', category: 'Table', targetType: 'table' },
        { name: 'ajouttable', arity: 3, luaHelper: '__psc_table_ajout', isMutator: true, description: 'Ajoute une entrée (clé, valeur)', signature: 'ajoutTable(t : Table, clé, valeur)', snippet: 'ajoutTable(${1:t}, ${2:clé}, ${3:valeur})', methodSnippet: 'ajoutTable(${VAR}, ${1:clé}, ${2:valeur})', category: 'Table', targetType: 'table' },
        { name: 'suppressiontable', arity: 2, luaHelper: '__psc_table_suppression', isMutator: true, description: 'Supprime une entrée', signature: 'suppressionTable(t : Table, clé)', snippet: 'suppressionTable(${1:t}, ${2:clé})', methodSnippet: 'suppressionTable(${VAR}, ${1:clé})', category: 'Table', targetType: 'table' },
        { name: 'changetable', arity: 3, luaHelper: '__psc_table_change', isMutator: true, description: 'Change la valeur d\'une clé', signature: 'changeTable(t : Table, clé, valeur)', snippet: 'changeTable(${1:t}, ${2:clé}, ${3:valeur})', methodSnippet: 'changeTable(${VAR}, ${1:clé}, ${2:valeur})', category: 'Table', targetType: 'table' },
        { name: 'estdans', arity: 2, luaHelper: '__psc_ensemble_estdans', description: 'Vérifie si un élément appartient à un ensemble (ex: domaine(t)), une table ou une liste', signature: 'estDans(col, élément) : booléen', snippet: 'estDans(${1:col}, ${2:élément})', methodSnippet: 'estDans(${VAR}, ${1:élément})', category: 'Ensemble', targetType: ['ensemble', 'table', 'liste'] }
    ] as PscFunction[]
};
