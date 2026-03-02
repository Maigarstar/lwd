import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { getDarkPalette, getLightPalette, getDefaultMode } from "./theme/tokens";

// ═══════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM
// ═══════════════════════════════════════════════════════════════════════
const DARK_C = {
  black:   "#080808",
  dark:    "#0f0f0f",
  card:    "#141414",
  border:  "#1e1e1e",
  border2: "#2a2a2a",
  gold:    "#C9A84C",
  gold2:   "#e8c97a",
  goldDim: "rgba(201,168,76,0.15)",
  white:   "#ffffff",
  off:     "#f5f0e8",
  grey:    "#888888",
  grey2:   "#555555",
  green:   "#22c55e",
  blue:    "#60a5fa",
  rose:    "#f43f5e",
};

const LIGHT_C = {
  black:   "#faf8f5",
  dark:    "#f0ece6",
  card:    "#ffffff",
  border:  "#e8e2da",
  border2: "#d4cdc4",
  gold:    "#9b7a1a",
  gold2:   "#b8940e",
  goldDim: "rgba(155,122,26,0.12)",
  white:   "#1c1914",
  off:     "#2a2520",
  grey:    "#6b6358",
  grey2:   "#9c9188",
  green:   "#15803d",
  blue:    "#1d4ed8",
  rose:    "#be123c",
};

const ThemeContext = createContext(LIGHT_C);
// Module-level alias (shadowed inside components by useContext)
const C = LIGHT_C;

// ═══════════════════════════════════════════════════════════════════════
// FEATURED VENUE SLIDER DATA — real Unsplash photography
// ═══════════════════════════════════════════════════════════════════════
const FEATURED_VENUES = [
  { id:1, name:"Villa Rosanova", location:"San Casciano, Tuscany · Italy",
    highlight:"February's Estate of the Month",
    tagline:"An eighteenth-century Tuscan estate for weddings of extraordinary distinction",
    img:"https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80",
    link:"venue" },
  { id:2, name:"Château de Lumière", location:"Gordes, Provence · France",
    highlight:"Destination Wedding Pick",
    tagline:"A seventeenth-century château set amongst the lavender fields of Provence",
    img:"https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1920&q=80",
    link:null },
  { id:3, name:"The Grand Pavilion", location:"Mayfair, London · UK",
    highlight:"Top Rated This Season",
    tagline:"An iconic Victorian ballroom draped in crystal chandeliers and candlelight",
    img:"https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80",
    link:null },
  { id:4, name:"Villa d'Este", location:"Lake Como, Lombardy · Italy",
    highlight:"Editor's Choice",
    tagline:"A Renaissance villa overlooking the sapphire waters of Lake Como",
    img:"https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1920&q=80",
    link:null },
  { id:5, name:"Château Margaux Estate", location:"Bordeaux · France",
    highlight:"Wine Country Wedding",
    tagline:"Exchange vows among centuries-old vineyards and golden stone architecture",
    img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80",
    link:null },
  { id:6, name:"Amalfi Cliffside Estate", location:"Ravello, Amalfi Coast · Italy",
    highlight:"Cliffside Ceremony Favourite",
    tagline:"Perched above the Tyrrhenian Sea with panoramic views across the coast",
    img:"https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=1920&q=80",
    link:null },
  { id:7, name:"Gleneagles Estate", location:"Perthshire, Scotland · UK",
    highlight:"Highland Romance",
    tagline:"A legendary Scottish estate with rolling glens and world-class hospitality",
    img:"https://images.unsplash.com/photo-1549417229-7686ac5595fd?auto=format&fit=crop&w=1920&q=80",
    link:null },
  { id:8, name:"Santorini Caldera House", location:"Oia, Santorini · Greece",
    highlight:"Island Escape",
    tagline:"Whitewashed terraces and infinite caldera views for an unforgettable celebration",
    img:"https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1920&q=80",
    link:null },
  { id:9, name:"Palazzo Vendramin", location:"Grand Canal, Venice · Italy",
    highlight:"Most Romantic Venue",
    tagline:"A sixteenth-century palazzo on Venice's Grand Canal — utterly unmatched",
    img:"https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1920&q=80",
    link:null },
  { id:10, name:"Domaine de Châteauvieux", location:"Geneva, Switzerland",
    highlight:"Alpine Luxury",
    tagline:"A Michelin-starred domain with Jura mountain panoramas and private vineyards",
    img:"https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1920&q=80",
    link:null },
];

// ═══════════════════════════════════════════════════════════════════════
// VENDOR DATA
// ═══════════════════════════════════════════════════════════════════════
const VENDORS = [
  {
    id:1, name:"The Grand Pavilion", cat:"venues", country:"UK", city:"London",
    rating:4.9, reviews:312, price:"£8,500", priceNum:8500, featured:true, verified:true,
    tag:"Best of 2025", video:true, capacity:320, standing:500,
    rooms:["Grand Ballroom","Terrace Suite","Garden Pavilion","Bridal Suite"],
    styles:["Black Tie","Garden Party","Classic"], response:"< 2 hrs",
    avail:"Booking 2025–2026", leads:47, views:1240, conv:12,
    imgs:[
      "https://placehold.co/800x500/ede8df/9a9080?text=Grand+Pavilion+1",
      "https://placehold.co/800x500/e8e3da/9a9080?text=Grand+Pavilion+2",
      "https://placehold.co/800x500/ece7de/9a9080?text=Grand+Pavilion+3",
      "https://placehold.co/800x500/eae5dc/9a9080?text=Grand+Pavilion+4",
    ],
    desc:"An iconic Victorian ballroom draped in crystal chandeliers. Exclusive hire, award-winning in-house catering, 60 guest bedrooms and a dedicated wedding concierge.",
    includes:["Exclusive Hire","In-House Catering","60 Bedrooms","Bridal Suite","Full AV Rig"],
    awards:["Hitched 2025","Vogue Weddings"],
    packages:[{n:"Essential",p:"£8,500",d:"Venue hire, tables, chairs"},{n:"Signature",p:"£14,000",d:"+ Catering for 100, bar, florals"},{n:"Grand",p:"£22,000",d:"+ 3-course dinner, overnight stay"}],
  },
  {
    id:2, name:"Château de Lumière", cat:"venues", country:"France", city:"Provence",
    rating:5.0, reviews:276, price:"£22,000", priceNum:22000, featured:true, verified:true,
    tag:"Luxury Pick", video:true, capacity:180, standing:260,
    rooms:["Grand Salon","Orangerie","Poolside Terrace","Chapel","Vineyard"],
    styles:["Romantic","Rustic Luxe","Destination"], response:"< 4 hrs",
    avail:"Limited 2025", leads:31, views:890, conv:18,
    imgs:[
      "https://placehold.co/800x500/e8f0e6/708a60?text=Chateau+de+Lumiere+1",
      "https://placehold.co/800x500/e4ece2/708a60?text=Chateau+de+Lumiere+2",
      "https://placehold.co/800x500/e6eee4/708a60?text=Chateau+de+Lumiere+3",
      "https://placehold.co/800x500/e8f0e6/708a60?text=Chateau+de+Lumiere+4",
    ],
    desc:"A 17th-century château in the lavender fields of Provence. 3-night exclusive hire, Michelin-starred catering, 16 en-suite rooms, private vineyard.",
    includes:["3-Night Exclusive","Michelin Catering","16 Bedrooms","Private Vineyard","Historic Chapel"],
    awards:["Condé Nast 2024","Vogue Weddings","Harper's Bazaar"],
    packages:[{n:"Elopement",p:"£12,000",d:"2 nights, ceremony, dinner for 20"},{n:"Signature",p:"£22,000",d:"3 nights exclusive, 80 guests"},{n:"Grand Affaire",p:"£38,000",d:"Full estate, 180 guests, all meals"}],
  },
  {
    id:3, name:"Amara Photography", cat:"photographers", country:"USA", city:"New York",
    rating:5.0, reviews:218, price:"£4,200", priceNum:4200, featured:true, verified:true,
    tag:"Editor's Pick", video:false, capacity:null, standing:null, rooms:null,
    styles:["Documentary","Fine Art","Editorial"], response:"Same Day",
    avail:"Booking 2025", leads:28, views:740, conv:15,
    imgs:[
      "https://placehold.co/800x500/e8e8f0/606090?text=Amara+Photography+1",
      "https://placehold.co/800x500/e4e4ec/606090?text=Amara+Photography+2",
      "https://placehold.co/800x500/e6e6ee/606090?text=Amara+Photography+3",
      "https://placehold.co/800x500/e8e8f0/606090?text=Amara+Photography+4",
    ],
    desc:"Award-winning documentary and fine art wedding photography. 400+ weddings across 30 countries. Capturing raw emotion and stolen moments.",
    includes:["8-Hour Coverage","Engagement Shoot","Gallery in 3 Weeks","Second Shooter","Print Release"],
    awards:["WPJA Award 2024","Rangefinder Top 10"],
    packages:[{n:"Essentials",p:"£4,200",d:"8hrs, online gallery"},{n:"Signature",p:"£6,800",d:"+ Engagement, second shooter, album"},{n:"Elite",p:"£9,500",d:"+ 2-day coverage, luxury album"}],
  },
  {
    id:4, name:"Bloom & Wild Florals", cat:"florists", country:"France", city:"Paris",
    rating:4.9, reviews:189, price:"£2,800", priceNum:2800, featured:true, verified:true,
    tag:"Top Rated", video:false, capacity:null, standing:null, rooms:null,
    styles:["Garden Romantic","Maximalist","Sculptural"], response:"< 3 hrs",
    avail:"Booking 2025–2026", leads:22, views:560, conv:11,
    imgs:[
      "https://placehold.co/800x500/f0ece6/9a7060?text=Bloom+%26+Wild+1",
      "https://placehold.co/800x500/ece8e2/9a7060?text=Bloom+%26+Wild+2",
      "https://placehold.co/800x500/eeeae4/9a7060?text=Bloom+%26+Wild+3",
      "https://placehold.co/800x500/f0ece6/9a7060?text=Bloom+%26+Wild+4",
    ],
    desc:"Parisian floral artistry at its finest. Cascading garden arrangements, sculptural centrepieces and fragrant bridal bouquets using the season's finest blooms.",
    includes:["Full Venue Styling","Bridal Bouquet","Trial Arrangement","Delivery & Setup","Boutonnieres"],
    awards:["Belle Fleur Award 2024"],
    packages:[{n:"Bridal",p:"£2,800",d:"Bouquet, boutonnieres, ceremony arch"},{n:"Full Styling",p:"£5,500",d:"+ All centrepieces, venue florals"},{n:"Couture",p:"£9,000",d:"Complete installation, all florals"}],
  },
  {
    id:5, name:"The Jazz & Soul Collective", cat:"music", country:"USA", city:"New Orleans",
    rating:5.0, reviews:203, price:"£3,500", priceNum:3500, featured:true, verified:true,
    tag:"Most Booked", video:true, capacity:null, standing:null, rooms:null,
    styles:["Jazz","Soul","Motown","Pop"], response:"< 1 hr",
    avail:"Some 2025 Dates", leads:34, views:820, conv:14,
    imgs:[
      "https://placehold.co/800x500/ede8f0/806090?text=Jazz+%26+Soul+1",
      "https://placehold.co/800x500/e9e4ec/806090?text=Jazz+%26+Soul+2",
      "https://placehold.co/800x500/ebe6ee/806090?text=Jazz+%26+Soul+3",
      "https://placehold.co/800x500/ede8f0/806090?text=Jazz+%26+Soul+4",
    ],
    desc:"10-piece live jazz, soul and R&B ensemble that transforms receptions into legendary nights. Dance floors guaranteed full from the first note to the last.",
    includes:["10 Musicians","Ceremony Music","Cocktail Hour Set","DJ Set Available","Sound System"],
    awards:["WeddingWire Choice 2024"],
    packages:[{n:"Cocktail",p:"£3,500",d:"3hr set, 5 musicians"},{n:"Signature",p:"£5,500",d:"Full evening, 8 musicians, DJ"},{n:"Legendary",p:"£8,000",d:"Full 10-piece, all day, lighting"}],
  },
  {
    id:6, name:"Maison Bridal Couture", cat:"attire", country:"Italy", city:"Milan",
    rating:5.0, reviews:97, price:"£3,800", priceNum:3800, featured:true, verified:true,
    tag:"Editor's Pick", video:false, capacity:null, standing:null, rooms:null,
    styles:["Couture","Minimalist","Romantic"], response:"< 6 hrs",
    avail:"Appointments Available", leads:19, views:480, conv:16,
    imgs:[
      "https://placehold.co/800x500/f0e8ee/906070?text=Maison+Bridal+1",
      "https://placehold.co/800x500/ece4ea/906070?text=Maison+Bridal+2",
      "https://placehold.co/800x500/eee6ec/906070?text=Maison+Bridal+3",
      "https://placehold.co/800x500/f0e8ee/906070?text=Maison+Bridal+4",
    ],
    desc:"Bespoke Italian bridal couture. Each gown hand-stitched over 6 months from first sketch to final fitting. Silk-lined, unforgettable, truly yours.",
    includes:["Fully Bespoke","Silk Lining","5 Fittings","Worldwide Shipping","Preservation Kit"],
    awards:["Vogue Italia 2024","Harper's Bazaar Featured"],
    packages:[{n:"Prêt-à-Porter",p:"£3,800",d:"Semi-bespoke, 2 fittings"},{n:"Bespoke",p:"£7,500",d:"Fully custom, 5 fittings, silk"},{n:"Haute Couture",p:"£15,000",d:"Complete atelier experience"}],
  },
  {
    id:7, name:"Luna & Co. Planning", cat:"planners", country:"Spain", city:"Barcelona",
    rating:5.0, reviews:178, price:"£5,500", priceNum:5500, featured:true, verified:true,
    tag:"Top Rated", video:false, capacity:null, standing:null, rooms:null,
    styles:["Destination","Luxury","Intimate"], response:"Same Day",
    avail:"Limited 2025", leads:41, views:970, conv:17,
    imgs:[
      "https://placehold.co/800x500/e8eef0/607a8a?text=Luna+%26+Co+1",
      "https://placehold.co/800x500/e4eaec/607a8a?text=Luna+%26+Co+2",
      "https://placehold.co/800x500/e6ecee/607a8a?text=Luna+%26+Co+3",
      "https://placehold.co/800x500/e8eef0/607a8a?text=Luna+%26+Co+4",
    ],
    desc:"Full-service destination wedding planning across Europe. 200+ weddings planned. Vendor network of 2,000+. Fluent in love, logistics and luxury.",
    includes:["Full Planning","Vendor Network","Day Coordination","Concierge Service","Legal Support"],
    awards:["Spanish Wedding Awards 2024","Junebug Featured"],
    packages:[{n:"Coordination",p:"£5,500",d:"Day-of coordination only"},{n:"Partial",p:"£9,500",d:"Final 3 months planning"},{n:"Full Service",p:"£18,000",d:"Complete A–Z destination planning"}],
  },
  {
    id:8, name:"Sweet Ceremony Cakes", cat:"cakes", country:"UK", city:"Edinburgh",
    rating:4.8, reviews:154, price:"£850", priceNum:850, featured:false, verified:true,
    tag:null, video:false, capacity:null, standing:null, rooms:null,
    styles:["Classic Tiered","Modern Sculpted","Rustic"], response:"< 12 hrs",
    avail:"Booking 2025", leads:15, views:310, conv:9,
    imgs:[
      "https://placehold.co/800x500/f0ece8/9a8068?text=Sweet+Ceremony+1",
      "https://placehold.co/800x500/ece8e4/9a8068?text=Sweet+Ceremony+2",
      "https://placehold.co/800x500/eeeae6/9a8068?text=Sweet+Ceremony+3",
      "https://placehold.co/800x500/f0ece8/9a8068?text=Sweet+Ceremony+4",
    ],
    desc:"Handcrafted multi-tier wedding cakes with bespoke designs. Tasting sessions available. Delivered and set up nationwide. Dietary options available.",
    includes:["Tasting Session","Nationwide Delivery","Setup Included","Dietary Options","Cake Stand Hire"],
    awards:[],
    packages:[{n:"Classic",p:"£850",d:"3-tier, standard flavours"},{n:"Signature",p:"£1,400",d:"5-tier, bespoke design, gold leaf"},{n:"Showpiece",p:"£2,200",d:"Sculpted showpiece, sugar florals"}],
  },
];

