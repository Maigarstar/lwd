#!/usr/bin/env python3
"""
Restructure AdminDashboard.jsx:
- Split combined UK/Ireland regions into individual counties
- Add missing counties
- Update city and listing regionSlug references
- Add UAE emirates and Caribbean entries
"""

import re

FILE = "/Users/taiwoadedayo/LDW-01/src/pages/AdminDashboard.jsx"

with open(FILE, "r") as f:
    content = f.read()

lines = content.split("\n")

# ============================================================================
# HELPER: Build a region entry string (single line)
# ============================================================================
def make_region(id_, country, slug, name, priority, url_manual, url_activated, listing_count, desc, keywords, ai_summary, intent_high, intent_mid, intent_low):
    kw_str = ", ".join(f'"{k}"' for k in keywords)
    hi = ", ".join(f'"{k}"' for k in intent_high)
    mi = ", ".join(f'"{k}"' for k in intent_mid)
    lo = ", ".join(f'"{k}"' for k in intent_low)
    url_manual_str = "null" if url_manual is None else f'"{url_manual}"'
    url_activated_str = "true" if url_activated else "false"
    return f'  {{ id: "{id_}", countrySlug: "{country}", slug: "{slug}", name: "{name}", priorityLevel: "{priority}", urlEnabledManual: {url_manual_str}, urlEverActivated: {url_activated_str}, listingCount: {listing_count}, description: "{desc}", focusKeywords: [{kw_str}], aiSummary: "{ai_summary}", intentSignals: {{ high: [{hi}], mid: [{mi}], low: [{lo}] }} }},'


# ============================================================================
# STEP 1: RENAMES (simple name changes in existing entries)
# ============================================================================

# Hampshire: rename "Hampshire & New Forest" → "Hampshire", update description and focusKeywords
old_hampshire_line = [i for i, l in enumerate(lines) if 'id: "hampshire"' in l and 'countrySlug: "uk"' in l][0]
lines[old_hampshire_line] = lines[old_hampshire_line].replace(
    'name: "Hampshire & New Forest"', 'name: "Hampshire"'
).replace(
    'description: "Georgian manor houses, the ancient New Forest and Winchester Cathedral. Southern England\'s elegant heartland."',
    'description: "Georgian manor houses, Winchester Cathedral and the rolling Hampshire countryside. Southern England\'s elegant heartland."'
).replace(
    '"new forest wedding", ', ''
)

# Derbyshire: rename "Derbyshire & Peak District" → "Derbyshire"
old_derby_line = [i for i, l in enumerate(lines) if 'id: "derbyshire"' in l and 'countrySlug: "uk"' in l][0]
lines[old_derby_line] = lines[old_derby_line].replace(
    'name: "Derbyshire & Peak District"', 'name: "Derbyshire"'
).replace(
    'description: "Chatsworth House grandeur, the Peak District\'s wild moors and Buxton\'s Georgian spa town elegance."',
    'description: "Chatsworth House grandeur, the Peak District, Buxton\'s Georgian spa town elegance and the Derwent Valley\'s mills."'
)

# Edinburgh: rename "Edinburgh & Lothians" → "Edinburgh"
old_edin_line = [i for i, l in enumerate(lines) if 'id: "edinburgh"' in l and 'countrySlug: "uk"' in l][0]
lines[old_edin_line] = lines[old_edin_line].replace(
    'name: "Edinburgh & Lothians"', 'name: "Edinburgh"'
)

# Perthshire: rename "Perthshire & Tayside" → "Perthshire"
old_perth_line = [i for i, l in enumerate(lines) if 'id: "perthshire"' in l and 'countrySlug: "uk"' in l][0]
lines[old_perth_line] = lines[old_perth_line].replace(
    'name: "Perthshire & Tayside"', 'name: "Perthshire"'
)

# Aberdeenshire: rename "Aberdeenshire & Royal Deeside" → "Aberdeenshire"
old_aber_line = [i for i, l in enumerate(lines) if 'id: "aberdeenshire"' in l and 'countrySlug: "uk"' in l][0]
lines[old_aber_line] = lines[old_aber_line].replace(
    'name: "Aberdeenshire & Royal Deeside"', 'name: "Aberdeenshire"'
)

# Pembrokeshire: rename "Pembrokeshire & South Wales" → "Pembrokeshire"
old_pemb_line = [i for i, l in enumerate(lines) if 'id: "pembrokeshire"' in l and 'countrySlug: "uk"' in l][0]
lines[old_pemb_line] = lines[old_pemb_line].replace(
    'name: "Pembrokeshire & South Wales"', 'name: "Pembrokeshire"'
)

# North Wales: rename "North Wales & Snowdonia" → "North Wales"
old_nw_line = [i for i, l in enumerate(lines) if 'id: "north-wales"' in l and 'countrySlug: "uk"' in l][0]
lines[old_nw_line] = lines[old_nw_line].replace(
    'name: "North Wales & Snowdonia"', 'name: "North Wales"'
)

# Northern Ireland - Antrim: rename "Antrim & Belfast" → "Antrim", update slug
old_antrim_line = [i for i, l in enumerate(lines) if 'id: "antrim"' in l and 'countrySlug: "uk"' in l][0]
lines[old_antrim_line] = lines[old_antrim_line].replace(
    'slug: "antrim-belfast"', 'slug: "antrim"'
).replace(
    'name: "Antrim & Belfast"', 'name: "Antrim"'
)

# Northumberland: rename "Northumberland & Durham" → "Northumberland"
old_north_line = [i for i, l in enumerate(lines) if 'id: "northumberland"' in l and 'countrySlug: "uk"' in l][0]
lines[old_north_line] = lines[old_north_line].replace(
    'name: "Northumberland & Durham"', 'name: "Northumberland"'
).replace(
    'description: "Alnwick Castle, Bamburgh beach, Durham Cathedral and the wild beauty of Hadrian\'s Wall country."',
    'description: "Alnwick Castle, Bamburgh beach and the wild beauty of Hadrian\'s Wall country across Northumberland."'
)

