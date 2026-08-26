/**
 * Configuration centralisée pour l'extension Pseudo-Code
 * Tous les patterns regex et mots-clés sont définis ici pour éviter la duplication
 */

import { PSC_DEFINITIONS } from './definitions';

// Mots-clés du langage
export const KEYWORDS = {
    CONTROL: PSC_DEFINITIONS.keywords.filter(k => k.type === 'control').map(k => k.name),
    BLOCKS: PSC_DEFINITIONS.keywords.filter(k => k.type === 'block').map(k => k.name),
    TYPES: PSC_DEFINITIONS.types.flatMap(t => t.aliases),
    BOOLEAN: PSC_DEFINITIONS.keywords.filter(k => k.type === 'boolean').map(k => k.name),
    OPERATORS: PSC_DEFINITIONS.keywords.filter(k => k.type === 'operator').map(k => k.name),
    IO: PSC_DEFINITIONS.keywords.filter(k => k.type === 'io').map(k => k.name),
    MODIFIERS: PSC_DEFINITIONS.keywords.filter(k => k.type === 'modifier').map(k => k.name),

    // Fonctions spéciales avec traitement particulier dans l'executor
    STRING_OPS: ['longueur', 'concat', 'souschaîne', 'ième'],

    // TOUTES les fonctions sont maintenant automatiquement extraites de definitions.ts
    ALL_FUNCTIONS: PSC_DEFINITIONS.functions.map(f => f.name)
} as const;

// Arité attendue des fonctions intégrées (pour le linter)
// Clés en minuscules (comparaison insensible à la casse côté linter)
export const BUILTIN_FUNCTION_ARITY: Record<string, number | number[]> = Object.fromEntries(
    PSC_DEFINITIONS.functions.map(f => [f.name, f.arity])
);

// Tous les identifiants connus (pour le linter)
// ✨ AUTOMATIQUE : Toute fonction ajoutée dans definitions.ts sera automatiquement reconnue
export const KNOWN_IDENTIFIERS = new Set([
    ...KEYWORDS.CONTROL,
    ...KEYWORDS.BLOCKS,
    ...KEYWORDS.TYPES,
    ...KEYWORDS.BOOLEAN,
    ...KEYWORDS.OPERATORS,
    ...KEYWORDS.IO,
    ...KEYWORDS.MODIFIERS,
    ...KEYWORDS.STRING_OPS,
    ...KEYWORDS.ALL_FUNCTIONS,  // ✅ Toutes les fonctions automatiquement !
    'lexique', 'fin_ligne'
]);

// Patterns regex réutilisables
export const PATTERNS = {
    // Identifiants
    IDENTIFIER: /[\p{L}_][\p{L}0-9_]*/u,
    IDENTIFIER_GLOBAL: /[\p{L}_][\p{L}0-9_]*/gu,
    WORD_BOUNDARY_IDENTIFIER: /(?<![\p{L}0-9_])[\p{L}_][\p{L}0-9_]*(?![\p{L}0-9_])/gu,

    // Fonction
    FUNCTION_DECLARATION: /^\s*Fonction\s+([\p{L}_][\p{L}0-9_]*)\s*\((.*)\)/iu,
    FUNCTION_CALL: /([\p{L}_][\p{L}0-9_]+)\s*\(([^)]*)\)/gu,

    // Variables
    VARIABLE_DECLARATION: /^([\p{L}0-9_,\s]+?)\s*:\s*([\p{L}0-9_]+(?:\([^()]*\))?)/iu,
    ASSIGNMENT: /←/,
    READ_ASSIGNMENT: /^\s*[\p{L}0-9_]+\s*←\s*lire\s*\(\s*\)\s*$/iu,

    // Types composites
    COMPOSITE_TYPE: /^([\p{L}_][\p{L}0-9_]*)\s*(?:=\s*)?<\s*(.+?)\s*>$/iu,
    COMPOSITE_FIELD: /^([\p{L}_][\p{L}0-9_]*)\s*:\s*(.+)$/iu,
    COMPOSITE_LITERAL: /(?<![\w\s])<([^>]+)>/g,

    // Tableaux
    ARRAY_LITERAL: /(?<![\p{L}0-9_])\[([^\]]*)\]/gu,
    ARRAY_ACCESS: /([\p{L}0-9_]+)\[([^\]]+)\]/gu,

    // Structures de contrôle
    FOR_LOOP: /^\s*Pour\s+([\p{L}0-9_]+)\s+(?:allant de|de)\s+(.+)\s+(?:a|à)\s+(.+)\s+Faire\s*:?/iu,
    WHILE_LOOP: /^\s*Tant que\b/i,
    IF_STATEMENT: /^\s*Si\b/i,
    ELSE_IF: /^\s*Sinon\s+si\b/i,
    ELSE: /^\s*Sinon\b/i,

    // Blocs
    ALGORITHM: /^\s*algorithme\b/i,
    BEGIN: /^\s*Début\b/i,
    END: /^\s*Fin\b/i,
    CLOSING_KEYWORDS: /^\s*(Fin|fsi|fpour|ftq|ftant)\b/i,
    OPENING_BLOCK: /^\s*(Si|Tant que|Début)(?![\p{L}0-9_])/iu,

    // Commentaires
    LINE_COMMENT: /\/\/.*/,
    BLOCK_COMMENT: /\/\*[\s\S]*?\*\//g,
    LEXIQUE: /Lexique\s*:?[\s\S]*/i,

    // Strings
    DOUBLE_QUOTES: /"[^"]*"/g,
    SINGLE_QUOTES: /'(?:\\.|[^\\'])'/g,
    SMART_QUOTES: /[""]/g,

    // Accès aux champs d'objets
    FIELD_ACCESS: /([\p{L}_][\p{L}0-9_]*)\.([\p{L}_][\p{L}0-9_]*)/gu,
    BRACKET_FIELD_ACCESS: /(\])\.([\p{L}_][\p{L}0-9_]*)/gu,
    DOT_FIELD: /\.[\p{L}_][\p{L}0-9_]*/gu
} as const;

