// ═══════════════════════════════════════════════════════════════════════════
// Country Registry — SINGLE SOURCE OF TRUTH for all countries
// ═══════════════════════════════════════════════════════════════════════════
//
// This is the canonical country registry. Every component that needs country
// data must read from here. No separate country arrays, no lightweight
// duplicates, no localStorage escape hatches.
//
// Used by:
//   - Admin Country List (CountriesModule)
//   - Location Studio (country selector)
//   - Listing Studio (country dropdown via countryOptions.js)
//   - Public location pages (LocationPage.jsx)
//   - Any future country selector
//
// To add a country: add it here. It will appear everywhere automatically.
// ═══════════════════════════════════════════════════════════════════════════

import { ITALY_COUNTRY } from "./italy/country.js";

export const COUNTRY_REGISTRY = [
  ITALY_COUNTRY,
  {
    id: "france", slug: "france", name: "France", iso2: "FR", listingCount: 12,
    seoTitleTemplate: "Luxury Wedding Vendors in France | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues and vendors across France. Châteaux, Provence estates and Parisian elegance, editorially selected.",
    evergreenContent: "France embodies romance at every scale, from intimate Provençal farmhouses to grand Loire Valley châteaux. The French wedding tradition marries gastronomy, fashion and architecture into celebrations of unparalleled sophistication.",
    focusKeywords: ["luxury wedding france", "french chateau wedding", "provence wedding", "destination wedding france", "paris wedding planner"],
    aiSummary: "Second-largest European destination market. Château weddings dominate search. Provence and Paris drive the highest conversion rates.",
    intentSignals: { high: ["chateau wedding france cost", "provence wedding planner book", "paris luxury wedding venue hire"], mid: ["best french wedding venues", "provence wedding inspiration", "france destination wedding packages"], low: ["french wedding traditions", "getting married in france requirements", "wedding in france ideas"] },
  },
  {
    id: "england", slug: "england", name: "England", iso2: "GB-ENG", listingCount: 14,
    seoTitleTemplate: "Luxury Wedding Venues & Vendors in England | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues and vendors across England. Country houses, castles, Cotswolds estates and London grandeur, editorially selected.",
    evergreenContent: "England offers an unrivalled range of wedding settings, from the honey-stone villages of the Cotswolds to the grandeur of London's historic hotels. Country houses, royal estates and contemporary barn conversions form the backbone of the English luxury wedding market.",
    focusKeywords: ["luxury wedding england", "country house wedding england", "wedding venues england", "london wedding venue", "cotswolds wedding venue"],
    aiSummary: "Largest domestic market. Country houses and barn venues lead search. Strong year-round demand with summer peak. London planners service both domestic and destination.",
    intentSignals: { high: ["book country house wedding venue england", "luxury wedding planner london", "cotswolds wedding venue hire"], mid: ["best wedding venues england", "cotswolds wedding ideas", "country wedding venues england"], low: ["england wedding traditions", "average wedding cost england", "wedding planning checklist england"] },
  },
  {
    id: "scotland", slug: "scotland", name: "Scotland", iso2: "GB-SCT", listingCount: 6,
    seoTitleTemplate: "Luxury Wedding Venues & Vendors in Scotland | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues and vendors across Scotland. Highland castles, loch-side estates and Edinburgh grandeur, editorially selected.",
    evergreenContent: "Scotland's dramatic landscapes and ancient castles create a wedding backdrop unlike anywhere else in the world. From the Highlands to Edinburgh's Georgian New Town, Scottish weddings combine wild romance with centuries of aristocratic tradition.",
    focusKeywords: ["luxury wedding scotland", "castle wedding scotland", "highland wedding venue", "edinburgh wedding venue", "scottish estate wedding"],
    aiSummary: "Castle weddings dominate. Gleneagles anchors ultra-luxury. Edinburgh and Perthshire lead search. Strong international destination appeal.",
    intentSignals: { high: ["castle wedding scotland book", "gleneagles wedding hire", "highland wedding venue book"], mid: ["best scotland wedding venues", "edinburgh wedding ideas", "scottish castle wedding"], low: ["scotland wedding traditions", "getting married in scotland", "scottish wedding inspiration"] },
  },
  {
    id: "wales", slug: "wales", name: "Wales", iso2: "GB-WLS", listingCount: 4,
    seoTitleTemplate: "Luxury Wedding Venues & Vendors in Wales | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues and vendors across Wales. Coastal castles, Snowdonia estates and Pembrokeshire coves, editorially selected.",
    evergreenContent: "Wales offers dramatic coastal scenery, medieval castles and wild mountain landscapes for couples seeking something extraordinary. From Pembrokeshire's golden beaches to Snowdonia's peaks, Welsh weddings are defined by natural grandeur and Celtic character.",
    focusKeywords: ["luxury wedding wales", "castle wedding wales", "wales wedding venue", "pembrokeshire wedding", "snowdonia wedding"],
    aiSummary: "Castle and coastal venues lead. Portmeirion and Pembrokeshire anchor the luxury tier. Growing destination appeal from English and international markets.",
    intentSignals: { high: ["wales wedding venue book", "castle wedding wales hire"], mid: ["best wales wedding venues", "pembrokeshire wedding guide"], low: ["wales wedding traditions", "getting married in wales"] },
  },
  {
    id: "spain", slug: "spain", name: "Spain", iso2: "ES", listingCount: 8,
    seoTitleTemplate: "Luxury Wedding Vendors in Spain | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues and vendors across Spain. Andalusian fincas, Balearic islands and Barcelona elegance, editorially selected.",
    evergreenContent: "Spain offers sun-drenched celebrations blending Moorish architecture, Mediterranean coastline and world-class gastronomy. From the white villages of Andalusia to the bohemian glamour of Ibiza, Spanish weddings are a feast for every sense.",
    focusKeywords: ["luxury wedding spain", "spanish finca wedding", "ibiza wedding venue", "marbella wedding", "barcelona wedding planner"],
    aiSummary: "Fast-growing destination market. Mallorca and Marbella drive highest search volume. Ibiza captures younger luxury demographic. Year-round viability.",
    intentSignals: { high: ["finca wedding spain book", "marbella luxury wedding venue", "ibiza wedding planner hire"], mid: ["best wedding venues spain", "mallorca wedding guide", "andalusia wedding inspiration"], low: ["spanish wedding customs", "getting married in spain", "spain wedding ideas"] },
  },
  {
    id: "usa", slug: "usa", name: "United States", iso2: "US", listingCount: 6,
    seoTitleTemplate: "Luxury Wedding Vendors in the USA | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues and vendors across the United States. East Coast estates, Californian vineyards and city grandeur, editorially selected.",
    evergreenContent: "The United States encompasses extraordinary diversity, from the Gilded Age estates of the Hudson Valley to Napa Valley vineyards and the Art Deco glamour of Miami. American luxury weddings blend scale, creativity and world-class vendor talent.",
    focusKeywords: ["luxury wedding usa", "new york wedding venue", "napa valley wedding", "hamptons wedding", "luxury wedding planner nyc"],
    aiSummary: "High-value market with premium vendor ecosystem. New York tri-state area dominates. California wine country and Florida emerging strongly.",
    intentSignals: { high: ["luxury wedding venue new york book", "napa valley wedding planner hire", "hamptons estate wedding cost"], mid: ["best luxury wedding venues usa", "california winery wedding guide", "new york wedding ideas"], low: ["american wedding traditions", "average luxury wedding cost us", "wedding planning tips usa"] },
  },
  // ═══════════════════════════════════════════════════════════════════════
  // EUROPE, Extended
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "portugal", slug: "portugal", name: "Portugal", iso2: "PT", listingCount: 9,
    seoTitleTemplate: "Luxury Wedding Vendors in Portugal | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues and vendors across Portugal. Algarve coastlines, Sintra palaces and Douro vineyards, editorially selected.",
    evergreenContent: "Portugal blends Atlantic drama with Moorish heritage. Sun-drenched Algarve cliffs, Sintra's fairy-tale palaces and the terraced vineyards of the Douro Valley create a wedding destination of remarkable range and warmth.",
    focusKeywords: ["luxury wedding portugal", "algarve wedding venue", "sintra wedding", "portugal destination wedding", "lisbon wedding planner"],
    aiSummary: "Fast-growing European destination. Algarve leads volume. Sintra drives highest-value weddings. Strong UK market.",
    intentSignals: { high: ["algarve wedding venue book", "sintra palace wedding hire"], mid: ["best portugal wedding venues", "algarve wedding guide"], low: ["portugal wedding traditions", "getting married in portugal"] },
  },
  {
    id: "greece", slug: "greece", name: "Greece", iso2: "GR", listingCount: 11,
    seoTitleTemplate: "Luxury Wedding Vendors in Greece | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues and vendors across Greece. Santorini sunsets, Mykonos glamour and Athenian elegance, editorially selected.",
    evergreenContent: "Greece is synonymous with romance, whitewashed Cycladic villages, ancient temples and Aegean sunsets that define the destination wedding dream. From Santorini's caldera to Crete's rugged coastline, every island tells a love story.",
    focusKeywords: ["luxury wedding greece", "santorini wedding venue", "mykonos wedding", "greek island wedding", "athens wedding planner"],
    aiSummary: "Top 3 global destination market. Santorini dominates luxury tier. Mykonos captures fashion-forward segment. Strong year-round demand.",
    intentSignals: { high: ["santorini wedding venue book", "mykonos wedding planner hire"], mid: ["best greek island wedding venues", "greece destination wedding cost"], low: ["greek wedding traditions", "getting married in greece"] },
  },
  {
    id: "ireland", slug: "ireland", name: "Ireland", iso2: "IE", listingCount: 7,
    seoTitleTemplate: "Luxury Wedding Vendors in Ireland | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues and vendors across Ireland. Castle estates, coastal cliffs and Georgian grandeur, editorially selected.",
    evergreenContent: "Ireland offers wild Atlantic beauty and aristocratic elegance. Castle hotels, Georgian estates and clifftop ceremonies along the Wild Atlantic Way create a uniquely atmospheric wedding destination.",
    focusKeywords: ["luxury wedding ireland", "castle wedding ireland", "irish wedding venue", "ireland destination wedding"],
    aiSummary: "Castle weddings dominate. Strong US-Irish heritage market. Kerry and Dublin lead demand.",
    intentSignals: { high: ["irish castle wedding venue book", "ireland wedding planner hire"], mid: ["best wedding venues ireland", "castle wedding ireland cost"], low: ["irish wedding traditions", "getting married in ireland"] },
  },
  {
    id: "croatia", slug: "croatia", name: "Croatia", iso2: "HR", listingCount: 6,
    seoTitleTemplate: "Luxury Wedding Vendors in Croatia | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues and vendors across Croatia. Dubrovnik walled city, Adriatic islands and Istrian hilltop villages, editorially selected.",
    evergreenContent: "Croatia has emerged as a Mediterranean jewel, Dubrovnik's medieval grandeur, the lavender-scented islands of Hvar and Vis, and Istria's truffle-rich hilltop villages offer European luxury at compelling value.",
    focusKeywords: ["luxury wedding croatia", "dubrovnik wedding venue", "hvar wedding", "croatia destination wedding"],
    aiSummary: "Fastest-growing Mediterranean destination. Dubrovnik anchors luxury tier. Island weddings trending strongly.",
    intentSignals: { high: ["dubrovnik wedding venue book", "hvar wedding planner"], mid: ["best croatia wedding venues", "dubrovnik wedding cost"], low: ["croatia wedding ideas", "getting married in croatia"] },
  },
  {
    id: "switzerland", slug: "switzerland", name: "Switzerland", iso2: "CH", listingCount: 5,
    seoTitleTemplate: "Luxury Wedding Vendors in Switzerland | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues and vendors across Switzerland. Alpine grandeur, lake palaces and five-star elegance, editorially selected.",
    evergreenContent: "Switzerland offers unmatched Alpine luxury, palatial lakeside hotels, mountain-top ceremonies with panoramic views and world-class gastronomy. From Lake Geneva's glamour to the Engadine's pristine beauty.",
    focusKeywords: ["luxury wedding switzerland", "swiss wedding venue", "lake geneva wedding", "alpine wedding switzerland"],
    aiSummary: "Ultra-premium market. Highest per-wedding spend in Europe. Palace hotel weddings dominate. Winter and summer seasons.",
    intentSignals: { high: ["lake geneva wedding venue book", "swiss alpine wedding planner"], mid: ["best switzerland wedding venues", "swiss wedding cost"], low: ["swiss wedding traditions", "getting married in switzerland"] },
  },
  // ═══════════════════════════════════════════════════════════════════════
  // MIDDLE EAST & NORTH AFRICA
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "uae", slug: "uae", name: "United Arab Emirates", iso2: "AE", listingCount: 8,
    seoTitleTemplate: "Luxury Wedding Vendors in the UAE | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues and vendors across the UAE. Dubai opulence, Abu Dhabi grandeur and desert romance, editorially selected.",
    evergreenContent: "The UAE delivers wedding luxury at a scale found nowhere else, from Dubai's glittering skyline venues and private island resorts to Abu Dhabi's palatial hotels. Desert ceremonies under starlit skies add an Arabian Nights dimension.",
    focusKeywords: ["luxury wedding dubai", "dubai wedding venue", "abu dhabi wedding", "uae wedding planner", "desert wedding dubai"],
    aiSummary: "Highest-spend market globally. Dubai dominates with palace and beachfront venues. Year-round with winter peak. Strong South Asian and Middle Eastern demand.",
    intentSignals: { high: ["dubai luxury wedding venue book", "abu dhabi palace wedding hire"], mid: ["best dubai wedding venues", "uae destination wedding packages"], low: ["dubai wedding ideas", "getting married in dubai"] },
  },
  {
    id: "morocco", slug: "morocco", name: "Morocco", iso2: "MA", listingCount: 5,
    seoTitleTemplate: "Luxury Wedding Vendors in Morocco | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues and vendors across Morocco. Marrakech riads, Atlas Mountain retreats and Saharan luxury, editorially selected.",
    evergreenContent: "Morocco enchants with sensory richness, Marrakech's rose-scented riads, the snow-capped Atlas Mountains and Saharan desert camps under infinite stars create celebrations of extraordinary atmosphere.",
    focusKeywords: ["luxury wedding morocco", "marrakech wedding venue", "morocco destination wedding", "riad wedding marrakech"],
    aiSummary: "Experiential luxury market. Marrakech dominates. Multi-day celebration format drives high spend. Autumn and spring peaks.",
    intentSignals: { high: ["marrakech riad wedding venue book", "morocco wedding planner hire"], mid: ["best morocco wedding venues", "marrakech wedding cost"], low: ["moroccan wedding traditions", "getting married in morocco"] },
  },
  {
    id: "turkey", slug: "turkey", name: "Turkey", iso2: "TR", listingCount: 6,
    seoTitleTemplate: "Luxury Wedding Vendors in Turkey | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues and vendors across Turkey. Istanbul palaces, Cappadocia hot-air balloon ceremonies and Bodrum coastal glamour, editorially selected.",
    evergreenContent: "Turkey bridges continents and cultures, Istanbul's Ottoman palaces, Cappadocia's surreal lunar landscapes and the turquoise Aegean coast of Bodrum offer luxury weddings of cinematic proportions.",
    focusKeywords: ["luxury wedding turkey", "istanbul wedding venue", "cappadocia wedding", "bodrum wedding", "turkey destination wedding"],
    aiSummary: "Emerging luxury destination with strong value proposition. Istanbul cultural weddings and Cappadocia experiential weddings drive demand.",
    intentSignals: { high: ["istanbul palace wedding venue book", "cappadocia wedding planner"], mid: ["best turkey wedding venues", "bodrum wedding guide"], low: ["turkish wedding traditions", "getting married in turkey"] },
  },
  // ═══════════════════════════════════════════════════════════════════════
  // ASIA & INDIAN OCEAN
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "thailand", slug: "thailand", name: "Thailand", iso2: "TH", listingCount: 7,
    seoTitleTemplate: "Luxury Wedding Vendors in Thailand | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues and vendors across Thailand. Tropical beach ceremonies, jungle temples and five-star island resorts, editorially selected.",
    evergreenContent: "Thailand offers tropical luxury with spiritual depth, private island resorts in Koh Samui, Phuket's clifftop venues, and Chiang Mai's temple-set ceremonies create celebrations infused with warmth and beauty.",
    focusKeywords: ["luxury wedding thailand", "koh samui wedding venue", "phuket wedding", "thailand beach wedding", "chiang mai wedding"],
    aiSummary: "Leading Asian beach destination. Koh Samui and Phuket dominate luxury tier. Strong Australian, European and American demand.",
    intentSignals: { high: ["koh samui luxury wedding venue book", "phuket wedding planner hire"], mid: ["best thailand wedding venues", "thai beach wedding cost"], low: ["thai wedding traditions", "getting married in thailand"] },
  },
  {
    id: "indonesia", slug: "indonesia", name: "Indonesia", iso2: "ID", listingCount: 8,
    seoTitleTemplate: "Luxury Wedding Vendors in Indonesia | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues and vendors across Indonesia. Bali clifftop temples, jungle villas and private island escapes, editorially selected.",
    evergreenContent: "Bali stands alone as Asia's most magnetic wedding destination, volcanic cliffside temples, emerald rice terrace villas, and world-class resort infrastructure create celebrations of spiritual beauty and tropical luxury.",
    focusKeywords: ["luxury wedding bali", "bali wedding venue", "uluwatu wedding", "ubud wedding", "indonesia destination wedding"],
    aiSummary: "Bali dominates entirely. Uluwatu cliff venues and Ubud jungle settings lead. Year-round with dry season peak April-October.",
    intentSignals: { high: ["bali clifftop wedding venue book", "ubud villa wedding hire"], mid: ["best bali wedding venues", "bali wedding planner cost"], low: ["balinese wedding traditions", "getting married in bali"] },
  },
  {
    id: "india", slug: "india", name: "India", iso2: "IN", listingCount: 10,
    seoTitleTemplate: "Luxury Wedding Vendors in India | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues and vendors across India. Rajasthan palaces, Goa beaches and Kerala backwaters, editorially selected.",
    evergreenContent: "India elevates weddings to an art form, Rajasthan's maharaja palaces, Goa's tropical glamour and Kerala's tranquil backwaters create celebrations of unmatched colour, scale and cultural richness.",
    focusKeywords: ["luxury wedding india", "palace wedding rajasthan", "udaipur wedding venue", "goa wedding", "india destination wedding"],
    aiSummary: "Largest wedding market by volume. Rajasthan palace weddings command premium. Multi-day celebrations drive highest total spend globally.",
    intentSignals: { high: ["udaipur palace wedding venue book", "jaipur wedding planner hire"], mid: ["best india palace wedding venues", "rajasthan wedding cost"], low: ["indian wedding traditions", "destination wedding in india"] },
  },
  {
    id: "japan", slug: "japan", name: "Japan", iso2: "JP", listingCount: 4,
    seoTitleTemplate: "Luxury Wedding Vendors in Japan | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues and vendors across Japan. Kyoto temples, Tokyo modernity and cherry blossom ceremonies, editorially selected.",
    evergreenContent: "Japan merges ancient ceremony with exquisite precision, Kyoto's temple gardens, Tokyo's skyline venues and the ephemeral beauty of cherry blossom season create weddings of profound elegance.",
    focusKeywords: ["luxury wedding japan", "kyoto wedding venue", "tokyo wedding", "japan destination wedding", "cherry blossom wedding"],
    aiSummary: "Ultra-niche luxury market. Cherry blossom season (March-April) drives international demand. Kyoto dominates aesthetic appeal.",
    intentSignals: { high: ["kyoto temple wedding venue book", "japan wedding planner hire"], mid: ["best japan wedding venues", "tokyo luxury wedding"], low: ["japanese wedding traditions", "getting married in japan"] },
  },
  {
    id: "srilanka", slug: "sri-lanka", name: "Sri Lanka", iso2: "LK", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in Sri Lanka | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues and vendors across Sri Lanka. Colonial tea estates, tropical beaches and ancient temples, editorially selected.",
    evergreenContent: "Sri Lanka offers intimate luxury amid extraordinary biodiversity, colonial hill-country tea estates, southern coastal boutique hotels and ancient temple settings create understated celebrations of natural beauty.",
    focusKeywords: ["luxury wedding sri lanka", "sri lanka wedding venue", "galle wedding", "sri lanka destination wedding"],
    aiSummary: "Emerging boutique destination. Galle coast leads. Strong UK and Australian demand. Intimate weddings dominate.",
    intentSignals: { high: ["galle fort wedding venue book", "sri lanka wedding planner"], mid: ["best sri lanka wedding venues"], low: ["sri lanka wedding ideas"] },
  },
  {
    id: "maldives", slug: "maldives", name: "Maldives", iso2: "MV", listingCount: 4,
    seoTitleTemplate: "Luxury Wedding Vendors in the Maldives | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues across the Maldives. Overwater villas, private island ceremonies and sandbank receptions, editorially selected.",
    evergreenContent: "The Maldives represents the pinnacle of private island luxury, overwater villa ceremonies, sandbank receptions at sunset and the Indian Ocean's most pristine turquoise waters create an unrivalled intimate escape.",
    focusKeywords: ["luxury wedding maldives", "maldives wedding venue", "overwater villa wedding", "private island wedding maldives"],
    aiSummary: "Ultra-premium micro-destination. Resort-exclusive weddings. Highest per-night spend. Honeymoon-wedding combination market.",
    intentSignals: { high: ["maldives overwater wedding venue book", "private island wedding maldives"], mid: ["best maldives wedding resorts"], low: ["maldives wedding ideas"] },
  },
  // ═══════════════════════════════════════════════════════════════════════
  // AMERICAS, Extended
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "mexico", slug: "mexico", name: "Mexico", iso2: "MX", listingCount: 8,
    seoTitleTemplate: "Luxury Wedding Vendors in Mexico | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues and vendors across Mexico. Tulum jungle cenotes, Los Cabos oceanfront and colonial San Miguel, editorially selected.",
    evergreenContent: "Mexico marries ancient culture with modern luxury, Tulum's jungle cenotes, Los Cabos' desert-meets-ocean drama and San Miguel de Allende's colonial splendour create Latin America's most diverse wedding destination.",
    focusKeywords: ["luxury wedding mexico", "tulum wedding venue", "los cabos wedding", "san miguel de allende wedding", "mexico destination wedding"],
    aiSummary: "Largest Latin American luxury market. Strong US demand drives Tulum and Los Cabos. San Miguel captures cultural-luxury segment.",
    intentSignals: { high: ["tulum wedding venue book", "los cabos wedding planner hire"], mid: ["best mexico wedding venues", "tulum wedding cost"], low: ["mexican wedding traditions", "destination wedding mexico"] },
  },
  {
    id: "caribbean", slug: "caribbean", name: "Caribbean", iso2: "CB", listingCount: 7,
    seoTitleTemplate: "Luxury Wedding Vendors in the Caribbean | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues across the Caribbean. Private island resorts, plantation estates and tropical beach ceremonies, editorially selected.",
    evergreenContent: "The Caribbean archipelago offers island-hopping luxury, from Barbados' coral-stone plantation houses to St. Lucia's volcanic twin Pitons, Jamaica's cliff resorts and Antigua's 365 beaches.",
    focusKeywords: ["luxury wedding caribbean", "barbados wedding venue", "st lucia wedding", "jamaica wedding", "caribbean destination wedding"],
    aiSummary: "Multi-island destination market. Barbados and St. Lucia lead luxury tier. Strong US East Coast and UK demand. Winter peak season.",
    intentSignals: { high: ["barbados luxury wedding venue book", "st lucia wedding planner hire"], mid: ["best caribbean wedding venues", "island wedding caribbean cost"], low: ["caribbean wedding ideas", "beach wedding caribbean"] },
  },
  // ═══════════════════════════════════════════════════════════════════════
  // AFRICA
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "southafrica", slug: "south-africa", name: "South Africa", iso2: "ZA", listingCount: 7,
    seoTitleTemplate: "Luxury Wedding Vendors in South Africa | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues and vendors across South Africa. Cape Town wine estates, safari lodges and Garden Route beauty, editorially selected.",
    evergreenContent: "South Africa delivers the African dream wedding, Cape Town's vineyard estates beneath Table Mountain, safari lodges where elephants roam and the lush Garden Route coastline create celebrations of cinematic scale.",
    focusKeywords: ["luxury wedding south africa", "cape town wedding venue", "winelands wedding", "safari wedding south africa", "south africa destination wedding"],
    aiSummary: "Africa's leading luxury market. Cape Winelands dominate venue search. Safari-wedding combination drives international demand.",
    intentSignals: { high: ["cape town wine estate wedding book", "south africa safari wedding venue"], mid: ["best south africa wedding venues", "cape town wedding cost"], low: ["south african wedding traditions", "getting married in south africa"] },
  },
  {
    id: "kenya", slug: "kenya", name: "Kenya", iso2: "KE", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in Kenya | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues in Kenya. Safari lodges, Indian Ocean beaches and Great Rift Valley estates, editorially selected.",
    evergreenContent: "Kenya combines safari grandeur with coastal paradise, Masai Mara lodge ceremonies, Diani Beach oceanfront celebrations and Great Rift Valley estates set against Africa's most dramatic landscapes.",
    focusKeywords: ["luxury wedding kenya", "safari wedding kenya", "diani beach wedding", "kenya destination wedding"],
    aiSummary: "Safari-wedding niche. Small but ultra-premium market. Masai Mara and Diani Beach lead. Strong conservation-luxury positioning.",
    intentSignals: { high: ["kenya safari lodge wedding book", "diani beach wedding planner"], mid: ["best kenya wedding venues"], low: ["kenya wedding ideas"] },
  },
  // ═══════════════════════════════════════════════════════════════════════
  // OCEANIA
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "australia", slug: "australia", name: "Australia", iso2: "AU", listingCount: 8,
    seoTitleTemplate: "Luxury Wedding Vendors in Australia | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues and vendors across Australia. Hunter Valley vineyards, Byron Bay beaches and Sydney Harbour glamour, editorially selected.",
    evergreenContent: "Australia offers weddings of extraordinary natural scale, Sydney Harbour's iconic backdrop, Hunter Valley's vineyard estates, Byron Bay's bohemian coastal charm and the ancient landscapes of the Barossa Valley.",
    focusKeywords: ["luxury wedding australia", "sydney wedding venue", "hunter valley wedding", "byron bay wedding", "melbourne wedding planner"],
    aiSummary: "Largest Oceania market. Sydney and Melbourne anchor urban demand. Hunter Valley and Byron Bay lead destination segment.",
    intentSignals: { high: ["sydney harbour wedding venue book", "hunter valley wedding planner hire"], mid: ["best australia wedding venues", "byron bay wedding cost"], low: ["australian wedding traditions", "getting married in australia"] },
  },
  {
    id: "newzealand", slug: "new-zealand", name: "New Zealand", iso2: "NZ", listingCount: 4,
    seoTitleTemplate: "Luxury Wedding Vendors in New Zealand | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in New Zealand. Queenstown mountains, Hawke's Bay vineyards and Waiheke Island escapes, editorially selected.",
    evergreenContent: "New Zealand delivers Lord of the Rings grandeur, Queenstown's alpine lakes, Hawke's Bay's Art Deco wine country and Waiheke Island's vineyard terraces create epic celebrations amid pristine wilderness.",
    focusKeywords: ["luxury wedding new zealand", "queenstown wedding venue", "waiheke island wedding", "new zealand destination wedding"],
    aiSummary: "Adventure-luxury niche. Queenstown dominates international search. Strong Australian and US elopement market.",
    intentSignals: { high: ["queenstown wedding venue book", "new zealand wedding planner hire"], mid: ["best new zealand wedding venues", "queenstown wedding cost"], low: ["nz wedding traditions", "getting married in new zealand"] },
  },
  // ═══════════════════════════════════════════════════════════════════════
  // EUROPE, From existing platform + additions
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "austria", slug: "austria", name: "Austria", iso2: "AT", listingCount: 5,
    seoTitleTemplate: "Luxury Wedding Vendors in Austria | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues across Austria. Viennese palaces, Alpine lakeside ceremonies and Salzburg's baroque elegance, editorially selected.",
    evergreenContent: "Austria combines imperial grandeur with Alpine splendour, Vienna's palatial ballrooms, Salzburg's baroque churches and the crystalline lakes of the Salzkammergut create celebrations of refined European elegance.",
    focusKeywords: ["luxury wedding austria", "vienna wedding venue", "salzburg wedding", "alpine wedding austria", "austria destination wedding"],
    aiSummary: "Palace and Alpine dual market. Vienna drives city weddings. Salzburg and Salzkammergut lead destination segment. Strong German-speaking demand.",
    intentSignals: { high: ["vienna palace wedding venue book", "salzburg wedding planner hire"], mid: ["best austria wedding venues", "alpine wedding austria cost"], low: ["austrian wedding traditions", "getting married in austria"] },
  },
  {
    id: "germany", slug: "germany", name: "Germany", iso2: "DE", listingCount: 5,
    seoTitleTemplate: "Luxury Wedding Vendors in Germany | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues across Germany. Bavarian castles, Rhine Valley estates and Berlin elegance, editorially selected.",
    evergreenContent: "Germany offers fairy-tale grandeur, Bavarian castle turrets, Rhine Valley vineyard estates, Black Forest retreats and Berlin's contemporary art spaces create an unexpectedly diverse wedding destination.",
    focusKeywords: ["luxury wedding germany", "castle wedding germany", "bavarian wedding", "germany destination wedding"],
    aiSummary: "Castle wedding market growing. Bavaria dominates destination search. Berlin captures modern-luxury segment. Primarily domestic demand.",
    intentSignals: { high: ["bavarian castle wedding book", "germany wedding planner"], mid: ["best germany wedding venues", "castle wedding germany cost"], low: ["german wedding traditions"] },
  },
  {
    id: "cyprus", slug: "cyprus", name: "Cyprus", iso2: "CY", listingCount: 6,
    seoTitleTemplate: "Luxury Wedding Vendors in Cyprus | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues across Cyprus. Paphos clifftops, Limassol beach clubs and Troodos mountain retreats, editorially selected.",
    evergreenContent: "Cyprus blends Greek warmth with year-round Mediterranean sunshine, Paphos's ancient clifftop terraces, Limassol's glamorous marina and the cedar-forested Troodos Mountains offer celebrations infused with mythological romance.",
    focusKeywords: ["luxury wedding cyprus", "paphos wedding venue", "limassol wedding", "cyprus destination wedding", "ayia napa wedding"],
    aiSummary: "Strong British expat and destination market. Paphos leads luxury tier. Year-round season. Competitive pricing drives volume.",
    intentSignals: { high: ["paphos wedding venue book", "cyprus wedding planner hire"], mid: ["best cyprus wedding venues", "limassol wedding guide"], low: ["cyprus wedding traditions", "getting married in cyprus"] },
  },
  {
    id: "malta", slug: "malta", name: "Malta", iso2: "MT", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in Malta | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in Malta. Baroque palazzi, fortified citadels and Mediterranean terraces, editorially selected.",
    evergreenContent: "Malta packs extraordinary heritage into a tiny archipelago, Knights of St John fortifications, baroque churches, honey-stone palazzi and the ancient temples of Gozo create an intimate Mediterranean gem.",
    focusKeywords: ["luxury wedding malta", "malta wedding venue", "gozo wedding", "malta destination wedding"],
    aiSummary: "Compact island destination. Baroque venue niche. Strong UK market. Year-round viability. Gozo for intimate weddings.",
    intentSignals: { high: ["malta wedding venue book", "malta wedding planner"], mid: ["best malta wedding venues"], low: ["malta wedding ideas"] },
  },
  {
    id: "montenegro", slug: "montenegro", name: "Montenegro", iso2: "ME", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in Montenegro | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues in Montenegro. Bay of Kotor fjords, Adriatic island ceremonies and medieval citadels, editorially selected.",
    evergreenContent: "Montenegro's dramatic Adriatic coastline rivals anywhere in the Mediterranean, the fjord-like Bay of Kotor, the fortified island of Sveti Stefan and the medieval walls of Budva create a boutique alternative to Croatia.",
    focusKeywords: ["luxury wedding montenegro", "kotor wedding venue", "sveti stefan wedding", "montenegro destination wedding"],
    aiSummary: "Emerging boutique destination. Aman Sveti Stefan effect drives luxury awareness. Bay of Kotor is primary draw. Growing fast.",
    intentSignals: { high: ["kotor bay wedding venue book", "sveti stefan wedding"], mid: ["best montenegro wedding venues"], low: ["montenegro wedding ideas"] },
  },
  {
    id: "slovenia", slug: "slovenia", name: "Slovenia", iso2: "SI", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in Slovenia | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues in Slovenia. Lake Bled island church, Alpine valleys and Ljubljana elegance, editorially selected.",
    evergreenContent: "Slovenia's Lake Bled, with its island church and Alpine backdrop, has become one of Europe's most iconic wedding images. Ljubljana's charming old town and the Julian Alps complete a fairy-tale setting.",
    focusKeywords: ["luxury wedding slovenia", "lake bled wedding", "slovenia wedding venue", "bled church wedding"],
    aiSummary: "Single-venue phenomenon. Lake Bled dominates global search. Ljubljana emerging as city-wedding base. Very niche but high-intent.",
    intentSignals: { high: ["lake bled wedding venue book", "slovenia wedding planner"], mid: ["best slovenia wedding venues"], low: ["slovenia wedding ideas"] },
  },
  {
    id: "iceland", slug: "iceland", name: "Iceland", iso2: "IS", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Iceland | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in Iceland. Glacier ceremonies, volcanic landscapes and Northern Lights elopements, editorially selected.",
    evergreenContent: "Iceland offers otherworldly romance, black sand beach ceremonies, glacier-edge vows, volcanic hot spring receptions and the ethereal glow of the Northern Lights create truly once-in-a-lifetime celebrations.",
    focusKeywords: ["iceland wedding", "iceland elopement", "northern lights wedding", "glacier wedding iceland"],
    aiSummary: "Adventure-elopement market leader. Northern Lights season (Oct-Mar) drives demand. Small luxury-lodge infrastructure. Social media amplification huge.",
    intentSignals: { high: ["iceland elopement planner book", "northern lights wedding venue"], mid: ["best iceland wedding venues"], low: ["iceland wedding ideas"] },
  },
  {
    id: "netherlands", slug: "netherlands", name: "Netherlands", iso2: "NL", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in the Netherlands | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues in the Netherlands. Amsterdam canal houses, tulip field ceremonies and Dutch castle estates, editorially selected.",
    evergreenContent: "The Netherlands delivers understated elegance, Amsterdam's candlelit canal houses, Dutch Golden Age castles, tulip-bordered estates and the minimalist grandeur of contemporary Dutch design.",
    focusKeywords: ["luxury wedding netherlands", "amsterdam wedding venue", "dutch castle wedding", "netherlands wedding"],
    aiSummary: "Amsterdam canal house market strong. Castle weddings outside city growing. Tulip season (April-May) drives destination interest.",
    intentSignals: { high: ["amsterdam wedding venue book", "dutch castle wedding hire"], mid: ["best netherlands wedding venues"], low: ["dutch wedding traditions"] },
  },
  {
    id: "denmark", slug: "denmark", name: "Denmark", iso2: "DK", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Denmark | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in Denmark. Copenhagen's Scandi elegance and Danish manor houses, editorially selected.",
    evergreenContent: "Denmark embodies Scandinavian design excellence, Copenhagen's Nyhavn waterfront, minimalist manor houses and the hygge-infused intimacy of Danish celebrations create weddings of quiet sophistication.",
    focusKeywords: ["luxury wedding denmark", "copenhagen wedding venue", "danish castle wedding"],
    aiSummary: "Copenhagen dominates. Scandinavian design-led market. Intimate celebrations trending. Summer season.",
    intentSignals: { high: ["copenhagen wedding venue book"], mid: ["best denmark wedding venues"], low: ["danish wedding traditions"] },
  },
  {
    id: "sweden", slug: "sweden", name: "Sweden", iso2: "SE", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Sweden | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues in Sweden. Stockholm archipelago, Swedish manor estates and midsummer celebrations, editorially selected.",
    evergreenContent: "Sweden offers Nordic elegance at scale, Stockholm's waterfront palaces, archipelago island ceremonies, rural manor houses and the magical light of midsummer create distinctly atmospheric celebrations.",
    focusKeywords: ["luxury wedding sweden", "stockholm wedding venue", "swedish castle wedding"],
    aiSummary: "Stockholm anchors demand. Midsummer weddings are cultural draw. Manor house and archipelago venues lead.",
    intentSignals: { high: ["stockholm wedding venue book"], mid: ["best sweden wedding venues"], low: ["swedish wedding traditions"] },
  },
  {
    id: "norway", slug: "norway", name: "Norway", iso2: "NO", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Norway | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues in Norway. Fjord ceremonies, stave churches and midnight sun celebrations, editorially selected.",
    evergreenContent: "Norway delivers nature at its most dramatic, fjord-edge ceremonies, medieval stave churches, mountain lodge retreats and the ethereal midnight sun create celebrations of raw, epic beauty.",
    focusKeywords: ["luxury wedding norway", "fjord wedding", "norway destination wedding"],
    aiSummary: "Fjord-wedding niche growing. Bergen and Lofoten lead. Adventure-elopement crossover. Summer midnight-sun season.",
    intentSignals: { high: ["norway fjord wedding venue"], mid: ["best norway wedding venues"], low: ["norwegian wedding traditions"] },
  },
  {
    id: "hungary", slug: "hungary", name: "Hungary", iso2: "HU", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Hungary | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in Hungary. Budapest thermal palaces and Hungarian wine country estates, editorially selected.",
    evergreenContent: "Budapest's thermal bath palaces, Danube-spanning bridges and Art Nouveau grandeur make Hungary an increasingly sought-after European wedding destination with exceptional value.",
    focusKeywords: ["luxury wedding hungary", "budapest wedding venue", "hungarian castle wedding"],
    aiSummary: "Budapest-centric market. Palace and thermal spa venues unique selling point. Outstanding value positioning.",
    intentSignals: { high: ["budapest palace wedding venue"], mid: ["best hungary wedding venues"], low: ["hungarian wedding traditions"] },
  },
  {
    id: "czechrepublic", slug: "czech-republic", name: "Czech Republic", iso2: "CZ", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Czech Republic | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues in the Czech Republic. Prague castle views and Bohemian château estates, editorially selected.",
    evergreenContent: "Prague's Gothic spires, Baroque palaces and cobblestone squares create one of Europe's most romantic cityscapes. Beyond the capital, Bohemian châteaux and Moravian vineyards offer pastoral elegance.",
    focusKeywords: ["luxury wedding prague", "prague wedding venue", "czech castle wedding"],
    aiSummary: "Prague dominates entirely. Castle and palace venues drive international demand. Strong value proposition vs Western Europe.",
    intentSignals: { high: ["prague castle wedding venue book"], mid: ["best czech republic wedding venues"], low: ["czech wedding traditions"] },
  },
  {
    id: "poland", slug: "poland", name: "Poland", iso2: "PL", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Poland | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues in Poland. Kraków's medieval grandeur and Polish palace estates, editorially selected.",
    evergreenContent: "Poland surprises with aristocratic elegance, Kraków's medieval market square, Wieliczka's salt cathedral, and the restored palace estates of the Polish countryside offer celebrations of unexpected grandeur.",
    focusKeywords: ["luxury wedding poland", "krakow wedding venue", "polish palace wedding"],
    aiSummary: "Kraków leads. Palace restoration creating new luxury supply. Strong value market. Growing international interest.",
    intentSignals: { high: ["krakow wedding venue book"], mid: ["best poland wedding venues"], low: ["polish wedding traditions"] },
  },
  {
    id: "romania", slug: "romania", name: "Romania", iso2: "RO", listingCount: 1,
    seoTitleTemplate: "Luxury Wedding Vendors in Romania | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in Romania. Transylvanian castles and Carpathian mountain retreats, editorially selected.",
    evergreenContent: "Romania's Transylvanian castles, Carpathian mountain lodges and painted monasteries offer a wildly romantic and refreshingly undiscovered European wedding destination.",
    focusKeywords: ["luxury wedding romania", "transylvania castle wedding"],
    aiSummary: "Pre-market luxury. Transylvanian castles drive awareness. Very early stage but architecture is extraordinary.",
    intentSignals: { high: [], mid: ["romania castle wedding venue"], low: ["romania wedding ideas"] },
  },
  {
    id: "gibraltar", slug: "gibraltar", name: "Gibraltar", iso2: "GI", listingCount: 1,
    seoTitleTemplate: "Luxury Wedding Vendors in Gibraltar | LWD",
    metaDescriptionTemplate: "Explore luxury wedding venues in Gibraltar. Rock of Gibraltar ceremonies and Mediterranean elopements, editorially selected.",
    evergreenContent: "Gibraltar offers Mediterranean elopement elegance, the iconic Rock backdrop, botanical gardens and sun-drenched terraces overlooking the Strait create compact celebrations with maximum drama.",
    focusKeywords: ["gibraltar wedding", "gibraltar elopement", "rock of gibraltar wedding"],
    aiSummary: "Elopement micro-destination. Legal simplicity drives demand. Very small market but loyal repeat planners.",
    intentSignals: { high: ["gibraltar wedding venue"], mid: [], low: ["gibraltar wedding ideas"] },
  },
  // ═══════════════════════════════════════════════════════════════════════
  // MIDDLE EAST, Extended
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "jordan", slug: "jordan", name: "Jordan", iso2: "JO", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Jordan | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in Jordan. Petra's rose-red ruins and Dead Sea desert luxury, editorially selected.",
    evergreenContent: "Jordan offers ancient wonder, Petra's Treasury carved from rose-red sandstone, Dead Sea floating ceremonies and Wadi Rum's Martian desert landscapes create celebrations of Biblical drama.",
    focusKeywords: ["luxury wedding jordan", "petra wedding", "dead sea wedding", "jordan destination wedding"],
    aiSummary: "Ultra-experiential niche. Petra and Dead Sea unique globally. Very small but high-spend market. Adventure-luxury crossover.",
    intentSignals: { high: ["petra wedding venue book"], mid: ["best jordan wedding venues"], low: ["jordan wedding ideas"] },
  },
  {
    id: "qatar", slug: "qatar", name: "Qatar", iso2: "QA", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Qatar | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues in Qatar. Doha's futuristic skyline and desert palace celebrations, editorially selected.",
    evergreenContent: "Qatar represents the new face of Gulf luxury, Doha's futuristic Museum of Islamic Art, desert palace hotels and the world's most ambitious hospitality infrastructure create celebrations of ultra-modern opulence.",
    focusKeywords: ["luxury wedding qatar", "doha wedding venue", "qatar destination wedding"],
    aiSummary: "Ultra-premium Gulf market. Post-World Cup infrastructure boom. Doha competing with Dubai for regional dominance.",
    intentSignals: { high: ["doha luxury wedding venue"], mid: ["best qatar wedding venues"], low: ["qatar wedding ideas"] },
  },
  {
    id: "oman", slug: "oman", name: "Oman", iso2: "OM", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Oman | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues in Oman. Muscat's royal grandeur and Arabian desert camp celebrations, editorially selected.",
    evergreenContent: "Oman offers Arabia's most understated luxury, Muscat's Sultan Qaboos Grand Mosque, the dramatic Hajar Mountains, fjord-like Musandam Peninsula and vast Wahiba Sands desert camps.",
    focusKeywords: ["luxury wedding oman", "muscat wedding venue", "oman desert wedding"],
    aiSummary: "Boutique alternative to Dubai. Authentic Arabian positioning. Emerging luxury resort infrastructure. Very exclusive.",
    intentSignals: { high: ["oman luxury wedding venue"], mid: ["best oman wedding venues"], low: ["oman wedding ideas"] },
  },
  // ═══════════════════════════════════════════════════════════════════════
  // ASIA, Extended
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "malaysia", slug: "malaysia", name: "Malaysia", iso2: "MY", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in Malaysia | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in Malaysia. Langkawi island resorts, KL skyscrapers and Borneo jungle lodges, editorially selected.",
    evergreenContent: "Malaysia blends tropical paradise with cosmopolitan flair, Langkawi's eagle-kissed islands, Kuala Lumpur's Twin Tower skyline, Penang's colonial charm and Borneo's ancient rainforest lodges.",
    focusKeywords: ["luxury wedding malaysia", "langkawi wedding venue", "kl wedding", "malaysia destination wedding"],
    aiSummary: "Langkawi leads destination segment. KL for urban luxury. Strong regional (Singaporean, Australian) demand.",
    intentSignals: { high: ["langkawi resort wedding book", "kl wedding planner"], mid: ["best malaysia wedding venues"], low: ["malaysian wedding traditions"] },
  },
  {
    id: "singapore", slug: "singapore", name: "Singapore", iso2: "SG", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in Singapore | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues in Singapore. Marina Bay glamour, colonial Raffles elegance and tropical garden ceremonies, editorially selected.",
    evergreenContent: "Singapore condenses Asian luxury into a city-state, Marina Bay Sands' infinity pool terraces, the colonial grandeur of Raffles Hotel and the UNESCO Botanic Gardens create celebrations of immaculate precision.",
    focusKeywords: ["luxury wedding singapore", "singapore wedding venue", "marina bay wedding", "raffles wedding"],
    aiSummary: "Asia's highest per-wedding spend city. Hotel and garden venues dominate. Year-round. Strong expat and regional demand.",
    intentSignals: { high: ["singapore luxury wedding venue book", "raffles wedding planner"], mid: ["best singapore wedding venues"], low: ["singapore wedding ideas"] },
  },
  {
    id: "philippines", slug: "philippines", name: "Philippines", iso2: "PH", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in the Philippines | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues in the Philippines. Palawan lagoons, Boracay beaches and Cebu island luxury, editorially selected.",
    evergreenContent: "The Philippines offers 7,641 islands of tropical possibility, Palawan's emerald lagoons, Boracay's powder-white beaches and Cebu's coral-fringed resort coastline create island wedding paradise.",
    focusKeywords: ["luxury wedding philippines", "palawan wedding", "boracay wedding venue", "philippines destination wedding"],
    aiSummary: "Island-resort destination. Palawan luxury segment growing. Boracay high-volume. Strong domestic and expat market.",
    intentSignals: { high: ["palawan resort wedding book"], mid: ["best philippines wedding venues"], low: ["philippine wedding traditions"] },
  },
  {
    id: "vietnam", slug: "vietnam", name: "Vietnam", iso2: "VN", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Vietnam | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in Vietnam. Hoi An lantern-lit ceremonies and Ha Long Bay floating celebrations, editorially selected.",
    evergreenContent: "Vietnam enchants with atmospheric beauty, Hoi An's lantern-draped ancient town, Ha Long Bay's emerald karst seascape and the terraced mountains of Sapa create celebrations of profound cultural richness.",
    focusKeywords: ["luxury wedding vietnam", "hoi an wedding venue", "vietnam destination wedding"],
    aiSummary: "Emerging destination. Hoi An dominates luxury search. Ha Long Bay experiential niche. Outstanding value positioning.",
    intentSignals: { high: ["hoi an wedding venue book"], mid: ["best vietnam wedding venues"], low: ["vietnam wedding ideas"] },
  },
  // ═══════════════════════════════════════════════════════════════════════
  // AMERICAS, Extended
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "canada", slug: "canada", name: "Canada", iso2: "CA", listingCount: 4,
    seoTitleTemplate: "Luxury Wedding Vendors in Canada | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues across Canada. Rocky Mountain lodges, Niagara vineyards and Whistler alpine elegance, editorially selected.",
    evergreenContent: "Canada delivers nature at a grand scale, Banff's turquoise glacier lakes, Whistler's mountain-top ceremonies, Niagara's vineyard estates and the cosmopolitan elegance of Toronto and Montreal.",
    focusKeywords: ["luxury wedding canada", "banff wedding venue", "whistler wedding", "canada destination wedding"],
    aiSummary: "Rocky Mountain weddings drive international demand. Banff and Whistler lead. Toronto/Montreal for urban luxury. Summer season.",
    intentSignals: { high: ["banff wedding venue book", "whistler wedding planner"], mid: ["best canada wedding venues"], low: ["canadian wedding traditions"] },
  },
  {
    id: "costarica", slug: "costa-rica", name: "Costa Rica", iso2: "CR", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in Costa Rica | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues in Costa Rica. Rainforest canopy ceremonies, Pacific beach villas and volcanic hot springs, editorially selected.",
    evergreenContent: "Costa Rica pioneers eco-luxury weddings, rainforest canopy walkways, Pacific sunset cliff ceremonies, volcanic hot spring receptions and wildlife-rich cloud forest lodges create celebrations connected to nature.",
    focusKeywords: ["luxury wedding costa rica", "costa rica wedding venue", "eco wedding costa rica"],
    aiSummary: "Eco-luxury niche leader. Pacific coast and Arenal volcano lead. Strong US demand. Year-round tropical season.",
    intentSignals: { high: ["costa rica luxury wedding venue book"], mid: ["best costa rica wedding venues"], low: ["costa rica wedding ideas"] },
  },
  {
    id: "brazil", slug: "brazil", name: "Brazil", iso2: "BR", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in Brazil | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in Brazil. Rio's Sugarloaf drama, Trancoso beach luxury and São Paulo sophistication, editorially selected.",
    evergreenContent: "Brazil celebrates with infectious joy, Rio de Janeiro's Sugarloaf Mountain views, Trancoso's bohemian-luxe beach, São Paulo's fashion-forward elegance and the colonial charm of Bahia.",
    focusKeywords: ["luxury wedding brazil", "rio wedding venue", "trancoso wedding", "brazil destination wedding"],
    aiSummary: "Largest Latin American domestic market. Trancoso drives destination luxury. Rio iconic but urban. Growing international interest.",
    intentSignals: { high: ["rio wedding venue book", "trancoso wedding planner"], mid: ["best brazil wedding venues"], low: ["brazilian wedding traditions"] },
  },
  {
    id: "colombia", slug: "colombia", name: "Colombia", iso2: "CO", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Colombia | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues in Colombia. Cartagena's walled-city romance and Caribbean island escapes, editorially selected.",
    evergreenContent: "Colombia's colonial jewel Cartagena, with its pastel-walled old city, rooftop terraces and nearby Rosario Islands, has emerged as Latin America's most romantic luxury wedding destination.",
    focusKeywords: ["luxury wedding colombia", "cartagena wedding venue", "colombia destination wedding"],
    aiSummary: "Cartagena dominates entirely. Colonial-city wedding niche growing fast. Strong US demand. Year-round Caribbean climate.",
    intentSignals: { high: ["cartagena wedding venue book"], mid: ["best colombia wedding venues"], low: ["colombian wedding traditions"] },
  },
  {
    id: "argentina", slug: "argentina", name: "Argentina", iso2: "AR", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Argentina | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues in Argentina. Buenos Aires tango elegance and Mendoza wine country, editorially selected.",
    evergreenContent: "Argentina marries passionate culture with natural grandeur, Buenos Aires' tango-infused elegance, Mendoza's Andes-backed vineyards and Patagonia's glacial wilderness create celebrations of South American sophistication.",
    focusKeywords: ["luxury wedding argentina", "buenos aires wedding", "mendoza winery wedding"],
    aiSummary: "Buenos Aires urban-luxury plus Mendoza wine country. Niche but growing. Tango cultural element unique differentiator.",
    intentSignals: { high: ["buenos aires wedding venue book"], mid: ["best argentina wedding venues"], low: ["argentine wedding traditions"] },
  },
  {
    id: "bahamas", slug: "bahamas", name: "Bahamas", iso2: "BS", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in the Bahamas | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in the Bahamas. Private island escapes, Nassau elegance and Exuma swimming pigs, editorially selected.",
    evergreenContent: "The Bahamas defines tropical luxury, the pink sands of Harbour Island, Exuma's swimming pigs cays, Nassau's Atlantis grandeur and private island buyouts create the ultimate Caribbean wedding escape.",
    focusKeywords: ["luxury wedding bahamas", "bahamas wedding venue", "harbour island wedding", "exuma wedding"],
    aiSummary: "Ultra-luxury Caribbean. Private island and resort-exclusive model. Strong US East Coast and celebrity demand.",
    intentSignals: { high: ["bahamas private island wedding book", "harbour island wedding venue"], mid: ["best bahamas wedding venues"], low: ["bahamas wedding ideas"] },
  },
  // ═══════════════════════════════════════════════════════════════════════
  // INDIAN OCEAN, Extended
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "mauritius", slug: "mauritius", name: "Mauritius", iso2: "MU", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in Mauritius | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues in Mauritius. Le Morne peninsula, Grand Baie resorts and tropical garden ceremonies, editorially selected.",
    evergreenContent: "Mauritius blends tropical paradise with French-Creole sophistication, Le Morne's dramatic basalt rock, Grand Baie's resort coastline and sugar-plantation estates create a refined Indian Ocean wedding destination.",
    focusKeywords: ["luxury wedding mauritius", "mauritius wedding venue", "mauritius beach wedding", "mauritius destination wedding"],
    aiSummary: "Premium Indian Ocean destination. Resort-wedding model dominates. Strong South African, UK and French demand. Year-round.",
    intentSignals: { high: ["mauritius resort wedding book", "mauritius wedding planner"], mid: ["best mauritius wedding venues"], low: ["mauritius wedding ideas"] },
  },
  {
    id: "seychelles", slug: "seychelles", name: "Seychelles", iso2: "SC", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Seychelles | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in Seychelles. Granite boulder beaches, private island resorts and coral reef ceremonies, editorially selected.",
    evergreenContent: "Seychelles offers prehistoric beauty, giant granite boulders framing pristine beaches, private island resorts, lush jungle mountains and the world's most exclusive honeymoon-wedding combination destination.",
    focusKeywords: ["luxury wedding seychelles", "seychelles wedding venue", "seychelles beach wedding"],
    aiSummary: "Ultra-exclusive island market. Private island resorts lead. Honeymoon-wedding combination dominant model. Very high per-night spend.",
    intentSignals: { high: ["seychelles private island wedding"], mid: ["best seychelles wedding venues"], low: ["seychelles wedding ideas"] },
  },
  {
    id: "fiji", slug: "fiji", name: "Fiji", iso2: "FJ", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Fiji | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues in Fiji. Private island buyouts, coral reef ceremonies and traditional Fijian blessings, editorially selected.",
    evergreenContent: "Fiji's 333 islands offer the South Pacific dream, private island resort buyouts, coral reef snorkelling receptions, traditional Fijian warrior blessings and some of the world's friendliest hospitality.",
    focusKeywords: ["luxury wedding fiji", "fiji wedding venue", "fiji island wedding", "fiji destination wedding"],
    aiSummary: "Pacific island premium destination. Private island model. Strong Australian and NZ demand. Traditional blessing ceremonies unique.",
    intentSignals: { high: ["fiji private island wedding book"], mid: ["best fiji wedding venues"], low: ["fiji wedding ideas"] },
  },
  // ═══════════════════════════════════════════════════════════════════════
  // AFRICA, Extended
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "tanzania", slug: "tanzania", name: "Tanzania", iso2: "TZ", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Tanzania | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in Tanzania. Zanzibar spice island, Serengeti safari lodges and Kilimanjaro views, editorially selected.",
    evergreenContent: "Tanzania pairs wildlife spectacle with island paradise, Serengeti safari lodge ceremonies, Ngorongoro Crater rim celebrations and Zanzibar's Stone Town spice-scented lanes and white-sand beaches.",
    focusKeywords: ["luxury wedding tanzania", "zanzibar wedding venue", "serengeti wedding", "tanzania safari wedding"],
    aiSummary: "Zanzibar beach + Serengeti safari dual proposition. Small but ultra-premium. Strong honeymoon-wedding combination.",
    intentSignals: { high: ["zanzibar wedding venue book", "serengeti lodge wedding"], mid: ["best tanzania wedding venues"], low: ["tanzania wedding ideas"] },
  },
  {
    id: "egypt", slug: "egypt", name: "Egypt", iso2: "EG", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Egypt | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues in Egypt. Pyramids of Giza backdrop, Red Sea resorts and Nile cruise celebrations, editorially selected.",
    evergreenContent: "Egypt offers 5,000 years of romance, the Pyramids of Giza as wedding backdrop, Nile felucca receptions, Red Sea resort luxury and the ancient temples of Luxor create celebrations of monumental drama.",
    focusKeywords: ["luxury wedding egypt", "pyramids wedding", "red sea wedding", "egypt destination wedding"],
    aiSummary: "Iconic backdrop market. Pyramid-view ceremonies unique globally. Red Sea resort weddings growing. Nile cruise receptions niche.",
    intentSignals: { high: ["egypt pyramids wedding venue"], mid: ["best egypt wedding venues"], low: ["egypt wedding ideas"] },
  },
  {
    id: "cambodia", slug: "cambodia", name: "Cambodia", iso2: "KH", listingCount: 0,
    seoTitleTemplate: "Luxury Wedding Vendors in Cambodia | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in Cambodia. Angkor Wat temple ceremonies, Siem Reap jungle resorts and Phnom Penh elegance, editorially selected.",
    evergreenContent: "Cambodia offers ancient grandeur meets tropical luxury. Temple ceremonies with Angkor Wat as backdrop, jungle-canopy resorts in Siem Reap and the emerging sophistication of Phnom Penh create weddings of extraordinary cultural depth.",
    focusKeywords: ["luxury wedding cambodia", "angkor wat wedding", "siem reap wedding venue", "cambodia destination wedding", "phnom penh wedding"],
    aiSummary: "Emerging Southeast Asian destination. Angkor Wat ceremonies are the unique draw. Siem Reap resort infrastructure growing. Ultra-high-value niche market.",
    intentSignals: { high: ["angkor wat wedding venue"], mid: ["best cambodia wedding venues", "siem reap luxury wedding"], low: ["cambodia wedding ideas", "getting married in cambodia"] },
  },
];