# Warwickshire: rename "Warwickshire & West Midlands" → "Warwickshire"
old_warw_line = [i for i, l in enumerate(lines) if 'id: "warwickshire"' in l and 'countrySlug: "uk"' in l][0]
lines[old_warw_line] = lines[old_warw_line].replace(
    'name: "Warwickshire & West Midlands"', 'name: "Warwickshire"'
).replace(
    'description: "Shakespeare\'s Stratford-upon-Avon, Warwick Castle and the grand estates of the English Midlands."',
    'description: "Shakespeare\'s Stratford-upon-Avon, Warwick Castle and the grand estates of Warwickshire."'
)

# Hertfordshire: rename "Hertfordshire & Essex" → "Hertfordshire"
old_hert_line = [i for i, l in enumerate(lines) if 'id: "hertfordshire"' in l and 'countrySlug: "uk"' in l][0]
lines[old_hert_line] = lines[old_hert_line].replace(
    'name: "Hertfordshire & Essex"', 'name: "Hertfordshire"'
).replace(
    'description: "Home counties elegance — Hatfield House, the Hertfordshire countryside and Essex\'s coastal charm."',
    'description: "Home counties elegance — Hatfield House, the Hertfordshire countryside and grand country house venues."'
).replace(
    '"essex wedding venue"', ''
).replace(
    'focusKeywords: ["hertfordshire wedding venue", ],', 
    'focusKeywords: ["hertfordshire wedding venue"],'
).replace(
    ', "essex wedding venues"', ''
)

# Lancashire: rename "Lancashire & Manchester" → "Lancashire"
old_lanc_line = [i for i, l in enumerate(lines) if 'id: "lancashire"' in l and 'countrySlug: "uk"' in l][0]
lines[old_lanc_line] = lines[old_lanc_line].replace(
    'name: "Lancashire & Manchester"', 'name: "Lancashire"'
).replace(
    'description: "Manchester\'s industrial-chic conversions, the Ribble Valley\'s country houses and Lancashire\'s moorland estates."',
    'description: "The Ribble Valley\'s country houses, Lancashire\'s moorland estates and historic mill conversions."'
).replace(
    '"manchester wedding venue"', ''
).replace(
    'focusKeywords: ["lancashire wedding venue", ],', 
    'focusKeywords: ["lancashire wedding venue"],'
).replace(
    ', "manchester wedding venues"', ''
)

# Ireland renames
# Kerry: rename "Kerry & West Cork" → "Kerry"
old_kerry_line = [i for i, l in enumerate(lines) if 'id: "kerry"' in l and 'countrySlug: "ireland"' in l][0]
lines[old_kerry_line] = lines[old_kerry_line].replace(
    'name: "Kerry & West Cork"', 'name: "Kerry"'
).replace(
    'description: "The Ring of Kerry, Killarney\'s lakes, Kenmare\'s charm and West Cork\'s rugged Atlantic coastline."',
    'description: "The Ring of Kerry, Killarney\'s lakes and Kenmare\'s charm along Ireland\'s Wild Atlantic Way."'
).replace(
    '"west cork wedding", ', ''
)

# Galway: rename "Galway & Connemara" → "Galway"
old_galway_line = [i for i, l in enumerate(lines) if 'id: "galway"' in l and 'countrySlug: "ireland"' in l][0]
lines[old_galway_line] = lines[old_galway_line].replace(
    'name: "Galway & Connemara"', 'name: "Galway"'
)


# ============================================================================
# STEP 2: SPLITS — Replace one line with two (or more) lines
# ============================================================================

def find_line(search_str):
    """Find line index containing search_str."""
    for i, l in enumerate(lines):
        if search_str in l:
            return i
    raise ValueError(f"Could not find: {search_str}")


# --- Devon & Cornwall split ---
idx = find_line('id: "devon-cornwall"')
devon_line = make_region(
    "devon", "uk", "devon", "Devon", "primary", None, False, 3,
    "South Devon coast, Dartmouth, Salcombe, Exeter and Dartmoor. Dramatic clifftop venues and enchanted woodland estates.",
    ["devon wedding venue", "south devon wedding"],
    "South Devon coast leads luxury demand. Dartmouth and Salcombe anchor maritime weddings. Dartmoor dramatic.",
    ["devon wedding venue book"], ["best devon wedding venues"], ["devon wedding ideas"]
)
cornwall_line = make_region(
    "cornwall", "uk", "cornwall", "Cornwall", "primary", None, False, 3,
    "St Ives, Padstow, Falmouth and the dramatic Cornish coast. Tin mine heritage and beach ceremony paradise.",
    ["cornwall wedding venue", "cornwall beach wedding"],
    "Cornwall leads destination search in Southwest England. Beach and clifftop venues dominate. Strong summer peak.",
    ["cornwall wedding venue book"], ["best cornwall wedding venues"], ["cornwall wedding ideas"]
)
lines[idx] = devon_line + "\n" + cornwall_line

# --- Norfolk & Suffolk split ---
idx = find_line('id: "norfolk-suffolk"')
norfolk_line = make_region(
    "norfolk", "uk", "norfolk", "Norfolk", "primary", None, False, 2,
    "Norfolk Broads, Burnham Market, Holkham and Norwich Cathedral. Big skies and medieval wool churches.",
    ["norfolk wedding venue"],
    "Barn conversion boom. Burnham Market luxury cluster. Sandringham association drives prestige. Quieter refined market.",
    ["norfolk wedding venue book"], ["best norfolk wedding venues"], ["norfolk wedding ideas"]
)
suffolk_line = make_region(
    "suffolk", "uk", "suffolk", "Suffolk", "secondary", None, False, 1,
    "Aldeburgh, Southwold, the Heritage Coast and Snape Maltings. Refined coastal charm and gentle countryside.",
    ["suffolk wedding venue"],
    "Heritage Coast beauty. Snape Maltings concert hall venue unique. Refined and understated market.",
    [], ["best suffolk wedding venues"], ["suffolk wedding ideas"]
)
lines[idx] = norfolk_line + "\n" + suffolk_line

