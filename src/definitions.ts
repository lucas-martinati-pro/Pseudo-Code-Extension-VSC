/**
 * Registre central des définitions pour le langage Pseudo-Code.
 * Ce fichier sert de source de vérité pour les types, fonctions et mots-clés.
 */

export interface PscType {
    name: string;
    aliases: string[];
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
}

export interface PscKeyword {
    name: string;
    type: 'control' | 'block' | 'boolean' | 'operator' | 'io' | 'modifier' | 'other';
    luaEquivalent?: string;
}

export const PSC_DEFINITIONS = {
    types: [
        { name: 'entier', aliases: ['entier'] },
        { name: 'réel', aliases: ['réel', 'reel'] },
        { name: 'booléen', aliases: ['booléen', 'booleen'] },
        { name: 'chaîne', aliases: ['chaîne', 'chaine'] },
        { name: 'caractère', aliases: ['caractère', 'caractere'] },
        { name: 'tableau', aliases: ['tableau'] },
        { name: 'liste', aliases: ['liste'] },
        { name: 'pile', aliases: ['pile'] },
        { name: 'file', aliases: ['file'] },
        { name: 'listesym', aliases: ['listesym'] },
        { name: 'table', aliases: ['table'] }
    ] as PscType[],

    keywords: [
        // Contrôle
        { name: 'si', type: 'control', luaEquivalent: 'if' },
        { name: 'alors', type: 'control', luaEquivalent: 'then' },
        { name: 'sinon', type: 'control', luaEquivalent: 'else' },
        { name: 'fsi', type: 'control', luaEquivalent: 'end' },
        { name: 'tant', type: 'control', luaEquivalent: 'while' },
        { name: 'que', type: 'control' },
        { name: 'ftq', type: 'control', luaEquivalent: 'end' },
        { name: 'pour', type: 'control', luaEquivalent: 'for' },
        { name: 'de', type: 'control' },
        { name: 'à', type: 'control' },
        { name: 'faire', type: 'control', luaEquivalent: 'do' },
        { name: 'fpour', type: 'control', luaEquivalent: 'end' },
        { name: 'décroissant', type: 'control' },
        { name: 'retourner', type: 'control', luaEquivalent: 'return' },
        { name: 'retourne', type: 'control', luaEquivalent: 'return' },

        // Blocs
        { name: 'début', type: 'block' },
        { name: 'fin', type: 'block' },
        { name: 'algorithme', type: 'block' },
        { name: 'fonction', type: 'block' },

        // Booléens
        { name: 'vrai', type: 'boolean', luaEquivalent: 'true' },
        { name: 'faux', type: 'boolean', luaEquivalent: 'false' },
        { name: 'nil', type: 'boolean', luaEquivalent: 'nil' },

        // Opérateurs
        { name: 'et', type: 'operator', luaEquivalent: 'and' },
        { name: 'ou', type: 'operator', luaEquivalent: 'or' },
        { name: 'non', type: 'operator', luaEquivalent: 'not' },
        { name: 'mod', type: 'operator', luaEquivalent: '%' },

        // IO
        { name: 'écrire', type: 'io', luaEquivalent: '__psc_write' },
        { name: 'lire', type: 'io', luaEquivalent: 'io.read' },

        // Modificateurs
        { name: 'inout', type: 'modifier' }
    ] as PscKeyword[],

    functions: [
        // Opérations sur les chaînes
        { name: 'longueur', arity: 1, luaHelper: '#', description: 'Longueur de la chaîne', signature: 'longueur(s : chaîne) : entier', snippet: 'longueur(${1:s})', category: 'Chaînes' },
        { name: 'concat', arity: 2, luaHelper: '..', description: 'Concaténation', signature: 'concat(s1 : chaîne, s2 : chaîne) : chaîne', snippet: 'concat(${1:s1}, ${2:s2})', category: 'Chaînes' },
        { name: 'souschaîne', arity: 3, luaHelper: 'string.sub', description: 'Sous-chaîne', signature: 'souschaîne(s : chaîne, début : entier, fin : entier) : chaîne', snippet: 'souschaîne(${1:s}, ${2:début}, ${3:fin})', category: 'Chaînes' },
        { name: 'ième', arity: 2, luaHelper: 'string.sub', description: 'Caractère à la position i', signature: 'ième(s : chaîne, i : entier) : caractère', snippet: 'ième(${1:s}, ${2:i})', category: 'Chaînes' },
        { name: 'chaineversentier', arity: 1, luaHelper: '__psc_chaineVersEntier', description: 'Convertit une chaîne en entier', signature: 'chaîneVersEntier(s : chaîne) : entier', snippet: 'chaîneVersEntier(${1:s})', category: 'Chaînes' },

        // Fichiers
        { name: 'fichierouvrir', arity: [1, 2], luaHelper: '__psc_fichierOuvrir', description: 'Ouvre un fichier en lecture ou écriture', signature: 'fichierOuvrir(nom : chaîne [, mode]) : entier', snippet: 'fichierOuvrir(${1:nomFichier})', category: 'Fichiers' },
        { name: 'fichierfermer', arity: [0, 1], luaHelper: '__psc_fichierFermer', description: 'Ferme un fichier', signature: 'fichierFermer([handle : entier])', snippet: 'fichierFermer(${1:handle})', category: 'Fichiers' },
        { name: 'fichierlire', arity: [0, 1], luaHelper: '__psc_fichierLire', description: 'Lit une ligne ou valeur dans un fichier', signature: 'fichierLire([handle : entier]) : chaîne', snippet: 'fichierLire(${1:handle})', category: 'Fichiers' },
        { name: 'fichierfin', arity: [0, 1], luaHelper: '__psc_fichierFin', description: 'Indique si la fin du fichier est atteinte', signature: 'fichierFin([handle : entier]) : booléen', snippet: 'fichierFin(${1:handle})', category: 'Fichiers' },
        { name: 'fichiercreer', arity: 1, luaHelper: '__psc_fichierCreer', description: 'Crée un nouveau fichier', signature: 'fichierCréer(nom : chaîne) : entier', snippet: 'fichierCréer(${1:nomFichier})', category: 'Fichiers' },
        { name: 'fichierecrire', arity: 2, luaHelper: '__psc_fichierEcrire', description: 'Écrit dans un fichier', signature: 'fichierÉcrire(handle : entier, valeur)', snippet: 'fichierÉcrire(${1:handle}, ${2:valeur})', category: 'Fichiers' },

        // Comparaison générale
        { name: 'comparaison', arity: 2, luaHelper: '__psc_comparaison', description: 'Compare deux éléments (réels, chaînes, enregistrements/structures)', signature: 'comparaison(a, b) : booléen', snippet: 'comparaison(${1:a}, ${2:b})', category: 'Autre' },

        // TDA Liste
        { name: 'tete', arity: 1, luaHelper: '__psc_generic_tete', signature: 'tete(l : Liste) : entier', snippet: 'tete(${1:l})', category: 'Liste' },
        { name: 'val', arity: 2, luaHelper: '__psc_liste_val', signature: 'val(l : Liste, p : entier) : élément', snippet: 'val(${1:l}, ${2:p})', category: 'Liste' },
        { name: 'suc', arity: 2, luaHelper: '__psc_liste_suc', signature: 'suc(l : Liste, p : entier) : entier', snippet: 'suc(${1:l}, ${2:p})', category: 'Liste' },
        { name: 'finliste', arity: 2, luaHelper: '__psc_liste_fin', signature: 'finListe(l : Liste, p : entier) : booléen', snippet: 'finListe(${1:l}, ${2:p})', category: 'Liste' },
        { name: 'listevide', arity: 0, luaHelper: '__psc_liste_vide', signature: 'listeVide() : Liste', snippet: 'listeVide()', category: 'Liste' },
        { name: 'longueurliste', arity: 1, luaHelper: '__psc_liste_longueur', description: 'Longueur de la liste', signature: 'longueurListe(l : Liste) : entier', snippet: 'longueurListe(${1:l})', category: 'Liste' },
        { name: 'acces', arity: 2, luaHelper: '__psc_liste_acces', description: 'Accès au i-ème élément de la liste', signature: 'acces(l : Liste, i : entier) : élément', snippet: 'acces(${1:l}, ${2:i})', category: 'Liste' },
        { name: 'ajoutteteliste', arity: 2, luaHelper: '__psc_liste_ajout_tete', isMutator: true, signature: 'ajoutTeteListe(l : Liste, v) : Liste', snippet: 'ajoutTeteListe(${1:l}, ${2:v})', category: 'Liste' },
        { name: 'suppressionteteliste', arity: 1, luaHelper: '__psc_liste_suppression_tete', isMutator: true, signature: 'suppressionTeteListe(l : Liste) : Liste', snippet: 'suppressionTeteListe(${1:l})', category: 'Liste' },
        { name: 'ajoutqueueliste', arity: 2, luaHelper: '__psc_liste_ajout_queue', isMutator: true, signature: 'ajoutQueueListe(l : Liste, v) : Liste', snippet: 'ajoutQueueListe(${1:l}, ${2:v})', category: 'Liste' },
        { name: 'suppressionqueueliste', arity: 1, luaHelper: '__psc_liste_suppression_queue', isMutator: true, signature: 'suppressionQueueListe(l : Liste) : Liste', snippet: 'suppressionQueueListe(${1:l})', category: 'Liste' },
        { name: 'ajoutliste', arity: 3, luaHelper: '__psc_liste_ajout', isMutator: true, signature: 'ajoutListe(l : Liste, p : entier, v) : Liste', snippet: 'ajoutListe(${1:l}, ${2:p}, ${3:v})', category: 'Liste' },
        { name: 'suppressionliste', arity: 2, luaHelper: '__psc_liste_suppression', isMutator: true, signature: 'suppressionListe(l : Liste, p : entier) : Liste', snippet: 'suppressionListe(${1:l}, ${2:p})', category: 'Liste' },
        { name: 'changeliste', arity: 3, luaHelper: '__psc_liste_change', isMutator: true, signature: 'changeListe(l : Liste, p : entier, v) : Liste', snippet: 'changeListe(${1:l}, ${2:p}, ${3:v})', category: 'Liste' },
        { name: 'change', arity: 3, luaHelper: '__psc_liste_change', isMutator: true, signature: 'change(l : Liste, p : entier, v) : Liste', snippet: 'change(${1:l}, ${2:p}, ${3:v})', category: 'Liste' },

        // TDA ListeSym
        { name: 'tetels', arity: 1, luaHelper: '__psc_listesym_tete', signature: 'teteLS(l : ListeSym) : place', snippet: 'teteLS(${1:l})', category: 'Liste Symétrique' },
        { name: 'queuels', arity: 1, luaHelper: '__psc_listesym_queue', signature: 'queueLS(l : ListeSym) : place', snippet: 'queueLS(${1:l})', category: 'Liste Symétrique' },
        { name: 'valls', arity: 2, luaHelper: '__psc_listesym_val', signature: 'valLS(l : ListeSym, p : place) : élément', snippet: 'valLS(${1:l}, ${2:p})', category: 'Liste Symétrique' },
        { name: 'sucls', arity: 2, luaHelper: '__psc_listesym_suc', signature: 'sucLS(l : ListeSym, p : place) : place', snippet: 'sucLS(${1:l}, ${2:p})', category: 'Liste Symétrique' },
        { name: 'precls', arity: 2, luaHelper: '__psc_listesym_prec', signature: 'precLS(l : ListeSym, p : place) : place', snippet: 'precLS(${1:l}, ${2:p})', category: 'Liste Symétrique' },
        { name: 'finls', arity: 2, luaHelper: '__psc_listesym_fin', signature: 'finLS(l : ListeSym, p : place) : booléen', snippet: 'finLS(${1:l}, ${2:p})', category: 'Liste Symétrique' },
        { name: 'videls', arity: 0, luaHelper: '__psc_listesym_vide', signature: 'videLS() : ListeSym', snippet: 'videLS()', category: 'Liste Symétrique' },
        { name: 'ajouttetels', arity: 2, luaHelper: '__psc_listesym_ajout_tete', signature: 'ajoutTeteLS(l : ListeSym, v)', snippet: 'ajoutTeteLS(${1:l}, ${2:v})', category: 'Liste Symétrique' },
        { name: 'suppressiontetels', arity: 1, luaHelper: '__psc_listesym_suppression_tete', signature: 'suppressionTeteLS(l : ListeSym)', snippet: 'suppressionTeteLS(${1:l})', category: 'Liste Symétrique' },
        { name: 'ajoutqueuels', arity: 2, luaHelper: '__psc_listesym_ajout_queue', signature: 'ajoutQueueLS(l : ListeSym, v)', snippet: 'ajoutQueueLS(${1:l}, ${2:v})', category: 'Liste Symétrique' },
        { name: 'suppressionqueuels', arity: 1, luaHelper: '__psc_listesym_suppression_queue', signature: 'suppressionQueueLS(l : ListeSym)', snippet: 'suppressionQueueLS(${1:l})', category: 'Liste Symétrique' },
        { name: 'ajoutls', arity: 3, luaHelper: '__psc_listesym_ajout', signature: 'ajoutLS(l : ListeSym, p : place, v)', snippet: 'ajoutLS(${1:l}, ${2:p}, ${3:v})', category: 'Liste Symétrique' },
        { name: 'suppressionls', arity: 2, luaHelper: '__psc_listesym_suppression', signature: 'suppressionLS(l : ListeSym, p : place)', snippet: 'suppressionLS(${1:l}, ${2:p})', category: 'Liste Symétrique' },
        { name: 'changels', arity: 3, luaHelper: '__psc_listesym_change', signature: 'changeLS(l : ListeSym, p : place, v)', snippet: 'changeLS(${1:l}, ${2:p}, ${3:v})', category: 'Liste Symétrique' },

        // TDA Pile
        { name: 'pilevide', arity: 0, luaHelper: '__psc_pile_vide', signature: 'pileVide() : Pile', snippet: 'pileVide()', category: 'Pile' },
        { name: 'sommet', arity: 1, luaHelper: '__psc_pile_sommet', signature: 'sommet(p : Pile) : élément', snippet: 'sommet(${1:p})', category: 'Pile' },
        { name: 'estvidepile', arity: 1, luaHelper: '__psc_pile_est_vide', signature: 'estVidePile(p : Pile) : booléen', snippet: 'estVidePile(${1:p})', category: 'Pile' },
        { name: 'empiler', arity: 2, luaHelper: '__psc_pile_empiler', signature: 'empiler(p : Pile, v)', snippet: 'empiler(${1:p}, ${2:v})', category: 'Pile' },
        { name: 'depiler', arity: 1, luaHelper: '__psc_pile_depiler', signature: 'dépiler(p : Pile)', snippet: 'depiler(${1:p})', category: 'Pile' },
        { name: 'estvide', arity: 1, luaHelper: '__psc_pile_est_vide', signature: 'estVide(p : Pile) : booléen', snippet: 'estVide(${1:p})', category: 'Pile' }, // Alias générique

        // TDA File
        { name: 'filevide', arity: 0, luaHelper: '__psc_file_vide', signature: 'fileVide() : File', snippet: 'fileVide()', category: 'File' },
        { name: 'estvidefile', arity: 1, luaHelper: '__psc_file_est_vide', signature: 'estVideFile(f : File) : booléen', snippet: 'estVideFile(${1:f})', category: 'File' },
        { name: 'enfiler', arity: 2, luaHelper: '__psc_file_enfiler', signature: 'enfiler(f : File, v)', snippet: 'enfiler(${1:f}, ${2:v})', category: 'File' },
        { name: 'defiler', arity: 1, luaHelper: '__psc_file_defiler', signature: 'défiler(f : File)', snippet: 'defiler(${1:f})', category: 'File' },
        { name: 'premier', arity: 1, luaHelper: '__psc_file_premier', signature: 'premier(f : File) : élément', snippet: 'premier(${1:f})', category: 'File' },
        { name: 'ajoutfile', arity: 2, luaHelper: '__psc_file_enfiler', signature: 'ajoutFile(f : File, v)', snippet: 'ajoutFile(${1:f}, ${2:v})', category: 'File' }, // Alias
        { name: 'suppressionfile', arity: 1, luaHelper: '__psc_file_defiler', signature: 'suppressionFile(f : File)', snippet: 'suppressionFile(${1:f})', category: 'File' }, // Alias
        { name: 'estfilevide', arity: 1, luaHelper: '__psc_file_est_vide', signature: 'estFileVide(f : File) : booléen', snippet: 'estFileVide(${1:f})', category: 'File' }, // Alias

        // TDA Table (Dictionnaire/Map: Clé -> Valeur)
        { name: 'tablevide', arity: 0, luaHelper: '__psc_table_vide', signature: 'tableVide() : Table', snippet: 'tableVide()', category: 'Table' },
        { name: 'table', arity: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], luaHelper: '__psc_table_from_pairs', description: 'Constructeur de table avec paires clé-valeur', signature: 'table(clé1, val1, ...)', snippet: 'table(${1:clé}, ${2:valeur})', category: 'Table' },
        { name: 'domaine', arity: 1, luaHelper: '__psc_table_domaine', signature: 'domaine(t : Table) : ensemble', snippet: 'domaine(${1:t})', category: 'Table' },
        { name: 'domainetable', arity: 1, luaHelper: '__psc_table_domaine', description: 'Ensemble des clés de la table', signature: 'domaineTable(t : Table) : ensemble', snippet: 'domaineTable(${1:t})', category: 'Table' },
        { name: 'accestable', arity: 2, luaHelper: '__psc_table_acces', signature: 'accesTable(t : Table, clé) : valeur', snippet: 'accesTable(${1:t}, ${2:clé})', category: 'Table' },
        { name: 'ajouttable', arity: 3, luaHelper: '__psc_table_ajout', isMutator: true, signature: 'ajoutTable(t : Table, clé, valeur)', snippet: 'ajoutTable(${1:t}, ${2:clé}, ${3:valeur})', category: 'Table' },
        { name: 'suppressiontable', arity: 2, luaHelper: '__psc_table_suppression', isMutator: true, signature: 'suppressionTable(t : Table, clé)', snippet: 'suppressionTable(${1:t}, ${2:clé})', category: 'Table' },
        { name: 'changetable', arity: 3, luaHelper: '__psc_table_change', isMutator: true, signature: 'changeTable(t : Table, clé, valeur)', snippet: 'changeTable(${1:t}, ${2:clé}, ${3:valeur})', category: 'Table' },
        { name: 'estdans', arity: 2, luaHelper: '__psc_ensemble_estdans', signature: 'estDans(ensemble, élément) : booléen', snippet: 'estDans(${1:ensemble}, ${2:élément})', category: 'Table' }
    ] as PscFunction[]
};