/**
 * Derive dropdown options from the canonical registry.
 * Use this anywhere a <select> or dropdown needs country options.
 * @returns {Array<{value: string, label: string}>}
 */
// Pinned countries appear first in this order, then alphabetical for the rest.
const PINNED_SLUGS = ["england", "italy"];

export function getCountryOptions() {
  const pinned = [];
  const rest = [];
  for (const c of COUNTRY_REGISTRY) {
    const opt = { value: c.slug, label: c.name };
    if (PINNED_SLUGS.includes(c.slug)) {
      pinned.push(opt);
    } else {
      rest.push(opt);
    }
  }
  // Pinned in declared order, rest alphabetical
  pinned.sort((a, b) => PINNED_SLUGS.indexOf(a.value) - PINNED_SLUGS.indexOf(b.value));
  rest.sort((a, b) => a.label.localeCompare(b.label));
  return [...pinned, ...rest];
}

/**
 * Look up a country by slug from the canonical registry.
 * @param {string} slug
 * @returns {Object|undefined}
 */
export function getCountryBySlug(slug) {
  return COUNTRY_REGISTRY.find(c => c.slug === slug);
}

// Legacy alias — AdminDashboard still references DIRECTORY_COUNTRIES
export const DIRECTORY_COUNTRIES = COUNTRY_REGISTRY;