# --- Somerset & Bath split ---
idx = find_line('id: "somerset-bath"')
somerset_line = make_region(
    "somerset", "uk", "somerset", "Somerset", "secondary", None, False, 2,
    "Glastonbury, Exmoor, Bruton and Babington House. Mystical landscapes and creative-luxury country estates.",
    ["somerset wedding venue"],
    "Babington House Soho House effect. Bruton creative-luxury emerging. Glastonbury mystique. Growing market.",
    [], ["best somerset wedding venues"], ["somerset wedding ideas"]
)
bath_line = make_region(
    "bath-region", "uk", "bath", "Bath", "primary", None, False, 2,
    "Georgian crescents, Roman baths, the Royal Crescent and Assembly Rooms. England's most beautiful city.",
    ["bath wedding venue", "bath spa wedding"],
    "Georgian architecture unmatched. Assembly Rooms and Royal Crescent. Spa integration unique selling point.",
    ["bath wedding venue book"], ["best bath wedding venues"], ["bath wedding ideas"]
)
lines[idx] = somerset_line + "\n" + bath_line

# --- Wiltshire & Dorset split ---
idx = find_line('id: "wiltshire-dorset"')
wiltshire_line = make_region(
    "wiltshire", "uk", "wiltshire", "Wiltshire", "secondary", None, False, 2,
    "Castle Combe, Salisbury Cathedral and Bowood House. Picture-perfect villages and ancient grandeur.",
    ["wiltshire wedding venue"],
    "Castle Combe iconic village. Salisbury Cathedral ceremonies. Bowood House estate. Quieter luxury market.",
    [], ["best wiltshire wedding venues"], ["wiltshire wedding ideas"]
)
dorset_line = make_region(
    "dorset", "uk", "dorset", "Dorset", "secondary", None, False, 2,
    "Jurassic Coast, Lulworth Cove, Bournemouth and Corfe Castle. Dramatic coastal geology and harbour charm.",
    ["dorset wedding venue"],
    "Jurassic Coast outdoor weddings growing. Lulworth Cove dramatic ceremony location. Corfe Castle picturesque.",
    [], ["best dorset wedding venues"], ["dorset wedding ideas"]
)
lines[idx] = wiltshire_line + "\n" + dorset_line

# --- Surrey & Berkshire split ---
idx = find_line('id: "surrey-berkshire"')
surrey_line = make_region(
    "surrey", "uk", "surrey", "Surrey", "secondary", None, False, 2,
    "Loseley Park, Surrey Hills AONB and grand estates within easy reach of London. Home counties elegance.",
    ["surrey wedding venue"],
    "London commuter belt convenience. Grand estate venues. Surrey Hills scenic beauty. High listing quality.",
    [], ["best surrey wedding venues"], ["surrey wedding ideas"]
)
berkshire_line = make_region(
    "berkshire", "uk", "berkshire", "Berkshire", "secondary", None, False, 2,
    "Cliveden, Windsor Castle and Coworth Park. Royal Berkshire grandeur and Thames-side celebrations.",
    ["berkshire wedding venue"],
    "Cliveden and Coworth Park anchor ultra-luxury. Windsor Castle association. Royal county prestige.",
    ["berkshire wedding venue book"], ["best berkshire wedding venues"], ["berkshire wedding ideas"]
)
lines[idx] = surrey_line + "\n" + berkshire_line

# --- Ireland: Dublin & Wicklow split ---
idx = find_line('id: "dublin-wicklow"')
dublin_line = make_region(
    "dublin", "ireland", "dublin", "Dublin", "primary", None, True, 2,
    "Georgian Dublin's literary elegance, Dublin Castle's State Apartments and the capital's grand hotel tradition.",
    ["dublin wedding venue", "dublin castle wedding"],
    "Ireland's urban luxury hub. Georgian hotel and castle venues dominate. Year-round demand. Strongest market.",
    ["dublin wedding venue book"], ["best dublin wedding venues"], ["dublin wedding ideas"]
)
wicklow_line = make_region(
    "wicklow", "ireland", "wicklow", "Wicklow", "primary", None, False, 2,
    "Powerscourt's Palladian grandeur, the Garden of Ireland's mountains and Glendalough's ancient monastic site.",
    ["wicklow wedding venue", "powerscourt wedding"],
    "Powerscourt Estate iconic. Wicklow mountains proximity to capital. Garden of Ireland beauty.",
    ["powerscourt wedding hire"], ["best wicklow wedding venues"], ["wicklow wedding ideas"]
)
lines[idx] = dublin_line + "\n" + wicklow_line

# --- Ireland: Clare & Limerick split ---
idx = find_line('id: "clare-limerick"')
clare_line = make_region(
    "clare", "ireland", "clare", "Clare", "primary", None, False, 1,
    "The Cliffs of Moher, the Burren's lunar landscape and Dromoland Castle's medieval splendour.",
    ["clare wedding venue", "cliffs of moher wedding"],
    "Cliffs of Moher ceremonies iconic. Dromoland Castle anchors luxury. Burren landscape unique. Growing appeal.",
    ["dromoland castle wedding book"], ["best clare wedding venues"], ["clare wedding ideas"]
)
limerick_line = make_region(
    "limerick", "ireland", "limerick", "Limerick", "secondary", None, False, 1,
    "Limerick's castle-studded Shannon estuary, Adare Manor and the medieval King John's Castle.",
    ["limerick wedding venue", "adare manor wedding"],
    "Adare Manor drives luxury demand. Shannon estuary scenic. King John's Castle historic. Growing market.",
    ["adare manor wedding book"], ["best limerick wedding venues"], ["limerick wedding ideas"]
)
lines[idx] = clare_line + "\n" + limerick_line