// Mapping des types normalisés
export const TYPE_MAPPING: Record<string, string> = Object.fromEntries(
    PSC_DEFINITIONS.types.flatMap(t => t.aliases.map(alias => [alias, t.name]))
);

// Remplacements de symboles pour Lua
export const LUA_REPLACEMENTS: Record<string, string> = {
    ...Object.fromEntries(
        PSC_DEFINITIONS.keywords
            .filter(k => k.luaEquivalent)
            .map(k => [k.name, k.luaEquivalent!])
    ),
    // Opérateurs arithmétiques et spéciaux non couverts par les mots-clés simples
    '≠': '~=',
    '≤': '<=',
    '≥': '>=',
    '÷': '//',
    'lire()': '__psc_lire()',
    'FIN_LIGNE': "'\n'"
} as const;

// Fonctions PSC mappées vers des helpers Lua
export const FUNCTION_MAPPING: Record<string, string> = Object.fromEntries(
    PSC_DEFINITIONS.functions.map(f => [f.name, f.luaHelper])
);

// Helpers Lua
export const LUA_HELPERS = `if package.config:sub(1,1) == "\\\\" then os.execute("chcp 65001 >nul") end
local FIN_LIGNE = "\\n"
local __psc_file_handles = {}
local __psc_virtual_files = {}
local __psc_file_current_handle = 1

local __psc_fichierOuvrir
local __psc_fichierCreer
local __psc_fichierEcrire
local __psc_fichierLire
local __psc_fichierFin
local __psc_fichierFermer

__psc_fichierOuvrir = function(nomFichier, mode)
    nomFichier = tostring(nomFichier or "fichier.txt")
    mode = mode or "r"
    local file, err = io.open(nomFichier, mode)
    local handle = __psc_file_current_handle
    __psc_file_current_handle = __psc_file_current_handle + 1

    if file then
        __psc_file_handles[handle] = { file = file, is_real = true, mode = mode, name = nomFichier }
        return handle
    end

    -- Fallback virtuel en mémoire si le fichier physique est inaccessible
    if not __psc_virtual_files[nomFichier] or mode == "w" then
        __psc_virtual_files[nomFichier] = { lines = {}, name = nomFichier }
    end
    __psc_file_handles[handle] = {
        virtual = __psc_virtual_files[nomFichier],
        is_real = false,
        pos = 1,
        mode = mode,
        name = nomFichier
    }
    return handle
end

__psc_fichierCreer = function(nomFichier)
    return __psc_fichierOuvrir(nomFichier, "w")
end

__psc_fichierEcrire = function(handle, value)
    handle = handle or (__psc_file_current_handle - 1)
    local entry = __psc_file_handles[handle]
    if not entry then return end

    if entry.is_real then
        entry.file:write(tostring(value))
        entry.file:flush()
    else
        local str = tostring(value)
        local lines = entry.virtual.lines
        if #lines == 0 then table.insert(lines, "") end
        if str == "\\n" then
            table.insert(lines, "")
        else
            lines[#lines] = lines[#lines] .. str
        end
    end
end

__psc_fichierFermer = function(handle)
    handle = handle or (__psc_file_current_handle - 1)
    local entry = __psc_file_handles[handle]
    if entry then
        if entry.is_real and entry.file then
            entry.file:close()
        end
        __psc_file_handles[handle] = nil
    end
end

__psc_fichierLire = function(handle)
    handle = handle or (__psc_file_current_handle - 1)
    local entry = __psc_file_handles[handle]
    if not entry then return nil end

    if entry.is_real then
        local line = entry.file:read("*l")
        if line ~= nil then
            return line:match("^%s*(.-)%s*$") or line
        else
            entry.eof = true
            return nil
        end
    else
        local v = entry.virtual
        if entry.pos <= #v.lines then
            local line = v.lines[entry.pos]
            entry.pos = entry.pos + 1
            return line:match("^%s*(.-)%s*$") or line
        else
            entry.eof = true
            return nil
        end
    end
end

__psc_fichierFin = function(handle)
    handle = handle or (__psc_file_current_handle - 1)
    local entry = __psc_file_handles[handle]
    if not entry then return true end
    return entry.eof == true
end

local function __psc_chaineVersEntier(chaine)
    return tonumber(chaine) or 0
end

-- Fonction de lecture personnalisée qui convertit automatiquement en nombre si possible
local function __psc_lire(prompt)
    if prompt then
        io.write(tostring(prompt))
        io.flush()
    end
    local input = io.read("*l")
    if not input then return 0 end
    local clean = input:match("^%s*(.-)%s*$")
    if clean == nil or clean == "" then
        return 0
    end
    local num = tonumber(clean) or tonumber((clean:gsub(",", ".")))
    if num ~= nil then
        return num
    end
    return clean
end

-- Metatable pour les types composites (égalité par valeur et affichage lisible)
local __psc_composite_mt
__psc_composite_mt = {
    __eq = function(a, b)
        if type(a) ~= "table" or type(b) ~= "table" then return a == b end
        for k, v in pairs(a) do
            if b[k] ~= v and not (type(v) == "table" and type(b[k]) == "table" and v == b[k]) then
                return false
            end
        end
        for k, v in pairs(b) do
            if a[k] == nil then return false end
        end
        return true
    end,
    __tostring = function(t)
        local parts = {}
        for k, v in pairs(t) do
            table.insert(parts, tostring(k) .. " = " .. tostring(v))
        end
        return "<" .. table.concat(parts, ", ") .. ">"
    end
}

local function __psc_create_composite(t)
    return setmetatable(t, __psc_composite_mt)
end

-- Comparaison générique pour tri et algorithmes
local function __psc_comparaison(a, b)
    if a == nil and b == nil then return false end
    if a == nil then return false end
    if b == nil then return true end
    if type(a) == "number" and type(b) == "number" then
        return a > b
    elseif type(a) == "string" and type(b) == "string" then
        return a > b
    elseif type(a) == "table" and type(b) == "table" then
        -- Enregistrement Date (annee, mois, jour)
        if a.annee ~= nil and b.annee ~= nil then
            if a.annee ~= b.annee then return a.annee > b.annee end
            if a.mois ~= nil and b.mois ~= nil and a.mois ~= b.mois then return a.mois > b.mois end
            if a.jour ~= nil and b.jour ~= nil then return a.jour > b.jour end
            return false
        end
        -- Enregistrement avec dateNaiss
        if a.dateNaiss ~= nil and b.dateNaiss ~= nil then
            return __psc_comparaison(a.dateNaiss, b.dateNaiss)
        end
        -- Enregistrement avec nom/prenom
        if a.nom ~= nil and b.nom ~= nil and a.nom ~= b.nom then
            return a.nom > b.nom
        end
        -- Comparaison générale des champs
        for k, v in pairs(a) do
            if b[k] ~= nil and v ~= b[k] then
                return __psc_comparaison(v, b[k])
            end
        end
        return false
    end
    return tostring(a) > tostring(b)
end


local function __psc_is_array(t)
    if type(t) ~= 'table' then return false end
    local i = 0
    for _ in pairs(t) do
        i = i + 1
    end
    local count = 0
    for k in pairs(t) do
        if type(k) == 'number' then count = count + 1 end
    end
    return count == i
end

-- Détection d'une liste chaînée TDA (nœud avec champs 'val' et/ou 'suc')
local function __psc_is_liste(t)
    return type(t) == 'table' and (t.val ~= nil or t.suc ~= nil)
end

-- Détection d'une liste symétrique TDA (table avec head/tail ou noeud avec val/suc/prec)
local function __psc_is_listesym(t)
    -- Structure conteneur { head = ..., tail = ... }
    if type(t) == 'table' and (t.head ~= nil or t.tail ~= nil) then return true end
    -- Noeud { val=..., suc=..., prec=... }
    if type(t) == 'table' and (t.val ~= nil and (t.suc ~= nil or t.prec ~= nil)) then return true end
    return false
end

-- Sérialisation générique (incluant listes TDA au format (a, b, c))
local function __psc_serialize(v)
    -- Gestion des valeurs nil (listes vides)
    if v == nil then
        return '()'
    end
    
    if type(v) == 'table' then
        -- Vérifier d'abord si c'est une Pile ou File (avec métadonnée _type)
        if v._type == 'pile' then
            local parts = {}
            for i = 1, #v do
                parts[#parts+1] = __psc_serialize(v[i])
            end
            return 'Pile[' .. table.concat(parts, ', ') .. ']'
        elseif v._type == 'file' then
            local parts = {}
            for i = 1, #v do
                parts[#parts+1] = __psc_serialize(v[i])
            end
            return 'File[' .. table.concat(parts, ', ') .. ']'
        elseif v._type == 'table' then
            -- Table (dictionnaire/map)
            local parts = {}
            if v._data then
                for k, val in pairs(v._data) do
                    parts[#parts+1] = tostring(k) .. ':' .. __psc_serialize(val)
                end
            end
            return 'Table{' .. table.concat(parts, ', ') .. '}'
        elseif __psc_is_liste(v) then
            local parts = {}
            local node = v
            while node ~= nil do
                parts[#parts+1] = __psc_serialize(node.val)
                node = node.suc
            end
            return '(' .. table.concat(parts, ', ') .. ')'
        elseif __psc_is_listesym(v) then
            -- Si c'est le conteneur {head=..., tail=...}
            if v.head ~= nil or v.tail ~= nil then
                local parts = {}
                local node = v.head
                while node ~= nil do
                    parts[#parts+1] = __psc_serialize(node.val)
                    node = node.suc
                end
                return 'LS(' .. table.concat(parts, ', ') .. ')'
            end
            -- Si c'est un noeud isolé, on l'affiche simplement
            return '{val=' .. tostring(v.val) .. '}'
        elseif __psc_is_array(v) then
            -- Tableau normal
            local parts = {}
            for i = 1, #v do
                parts[#parts+1] = __psc_serialize(v[i])
            end
            return '[' .. table.concat(parts, ', ') .. ']'
        else
            -- Objet/enregistrement générique (filtrer _type et _data internes)
            local parts = {}
            for k, val in pairs(v) do
                if k ~= '_type' and k ~= '_data' then
                    parts[#parts+1] = tostring(k) .. ':' .. __psc_serialize(val)
                end
            end
            return '{' .. table.concat(parts, ', ') .. '}'
        end
    elseif type(v) == 'string' then
        return v
    elseif type(v) == 'boolean' then
        return v and 'Vrai' or 'Faux'
    elseif type(v) == 'number' then
        return tostring(v)
    else
        return tostring(v)
    end
end

local function __psc_write(...)
    local n = select("#", ...)
    if n == 0 then
        print()
        return
    end
    local parts = {}
    for i = 1, n do
        local v = select(i, ...)
        parts[i] = __psc_serialize(v)
    end
    local res = ""
    for i = 1, n do
        if i == 1 then
            res = parts[i]
        else
            if res:match("%s$") or parts[i]:match("^%s") then
                res = res .. parts[i]
            else
                res = res .. " " .. parts[i]
            end
        end
    end
    print(res)
end
-- TDA Liste (places entières)
local function __psc_liste_tete(l)
    return 0
end
local function __psc_liste_val(l, p)
    local node = l
    local i = p or 0
    while node ~= nil and i > 0 do
        node = node.suc
        i = i - 1
    end
    return node and node.val or nil
end
local function __psc_liste_suc(l, p)
    return (p or 0) + 1
end
local function __psc_liste_fin(l, p)
    local node = l
    local i = p or 0
    while node ~= nil and i > 0 do
        node = node.suc
        i = i - 1
    end
    return node == nil
end
local function __psc_liste_vide()
    return nil
end
local function __psc_liste_ajout_tete(l, v)
    return { val = v, suc = l }
end
local function __psc_liste_suppression_tete(l)
    if l == nil then return nil end
    return l.suc
end
local function __psc_liste_ajout_queue(l, v)
    if l == nil then
        return { val = v, suc = nil }
    end
    local head = l
    local node = l
    while node.suc ~= nil do
        node = node.suc
    end
    node.suc = { val = v, suc = nil }
    return head
end
local function __psc_liste_suppression_queue(l)
    if l == nil then return nil end
    if l.suc == nil then return nil end
    local head = l
    local prev = nil
    local node = l
    while node.suc ~= nil do
        prev = node
        node = node.suc
    end
    if prev ~= nil then prev.suc = nil end
    return head
end
local function __psc_liste_ajout(l, p, v)
    if l == nil then
        return { val = v, suc = nil }
    end
    local head = l
    local node = l
    local i = p or 0
    while node ~= nil and i > 0 do
        node = node.suc
        i = i - 1
    end
    if node ~= nil then
        node.suc = { val = v, suc = node.suc }
    end
    return head
end
local function __psc_liste_suppression(l, p)
    if l == nil then return nil end
    local head = l
    local i = p or 0
    if i <= 0 then
        return l.suc
    end
    local prev = l
    local node = l.suc
    i = i - 1
    while node ~= nil and i > 0 do
        prev = node
        node = node.suc
        i = i - 1
    end
    if node ~= nil then
        prev.suc = node.suc
    end
    return head
end
local function __psc_liste_change(l, p, v)
    local node = l
    local i = p or 0
    while node ~= nil and i > 0 do
        node = node.suc
        i = i - 1
    end
    if node ~= nil then
        node.val = v
    end
    return l
end

-- Construit une liste chaînée à partir d'un tableau Lua séquentiel
local function __psc_liste_from_table(t)
    local l = __psc_liste_vide()
    if type(t) ~= 'table' then return l end
    for i = 1, #t do
        l = __psc_liste_ajout_queue(l, t[i])
    end
    return l
end

-- =================================================================================================================
-- TDA Pile (Implémentation par table/tableau)
-- =================================================================================================================
local function __psc_pile_vide()
    return {_type = 'pile'}
end

local function __psc_pile_sommet(p)
    if type(p) ~= 'table' or #p == 0 then return nil end
    return p[#p]
end

local function __psc_pile_est_vide(p)
    return type(p) ~= 'table' or #p == 0
end

local function __psc_pile_empiler(p, v)
    if type(p) == 'table' then
        table.insert(p, v)
    end
end

local function __psc_pile_depiler(p)
    if type(p) == 'table' and #p > 0 then
        table.remove(p)
    end
end

-- Créer une pile à partir d'un tableau de valeurs
local function __psc_pile_from_values(t)
    local p = __psc_pile_vide()
    if type(t) == 'table' then
        for i = 1, #t do
            __psc_pile_empiler(p, t[i])
        end
    end
    return p
end

-- =================================================================================================================
-- TDA File (Implémentation par table/tableau)
-- =================================================================================================================
local function __psc_file_vide()
    return {_type = 'file'}
end

local function __psc_file_est_vide(f)
    return type(f) ~= 'table' or #f == 0
end

local function __psc_file_enfiler(f, v)
    if type(f) == 'table' then
        table.insert(f, v)
    end
end

local function __psc_file_defiler(f)
    if type(f) == 'table' and #f > 0 then
        table.remove(f, 1)
    end
end

-- Créer une file à partir d'un tableau de valeurs
local function __psc_file_from_values(t)
    local f = __psc_file_vide()
    if type(t) == 'table' then
        for i = 1, #t do
            __psc_file_enfiler(f, t[i])
        end
    end
    return f
end

-- Fonction générique pour 'tete' (supporte Liste et File)
local function __psc_generic_tete(obj)
    if __psc_is_liste(obj) then
        return __psc_liste_tete(obj)
    elseif type(obj) == 'table' then
        -- Pour une file (ou tableau), la tête est le premier élément
        return obj[1]
    end
    return nil
end

-- =================================================================================================================
-- TDA ListeSym (Liste Symétrique)
-- =================================================================================================================
local function __psc_listesym_vide()
    return { head = nil, tail = nil }
end

local function __psc_listesym_tete(l)
    return l.head
end

local function __psc_listesym_queue(l)
    return l.tail
end

local function __psc_listesym_val(l, p)
    if p then return p.val end
    return nil
end

local function __psc_listesym_suc(l, p)
    if p then return p.suc end
    return nil
end

local function __psc_listesym_prec(l, p)
    if p then return p.prec end
    return nil
end

local function __psc_listesym_fin(l, p)
    return p == nil
end

local function __psc_listesym_ajout_tete(l, v)
    local new_node = { val = v, suc = l.head, prec = nil }
    if l.head then
        l.head.prec = new_node
    else
        l.tail = new_node
    end
    l.head = new_node
end

local function __psc_listesym_suppression_tete(l)
    if l.head then
        l.head = l.head.suc
        if l.head then
            l.head.prec = nil
        else
            l.tail = nil
        end
    end
end

local function __psc_listesym_ajout_queue(l, v)
    local new_node = { val = v, suc = nil, prec = l.tail }
    if l.tail then
        l.tail.suc = new_node
    else
        l.head = new_node
    end
    l.tail = new_node
end

local function __psc_listesym_suppression_queue(l)
    if l.tail then
        l.tail = l.tail.prec
        if l.tail then
            l.tail.suc = nil
        else
            l.head = nil
        end
    end
end

local function __psc_listesym_ajout(l, p, v)
    if p == nil then
        __psc_listesym_ajout_queue(l, v)
    else
        local new_node = { val = v, suc = p, prec = p.prec }
        if p.prec then
            p.prec.suc = new_node
        else
            l.head = new_node
        end
        p.prec = new_node
    end
end

local function __psc_listesym_suppression(l, p)
    if p == nil then return end
    if p.prec then
        p.prec.suc = p.suc
    else
        l.head = p.suc
    end
    if p.suc then
        p.suc.prec = p.prec
    else
        l.tail = p.prec
    end
end

local function __psc_listesym_change(l, p, v)
    if p then p.val = v end
end

local function __psc_file_premier(f)
    if type(f) == 'table' and #f > 0 then
        return f[1]
    end
    return nil
end

-- Construit une ListeSym à partir d'un tableau Lua séquentiel
local function __psc_listesym_from_table(t)
    local l = __psc_listesym_vide()
    if type(t) ~= 'table' then return l end
    for i = 1, #t do
        __psc_listesym_ajout_queue(l, t[i])
    end
    return l
end

-- =================================================================================================================
-- TDA Table (Dictionnaire/Map: Clé -> Valeur)
-- =================================================================================================================
local function __psc_table_vide()
    return {_type = 'table', _data = {}}
end

-- Retourne l'ensemble des clés (domaine) de la table
local function __psc_table_domaine(t)
    local keys = {}
    if type(t) == 'table' and t._data then
        for k, _ in pairs(t._data) do
            table.insert(keys, k)
        end
    end
    return keys
end

-- Accès à une valeur par clé (retourne nil si la clé n'existe pas)
local function __psc_table_acces(t, cle)
    if type(t) == 'table' and t._data then
        return t._data[cle]
    end
    return nil
end

-- Ajout d'une entrée (clé, valeur) dans la table
local function __psc_table_ajout(t, cle, valeur)
    if type(t) == 'table' and t._data then
        t._data[cle] = valeur
    end
    return t
end

-- Suppression d'une entrée de la table
local function __psc_table_suppression(t, cle)
    if type(t) == 'table' and t._data then
        t._data[cle] = nil
    end
    return t
end

-- Changement de la valeur associée à une clé
local function __psc_table_change(t, cle, valeur)
    if type(t) == 'table' and t._data then
        t._data[cle] = valeur
    end
    return t
end

-- Fonction utilitaire: vérifier si un élément est dans un ensemble (table/liste)
local function __psc_ensemble_estdans(ensemble, element)
    if type(ensemble) == 'table' then
        for _, v in ipairs(ensemble) do
            if v == element then
                return true
            end
        end
    end
    return false
end

-- Créer une table à partir de paires (clé, valeur, clé, valeur, ...)
-- Utilisé pour la syntaxe Table("Alice" → "1234", "Bob" → "5678")
local function __psc_table_from_pairs(...)
    local t = __psc_table_vide()
    local pairs_list = {...}
    for i = 1, #pairs_list, 2 do
        local cle = pairs_list[i]
        local valeur = pairs_list[i + 1]
        if cle ~= nil and valeur ~= nil then
            t._data[cle] = valeur
        end
    end
    return t
end

-- =================================================================================================================
-- =================================================================================================================
-- =================================================================================================================

`;
