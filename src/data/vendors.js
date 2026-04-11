// ─── src/data/vendors.js ──────────────────────────────────────────────────────
import { hydrateScores } from "../engine/index.js";

export const VENDORS = [
  // ── Planners ────────────────────────────────────────────────────────────────
  {
    id: "vdr-1",
    type: "vendor",
    category: "planner",
    name: "Fiore Events",
    region: "Tuscany",
    city: "Florence",
    countrySlug: "italy", regionSlug: "tuscany", citySlug: "florence",
    lat: 43.7696, lng: 11.2558, online: true,
    rating: 4.9,
    reviews: 64,
    priceLabel: "££££",
    priceFrom: "£8,000",
    verified: true, lwdScore: 91,
    tag: "Top Planner",
    serviceTier: "Full Planning",
    email: "hello@fioreevents.it",
    phone: "+39 055 123 4567",
    whatsapp: "+393551234567",
    desc: "Florence-based luxury wedding planning studio specialising in villa celebrations for international couples.",
    specialties: ["Luxury Villa Weddings", "Full-Service Coordination", "International Couples", "Legal Guidance"],
    imgs: [
      "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=900&q=80",
    ],
    videoUrl: "https://videos.pexels.com/video-files/3312923/3312923-hd_1920_1080_30fps.mp4",
    videos: [
      {
        id: "fiore-v1",
        youtubeId: "LXb3EKWsInQ",
        thumb: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=900&q=80",
        title: "Villa Medicea, Summer 2024",
        type: "wedding",
        duration: "3:42",
        desc: "A golden afternoon ceremony in the heart of Tuscany. Full planning and coordination by Fiore Events.",
        videographer: { name: "Marco Visconti Films", area: "Florence", instagram: "@marcoviscontifilms", camera: "Sony FX3" },
        tags: ["Villa", "Summer", "Full Planning", "Ceremony"],
      },
      {
        id: "fiore-v2",
        youtubeId: "LXb3EKWsInQ",
        thumb: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80",
        title: "Chianti Hills, Harvest Wedding",
        type: "wedding",
        duration: "4:15",
        desc: "An intimate vineyard celebration with 60 guests from across Europe. Set against rolling Chianti hills at golden hour.",
        videographer: { name: "Luca Ferrini Studio", area: "Siena", instagram: "@lucaferrinistudio", camera: "RED Komodo 6K" },
        tags: ["Vineyard", "Intimate", "Destination", "Chianti"],
      },
      {
        id: "fiore-v3",
        youtubeId: "LXb3EKWsInQ",
        thumb: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=900&q=80",
        title: "Fiesole Garden, The Ceremony",
        type: "tour",
        duration: "2:58",
        desc: "Elevated restraint. A garden ceremony that felt utterly effortless, 40 guests, zero detail out of place.",
        videographer: { name: "Marco Visconti Films", area: "Florence", instagram: "@marcoviscontifilms", camera: "Sony FX3" },
        tags: ["Garden", "Ceremony", "Fiesole", "Intimate"],
      },
    ],
    socials: { instagram: "https://instagram.com/fiore.events", tiktok: "https://tiktok.com/@fioreevents", pinterest: "https://pinterest.com/fioreevents", website: "https://fioreevents.it" },
    realWeddings: [
      { title: "A Golden Afternoon at Villa Medicea", imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80", blogUrl: "/blog/golden-afternoon-villa-medicea", location: "Florence, Tuscany" },
      { title: "Chianti Hills Sunset Celebration", imageUrl: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=900&q=80", blogUrl: "/blog/chianti-hills-sunset", location: "Chianti, Tuscany" },
      { title: "An Intimate Garden Wedding in Fiesole", imageUrl: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=900&q=80", blogUrl: "/blog/intimate-garden-fiesole", location: "Fiesole, Tuscany" },
    ],
    // ── Enriched fields for vendor profile demo ──
    owner: {
      name: "Giulia Marchetti",
      title: "Lead Planner & Founder",
      photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
      bio: "Every wedding I plan starts with listening, to the couple, to the setting, to the story that wants to unfold.",
      memberSince: 2019,
    },
    responseTime: "Under 24h",
    responseRate: 98,
    weddingsPlanned: 120,
    languages: ["English", "Italian", "French"],
    planningStyle: "Modern, editorial, detail-obsessed",
    travelPolicy: "Italy-wide, international by arrangement",
    coverage: ["Tuscany", "Umbria", "Lazio", "Liguria"],
    editorial: "Fiore Events is a Florence-based luxury planning studio led by Giulia Marchetti. Since 2019, the team has orchestrated over 120 celebrations across Tuscany and beyond,each one shaped by the couple's story, not a formula. Expect strong creative direction, a curated vendor network built over a decade, and a calm, authoritative presence on the day that lets you be fully present. From navigating Italian legal paperwork to sourcing the perfect linen for a vineyard dinner under the stars, Fiore handles every layer so the celebration reads beautifully in memory and in photography.",
    testimonials: [
      { quote: "Giulia understood our vision before we could even articulate it. Every single detail was considered, and our guests still talk about that evening under the Tuscan sky.", couple: "Sarah & James", location: "Villa Medicea, Tuscany", date: "June 2024" },
      { quote: "We were planning from London with no idea how Italian weddings work. Fiore made the entire process feel effortless,legal paperwork, vendors, timeline, everything.", couple: "Emma & Luca", location: "Chianti Hills", date: "September 2023" },
      { quote: "The level of taste and restraint was extraordinary. Nothing was overdone, nothing was missed. It was exactly us, but elevated beyond what we imagined.", couple: "Priya & Marco", location: "Fiesole", date: "May 2024" },
    ],
    packages: [
      { name: "Full Planning", price: 12000, features: ["Complete creative direction", "Vendor sourcing & management", "Budget tracking & negotiation", "Timeline & logistics", "On-the-day coordination", "Post-wedding wrap-up"], highlighted: true },
      { name: "Partial Planning", price: 8000, features: ["Design consultation", "Vendor recommendations", "Timeline creation", "Month-of check-ins", "On-the-day coordination"] },
      { name: "Day Coordination", price: 4500, features: ["Detailed timeline build", "Vendor confirmation", "Rehearsal management", "Full day-of coordination", "Emergency kit"] },
    ],
    approachSteps: [
      { title: "Discovery Call", description: "A calm, focused conversation to understand the feeling you want, the guest journey, and the non-negotiables. We listen before we plan." },
      { title: "Design & Curation", description: "Creative direction, mood boarding, venue scouting, and hand-picking every vendor. Your celebration takes shape around a cohesive vision." },
      { title: "Flawless Execution", description: "On the day, we run point,managing every vendor, protecting your timeline, and making sure you never see the machinery behind the magic." },
    ],
  },
  {
    id: "vdr-2",
    type: "vendor",
    category: "planner",
    name: "Amalfi Atelier",
    region: "Campania",
    city: "Ravello",
    countrySlug: "italy", regionSlug: "amalfi-coast", citySlug: "ravello", legacyRegionName: "Campania",
    lat: 40.6497, lng: 14.6122, online: true,
    rating: 4.8,
    reviews: 41,
    priceLabel: "££££",
    priceFrom: "£9,500",
    verified: true, lwdScore: 86,
    tag: "Clifftop Specialist",
    serviceTier: "Full Planning",
    email: "info@amalfiatelier.com",
    phone: "+39 089 876 5432",
    whatsapp: "+393898765432",
    desc: "Boutique planning atelier dedicated to intimate clifftop weddings along the Amalfi Coast.",
    specialties: ["Clifftop Venues", "Intimate Ceremonies", "Floral Art Direction", "Destination Logistics"],
    imgs: [
      "https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1522413452208-996ff3f3e740?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=900&q=80",
    ],
    videoUrl: "https://videos.pexels.com/video-files/3327560/3327560-hd_1920_1080_30fps.mp4",
    socials: { instagram: "https://instagram.com/amalfiatelier", tiktok: "https://tiktok.com/@amalfiatelier", website: "https://amalfiatelier.com" },
    realWeddings: [
      { title: "Ravello Terrace with Ocean Views", imageUrl: "https://images.unsplash.com/photo-1522413452208-996ff3f3e740?auto=format&fit=crop&w=900&q=80", blogUrl: "/blog/ravello-terrace-ocean-views", location: "Ravello, Amalfi Coast" },
      { title: "A Pastel Morning in Positano", imageUrl: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=900&q=80", blogUrl: "/blog/pastel-morning-positano", location: "Positano, Amalfi Coast" },
    ],
  },
  {
    id: "vdr-3",
    type: "vendor",
    category: "planner",
    name: "Lacus Weddings",
    region: "Lombardy",
    city: "Bellagio",
    countrySlug: "italy", regionSlug: "lake-como", citySlug: "bellagio", legacyRegionName: "Lombardy",
    lat: 45.9862, lng: 9.2619, online: false,
    rating: 4.7,
    reviews: 38,
    priceLabel: "£££",
    priceFrom: "£6,500",
    verified: false, lwdScore: 72,
    tag: null,
    serviceTier: "Day Coordination",
    email: "info@lacusweddings.com",
    phone: "+39 031 234 5678",
    whatsapp: "+393312345678",
    desc: "Lake Como planning house with a deep supplier network and meticulous day-of coordination.",
    specialties: ["Lake Venues", "Multi-Day Celebrations", "Supplier Network", "Day-Of Coordination"],
    imgs: [
      "https://images.unsplash.com/photo-1538332576228-eb5b4c4de6f5?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1530023367847-a683933f4172?auto=format&fit=crop&w=900&q=80",
    ],
    videoUrl: "https://videos.pexels.com/video-files/2747754/2747754-hd_1920_1080_30fps.mp4",
    socials: { instagram: "https://instagram.com/lacusweddings", pinterest: "https://pinterest.com/lacusweddings", website: "https://lacusweddings.com" },
    realWeddings: [
      { title: "Villa Balbiano Lakeside Affair", imageUrl: "https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=900&q=80", blogUrl: "/blog/villa-balbiano-lakeside", location: "Lenno, Lake Como" },
    ],
  },

  // ── New planners ──────────────────────────────────────────────────────────────
  {
    id: "vdr-13",
    type: "vendor",
    category: "planner",
    name: "Serena Ferrara Weddings",
    region: "Sicily",
    city: "Taormina",
    countrySlug: "italy", regionSlug: "sicily", citySlug: "taormina",
    lat: 37.8516, lng: 15.2866, online: true,
    rating: 4.9,
    reviews: 57,
    priceLabel: "££££",
    priceFrom: "£7,500",
    verified: true, lwdScore: 89,
    tag: "Sicily Expert",
    serviceTier: "Full Planning",
    email: "serena@serenaferraraweddings.it",
    phone: "+39 0942 234 567",
    whatsapp: "+393420234567",
    desc: "Award-winning Taormina planner crafting dramatic Sicilian celebrations with volcanic backdrops, citrus-grove receptions, and an unrivalled local network.",
    specialties: ["Sicilian Traditions", "Villa & Estate Weddings", "Cultural Integration", "Full Logistics"],
    imgs: [
      "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80",
    ],
    videoUrl: "https://videos.pexels.com/video-files/3195394/3195394-hd_1920_1080_25fps.mp4",
    socials: { instagram: "https://instagram.com/serenaferraraweddings", tiktok: "https://tiktok.com/@serenaferrara", website: "https://serenaferraraweddings.it" },
    realWeddings: [
      { title: "Etna Sunset at a Historic Palazzo", imageUrl: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80", blogUrl: "/blog/etna-sunset-palazzo", location: "Taormina, Sicily" },
      { title: "Citrus Grove Celebration in Syracuse", imageUrl: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80", blogUrl: "/blog/citrus-grove-syracuse", location: "Syracuse, Sicily" },
    ],
  },
  {
    id: "vdr-14",
    type: "vendor",
    category: "planner",
    name: "Oltre Wedding Studio",
    region: "Veneto",
    city: "Venice",
    countrySlug: "italy", regionSlug: "venice", citySlug: "venice", legacyRegionName: "Veneto",
    lat: 45.4408, lng: 12.3155, online: true,
    rating: 4.8,
    reviews: 46,
    priceLabel: "££££",
    priceFrom: "£10,000",
    verified: true, lwdScore: 85,
    tag: "Venice Specialist",
    serviceTier: "Full Planning",
    email: "studio@oltreweddingstudio.com",
    phone: "+39 041 567 8901",
    whatsapp: "+393415678901",
    desc: "Venice's leading destination wedding studio orchestrating palazzo ceremonies, gondola processions, and moonlit canal receptions.",
    specialties: ["Palazzo Weddings", "Canal-Side Receptions", "Luxury Logistics", "Bespoke Stationery"],
    imgs: [
      "https://images.unsplash.com/photo-1514893037997-35f7d4fc694b?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1478146059778-26028b07395a?auto=format&fit=crop&w=900&q=80",
    ],
    videoUrl: "https://videos.pexels.com/video-files/3843433/3843433-hd_1920_1080_24fps.mp4",
    socials: { instagram: "https://instagram.com/oltreweddingstudio", tiktok: "https://tiktok.com/@oltreweddings", pinterest: "https://pinterest.com/oltreweddings", website: "https://oltreweddingstudio.com" },
    realWeddings: [
      { title: "A Candlelit Palazzo Wedding on the Grand Canal", imageUrl: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=80", blogUrl: "/blog/candlelit-palazzo-grand-canal", location: "Venice, Veneto" },
      { title: "Murano Glass and Midnight Vows", imageUrl: "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?auto=format&fit=crop&w=900&q=80", blogUrl: "/blog/murano-glass-midnight-vows", location: "Murano, Venice" },
      { title: "Spring Garden Party at Ca Sagredo", imageUrl: "https://images.unsplash.com/photo-1478146059778-26028b07395a?auto=format&fit=crop&w=900&q=80", blogUrl: "/blog/spring-garden-ca-sagredo", location: "Venice, Veneto" },
    ],
  },
  {
    id: "vdr-15",
    type: "vendor",
    category: "planner",
    name: "Nozze & Co.",
    region: "Tuscany",
    city: "San Gimignano",
    countrySlug: "italy", regionSlug: "tuscany", citySlug: "san-gimignano",
    lat: 43.4677, lng: 11.0437, online: false,
    rating: 4.6,
    reviews: 29,
    priceLabel: "£££",
    priceFrom: "£4,800",
    verified: false, lwdScore: 68,
    tag: null,
    serviceTier: "Partial Planning",
    email: "ciao@nozzeco.it",
    phone: "+39 0577 345 678",
    whatsapp: "+393577345678",
    desc: "Relaxed yet refined partial planning service for couples who want expert guidance without full-service commitment. Tuscan hilltop specialists.",
    specialties: ["Partial Planning", "Hilltop Venues", "Vendor Shortlisting", "Timeline Management"],
    imgs: [
      "https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=900&q=80",
    ],
    videoUrl: "https://videos.pexels.com/video-files/3205918/3205918-hd_1920_1080_25fps.mp4",
    socials: { instagram: "https://instagram.com/nozzeco", website: "https://nozzeco.it" },
    realWeddings: [
      { title: "Hilltop Vows in San Gimignano", imageUrl: "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&w=900&q=80", blogUrl: "/blog/hilltop-vows-san-gimignano", location: "San Gimignano, Tuscany" },
    ],
  },
  {
    id: "vdr-16",
    type: "vendor",
    category: "planner",
    name: "La Dolce Vita Weddings",
    region: "Umbria",
    city: "Orvieto",
    countrySlug: "italy", regionSlug: "umbria", citySlug: "orvieto",
    lat: 42.7186, lng: 12.1106, online: true,
    rating: 4.8,
    reviews: 33,
    priceLabel: "£££",
    priceFrom: "£5,500",
    verified: true, lwdScore: 79,
    tag: "Design Led",
    serviceTier: "Design and Styling",
    email: "design@ladolcevitaweddings.it",
    phone: "+39 0763 456 789",
    whatsapp: "+393763456789",
    desc: "Umbria-based design and styling studio transforming rustic estates into editorial tableaux. Known for colour-palette mastery and statement installations.",
    specialties: ["Design and Styling", "Colour Palette Direction", "Statement Installations", "Rustic Luxe"],
    imgs: [
      "https://images.unsplash.com/photo-1505932794465-147d1f1b2c97?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1470290378698-263fa7ca60ab?auto=format&fit=crop&w=900&q=80",
    ],
    videoUrl: "https://videos.pexels.com/video-files/4553298/4553298-hd_1920_1080_25fps.mp4",
    socials: { instagram: "https://instagram.com/ladolcevitaweddings", tiktok: "https://tiktok.com/@ladolcevitawed", pinterest: "https://pinterest.com/ladolcevitawed", website: "https://ladolcevitaweddings.it" },
    realWeddings: [
      { title: "Olive Grove Elegance in Orvieto", imageUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80", blogUrl: "/blog/olive-grove-elegance-orvieto", location: "Orvieto, Umbria" },
      { title: "Terracotta and Sage at Castello di Titignano", imageUrl: "https://images.unsplash.com/photo-1470290378698-263fa7ca60ab?auto=format&fit=crop&w=900&q=80", blogUrl: "/blog/terracotta-sage-titignano", location: "Titignano, Umbria" },
    ],
  },

  // ── New planners (vdr-17, vdr-18) ────────────────────────────────────────────
  {
    id: "vdr-17",
    type: "vendor",
    category: "planner",
    name: "Riviera Nuptials",
    region: "Liguria",
    city: "Portofino",
    countrySlug: "italy", regionSlug: "italian-riviera", citySlug: "portofino",
    lat: 44.3036, lng: 9.2097, online: true,
    rating: 4.8,
    reviews: 42,
    priceLabel: "££££",
    priceFrom: "£11,000",
    verified: true, lwdScore: 83,
    tag: "Riviera Elite",
    serviceTier: "Full Planning",
    email: "enquiries@rivieranuptials.com",
    phone: "+39 0185 567 890",
    whatsapp: "+393185567890",
    desc: "Portofino's premier wedding planning house curating harbour-side celebrations, yacht arrivals, and Ligurian sunset ceremonies for an international clientele.",
    specialties: ["Harbour-Side Celebrations", "Yacht Logistics", "Luxury Elopements", "Riviera Cuisine"],
    imgs: [
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=900&q=80",
    ],
    videoUrl: "https://videos.pexels.com/video-files/2829177/2829177-hd_1920_1080_30fps.mp4",
    socials: { instagram: "https://instagram.com/rivieranuptials", pinterest: "https://pinterest.com/rivieranuptials", website: "https://rivieranuptials.com" },
    realWeddings: [
      { title: "Harbour Sunset in Portofino", imageUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80", blogUrl: "/blog/harbour-sunset-portofino", location: "Portofino, Italian Riviera" },
      { title: "A Ligurian Cliff Elopement", imageUrl: "https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?auto=format&fit=crop&w=900&q=80", blogUrl: "/blog/ligurian-cliff-elopement", location: "Cinque Terre, Italian Riviera" },
    ],
  },
  {
    id: "vdr-18",
    type: "vendor",
    category: "planner",
    name: "Puglia Promises",
    region: "Puglia",
    city: "Ostuni",
    countrySlug: "italy", regionSlug: "puglia", citySlug: "ostuni",
    lat: 40.7256, lng: 17.5780, online: true,
    rating: 4.7,
    reviews: 36,
    priceLabel: "£££",
    priceFrom: "£6,200",
    verified: true, lwdScore: 77,
    tag: "Puglia Expert",
    serviceTier: "Full Planning",
    email: "hello@pugliapromises.com",
    phone: "+39 0831 678 901",
    whatsapp: "+393831678901",
    desc: "Ostuni-based planning studio specialising in masseria weddings, olive-grove receptions, and whitewashed rooftop celebrations across Puglia's sun-drenched countryside.",
    specialties: ["Masseria Weddings", "Olive Grove Receptions", "Rustic Elegance", "Destination Logistics"],
    imgs: [
      "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1530023367847-a683933f4172?auto=format&fit=crop&w=900&q=80",
    ],
    videoUrl: "https://videos.pexels.com/video-files/3205918/3205918-hd_1920_1080_25fps.mp4",
    socials: { instagram: "https://instagram.com/pugliapromises", tiktok: "https://tiktok.com/@pugliapromises", website: "https://pugliapromises.com" },
    realWeddings: [
      { title: "Masseria Moroseta Magic", imageUrl: "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=900&q=80", blogUrl: "/blog/masseria-moroseta-magic", location: "Ostuni, Puglia" },
      { title: "Olive Trees and Fairy Lights in Lecce", imageUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=80", blogUrl: "/blog/olive-trees-fairy-lights-lecce", location: "Lecce, Puglia" },
    ],
  },

  // ── Photographers ────────────────────────────────────────────────────────────
  {
    id: "vdr-4",
    type: "vendor",
    category: "photographer",
    name: "Luce Studio",
    region: "Tuscany",
    city: "Siena",
    countrySlug: "italy", regionSlug: "tuscany", citySlug: "siena",
    lat: 43.3188, lng: 11.3307, online: true,
    rating: 5.0,
    reviews: 112,
    priceLabel: "££££",
    priceFrom: "£4,200",
    verified: true, lwdScore: 95,
    tag: "Award Winning",
    desc: "Editorial fine-art photographers capturing golden-hour Tuscany light with a cinematic eye.",
    specialties: ["Fine Art Editorial", "Golden Hour", "Film + Digital", "Two-Photographer Teams"],
    imgs: [
      "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    id: "vdr-5",
    type: "vendor",
    category: "photographer",
    name: "Miraggio Images",
    region: "Sicily",
    city: "Taormina",
    countrySlug: "italy", regionSlug: "sicily", citySlug: "taormina",
    lat: 37.8516, lng: 15.2866, online: false,
    rating: 4.8,
    reviews: 77,
    priceLabel: "£££",
    priceFrom: "£2,900",
    verified: true, lwdScore: 82,
    tag: null,
    desc: "Sicily-based photographic duo blending documentary storytelling with couture portraiture.",
    specialties: ["Documentary Style", "Destination Travel", "Engagement Sessions", "Album Design"],
    imgs: [
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    id: "vdr-6",
    type: "vendor",
    category: "photographer",
    name: "Cielo & Co.",
    region: "Lombardy",
    city: "Lake Como",
    countrySlug: "italy", regionSlug: "lake-como", legacyRegionName: "Lombardy",
    lat: 45.9862, lng: 9.2619, online: true,
    rating: 4.9,
    reviews: 93,
    priceLabel: "££££",
    priceFrom: "£5,100",
    verified: true, lwdScore: 89,
    tag: "Top Rated",
    desc: "Lake Como's most sought-after photography studio, known for atmospheric light and timeless framing.",
    specialties: ["Lake & Villa Shoots", "Luxury Portraits", "Videography Add-On", "International Clients"],
    imgs: [
      "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=900&q=80",
    ],
  },

  // ── Florists ─────────────────────────────────────────────────────────────────
  {
    id: "vdr-7",
    type: "vendor",
    category: "florist",
    name: "Rosa Selvatica",
    region: "Tuscany",
    city: "Montepulciano",
    countrySlug: "italy", regionSlug: "tuscany", citySlug: "montepulciano",
    lat: 43.0998, lng: 11.7854, online: true,
    rating: 4.9,
    reviews: 55,
    priceLabel: "£££",
    priceFrom: "£3,200",
    verified: true, lwdScore: 87,
    tag: "Seasonal Blooms",
    desc: "Tuscan garden florist working exclusively with seasonal, locally-grown botanicals and garden-style installations.",
    specialties: ["Garden Installations", "Seasonal Sourcing", "Table Scaping", "Dried Flowers"],
    imgs: [
      "https://images.unsplash.com/photo-1487530811015-780780169993?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    id: "vdr-8",
    type: "vendor",
    category: "florist",
    name: "Villa Bloom",
    region: "Veneto",
    city: "Venice",
    countrySlug: "italy", regionSlug: "venice", legacyRegionName: "Veneto",
    lat: 45.4408, lng: 12.3155, online: false,
    rating: 4.7,
    reviews: 34,
    priceLabel: "££££",
    priceFrom: "£4,800",
    verified: false, lwdScore: 71,
    tag: null,
    desc: "Venetian floral studio specialising in large-scale ceremony arches, hanging installations, and palazzo tableaux.",
    specialties: ["Ceremony Arches", "Hanging Installations", "Palazzo Settings", "Luxury Budgets"],
    imgs: [
      "https://images.unsplash.com/photo-1490750967868-88df5691cc00?auto=format&fit=crop&w=900&q=80",
    ],
  },

  // ── Caterers ─────────────────────────────────────────────────────────────────
  {
    id: "vdr-9",
    type: "vendor",
    category: "caterer",
    name: "Tavola d'Oro",
    region: "Tuscany",
    city: "Florence",
    countrySlug: "italy", regionSlug: "tuscany", citySlug: "florence",
    lat: 43.7696, lng: 11.2558, online: true,
    rating: 4.8,
    reviews: 88,
    priceLabel: "££££",
    priceFrom: "£180 pp",
    verified: true, lwdScore: 84,
    tag: "Michelin Trained",
    desc: "White-glove Florentine catering house with Michelin-trained chefs, bespoke menus, and villa expertise.",
    specialties: ["Bespoke Menus", "White Glove Service", "Wine Pairing", "Dietary Inclusive"],
    imgs: [
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    id: "vdr-10",
    type: "vendor",
    category: "caterer",
    name: "Costiera Table",
    region: "Campania",
    city: "Positano",
    countrySlug: "italy", regionSlug: "amalfi-coast", citySlug: "positano", legacyRegionName: "Campania",
    lat: 40.6280, lng: 14.4851, online: false,
    rating: 4.7,
    reviews: 52,
    priceLabel: "£££",
    priceFrom: "£130 pp",
    verified: true, lwdScore: 76,
    tag: null,
    desc: "Amalfi Coast catering collective celebrating hyper-local seafood, lemon-kissed antipasti, and southern Italian tradition.",
    specialties: ["Seafood Menus", "Local Produce", "Amalfi Tradition", "Al Fresco Dining"],
    imgs: [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
    ],
  },

  // ── Musician ─────────────────────────────────────────────────────────────────
  {
    id: "vdr-11",
    type: "vendor",
    category: "musician",
    name: "Arco Quartet",
    region: "Lombardy",
    city: "Milan",
    countrySlug: "italy", regionSlug: "milan", legacyRegionName: "Lombardy",
    lat: 45.4654, lng: 9.1866, online: false,
    rating: 4.9,
    reviews: 71,
    priceLabel: "£££",
    priceFrom: "£2,400",
    verified: true, lwdScore: 88,
    tag: "String Ensemble",
    desc: "Milan conservatoire-trained string quartet performing ceremony classics, cocktail jazz, and bespoke first-dance arrangements.",
    specialties: ["Ceremony Strings", "Cocktail Jazz", "First Dance Arrangements", "Outdoor Acoustics"],
    imgs: [
      "https://images.unsplash.com/photo-1465821185615-20b3c2fbf41b?auto=format&fit=crop&w=900&q=80",
    ],
  },

  // ── Videographers ────────────────────────────────────────────────────────────
  {
    id: "vdr-20",
    type: "vendor",
    category: "videographer",
    name: "Marco Visconti Films",
    region: "Tuscany",
    city: "Florence",
    countrySlug: "italy", regionSlug: "tuscany", citySlug: "florence",
    lat: 43.7696, lng: 11.2558, online: true,
    rating: 4.9,
    reviews: 87,
    priceLabel: "££££",
    priceFrom: "£5,500",
    verified: true, lwdScore: 92,
    tag: "Award Winning",
    desc: "Cinematic wedding films crafted with a documentary soul. Sony FX3 and vintage anamorphic glass for that timeless Tuscan look.",
    specialties: ["Cinematic Films", "Documentary Style", "Drone Aerials", "Same-Day Edits"],
    imgs: [
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    id: "vdr-21",
    type: "vendor",
    category: "videographer",
    name: "Luca Ferrini Studio",
    region: "Tuscany",
    city: "Siena",
    countrySlug: "italy", regionSlug: "tuscany", citySlug: "siena",
    lat: 43.3188, lng: 11.3307, online: true,
    rating: 4.8,
    reviews: 63,
    priceLabel: "££££",
    priceFrom: "£4,800",
    verified: true, lwdScore: 86,
    tag: null,
    desc: "RED Komodo 6K filmmaker blending editorial fashion aesthetics with authentic wedding storytelling across Tuscany.",
    specialties: ["Editorial Style", "Fashion Film", "Highlight Reels", "Multi-Camera"],
    imgs: [
      "https://images.unsplash.com/photo-1574717025058-2f8737d2e2b7?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    id: "vdr-22",
    type: "vendor",
    category: "videographer",
    name: "Onde Films",
    region: "Campania",
    city: "Ravello",
    countrySlug: "italy", regionSlug: "amalfi-coast", citySlug: "ravello",
    lat: 40.6490, lng: 14.6118, online: true,
    rating: 4.9,
    reviews: 54,
    priceLabel: "£££",
    priceFrom: "£3,800",
    verified: true, lwdScore: 84,
    tag: "Amalfi Specialist",
    desc: "Amalfi Coast storytellers capturing cliffside ceremonies and golden-hour boat sessions with a warm, organic palette.",
    specialties: ["Destination Films", "Drone Aerials", "Short Films", "Social Media Edits"],
    imgs: [
      "https://images.unsplash.com/photo-1518173946687-a250ed5b662c?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    id: "vdr-23",
    type: "vendor",
    category: "videographer",
    name: "Como Reel Co.",
    region: "Lombardy",
    city: "Lake Como",
    countrySlug: "italy", regionSlug: "lake-como", legacyRegionName: "Lombardy",
    lat: 45.9862, lng: 9.2619, online: true,
    rating: 5.0,
    reviews: 41,
    priceLabel: "££££",
    priceFrom: "£6,200",
    verified: true, lwdScore: 90,
    tag: "Top Rated",
    desc: "Lake Como's premier wedding filmmakers. Known for atmospheric lakeside cinematography and intimate villa storytelling.",
    specialties: ["Cinematic Films", "Villa Sessions", "Luxury Weddings", "International Couples"],
    imgs: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    id: "vdr-24",
    type: "vendor",
    category: "videographer",
    name: "Taormina Motion",
    region: "Sicily",
    city: "Taormina",
    countrySlug: "italy", regionSlug: "sicily", citySlug: "taormina",
    lat: 37.8516, lng: 15.2866, online: false,
    rating: 4.7,
    reviews: 38,
    priceLabel: "£££",
    priceFrom: "£3,200",
    verified: true, lwdScore: 78,
    tag: null,
    desc: "Sicilian filmmaking duo capturing Mediterranean light, ancient ruins, and the raw emotion of destination weddings.",
    specialties: ["Documentary Style", "Destination Films", "Elopement Films", "Raw & Unscripted"],
    imgs: [
      "https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    id: "vdr-25",
    type: "vendor",
    category: "videographer",
    name: "Puglia Vision",
    region: "Puglia",
    city: "Ostuni",
    countrySlug: "italy", regionSlug: "puglia", citySlug: "ostuni",
    lat: 40.7297, lng: 17.5770, online: true,
    rating: 4.8,
    reviews: 29,
    priceLabel: "£££",
    priceFrom: "£2,900",
    verified: false, lwdScore: 74,
    tag: null,
    desc: "Puglia-based videographers capturing sun-drenched masseria weddings with a candid, photojournalistic film approach.",
    specialties: ["Photojournalistic", "Masseria Weddings", "Short Films", "Same-Day Edits"],
    imgs: [
      "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80",
    ],
  },

  // ── Celebrant ────────────────────────────────────────────────────────────────
  {
    id: "vdr-12",
    type: "vendor",
    category: "celebrant",
    name: "Giulia Mancini",
    region: "Tuscany",
    city: "Florence",
    countrySlug: "italy", regionSlug: "tuscany", citySlug: "florence",
    lat: 43.7696, lng: 11.2558, online: true,
    rating: 5.0,
    reviews: 149,
    priceLabel: "££",
    priceFrom: "£1,200",
    verified: true, lwdScore: 93,
    tag: "Highly Recommended",
    desc: "Italy's most-booked English-language celebrant. Warm, personal, legal expert for international couples marrying in Italy.",
    specialties: ["English Ceremonies", "Legal Guidance", "Bilingual", "Symbolic Ceremonies"],
    imgs: [
      "https://images.unsplash.com/photo-1529543544282-ea669407fca3?auto=format&fit=crop&w=900&q=80",
    ],
  },

  // ── Italy Florists ──
  { id: "it-f1", type: "vendor", category: "florist", name: "Fiori di Lusso", region: "Tuscany", city: "Florence", countrySlug: "italy", regionSlug: "tuscany", citySlug: "florence", lat: 43.7696, lng: 11.2558, online: true, rating: 5.0, reviews: 112, priceLabel: "££££", priceFrom: "€6,000", verified: true, lwdScore: 95, tag: "Top Rated", desc: "Florence's premier floral atelier. Grand installations in Renaissance villas — cascading wisteria, white garden roses, and gilded accents.", specialties: ["Large Installations", "Ceremony Arches", "Table Scaping", "Seasonal Sourcing"], imgs: ["https://images.unsplash.com/photo-1487530811015-780780169993?auto=format&fit=crop&w=900&q=80"] },
  { id: "it-f2", type: "vendor", category: "florist", name: "Botanica Amalfi", region: "Amalfi Coast", city: "Ravello", countrySlug: "italy", regionSlug: "amalfi-coast", citySlug: "ravello", lat: 40.6491, lng: 14.6114, online: true, rating: 4.9, reviews: 87, priceLabel: "£££", priceFrom: "€4,200", verified: true, lwdScore: 91, tag: "Coastal Blooms", desc: "Ravello-based florist creating lemon-scented Mediterranean arrangements — bougainvillea arches, citrus tablescapes, and cliff-edge installations.", specialties: ["Garden Installations", "Mediterranean Style", "Ceremony Arches", "Bridal Bouquets"], imgs: ["https://images.unsplash.com/photo-1490750967868-88df5691cc00?auto=format&fit=crop&w=900&q=80"] },
  { id: "it-f3", type: "vendor", category: "florist", name: "Rosa & Verde", region: "Lake Como", city: "Bellagio", countrySlug: "italy", regionSlug: "lake-como", citySlug: "bellagio", lat: 45.9878, lng: 9.2621, online: true, rating: 4.8, reviews: 64, priceLabel: "£££", priceFrom: "€3,800", verified: true, lwdScore: 87, tag: null, desc: "Lake Como florist specialising in elegant lakeside arrangements — white hydrangeas, trailing greenery, and romantic villa tablescapes.", specialties: ["Table Scaping", "Seasonal Sourcing", "Garden Installations", "Bridal Bouquets"], imgs: ["https://images.unsplash.com/photo-1487530811015-780780169993?auto=format&fit=crop&w=900&q=80"] },

  // ── Italy Caterers ──
  { id: "it-c1", type: "vendor", category: "caterer", name: "Tavola d'Oro", region: "Tuscany", city: "Florence", countrySlug: "italy", regionSlug: "tuscany", citySlug: "florence", lat: 43.7696, lng: 11.2558, online: true, rating: 5.0, reviews: 98, priceLabel: "££££", priceFrom: "€150pp", verified: true, lwdScore: 94, tag: "Michelin Star", desc: "Florence's most prestigious wedding caterer. Michelin-trained chefs, truffle tasting menus, and Chianti wine pairings in private villas.", specialties: ["Tasting Menus", "Wine Pairing", "Live Cooking", "Dietary Specialist"], imgs: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80"] },
  { id: "it-c2", type: "vendor", category: "caterer", name: "Gusto & Amore", region: "Amalfi Coast", city: "Positano", countrySlug: "italy", regionSlug: "amalfi-coast", citySlug: "positano", lat: 40.6281, lng: 14.4849, online: true, rating: 4.9, reviews: 76, priceLabel: "£££", priceFrom: "€110pp", verified: true, lwdScore: 90, tag: "Coastal Cuisine", desc: "Positano seafood specialists. Fresh catches, wood-fired pizza stations, and limoncello service on cliffside terraces.", specialties: ["Live Cooking", "Tasting Menus", "Dietary Specialist", "Wine Pairing"], imgs: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // ENGLAND
  // ═══════════════════════════════════════════════════════════════════════════

  // ── England Planners ──
  { id: "eng-p1", type: "vendor", category: "planner", name: "The Velvet Bureau", region: "London", city: "Mayfair", countrySlug: "england", regionSlug: "london", citySlug: "mayfair", lat: 51.5074, lng: -0.1437, online: true, rating: 4.9, reviews: 112, priceLabel: "££££", priceFrom: "£12,000", verified: true, lwdScore: 95, tag: "Top Planner", serviceTier: "Full Planning", desc: "Mayfair-based luxury planning house orchestrating couture weddings across England's finest country estates and London landmarks.", specialties: ["Full Service", "Luxury & High-End", "English Speaking", "Destination Weddings"], imgs: ["https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80"] },
  { id: "eng-p2", type: "vendor", category: "planner", name: "Cotswold & Co.", region: "Cotswolds", city: "Burford", countrySlug: "england", regionSlug: "oxfordshire", citySlug: "burford", lat: 51.8094, lng: -1.6364, online: true, rating: 4.8, reviews: 78, priceLabel: "£££", priceFrom: "£6,500", verified: true, lwdScore: 88, tag: null, serviceTier: "Full Planning", desc: "Cotswolds specialists creating elegant country weddings in honey-stone barns, manor houses, and private gardens.", specialties: ["Full Service", "English Speaking", "Design & Styling", "Cultural & Multi-Faith"], imgs: ["https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=900&q=80"] },
  { id: "eng-p3", type: "vendor", category: "planner", name: "Grace & Gather", region: "Surrey", city: "Guildford", countrySlug: "england", regionSlug: "surrey", citySlug: "guildford", lat: 51.2362, lng: -0.5704, online: true, rating: 4.7, reviews: 54, priceLabel: "£££", priceFrom: "£4,800", verified: true, lwdScore: 82, tag: null, serviceTier: "Partial Planning", desc: "Surrey-based duo offering refined partial planning for couples who love the details but need expert logistics.", specialties: ["Elopements & Intimate", "English Speaking", "Design & Styling", "Full Service"], imgs: ["https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80"] },

  // ── England Photographers ──
  { id: "eng-ph1", type: "vendor", category: "photographer", name: "Arthur & Lane", region: "London", city: "Notting Hill", countrySlug: "england", regionSlug: "london", citySlug: "notting-hill", lat: 51.5117, lng: -0.2050, online: true, rating: 5.0, reviews: 134, priceLabel: "££££", priceFrom: "£4,500", verified: true, lwdScore: 96, tag: "Award Winning", desc: "London's most sought-after editorial wedding photographers. Fine art, natural light, published in Vogue Weddings.", specialties: ["Fine Art Editorial", "Documentary", "Luxury Portraits", "Engagement Sessions"], imgs: ["https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=900&q=80"] },
  { id: "eng-ph2", type: "vendor", category: "photographer", name: "Wild & Grace", region: "Cotswolds", city: "Chipping Norton", countrySlug: "england", regionSlug: "oxfordshire", citySlug: "chipping-norton", lat: 51.9413, lng: -1.5485, online: true, rating: 4.8, reviews: 89, priceLabel: "£££", priceFrom: "£3,200", verified: true, lwdScore: 87, tag: null, desc: "Cotswolds photographers capturing relaxed, golden-hour portraits and candid storytelling in England's most beautiful countryside.", specialties: ["Documentary", "Film & Analog", "Destination Travel", "Elopement"], imgs: ["https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=900&q=80"] },
  { id: "eng-ph3", type: "vendor", category: "photographer", name: "Heirloom Studio", region: "Yorkshire", city: "Harrogate", countrySlug: "england", regionSlug: "yorkshire", citySlug: "harrogate", lat: 53.9921, lng: -1.5418, online: false, rating: 4.9, reviews: 67, priceLabel: "£££", priceFrom: "£2,800", verified: true, lwdScore: 84, tag: "Top Rated", desc: "Northern England's premier fine art photographers. Known for moody landscapes, stately home sessions, and film-grain warmth.", specialties: ["Fine Art Editorial", "Cinematic", "Film & Analog", "Luxury Portraits"], imgs: ["https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80"] },

  // ── England Videographers ──
  { id: "eng-v1", type: "vendor", category: "videographer", name: "Story & Motion", region: "London", city: "Shoreditch", countrySlug: "england", regionSlug: "london", citySlug: "shoreditch", lat: 51.5246, lng: -0.0785, online: true, rating: 4.9, reviews: 91, priceLabel: "££££", priceFrom: "£5,000", verified: true, lwdScore: 93, tag: "Award Winning", desc: "Cinematic wedding filmmakers based in East London. Arri Alexa Mini, bespoke colour grades, and documentary storytelling.", specialties: ["Cinematic Films", "Documentary Style", "Same-Day Edits", "Drone Aerials"], imgs: ["https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80"] },
  { id: "eng-v2", type: "vendor", category: "videographer", name: "Meadow Films", region: "Cotswolds", city: "Stow-on-the-Wold", countrySlug: "england", regionSlug: "oxfordshire", citySlug: "stow-on-the-wold", lat: 51.9304, lng: -1.7235, online: true, rating: 4.8, reviews: 52, priceLabel: "£££", priceFrom: "£3,500", verified: true, lwdScore: 85, tag: null, desc: "Cotswolds filmmakers creating gentle, narrative-driven wedding films with a warm, organic palette.", specialties: ["Documentary Style", "Short Films", "Destination Films", "Editorial Style"], imgs: ["https://images.unsplash.com/photo-1574717025058-2f8737d2e2b7?auto=format&fit=crop&w=900&q=80"] },

  // ── England Florists ──
  { id: "eng-f1", type: "vendor", category: "florist", name: "Bloom & Wild Studio", region: "London", city: "Chelsea", countrySlug: "england", regionSlug: "london", citySlug: "chelsea", lat: 51.4875, lng: -0.1687, online: true, rating: 5.0, reviews: 98, priceLabel: "££££", priceFrom: "£5,500", verified: true, lwdScore: 94, tag: "Top Rated", desc: "Chelsea's most acclaimed floral designers. Large-scale installations, suspended meadows, and editorial tablescapes for luxury weddings.", specialties: ["Large Installations", "Ceremony Arches", "Table Scaping", "Seasonal Sourcing"], imgs: ["https://images.unsplash.com/photo-1487530811015-780780169993?auto=format&fit=crop&w=900&q=80"] },
  { id: "eng-f2", type: "vendor", category: "florist", name: "Hedgerow & Honey", region: "Cotswolds", city: "Cirencester", countrySlug: "england", regionSlug: "gloucestershire", citySlug: "cirencester", lat: 51.7186, lng: -1.9710, online: true, rating: 4.8, reviews: 63, priceLabel: "£££", priceFrom: "£2,800", verified: true, lwdScore: 86, tag: "Seasonal Blooms", desc: "Garden-style floristry using exclusively British-grown blooms. Loose, romantic arrangements for barn and country house weddings.", specialties: ["Garden Installations", "Seasonal Sourcing", "Dried Flowers", "Bridal Bouquets"], imgs: ["https://images.unsplash.com/photo-1490750967868-88df5691cc00?auto=format&fit=crop&w=900&q=80"] },

  // ── England Caterers ──
  { id: "eng-c1", type: "vendor", category: "caterer", name: "The Ivy Table", region: "London", city: "Belgravia", countrySlug: "england", regionSlug: "london", citySlug: "belgravia", lat: 51.4988, lng: -0.1527, online: true, rating: 4.9, reviews: 76, priceLabel: "££££", priceFrom: "£120pp", verified: true, lwdScore: 91, tag: "Michelin Trained", desc: "Belgravia-based catering house led by ex-Michelin chefs. Bespoke tasting menus, live cooking stations, and impeccable service.", specialties: ["Tasting Menus", "Live Cooking", "Dietary Specialist", "Wine Pairing"], imgs: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // FRANCE
  // ═══════════════════════════════════════════════════════════════════════════

  // ── France Planners ──
  { id: "fr-p1", type: "vendor", category: "planner", name: "Maison de Mariée", region: "Provence", city: "Aix-en-Provence", countrySlug: "france", regionSlug: "provence", citySlug: "aix-en-provence", lat: 43.5297, lng: 5.4474, online: true, rating: 4.9, reviews: 88, priceLabel: "££££", priceFrom: "€10,000", verified: true, lwdScore: 92, tag: "Top Planner", serviceTier: "Full Planning", desc: "Provençal luxury planner creating sun-drenched château weddings with effortless French elegance.", specialties: ["Full Service", "Destination Weddings", "Luxury & High-End", "English Speaking"], imgs: ["https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80"] },
  { id: "fr-p2", type: "vendor", category: "planner", name: "Oui Weddings Paris", region: "Paris", city: "Paris", countrySlug: "france", regionSlug: "paris", citySlug: "paris", lat: 48.8566, lng: 2.3522, online: true, rating: 4.8, reviews: 64, priceLabel: "££££", priceFrom: "€12,000", verified: true, lwdScore: 89, tag: null, serviceTier: "Full Planning", desc: "Parisian wedding planner specialising in iconic venue access — the Ritz, Château de Chantilly, and private Left Bank salons.", specialties: ["Full Service", "Luxury & High-End", "English Speaking", "Cultural & Multi-Faith"], imgs: ["https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=900&q=80"] },

  // ── France Photographers ──
  { id: "fr-ph1", type: "vendor", category: "photographer", name: "Lumière Atelier", region: "Provence", city: "Gordes", countrySlug: "france", regionSlug: "provence", citySlug: "gordes", lat: 43.9114, lng: 5.2003, online: true, rating: 5.0, reviews: 97, priceLabel: "££££", priceFrom: "€4,000", verified: true, lwdScore: 94, tag: "Award Winning", desc: "Fine art Provençal photographer known for lavender field sessions, soft natural light, and editorial magazine style.", specialties: ["Fine Art Editorial", "Destination Travel", "Luxury Portraits", "Film & Analog"], imgs: ["https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=900&q=80"] },
  { id: "fr-ph2", type: "vendor", category: "photographer", name: "Studio Étoile", region: "Paris", city: "Paris", countrySlug: "france", regionSlug: "paris", citySlug: "paris", lat: 48.8566, lng: 2.3522, online: true, rating: 4.9, reviews: 81, priceLabel: "££££", priceFrom: "€5,200", verified: true, lwdScore: 90, tag: "Top Rated", desc: "Parisian couple portraitist. Eiffel Tower golden-hour sessions, discreet ceremony coverage, black-and-white fine art.", specialties: ["Fine Art Editorial", "Cinematic", "Engagement Sessions", "Documentary"], imgs: ["https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=900&q=80"] },

  // ── France Videographers ──
  { id: "fr-v1", type: "vendor", category: "videographer", name: "Cinéma Vérité Films", region: "Provence", city: "Nice", countrySlug: "france", regionSlug: "provence", citySlug: "nice", lat: 43.7102, lng: 7.2620, online: true, rating: 4.8, reviews: 56, priceLabel: "£££", priceFrom: "€3,800", verified: true, lwdScore: 86, tag: null, desc: "Côte d'Azur filmmakers blending documentary authenticity with cinematic beauty across the French Riviera.", specialties: ["Documentary Style", "Cinematic Films", "Drone Aerials", "Destination Films"], imgs: ["https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80"] },

  // ── France Florists ──
  { id: "fr-f1", type: "vendor", category: "florist", name: "Jardin Sauvage", region: "Provence", city: "Aix-en-Provence", countrySlug: "france", regionSlug: "provence", citySlug: "aix-en-provence", lat: 43.5297, lng: 5.4474, online: true, rating: 4.9, reviews: 72, priceLabel: "£££", priceFrom: "€3,500", verified: true, lwdScore: 88, tag: "Garden Style", desc: "Wild Provençal floristry using lavender, olive branches, and sun-faded palette. Tablescapes that feel gathered, not arranged.", specialties: ["Garden Installations", "Seasonal Sourcing", "Table Scaping", "Ceremony Arches"], imgs: ["https://images.unsplash.com/photo-1487530811015-780780169993?auto=format&fit=crop&w=900&q=80"] },

  // ── France Caterers ──
  { id: "fr-c1", type: "vendor", category: "caterer", name: "Le Petit Banquet", region: "Provence", city: "Aix-en-Provence", countrySlug: "france", regionSlug: "provence", citySlug: "aix-en-provence", lat: 43.5297, lng: 5.4474, online: true, rating: 4.9, reviews: 81, priceLabel: "££££", priceFrom: "€140pp", verified: true, lwdScore: 91, tag: "Michelin Trained", desc: "Provençal fine dining caterer. Seasonal tasting menus, live crêpe stations, and curated local wine service in château courtyards.", specialties: ["Tasting Menus", "Wine Pairing", "Live Cooking", "Dietary Specialist"], imgs: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPAIN
  // ═══════════════════════════════════════════════════════════════════════════

  { id: "es-p1", type: "vendor", category: "planner", name: "Boda & Sol", region: "Andalusia", city: "Marbella", countrySlug: "spain", regionSlug: "andalusia", citySlug: "marbella", lat: 36.5107, lng: -4.8862, online: true, rating: 4.9, reviews: 73, priceLabel: "£££", priceFrom: "€7,500", verified: true, lwdScore: 90, tag: "Top Planner", serviceTier: "Full Planning", desc: "Marbella luxury planner creating sun-soaked Mediterranean celebrations in private villas and beachfront estates.", specialties: ["Full Service", "Destination Weddings", "Luxury & High-End", "English Speaking"], imgs: ["https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80"] },
  { id: "es-ph1", type: "vendor", category: "photographer", name: "Sol y Sombra", region: "Andalusia", city: "Seville", countrySlug: "spain", regionSlug: "andalusia", citySlug: "seville", lat: 37.3891, lng: -5.9845, online: true, rating: 4.8, reviews: 62, priceLabel: "£££", priceFrom: "€2,800", verified: true, lwdScore: 85, tag: null, desc: "Seville-based photographer capturing dramatic Andalusian light, Moorish architecture, and passionate celebrations.", specialties: ["Documentary", "Fine Art Editorial", "Destination Travel", "Cinematic"], imgs: ["https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=900&q=80"] },
  { id: "es-v1", type: "vendor", category: "videographer", name: "Costa Reel", region: "Andalusia", city: "Málaga", countrySlug: "spain", regionSlug: "andalusia", citySlug: "malaga", lat: 36.7213, lng: -4.4214, online: true, rating: 4.7, reviews: 41, priceLabel: "£££", priceFrom: "€3,200", verified: true, lwdScore: 80, tag: null, desc: "Málaga-based cinematic wedding films capturing golden Mediterranean light and coastal celebration energy.", specialties: ["Cinematic Films", "Drone Aerials", "Destination Films", "Short Films"], imgs: ["https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80"] },
  { id: "es-f1", type: "vendor", category: "florist", name: "Flor del Sur", region: "Andalusia", city: "Granada", countrySlug: "spain", regionSlug: "andalusia", citySlug: "granada", lat: 37.1773, lng: -3.5986, online: true, rating: 4.8, reviews: 47, priceLabel: "££", priceFrom: "€2,200", verified: true, lwdScore: 83, tag: null, desc: "Andalusian florist working with Mediterranean botanicals — bougainvillea, jasmine, olive, and citrus for warm, fragrant installations.", specialties: ["Garden Installations", "Ceremony Arches", "Seasonal Sourcing", "Mediterranean Style"], imgs: ["https://images.unsplash.com/photo-1490750967868-88df5691cc00?auto=format&fit=crop&w=900&q=80"] },
  { id: "es-c1", type: "vendor", category: "caterer", name: "Mesa y Mar", region: "Andalusia", city: "Marbella", countrySlug: "spain", regionSlug: "andalusia", citySlug: "marbella", lat: 36.5107, lng: -4.8862, online: true, rating: 4.8, reviews: 58, priceLabel: "£££", priceFrom: "€95pp", verified: true, lwdScore: 86, tag: "Coastal Cuisine", desc: "Marbella caterer blending Spanish tapas culture with fine dining — paella stations, ibérico carving, and cava toasts under Andalusian stars.", specialties: ["Live Cooking", "Tasting Menus", "Wine Pairing", "Dietary Specialist"], imgs: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // GREECE
  // ═══════════════════════════════════════════════════════════════════════════

  { id: "gr-p1", type: "vendor", category: "planner", name: "Aegean Dreams", region: "Santorini", city: "Oia", countrySlug: "greece", regionSlug: "santorini", citySlug: "oia", lat: 36.4618, lng: 25.3753, online: true, rating: 4.9, reviews: 94, priceLabel: "££££", priceFrom: "€9,000", verified: true, lwdScore: 93, tag: "Top Planner", serviceTier: "Full Planning", desc: "Santorini's premier wedding planner. Caldera-view ceremonies, sunset receptions, and flawless luxury logistics.", specialties: ["Full Service", "Destination Weddings", "Luxury & High-End", "English Speaking"], imgs: ["https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80"] },
  { id: "gr-ph1", type: "vendor", category: "photographer", name: "Helios Photography", region: "Santorini", city: "Fira", countrySlug: "greece", regionSlug: "santorini", citySlug: "fira", lat: 36.4166, lng: 25.4315, online: true, rating: 5.0, reviews: 108, priceLabel: "£££", priceFrom: "€3,500", verified: true, lwdScore: 92, tag: "Award Winning", desc: "Greece's most-published wedding photographer. White-washed walls, cobalt skies, and golden Aegean light.", specialties: ["Fine Art Editorial", "Destination Travel", "Cinematic", "Engagement Sessions"], imgs: ["https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=900&q=80"] },
  { id: "gr-v1", type: "vendor", category: "videographer", name: "Odyssey Films", region: "Santorini", city: "Oia", countrySlug: "greece", regionSlug: "santorini", citySlug: "oia", lat: 36.4618, lng: 25.3753, online: true, rating: 4.8, reviews: 59, priceLabel: "£££", priceFrom: "€3,800", verified: true, lwdScore: 87, tag: null, desc: "Santorini filmmakers capturing caldera sunsets, clifftop vows, and island celebration energy in cinematic 4K.", specialties: ["Cinematic Films", "Drone Aerials", "Destination Films", "Documentary Style"], imgs: ["https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80"] },
  { id: "gr-f1", type: "vendor", category: "florist", name: "Petali & Stone", region: "Santorini", city: "Fira", countrySlug: "greece", regionSlug: "santorini", citySlug: "fira", lat: 36.4166, lng: 25.4315, online: true, rating: 4.9, reviews: 68, priceLabel: "£££", priceFrom: "€3,200", verified: true, lwdScore: 89, tag: "Island Blooms", desc: "Santorini florist blending Mediterranean succulents, white roses, and olive branches against volcanic stone backdrops.", specialties: ["Ceremony Arches", "Table Scaping", "Mediterranean Style", "Seasonal Sourcing"], imgs: ["https://images.unsplash.com/photo-1487530811015-780780169993?auto=format&fit=crop&w=900&q=80"] },
  { id: "gr-f2", type: "vendor", category: "florist", name: "Mykonos Bloom", region: "Mykonos", city: "Mykonos Town", countrySlug: "greece", regionSlug: "mykonos", citySlug: "mykonos-town", lat: 37.4467, lng: 25.3289, online: true, rating: 4.8, reviews: 52, priceLabel: "££££", priceFrom: "€4,500", verified: true, lwdScore: 86, tag: null, desc: "Luxury island floristry — cascading bougainvillea, white peonies, and driftwood installations for Cycladic celebrations.", specialties: ["Large Installations", "Garden Installations", "Bridal Bouquets", "Mediterranean Style"], imgs: ["https://images.unsplash.com/photo-1490750967868-88df5691cc00?auto=format&fit=crop&w=900&q=80"] },
  { id: "gr-c1", type: "vendor", category: "caterer", name: "Thalassa Table", region: "Santorini", city: "Oia", countrySlug: "greece", regionSlug: "santorini", citySlug: "oia", lat: 36.4618, lng: 25.3753, online: true, rating: 4.9, reviews: 74, priceLabel: "££££", priceFrom: "€130pp", verified: true, lwdScore: 90, tag: "Mediterranean", desc: "Caldera-view feasting with fresh Aegean seafood, local wines, and live cooking stations. Farm-to-table Greek luxury.", specialties: ["Tasting Menus", "Live Cooking", "Wine Pairing", "Dietary Specialist"], imgs: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // IRELAND
  // ═══════════════════════════════════════════════════════════════════════════

  { id: "ie-p1", type: "vendor", category: "planner", name: "Castle & Clover", region: "Dublin", city: "Dublin", countrySlug: "ireland", regionSlug: "dublin", citySlug: "dublin", lat: 53.3498, lng: -6.2603, online: true, rating: 4.8, reviews: 67, priceLabel: "£££", priceFrom: "€6,000", verified: true, lwdScore: 87, tag: null, serviceTier: "Full Planning", desc: "Dublin-based planner creating elegant castle weddings across Ireland's wildest landscapes and grandest estates.", specialties: ["Full Service", "Destination Weddings", "English Speaking", "Cultural & Multi-Faith"], imgs: ["https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=900&q=80"] },
  { id: "ie-ph1", type: "vendor", category: "photographer", name: "Éire Light", region: "Dublin", city: "Dublin", countrySlug: "ireland", regionSlug: "dublin", citySlug: "dublin", lat: 53.3498, lng: -6.2603, online: true, rating: 4.9, reviews: 82, priceLabel: "£££", priceFrom: "€2,800", verified: true, lwdScore: 89, tag: "Top Rated", desc: "Ireland's leading documentary wedding photographer. Wild Atlantic cliffs, Georgian manors, and candid Irish celebrations.", specialties: ["Documentary", "Destination Travel", "Elopement", "Film & Analog"], imgs: ["https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=900&q=80"] },
  { id: "ie-v1", type: "vendor", category: "videographer", name: "Wild Atlantic Films", region: "Galway", city: "Galway", countrySlug: "ireland", regionSlug: "galway", citySlug: "galway", lat: 53.2707, lng: -9.0568, online: true, rating: 4.8, reviews: 48, priceLabel: "£££", priceFrom: "€3,500", verified: true, lwdScore: 84, tag: null, desc: "Galway-based cinematic filmmakers capturing windswept cliff ceremonies, castle receptions, and wild Irish romance.", specialties: ["Cinematic Films", "Documentary Style", "Drone Aerials", "Destination Films"], imgs: ["https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80"] },
  { id: "ie-f1", type: "vendor", category: "florist", name: "Thistle & Thorn", region: "Dublin", city: "Dublin", countrySlug: "ireland", regionSlug: "dublin", citySlug: "dublin", lat: 53.3498, lng: -6.2603, online: true, rating: 4.8, reviews: 55, priceLabel: "£££", priceFrom: "€2,500", verified: true, lwdScore: 85, tag: "Wild Florals", desc: "Dublin florist creating wild, garden-gathered arrangements — thistles, ivy trails, and moody seasonal blooms for castle weddings.", specialties: ["Garden Installations", "Seasonal Sourcing", "Bridal Bouquets", "Ceremony Arches"], imgs: ["https://images.unsplash.com/photo-1487530811015-780780169993?auto=format&fit=crop&w=900&q=80"] },
  { id: "ie-c1", type: "vendor", category: "caterer", name: "The Long Table", region: "Dublin", city: "Dublin", countrySlug: "ireland", regionSlug: "dublin", citySlug: "dublin", lat: 53.3498, lng: -6.2603, online: true, rating: 4.9, reviews: 61, priceLabel: "£££", priceFrom: "€95pp", verified: true, lwdScore: 88, tag: "Farm to Fork", desc: "Dublin's premier wedding caterer. Locally sourced Irish produce, artisan breads, and feasting tables in castle banquet halls.", specialties: ["Tasting Menus", "Live Cooking", "Dietary Specialist", "Wine Pairing"], imgs: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // HUNGARY
  // ═══════════════════════════════════════════════════════════════════════════

  { id: "hu-p1", type: "vendor", category: "planner", name: "Budapest Belle", region: "Budapest", city: "Budapest", countrySlug: "hungary", regionSlug: "budapest", citySlug: "budapest", lat: 47.4979, lng: 19.0402, online: true, rating: 4.8, reviews: 58, priceLabel: "££", priceFrom: "€4,500", verified: true, lwdScore: 85, tag: null, serviceTier: "Full Planning", desc: "Budapest luxury planner creating opulent Danube-side celebrations in thermal palaces and Art Nouveau ballrooms.", specialties: ["Full Service", "Destination Weddings", "English Speaking", "Luxury & High-End"], imgs: ["https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80"] },
  { id: "hu-ph1", type: "vendor", category: "photographer", name: "Duna Studio", region: "Budapest", city: "Budapest", countrySlug: "hungary", regionSlug: "budapest", citySlug: "budapest", lat: 47.4979, lng: 19.0402, online: true, rating: 4.9, reviews: 71, priceLabel: "££", priceFrom: "€1,800", verified: true, lwdScore: 88, tag: "Top Rated", desc: "Budapest photographer capturing Parliament views, ruin bar receptions, and the romantic bridges of the Danube at golden hour.", specialties: ["Fine Art Editorial", "Documentary", "Cinematic", "Engagement Sessions"], imgs: ["https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=900&q=80"] },
  { id: "hu-v1", type: "vendor", category: "videographer", name: "Magyar Motion", region: "Budapest", city: "Budapest", countrySlug: "hungary", regionSlug: "budapest", citySlug: "budapest", lat: 47.4979, lng: 19.0402, online: true, rating: 4.7, reviews: 43, priceLabel: "££", priceFrom: "€2,200", verified: true, lwdScore: 82, tag: null, desc: "Budapest cinematic wedding filmmakers. Thermal bath receptions, Buda Castle backdrops, and Danube golden-hour coverage.", specialties: ["Cinematic Films", "Documentary Style", "Drone Aerials", "Short Films"], imgs: ["https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80"] },
  { id: "hu-f1", type: "vendor", category: "florist", name: "Virág Studio", region: "Budapest", city: "Budapest", countrySlug: "hungary", regionSlug: "budapest", citySlug: "budapest", lat: 47.4979, lng: 19.0402, online: true, rating: 4.8, reviews: 49, priceLabel: "££", priceFrom: "€1,800", verified: true, lwdScore: 84, tag: "Art Nouveau", desc: "Budapest florist creating opulent arrangements inspired by Hungary's Art Nouveau heritage — gold accents, deep burgundy, lush peonies.", specialties: ["Large Installations", "Table Scaping", "Ceremony Arches", "Seasonal Sourcing"], imgs: ["https://images.unsplash.com/photo-1487530811015-780780169993?auto=format&fit=crop&w=900&q=80"] },
  { id: "hu-c1", type: "vendor", category: "caterer", name: "Gundel Events", region: "Budapest", city: "Budapest", countrySlug: "hungary", regionSlug: "budapest", citySlug: "budapest", lat: 47.4979, lng: 19.0402, online: true, rating: 4.9, reviews: 64, priceLabel: "£££", priceFrom: "€85pp", verified: true, lwdScore: 87, tag: "Heritage Cuisine", desc: "Budapest's legendary dining house offering bespoke wedding menus — Hungarian tasting courses, wine cellars, and live gypsy music.", specialties: ["Tasting Menus", "Wine Pairing", "Live Cooking", "Dietary Specialist"], imgs: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // USA
  // ═══════════════════════════════════════════════════════════════════════════

  { id: "us-p1", type: "vendor", category: "planner", name: "East & Eighth", region: "New York", city: "Manhattan", countrySlug: "usa", regionSlug: "new-york", citySlug: "manhattan", lat: 40.7831, lng: -73.9712, online: true, rating: 5.0, reviews: 142, priceLabel: "££££", priceFrom: "$18,000", verified: true, lwdScore: 97, tag: "Top Planner", serviceTier: "Full Planning", desc: "Manhattan's most sought-after luxury planner. Black-tie galas, rooftop ceremonies, and destination weddings worldwide.", specialties: ["Full Service", "Luxury & High-End", "English Speaking", "Destination Weddings"], imgs: ["https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80"] },
  { id: "us-ph1", type: "vendor", category: "photographer", name: "Golden State Light", region: "California", city: "Los Angeles", countrySlug: "usa", regionSlug: "california", citySlug: "los-angeles", lat: 34.0522, lng: -118.2437, online: true, rating: 4.9, reviews: 118, priceLabel: "££££", priceFrom: "$5,500", verified: true, lwdScore: 94, tag: "Award Winning", desc: "LA-based editorial photographer. Pacific coast sessions, vineyard portraits, and warm Californian light.", specialties: ["Fine Art Editorial", "Cinematic", "Destination Travel", "Luxury Portraits"], imgs: ["https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=900&q=80"] },
  { id: "us-v1", type: "vendor", category: "videographer", name: "Brooklyn Reel", region: "New York", city: "Brooklyn", countrySlug: "usa", regionSlug: "new-york", citySlug: "brooklyn", lat: 40.6782, lng: -73.9442, online: true, rating: 4.8, reviews: 86, priceLabel: "££££", priceFrom: "$6,000", verified: true, lwdScore: 91, tag: "Top Rated", desc: "Brooklyn-based cinematic wedding filmmakers. Urban rooftops, upstate estates, and cross-country destination coverage.", specialties: ["Cinematic Films", "Documentary Style", "Drone Aerials", "Same-Day Edits"], imgs: ["https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80"] },
  { id: "us-f1", type: "vendor", category: "florist", name: "Putnam & Putnam", region: "New York", city: "Manhattan", countrySlug: "usa", regionSlug: "new-york", citySlug: "manhattan", lat: 40.7831, lng: -73.9712, online: true, rating: 5.0, reviews: 126, priceLabel: "££££", priceFrom: "$8,000", verified: true, lwdScore: 96, tag: "Top Rated", desc: "Manhattan's most celebrated floral designers. Sculptural installations, suspended gardens, and editorial tablescapes for luxury galas.", specialties: ["Large Installations", "Ceremony Arches", "Table Scaping", "Seasonal Sourcing"], imgs: ["https://images.unsplash.com/photo-1487530811015-780780169993?auto=format&fit=crop&w=900&q=80"] },
  { id: "us-f2", type: "vendor", category: "florist", name: "Bloom & Plume", region: "California", city: "Los Angeles", countrySlug: "usa", regionSlug: "california", citySlug: "los-angeles", lat: 34.0522, lng: -118.2437, online: true, rating: 4.9, reviews: 94, priceLabel: "££££", priceFrom: "$6,500", verified: true, lwdScore: 92, tag: "Award Winning", desc: "LA florist known for maximalist, colour-drenched arrangements — tropical palms, garden roses, and California wildflower meadows.", specialties: ["Garden Installations", "Large Installations", "Bridal Bouquets", "Mediterranean Style"], imgs: ["https://images.unsplash.com/photo-1490750967868-88df5691cc00?auto=format&fit=crop&w=900&q=80"] },
  { id: "us-c1", type: "vendor", category: "caterer", name: "Fig & Olive Catering", region: "California", city: "Napa Valley", countrySlug: "usa", regionSlug: "california", citySlug: "napa-valley", lat: 38.5025, lng: -122.2654, online: true, rating: 4.9, reviews: 108, priceLabel: "££££", priceFrom: "$180pp", verified: true, lwdScore: 93, tag: "Wine Country", desc: "Napa Valley's premier wedding caterer. Vineyard tasting menus, wood-fired stations, and farm-to-table California cuisine paired with estate wines.", specialties: ["Tasting Menus", "Wine Pairing", "Live Cooking", "Dietary Specialist"], imgs: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // UAE (Dubai & Abu Dhabi)
  // ═══════════════════════════════════════════════════════════════════════════

  { id: "uae-p1", type: "vendor", category: "planner", name: "Maison d'Or Events", region: "Dubai", city: "Dubai", countrySlug: "uae", regionSlug: "dubai", citySlug: "dubai", lat: 25.2048, lng: 55.2708, online: true, rating: 5.0, reviews: 128, priceLabel: "££££", priceFrom: "$25,000", verified: true, lwdScore: 97, tag: "Top Planner", serviceTier: "Full Planning", desc: "Dubai's most exclusive wedding planner. Desert palace celebrations, Burj views, and ultra-luxury production for international couples.", specialties: ["Full Service", "Luxury & High-End", "Destination Weddings", "English Speaking"], imgs: ["https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80"] },
  { id: "uae-p2", type: "vendor", category: "planner", name: "Sand & Silk", region: "Abu Dhabi", city: "Abu Dhabi", countrySlug: "uae", regionSlug: "abu-dhabi", citySlug: "abu-dhabi", lat: 24.4539, lng: 54.3773, online: true, rating: 4.9, reviews: 84, priceLabel: "££££", priceFrom: "$20,000", verified: true, lwdScore: 93, tag: null, serviceTier: "Full Planning", desc: "Abu Dhabi luxury planner creating multi-day celebrations — desert camps, palace receptions, and cultural fusion ceremonies.", specialties: ["Full Service", "Cultural & Multi-Faith", "Luxury & High-End", "Destination Weddings"], imgs: ["https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=900&q=80"] },
  { id: "uae-ph1", type: "vendor", category: "photographer", name: "Desert Light Studio", region: "Dubai", city: "Dubai", countrySlug: "uae", regionSlug: "dubai", citySlug: "dubai", lat: 25.2048, lng: 55.2708, online: true, rating: 5.0, reviews: 156, priceLabel: "££££", priceFrom: "$7,000", verified: true, lwdScore: 96, tag: "Award Winning", desc: "Dubai's premier editorial wedding photographer. Golden desert sessions, Atlantis rooftops, and Old Dubai medina storytelling.", specialties: ["Fine Art Editorial", "Luxury Portraits", "Destination Travel", "Cinematic"], imgs: ["https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=900&q=80"] },
  { id: "uae-ph2", type: "vendor", category: "photographer", name: "Oasis Frames", region: "Abu Dhabi", city: "Abu Dhabi", countrySlug: "uae", regionSlug: "abu-dhabi", citySlug: "abu-dhabi", lat: 24.4539, lng: 54.3773, online: true, rating: 4.8, reviews: 72, priceLabel: "£££", priceFrom: "$4,500", verified: true, lwdScore: 88, tag: null, desc: "Abu Dhabi photographer specialising in cultural weddings — henna ceremonies, palace interiors, and Saadiyat Island portraits.", specialties: ["Documentary", "Cultural & Multi-Faith", "Fine Art Editorial", "Engagement Sessions"], imgs: ["https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=900&q=80"] },
  { id: "uae-v1", type: "vendor", category: "videographer", name: "Dune Cinema", region: "Dubai", city: "Dubai", countrySlug: "uae", regionSlug: "dubai", citySlug: "dubai", lat: 25.2048, lng: 55.2708, online: true, rating: 4.9, reviews: 94, priceLabel: "££££", priceFrom: "$8,000", verified: true, lwdScore: 94, tag: "Top Rated", desc: "Cinematic wedding filmmakers creating blockbuster-quality films — aerial desert sweeps, Marina skylines, and theatrical lighting.", specialties: ["Cinematic Films", "Drone Aerials", "Same-Day Edits", "Documentary Style"], imgs: ["https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80"] },
  { id: "uae-f1", type: "vendor", category: "florist", name: "Al Noor Florals", region: "Dubai", city: "Dubai", countrySlug: "uae", regionSlug: "dubai", citySlug: "dubai", lat: 25.2048, lng: 55.2708, online: true, rating: 5.0, reviews: 108, priceLabel: "££££", priceFrom: "$12,000", verified: true, lwdScore: 95, tag: "Luxury Installations", desc: "Dubai's most extravagant floral house. Ceiling meadows, crystal-embedded arrangements, and 20-foot ceremony arches in gold and white.", specialties: ["Large Installations", "Ceremony Arches", "Table Scaping", "Seasonal Sourcing"], imgs: ["https://images.unsplash.com/photo-1487530811015-780780169993?auto=format&fit=crop&w=900&q=80"] },
  { id: "uae-c1", type: "vendor", category: "caterer", name: "The Golden Fork", region: "Dubai", city: "Dubai", countrySlug: "uae", regionSlug: "dubai", citySlug: "dubai", lat: 25.2048, lng: 55.2708, online: true, rating: 4.9, reviews: 89, priceLabel: "££££", priceFrom: "$200pp", verified: true, lwdScore: 92, tag: "International Fusion", desc: "Dubai's most sought-after wedding caterer. Arabic-French fusion menus, live sushi bars, and theatrical dessert displays.", specialties: ["Tasting Menus", "Live Cooking", "Dietary Specialist", "Wine Pairing"], imgs: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // MOROCCO
  // ═══════════════════════════════════════════════════════════════════════════

  { id: "ma-p1", type: "vendor", category: "planner", name: "Riad Romance", region: "Marrakech", city: "Marrakech", countrySlug: "morocco", regionSlug: "marrakech", citySlug: "marrakech", lat: 31.6295, lng: -7.9811, online: true, rating: 4.9, reviews: 92, priceLabel: "£££", priceFrom: "€8,000", verified: true, lwdScore: 92, tag: "Top Planner", serviceTier: "Full Planning", desc: "Marrakech's luxury wedding planner. Riad courtyards, desert glamping, and Atlas Mountain ceremonies for international couples.", specialties: ["Full Service", "Destination Weddings", "English Speaking", "Cultural & Multi-Faith"], imgs: ["https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80"] },
  { id: "ma-p2", type: "vendor", category: "planner", name: "Palais Events", region: "Marrakech", city: "Marrakech", countrySlug: "morocco", regionSlug: "marrakech", citySlug: "marrakech", lat: 31.6295, lng: -7.9811, online: true, rating: 4.8, reviews: 64, priceLabel: "££££", priceFrom: "€12,000", verified: true, lwdScore: 89, tag: null, serviceTier: "Full Planning", desc: "Ultra-luxury Moroccan wedding producer. Palace takeovers, 500+ guest celebrations, and multi-day affairs with traditional entertainment.", specialties: ["Luxury & High-End", "Full Service", "Cultural & Multi-Faith", "Destination Weddings"], imgs: ["https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=900&q=80"] },
  { id: "ma-ph1", type: "vendor", category: "photographer", name: "Kasbah Lens", region: "Marrakech", city: "Marrakech", countrySlug: "morocco", regionSlug: "marrakech", citySlug: "marrakech", lat: 31.6295, lng: -7.9811, online: true, rating: 5.0, reviews: 86, priceLabel: "£££", priceFrom: "€3,500", verified: true, lwdScore: 91, tag: "Award Winning", desc: "Marrakech photographer capturing the vibrant colours of Moroccan celebrations — zellij mosaics, souk textures, and desert golden hour.", specialties: ["Fine Art Editorial", "Documentary", "Destination Travel", "Cinematic"], imgs: ["https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=900&q=80"] },
  { id: "ma-v1", type: "vendor", category: "videographer", name: "Atlas Motion", region: "Marrakech", city: "Marrakech", countrySlug: "morocco", regionSlug: "marrakech", citySlug: "marrakech", lat: 31.6295, lng: -7.9811, online: true, rating: 4.8, reviews: 52, priceLabel: "£££", priceFrom: "€4,000", verified: true, lwdScore: 86, tag: null, desc: "Moroccan cinematic filmmakers. Drone sweeps over the Atlas, riad courtyard ceremonies, and Sahara Desert first dances.", specialties: ["Cinematic Films", "Drone Aerials", "Documentary Style", "Destination Films"], imgs: ["https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80"] },
  { id: "ma-f1", type: "vendor", category: "florist", name: "Jardin Majorelle Florals", region: "Marrakech", city: "Marrakech", countrySlug: "morocco", regionSlug: "marrakech", citySlug: "marrakech", lat: 31.6295, lng: -7.9811, online: true, rating: 4.9, reviews: 61, priceLabel: "£££", priceFrom: "€3,000", verified: true, lwdScore: 87, tag: "Exotic Blooms", desc: "Marrakech florist blending Moroccan garden traditions with luxury design — bougainvillea arches, jasmine garlands, and rose-petal aisles.", specialties: ["Garden Installations", "Ceremony Arches", "Large Installations", "Seasonal Sourcing"], imgs: ["https://images.unsplash.com/photo-1487530811015-780780169993?auto=format&fit=crop&w=900&q=80"] },
  { id: "ma-c1", type: "vendor", category: "caterer", name: "Feast of Fez", region: "Marrakech", city: "Marrakech", countrySlug: "morocco", regionSlug: "marrakech", citySlug: "marrakech", lat: 31.6295, lng: -7.9811, online: true, rating: 4.9, reviews: 73, priceLabel: "£££", priceFrom: "€80pp", verified: true, lwdScore: 89, tag: "Moroccan Fusion", desc: "Traditional Moroccan wedding feasting meets modern gastronomy — tagine towers, couscous ceremony, and Fez pastry artistry.", specialties: ["Tasting Menus", "Live Cooking", "Dietary Specialist", "Wine Pairing"], imgs: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUTH AFRICA
  // ═══════════════════════════════════════════════════════════════════════════

  { id: "za-p1", type: "vendor", category: "planner", name: "The Aleit Group", region: "Cape Town", city: "Cape Town", countrySlug: "south-africa", regionSlug: "cape-town", citySlug: "cape-town", lat: -33.9249, lng: 18.4241, online: true, rating: 5.0, reviews: 134, priceLabel: "££££", priceFrom: "R180,000", verified: true, lwdScore: 96, tag: "Top Planner", serviceTier: "Full Planning", desc: "South Africa's most acclaimed luxury wedding house. Winelands estates, Table Mountain backdrops, and world-class production.", specialties: ["Full Service", "Luxury & High-End", "Destination Weddings", "English Speaking"], imgs: ["https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80"] },
  { id: "za-p2", type: "vendor", category: "planner", name: "Franschhoek Weddings", region: "Winelands", city: "Franschhoek", countrySlug: "south-africa", regionSlug: "winelands", citySlug: "franschhoek", lat: -33.9133, lng: 19.1167, online: true, rating: 4.9, reviews: 78, priceLabel: "£££", priceFrom: "R120,000", verified: true, lwdScore: 91, tag: null, serviceTier: "Full Planning", desc: "Winelands specialist creating elegant vineyard celebrations among Cape Dutch architecture and mountain panoramas.", specialties: ["Full Service", "Destination Weddings", "English Speaking", "Design & Styling"], imgs: ["https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=900&q=80"] },
  { id: "za-ph1", type: "vendor", category: "photographer", name: "Cape Light Co.", region: "Cape Town", city: "Cape Town", countrySlug: "south-africa", regionSlug: "cape-town", citySlug: "cape-town", lat: -33.9249, lng: 18.4241, online: true, rating: 5.0, reviews: 142, priceLabel: "£££", priceFrom: "R45,000", verified: true, lwdScore: 95, tag: "Award Winning", desc: "Cape Town's most published wedding photographer. Table Mountain golden hour, vineyard light, and raw South African landscapes.", specialties: ["Fine Art Editorial", "Documentary", "Destination Travel", "Cinematic"], imgs: ["https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=900&q=80"] },
  { id: "za-ph2", type: "vendor", category: "photographer", name: "Safari & Soul", region: "Kruger", city: "Hoedspruit", countrySlug: "south-africa", regionSlug: "kruger", citySlug: "hoedspruit", lat: -24.3869, lng: 30.9613, online: true, rating: 4.8, reviews: 56, priceLabel: "£££", priceFrom: "R35,000", verified: true, lwdScore: 87, tag: "Safari Weddings", desc: "Bush wedding specialist. Golden savannah light, wildlife backdrops, and intimate lodge celebrations in the Greater Kruger.", specialties: ["Documentary", "Destination Travel", "Elopement", "Film & Analog"], imgs: ["https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=900&q=80"] },
  { id: "za-v1", type: "vendor", category: "videographer", name: "Cape Reel Films", region: "Cape Town", city: "Cape Town", countrySlug: "south-africa", regionSlug: "cape-town", citySlug: "cape-town", lat: -33.9249, lng: 18.4241, online: true, rating: 4.9, reviews: 81, priceLabel: "£££", priceFrom: "R55,000", verified: true, lwdScore: 91, tag: "Top Rated", desc: "Cinematic Cape Town filmmakers. Helicopter coastal shots, vineyard golden-hour, and dramatic mountain ceremony coverage.", specialties: ["Cinematic Films", "Drone Aerials", "Documentary Style", "Same-Day Edits"], imgs: ["https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80"] },
  { id: "za-f1", type: "vendor", category: "florist", name: "Fynbos & Fig", region: "Cape Town", city: "Cape Town", countrySlug: "south-africa", regionSlug: "cape-town", citySlug: "cape-town", lat: -33.9249, lng: 18.4241, online: true, rating: 4.9, reviews: 94, priceLabel: "£££", priceFrom: "R40,000", verified: true, lwdScore: 90, tag: "Indigenous Blooms", desc: "Cape Town florist working with indigenous fynbos, proteas, and seasonal wild blooms for dramatic, uniquely South African arrangements.", specialties: ["Garden Installations", "Ceremony Arches", "Seasonal Sourcing", "Bridal Bouquets"], imgs: ["https://images.unsplash.com/photo-1487530811015-780780169993?auto=format&fit=crop&w=900&q=80"] },
  { id: "za-c1", type: "vendor", category: "caterer", name: "Winelands Kitchen", region: "Winelands", city: "Stellenbosch", countrySlug: "south-africa", regionSlug: "winelands", citySlug: "stellenbosch", lat: -33.9321, lng: 18.8602, online: true, rating: 4.9, reviews: 86, priceLabel: "£££", priceFrom: "R950pp", verified: true, lwdScore: 89, tag: "Estate Dining", desc: "Stellenbosch caterer creating vineyard feast experiences — braai stations, Cape Malay fusion, and estate wine pairings.", specialties: ["Tasting Menus", "Wine Pairing", "Live Cooking", "Dietary Specialist"], imgs: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // SWEDEN
  // ═══════════════════════════════════════════════════════════════════════════

  { id: "se-p1", type: "vendor", category: "planner", name: "Nordic Nuptials", region: "Stockholm", city: "Stockholm", countrySlug: "sweden", regionSlug: "stockholm", citySlug: "stockholm", lat: 59.3293, lng: 18.0686, online: true, rating: 4.9, reviews: 68, priceLabel: "£££", priceFrom: "SEK 85,000", verified: true, lwdScore: 90, tag: "Top Planner", serviceTier: "Full Planning", desc: "Stockholm luxury planner creating minimalist-elegant celebrations in archipelago islands, castles, and converted industrial spaces.", specialties: ["Full Service", "English Speaking", "Design & Styling", "Destination Weddings"], imgs: ["https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80"] },
  { id: "se-ph1", type: "vendor", category: "photographer", name: "Midnight Sun Studio", region: "Stockholm", city: "Stockholm", countrySlug: "sweden", regionSlug: "stockholm", citySlug: "stockholm", lat: 59.3293, lng: 18.0686, online: true, rating: 5.0, reviews: 92, priceLabel: "£££", priceFrom: "SEK 45,000", verified: true, lwdScore: 93, tag: "Award Winning", desc: "Stockholm's finest wedding photographer. Midnight sun portraits, archipelago light, and clean Scandinavian editorial style.", specialties: ["Fine Art Editorial", "Documentary", "Film & Analog", "Destination Travel"], imgs: ["https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=900&q=80"] },
  { id: "se-v1", type: "vendor", category: "videographer", name: "Scandia Films", region: "Stockholm", city: "Stockholm", countrySlug: "sweden", regionSlug: "stockholm", citySlug: "stockholm", lat: 59.3293, lng: 18.0686, online: true, rating: 4.8, reviews: 47, priceLabel: "£££", priceFrom: "SEK 55,000", verified: true, lwdScore: 86, tag: null, desc: "Swedish cinematic filmmakers known for atmospheric, moody storytelling — forest ceremonies, lakeside vows, and Nordic winter light.", specialties: ["Cinematic Films", "Documentary Style", "Drone Aerials", "Short Films"], imgs: ["https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80"] },
  { id: "se-f1", type: "vendor", category: "florist", name: "Vild Flora", region: "Stockholm", city: "Stockholm", countrySlug: "sweden", regionSlug: "stockholm", citySlug: "stockholm", lat: 59.3293, lng: 18.0686, online: true, rating: 4.9, reviews: 58, priceLabel: "£££", priceFrom: "SEK 35,000", verified: true, lwdScore: 88, tag: "Nordic Wild", desc: "Stockholm florist creating wild Nordic arrangements — birch branches, moss, seasonal Scandinavian blooms, and minimalist tablescape design.", specialties: ["Garden Installations", "Seasonal Sourcing", "Table Scaping", "Bridal Bouquets"], imgs: ["https://images.unsplash.com/photo-1487530811015-780780169993?auto=format&fit=crop&w=900&q=80"] },
  { id: "se-c1", type: "vendor", category: "caterer", name: "Skål Catering", region: "Stockholm", city: "Stockholm", countrySlug: "sweden", regionSlug: "stockholm", citySlug: "stockholm", lat: 59.3293, lng: 18.0686, online: true, rating: 4.8, reviews: 54, priceLabel: "£££", priceFrom: "SEK 1,200pp", verified: true, lwdScore: 87, tag: "New Nordic", desc: "Stockholm's leading wedding caterer. New Nordic tasting menus, foraging-inspired plates, and natural wine pairings in historic venues.", specialties: ["Tasting Menus", "Wine Pairing", "Dietary Specialist", "Live Cooking"], imgs: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // CANADA
  // ═══════════════════════════════════════════════════════════════════════════

  { id: "ca-p1", type: "vendor", category: "planner", name: "True North Events", region: "British Columbia", city: "Vancouver", countrySlug: "canada", regionSlug: "british-columbia", citySlug: "vancouver", lat: 49.2827, lng: -123.1207, online: true, rating: 5.0, reviews: 112, priceLabel: "££££", priceFrom: "CAD $18,000", verified: true, lwdScore: 95, tag: "Top Planner", serviceTier: "Full Planning", desc: "Vancouver's premier luxury planner. Mountain-meets-ocean celebrations, winery weddings, and Pacific Northwest elegance.", specialties: ["Full Service", "Luxury & High-End", "English Speaking", "Destination Weddings"], imgs: ["https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80"] },
  { id: "ca-p2", type: "vendor", category: "planner", name: "La Belle Époque", region: "Ontario", city: "Toronto", countrySlug: "canada", regionSlug: "ontario", citySlug: "toronto", lat: 43.6532, lng: -79.3832, online: true, rating: 4.9, reviews: 86, priceLabel: "££££", priceFrom: "CAD $15,000", verified: true, lwdScore: 92, tag: null, serviceTier: "Full Planning", desc: "Toronto luxury planner orchestrating grand celebrations in heritage estates, downtown lofts, and Muskoka lakeside retreats.", specialties: ["Full Service", "Luxury & High-End", "Cultural & Multi-Faith", "English Speaking"], imgs: ["https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=900&q=80"] },
  { id: "ca-ph1", type: "vendor", category: "photographer", name: "Pacific Light Co.", region: "British Columbia", city: "Vancouver", countrySlug: "canada", regionSlug: "british-columbia", citySlug: "vancouver", lat: 49.2827, lng: -123.1207, online: true, rating: 5.0, reviews: 128, priceLabel: "££££", priceFrom: "CAD $6,500", verified: true, lwdScore: 94, tag: "Award Winning", desc: "Vancouver's most sought-after wedding photographer. Mountain heli-sessions, rainforest portraits, and Pacific coastline editorial.", specialties: ["Fine Art Editorial", "Destination Travel", "Cinematic", "Elopement"], imgs: ["https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=900&q=80"] },
  { id: "ca-ph2", type: "vendor", category: "photographer", name: "Maple & Light", region: "Ontario", city: "Toronto", countrySlug: "canada", regionSlug: "ontario", citySlug: "toronto", lat: 43.6532, lng: -79.3832, online: true, rating: 4.9, reviews: 94, priceLabel: "£££", priceFrom: "CAD $4,500", verified: true, lwdScore: 90, tag: "Top Rated", desc: "Toronto documentary photographer capturing multi-cultural celebrations, autumn vineyard portraits, and urban rooftop sessions.", specialties: ["Documentary", "Fine Art Editorial", "Film & Analog", "Engagement Sessions"], imgs: ["https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=900&q=80"] },
  { id: "ca-v1", type: "vendor", category: "videographer", name: "Mountain Reel", region: "British Columbia", city: "Whistler", countrySlug: "canada", regionSlug: "british-columbia", citySlug: "whistler", lat: 50.1163, lng: -122.9574, online: true, rating: 4.9, reviews: 72, priceLabel: "££££", priceFrom: "CAD $7,000", verified: true, lwdScore: 91, tag: "Top Rated", desc: "Whistler-based cinematic filmmakers. Mountain-top first looks, helicopter sweeps, and dramatic Pacific Northwest landscapes.", specialties: ["Cinematic Films", "Drone Aerials", "Documentary Style", "Destination Films"], imgs: ["https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80"] },
  { id: "ca-f1", type: "vendor", category: "florist", name: "Wild North Florals", region: "British Columbia", city: "Vancouver", countrySlug: "canada", regionSlug: "british-columbia", citySlug: "vancouver", lat: 49.2827, lng: -123.1207, online: true, rating: 4.9, reviews: 82, priceLabel: "£££", priceFrom: "CAD $5,000", verified: true, lwdScore: 89, tag: "West Coast Wild", desc: "Vancouver florist creating Pacific Northwest arrangements — cedar, moss, ferns, and seasonal blooms with natural, untamed elegance.", specialties: ["Garden Installations", "Seasonal Sourcing", "Ceremony Arches", "Bridal Bouquets"], imgs: ["https://images.unsplash.com/photo-1487530811015-780780169993?auto=format&fit=crop&w=900&q=80"] },
  { id: "ca-c1", type: "vendor", category: "caterer", name: "Harvest Table", region: "Ontario", city: "Niagara-on-the-Lake", countrySlug: "canada", regionSlug: "ontario", citySlug: "niagara-on-the-lake", lat: 43.2551, lng: -79.0714, online: true, rating: 4.9, reviews: 76, priceLabel: "£££", priceFrom: "CAD $145pp", verified: true, lwdScore: 88, tag: "Farm to Table", desc: "Niagara wine country caterer. Vineyard harvest menus, Ontario produce, and icewine dessert pairings in estate settings.", specialties: ["Tasting Menus", "Wine Pairing", "Live Cooking", "Dietary Specialist"], imgs: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80"] },
];

export const VENDOR_CATEGORIES = [
  "All", "planner", "photographer", "videographer", "florist", "caterer", "musician", "celebrant",
];

export const PLANNER_SERVICE_TIERS = [
  "Full Planning",
  "Partial Planning",
  "Day Coordination",
  "Design and Styling",
];

// ── Hydrate curated index scores ─────────────────────────────────────────────
hydrateScores(VENDORS);