# --- Ireland: Tipperary & Kilkenny split ---
idx = find_line('id: "tipperary-kilkenny"')
tipperary_line = make_region(
    "tipperary", "ireland", "tipperary", "Tipperary", "secondary", None, False, 1,
    "The Rock of Cashel, Ireland's fertile Golden Vale countryside and historic abbey ruins.",
    ["tipperary wedding venue"],
    "Rock of Cashel dramatic ceremony location. Central Ireland location. Golden Vale countryside charm.",
    [], ["best tipperary wedding venues"], ["tipperary wedding ideas"]
)
kilkenny_line = make_region(
    "kilkenny", "ireland", "kilkenny", "Kilkenny", "secondary", None, False, 1,
    "Medieval Kilkenny Castle, cobblestone lanes and the medieval mile of Ireland's most charming city.",
    ["kilkenny wedding venue", "kilkenny castle wedding"],
    "Kilkenny Castle and medieval town drive demand. Cobblestone charm. Central location accessible.",
    ["kilkenny castle wedding"], ["best kilkenny wedding venues"], ["kilkenny wedding ideas"]
)
lines[idx] = tipperary_line + "\n" + kilkenny_line

# --- Ireland: Wexford & Waterford split ---
idx = find_line('id: "wexford-waterford"')
wexford_line = make_region(
    "wexford", "ireland", "wexford", "Wexford", "secondary", None, False, 1,
    "Wexford's medieval lanes, Hook Head peninsula and Ireland's Sunny Southeast coastline.",
    ["wexford wedding venue"],
    "Southeast coast sunny reputation. Medieval town charm. Hook Head lighthouse dramatic.",
    [], ["best wexford wedding venues"], ["wexford wedding ideas"]
)
waterford_line = make_region(
    "waterford", "ireland", "waterford", "Waterford", "secondary", None, False, 1,
    "Waterford's Viking heritage, crystal craftsmanship and Waterford Castle's island setting.",
    ["waterford wedding venue"],
    "Waterford Castle island venue unique. Viking heritage city. Crystal craftsmanship. Growing niche.",
    [], ["waterford wedding venue"], ["waterford wedding ideas"]
)
lines[idx] = wexford_line + "\n" + waterford_line

# --- Ireland: Mayo & Sligo split ---
idx = find_line('id: "mayo-sligo"')
mayo_line = make_region(
    "mayo", "ireland", "mayo", "Mayo", "secondary", None, False, 1,
    "Ashford Castle's medieval splendour, the wild Atlantic beaches and Croagh Patrick pilgrimage mountain.",
    ["mayo wedding venue", "ashford castle wedding"],
    "Ashford Castle single-handedly drives region. One of Ireland's most prestigious wedding venues globally.",
    ["ashford castle wedding book"], ["best mayo wedding venues"], ["mayo wedding ideas"]
)
sligo_line = make_region(
    "sligo", "ireland", "sligo", "Sligo", "secondary", None, False, 1,
    "Yeats country, Ben Bulben mountain and the surfing beaches of Strandhill and Mullaghmore.",
    ["sligo wedding venue"],
    "Yeats literary heritage unique. Ben Bulben dramatic backdrop. Strandhill coastal charm. Niche market.",
    [], ["sligo wedding venue"], ["sligo wedding ideas"]
)
lines[idx] = mayo_line + "\n" + sligo_line


# ============================================================================
# STEP 3: ADD NEW ENTRIES after specific sections
# ============================================================================

# --- Add Durham after Northumberland ---
durham_entry = make_region(
    "durham", "uk", "durham", "Durham", "secondary", None, False, 1,
    "Durham Cathedral, the castle, Lumley Castle and the historic university city on the River Wear.",
    ["durham wedding venue"],
    "Durham Cathedral ceremonies prestigious. Lumley Castle anchor. Historic university city. Smaller northern market.",
    [], ["best durham wedding venues"], ["durham wedding ideas"]
)
idx = find_line('id: "northumberland"')
lines[idx] = lines[idx] + "\n" + durham_entry

# --- Add West Midlands after Warwickshire ---
west_mids_entry = make_region(
    "west-midlands", "uk", "west-midlands", "West Midlands", "secondary", None, False, 2,
    "Birmingham's Edgbaston elegance, Aston Hall and the industrial heritage of England's second city.",
    ["birmingham wedding venue"],
    "Birmingham urban weddings growing. Edgbaston venue cluster. Aston Hall grandeur. Industrial-chic conversions.",
    [], ["best birmingham wedding venues"], ["birmingham wedding ideas"]
)
idx = find_line('id: "warwickshire"')
lines[idx] = lines[idx] + "\n" + west_mids_entry

# --- Add Essex after Hertfordshire ---
essex_entry = make_region(
    "essex", "uk", "essex", "Essex", "secondary", None, False, 2,
    "Hedingham Castle, Layer Marney Tower and coastal marshes. Historic fortifications and Thames estuary charm.",
    ["essex wedding venue"],
    "Castle and tower venues distinctive. Layer Marney Tower unique. TOWIE effect drives awareness. Volume market.",
    [], ["best essex wedding venues"], ["essex wedding ideas"]
)
idx = find_line('id: "hertfordshire"')
lines[idx] = lines[idx] + "\n" + essex_entry

# --- Add Greater Manchester after Lancashire ---
manchester_entry = make_region(
    "manchester", "uk", "manchester", "Greater Manchester", "secondary", None, False, 2,
    "Industrial-chic conversions, The Midland Hotel and the creative energy of England's northern powerhouse.",
    ["manchester wedding venue"],
    "Manchester urban weddings growing fast. Industrial-chic venue conversions trending. Northern powerhouse.",
    [], ["best manchester wedding venues"], ["manchester wedding ideas"]
)
idx = find_line('id: "lancashire"')
lines[idx] = lines[idx] + "\n" + manchester_entry

