/**
 * Registre centralisé des blocs pour le langage Pseudo-Code.
 * Source unique de vérité (Single Source of Truth) pour :
 * - Le Linter (détection d'ouverture, fermeture, continuité et stratégie search-and-recover)
 * - L'Autocomplétion (suivi de la pile des blocs, snippets de structures, propositions de fermeture)
 * - Le Formateur et l'Indentation (patterns d'augmentation/diminution d'indentation, onEnterRules, folding)
 */

export interface BlockSnippet {
    label: string;
    filterText?: string;
    body: string;
    detail: string;
    sort: string;
}

export interface BlockContinuation {
    name: string;
    pattern: RegExp;
}

export interface BlockDefinition {
    /** Identifiant unique du type de bloc (ex: 'Si', 'Pour', 'TantQue', 'Début') */
    id: string;
    /** Nom d'affichage pour les messages diagnostics et aide */
    name: string;
    /** Expression régulière détectant l'ouverture de ce bloc */
    openPattern: RegExp;
    /** Liste des mots-clés qui ferment ce bloc (ex: ['fsi'], ['ftq', 'ftant']) */
    closeKeywords: string[];
    /** Expression régulière détectant la fermeture de ce bloc */
    closePattern: RegExp;
    /** Libellé affiché dans les messages d'erreur de fermeture manquante (ex: 'fsi', 'ftq/ftant', 'Fin') */
    expectedClosing: string;
    /** Continuations intermédiaires (ex: 'Sinon', 'Sinon si') qui ne créent pas un nouveau bloc */
    continuations?: BlockContinuation[];
    /** Snippet principal pour l'autocomplétion */
    snippet?: BlockSnippet;
    /** Snippets additionnels (variantes de la structure) */
    extraSnippets?: BlockSnippet[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRE CENTRAL DES BLOCS DU LANGAGE
// ═══════════════════════════════════════════════════════════════════════════════

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
    {
        id: 'Si',
        name: 'Si',
        openPattern: /^\s*Si\b/i,
        closeKeywords: ['fsi'],
        closePattern: /^\s*fsi\b/i,
        expectedClosing: 'fsi',
        continuations: [
            { name: 'Sinon si', pattern: /^\s*Sinon\s+si\b/i },
            { name: 'Sinon', pattern: /^\s*Sinon\b/i }
        ],
        snippet: {
            label: 'Si',
            filterText: 'si',
            body: 'Si ${1:condition} Alors :\n\t${2}\nfsi',
            detail: 'Structure conditionnelle Si/Alors',
            sort: '2a'
        },
        extraSnippets: [
            {
                label: 'Si...Sinon',
                filterText: 'sisinon si sinon',
                body: 'Si ${1:condition} Alors :\n\t${2}\nSinon :\n\t${3}\nfsi',
                detail: 'Structure Si/Alors/Sinon',
                sort: '2b'
            },
            {
                label: 'Sinon',
                filterText: 'sinon',
                body: 'Sinon :\n\t${1}',
                detail: 'Branche alternative',
                sort: '2h'
            },
            {
                label: 'Sinon si',
                filterText: 'sinonsi sinon si',
                body: 'Sinon si ${1:condition} Alors :\n\t${2}',
                detail: 'Branche conditionnelle alternative',
                sort: '2i'
            }
        ]
    },
    {
        id: 'Pour',
        name: 'Pour',
        openPattern: /^\s*Pour\b/i,
        closeKeywords: ['fpour'],
        closePattern: /^\s*fpour\b/i,
        expectedClosing: 'fpour',
        snippet: {
            label: 'Pour',
            filterText: 'pour',
            body: 'Pour ${1:i} de ${2:0} à ${3:n-1} Faire :\n\t${4}\nfpour',
            detail: 'Boucle Pour',
            sort: '2c'
        },
        extraSnippets: [
            {
                label: 'Pour (décroissant)',
                filterText: 'pourdec pour décroissant',
                body: 'Pour ${1:i} de ${2:n-1} à ${3:0} décroissant Faire :\n\t${4}\nfpour',
                detail: 'Boucle Pour décroissante',
                sort: '2d'
            },
            {
                label: 'Pour (tableau)',
                filterText: 'pourtab pour tab',
                body: 'Pour ${1:i} de ${2:0} à ${3:n-1} Faire :\n\t${4:tab}[${1:i}] ← ${5}\nfpour',
                detail: 'Boucle Pour pour parcourir un tableau',
                sort: '2c2'
            }
        ]
    },
    {
        id: 'TantQue',
        name: 'Tant que',
        openPattern: /^\s*Tant\s+que\b/i,
        closeKeywords: ['ftq', 'ftant'],
        closePattern: /^\s*(?:ftq|ftant)\b/i,
        expectedClosing: 'ftq/ftant',
        snippet: {
            label: 'Tant que',
            filterText: 'tantque tant que tq',
            body: 'Tant que ${1:condition} Faire :\n\t${2}\nftq',
            detail: 'Boucle Tant que',
            sort: '2e'
        }
    },
    {
        id: 'Début',
        name: 'Début',
        openPattern: /^\s*d[ée]but\b/i,
        closeKeywords: ['Fin'],
        closePattern: /^\s*Fin\b/i,
        expectedClosing: 'Fin',
        snippet: {
            label: 'Algorithme',
            filterText: 'algorithme algo',
            body: 'Algorithme ${1:Nom}\nDébut\n\t${2}\nFin',
            detail: 'Algorithme principal (nommé)',
            sort: '2k'
        },
        extraSnippets: [
            {
                label: 'Algorithme (sans nom)',
                filterText: 'algorithme algo',
                body: 'Algorithme\nDébut\n\t${1}\nFin',
                detail: 'Algorithme principal (anonyme)',
                sort: '2l'
            },
            {
                label: 'Fonction',
                filterText: 'fonction func',
                body: 'Fonction ${1:nom}(${2:params}) : ${3:type}\nDébut\n\t${4}\nFin',
                detail: 'Déclare une fonction',
                sort: '2j'
            }
        ]
    }
];

// ═══════════════════════════════════════════════════════════════════════════════
// PATTERNS COMPILÉS DÉRIVÉS DU REGISTRE
// ═══════════════════════════════════════════════════════════════════════════════

/** Liste plate de tous les mots-clés de fermeture de blocs */
export const ALL_CLOSING_KEYWORDS = BLOCK_DEFINITIONS.flatMap(b => b.closeKeywords);

/** Expression régulière matchant n'importe quel mot-clé fermant */
export const REGEX_ALL_CLOSING = new RegExp(`^\\s*(${ALL_CLOSING_KEYWORDS.join('|')})\\b`, 'i');

/** Expression régulière pour augmenter l'indentation (ouverture de bloc, continuations, lexique) */
export const INCREASE_INDENT_PATTERN = /^\s*(d[ée]but|.*?\b(alors|faire)\s*:?|sinon(\s+si\b.*?\balors)?\s*:?|lexique\s*:?)\s*(?:\/\/.*)?$/i;

/** Expression régulière pour diminuer l'indentation (fermetures et continuations comme sinon) */
export const DECREASE_INDENT_PATTERN = new RegExp(`^\\s*(${[...ALL_CLOSING_KEYWORDS, 'sinon'].join('|')})\\b`, 'i');

/** Détecte la fin d'un en-tête de bloc (Alors, Faire, Sinon, Début, avec ou sans ':') */
export const REGEX_END_OF_BLOCK_HEADER = /^(?:.*?\b(?:Alors|Faire)\s*:?|d[ée]but\s*:?|Sinon\s*:?)\s*$/i;

/** Contexte de ':' après un mot-clé de bloc (où aucune complétion ne doit être proposée) */
export const REGEX_KEYWORD_COLON_CONTEXT = /(?:Alors|Faire|Sinon|d[ée]but|Lexique)\s*:\s*$/i;

// ═══════════════════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES POUR L'ANALYSE DE BLOCS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Identifie si une ligne correspond à l'ouverture d'un bloc.
 * Retourne la définition du bloc correspondant, ou null si ce n'est pas un ouvrant (ou si c'est une continuation).
 */
