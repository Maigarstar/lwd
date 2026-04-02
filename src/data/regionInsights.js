// ─── src/data/regionInsights.js ───────────────────────────────────────────────
// Region coordinates + editorial insight data for the AI map experience.
// Used by MapSection for fly-to targeting, insight cards, and zone circles.
//
// Keys are region slugs (must match the slugs used in listings + CountrySearchBar).

export const REGION_INSIGHTS = {
  // ── Italy ──────────────────────────────────────────────────────────────────
  "tuscany":           { lat: 43.4,  lng: 11.2,  zoom: 9,  season: "Apr–Oct",       vibe: "Rustic vineyard romance",       highlight: "Chianti & Val d'Orcia" },
  "amalfi-coast":      { lat: 40.65, lng: 14.6,  zoom: 11, season: "May–Jun, Sep",  vibe: "Coastal cliff drama",           highlight: "Positano & Ravello" },
  "lake-como":         { lat: 46.0,  lng: 9.25,  zoom: 11, season: "May–Sep",       vibe: "Alpine lake elegance",          highlight: "Bellagio & Varenna" },
  "venice":            { lat: 45.44, lng: 12.33, zoom: 12, season: "Apr–Jun, Sep–Oct", vibe: "Baroque canal romance",     highlight: "Grand Canal & Murano" },
  "puglia":            { lat: 40.5,  lng: 17.0,  zoom: 9,  season: "May–Oct",       vibe: "Sun-bleached trulli estates",   highlight: "Alberobello & Ostuni" },
  "sicily":            { lat: 37.6,  lng: 14.0,  zoom: 8,  season: "Apr–Oct",       vibe: "Mediterranean splendour",       highlight: "Taormina & Palermo" },
  "rome":              { lat: 41.9,  lng: 12.5,  zoom: 11, season: "Apr–Jun, Sep–Oct", vibe: "Imperial grandeur",         highlight: "Trastevere & Villa Borghese" },
  "piedmont":          { lat: 44.8,  lng: 7.9,   zoom: 9,  season: "May–Oct",       vibe: "Barolo wine country",           highlight: "Langhe & Monferrato" },
  "umbria":            { lat: 42.9,  lng: 12.7,  zoom: 9,  season: "May–Oct",       vibe: "Mystical hilltop villages",     highlight: "Assisi & Orvieto" },
  "sardinia":          { lat: 40.1,  lng: 9.1,   zoom: 8,  season: "May–Oct",       vibe: "Island luxury & sea views",     highlight: "Costa Smeralda & Alghero" },
  "lake-garda":        { lat: 45.6,  lng: 10.7,  zoom: 11, season: "May–Sep",       vibe: "Lakeside villa grandeur",       highlight: "Sirmione & Gardone" },
  "lombardy":          { lat: 45.5,  lng: 9.5,   zoom: 9,  season: "Apr–Oct",       vibe: "Northern Italian opulence",     highlight: "Milan & Lake District" },
  "florence":          { lat: 43.77, lng: 11.26, zoom: 12, season: "Apr–Jun, Sep–Oct", vibe: "Renaissance city romance",  highlight: "Chianti Hills & Piazza" },
  "positano":          { lat: 40.63, lng: 14.48, zoom: 13, season: "May–Sep",       vibe: "Cliffside coastal luxury",      highlight: "Li Galli & Marina" },
  "capri":             { lat: 40.55, lng: 14.23, zoom: 13, season: "May–Sep",       vibe: "Isle of emperors",              highlight: "Blue Grotto & Villa Jovis" },
  "emilia-romagna":    { lat: 44.5,  lng: 11.3,  zoom: 9,  season: "May–Oct",       vibe: "Ferrari & food culture",        highlight: "Bologna & Parma" },

  // ── France ─────────────────────────────────────────────────────────────────
  "provence":          { lat: 43.8,  lng: 5.2,   zoom: 9,  season: "May–Sep",       vibe: "Lavender fields & bastides",    highlight: "Luberon & Les Alpilles" },
  "loire-valley":      { lat: 47.4,  lng: 0.7,   zoom: 9,  season: "May–Oct",       vibe: "Château country romance",       highlight: "Amboise & Chinon" },
  "paris":             { lat: 48.86, lng: 2.35,  zoom: 12, season: "Apr–Jun, Sep",  vibe: "Haussmann grandeur",            highlight: "Marais & Versailles" },
  "bordeaux":          { lat: 44.84, lng: -0.58, zoom: 9,  season: "May–Oct",       vibe: "Grand cru estate weddings",     highlight: "Médoc & Saint-Émilion" },
  "normandy":          { lat: 49.2,  lng: 0.4,   zoom: 9,  season: "May–Sep",       vibe: "Coastal manor houses",          highlight: "Étretat & Deauville" },
  "dordogne":          { lat: 44.9,  lng: 0.9,   zoom: 9,  season: "May–Sep",       vibe: "Périgord stone châteaux",       highlight: "Sarlat & Les Eyzies" },
  "cote-d-azur":       { lat: 43.7,  lng: 7.2,   zoom: 10, season: "Apr–Oct",       vibe: "Riviera sun & luxury yachts",   highlight: "Nice & Antibes" },
  "alsace":            { lat: 48.3,  lng: 7.4,   zoom: 9,  season: "May–Oct",       vibe: "Vineyard village fairy-tale",   highlight: "Colmar & Strasbourg" },
  "french-alps":       { lat: 45.9,  lng: 6.9,   zoom: 8,  season: "Jun–Sep",       vibe: "Mountain chalet ceremony",      highlight: "Chamonix & Annecy" },
  "champagne":         { lat: 49.1,  lng: 4.0,   zoom: 9,  season: "May–Sep",       vibe: "Cellar caves & grand cuvée",    highlight: "Reims & Épernay" },

  // ── United Kingdom ──────────────────────────────────────────────────────────
  "cotswolds":         { lat: 51.8,  lng: -1.7,  zoom: 10, season: "May–Sep",       vibe: "Honey-stone village charm",     highlight: "Burford & Chipping Campden" },
  "scotland":          { lat: 56.8,  lng: -4.2,  zoom: 7,  season: "Jun–Aug",       vibe: "Wild highland castle drama",    highlight: "Glencoe & Loch Ness" },
  "scottish-highlands":{ lat: 57.1,  lng: -4.2,  zoom: 8,  season: "Jun–Aug",       vibe: "Wild castle drama",             highlight: "Glencoe & Loch Ness" },
  "lake-district":     { lat: 54.5,  lng: -3.0,  zoom: 10, season: "May–Sep",       vibe: "Lake & fell romance",           highlight: "Windermere & Ullswater" },
  "cornwall":          { lat: 50.3,  lng: -5.1,  zoom: 10, season: "May–Sep",       vibe: "Atlantic coastal estates",      highlight: "St Ives & Padstow" },
  "yorkshire":         { lat: 54.0,  lng: -1.6,  zoom: 9,  season: "May–Sep",       vibe: "Moors & manor houses",          highlight: "Harrogate & York" },
  "kent":              { lat: 51.3,  lng: 0.5,   zoom: 10, season: "May–Sep",       vibe: "Garden of England charm",       highlight: "Canterbury & Biddenden" },
  "surrey":            { lat: 51.3,  lng: -0.4,  zoom: 10, season: "Apr–Oct",       vibe: "Green belt manor estates",      highlight: "Guildford & Box Hill" },
  "london":            { lat: 51.51, lng: -0.12, zoom: 12, season: "May–Sep",       vibe: "Urban luxury & rooftop views",  highlight: "Mayfair & Richmond" },
  "devon":             { lat: 50.7,  lng: -3.8,  zoom: 10, season: "May–Sep",       vibe: "Countryside estate grandeur",   highlight: "Dartmoor & Dartmouth" },
  "wales":             { lat: 52.0,  lng: -3.5,  zoom: 8,  season: "May–Sep",       vibe: "Celtic castle romance",         highlight: "Snowdonia & Brecon" },

  // ── Spain ──────────────────────────────────────────────────────────────────
  "barcelona":         { lat: 41.38, lng: 2.17,  zoom: 11, season: "Apr–Oct",       vibe: "Modernist urban glamour",       highlight: "Gothic Quarter & Sitges" },
  "andalusia":         { lat: 37.4,  lng: -5.9,  zoom: 8,  season: "Mar–May, Oct",  vibe: "Moorish palace romance",        highlight: "Seville & Ronda" },
  "ibiza":             { lat: 38.9,  lng: 1.4,   zoom: 11, season: "May–Oct",       vibe: "Island sunset luxury",          highlight: "Ibiza Town & Santa Eulalia" },
  "mallorca":          { lat: 39.7,  lng: 3.0,   zoom: 10, season: "Apr–Oct",       vibe: "Mediterranean island estates",  highlight: "Palma & Valldemossa" },
  "costa-brava":       { lat: 41.9,  lng: 3.1,   zoom: 10, season: "May–Oct",       vibe: "Rugged coastal villas",         highlight: "Begur & Cadaqués" },

  // ── Portugal ───────────────────────────────────────────────────────────────
  "algarve":           { lat: 37.1,  lng: -8.4,  zoom: 9,  season: "Apr–Oct",       vibe: "Cliffside ocean ceremony",      highlight: "Lagos & Quinta do Lago" },
  "douro-valley":      { lat: 41.2,  lng: -7.7,  zoom: 9,  season: "May–Oct",       vibe: "Port wine terrace romance",     highlight: "Pinhão & Régua" },
  "lisbon":            { lat: 38.72, lng: -9.14, zoom: 12, season: "Apr–Oct",       vibe: "Tiled azulejo grandeur",        highlight: "Sintra & Cascais" },
  "sintra":            { lat: 38.8,  lng: -9.4,  zoom: 12, season: "Apr–Oct",       vibe: "Fairytale palace hills",        highlight: "Quinta da Regaleira & Pena" },

  // ── Greece ─────────────────────────────────────────────────────────────────
  "santorini":         { lat: 36.43, lng: 25.43, zoom: 12, season: "Apr–Oct",       vibe: "Caldera sunset ceremony",       highlight: "Oia & Imerovigli" },
  "mykonos":           { lat: 37.45, lng: 25.33, zoom: 12, season: "May–Sep",       vibe: "Cycladic whitewashed luxury",   highlight: "Little Venice & Ano Mera" },
  "crete":             { lat: 35.2,  lng: 24.9,  zoom: 9,  season: "Apr–Oct",       vibe: "Minoan island grandeur",        highlight: "Chania & Elounda" },
  "athens":            { lat: 37.98, lng: 23.73, zoom: 12, season: "Apr–Jun, Sep–Oct", vibe: "Acropolis view ceremonies", highlight: "Plaka & Cape Sounion" },
  "rhodes":            { lat: 36.2,  lng: 27.9,  zoom: 11, season: "May–Oct",       vibe: "Medieval island romance",       highlight: "Old Town & Lindos" },

  // ── USA ────────────────────────────────────────────────────────────────────
  "napa-valley":       { lat: 38.5,  lng: -122.3, zoom: 10, season: "May–Oct",      vibe: "Wine country vineyard estates", highlight: "Yountville & St Helena" },
  "new-york":          { lat: 40.71, lng: -74.0,  zoom: 11, season: "May–Oct",      vibe: "Skyline rooftop glamour",       highlight: "Brooklyn & the Hamptons" },
  "miami":             { lat: 25.77, lng: -80.19, zoom: 11, season: "Nov–Apr",      vibe: "Art deco beachfront luxury",    highlight: "South Beach & Bal Harbour" },
  "los-angeles":       { lat: 34.05, lng: -118.24, zoom: 10, season: "Apr–Oct",     vibe: "Hollywood hills ceremony",      highlight: "Malibu & Bel Air" },
  "chicago":           { lat: 41.88, lng: -87.63, zoom: 11, season: "May–Oct",      vibe: "Architectural grandeur",        highlight: "Gold Coast & Lincoln Park" },
  "hawaii":            { lat: 20.8,  lng: -156.3, zoom: 8,  season: "Year-round",   vibe: "Tropical beach ceremony",       highlight: "Maui & Kauai" },
};