# --- Add East/West Lothian after Edinburgh ---
east_lothian = make_region(
    "east-lothian", "uk", "east-lothian", "East Lothian", "secondary", None, False, 1,
    "Golden sandy beaches, golf links, Tantallon Castle and Scotland's sunniest county east of Edinburgh.",
    ["east lothian wedding venue"],
    "Edinburgh-adjacent appeal. Tantallon Castle dramatic. Golf links venues. Quieter alternative to city.",
    [], ["east lothian wedding venue"], ["east lothian wedding ideas"]
)
west_lothian = make_region(
    "west-lothian", "uk", "west-lothian", "West Lothian", "secondary", None, False, 1,
    "Hopetoun House, Linlithgow Palace birthplace of Mary Queen of Scots and the Pentland Hills.",
    ["west lothian wedding venue"],
    "Hopetoun House anchors luxury. Linlithgow Palace historic. Edinburgh proximity. Smaller market.",
    [], ["west lothian wedding venue"], ["west lothian wedding ideas"]
)
idx = find_line('id: "edinburgh"')
lines[idx] = lines[idx] + "\n" + east_lothian + "\n" + west_lothian

# --- Add new Scotland counties: Glasgow, Fife, Angus, Argyll, Ayrshire, Dumfriesshire ---
# Insert after aberdeenshire (the last existing Scotland entry) and before Wales section
new_scotland = []
new_scotland.append(make_region(
    "glasgow", "uk", "glasgow", "Glasgow", "secondary", None, False, 2,
    "Scotland's vibrant cultural capital — Art Nouveau architecture, Kelvingrove Gallery and the Clyde waterfront.",
    ["glasgow wedding venue"],
    "Scotland's largest city. Art Nouveau venues unique. Kelvingrove Gallery. Industrial-chic and hotel market.",
    [], ["best glasgow wedding venues"], ["glasgow wedding ideas"]
))
new_scotland.append(make_region(
    "fife", "uk", "fife", "Fife", "secondary", None, False, 1,
    "St Andrews' ancient university town, the East Neuk fishing villages and the Kingdom of Fife's coastal charm.",
    ["fife wedding venue", "st andrews wedding"],
    "St Andrews university town prestige. Old Course Hotel anchor. East Neuk fishing village charm.",
    [], ["fife wedding venue"], ["st andrews wedding ideas"]
))
new_scotland.append(make_region(
    "angus", "uk", "angus", "Angus", "secondary", None, False, 1,
    "Glamis Castle, the Angus Glens and the coastal cliffs of Arbroath. Scottish heritage and dramatic landscapes.",
    ["angus wedding venue"],
    "Glamis Castle ceremonies unique. Angus Glens scenic. Arbroath coastal. Niche but distinctive market.",
    [], ["angus wedding venue"], ["angus wedding ideas"]
))
new_scotland.append(make_region(
    "argyll", "uk", "argyll", "Argyll", "secondary", None, False, 1,
    "The Isle of Mull, Oban's seafood capital and the dramatic sea lochs of Scotland's Atlantic coast.",
    ["argyll wedding venue"],
    "Island and sea loch ceremonies. Oban gateway to the isles. Remote luxury. Very niche.",
    [], ["argyll wedding venue"], ["argyll wedding ideas"]
))
new_scotland.append(make_region(
    "ayrshire", "uk", "ayrshire", "Ayrshire", "secondary", None, False, 1,
    "Burns country, Turnberry resort and the Ayrshire coast with views to Arran and Ailsa Craig.",
    ["ayrshire wedding venue"],
    "Turnberry resort anchor. Burns heritage. Coastal views to Arran. Golf-wedding crossover.",
    [], ["ayrshire wedding venue"], ["ayrshire wedding ideas"]
))
new_scotland.append(make_region(
    "dumfriesshire", "uk", "dumfriesshire", "Dumfriesshire", "secondary", None, False, 1,
    "Gretna Green's elopement heritage, Drumlanrig Castle and the rolling Southern Uplands of Scotland.",
    ["dumfriesshire wedding venue"],
    "Gretna Green elopement tradition iconic. Drumlanrig Castle grandeur. Southern Scotland gateway.",
    [], ["dumfriesshire wedding venue"], ["dumfriesshire wedding ideas"]
))

idx = find_line('id: "aberdeenshire"')
lines[idx] = lines[idx] + "\n" + "\n".join(new_scotland)

# --- Add new Wales counties after existing Wales entries ---
new_wales = []
new_wales.append(make_region(
    "carmarthenshire", "uk", "carmarthenshire", "Carmarthenshire", "secondary", None, False, 1,
    "The Garden of Wales — Aberglasney Gardens, the Tywi Valley and Dylan Thomas's Laugharne.",
    ["carmarthenshire wedding venue"],
    "Garden of Wales positioning. Aberglasney unique. Dylan Thomas literary heritage. Quiet rural luxury.",
    [], ["carmarthenshire wedding venue"], ["carmarthenshire wedding ideas"]
))
new_wales.append(make_region(
    "powys", "uk", "powys", "Powys", "secondary", None, False, 1,
    "The Brecon Beacons, the Elan Valley lakes and the Welsh Marches' timber-framed border country.",
    ["powys wedding venue"],
    "Brecon Beacons dramatic backdrop. Rural retreat weddings. Welsh Marches border charm. Very niche.",
    [], ["powys wedding venue"], ["powys wedding ideas"]
))
new_wales.append(make_region(
    "cardiff", "uk", "cardiff", "Cardiff", "secondary", None, False, 1,
    "Cardiff Castle, the Millennium Centre and the vibrant Bay waterfront of the Welsh capital.",
    ["cardiff wedding venue"],
    "Welsh capital urban luxury. Cardiff Castle ceremonies. Bay waterfront development. Growing market.",
    [], ["best cardiff wedding venues"], ["cardiff wedding ideas"]
))

# Find "north-wales" line (last wales entry before NI)
idx = find_line('id: "north-wales"')
lines[idx] = lines[idx] + "\n" + "\n".join(new_wales)