const CATS = [
  {id:"all",label:"All Vendors",icon:"◈"},
  {id:"venues",label:"Venues",icon:"🏛"},
  {id:"photographers",label:"Photography",icon:"◉"},
  {id:"florists",label:"Florals",icon:"✿"},
  {id:"music",label:"Music",icon:"♪"},
  {id:"planners",label:"Planners",icon:"◎"},
  {id:"attire",label:"Attire",icon:"◇"},
  {id:"cakes",label:"Cakes",icon:"◆"},
  {id:"caterers",label:"Catering",icon:"◈"},
];

const COUNTRIES = ["Worldwide","United Kingdom","United States","France","Italy","Spain","Australia","Canada","Greece","Portugal","UAE"];

// ═══════════════════════════════════════════════════════════════════════
// AI CHAT ENGINE
// ═══════════════════════════════════════════════════════════════════════
const AI_FLOWS = {
  greeting: {
    msg: "Hello! I'm your personal wedding consultant at Luxury Wedding Directory. I'm here to help you find the perfect vendors for your dream day. \n\nShall we start?",
    options: ["Yes, let's find my perfect vendors ✨","I have a specific question","I'm a vendor looking to list my business"],
  },
  start: {
    msg: "Wonderful! Let's find your perfect wedding team. First — when are you planning to get married?",
    options: ["This year (2025)","Next year (2026)","2027 or beyond","We're flexible on dates"],
  },
  location: {
    msg: "How exciting! And where are you dreaming of getting married?",
    options: ["UK & Ireland","Europe (France, Italy, Spain...)","USA & Canada","Destination (anywhere!)"],
  },
  budget: {
    msg: "Love it! To find vendors that truly match your vision, what's your overall wedding budget?",
    options: ["Under £20,000","£20,000 – £50,000","£50,000 – £100,000","£100,000+ (no limits!)"],
  },
  guests: {
    msg: "Perfect. How many guests are you planning to invite?",
    options: ["Intimate (under 30)","Small (30–80)","Medium (80–150)","Large (150–300)","Grand (300+)"],
  },
  priorities: {
    msg: "Almost there! Which vendors are your top priority right now?",
    options: ["Venue — it sets everything else","Photographer — memories last forever","Full planning — I need help with everything","Show me the best across all categories"],
  },
  capture: {
    msg: "I've found some incredible matches for you! To send you a personalised shortlist with exclusive availability and pricing, I just need your email. What is it?",
    options: null,
    isCapture: true,
  },
  done: {
    msg: "🎉 Your personalised shortlist is on its way! Our team will also be in touch within 24 hours to discuss your options.\n\nIn the meantime, browse our full directory below — your matched vendors are highlighted.",
    options: ["Browse my matches","Start over","Speak to a consultant"],
  },
};