export function findOpeningBlock(trimmedLine: string): BlockDefinition | null {
    if (!trimmedLine) return null;

    // Si c'est une continuation (ex: Sinon si), ce n'est pas une nouvelle ouverture de bloc
    if (isBlockContinuation(trimmedLine)) {
        return null;
    }

    for (const block of BLOCK_DEFINITIONS) {
        if (block.openPattern.test(trimmedLine)) {
            return block;
        }
    }
    return null;
}

/**
 * Identifie si une ligne est une continuation d'un bloc existant (ex: Sinon, Sinon si).
 */
export function isBlockContinuation(trimmedLine: string): boolean {
    if (!trimmedLine) return false;
    for (const block of BLOCK_DEFINITIONS) {
        if (block.continuations) {
            for (const cont of block.continuations) {
                if (cont.pattern.test(trimmedLine)) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * Identifie si une ligne correspond à la fermeture d'un bloc.
 * Retourne la définition du bloc et le mot-clé exact trouvé, ou null.
 */
export function findClosingBlock(trimmedLine: string): { block: BlockDefinition; keyword: string } | null {
    if (!trimmedLine) return null;

    for (const block of BLOCK_DEFINITIONS) {
        if (block.closePattern.test(trimmedLine)) {
            // Trouver le mot-clé exact
            const matchedKw = block.closeKeywords.find(kw => new RegExp(`^\\s*${kw}\\b`, 'i').test(trimmedLine)) || block.closeKeywords[0];
            return { block, keyword: matchedKw };
        }
    }
    return null;
}

/**
 * Vérifie si une ligne correspond à la fin d'un en-tête de bloc (Alors, Faire, Sinon, Début, avec ou sans ':').
 */
export function isEndOfBlockHeader(line: string): boolean {
    return REGEX_END_OF_BLOCK_HEADER.test(line.trim());
}

/**
 * Vérifie si une ligne est une ligne d'en-tête ou d'ouverture de bloc.
 * Utile pour éviter de proposer des mots-clés fermants sur une ligne d'ouverture.
 */
export function isBlockHeaderOrOpenLine(lineText: string): boolean {
    const trimmed = lineText.trim();
    if (!trimmed) return false;

    if (findOpeningBlock(trimmed) !== null) return true;
    if (isBlockContinuation(trimmed)) return true;
    if (/\b(?:Alors|Faire)\b/i.test(trimmed)) return true;
    if (/^\s*(?:Algorithme|Fonction|Procédure)\b/i.test(trimmed)) return true;

    return false;
}

/**
 * Recherche l'index de la dernière occurrence d'un type de bloc dans une pile de blocs.
 */
export function findLastBlockIndex(blocks: Array<{ type: string }>, type: string): number {
    for (let i = blocks.length - 1; i >= 0; i--) {
        if (blocks[i].type === type) {
            return i;
        }
    }
    return -1;
}

/**
 * Retourne tous les snippets associés aux blocs pour l'autocomplétion.
 */
export function getAllBlockSnippets(): BlockSnippet[] {
    const snippets: BlockSnippet[] = [];
    for (const block of BLOCK_DEFINITIONS) {
        if (block.snippet) {
            snippets.push(block.snippet);
        }
        if (block.extraSnippets) {
            snippets.push(...block.extraSnippets);
        }
    }
    return snippets;
}