# --- Add Cork after Kerry ---
cork_entry = make_region(
    "cork", "ireland", "cork", "Cork", "primary", None, False, 2,
    "West Cork's rugged Atlantic coastline, Kinsale's gourmet harbour and the English Market's foodie heritage.",
    ["cork wedding venue", "west cork wedding"],
    "West Cork wild Atlantic beauty. Kinsale harbour charm. English Market foodie culture. Strong US-Irish market.",
    ["cork wedding venue book"], ["best cork wedding venues"], ["cork wedding ideas"]
)
idx = find_line('id: "kerry"')
lines[idx] = lines[idx] + "\n" + cork_entry


# ============================================================================
# STEP 4: ADD MISSING ENGLAND COUNTIES
# ============================================================================
# Insert before the Scotland section comment
missing_england = []
missing_england.append(make_region(
    "gloucestershire", "uk", "gloucestershire", "Gloucestershire", "secondary", None, False, 2,
    "Forest of Dean, the Severn Valley and Cheltenham's Regency elegance. Gateway to the Cotswolds.",
    ["gloucestershire wedding venue"],
    "Forest of Dean woodland venues. Cheltenham Regency architecture. Cotswolds gateway. Growing market.",
    [], ["best gloucestershire wedding venues"], ["gloucestershire wedding ideas"]
))
missing_england.append(make_region(
    "cambridgeshire", "uk", "cambridgeshire", "Cambridgeshire", "secondary", None, False, 2,
    "Cambridge's ancient colleges, the Backs river meadows and Ely Cathedral's fenland grandeur.",
    ["cambridgeshire wedding venue", "cambridge wedding"],
    "Cambridge college venues unique. Ely Cathedral prestigious. Fenland country house market. Academic prestige.",
    [], ["best cambridgeshire wedding venues"], ["cambridge wedding ideas"]
))
missing_england.append(make_region(
    "lincolnshire", "uk", "lincolnshire", "Lincolnshire", "secondary", None, False, 1,
    "Lincoln Cathedral, the Wolds' rolling chalk hills and the historic market towns of rural England.",
    ["lincolnshire wedding venue"],
    "Lincoln Cathedral anchor. Wolds countryside. Rural estate venues. Quieter traditional market.",
    [], ["lincolnshire wedding venue"], ["lincolnshire wedding ideas"]
))
missing_england.append(make_region(
    "nottinghamshire", "uk", "nottinghamshire", "Nottinghamshire", "secondary", None, False, 2,
    "Nottingham Castle, Sherwood Forest's ancient oaks and the grand ducal estates of the Dukeries.",
    ["nottinghamshire wedding venue"],
    "Robin Hood heritage marketing. Nottingham Castle redevelopment. Clumber Park and Thoresby. Midlands market.",
    [], ["best nottinghamshire wedding venues"], ["nottinghamshire wedding ideas"]
))
missing_england.append(make_region(
    "leicestershire", "uk", "leicestershire", "Leicestershire", "secondary", None, False, 1,
    "Belvoir Castle, Bradgate Park and the hunting shires of the English Midlands.",
    ["leicestershire wedding venue"],
    "Belvoir Castle grandeur. Hunting shire heritage. Midlands accessibility. Traditional estate market.",
    [], ["leicestershire wedding venue"], ["leicestershire wedding ideas"]
))
missing_england.append(make_region(
    "shropshire", "uk", "shropshire", "Shropshire", "secondary", None, False, 1,
    "Ludlow's medieval castle town, the Ironbridge Gorge and the rolling Shropshire Hills.",
    ["shropshire wedding venue"],
    "Ludlow foodie reputation. Ironbridge industrial heritage. Shropshire Hills AONB. Welsh Marches charm.",
    [], ["shropshire wedding venue"], ["shropshire wedding ideas"]
))
missing_england.append(make_region(
    "worcestershire", "uk", "worcestershire", "Worcestershire", "secondary", None, False, 1,
    "The Malvern Hills, Worcester Cathedral and the fruit orchards of the Vale of Evesham.",
    ["worcestershire wedding venue"],
    "Malvern Hills scenic backdrop. Worcester Cathedral ceremonies. Elgar country heritage. Rural charm.",
    [], ["worcestershire wedding venue"], ["worcestershire wedding ideas"]
))
missing_england.append(make_region(
    "herefordshire", "uk", "herefordshire", "Herefordshire", "secondary", None, False, 1,
    "The Black Mountains, Hereford Cathedral's Mappa Mundi and cider-apple orchards along the River Wye.",
    ["herefordshire wedding venue"],
    "Black Mountains dramatic. River Wye beauty. Cider heritage. Very rural luxury niche.",
    [], ["herefordshire wedding venue"], ["herefordshire wedding ideas"]
))
missing_england.append(make_region(
    "staffordshire", "uk", "staffordshire", "Staffordshire", "secondary", None, False, 1,
    "Alton Towers estate, Shugborough Hall and the Staffordshire Moorlands' heather-clad peaks.",
    ["staffordshire wedding venue"],
    "Alton Towers estate unique venue. Shugborough Hall grandeur. Moorlands scenic. Midlands market.",
    [], ["staffordshire wedding venue"], ["staffordshire wedding ideas"]
))
missing_england.append(make_region(
    "northamptonshire", "uk", "northamptonshire", "Northamptonshire", "secondary", None, False, 1,
    "Althorp House, the Spires of Northampton and the grand estates of the Shires.",
    ["northamptonshire wedding venue"],
    "Althorp House (Spencer family) prestigious. Grand estate market. Central England accessibility.",
    [], ["northamptonshire wedding venue"], ["northamptonshire wedding ideas"]
))
missing_england.append(make_region(
    "bedfordshire", "uk", "bedfordshire", "Bedfordshire", "secondary", None, False, 1,
    "Woburn Abbey, Luton Hoo and the Chiltern Hills' beechwood countryside north of London.",
    ["bedfordshire wedding venue"],
    "Woburn Abbey anchor. Luton Hoo luxury. London accessible. Chiltern Hills scenic.",
    [], ["bedfordshire wedding venue"], ["bedfordshire wedding ideas"]
))
missing_england.append(make_region(
    "isle-of-wight", "uk", "isle-of-wight", "Isle of Wight", "secondary", None, False, 1,
    "Queen Victoria's Osborne House, Cowes sailing week and the island's fossil-rich coastline.",
    ["isle of wight wedding venue"],
    "Osborne House royal association. Island exclusivity. Cowes sailing heritage. Boutique niche.",
    [], ["isle of wight wedding venue"], ["isle of wight wedding ideas"]
))
missing_england.append(make_region(
    "bristol", "uk", "bristol", "Bristol", "secondary", None, False, 2,
    "Clifton Suspension Bridge, the harbourside and Brunel's SS Great Britain. Creative urban energy.",
    ["bristol wedding venue"],
    "Creative-industrial venue conversions. Clifton Village elegance. Harbourside development. Growing urban market.",
    [], ["best bristol wedding venues"], ["bristol wedding ideas"]
))
missing_england.append(make_region(
    "merseyside", "uk", "merseyside", "Merseyside", "secondary", None, False, 1,
    "Liverpool's Albert Dock, the Liver Building and the cultural renaissance of England's maritime city.",
    ["liverpool wedding venue"],
    "Albert Dock and waterfront venues. Beatles heritage tourism. Cultural capital. Growing market.",
    [], ["best liverpool wedding venues"], ["liverpool wedding ideas"]
))
missing_england.append(make_region(
    "cumbria", "uk", "cumbria", "Cumbria", "secondary", None, False, 1,
    "The Lake District's romantic lakeside settings, Carlisle Castle and the Eden Valley's pastoral beauty.",
    ["cumbria wedding venue"],
    "Lake District overlap. Romantic lakeside venues. Carlisle Castle anchor. Intimate celebrations.",
    [], ["cumbria wedding venue"], ["cumbria wedding ideas"]
))
missing_england.append(make_region(
    "rutland", "uk", "rutland", "Rutland", "secondary", None, False, 1,
    "England's smallest county — Rutland Water, the market town of Oakham and unspoilt ironstone villages.",
    ["rutland wedding venue"],
    "England's smallest county. Exclusive and intimate. Rutland Water scenic. Very niche boutique market.",
    [], ["rutland wedding venue"], ["rutland wedding ideas"]
))