// ═══════════════════════════════════════════════════════════════════════
// UTILITY COMPONENTS
// ═══════════════════════════════════════════════════════════════════════
function Stars({ r }) {
  const C = useContext(ThemeContext);
  return (
    <div style={{display:"flex",gap:2,alignItems:"center"}}>
      {[1,2,3,4,5].map(i=>(
        <svg key={i} width="10" height="10" viewBox="0 0 24 24"
          fill={i<=Math.round(r)?C.gold:"#333"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

function Badge({text, color, bg, border}) {
  const C = useContext(ThemeContext);
  return (
    <span style={{
      fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase",
      color: color || "#1a1a1a", background: bg || C.goldDim, border:`1px solid ${border || C.gold}`,
      padding:"3px 9px", borderRadius:"var(--lwd-radius-input)", whiteSpace:"nowrap",
    }}>{text}</span>
  );
}

function Pill({text, color, bg, border}) {
  const C = useContext(ThemeContext);
  return (
    <span style={{
      fontSize:11, color: color || C.grey, background: bg || "rgba(128,128,128,0.08)", border:`1px solid ${border || "rgba(128,128,128,0.15)"}`,
      padding:"3px 10px", borderRadius:20, whiteSpace:"nowrap",
    }}>{text}</span>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// IMAGE SLIDER
// ═══════════════════════════════════════════════════════════════════════
function ImageSlider({ imgs, name, tag, featured, saved, onSave, video }) {
  const C = useContext(ThemeContext);
  const [idx, setIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (hovered) timerRef.current = setInterval(() => setIdx(i=>(i+1)%imgs.length), 1200);
    else { clearInterval(timerRef.current); setIdx(0); }
    return () => clearInterval(timerRef.current);
  }, [hovered, imgs.length]);

  return (
    <div style={{position:"relative",height:230,overflow:"hidden",background:"#0a0a0a",cursor:"pointer"}}
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}>
      {imgs.map((src,i)=>(
        <img key={i} src={src} alt={name} style={{
          position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
          opacity:i===idx?1:0,
          transform:i===idx&&hovered?"scale(1.06)":"scale(1)", transition:"opacity 0.7s ease, transform 4s ease",
        }}/>
      ))}

      {/* Dark gradient */}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.6) 100%)"}}/>

      {/* Featured shimmer */}
      {featured && <div style={{
        position:"absolute",top:0,left:0,right:0,height:3,
        backgroundImage:`linear-gradient(90deg,${C.gold},${C.gold2},${C.gold})`,
        backgroundSize:"200% 100%", animation:"shimmer 2.5s linear infinite",
      }}/>}

      {/* Tag */}
      {tag && <div style={{
        position:"absolute",top:14,left:14,
        background:"rgba(8,8,8,0.85)",backdropFilter:"blur(12px)",
        color:C.gold, fontSize:10, fontWeight:700, letterSpacing:"1.5px",
        textTransform:"uppercase", padding:"5px 11px",
        border:`1px solid rgba(201,168,76,0.3)`,
      }}>{tag}</div>}

      {/* Video badge */}
      {video && <div style={{
        position:"absolute",top:14,right:52,
        background:"rgba(8,8,8,0.85)",backdropFilter:"blur(12px)",
        color:"#fff", fontSize:10, padding:"5px 9px",
        border:"1px solid rgba(255,255,255,0.1)",
        display:"flex",alignItems:"center",gap:4,
      }}>
        <span style={{color:C.rose,fontSize:8}}>▶</span> VIDEO
      </div>}

      {/* Save */}
      <button onClick={e=>{e.stopPropagation();onSave();}} style={{
        position:"absolute",top:10,right:10,width:34,height:34,
        background:"rgba(8,8,8,0.7)",backdropFilter:"blur(12px)",
        border:`1px solid rgba(255,255,255,0.1)`,cursor:"pointer",
        display:"flex",alignItems:"center",justifyContent:"center",
        borderRadius:"50%", fontSize:14, transition:"transform 0.2s",
        transform:saved?"scale(1.15)":"scale(1)",
      }}>{saved?"❤️":"🤍"}</button>

      {/* Dots */}
      {imgs.length>1 && hovered && (
        <div style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",display:"flex",gap:5}}>
          {imgs.map((_,i)=>(
            <div key={i} onClick={e=>{e.stopPropagation();setIdx(i);}} style={{
              width:i===idx?20:6,height:6,borderRadius:3,cursor:"pointer",
              background:i===idx?"#fff":"rgba(255,255,255,0.4)",
              transition:"all 0.3s",
            }}/>
          ))}
        </div>
      )}

      {/* Hover hint */}
      {!hovered && (
        <div style={{
          position:"absolute",bottom:12,left:14,
          fontSize:10,color:"rgba(255,255,255,0.5)",letterSpacing:"1px",
          display:"flex",alignItems:"center",gap:5,
        }}>
          <span style={{opacity:0.6}}>◈</span> Hover to browse {imgs.length} photos
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// VENDOR CARD
// ═══════════════════════════════════════════════════════════════════════
function VendorCard({ v, saved, onSave, onEnquire, onExpand }) {
  const C = useContext(ThemeContext);
  const [open, setOpen] = useState(false);
  const catObj = CATS.find(c=>c.id===v.cat)||{label:v.cat,icon:"◈"};

  return (
    <div style={{
      background:C.card, border:`1px solid ${C.border}`,
      transition:"all 0.35s cubic-bezier(0.4,0,0.2,1)",
      display:"flex", flexDirection:"column",
    }}
    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.border2;e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 24px 60px rgba(0,0,0,0.5)`;}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>

      <ImageSlider imgs={v.imgs} name={v.name} tag={v.tag}
        featured={v.featured} saved={saved} onSave={onSave} video={v.video}/>

      <div style={{padding:"20px 22px 0",flex:1,display:"flex",flexDirection:"column"}}>
        {/* Meta row */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <span style={{fontSize:10,color:C.gold,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase"}}>{catObj.icon} {catObj.label}</span>
            {v.verified && <span style={{fontSize:10,color:C.green,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",padding:"2px 8px",borderRadius:20}}>✓ Verified</span>}
          </div>
          <span style={{fontSize:11,color:C.grey2}}>📍 {v.city}</span>
        </div>

        {/* Name */}
        <div style={{fontFamily:"var(--font-heading-primary)",fontSize:21,fontWeight:600,color:C.white,lineHeight:1.2,marginBottom:6}}>{v.name}</div>

        {/* Rating */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <Stars r={v.rating}/>
          <span style={{fontSize:12,fontWeight:700,color:C.white}}>{v.rating}</span>
          <span style={{fontSize:12,color:C.grey}}>({v.reviews})</span>
          <span style={{marginLeft:"auto",fontSize:11,color:C.grey,display:"flex",alignItems:"center",gap:4}}>
            <span style={{color:C.green,fontSize:10}}>⚡</span>{v.response}
          </span>
        </div>

        {/* Description */}
        <p style={{fontSize:13,color:"#999",lineHeight:1.7,marginBottom:14}}>{v.desc}</p>

        {/* Stats grid */}
        <div style={{display:"grid",gridTemplateColumns:v.capacity?"1fr 1fr 1fr":"1fr 1fr",gap:8,marginBottom:14}}>
          <StatBox label="From" val={v.price} icon="💰"/>
          {v.capacity && <StatBox label="Seated" val={v.capacity} icon="🪑"/>}
          {v.standing && <StatBox label="Standing" val={v.standing} icon="🎊"/>}
          {!v.capacity && <StatBox label="Availability" val={v.avail} icon="📅"/>}
        </div>

        {/* Expand toggle */}
        <button onClick={()=>setOpen(x=>!x)} style={{
          background:"none",border:"none",cursor:"pointer",
          color:C.gold,fontSize:11,fontWeight:600,letterSpacing:"1px",
          padding:"6px 0",display:"flex",alignItems:"center",gap:6,
          borderTop:`1px solid ${C.border}`,marginBottom:open?12:0,
        }}>
          <span style={{transition:"transform 0.3s",display:"inline-block",transform:open?"rotate(180deg)":"rotate(0)"}}>&or;</span>
          {open?"Hide details":"View packages, rooms & awards"}
        </button>

        {open && (
          <div style={{paddingBottom:4}}>
            {/* Packages */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:C.grey,marginBottom:8}}>Packages</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {v.packages.map((p,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"rgba(255,255,255,0.03)",border:`1px solid ${C.border}`}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color:C.white}}>{p.n}</div>
                      <div style={{fontSize:11,color:C.grey}}>{p.d}</div>
                    </div>
                    <div style={{fontSize:13,fontWeight:700,color:C.gold,whiteSpace:"nowrap"}}>{p.p}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rooms */}
            {v.rooms && (
              <div style={{marginBottom:12}}>
                <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:C.grey,marginBottom:8}}>Spaces & Rooms</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {v.rooms.map(r=><Pill key={r} text={r} color={C.gold} bg="rgba(201,168,76,0.08)" border="rgba(201,168,76,0.2)"/>)}
                </div>
              </div>
            )}

            {/* Styles */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:C.grey,marginBottom:8}}>Wedding Styles</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {v.styles.map(s=><Pill key={s} text={s} color={C.blue} bg="rgba(96,165,250,0.08)" border="rgba(96,165,250,0.2)"/>)}
              </div>
            </div>

            {/* Includes */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:C.grey,marginBottom:8}}>What's Included</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                {v.includes.map(h=>(
                  <div key={h} style={{fontSize:11,color:"#aaa",display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{color:C.green,flexShrink:0}}>✓</span>{h}
                  </div>
                ))}
              </div>
            </div>

            {/* Awards */}
            {v.awards?.length>0 && (
              <div>
                <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:C.grey,marginBottom:8}}>Awards</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {v.awards.map(a=><Pill key={a} text={"🏆 "+a} color="#fcd34d" bg="rgba(252,211,77,0.08)" border="rgba(252,211,77,0.2)"/>)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{padding:"16px 22px 22px",display:"flex",gap:8}}>
        <button onClick={()=>onEnquire(v)} style={{
          flex:1,background:C.gold,color:C.black,border:"none",
          padding:"12px 0",fontSize:11,fontWeight:800,letterSpacing:"1.5px",
          textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit",
          transition:"all 0.2s",
        }}
        onMouseEnter={e=>{e.currentTarget.style.background=C.gold2;}}
        onMouseLeave={e=>{e.currentTarget.style.background=C.gold;}}>
          Send Enquiry
        </button>
        <button onClick={()=>onExpand(v)} style={{
          border:`1px solid ${C.border2}`,background:"none",
          padding:"12px 14px",fontSize:11,fontWeight:600,letterSpacing:"1px",
          textTransform:"uppercase",cursor:"pointer",color:C.grey,fontFamily:"inherit",
          transition:"all 0.2s",
        }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.color=C.gold;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border2;e.currentTarget.style.color=C.grey;}}>
          View
        </button>
      </div>
    </div>
  );
}

function StatBox({label,val,icon}) {
  const C = useContext(ThemeContext);
  return (
    <div style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${C.border}`,padding:"8px 10px"}}>
      <div style={{fontSize:10,color:C.grey,letterSpacing:"1px",textTransform:"uppercase",marginBottom:3}}>{label}</div>
      <div style={{fontSize:12,fontWeight:700,color:C.white}}>{icon} {val}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// AI CHAT WIDGET
// ═══════════════════════════════════════════════════════════════════════
function AIChatWidget({ onLeadCaptured }) {
  const C = useContext(ThemeContext);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("greeting");
  const [messages, setMessages] = useState([]);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [typing, setTyping] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open && messages.length===0) {
      setTimeout(()=>addAIMessage("greeting"), 400);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior:"smooth"});
  }, [messages, typing]);

  const addAIMessage = useCallback((flowKey) => {
    setTyping(true);
    setTimeout(()=>{
      setTyping(false);
      const flow = AI_FLOWS[flowKey];
      if (!flow) return;
      setMessages(m=>[...m,{role:"ai",text:flow.msg,options:flow.options,isCapture:flow.isCapture,flowKey}]);
      setStep(flowKey);
    }, 900 + Math.random()*400);
  }, []);

  const handleOption = (option, flowKey) => {
    setMessages(m=>[...m,{role:"user",text:option}]);
    setUserAnswers(a=>({...a,[flowKey]:option}));

    const nextMap = {
      greeting:()=>{
        if(option.includes("vendor")) addAIMessage("vendor_info");
        else addAIMessage("start");
      },
      start:()=>addAIMessage("location"),
      location:()=>addAIMessage("budget"),
      budget:()=>addAIMessage("guests"),
      guests:()=>addAIMessage("priorities"),
      priorities:()=>addAIMessage("capture"),
      done:()=>{setMessages([]);setStep("greeting");setUserAnswers({});setTimeout(()=>addAIMessage("greeting"),300);},
    };
    (nextMap[flowKey]||(() => {}))();
  };

  const handleEmailSubmit = () => {
    if (!email.includes("@")) return;
    setMessages(m=>[...m,{role:"user",text:email}]);
    setEmailSent(true);
    onLeadCaptured && onLeadCaptured(email, userAnswers);
    setTyping(true);
    setTimeout(()=>{
      setTyping(false);
      setMessages(m=>[...m,{role:"ai",text:AI_FLOWS.done.msg,options:AI_FLOWS.done.options,flowKey:"done"}]);
      setStep("done");
    },1000);
  };

  const currentFlow = AI_FLOWS[step];
  const unread = !open ? 1 : 0;

  return (
    <>
      {/* Chat bubble */}
      <div style={{position:"fixed",bottom:28,right:28,zIndex:9000}}>
        {!open && (
          <div style={{
            position:"absolute",bottom:"calc(100% + 12px)",right:0,
            background:C.card,border:`1px solid ${C.border2}`,
            padding:"10px 16px",whiteSpace:"nowrap",
            fontSize:13,color:C.white,
            boxShadow:"0 8px 32px rgba(0,0,0,0.6)",
            animation:"fadeUp 0.5s ease 2s both",
          }}>
            <span style={{color:C.gold}}>✦</span> Find your perfect wedding vendors
            <div style={{position:"absolute",bottom:-6,right:20,width:12,height:12,background:C.card,borderRight:`1px solid ${C.border2}`,borderBottom:`1px solid ${C.border2}`,borderTop:"none",borderLeft:"none",transform:"rotate(45deg)"}}/>
          </div>
        )}
        <button onClick={()=>setOpen(x=>!x)} style={{
          width:60,height:60,borderRadius:"50%",
          background:`linear-gradient(135deg,${C.gold},${C.gold2})`,
          border:"none",cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:24,boxShadow:`0 4px 24px rgba(201,168,76,0.4)`,
          transition:"all 0.3s",
          transform:open?"rotate(45deg) scale(0.9)":"scale(1)",
        }}>
          {open ? "✕" : "✦"}
          {unread>0 && !open && (
            <div style={{
              position:"absolute",top:0,right:0,width:18,height:18,
              background:C.rose,borderRadius:"50%",
              fontSize:10,fontWeight:700,color:"#fff",
              display:"flex",alignItems:"center",justifyContent:"center",
            }}>{unread}</div>
          )}
        </button>
      </div>

      {/* Chat panel */}
      {open && (
        <div style={{
          position:"fixed",bottom:102,right:28,zIndex:8999,
          width:360,height:520,
          background:C.dark,border:`1px solid ${C.border2}`,
          display:"flex",flexDirection:"column",
          boxShadow:"0 24px 80px rgba(0,0,0,0.8)",
          animation:"slideUp 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}>
          {/* Header */}
          <div style={{
            padding:"16px 20px",borderBottom:`1px solid ${C.border}`,
            background:`linear-gradient(135deg,rgba(201,168,76,0.08),transparent)`,
            display:"flex",alignItems:"center",gap:12,
          }}>
            <div style={{
              width:38,height:38,borderRadius:"50%",
              background:`linear-gradient(135deg,${C.gold},${C.gold2})`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:16,flexShrink:0,
            }}>✦</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:C.white}}>LWD AI Consultant</div>
              <div style={{fontSize:11,color:C.green,display:"flex",alignItems:"center",gap:4}}>
                <span style={{width:6,height:6,background:C.green,borderRadius:"50%",display:"inline-block",animation:"pulse 2s infinite"}}/>
                Online now · Replies instantly
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
            {messages.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                {m.role==="ai" && (
                  <div style={{
                    maxWidth:"85%",
                    background:"rgba(255,255,255,0.05)",
                    border:`1px solid ${C.border}`,
                    padding:"12px 14px",
                    fontSize:13,color:"#ddd",lineHeight:1.6,
                  }}>
                    {m.text.split('\n').map((line,j)=>(
                      <span key={j}>{line}{j<m.text.split('\n').length-1&&<br/>}</span>
                    ))}
                    {m.options && (
                      <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:6}}>
                        {m.options.map(opt=>(
                          <button key={opt} onClick={()=>handleOption(opt,m.flowKey)} style={{
                            background:"rgba(201,168,76,0.08)",
                            border:`1px solid rgba(201,168,76,0.25)`,
                            color:C.gold,padding:"8px 12px",
                            fontSize:12,cursor:"pointer",fontFamily:"inherit",
                            textAlign:"left",transition:"all 0.2s",
                          }}
                          onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,168,76,0.15)";}}
                          onMouseLeave={e=>{e.currentTarget.style.background="rgba(201,168,76,0.08)";}}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                    {m.isCapture && !emailSent && (
                      <div style={{marginTop:10,display:"flex",gap:6}}>
                        <input
                          value={email} onChange={e=>setEmail(e.target.value)}
                          onKeyDown={e=>e.key==="Enter"&&handleEmailSubmit()}
                          placeholder="your@email.com"
                          style={{
                            flex:1,background:"rgba(255,255,255,0.05)",
                            border:`1px solid ${C.border2}`,color:C.white,
                            padding:"8px 10px",fontSize:13,outline:"none",fontFamily:"inherit",
                          }}
                        />
                        <button onClick={handleEmailSubmit} style={{
                          background:C.gold,color:C.black,border:"none",
                          padding:"8px 12px",fontWeight:700,cursor:"pointer",
                          fontSize:12,fontFamily:"inherit",
                        }}>→</button>
                      </div>
                    )}
                  </div>
                )}
                {m.role==="user" && (
                  <div style={{
                    maxWidth:"75%",background:C.goldDim,
                    border:`1px solid rgba(201,168,76,0.2)`,
                    padding:"10px 14px",fontSize:13,color:C.white,lineHeight:1.5,
                  }}>{m.text}</div>
                )}
              </div>
            ))}

            {typing && (
              <div style={{display:"flex",gap:5,padding:"12px 14px",background:"rgba(255,255,255,0.05)",border:`1px solid ${C.border}`,width:64}}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{
                    width:7,height:7,background:C.gold,borderRadius:"50%",
                    animation:`bounce 1.2s ${i*0.15}s infinite ease-in-out`,
                  }}/>
                ))}
              </div>
            )}
            <div ref={messagesEndRef}/>
          </div>

          {/* Footer */}
          <div style={{padding:"10px 16px",borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:10,color:C.grey2,letterSpacing:"1px"}}>LUXURY WEDDING DIRECTORY</span>
            <span style={{fontSize:10,color:C.grey2}}>Powered by AI ✦</span>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ENQUIRY MODAL
// ═══════════════════════════════════════════════════════════════════════
function EnquiryModal({ vendor, onClose }) {
  const C = useContext(ThemeContext);
  const IS = {width:"100%",background:C.card,border:`1px solid ${C.border2}`,color:C.white,padding:"12px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box",transition:"border-color 0.2s"};
  const [step, setStep] = useState(1);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({name:"",email:"",date:"",guests:"",budget:"",message:""});
  if (!vendor) return null;
  const set = k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",backdropFilter:"blur(8px)",
      zIndex:9500,display:"flex",alignItems:"center",justifyContent:"center",padding:20,
    }}>
      <div style={{
        background:C.dark,border:`1px solid ${C.border2}`,
        width:"100%",maxWidth:500,maxHeight:"90vh",overflowY:"auto",
        animation:"modalIn 0.3s ease",
      }}>
        <div style={{padding:"28px 32px 0",borderBottom:`1px solid ${C.border}`,paddingBottom:20,display:"flex",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:C.gold,marginBottom:4}}>Send Enquiry</div>
            <div style={{fontFamily:"var(--font-heading-primary)",fontSize:24,color:C.white,fontWeight:600}}>{vendor.name}</div>
            <div style={{fontSize:12,color:C.grey,marginTop:2}}>📍 {vendor.city} · ⚡ Responds {vendor.response}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.grey,fontSize:22,cursor:"pointer"}}>✕</button>
        </div>

        {sent ? (
          <div style={{padding:"48px 32px",textAlign:"center"}}>
            <div style={{fontSize:52,marginBottom:16}}>✦</div>
            <div style={{fontFamily:"var(--font-heading-primary)",fontSize:28,color:C.white,marginBottom:8}}>Enquiry Sent!</div>
            <div style={{color:C.grey,fontSize:14,lineHeight:1.7}}>
              {vendor.name} will respond to <span style={{color:C.gold}}>{form.email}</span> within {vendor.response}.<br/>We've also sent a confirmation email.
            </div>
            <button onClick={onClose} style={{
              marginTop:28,background:C.gold,color:C.black,border:"none",
              padding:"12px 32px",fontSize:12,fontWeight:800,letterSpacing:"1.5px",
              textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit",
            }}>Close</button>
          </div>
        ) : (
          <div style={{padding:"24px 32px 32px"}}>
            <div style={{display:"flex",gap:4,marginBottom:24}}>
              {[1,2].map(s=><div key={s} style={{flex:1,height:2,background:step>=s?C.gold:C.border,transition:"background 0.3s"}}/>)}
            </div>
            {step===1 ? (
              <>
                <MField label="Your Name(s)"><input style={IS} value={form.name} onChange={set("name")} placeholder="Sophie & James"/></MField>
                <MField label="Email Address"><input style={IS} value={form.email} onChange={set("email")} placeholder="your@email.com"/></MField>
                <MField label="Wedding Date"><input style={{...IS,colorScheme:"dark"}} type="date" value={form.date} onChange={set("date")}/></MField>
                <MField label="Guest Count">
                  <select style={IS} value={form.guests} onChange={set("guests")}>
                    <option value="">Select...</option>
                    {["Under 30","30–80","80–150","150–300","300+"].map(o=><option key={o}>{o}</option>)}
                  </select>
                </MField>
                <Btn onClick={()=>form.name&&form.email&&setStep(2)} gold>Next Step →</Btn>
              </>
            ) : (
              <>
                <MField label="Budget Range">
                  <select style={IS} value={form.budget} onChange={set("budget")}>
                    <option value="">Select...</option>
                    {["Under £10,000","£10–25k","£25–50k","£50–100k","£100k+"].map(o=><option key={o}>{o}</option>)}
                  </select>
                </MField>
                <MField label="Tell them about your dream wedding">
                  <textarea style={{...IS,resize:"vertical",minHeight:100}} value={form.message} onChange={set("message")} placeholder="We're dreaming of an outdoor ceremony..."/>
                </MField>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>setStep(1)} style={{...IS,background:"none",border:`1px solid ${C.border2}`,color:C.grey,padding:"13px 20px",cursor:"pointer",fontFamily:"inherit",fontWeight:600,letterSpacing:"1px",fontSize:12,textTransform:"uppercase"}}>← Back</button>
                  <Btn onClick={()=>form.message&&setSent(true)} gold>✦ Send Enquiry</Btn>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MField({label,children}){
  const C = useContext(ThemeContext);
  return <div style={{marginBottom:16}}><label style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:C.grey,display:"block",marginBottom:6}}>{label}</label>{children}</div>;
}
function Btn({children,onClick,gold}){
  const C = useContext(ThemeContext);
  return <button onClick={onClick} style={{width:"100%",background:gold?C.gold:"transparent",color:gold?C.black:C.white,border:gold?"none":`1px solid ${C.border2}`,padding:14,fontSize:12,fontWeight:800,letterSpacing:"1.5px",textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit",transition:"background 0.2s"}} onMouseEnter={e=>{if(gold)e.currentTarget.style.background=C.gold2;}} onMouseLeave={e=>{if(gold)e.currentTarget.style.background=C.gold;}}>{children}</button>;
}

// ═══════════════════════════════════════════════════════════════════════
// VENDOR BACKEND DASHBOARD
// ═══════════════════════════════════════════════════════════════════════
function VendorDashboard({ onBack }) {
  const C = useContext(ThemeContext);
  const vendor = VENDORS[0];
  const [dashTab, setDashTab] = useState("overview");
  const [aiBio, setAiBio] = useState("");
  const [genBio, setGenBio] = useState(false);

  const leads = [
    {id:1,name:"Sophie & James",email:"sophie@email.com",date:"12 Jun 2025",guests:"80–150",budget:"£25–50k",msg:"We love your venue and would love to discuss availability for June 2025...",status:"new",time:"2 hrs ago"},
    {id:2,name:"Priya & Daniel",email:"priya@email.com",date:"18 Sep 2025",guests:"150–300",budget:"£50–100k",msg:"We're planning a large Asian fusion celebration and your ballroom looks perfect...",status:"replied",time:"1 day ago"},
    {id:3,name:"Elena & Marco",email:"elena@email.com",date:"3 Mar 2026",guests:"30–80",budget:"£10–25k",msg:"Looking for an intimate winter wedding venue in London...",status:"new",time:"3 hrs ago"},
    {id:4,name:"Charlotte & Will",email:"charlotte@email.com",date:"21 Aug 2025",guests:"150–300",budget:"£50–100k",msg:"We saw your venue on Vogue Weddings and have been dreaming about it ever since...",status:"booked",time:"5 days ago"},
    {id:5,name:"Aisha & Tom",email:"aisha@email.com",date:"14 Feb 2026",guests:"30–80",budget:"£25–50k",msg:"Valentine's Day wedding — is this something you'd consider?",status:"new",time:"6 hrs ago"},
  ];

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const leadsData = [12,18,15,22,28,31,29,35,38,41,47,52];
  const viewsData = [320,410,380,520,680,760,710,890,940,1020,1240,1380];

  const handleGenBio = () => {
    setGenBio(true);
    setAiBio("");
    const text = `The Grand Pavilion stands as London's most iconic wedding venue — a breathtaking Victorian ballroom where crystal chandeliers cast a golden glow across hand-carved marble floors. Exclusively yours for your wedding day, this legendary space accommodates up to 320 seated guests or 500 for a standing celebration.\n\nOur award-winning in-house culinary team craft bespoke menus for every couple, while our dedicated wedding concierge ensures every detail is flawlessly executed. With 60 luxurious guest bedrooms and an exquisite bridal suite, your entire wedding party can celebrate and stay in one magnificent location.\n\nWinner of the Hitched 2025 Award and featured in Vogue Weddings, The Grand Pavilion is where London's most extraordinary love stories begin.`;
    let i=0;
    const interval = setInterval(()=>{
      i+=2;
      setAiBio(text.slice(0,i));
      if(i>=text.length){clearInterval(interval);setGenBio(false);}
    },20);
  };

  const DTab = ({id,label,icon})=>(
    <button onClick={()=>setDashTab(id)} style={{
      display:"flex",alignItems:"center",gap:10,width:"100%",
      background:dashTab===id?"rgba(201,168,76,0.1)":"none",
      borderTop:0,borderRight:0,borderBottom:0,borderLeft:dashTab===id?`2px solid ${C.gold}`:"2px solid transparent",
      color:dashTab===id?C.gold:C.grey,padding:"12px 20px",
      fontSize:13,fontWeight:dashTab===id?700:400,cursor:"pointer",
      fontFamily:"inherit",textAlign:"left",transition:"all 0.2s",
    }}>{icon} {label}</button>
  );

  const StatCard = ({label,val,change,icon,color=C.gold})=>(
    <div style={{background:C.card,border:`1px solid ${C.border}`,padding:"20px 22px"}}>
      <div style={{fontSize:11,color:C.grey,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:8}}>{icon} {label}</div>
      <div style={{fontFamily:"var(--font-heading-primary)",fontSize:36,fontWeight:600,color,lineHeight:1}}>{val}</div>
      {change && <div style={{fontSize:12,color:C.green,marginTop:6}}>↑ {change} this month</div>}
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.black,display:"flex",flexDirection:"column"}}>
      {/* Dashboard nav */}
      <div style={{background:C.dark,borderBottom:`1px solid ${C.border}`,padding:"14px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <button onClick={onBack} style={{background:"none",border:`1px solid ${C.border2}`,color:C.grey,padding:"7px 14px",fontSize:11,cursor:"pointer",fontFamily:"inherit",letterSpacing:"1px",textTransform:"uppercase"}}>← Back to Site</button>
          <div style={{fontFamily:"var(--font-heading-primary)",fontSize:18,color:C.white,fontWeight:600}}>
            Luxury Wedding Directory <span style={{color:C.gold}}>·</span> Vendor Portal
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:8,height:8,background:C.green,borderRadius:"50%",animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:12,color:C.grey}}>Live · {vendor.name}</span>
          <div style={{width:32,height:32,background:C.goldDim,border:`1px solid rgba(201,168,76,0.3)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:C.gold}}>GP</div>
        </div>
      </div>

      <div style={{display:"flex",flex:1}}>
        {/* Sidebar */}
        <div style={{width:220,background:C.dark,borderRight:`1px solid ${C.border}`,paddingTop:24,flexShrink:0}}>
          <div style={{padding:"0 20px 20px",borderBottom:`1px solid ${C.border}`}}>
            <div style={{fontSize:11,color:C.grey,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:4}}>Your Listing</div>
            <div style={{fontSize:14,color:C.white,fontWeight:600}}>{vendor.name}</div>
            <div style={{display:"flex",gap:6,marginTop:6}}>
              <Badge text="Featured"/>
              <Badge text="Verified" color={C.green} bg="rgba(34,197,94,0.08)" border="rgba(34,197,94,0.2)"/>
            </div>
          </div>
          <div style={{paddingTop:8}}>
            <DTab id="overview" icon="◈" label="Overview"/>
            <DTab id="leads" icon="💌" label="Lead Inbox"/>
            <DTab id="analytics" icon="📊" label="Analytics"/>
            <DTab id="profile" icon="✦" label="My Profile"/>
            <DTab id="seo" icon="🔍" label="SEO Tools"/>
            <DTab id="billing" icon="💳" label="Billing"/>
          </div>
          <div style={{margin:"24px 16px 0",padding:16,background:"rgba(201,168,76,0.06)",border:`1px solid rgba(201,168,76,0.15)`}}>
            <div style={{fontSize:11,color:C.gold,fontWeight:700,marginBottom:4}}>✦ FEATURED PLAN</div>
            <div style={{fontSize:12,color:C.grey,lineHeight:1.6}}>Unlimited leads · Top placement · Analytics</div>
            <div style={{fontSize:11,color:C.grey2,marginTop:8}}>Renews 1 Mar 2026</div>
          </div>
        </div>

        {/* Main content */}
        <div style={{flex:1,padding:32,overflowY:"auto"}}>

          {/* OVERVIEW */}
          {dashTab==="overview" && (
            <div>
              <div style={{marginBottom:28}}>
                <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:C.gold,marginBottom:8}}>Dashboard Overview</div>
                <h2 style={{fontFamily:"var(--font-heading-primary)",fontSize:32,color:C.white,fontWeight:600}}>Good morning, Grand Pavilion ✦</h2>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:32}}>
                <StatCard label="Leads This Month" val={vendor.leads} change="31%" icon="💌"/>
                <StatCard label="Profile Views" val={vendor.views.toLocaleString()} change="18%" icon="👁" color={C.blue}/>
                <StatCard label="Conversion Rate" val={`${vendor.conv}%`} change="2.4%" icon="📈" color={C.green}/>
                <StatCard label="Avg Response" val={vendor.response} icon="⚡" color="#a78bfa"/>
              </div>

              {/* Recent leads */}
              <div style={{marginBottom:28}}>
                <div style={{fontSize:13,fontWeight:700,color:C.white,marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span>Recent Enquiries</span>
                  <button onClick={()=>setDashTab("leads")} style={{background:"none",border:"none",color:C.gold,fontSize:12,cursor:"pointer",fontFamily:"inherit",letterSpacing:"1px"}}>View All →</button>
                </div>
                {leads.slice(0,3).map(l=>(
                  <LeadRow key={l.id} lead={l}/>
                ))}
              </div>

              {/* Mini chart */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,padding:24}}>
                <div style={{fontSize:13,fontWeight:700,color:C.white,marginBottom:20}}>Lead Volume — Last 12 Months</div>
                <MiniChart data={leadsData} labels={months} color={C.gold}/>
              </div>
            </div>
          )}

          {/* LEADS */}
          {dashTab==="leads" && (
            <div>
              <div style={{marginBottom:28}}>
                <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:C.gold,marginBottom:8}}>Lead Management</div>
                <h2 style={{fontFamily:"var(--font-heading-primary)",fontSize:32,color:C.white,fontWeight:600}}>Enquiry Inbox</h2>
              </div>
              <div style={{display:"flex",gap:12,marginBottom:20}}>
                {[["All",leads.length],["New",leads.filter(l=>l.status==="new").length],["Replied",leads.filter(l=>l.status==="replied").length],["Booked",leads.filter(l=>l.status==="booked").length]].map(([l,c])=>(
                  <div key={l} style={{padding:"8px 16px",background:C.card,border:`1px solid ${C.border2}`,fontSize:12,color:C.white,cursor:"pointer"}}>
                    {l} <span style={{color:C.gold,fontWeight:700}}>({c})</span>
                  </div>
                ))}
              </div>
              {leads.map(l=><LeadRow key={l.id} lead={l} expanded/>)}
            </div>
          )}

          {/* ANALYTICS */}
          {dashTab==="analytics" && (
            <div>
              <div style={{marginBottom:28}}>
                <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:C.gold,marginBottom:8}}>Performance Analytics</div>
                <h2 style={{fontFamily:"var(--font-heading-primary)",fontSize:32,color:C.white,fontWeight:600}}>Your Numbers</h2>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
                <div style={{background:C.card,border:`1px solid ${C.border}`,padding:24}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.white,marginBottom:16}}>Profile Views</div>
                  <MiniChart data={viewsData} labels={months} color={C.blue}/>
                </div>
                <div style={{background:C.card,border:`1px solid ${C.border}`,padding:24}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.white,marginBottom:16}}>Lead Volume</div>
                  <MiniChart data={leadsData} labels={months} color={C.gold}/>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
                {[
                  {label:"Top Traffic Source",val:"Google Search",sub:"62% of views"},
                  {label:"Top Country",val:"United Kingdom",sub:"48% of enquiries"},
                  {label:"Avg. Budget Enquiring",val:"£25–50k",sub:"Most common range"},
                  {label:"Peak Enquiry Day",val:"Tuesday",sub:"28% more than avg"},
                  {label:"Profile Completeness",val:"94%",sub:"Add video to reach 100%"},
                  {label:"Directory Ranking",val:"#1",sub:"Venues · London"},
                ].map((s,i)=>(
                  <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,padding:"18px 20px"}}>
                    <div style={{fontSize:10,letterSpacing:"1.5px",textTransform:"uppercase",color:C.grey,marginBottom:6}}>{s.label}</div>
                    <div style={{fontSize:20,fontFamily:"var(--font-heading-primary)",color:C.white,fontWeight:600}}>{s.val}</div>
                    <div style={{fontSize:12,color:C.green,marginTop:4}}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROFILE / AI SEO */}
          {dashTab==="profile" && (
            <div>
              <div style={{marginBottom:28}}>
                <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:C.gold,marginBottom:8}}>Profile Editor</div>
                <h2 style={{fontFamily:"var(--font-heading-primary)",fontSize:32,color:C.white,fontWeight:600}}>Your Listing</h2>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
                {[["Business Name","The Grand Pavilion"],["City","London"],["Country","United Kingdom"],["Starting Price","£8,500"],["Seated Capacity","320"],["Standing Capacity","500"],["Response Time","< 2 hrs"],["Availability","Booking 2025–2026"]].map(([l,v])=>(
                  <div key={l} style={{marginBottom:4}}>
                    <div style={{fontSize:10,letterSpacing:"1.5px",textTransform:"uppercase",color:C.grey,marginBottom:6}}>{l}</div>
                    <input defaultValue={v} style={{...IS,fontSize:13}}/>
                  </div>
                ))}
              </div>
              <Btn gold onClick={()=>{}}>Save Changes</Btn>
            </div>
          )}

          {/* SEO TOOLS */}
          {dashTab==="seo" && (
            <div>
              <div style={{marginBottom:28}}>
                <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:C.gold,marginBottom:8}}>AI-Powered SEO Tools</div>
                <h2 style={{fontFamily:"var(--font-heading-primary)",fontSize:32,color:C.white,fontWeight:600}}>Rank Higher. Get More Leads.</h2>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
                {[
                  {label:"SEO Score",val:"87/100",color:C.green,sub:"↑ 12 points this month"},
                  {label:"Keywords Ranking",val:"34",color:C.gold,sub:"Top 10 Google positions"},
                  {label:"Organic Traffic",val:"1,240",color:C.blue,sub:"Monthly visitors from search"},
                  {label:"Directory Page Rank",val:"#1",color:"#a78bfa",sub:"London luxury venues"},
                ].map((s,i)=>(
                  <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,padding:"20px 22px"}}>
                    <div style={{fontSize:10,letterSpacing:"1.5px",textTransform:"uppercase",color:C.grey,marginBottom:6}}>{s.label}</div>
                    <div style={{fontFamily:"var(--font-heading-primary)",fontSize:34,color:s.color,fontWeight:600}}>{s.val}</div>
                    <div style={{fontSize:12,color:C.green,marginTop:4}}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* AI Bio Generator */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,padding:28,marginBottom:20}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                  <div>
                    <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:C.gold,marginBottom:4}}>✦ AI Profile Writer</div>
                    <div style={{fontSize:15,color:C.white,fontWeight:600}}>Generate SEO-Optimised Description</div>
                    <div style={{fontSize:12,color:C.grey,marginTop:4}}>AI writes a compelling, keyword-rich profile that ranks on Google</div>
                  </div>
                  <button onClick={handleGenBio} style={{
                    background:`linear-gradient(135deg,${C.gold},${C.gold2})`,
                    color:C.black,border:"none",padding:"10px 20px",
                    fontSize:11,fontWeight:800,letterSpacing:"1.5px",
                    textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit",
                    whiteSpace:"nowrap",
                  }}>
                    {genBio?"Generating...":"✦ Generate with AI"}
                  </button>
                </div>
                {(aiBio||genBio) && (
                  <div style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${C.border2}`,padding:"16px 18px",fontSize:13,color:"#ccc",lineHeight:1.8,minHeight:120}}>
                    {aiBio || <span style={{color:C.gold}}>Writing your profile...</span>}
                    {genBio && <span style={{animation:"pulse 1s infinite",color:C.gold}}>|</span>}
                  </div>
                )}
              </div>

              {/* Keyword suggestions */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,padding:24}}>
                <div style={{fontSize:13,fontWeight:700,color:C.white,marginBottom:16}}>Recommended Keywords for Your Listing</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {["luxury wedding venues London","Victorian ballroom wedding","exclusive wedding hire London","wedding venue crystal chandelier","London wedding 300 guests","black tie wedding London","wedding venue with accommodation London"].map(k=>(
                    <Pill key={k} text={k} color={C.gold} bg="rgba(201,168,76,0.08)" border="rgba(201,168,76,0.2)"/>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* BILLING */}
          {dashTab==="billing" && (
            <div>
              <div style={{marginBottom:28}}>
                <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:C.gold,marginBottom:8}}>Billing & Plans</div>
                <h2 style={{fontFamily:"var(--font-heading-primary)",fontSize:32,color:C.white,fontWeight:600}}>Your Subscription</h2>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:28}}>
                {[
                  {name:"Essential",price:"£49",per:"/mo",features:["Basic listing","5 leads/month","Standard placement","Email support"],current:false},
                  {name:"Featured",price:"£149",per:"/mo",features:["Premium listing","Unlimited leads","Top placement","AI profile writer","Analytics dashboard","Priority support"],current:true},
                  {name:"Elite",price:"£299",per:"/mo",features:["Everything in Featured","#1 category placement","Video showcase","Dedicated account manager","Monthly strategy call","Custom lead forms"],current:false},
                ].map((p,i)=>(
                  <div key={i} style={{
                    background:p.current?"rgba(201,168,76,0.06)":C.card,
                    border:`1px solid ${p.current?C.gold:C.border}`,
                    padding:24,position:"relative",
                  }}>
                    {p.current && <div style={{position:"absolute",top:-1,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.gold},${C.gold2})`}}/>}
                    {p.current && <div style={{position:"absolute",top:14,right:14}}><Badge text="Current Plan"/></div>}
                    <div style={{fontSize:11,letterSpacing:"2px",textTransform:"uppercase",color:C.grey,marginBottom:8}}>{p.name}</div>
                    <div style={{fontFamily:"var(--font-heading-primary)",fontSize:40,color:p.current?C.gold:C.white,fontWeight:600}}>
                      {p.price}<span style={{fontSize:16,color:C.grey,fontFamily:"inherit"}}>{p.per}</span>
                    </div>
                    <div style={{borderTop:`1px solid ${C.border}`,marginTop:16,paddingTop:16}}>
                      {p.features.map(f=>(
                        <div key={f} style={{fontSize:12,color:"#bbb",display:"flex",gap:6,marginBottom:6}}>
                          <span style={{color:C.green}}>✓</span>{f}
                        </div>
                      ))}
                    </div>
                    {!p.current && <Btn onClick={()=>{}} gold={i===2}>{i===2?"Upgrade to Elite":"Downgrade"}</Btn>}
                  </div>
                ))}
              </div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,padding:24,fontSize:13,color:C.grey,lineHeight:1.7}}>
                Current plan: <span style={{color:C.gold,fontWeight:700}}>Featured — £149/month</span> · Next billing date: <span style={{color:C.white}}>1 March 2026</span> · All prices exclude VAT
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LeadRow({lead,expanded}){
  const C = useContext(ThemeContext);
  const [open,setOpen]=useState(false);
  const statusColors={new:C.gold,replied:C.blue,booked:C.green};
  return (
    <div style={{background:C.card,border:`1px solid ${lead.status==="new"?C.border2:C.border}`,marginBottom:8,transition:"all 0.2s"}}
      onMouseEnter={e=>e.currentTarget.style.borderColor=C.border2}
      onMouseLeave={e=>e.currentTarget.style.borderColor=lead.status==="new"?C.border2:C.border}>
      <div style={{padding:"14px 18px",display:"flex",gap:16,alignItems:"center",cursor:"pointer"}} onClick={()=>setOpen(x=>!x)}>
        <div style={{width:36,height:36,background:C.goldDim,border:`1px solid rgba(201,168,76,0.2)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:C.gold,flexShrink:0,fontWeight:700}}>
          {lead.name[0]}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:2}}>
            <span style={{fontSize:13,fontWeight:700,color:C.white}}>{lead.name}</span>
            <span style={{fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:statusColors[lead.status],background:`rgba(${lead.status==="new"?"201,168,76":lead.status==="replied"?"96,165,250":"34,197,94"},0.1)`,padding:"2px 8px",borderRadius:20}}>{lead.status}</span>
          </div>
          <div style={{fontSize:12,color:C.grey,display:"flex",gap:12,flexWrap:"wrap"}}>
            <span>📅 {lead.date}</span><span>👥 {lead.guests}</span><span>💰 {lead.budget}</span><span>⏱ {lead.time}</span>
          </div>
        </div>
        <div style={{fontSize:13,color:C.grey,flexShrink:0}}>{open?"▲":"▼"}</div>
      </div>
      {(open||expanded) && open && (
        <div style={{padding:"0 18px 16px",borderTop:`1px solid ${C.border}`}}>
          <div style={{fontSize:13,color:"#bbb",lineHeight:1.7,margin:"12px 0"}}>{lead.msg}</div>
          <div style={{display:"flex",gap:8}}>
            <button style={{background:C.gold,color:C.black,border:"none",padding:"9px 18px",fontSize:11,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit"}}>Reply Now</button>
            <button style={{background:"none",border:`1px solid ${C.border2}`,color:C.grey,padding:"9px 14px",fontSize:11,cursor:"pointer",fontFamily:"inherit",letterSpacing:"1px",textTransform:"uppercase"}}>View Profile</button>
            <button style={{background:"none",border:`1px solid ${C.border2}`,color:C.grey,padding:"9px 14px",fontSize:11,cursor:"pointer",fontFamily:"inherit",letterSpacing:"1px",textTransform:"uppercase"}}>Mark Booked ✓</button>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniChart({data,labels,color}){
  const C = useContext(ThemeContext);
  const max=Math.max(...data);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:4,height:80}}>
      {data.map((v,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <div style={{
            width:"100%",background:color,opacity:0.7+(v/max)*0.3,
            height:`${(v/max)*70}px`,transition:"height 0.5s ease",
            minHeight:3,borderRadius:"1px 1px 0 0",
          }}/>
          <span style={{fontSize:8,color:C.grey,letterSpacing:"0.5px"}}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// AURA CHAT — HOMEPAGE (3-state: bar → modal → full)
// ═══════════════════════════════════════════════════════════════════════
function AuraChatHP() {
  const C = useContext(ThemeContext);
  const GD = "var(--font-heading-primary)";
  const [mode, setMode] = useState("closed");
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("lwd_aura_dismissed") === "true");
  const [msgs, setMsgs] = useState([
    { from:"aura", text:"Hi! I'm Aura, your LWD planning guide. Ask me anything — venues, destinations, budgets, photographers or how to get started." }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs,typing]);

  // Listen for lwd:openAura event dispatched from hero search
  useEffect(()=>{
    const handler = () => setMode(m => m === "closed" ? "modal" : m);
    window.addEventListener("lwd:openAura", handler);
    return () => window.removeEventListener("lwd:openAura", handler);
  }, []);

  const dismiss = (e) => {
    e.stopPropagation();
    localStorage.setItem("lwd_aura_dismissed", "true");
    setDismissed(true);
  };
  const restore = () => {
    localStorage.removeItem("lwd_aura_dismissed");
    setDismissed(false);
  };

  if (dismissed) return (
    <button onClick={restore} title="Restore Aura chat" style={{
      position:"fixed",right:24,bottom:24,zIndex:80,
      width:46,height:46,borderRadius:"50%",
      background:"rgba(15,12,8,0.88)",backdropFilter:"blur(16px)",
      border:"1px solid rgba(201,168,76,0.25)",
      color:"#C9A84C",fontSize:18,cursor:"pointer",
      display:"flex",alignItems:"center",justifyContent:"center",
      boxShadow:"0 4px 20px rgba(0,0,0,0.4)",
      transition:"all 0.2s",
    }}
    onMouseEnter={e=>{e.currentTarget.style.borderColor="#C9A84C";e.currentTarget.style.transform="scale(1.1)";}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.25)";e.currentTarget.style.transform="scale(1)";}}>
      ✦
    </button>
  );

  const GOLD = "#C9A84C"; const GREEN = "#748172";
  const CHIPS = ["Venues in Tuscany","Budget planning","Best photographers","Exclusive use venues"];
  const TOPICS = [{icon:"🏛️",label:"Venues & Estates"},{icon:"📍",label:"Top Destinations"},{icon:"📸",label:"Photography"},{icon:"💰",label:"Budget Guide"},{icon:"🌸",label:"Florists & Styling"},{icon:"📋",label:"Planning Timeline"}];

  const send = (text) => {
    const msg = (text || input).trim(); if(!msg) return;
    setMsgs(m=>[...m,{from:"user",text:msg}]); setInput(""); setTyping(true);
    setTimeout(()=>{ setTyping(false); setMsgs(m=>[...m,{from:"aura",text:`Great question! I'd be happy to help you explore that. You can also browse our curated directory or use the search to find exactly what you're looking for.`}]); },1100);
  };

  const bubbles = () => (
    <div style={{flex:1,overflowY:"auto",padding:"20px",display:"flex",flexDirection:"column",gap:12}}>
      {msgs.map((m,i)=>(
        <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.from==="user"?"flex-end":"flex-start"}}>
          {m.from==="aura" && <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
            <div style={{width:20,height:20,borderRadius:"50%",background:`linear-gradient(135deg,${GOLD},${GREEN})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff"}}>✦</div>
            <span style={{fontFamily:"var(--font-body)",fontSize:11,color:"rgba(255,255,255,0.35)",fontWeight:600,letterSpacing:"0.03em"}}>Aura</span>
          </div>}
          <div style={{maxWidth:"82%",background:m.from==="user"?`linear-gradient(135deg,${GOLD},${GREEN})`:"rgba(255,255,255,0.06)",color:m.from==="user"?"#0a0906":"rgba(255,255,255,0.85)",padding:"11px 16px",fontFamily:"var(--font-body)",fontSize:13,lineHeight:1.65,borderRadius:m.from==="user"?"16px 16px 4px 16px":"4px 16px 16px 16px",boxShadow:m.from==="user"?`0 2px 12px rgba(201,168,76,0.3)`:"none"}}>{m.text}</div>
        </div>
      ))}
      {typing && <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
        <div style={{width:20,height:20,borderRadius:"50%",background:`linear-gradient(135deg,${GOLD},${GREEN})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",flexShrink:0,marginTop:2}}>✦</div>
        <div style={{background:"rgba(255,255,255,0.06)",padding:"12px 16px",borderRadius:"4px 16px 16px 16px",display:"flex",gap:5,alignItems:"center"}}>
          {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:"rgba(255,255,255,0.35)",animation:`dotPulse 1.4s ease ${i*0.18}s infinite`}}/>)}
        </div>
      </div>}
      <div ref={endRef}/>
    </div>
  );

  const inputBar = (large) => (
    <div style={{padding:large?"16px 24px":"12px 16px",borderTop:"1px solid rgba(255,255,255,0.08)",display:"flex",gap:8}}>
      <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask about venues, destinations, budgets…" autoFocus
        style={{flex:1,padding:large?"13px 18px":"10px 14px",border:"1px solid rgba(255,255,255,0.1)",borderRadius:large?12:10,background:"rgba(255,255,255,0.05)",color:"#f5f0e8",fontFamily:"var(--font-body)",fontSize:large?14:13,outline:"none",transition:"border-color 0.2s"}}
        onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.1)"}/>
      <button onClick={()=>send()} style={{width:large?46:40,height:large?46:40,background:`linear-gradient(135deg,${GOLD},${GREEN})`,border:"none",borderRadius:large?12:10,color:"#0a0906",fontSize:large?18:16,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 2px 10px rgba(201,168,76,0.3)`}}>→</button>
    </div>
  );

  return (
    <>
      {/* ── Centered bar ── */}
      {mode==="closed" && (
        <div className="lwd-hp-aura-bar" style={{
          position:"fixed",left:0,right:0,zIndex:80,
          display:"flex",alignItems:"center",justifyContent:"center",gap:6,
          animation:"fadeUp 0.5s ease both",
        }}>
          <button onClick={()=>setMode("modal")} style={{
            display:"flex",alignItems:"center",gap:12,height:54,paddingLeft:7,paddingRight:18,
            background:"rgba(15,12,8,0.92)",backdropFilter:"blur(20px)",
            border:"1px solid rgba(201,168,76,0.28)",borderRadius:27,
            boxShadow:"0 4px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.12)",
            cursor:"pointer",width:420,maxWidth:"calc(100vw - 104px)",
            transition:"box-shadow 0.25s,transform 0.25s",
            animation:"barGlow 3s ease-in-out infinite",
          }}
          onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 8px 48px rgba(0,0,0,0.6), 0 0 0 1.5px ${GOLD}`;e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.animation="none";}}
          onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 4px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.12)";e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.animation="barGlow 3s ease-in-out infinite";}}>
            <div style={{width:40,height:40,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${GOLD},${GREEN})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,color:"#0a0906",boxShadow:`0 2px 10px rgba(201,168,76,0.35)`}}>✦</div>
            <div style={{flex:1,textAlign:"left"}}>
              <div style={{fontFamily:GD,fontSize:13,color:"#f5f0e8",letterSpacing:"0.02em",lineHeight:1.2}}>Ask Aura — your LWD planning guide</div>
              <div style={{fontFamily:"var(--font-body)",fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:2}}>AI-powered · Responds instantly</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#4caf7d",boxShadow:"0 0 0 3px rgba(76,175,125,0.2)"}}/>
              <div style={{width:30,height:30,borderRadius:"50%",background:"rgba(201,168,76,0.1)",border:"1px solid rgba(201,168,76,0.25)",display:"flex",alignItems:"center",justifyContent:"center",color:GOLD,fontSize:14}}>→</div>
            </div>
          </button>
          {/* Dismiss button */}
          <button onClick={dismiss} title="Hide Aura" style={{
            width:36,height:36,borderRadius:"50%",flexShrink:0,
            background:"rgba(15,12,8,0.85)",backdropFilter:"blur(16px)",
            border:"1px solid rgba(255,255,255,0.1)",
            color:"rgba(255,255,255,0.3)",fontSize:13,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",
            transition:"all 0.2s",
          }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.3)";e.currentTarget.style.color="rgba(255,255,255,0.7)";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.1)";e.currentTarget.style.color="rgba(255,255,255,0.3)";}}>
            ✕
          </button>
        </div>
      )}

      {/* ── Backdrop ── */}
      {(mode==="modal"||mode==="full") && (
        <div onClick={()=>setMode("closed")} style={{position:"fixed",inset:0,zIndex:140,background:"rgba(4,3,2,0.72)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",animation:"fadeUp 0.25s ease both"}}/>
      )}

      {/* ── Modal (centered) ── */}
      {mode==="modal" && (
        <div onClick={e=>e.stopPropagation()} style={{position:"fixed",zIndex:150,top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:560,maxWidth:"calc(100vw - 24px)",maxHeight:"82vh",background:"#0f0d0a",border:"1px solid rgba(201,168,76,0.2)",borderRadius:20,boxShadow:"0 40px 100px rgba(0,0,0,0.7)",display:"flex",flexDirection:"column",overflow:"hidden",animation:"chatModalIn 0.32s cubic-bezier(0.34,1.56,0.64,1) both"}}>
          <div style={{height:3,background:`linear-gradient(90deg,${GOLD},${GREEN},${GOLD})`,backgroundSize:"200% 100%",animation:"shimmer 3s linear infinite"}}/>
          {/* Header */}
          <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${GOLD},${GREEN})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#0a0906",boxShadow:`0 2px 10px rgba(201,168,76,0.3)`}}>✦</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:GD,fontSize:16,color:"#f5f0e8",letterSpacing:"0.02em"}}>Aura</div>
              <div style={{fontFamily:"var(--font-body)",fontSize:11,color:"#4caf7d",display:"flex",alignItems:"center",gap:5,marginTop:1}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:"#4caf7d",display:"inline-block"}}/>LWD AI · Wedding Planning Guide
              </div>
            </div>
            <button onClick={()=>setMode("full")} title="Full experience" style={{height:34,padding:"0 12px",borderRadius:8,background:"rgba(201,168,76,0.08)",border:"1px solid rgba(201,168,76,0.2)",color:GOLD,cursor:"pointer",fontFamily:"var(--font-body)",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:5,marginRight:6,whiteSpace:"nowrap",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.background=GOLD;e.currentTarget.style.color="#0a0906";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(201,168,76,0.08)";e.currentTarget.style.color=GOLD;}}>
              <span style={{fontSize:14}}>⤢</span> Full chat
            </button>
            <button onClick={()=>setMode("closed")} style={{width:34,height:34,borderRadius:8,background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.06)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>✕</button>
          </div>
          {/* Chips */}
          <div style={{padding:"12px 20px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",flexWrap:"wrap",gap:7}}>
            {CHIPS.map(c=>(
              <button key={c} onClick={()=>send(c)} style={{padding:"5px 13px",borderRadius:20,border:"1px solid rgba(201,168,76,0.22)",background:"rgba(201,168,76,0.07)",color:GOLD,fontFamily:"var(--font-body)",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap"}}
              onMouseEnter={e=>{e.currentTarget.style.background=GOLD;e.currentTarget.style.color="#0a0906";e.currentTarget.style.borderColor=GOLD;}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(201,168,76,0.07)";e.currentTarget.style.color=GOLD;e.currentTarget.style.borderColor="rgba(201,168,76,0.22)";}}>
                {c}
              </button>
            ))}
          </div>
          {bubbles()}
          {inputBar(false)}
        </div>
      )}

      {/* ── Full screen ── */}
      {mode==="full" && (
        <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",animation:"fadeUp 0.2s ease both"}}>
          {/* Left sidebar */}
          <div style={{width:260,flexShrink:0,background:"#060504",borderRight:"1px solid rgba(255,255,255,0.07)",display:"flex",flexDirection:"column"}}>
            <div style={{padding:"22px 20px 18px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
              <div style={{fontFamily:GD,fontSize:10,color:GOLD,letterSpacing:"0.22em",textTransform:"uppercase",lineHeight:1.6}}>Luxury Wedding<br/>Directory</div>
              <div style={{marginTop:14,display:"flex",alignItems:"center",gap:9}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${GOLD},${GREEN})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#0a0906"}}>✦</div>
                <div><div style={{fontFamily:GD,fontSize:14,color:"#f5f0e8"}}>Aura</div><div style={{fontFamily:"var(--font-body)",fontSize:10,color:"#4caf7d",display:"flex",alignItems:"center",gap:4}}><span style={{width:5,height:5,borderRadius:"50%",background:"#4caf7d",display:"inline-block"}}/>Online</div></div>
              </div>
            </div>
            <button onClick={()=>setMode("closed")} style={{margin:"14px 14px 6px",padding:"9px 14px",background:"rgba(201,168,76,0.07)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:10,color:GOLD,fontFamily:"var(--font-body)",fontSize:12,fontWeight:600,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:7,transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(201,168,76,0.14)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(201,168,76,0.07)"}>← Back to Directory</button>
            <div style={{padding:"18px 14px 8px"}}>
              <div style={{fontFamily:"var(--font-body)",fontSize:9,color:"rgba(255,255,255,0.25)",textTransform:"uppercase",letterSpacing:"0.18em",marginBottom:10}}>Ask about</div>
              {TOPICS.map(t=>(
                <button key={t.label} onClick={()=>send(t.label)} style={{width:"100%",padding:"9px 12px",marginBottom:2,background:"transparent",border:"none",color:"rgba(255,255,255,0.55)",fontFamily:"var(--font-body)",fontSize:13,cursor:"pointer",textAlign:"left",borderRadius:8,display:"flex",alignItems:"center",gap:10,transition:"background 0.15s,color 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,168,76,0.08)";e.currentTarget.style.color=GOLD;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,0.55)";}}>
                  <span style={{fontSize:15}}>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
            <div style={{flex:1}}/>
          </div>
          {/* Right: chat */}
          <div style={{flex:1,display:"flex",flexDirection:"column",background:"#0a0906",overflow:"hidden"}}>
            <div style={{height:3,background:`linear-gradient(90deg,${GOLD},${GREEN},${GOLD})`,backgroundSize:"200% 100%",animation:"shimmer 3s linear infinite",flexShrink:0}}/>
            <div style={{padding:"18px 28px",borderBottom:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
              <div>
                <div style={{fontFamily:GD,fontSize:20,color:"#f5f0e8"}}>Chat with Aura</div>
                <div style={{fontFamily:"var(--font-body)",fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:2}}>Your LWD AI wedding planning guide</div>
              </div>
              <button onClick={()=>setMode("closed")} style={{width:38,height:38,borderRadius:9,background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.06)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>✕</button>
            </div>
            {bubbles()}
            {inputBar(true)}
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════
export default function App({ onViewVenue = () => {} }) {
  const [darkMode, setDarkMode] = useState(() => getDefaultMode() === "dark");
  const C = darkMode ? getDarkPalette() : getLightPalette();
  const [view, setView] = useState("public"); // "public" | "dashboard"
  const [activeCat, setActiveCat] = useState("all");
  const [activeCountry, setActiveCountry] = useState("Worldwide");
  const [sortBy, setSortBy] = useState("featured");
  const [savedIds, setSavedIds] = useState([]);
  const [enquiryVendor, setEnquiryVendor] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [scrolled, setScrolled] = useState(false);
  const [leads, setLeads] = useState([]);
  const [slideIdx, setSlideIdx] = useState(0);
  const [searchMode, setSearchMode] = useState("standard");
  const dirRef = useRef(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 70);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Auto-advance hero slider
  useEffect(() => {
    const t = setInterval(() => setSlideIdx(p => (p + 1) % FEATURED_VENUES.length), 6000);
    return () => clearInterval(t);
  }, []);

  const filtered = VENDORS.filter(v => {
    const cat = activeCat === "all" || v.cat === activeCat;
    const country = activeCountry === "Worldwide" || v.country === activeCountry;
    return cat && country;
  }).sort((a,b) => {
    if (sortBy==="featured") return (b.featured?1:0)-(a.featured?1:0);
    if (sortBy==="rating") return b.rating-a.rating;
    if (sortBy==="reviews") return b.reviews-a.reviews;
    if (sortBy==="price_low") return a.priceNum-b.priceNum;
    if (sortBy==="price_high") return b.priceNum-a.priceNum;
    return 0;
  });

  const displayed = activeTab==="featured" ? filtered.filter(v=>v.featured) :
                    activeTab==="saved" ? VENDORS.filter(v=>savedIds.includes(v.id)) : filtered;

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Gilda+Display&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,600&family=Outfit:wght@300;400;500;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:var(--font-body);background:${C.black};color:${C.white};}
    ::-webkit-scrollbar{width:4px;}
    ::-webkit-scrollbar-track{background:${C.dark};}
    ::-webkit-scrollbar-thumb{background:${C.gold};}
    @keyframes shimmer{0%{background-position:-200% 0;}100%{background-position:200% 0;}}
    @keyframes bounce{0%,80%,100%{transform:scale(0);}40%{transform:scale(1.0);}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);}}
    @keyframes slideUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
    @keyframes modalIn{from{opacity:0;transform:scale(0.96) translateY(16px);}to{opacity:1;transform:scale(1) translateY(0);}}
    @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
    @keyframes rotateSlow{from{transform:translate(-50%,-50%) rotate(0deg);}to{transform:translate(-50%,-50%) rotate(360deg);}}
    @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
    @keyframes marquee{from{transform:translateX(0);}to{transform:translateX(-50%);}}
    @keyframes chatModalIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.93);}to{opacity:1;transform:translate(-50%,-50%) scale(1);}}
    @keyframes dotPulse{0%,80%,100%{transform:scale(0);opacity:0.4;}40%{transform:scale(1);opacity:1;}}
    @keyframes barGlow{0%,100%{box-shadow:0 4px 32px rgba(0,0,0,0.3),0 0 0 1px rgba(201,168,76,0.2);}50%{box-shadow:0 4px 40px rgba(201,168,76,0.15),0 0 0 1.5px rgba(201,168,76,0.4);}}
    input[type=date]::-webkit-calendar-picker-indicator{filter:invert(1);}
    select option{background:${C.dark};color:${C.white};}
    .lwd-hp-aura-bar{bottom:28px !important;}
    @media(max-width:900px){.lwd-hp-aura-bar{bottom:20px !important;}}
  `;

  if (view === "dashboard") {
    return (
      <ThemeContext.Provider value={C}>
        <style>{CSS}</style>
        <VendorDashboard onBack={()=>setView("public")}/>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={C}>
    <div style={{background:C.black,minHeight:"100vh"}}>
      <style>{CSS}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position:"fixed",top:0,left:0,right:0,zIndex:700,
        padding:scrolled?"12px 40px":"20px 40px",
        background:scrolled?"rgba(8,8,8,0.97)":"transparent",
        backdropFilter:scrolled?"blur(20px)":"none",
        borderBottom:scrolled?`1px solid ${C.border}`:"none",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        transition:"all 0.4s ease",
      }}>
        <div style={{fontFamily:"var(--font-heading-primary)",fontSize:20,fontWeight:600,color:C.white,letterSpacing:0.5,cursor:"pointer"}}
          onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}>
          Luxury <span style={{color:C.gold}}>Wedding</span> Directory
        </div>
        <div style={{display:"flex",gap:28,alignItems:"center"}}>
          {["Browse","Real Weddings","Planning","Blog"].map(t=>(
            <button key={t} style={{
              background:"none",border:"none",cursor:"pointer",
              fontSize:13,fontWeight:400,color:"rgba(255,255,255,0.6)",
              fontFamily:"inherit",letterSpacing:"0.3px",transition:"color 0.2s",
            }}
            onMouseEnter={e=>e.currentTarget.style.color=C.gold}
            onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.6)"}
            onClick={()=>t==="Browse"&&dirRef.current?.scrollIntoView({behavior:"smooth"})}>
              {t}
            </button>
          ))}
          <div style={{width:1,height:18,background:C.border2}}/>
          <button onClick={()=>setDarkMode(d=>!d)} title={darkMode?"Switch to Light Mode":"Switch to Dark Mode"} style={{
            background:"none",border:`1px solid ${C.border2}`,color:C.grey,
            width:36,height:36,fontSize:15,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",
            transition:"all 0.2s",flexShrink:0,
          }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.color=C.gold;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border2;e.currentTarget.style.color=C.grey;}}>
            {darkMode?"☀":"☽"}
          </button>
          <button onClick={()=>setView("dashboard")} style={{
            background:"none",border:`1px solid ${C.border2}`,color:C.grey,
            padding:"8px 16px",fontSize:11,fontWeight:600,letterSpacing:"1.5px",
            textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit",
            transition:"all 0.2s",
          }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.color=C.gold;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border2;e.currentTarget.style.color=C.grey;}}>
            Vendor Login
          </button>
          <button style={{
            background:C.gold,color:C.black,border:"none",
            padding:"9px 22px",fontSize:11,fontWeight:700,letterSpacing:"1.5px",
            textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit",
            transition:"all 0.2s",
          }}
          onMouseEnter={e=>e.currentTarget.style.background=C.gold2}
          onMouseLeave={e=>e.currentTarget.style.background=C.gold}>
            List Your Business
          </button>
        </div>
      </nav>

      {/* ── HERO — full-screen featured venue slider ── */}
      <div style={{ minHeight:"100vh", position:"relative", overflow:"hidden", background:"#0a0906" }}>
        {/* ── Sliding venue photography ── */}
        {FEATURED_VENUES.map((v, i) => (
          <div key={v.id} style={{ position:"absolute", inset:0, opacity: i === slideIdx ? 1 : 0, transition:"opacity 1.6s ease", zIndex:0 }}>
            <img src={v.img} alt={v.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => { e.currentTarget.style.opacity = "0"; }}/>
          </div>
        ))}

        {/* Cinematic overlays */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(5,4,3,0.5) 0%, rgba(5,4,3,0.1) 45%, rgba(5,4,3,0.72) 82%, rgba(5,4,3,0.95) 100%)", zIndex:1, pointerEvents:"none" }}/>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 90% 60% at 50% 50%, transparent 30%, rgba(5,4,3,0.45) 100%)", zIndex:1, pointerEvents:"none" }}/>

        {/* ── CENTER CONTENT ── */}
        <div style={{ position:"relative", zIndex:2, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", padding:"110px 24px 180px", textAlign:"center" }}>

          {/* Month highlight badge */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, background:"rgba(201,168,76,0.1)", border:"1px solid rgba(201,168,76,0.28)", padding:"8px 22px", marginBottom:28, animation:"fadeUp 0.8s ease both" }}>
            <span style={{ width:7, height:7, background:"#4caf7d", borderRadius:"50%", display:"inline-block", animation:"pulse 2s infinite" }}/>
            <span style={{ fontFamily:"var(--font-body)", fontSize:11, letterSpacing:"0.22em", textTransform:"uppercase", color:"#C9A84C", fontWeight:600 }}>
              {FEATURED_VENUES[slideIdx].highlight}
            </span>
          </div>

          {/* Headline — centered Gilda Display */}
          <h1 style={{ fontFamily:"var(--font-heading-primary)", fontSize:"clamp(48px,7vw,106px)", fontWeight:400, color:"#f5f0e8", lineHeight:1.0, letterSpacing:"-1px", marginBottom:0, animation:"fadeUp 0.8s ease 0.1s both" }}>
            The World's Finest
          </h1>
          <h1 style={{ fontFamily:"var(--font-heading-primary)", fontSize:"clamp(48px,7vw,106px)", fontWeight:400, fontStyle:"italic", color:"#C9A84C", lineHeight:1.0, letterSpacing:"-1px", marginBottom:40, animation:"fadeUp 0.8s ease 0.15s both" }}>
            Wedding Directory
          </h1>

          {/* Search mode tabs */}
          <div style={{ display:"flex", gap:0, marginBottom:10, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", padding:3, borderRadius:"var(--lwd-radius-card)", animation:"fadeUp 0.8s ease 0.25s both" }}>
            {[["✦","AI Search","ai"],["⌕","Browse","standard"]].map(([icon,label,m])=>(
              <button key={m} onClick={()=>setSearchMode(m)} style={{ padding:"9px 24px", background: searchMode===m ? "#C9A84C" : "transparent", color: searchMode===m ? "#0a0906" : "rgba(255,255,255,0.5)", border:"none", borderRadius:"var(--lwd-radius-input)", cursor:"pointer", fontFamily:"var(--font-body)", fontSize:12, fontWeight:600, letterSpacing:"0.08em", transition:"all 0.2s", display:"flex", alignItems:"center", gap:7 }}>
                <span>{icon}</span>{label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div style={{ width:"100%", maxWidth:640, background:"rgba(10,9,6,0.55)", border:"1px solid rgba(201,168,76,0.3)", backdropFilter:"blur(24px)", display:"flex", alignItems:"stretch", boxShadow:"0 24px 60px rgba(0,0,0,0.45)", animation:"fadeUp 0.8s ease 0.3s both" }}>
            {searchMode === "ai" ? (<>
              <span style={{ padding:"0 18px", display:"flex", alignItems:"center", color:"rgba(201,168,76,0.6)", fontSize:18, flexShrink:0 }}>✦</span>
              <input placeholder="Find me a Tuscan villa for 80 guests in June…" style={{ flex:1, background:"none", border:"none", outline:"none", color:"#f5f0e8", fontSize:14, fontFamily:"var(--font-body)", padding:"19px 0", minWidth:0 }} onKeyDown={e=>e.key==="Enter"&&window.dispatchEvent(new CustomEvent("lwd:openAura"))}/>
              <button onClick={()=>window.dispatchEvent(new CustomEvent("lwd:openAura"))} style={{ background:"#C9A84C", border:"none", cursor:"pointer", padding:"19px 32px", color:"#0a0906", fontSize:11, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", fontFamily:"var(--font-body)", flexShrink:0, transition:"background 0.2s" }} onMouseEnter={e=>e.currentTarget.style.background="#e8c97a"} onMouseLeave={e=>e.currentTarget.style.background="#C9A84C"}>Ask Aura</button>
            </>) : (<>
              <span style={{ padding:"0 18px", display:"flex", alignItems:"center", color:"rgba(255,255,255,0.3)", fontSize:16, flexShrink:0 }}>⌕</span>
              <input placeholder="Venues, photographers, florists…" style={{ flex:1, background:"none", border:"none", outline:"none", color:"#f5f0e8", fontSize:14, fontFamily:"var(--font-body)", padding:"19px 0", minWidth:0 }}/>
              <div style={{ width:1, background:"rgba(255,255,255,0.1)", margin:"13px 0" }}/>
              <select onChange={e=>setActiveCountry(e.target.value)} style={{ background:"none", border:"none", outline:"none", color:"rgba(255,255,255,0.45)", fontSize:13, fontFamily:"var(--font-body)", padding:"19px 14px", cursor:"pointer" }}>
                {COUNTRIES.map(c=><option key={c} style={{background:"#0a0906"}}>{c}</option>)}
              </select>
              <div style={{ width:1, background:"rgba(255,255,255,0.1)", margin:"13px 0" }}/>
              <select onChange={e=>setActiveCat(e.target.value)} style={{ background:"none", border:"none", outline:"none", color:"rgba(255,255,255,0.45)", fontSize:13, fontFamily:"var(--font-body)", padding:"19px 12px", cursor:"pointer" }}>
                {CATS.map(c=><option key={c.id} value={c.id} style={{background:"#0a0906"}}>{c.label}</option>)}
              </select>
              <button onClick={()=>dirRef.current?.scrollIntoView({behavior:"smooth"})} style={{ background:"#C9A84C", border:"none", cursor:"pointer", padding:"19px 32px", color:"#0a0906", fontSize:11, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", fontFamily:"var(--font-body)", flexShrink:0, transition:"background 0.2s" }} onMouseEnter={e=>e.currentTarget.style.background="#e8c97a"} onMouseLeave={e=>e.currentTarget.style.background="#C9A84C"}>Search</button>
            </>)}
          </div>

          {/* Trust line */}
          <div style={{ marginTop:18, fontSize:11, color:"rgba(255,255,255,0.25)", letterSpacing:"0.15em", animation:"fadeUp 0.8s ease 0.4s both" }}>
            10,247 verified venues & vendors · 62 countries · Est. 2006
          </div>
        </div>

        {/* ── BOTTOM VENUE STRIP ── */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:3, padding:"28px 60px 24px", display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:20 }}>
          {/* Current venue info */}
          <div style={{ minWidth:0 }}>
            <div style={{ fontFamily:"var(--font-body)", fontSize:9, letterSpacing:"0.25em", color:"#C9A84C", textTransform:"uppercase", fontWeight:600, marginBottom:5 }}>
              {FEATURED_VENUES[slideIdx].highlight}
            </div>
            <div style={{ fontFamily:"var(--font-heading-primary)", fontSize:22, color:"#f5f0e8", marginBottom:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
              {FEATURED_VENUES[slideIdx].name}
            </div>
            <div style={{ fontFamily:"var(--font-body)", fontSize:11, color:"rgba(255,255,255,0.4)" }}>
              📍 {FEATURED_VENUES[slideIdx].location}
            </div>
          </div>

          {/* Slide counter + dots */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, flexShrink:0 }}>
            <div style={{ fontFamily:"var(--font-body)", fontSize:10, color:"rgba(255,255,255,0.28)", letterSpacing:"0.1em" }}>
              {String(slideIdx+1).padStart(2,"0")} / {String(FEATURED_VENUES.length).padStart(2,"0")}
            </div>
            <div style={{ display:"flex", gap:5 }}>
              {FEATURED_VENUES.map((_,i)=>(
                <div key={i} onClick={()=>setSlideIdx(i)} style={{ width: i===slideIdx ? 24 : 6, height:6, borderRadius:3, background: i===slideIdx ? "#C9A84C" : "rgba(255,255,255,0.22)", cursor:"pointer", transition:"all 0.4s ease" }}/>
              ))}
            </div>
          </div>

          {/* Arrows + CTA */}
          <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <button onClick={()=>setSlideIdx(p=>(p-1+FEATURED_VENUES.length)%FEATURED_VENUES.length)} style={{ width:38, height:38, borderRadius:"50%", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.14)", color:"rgba(255,255,255,0.55)", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }} onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,168,76,0.18)";e.currentTarget.style.borderColor="#C9A84C";e.currentTarget.style.color="#C9A84C";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.07)";e.currentTarget.style.borderColor="rgba(255,255,255,0.14)";e.currentTarget.style.color="rgba(255,255,255,0.55)";}}>←</button>
            {FEATURED_VENUES[slideIdx].link === "venue"
              ? <button onClick={onViewVenue} style={{ padding:"10px 26px", background:"transparent", border:"1px solid rgba(201,168,76,0.5)", color:"#C9A84C", fontFamily:"var(--font-body)", fontSize:11, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", cursor:"pointer", transition:"all 0.2s" }} onMouseEnter={e=>{e.currentTarget.style.background="#C9A84C";e.currentTarget.style.color="#0a0906";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#C9A84C";}}>View Venue →</button>
              : <button style={{ padding:"10px 26px", background:"transparent", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.3)", fontFamily:"var(--font-body)", fontSize:11, letterSpacing:"0.12em", textTransform:"uppercase", cursor:"default" }}>Coming Soon</button>
            }
            <button onClick={()=>setSlideIdx(p=>(p+1)%FEATURED_VENUES.length)} style={{ width:38, height:38, borderRadius:"50%", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.14)", color:"rgba(255,255,255,0.55)", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }} onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,168,76,0.18)";e.currentTarget.style.borderColor="#C9A84C";e.currentTarget.style.color="#C9A84C";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.07)";e.currentTarget.style.borderColor="rgba(255,255,255,0.14)";e.currentTarget.style.color="rgba(255,255,255,0.55)";}}>→</button>
          </div>
        </div>

        {/* ── PARTNER BRANDS MARQUEE ── */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:4, borderTop:"1px solid rgba(201,168,76,0.1)", padding:"0", background:"rgba(5,4,3,0.8)", backdropFilter:"blur(8px)", overflow:"hidden", display:"none" }}/>

      </div>

      {/* ── OUR PARTNERS MARQUEE ── */}
      <div style={{ borderTop:"1px solid rgba(201,168,76,0.1)", padding:"18px 0", background:"#080706", overflow:"hidden" }}>
        <div style={{ display:"flex", gap:72, animation:"marquee 36s linear infinite", width:"max-content" }}>
          {[...Array(2)].map((_,r)=>
            ["FOUR SEASONS","AMAN RESORTS","BELMOND","ROSEWOOD HOTELS","SIX SENSES","MANDARIN ORIENTAL","THE RITZ LONDON","BULGARI HOTELS","COMO HOTELS","CAPELLA HOTELS","OETKER COLLECTION"].map(b=>(
              <span key={`${r}-${b}`} style={{ fontFamily:"var(--font-body)", fontSize:9, letterSpacing:"0.3em", color:"rgba(255,255,255,0.2)", textTransform:"uppercase", whiteSpace:"nowrap", fontWeight:600 }}>
                {b}<span style={{ marginLeft:72, color:"rgba(201,168,76,0.22)" }}>✦</span>
              </span>
            ))
          )}
        </div>
      </div>


      {/* ── DESTINATIONS ── */}
      <div style={{background:C.black,padding:"100px 60px",borderTop:`1px solid ${C.border}`}}>
        <div style={{maxWidth:1320,margin:"0 auto"}}>
          {/* Heading */}
          <div style={{marginBottom:56}}>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
              <div style={{width:28,height:1,background:`rgba(201,168,76,0.5)`}}/>
              <span style={{fontFamily:"var(--font-body)",fontSize:10,letterSpacing:"0.28em",textTransform:"uppercase",color:C.gold,fontWeight:600}}>Explore by Destination</span>
            </div>
            <h2 style={{fontFamily:"var(--font-heading-primary)",fontSize:"clamp(32px,3.5vw,56px)",color:C.off,fontWeight:400,lineHeight:1.1}}>
              From Tuscan hills to<br/>
              <span style={{fontStyle:"italic",color:C.gold}}>Caribbean coastlines</span>
            </h2>
          </div>

          {/* Mosaic grid — organic, not rigid */}
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gridTemplateRows:"280px 220px",gap:16}}>
            {/* Tuscany — large, spans 2 rows */}
            {[
              {name:"Tuscany",country:"Italy",venues:312,style:{gridRow:"1 / 3",gridColumn:"1 / 2"},img:"2a2015,9a8040"},
              {name:"Provence",country:"France",venues:148,style:{},img:"1e1a12,8a7838"},
              {name:"Santorini",country:"Greece",venues:89,style:{},img:"1a1810,807030"},
              {name:"Amalfi Coast",country:"Italy",venues:76,style:{},img:"201c12,8a7838"},
              {name:"Lake Como",country:"Italy",venues:94,style:{},img:"181510,786830"},
            ].map(d=>(
              <div key={d.name} style={{
                position:"relative",overflow:"hidden",
                background:`linear-gradient(160deg,#${d.img.split(",")[0]},#${d.img.split(",")[0]}cc)`,
                cursor:"pointer",
                ...d.style,
              }}
              onMouseEnter={e=>{e.currentTarget.querySelector(".dest-overlay").style.opacity="1";e.currentTarget.querySelector("img").style.transform="scale(1.06)";}}
              onMouseLeave={e=>{e.currentTarget.querySelector(".dest-overlay").style.opacity="0";e.currentTarget.querySelector("img").style.transform="scale(1)";}}>
                <img src={`https://placehold.co/600x500/${d.img.split(",")[0]}/${d.img.split(",")[1]}?text=${encodeURIComponent(d.name)}`}
                  alt={d.name} style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.7,transition:"transform 0.7s ease"}}/>
                {/* Gradient overlay */}
                <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(10,9,6,0.75) 0%,rgba(10,9,6,0.1) 60%)"}}/>
                {/* Hover overlay */}
                <div className="dest-overlay" style={{position:"absolute",inset:0,background:"rgba(201,168,76,0.08)",border:"1px solid rgba(201,168,76,0.3)",opacity:0,transition:"opacity 0.3s"}}/>
                {/* Content */}
                <div style={{position:"absolute",bottom:0,left:0,right:0,padding:d.style.gridRow?"28px 32px":"20px 22px"}}>
                  <div style={{fontFamily:"var(--font-heading-primary)",fontSize:d.style.gridRow?28:20,color:"#f5f0e8",marginBottom:4,fontWeight:400}}>{d.name}</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:11,color:"rgba(255,255,255,0.45)",letterSpacing:"0.08em"}}>{d.country}</span>
                    <span style={{fontSize:10,color:C.gold,letterSpacing:"0.1em"}}>{d.venues} venues →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CATEGORY STRIP ── */}
      <div style={{
        position:"sticky",top:0,zIndex:600,
        background:"rgba(8,8,8,0.97)",backdropFilter:"blur(20px)",
        borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,
        overflowX:"auto",
      }}>
        <div style={{display:"flex",maxWidth:1400,margin:"0 auto",padding:"0 40px"}}>
          {CATS.map(c=>(
            <button key={c.id} onClick={()=>{setActiveCat(c.id);dirRef.current?.scrollIntoView({behavior:"smooth"});}} style={{
              background:"none",border:"none",cursor:"pointer",
              padding:"16px 18px",fontSize:13,fontWeight:activeCat===c.id?700:300,
              color:activeCat===c.id?C.gold:"rgba(255,255,255,0.4)",
              fontFamily:"inherit",whiteSpace:"nowrap",
              borderBottom:`2px solid ${activeCat===c.id?C.gold:"transparent"}`,
              marginBottom:-1,transition:"all 0.2s",letterSpacing:"0.3px",
            }}
            onMouseEnter={e=>{if(activeCat!==c.id)e.currentTarget.style.color="rgba(255,255,255,0.7)";}}
            onMouseLeave={e=>{if(activeCat!==c.id)e.currentTarget.style.color="rgba(255,255,255,0.4)";}}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── DIRECTORY ── */}
      <div ref={dirRef} style={{maxWidth:1400,margin:"0 auto",padding:"64px 40px"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:36,flexWrap:"wrap",gap:16}}>
          <div>
            <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:C.gold,marginBottom:10,fontWeight:600}}>
              {filtered.length} Verified Vendors {activeCountry!=="Worldwide"&&`· ${activeCountry}`}
            </div>
            <h2 style={{fontFamily:"var(--font-heading-primary)",fontSize:"clamp(28px,4vw,48px)",fontWeight:600,color:C.white,lineHeight:1}}>
              Find Your <span style={{fontStyle:"italic",color:C.gold}}>Perfect Match</span>
            </h2>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontSize:12,color:C.grey2,marginRight:4}}>Sort:</span>
            {[["featured","✦ Featured"],["rating","Top Rated"],["reviews","Most Reviewed"],["price_low","Price ↑"],["price_high","Price ↓"]].map(([v,l])=>(
              <button key={v} onClick={()=>setSortBy(v)} style={{
                background:sortBy===v?C.goldDim:"none",
                color:sortBy===v?C.gold:C.grey,
                border:`1px solid ${sortBy===v?"rgba(201,168,76,0.3)":C.border}`,
                padding:"7px 14px",fontSize:11,fontWeight:600,cursor:"pointer",
                fontFamily:"inherit",transition:"all 0.2s",letterSpacing:"0.5px",
              }}>{l}</button>
            ))}
            <select value={activeCountry} onChange={e=>setActiveCountry(e.target.value)} style={{
              background:C.card,border:`1px solid ${C.border2}`,color:C.grey,
              padding:"8px 14px",fontSize:12,fontFamily:"inherit",outline:"none",cursor:"pointer",
            }}>
              {COUNTRIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,marginBottom:36}}>
          {[["all","All Vendors"],["featured","✦ Featured"],["saved",`❤️ Saved (${savedIds.length})`]].map(([id,label])=>(
            <button key={id} onClick={()=>setActiveTab(id)} style={{
              background:"none",border:"none",cursor:"pointer",
              padding:"13px 24px",fontSize:13,fontWeight:activeTab===id?700:300,
              color:activeTab===id?C.white:"rgba(255,255,255,0.35)",
              fontFamily:"inherit",
              borderBottom:`2px solid ${activeTab===id?C.gold:"transparent"}`,
              marginBottom:-1,transition:"all 0.2s",letterSpacing:"0.3px",
            }}>{label}</button>
          ))}
        </div>

        {/* Grid */}
        {displayed.length===0 ? (
          <div style={{textAlign:"center",padding:"100px 20px"}}>
            <div style={{fontSize:48,marginBottom:16,opacity:0.3}}>◈</div>
            <div style={{fontFamily:"var(--font-heading-primary)",fontSize:24,color:C.white,marginBottom:8}}>No vendors found</div>
            <div style={{fontSize:14,color:C.grey}}>Try changing your filters</div>
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(380px,1fr))",gap:28}}>
            {displayed.map(v=>(
              <VendorCard key={v.id} v={v}
                saved={savedIds.includes(v.id)}
                onSave={()=>setSavedIds(s=>s.includes(v.id)?s.filter(x=>x!==v.id):[...s,v.id])}
                onEnquire={setEnquiryVendor}
                onExpand={v => v.cat === "venues" ? onViewVenue(v) : setEnquiryVendor(v)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── EMAIL CAPTURE BAND ── */}
      <div style={{
        background:`linear-gradient(135deg,#0a0a0a 0%,#120e06 50%,#0a0a0a 100%)`,
        borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,
        padding:"80px 40px",textAlign:"center",position:"relative",overflow:"hidden",
      }}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 60% 60% at 50% 50%,rgba(201,168,76,0.05) 0%,transparent 70%)"}}/>
        <div style={{position:"relative",maxWidth:560,margin:"0 auto"}}>
          <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:C.gold,marginBottom:16,fontWeight:600}}>Join 52,000+ Couples</div>
          <h2 style={{fontFamily:"var(--font-heading-primary)",fontSize:"clamp(28px,4vw,52px)",color:C.white,fontWeight:600,lineHeight:1.1,marginBottom:12}}>
            Get Weekly Vendor Spotlights
            <span style={{display:"block",fontStyle:"italic",color:C.gold}}>&amp; Real Wedding Stories</span>
          </h2>
          <p style={{color:"rgba(255,255,255,0.35)",fontSize:15,marginBottom:36,fontWeight:300}}>
            Exclusive venue openings, photographer features and planning guides
          </p>
          <EmailCapture/>
        </div>
      </div>

      {/* ── PARTNER WITH LWD ── */}
      <div style={{background:C.card,borderTop:`1px solid ${C.border}`,padding:"100px 60px"}}>
        <div style={{maxWidth:860,margin:"0 auto",textAlign:"center"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:14,marginBottom:20}}>
            <div style={{width:28,height:1,background:"rgba(201,168,76,0.5)"}}/>
            <span style={{fontFamily:"var(--font-body)",fontSize:10,letterSpacing:"0.28em",textTransform:"uppercase",color:C.gold,fontWeight:600}}>For Wedding Professionals</span>
            <div style={{width:28,height:1,background:"rgba(201,168,76,0.5)"}}/>
          </div>
          <h2 style={{fontFamily:"var(--font-heading-primary)",fontSize:"clamp(32px,4vw,56px)",color:C.off,fontWeight:400,lineHeight:1.1,marginBottom:20}}>
            Grow your business with<br/><span style={{fontStyle:"italic",color:C.gold}}>the world's most trusted directory</span>
          </h2>
          <p style={{color:C.grey,fontSize:16,lineHeight:1.9,marginBottom:52,maxWidth:620,margin:"0 auto 52px",fontFamily:"var(--font-heading-primary)",fontStyle:"italic"}}>
            Join thousands of luxury wedding professionals reaching couples who have already decided to spend. Our 20-year domain authority puts your listing in front of the right audience, every time.
          </p>

          {/* Four pillars — horizontal, no pricing */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,marginBottom:52,background:`${C.border}`}}>
            {[
              {icon:"💌",title:"Direct Enquiries",body:"Every lead lands straight in your inbox with full couple details."},
              {icon:"🌍",title:"20-Year SEO",body:"Instant Google visibility that independent sites take years to earn."},
              {icon:"✦",title:"Aura AI Profile",body:"Our AI writes and optimises your listing copy automatically."},
              {icon:"⭐",title:"LWD Verified Badge",body:"The mark of trust that discerning couples look for first."},
            ].map(({icon,title,body})=>(
              <div key={title} style={{padding:"32px 24px",background:C.card,textAlign:"center"}}>
                <div style={{fontSize:22,marginBottom:14}}>{icon}</div>
                <div style={{fontFamily:"var(--font-heading-primary)",fontSize:15,color:C.off,marginBottom:8}}>{title}</div>
                <div style={{fontSize:12,color:C.grey,lineHeight:1.7}}>{body}</div>
              </div>
            ))}
          </div>

          <button onClick={()=>setView("dashboard")} style={{
            background:"transparent",color:C.gold,
            border:`1px solid rgba(201,168,76,0.4)`,
            padding:"16px 48px",fontSize:11,fontWeight:600,letterSpacing:"0.2em",
            textTransform:"uppercase",cursor:"pointer",fontFamily:"var(--font-body)",
            transition:"all 0.25s",borderRadius:"var(--lwd-radius-input)",
          }}
          onMouseEnter={e=>{e.currentTarget.style.background=C.gold;e.currentTarget.style.color="#0a0906";e.currentTarget.style.borderColor=C.gold;}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.gold;e.currentTarget.style.borderColor="rgba(201,168,76,0.4)";}}>
            ✦ Partner with LWD
          </button>
        </div>
      </div>

      {/* ── FOOTER — always dark ── */}
      <footer style={{background:"#0c0c0a",borderTop:"1px solid rgba(201,168,76,0.12)",padding:"70px 60px 36px"}}>
        {/* Gold gradient accent line */}
        <div style={{height:1,background:`linear-gradient(90deg,transparent,${C.gold},rgba(116,129,114,0.6),transparent)`,marginBottom:60}}/>
        <div style={{maxWidth:1400,margin:"0 auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"2.2fr 1fr 1fr 1fr",gap:48,marginBottom:52}}>
            {/* Brand column */}
            <div>
              <div style={{fontFamily:"var(--font-heading-primary)",fontSize:10,color:C.gold,letterSpacing:"0.22em",textTransform:"uppercase",lineHeight:1.7,marginBottom:18}}>
                Luxury Wedding<br/>Directory
              </div>
              <p style={{fontSize:13,color:"rgba(255,255,255,0.38)",lineHeight:1.85,maxWidth:300}}>
                The world's most trusted luxury wedding directory. Est. 2006. Connecting discerning couples with exceptional venues and professionals across 62 countries.
              </p>
              {/* Social icons */}
              <div style={{marginTop:24,display:"flex",gap:8}}>
                {[["IG","◈"],["TK","▷"],["YT","▶"],["FB","ƒ"],["PT","⊕"]].map(([s,icon])=>(
                  <div key={s} style={{width:36,height:36,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"var(--lwd-radius-input)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"rgba(255,255,255,0.35)",cursor:"pointer",transition:"all 0.2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.color=C.gold;e.currentTarget.style.background="rgba(201,168,76,0.08)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";e.currentTarget.style.color="rgba(255,255,255,0.35)";e.currentTarget.style.background="rgba(255,255,255,0.04)";}}>{icon}</div>
                ))}
              </div>
            </div>
            {/* Nav columns */}
            {[
              ["Couples",["Browse Venues","Find Photographers","Florists","Music & DJs","Wedding Planners","Real Weddings","Budget Calculator","Planning Checklist"]],
              ["Vendors",["List Your Business","Pricing Plans","Vendor Dashboard","SEO Tools","Success Stories","Vendor Blog","API Access"]],
              ["Company",["About Us","20 Years of LWD","Editorial Standards","Press & Media","Careers","Contact","Privacy Policy","Terms"]],
            ].map(([title,links])=>(
              <div key={title}>
                <div style={{fontSize:9,letterSpacing:"0.25em",textTransform:"uppercase",color:"rgba(255,255,255,0.5)",marginBottom:18,fontWeight:600}}>{title}</div>
                {links.map(l=>(
                  <div key={l} style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginBottom:9,cursor:"pointer",transition:"color 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.color=C.gold}
                  onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.3)"}>{l}</div>
                ))}
              </div>
            ))}
          </div>
          {/* Legal bar */}
          <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:24,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
            <span style={{fontSize:11,color:"rgba(255,255,255,0.2)"}}>© 2026 LuxuryWeddingDirectory.com · Est. 2006 · All rights reserved</span>
            <div style={{display:"flex",gap:20}}>
              {["Privacy","Terms","Cookies","Sitemap"].map(l=>(
                <span key={l} style={{fontSize:11,color:"rgba(255,255,255,0.2)",cursor:"pointer",transition:"color 0.2s"}} onMouseEnter={e=>e.currentTarget.style.color=C.gold} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.2)"}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── MODALS & OVERLAYS ── */}
      <EnquiryModal vendor={enquiryVendor} onClose={()=>setEnquiryVendor(null)}/>
    </div>
    </ThemeContext.Provider>
  );
}

function EmailCapture(){
  const C = useContext(ThemeContext);
  const [val,setVal]=useState("");
  const [done,setDone]=useState(false);
  if(done) return <div style={{color:C.gold,fontFamily:"var(--font-heading-primary)",fontSize:20,fontStyle:"italic"}}>✦ Welcome to the community — we'll be in touch!</div>;
  return (
    <div style={{display:"flex",maxWidth:440,margin:"0 auto"}}>
      <input value={val} onChange={e=>setVal(e.target.value)}
        onKeyDown={e=>e.key==="Enter"&&val&&setDone(true)}
        placeholder="your@email.com"
        style={{flex:1,background:"rgba(255,255,255,0.05)",border:`1px solid rgba(201,168,76,0.25)`,borderRight:"none",color:C.white,padding:"15px 18px",fontSize:14,outline:"none",fontFamily:"inherit"}}
      />
      <button onClick={()=>val&&setDone(true)} style={{
        background:C.gold,border:"none",color:C.black,
        padding:"15px 28px",fontSize:11,fontWeight:800,letterSpacing:"2px",
        textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",
        transition:"background 0.2s",
      }}
      onMouseEnter={e=>e.currentTarget.style.background=C.gold2}
      onMouseLeave={e=>e.currentTarget.style.background=C.gold}>
        Subscribe
      </button>
    </div>
  );
}