# Insert before "// ── UK — Scotland" line
scotland_comment_idx = None
for i, l in enumerate(lines):
    if "// ── UK — Scotland ──" in l:
        scotland_comment_idx = i
        break

if scotland_comment_idx:
    insert_str = "\n".join(missing_england) + "\n"
    lines[scotland_comment_idx] = insert_str + lines[scotland_comment_idx]


# ============================================================================
# STEP 5: ADD UAE EMIRATES
# ============================================================================
new_uae = []
new_uae.append(make_region(
    "ajman", "uae", "ajman", "Ajman", "secondary", None, False, 0,
    "The smallest emirate — traditional dhow harbour, pearl diving heritage and emerging boutique hospitality.",
    ["ajman wedding venue"],
    "Smallest emirate. Emerging boutique market. Traditional heritage. Very early stage.",
    [], ["ajman wedding venue"], ["ajman wedding ideas"]
))
new_uae.append(make_region(
    "fujairah", "uae", "fujairah", "Fujairah", "secondary", None, False, 1,
    "The UAE's east coast — rugged Hajar Mountains, Indian Ocean beaches and Al Bidyah's ancient mosque.",
    ["fujairah wedding venue"],
    "East coast alternative. Mountain and beach dual appeal. Emerging resort development.",
    [], ["fujairah wedding venue"], ["fujairah wedding ideas"]
))
new_uae.append(make_region(
    "ras-al-khaimah", "uae", "ras-al-khaimah", "Ras Al Khaimah", "secondary", None, False, 1,
    "Desert dunes, the Hajar mountain zip-line and luxury resort development on the UAE's northern coast.",
    ["ras al khaimah wedding venue"],
    "Adventure-luxury positioning. Jebel Jais mountain experiences. Growing resort supply. Value alternative to Dubai.",
    [], ["ras al khaimah wedding venue"], ["ras al khaimah wedding ideas"]
))
new_uae.append(make_region(
    "sharjah", "uae", "sharjah", "Sharjah", "secondary", None, False, 1,
    "The UAE's cultural capital — Islamic art museums, heritage quarter and the Blue Souk's architectural grandeur.",
    ["sharjah wedding venue"],
    "Cultural capital positioning. Museum and heritage venues. Conservative but growing luxury hospitality.",
    [], ["sharjah wedding venue"], ["sharjah wedding ideas"]
))
new_uae.append(make_region(
    "umm-al-quwain", "uae", "umm-al-quwain", "Umm Al-Quwain", "secondary", None, False, 0,
    "The quietest emirate — mangrove lagoons, flamingo watching and untouched coastal tranquillity.",
    ["umm al quwain wedding venue"],
    "Quietest emirate. Mangrove and lagoon settings unique. Very early stage. Niche eco-luxury potential.",
    [], ["umm al quwain wedding venue"], ["umm al quwain wedding ideas"]
))

# Insert after abu-dhabi line
idx = find_line('id: "abu-dhabi"')
lines[idx] = lines[idx] + "\n" + "\n".join(new_uae)


# ============================================================================
# STEP 6: ADD CARIBBEAN ENTRIES
# ============================================================================
bvi_entry = make_region(
    "bvi", "caribbean", "british-virgin-islands", "British Virgin Islands", "secondary", None, False, 1,
    "Private island paradise — Necker Island, the Baths of Virgin Gorda and pristine Caribbean sailing waters.",
    ["bvi wedding venue", "british virgin islands wedding"],
    "Necker Island ultra-exclusive. Private island buyout model. Sailing yacht ceremonies. Celebrity destination.",
    ["necker island wedding"], ["bvi wedding venue"], ["british virgin islands wedding ideas"]
)
martinique_entry = make_region(
    "martinique", "caribbean", "martinique", "Martinique", "secondary", None, False, 0,
    "French Caribbean elegance — volcanic peaks, rum distilleries and Creole plantation house grandeur.",
    ["martinique wedding venue"],
    "French Caribbean distinction. Plantation house venues. Volcanic landscape dramatic. Very early market.",
    [], ["martinique wedding venue"], ["martinique wedding ideas"]
)

# Insert after antigua line
idx = find_line('id: "antigua"')
lines[idx] = lines[idx] + "\n" + bvi_entry + "\n" + martinique_entry


# ============================================================================
# STEP 7: UPDATE CITY REFERENCES (regionSlug changes)
# ============================================================================
# Devon/Cornwall cities
for i, l in enumerate(lines):
    # St Ives → cornwall
    if 'id: "st-ives"' in l and 'regionSlug: "devon-cornwall"' in l:
        lines[i] = l.replace('regionSlug: "devon-cornwall"', 'regionSlug: "cornwall"')
    # Padstow → cornwall
    if 'id: "padstow"' in l and 'regionSlug: "devon-cornwall"' in l:
        lines[i] = l.replace('regionSlug: "devon-cornwall"', 'regionSlug: "cornwall"')
    # Falmouth → cornwall
    if 'id: "falmouth"' in l and 'regionSlug: "devon-cornwall"' in l:
        lines[i] = l.replace('regionSlug: "devon-cornwall"', 'regionSlug: "cornwall"')
    # Dartmouth → devon
    if 'id: "dartmouth"' in l and 'regionSlug: "devon-cornwall"' in l:
        lines[i] = l.replace('regionSlug: "devon-cornwall"', 'regionSlug: "devon"')
    # Salcombe → devon
    if 'id: "salcombe"' in l and 'regionSlug: "devon-cornwall"' in l:
        lines[i] = l.replace('regionSlug: "devon-cornwall"', 'regionSlug: "devon"')

# Norfolk/Suffolk cities
for i, l in enumerate(lines):
    # Burnham Market → norfolk
    if 'id: "burnham-market"' in l and 'regionSlug: "norfolk-suffolk"' in l:
        lines[i] = l.replace('regionSlug: "norfolk-suffolk"', 'regionSlug: "norfolk"')
    # Norwich → norfolk
    if 'id: "norwich"' in l and 'regionSlug: "norfolk-suffolk"' in l:
        lines[i] = l.replace('regionSlug: "norfolk-suffolk"', 'regionSlug: "norfolk"')
    # Aldeburgh → suffolk
    if 'id: "aldeburgh-southwold"' in l and 'regionSlug: "norfolk-suffolk"' in l:
        lines[i] = l.replace('regionSlug: "norfolk-suffolk"', 'regionSlug: "suffolk"')

# Somerset/Bath cities
for i, l in enumerate(lines):
    # Bath → bath-region
    if 'id: "bath"' in l and 'regionSlug: "somerset-bath"' in l:
        lines[i] = l.replace('regionSlug: "somerset-bath"', 'regionSlug: "bath-region"')
    # Bruton → somerset
    if 'id: "bruton"' in l and 'regionSlug: "somerset-bath"' in l:
        lines[i] = l.replace('regionSlug: "somerset-bath"', 'regionSlug: "somerset"')

# Dublin/Wicklow cities
for i, l in enumerate(lines):
    # Dublin city → dublin
    if 'id: "dublin-city"' in l and 'regionSlug: "dublin-wicklow"' in l:
        lines[i] = l.replace('regionSlug: "dublin-wicklow"', 'regionSlug: "dublin"')
    # Powerscourt → wicklow
    if 'id: "powerscourt"' in l and 'regionSlug: "dublin-wicklow"' in l:
        lines[i] = l.replace('regionSlug: "dublin-wicklow"', 'regionSlug: "wicklow"')

# Clare/Limerick cities
for i, l in enumerate(lines):
    # Doolin → clare
    if 'id: "doolin"' in l and 'regionSlug: "clare-limerick"' in l:
        lines[i] = l.replace('regionSlug: "clare-limerick"', 'regionSlug: "clare"')


# ============================================================================
# STEP 8: UPDATE LISTING REFERENCES (MOCK_LISTINGS regionSlug changes)
# ============================================================================
for i, l in enumerate(lines):
    # Coworth Park → berkshire
    if 'name: "Coworth Park"' in l and 'regionSlug: "surrey-berkshire"' in l:
        lines[i] = l.replace('regionSlug: "surrey-berkshire"', 'regionSlug: "berkshire"')
    # Grand Pavilion → surrey
    if 'name: "The Grand Pavilion"' in l and 'regionSlug: "surrey-berkshire"' in l:
        lines[i] = l.replace('regionSlug: "surrey-berkshire"', 'regionSlug: "surrey"')


# ============================================================================
# STEP 9: UPDATE CITY SECTION COMMENTS
# ============================================================================
for i, l in enumerate(lines):
    if "// ── UK — Devon & Cornwall" in l:
        lines[i] = l.replace("UK — Devon & Cornwall", "UK — Devon & Cornwall (split)")
    if "// ── UK — Norfolk & Suffolk" in l:
        lines[i] = l.replace("UK — Norfolk & Suffolk", "UK — Norfolk & Suffolk (split)")
    if "// ── UK — Somerset & Bath" in l:
        lines[i] = l.replace("UK — Somerset & Bath", "UK — Somerset & Bath (split)")
    if "// ── UK — Hampshire & New Forest" in l:
        lines[i] = l.replace("UK — Hampshire & New Forest", "UK — Hampshire")


# ============================================================================
# WRITE BACK
# ============================================================================
output = "\n".join(lines)
with open(FILE, "w") as f:
    f.write(output)

print("SUCCESS: All region restructuring complete.")
print(f"File written: {FILE}")
