import { useState, useEffect, useRef, createContext, useContext } from "react";

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════
const DARK_C = {
  black:"#080808", dark:"#0f0f0f", card:"#141414", border:"#1e1e1e",
  border2:"#2a2a2a", gold:"#C9A84C", gold2:"#e8c97a", goldDim:"rgba(201,168,76,0.15)",
  white:"#ffffff", off:"#f5f0e8", grey:"#888888", grey2:"#555555",
  green:"#22c55e", blue:"#60a5fa", rose:"#f43f5e",
};
const LIGHT_C = {
  black:"#faf8f5", dark:"#f0ece6", card:"#ffffff", border:"#e8e2da",
  border2:"#d4cdc4", gold:"#9b7a1a", gold2:"#b8940e", goldDim:"rgba(155,122,26,0.12)",
  white:"#1c1914", off:"#2a2520", grey:"#6b6358", grey2:"#9c9188",
  green:"#15803d", blue:"#1d4ed8", rose:"#be123c",
};
const Ctx = createContext(LIGHT_C);

// ═══════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════
const VENUES = [
  { id:1, name:"Villa Rosanova", region:"Tuscany", city:"San Casciano",
    styles:["Rustic Luxe","Classic","Garden"], capacity:180,
    priceLabel:"££££", priceFrom:"£18,000", rating:4.9, reviews:142,
    featured:true, verified:true, tag:"Estate of the Month",
    desc:"An eighteenth-century Tuscan estate with panoramic views over rolling vineyard hills. Private chapel, Renaissance gardens, and a dedicated bridal atelier.",
    includes:["Exclusive Use","Private Vineyard","12 Bedrooms","Private Chapel","In-House Chef"],
    imgs:["https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80"] },
  { id:2, name:"Palazzo Vendramin", region:"Venice", city:"Venice",
    styles:["Black Tie","Romantic","Historic"], capacity:120,
    priceLabel:"££££", priceFrom:"£28,000", rating:5.0, reviews:89,
    featured:true, verified:true, tag:"Most Romantic",
    desc:"A sixteenth-century palazzo on Venice's Grand Canal. Arrive by gondola, celebrate beneath frescoed ceilings, and toast to a view utterly unmatched in the world.",
    includes:["Grand Canal Views","Private Gondola","Frescoed Ballroom","10 Suites","Exclusive Use"],
    imgs:["https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=900&q=80"] },
  { id:3, name:"Villa d'Este Estate", region:"Lake Como", city:"Cernobbio",
    styles:["Black Tie","Elegant","Lakeside"], capacity:200,
    priceLabel:"££££", priceFrom:"£32,000", rating:5.0, reviews:67,
    featured:true, verified:true, tag:"Editor's Choice",
    desc:"A Renaissance villa overlooking the sapphire waters of Lake Como. Grand terraces, century-old botanical gardens, and the most celebrated panorama in Lombardy.",
    includes:["Lake Views","Botanical Gardens","25 Guest Rooms","Helipad","Butler Service"],
    imgs:["https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80"] },
  { id:4, name:"Masseria Torre Coccaro", region:"Puglia", city:"Fasano",
    styles:["Rustic Luxe","Garden","Bohemian"], capacity:150,
    priceLabel:"£££", priceFrom:"£14,500", rating:4.8, reviews:203,
    featured:false, verified:true, tag:"Top Rated",
    desc:"A fortified masseria set among ancient olive groves in the Valle d'Itria. The trulli-dotted landscape creates a uniquely Italian backdrop unlike anywhere else on earth.",
    includes:["Olive Grove Ceremony","Infinity Pool","Organic Catering","Trulli Accommodation","Spa"],
    imgs:["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=80"] },
  { id:5, name:"Ravello Cliffside Estate", region:"Amalfi Coast", city:"Ravello",
    styles:["Romantic","Destination","Cliffside"], capacity:80,
    priceLabel:"££££", priceFrom:"£22,000", rating:4.9, reviews:118,
    featured:true, verified:true, tag:"Destination Pick",
    desc:"Perched 350 metres above the Tyrrhenian Sea, commanding sweeping views across the Amalfi Coast. Intimate, spectacular, and forever unforgettable.",
    includes:["Sea Views","Private Terrace","Infinity Pool","Helicopter Arrival","Exclusive Use"],
    imgs:["https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=80"] },
  { id:6, name:"Castello di Vicarello", region:"Tuscany", city:"Cinigiano",
    styles:["Medieval","Rustic Luxe","Intimate"], capacity:60,
    priceLabel:"£££", priceFrom:"£16,000", rating:4.9, reviews:95,
    featured:false, verified:true, tag:null,
    desc:"A medieval castle-estate on a wild Tuscan hilltop. Eight hectares of olive groves, a private pool, and a stone courtyard perfect for intimate ceremonies.",
    includes:["Medieval Castle","Courtyard Ceremony","8 Bedrooms","Tuscan Kitchen","Wine Cellar"],
    imgs:["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80"] },
  { id:7, name:"Villa Cimbrone", region:"Amalfi Coast", city:"Ravello",
    styles:["Garden","Romantic","Historic"], capacity:100,
    priceLabel:"££££", priceFrom:"£24,000", rating:5.0, reviews:74,
    featured:false, verified:true, tag:null,
    desc:"The legendary Villa Cimbrone in Ravello. Its famous Terrace of Infinity overlooks the Mediterranean — a view Greta Garbo once called the most beautiful in the world.",
    includes:["Terrace of Infinity","Historic Gardens","Private Access","Luxury Rooms","Bespoke Florals"],
    imgs:["https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=80"] },
  { id:8, name:"Tenuta di Neri", region:"Tuscany", city:"Montalcino",
    styles:["Vineyard","Rustic","Intimate"], capacity:80,
    priceLabel:"£££", priceFrom:"£12,000", rating:4.7, reviews:156,
    featured:false, verified:true, tag:null,
    desc:"A renowned Brunello estate in the Montalcino hills. Exchange vows at golden hour among the vines, then dine beneath the Tuscan stars at a long candlelit table.",
    includes:["Vineyard Ceremony","Private Wine Tasting","Farm-to-Table","8 Guest Rooms","Private Pool"],
    imgs:["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80"] },
  { id:9, name:"Villa Balbianello", region:"Lake Como", city:"Lenno",
    styles:["Historic","Romantic","Lakeside"], capacity:50,
    priceLabel:"££££", priceFrom:"£20,000", rating:5.0, reviews:52,
    featured:false, verified:true, tag:"Exclusive",
    desc:"Made famous by Casino Royale and Star Wars, this FAI-protected villa offers one of the world's most cinematic settings perched above the waters of Lake Como.",
    includes:["FAI Exclusive Access","Film-Famous Loggia","Boat Arrival","Lake Views","Intimate Only"],
    imgs:["https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=900&q=80"] },
  { id:10, name:"Convento dell'Annunciata", region:"Lombardy", city:"Medole",
    styles:["Classic","Religious","Historic"], capacity:200,
    priceLabel:"£££", priceFrom:"£11,000", rating:4.8, reviews:178,
    featured:false, verified:true, tag:null,
    desc:"A beautifully restored 16th-century Franciscan convent in the Lombard countryside, with a cloistered garden, frescoed chapel, and timeless ecclesiastical grandeur.",
    includes:["Convent Chapel","Cloistered Garden","Full Buyout","30 Guest Rooms","Historic Wine Cellar"],
    imgs:["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80"] },
];

const REGIONS = ["All Regions","Tuscany","Venice","Lake Como","Amalfi Coast","Puglia","Lombardy"];
const STYLES  = ["All Styles","Rustic Luxe","Black Tie","Romantic","Garden","Historic","Vineyard","Intimate"];
const CAPS    = ["Any Capacity","Up to 50","51–100","101–200","200+"];
const PRICES  = ["All Budgets","£££","££££"];

// ═══════════════════════════════════════════════════════════════
// MICRO COMPONENTS
// ═══════════════════════════════════════════════════════════════
function Stars({ r }) {
  const C = useContext(Ctx);
  return (
    <div style={{display:"flex",gap:2,alignItems:"center"}}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill={i<=Math.round(r)?C.gold:C.border2}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}
function GoldBadge({ text }) {
  return (
    <span style={{fontSize:9,fontWeight:700,letterSpacing:"1.8px",textTransform:"uppercase",
      color:"#0f0d0a",background:"#C9A84C",padding:"3px 9px",borderRadius:"var(--lwd-radius-input)",whiteSpace:"nowrap"}}>
      {text}
    </span>
  );
}
function VerifiedBadge() {
  const C = useContext(Ctx);
  return (
    <span style={{fontSize:9,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",
      color:C.green,background:"rgba(34,197,94,0.1)",border:`1px solid rgba(34,197,94,0.25)`,
      padding:"3px 8px",borderRadius:"var(--lwd-radius-input)",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4}}>
      <span>✓</span> Verified
    </span>
  );
}
function Pill({ text }) {
  const C = useContext(Ctx);
  return (
    <span style={{fontSize:10,color:C.grey,background:"rgba(128,128,128,0.07)",
      border:`1px solid rgba(128,128,128,0.13)`,padding:"3px 10px",borderRadius:20,whiteSpace:"nowrap"}}>
      {text}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// NAV BAR
// ═══════════════════════════════════════════════════════════════
function CatNav({ onBack, scrolled, darkMode, onToggleDark }) {
  const C = useContext(Ctx);
  return (
    <nav style={{
      position:"fixed",top:0,left:0,right:0,zIndex:900,
      padding:scrolled?"12px 48px":"18px 48px",
      background:scrolled ? (darkMode?"rgba(8,8,8,0.97)":"rgba(250,248,245,0.97)") : "transparent",
      backdropFilter:scrolled?"blur(20px)":"none",
      borderBottom:scrolled?`1px solid ${C.border}`:"none",
      display:"flex",alignItems:"center",justifyContent:"space-between",
      transition:"all 0.35s ease",
    }}>
      {/* Left: back + breadcrumb */}
      <div style={{display:"flex",alignItems:"center",gap:20}}>
        <button onClick={onBack} style={{
          background:"none",border:`1px solid ${scrolled?C.border2:"rgba(255,255,255,0.25)"}`,
          color:scrolled?C.grey:"rgba(255,255,255,0.7)",
          padding:"7px 14px",fontSize:11,letterSpacing:"1px",textTransform:"uppercase",
          cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s",
        }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.color=C.gold;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=scrolled?C.border2:"rgba(255,255,255,0.25)";e.currentTarget.style.color=scrolled?C.grey:"rgba(255,255,255,0.7)";}}>
          ← Back
        </button>
        <div style={{display:"flex",alignItems:"center",gap:8,fontSize:11,
          color:scrolled?C.grey:"rgba(255,255,255,0.5)",letterSpacing:"0.5px"}}>
          <span style={{cursor:"pointer",transition:"color 0.2s"}}
            onMouseEnter={e=>e.currentTarget.style.color=C.gold}
            onMouseLeave={e=>e.currentTarget.style.color=scrolled?C.grey:"rgba(255,255,255,0.5)"}>
            Home
          </span>
          <span style={{opacity:0.4}}>›</span>
          <span>Venues</span>
          <span style={{opacity:0.4}}>›</span>
          <span style={{color:scrolled?C.gold:"rgba(201,168,76,0.9)",fontWeight:600}}>Italy</span>
        </div>
      </div>

      {/* Centre: logo */}
      <div style={{fontFamily:"var(--font-heading-primary)",fontSize:18,fontWeight:600,
        color:scrolled?C.white:"#ffffff",letterSpacing:0.5,cursor:"pointer"}}
        onClick={onBack}>
        Luxury <span style={{color:C.gold}}>Wedding</span> Directory
      </div>

      {/* Right: actions */}
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onToggleDark} style={{
          background:"none",border:`1px solid ${C.border2}`,
          color:C.grey,width:34,height:34,cursor:"pointer",
          fontFamily:"inherit",fontSize:13,transition:"all 0.2s",
        }}
        title="Toggle theme"
        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.color=C.gold;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border2;e.currentTarget.style.color=C.grey;}}>
          {darkMode?"☀":"◐"}
        </button>
        <button style={{
          background:`linear-gradient(135deg,${C.gold},${C.gold2})`,
          border:"none",color:"#fff",
          padding:"9px 20px",fontSize:11,fontWeight:700,letterSpacing:"1.5px",
          textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit",
        }}>
          List Your Venue
        </button>
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════
// HERO
// ═══════════════════════════════════════════════════════════════
function Hero({ count }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 100); return () => clearTimeout(t); }, []);
  return (
    <div style={{position:"relative",height:"72vh",minHeight:580,overflow:"hidden",background:"#0a0806"}}>
      {/* Background image */}
      <img
        src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80"
        alt="Venues in Italy"
        style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
          opacity:0.55,transform:"scale(1.04)",transition:"transform 8s ease"}}
      />
      {/* Gradient overlays */}
      <div style={{position:"absolute",inset:0,
        background:"linear-gradient(180deg,rgba(4,3,2,0.45) 0%,rgba(4,3,2,0.25) 40%,rgba(4,3,2,0.75) 100%)"}}/>
      <div style={{position:"absolute",inset:0,
        background:"linear-gradient(90deg,rgba(4,3,2,0.6) 0%,transparent 60%)"}}/>

      {/* Gold top shimmer */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,
        background:"linear-gradient(90deg,#C9A84C,#e8c97a,#C9A84C)",
        backgroundSize:"200% 100%",animation:"shimmer 3s linear infinite",zIndex:2}}/>

      {/* Content */}
      <div style={{
        position:"absolute",inset:0,display:"flex",flexDirection:"column",
        justifyContent:"flex-end",padding:"0 80px 80px",
        opacity:loaded?1:0,transform:loaded?"translateY(0)":"translateY(20px)",
        transition:"all 0.9s ease",
      }}>
        {/* Category label */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
          <div style={{width:32,height:1,background:"rgba(201,168,76,0.6)"}}/>
          <span style={{fontSize:10,letterSpacing:"4px",textTransform:"uppercase",
            color:"rgba(201,168,76,0.9)",fontFamily:"var(--font-body)",fontWeight:600}}>
            Venues · Italy
          </span>
        </div>

        {/* Title */}
        <h1 style={{fontFamily:"var(--font-heading-primary)",fontSize:"clamp(44px,6vw,76px)",
          fontWeight:400,color:"#fff",lineHeight:1.05,letterSpacing:"-0.5px",marginBottom:18,
          maxWidth:700}}>
          Weddings in <em style={{fontStyle:"italic",color:"rgba(201,168,76,0.95)"}}>Italy</em>
        </h1>

        {/* Tagline */}
        <p style={{fontSize:16,color:"rgba(255,255,255,0.65)",fontFamily:"var(--font-body)",
          fontWeight:300,lineHeight:1.6,maxWidth:520,marginBottom:36}}>
          Discover {count} extraordinary venues — from Tuscan vineyards and Venetian palazzos to cliffside estates on the Amalfi Coast.
        </p>

        {/* Stats row */}
        <div style={{display:"flex",gap:32,alignItems:"center"}}>
          {[
            {val:count, label:"Curated Venues"},
            {val:"9", label:"Regions Covered"},
            {val:"100%", label:"Personally Verified"},
          ].map((s,i) => (
            <div key={i} style={{borderLeft:i>0?"1px solid rgba(255,255,255,0.15)":"none",paddingLeft:i>0?32:0}}>
              <div style={{fontFamily:"var(--font-heading-primary)",fontSize:28,fontWeight:600,
                color:"#C9A84C",lineHeight:1}}>{s.val}</div>
              <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",
                color:"rgba(255,255,255,0.45)",marginTop:4,fontFamily:"var(--font-body)"}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{position:"absolute",bottom:24,right:48,display:"flex",alignItems:"center",
        gap:8,opacity:0.5}}>
        <span style={{fontSize:9,letterSpacing:"2px",textTransform:"uppercase",color:"#fff",
          fontFamily:"var(--font-body)"}}>Scroll</span>
        <div style={{width:1,height:24,background:"rgba(255,255,255,0.4)"}}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// INFO STRIP
// ═══════════════════════════════════════════════════════════════
function InfoStrip() {
  const C = useContext(Ctx);
  const cols = [
    { label:"Regions", items:["Tuscany","Lake Como","Venice","Amalfi Coast","Puglia","Sicily","Rome"] },
    { label:"Signature Vibe", items:["Rustic Luxe","Romantic Destination","Black Tie Elegance","Garden Party","Vineyard & Estate"] },
    { label:"Elite Services", items:["Exclusive Estate Hire","Private Vineyard Ceremonies","Michelin-Star Dining","Historic Villa Access","Dedicated Concierge"] },
  ];
  return (
    <div style={{background:C.dark,borderBottom:`1px solid ${C.border}`,
      borderTop:`1px solid ${C.border}`}}>
      <div style={{maxWidth:1280,margin:"0 auto",padding:"0 48px",
        display:"grid",gridTemplateColumns:"1fr 1fr 1fr"}}>
        {cols.map((col, i) => (
          <div key={i} style={{
            padding:"36px 0",
            borderRight: i < 2 ? `1px solid ${C.border}` : "none",
            paddingRight: i < 2 ? 48 : 0,
            paddingLeft: i > 0 ? 48 : 0,
          }}>
            <div style={{fontSize:9,letterSpacing:"3px",textTransform:"uppercase",
              color:C.gold,fontWeight:700,marginBottom:16,fontFamily:"var(--font-body)"}}>
              ✦ {col.label}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {col.items.map((item,j) => (
                <span key={j} style={{fontSize:12,color:C.white,background:C.card,
                  border:`1px solid ${C.border}`,padding:"5px 12px",borderRadius:"var(--lwd-radius-input)",
                  fontFamily:"var(--font-body)",cursor:"pointer",transition:"all 0.2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.color=C.gold;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.white;}}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LATEST VENUES SPLIT — 5 images LEFT · SEO text RIGHT
// ═══════════════════════════════════════════════════════════════
function LatestSplit({ venues }) {
  const C = useContext(Ctx);
  const [hovered, setHovered] = useState(null);
  const areas = ["one","two","three","four","five"];
  return (
    <div style={{maxWidth:1280,margin:"0 auto",padding:"80px 48px",
      display:"grid",gridTemplateColumns:"55% 45%",gap:64,alignItems:"center"}}>

      {/* LEFT — magazine image grid */}
      <div style={{
        display:"grid",
        gridTemplateAreas:'"one two" "one three" "four five"',
        gridTemplateColumns:"1fr 1fr",
        gridTemplateRows:"1fr 1fr 1fr",
        gap:6,
        height:560,
      }}>
        {venues.slice(0,5).map((v,i) => (
          <div key={v.id}
            style={{gridArea:areas[i],overflow:"hidden",position:"relative",background:"#0a0806",cursor:"pointer"}}
            onMouseEnter={()=>setHovered(i)}
            onMouseLeave={()=>setHovered(null)}>
            <img src={v.imgs[0]} alt={v.name} style={{
              width:"100%",height:"100%",objectFit:"cover",
              transform:hovered===i?"scale(1.07)":"scale(1)",
              transition:"transform 0.65s ease",
            }}/>
            {/* Overlay gradient */}
            <div style={{position:"absolute",inset:0,
              background:"linear-gradient(180deg,transparent 50%,rgba(4,3,2,0.75) 100%)",
              opacity:hovered===i?1:0.6,transition:"opacity 0.3s"}}/>
            {/* Label */}
            <div style={{position:"absolute",bottom:10,left:12,right:8}}>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.55)",letterSpacing:"0.5px",
                fontFamily:"var(--font-body)",marginBottom:2}}>
                {v.region}
              </div>
              <div style={{fontSize:i===0?14:12,color:"#fff",fontFamily:"var(--font-heading-primary)",
                fontWeight:500,lineHeight:1.2}}>
                {v.name}
              </div>
            </div>
            {/* New badge on first */}
            {i===0 && (
              <div style={{position:"absolute",top:10,left:10}}>
                <span style={{fontSize:8,letterSpacing:"2px",textTransform:"uppercase",
                  color:"#0f0d0a",background:"#C9A84C",padding:"3px 8px",fontWeight:700}}>
                  Latest
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* RIGHT — SEO editorial text */}
      <div style={{padding:"0 8px"}}>
        {/* Ornament */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
          <div style={{width:32,height:1,background:C.gold}}/>
          <span style={{fontSize:9,letterSpacing:"4px",textTransform:"uppercase",
            color:C.gold,fontWeight:700,fontFamily:"var(--font-body)"}}>
            Why Italy
          </span>
        </div>

        <h2 style={{fontFamily:"var(--font-heading-primary)",fontSize:"clamp(30px,3vw,42px)",
          fontWeight:400,color:C.white,lineHeight:1.15,marginBottom:24,letterSpacing:"-0.3px"}}>
          The Art of the<br/><em style={{fontStyle:"italic"}}>Italian Wedding</em>
        </h2>

        <div style={{width:48,height:1,background:C.gold,marginBottom:28,opacity:0.5}}/>

        <p style={{fontSize:14,color:C.grey,lineHeight:1.85,fontFamily:"var(--font-body)",
          fontWeight:300,marginBottom:20}}>
          Italy has long been regarded as the world's most romantic wedding destination — a country where centuries of art, architecture and culinary mastery converge to create celebrations of extraordinary distinction.
        </p>
        <p style={{fontSize:14,color:C.grey,lineHeight:1.85,fontFamily:"var(--font-body)",
          fontWeight:300,marginBottom:32}}>
          From the sun-drenched terraces of Tuscany to the sapphire shores of Lake Como, each region offers a distinct character and depth of beauty unmatched anywhere on earth. Our curated collection represents only the finest estates, villas, palazzi and masserie — each personally visited by our editorial team.
        </p>

        {/* Key facts */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:36}}>
          {[
            {icon:"🏛", text:"Historic villa estates"},
            {icon:"🍷", text:"Private vineyard settings"},
            {icon:"🌊", text:"Coastal & clifftop venues"},
            {icon:"👨‍🍳", text:"Michelin-star catering"},
          ].map((f,i) => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,
              padding:"12px 16px",background:C.dark,border:`1px solid ${C.border}`,borderRadius:"var(--lwd-radius-card)"}}>
              <span style={{fontSize:16}}>{f.icon}</span>
              <span style={{fontSize:12,color:C.white,fontFamily:"var(--font-body)"}}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* CTA link */}
        <button style={{
          background:"none",border:`1px solid ${C.gold}`,color:C.gold,
          padding:"12px 28px",fontSize:11,fontWeight:700,letterSpacing:"2px",
          textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit",
          transition:"all 0.25s",
        }}
        onMouseEnter={e=>{e.currentTarget.style.background=C.gold;e.currentTarget.style.color="#fff";}}
        onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color=C.gold;}}>
          Browse All Italian Venues →
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FILTER BAR
// ═══════════════════════════════════════════════════════════════
function FilterBar({ filters, onChange, viewMode, onViewMode, total }) {
  const C = useContext(Ctx);
  const selStyle = {
    background:C.card, border:`1px solid ${C.border2}`, color:C.white,
    padding:"9px 32px 9px 12px", fontSize:12, fontFamily:"inherit",
    cursor:"pointer", outline:"none", appearance:"none",
    WebkitAppearance:"none", minWidth:140,
    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b6358'/%3E%3C/svg%3E")`,
    backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center",
  };

  return (
    <div style={{
      background:C.dark, borderTop:`1px solid ${C.border}`,
      borderBottom:`1px solid ${C.border}`,
      position:"sticky", top:0, zIndex:800,
    }}>
      <div style={{maxWidth:1280,margin:"0 auto",padding:"0 48px",
        display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,
        height:64}}>

        {/* Left: filters */}
        <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
          <span style={{fontSize:9,letterSpacing:"2px",textTransform:"uppercase",
            color:C.grey,marginRight:6,whiteSpace:"nowrap",fontWeight:600}}>
            Filter
          </span>
          {[
            {key:"region", opts:REGIONS},
            {key:"style",  opts:STYLES},
            {key:"capacity", opts:CAPS},
            {key:"price",  opts:PRICES},
          ].map(f => (
            <select key={f.key} value={filters[f.key]}
              onChange={e => onChange({...filters, [f.key]:e.target.value})}
              style={selStyle}>
              {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}

          {/* Clear if filters active */}
          {(filters.region!==REGIONS[0]||filters.style!==STYLES[0]||filters.capacity!==CAPS[0]||filters.price!==PRICES[0]) && (
            <button onClick={()=>onChange({region:REGIONS[0],style:STYLES[0],capacity:CAPS[0],price:PRICES[0]})}
              style={{background:"none",border:"none",color:C.rose,fontSize:11,cursor:"pointer",
                fontFamily:"inherit",letterSpacing:"0.5px",padding:"0 4px"}}>
              ✕ Clear
            </button>
          )}
        </div>

        {/* Right: count + view toggles */}
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <span style={{fontSize:12,color:C.grey,whiteSpace:"nowrap"}}>
            <span style={{color:C.gold,fontWeight:700}}>{total}</span> venues
          </span>
          <div style={{display:"flex",border:`1px solid ${C.border2}`,overflow:"hidden"}}>
            {[
              {id:"list", icon:"≡", title:"List view"},
              {id:"grid", icon:"⊞", title:"Grid view"},
              {id:"map",  icon:"◎", title:"Map view"},
            ].map(v => (
              <button key={v.id} onClick={()=>onViewMode(v.id)} title={v.title}
                style={{
                  width:36,height:36,background:viewMode===v.id?C.gold:"none",
                  border:"none",borderRight:`1px solid ${C.border2}`,
                  color:viewMode===v.id?"#fff":C.grey,
                  cursor:"pointer",fontSize:16,transition:"all 0.2s",
                  fontFamily:"inherit",
                }}
                onMouseEnter={e=>{if(viewMode!==v.id)e.currentTarget.style.background=C.goldDim;}}
                onMouseLeave={e=>{if(viewMode!==v.id)e.currentTarget.style.background="none";}}>
                {v.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HORIZONTAL VENUE CARD
// ═══════════════════════════════════════════════════════════════
function HCard({ v, saved, onSave, onView }) {
  const C = useContext(Ctx);
  const [imgIdx, setImgIdx] = useState(0);
  const [hov, setHov] = useState(false);
  const timerRef = useRef(null);

  const handleEnter = () => {
    setHov(true);
    timerRef.current = setInterval(() => setImgIdx(i => (i+1) % v.imgs.length), 1400);
  };
  const handleLeave = () => {
    setHov(false);
    clearInterval(timerRef.current);
    setImgIdx(0);
  };
  useEffect(() => () => clearInterval(timerRef.current), []);

  return (
    <div
      onMouseEnter={handleEnter} onMouseLeave={handleLeave}
      style={{
        display:"flex", background:C.card,
        border:`1px solid ${hov?C.gold:C.border}`,
        borderLeft:`3px solid ${hov?C.gold:C.border}`,
        marginBottom:12, overflow:"hidden",
        transition:"all 0.3s ease",
        boxShadow:hov?`0 8px 32px rgba(0,0,0,0.1)`:"none",
      }}>

      {/* Image panel */}
      <div style={{width:280,flexShrink:0,position:"relative",overflow:"hidden",background:"#0a0806"}}>
        {v.imgs.map((src,i) => (
          <img key={i} src={src} alt={v.name} style={{
            position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
            opacity:i===imgIdx?1:0,
            transform:i===imgIdx&&hov?"scale(1.06)":"scale(1)",
            transition:"opacity 0.6s ease, transform 4s ease",
          }}/>
        ))}
        {/* Dark gradient */}
        <div style={{position:"absolute",inset:0,
          background:"linear-gradient(90deg,transparent 60%,rgba(0,0,0,0.4) 100%)"}}/>

        {/* Featured shimmer */}
        {v.featured && (
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,
            background:"linear-gradient(90deg,#C9A84C,#e8c97a,#C9A84C)",
            backgroundSize:"200%",animation:"shimmer 3s linear infinite"}}/>
        )}

        {/* Save button */}
        <button onClick={e=>{e.stopPropagation();onSave(v.id);}} style={{
          position:"absolute",top:10,right:10,
          width:32,height:32,borderRadius:"50%",
          background:saved?"rgba(201,168,76,0.9)":"rgba(0,0,0,0.45)",
          border:"none",color:saved?"#0f0d0a":"rgba(255,255,255,0.8)",
          cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",
          transition:"all 0.2s",
        }}>♡</button>

        {/* Image dots */}
        {v.imgs.length > 1 && (
          <div style={{position:"absolute",bottom:8,left:0,right:0,
            display:"flex",justifyContent:"center",gap:4}}>
            {v.imgs.map((_,i) => (
              <div key={i} style={{
                width:i===imgIdx?16:4, height:2,
                background:i===imgIdx?"#C9A84C":"rgba(255,255,255,0.4)",
                transition:"all 0.3s",
              }}/>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{flex:1,padding:"22px 28px",display:"flex",flexDirection:"column",minWidth:0}}>
        {/* Top row: badges */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          {v.tag && <GoldBadge text={v.tag}/>}
          {v.verified && <VerifiedBadge/>}
          {v.featured && (
            <span style={{fontSize:9,letterSpacing:"1.5px",textTransform:"uppercase",
              color:C.gold,fontFamily:"var(--font-body)",fontWeight:600}}>
              ✦ Featured
            </span>
          )}
        </div>

        {/* Name */}
        <h3 style={{fontFamily:"var(--font-heading-primary)",fontSize:24,fontWeight:500,
          color:C.white,lineHeight:1.1,marginBottom:6,letterSpacing:"-0.2px"}}>
          {v.name}
        </h3>

        {/* Location */}
        <div style={{fontSize:12,color:C.grey,marginBottom:10,
          display:"flex",alignItems:"center",gap:6,fontFamily:"var(--font-body)"}}>
          <span style={{color:C.gold,fontSize:10}}>◆</span>
          {v.city}, {v.region} · Italy
        </div>

        {/* Stars + reviews */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <Stars r={v.rating}/>
          <span style={{fontSize:12,color:C.gold,fontWeight:700}}>{v.rating}</span>
          <span style={{fontSize:11,color:C.grey}}>({v.reviews} reviews)</span>
        </div>

        {/* Description */}
        <p style={{fontSize:13,color:C.grey,lineHeight:1.75,fontFamily:"var(--font-body)",
          fontWeight:300,marginBottom:14,
          display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
          {v.desc}
        </p>

        {/* Style pills */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
          {v.styles.map(s => <Pill key={s} text={s}/>)}
        </div>

        {/* Inclusions */}
        <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16}}>
          {v.includes.slice(0,3).map((inc,i) => (
            <span key={i} style={{fontSize:11,color:C.grey2,display:"flex",alignItems:"center",gap:4,
              fontFamily:"var(--font-body)"}}>
              <span style={{color:C.green,fontSize:10}}>✓</span> {inc}
            </span>
          ))}
        </div>

        {/* Footer: capacity + price + CTA */}
        <div style={{marginTop:"auto",paddingTop:14,borderTop:`1px solid ${C.border}`,
          display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>

          <div style={{display:"flex",gap:20}}>
            <div>
              <div style={{fontSize:9,letterSpacing:"2px",textTransform:"uppercase",
                color:C.grey,marginBottom:2,fontFamily:"var(--font-body)"}}>Capacity</div>
              <div style={{fontSize:13,color:C.white,fontWeight:600}}>Up to {v.capacity}</div>
            </div>
            <div>
              <div style={{fontSize:9,letterSpacing:"2px",textTransform:"uppercase",
                color:C.grey,marginBottom:2,fontFamily:"var(--font-body)"}}>From</div>
              <div style={{fontSize:15,color:C.gold,fontFamily:"var(--font-heading-primary)",
                fontWeight:600}}>{v.priceFrom}</div>
            </div>
            <div>
              <div style={{fontSize:9,letterSpacing:"2px",textTransform:"uppercase",
                color:C.grey,marginBottom:2,fontFamily:"var(--font-body)"}}>Tier</div>
              <div style={{fontSize:13,color:C.white,letterSpacing:"1px"}}>{v.priceLabel}</div>
            </div>
          </div>

          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>onView(v)} style={{
              background:`linear-gradient(135deg,${C.gold},${C.gold2})`,
              border:"none",color:"#fff",
              padding:"10px 22px",fontSize:11,fontWeight:700,letterSpacing:"1.5px",
              textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit",
              transition:"opacity 0.2s",
            }}
            onMouseEnter={e=>e.currentTarget.style.opacity="0.88"}
            onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              View Venue
            </button>
            <button style={{
              background:"none",border:`1px solid ${C.border2}`,color:C.grey,
              padding:"10px 18px",fontSize:11,fontWeight:600,letterSpacing:"1px",
              textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit",
              transition:"all 0.2s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.color=C.gold;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border2;e.currentTarget.style.color=C.grey;}}>
              Enquire
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GRID VENUE CARD
// ═══════════════════════════════════════════════════════════════
function GCard({ v, saved, onSave, onView }) {
  const C = useContext(Ctx);
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        background:C.card, border:`1px solid ${hov?C.gold:C.border}`,
        overflow:"hidden", cursor:"pointer", transition:"all 0.3s",
        boxShadow:hov?`0 12px 40px rgba(0,0,0,0.1)`:"none",
      }}
      onClick={()=>onView(v)}>

      {/* Image */}
      <div style={{height:230,position:"relative",overflow:"hidden",background:"#0a0806"}}>
        <img src={v.imgs[0]} alt={v.name} style={{
          width:"100%",height:"100%",objectFit:"cover",
          transform:hov?"scale(1.06)":"scale(1)", transition:"transform 0.65s ease",
        }}/>
        <div style={{position:"absolute",inset:0,
          background:"linear-gradient(180deg,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.55) 100%)"}}/>
        {v.featured && <div style={{position:"absolute",top:0,left:0,right:0,height:2,
          background:"linear-gradient(90deg,#C9A84C,#e8c97a,#C9A84C)",
          backgroundSize:"200%",animation:"shimmer 3s linear infinite"}}/>}
        {v.tag && (
          <div style={{position:"absolute",bottom:12,left:12}}>
            <GoldBadge text={v.tag}/>
          </div>
        )}
        <button onClick={e=>{e.stopPropagation();onSave(v.id);}} style={{
          position:"absolute",top:10,right:10,
          width:30,height:30,borderRadius:"50%",
          background:saved?"rgba(201,168,76,0.9)":"rgba(0,0,0,0.4)",
          border:"none",color:saved?"#0f0d0a":"rgba(255,255,255,0.8)",
          cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",
        }}>♡</button>
      </div>

      {/* Content */}
      <div style={{padding:"18px 20px 20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
          <div>
            <h3 style={{fontFamily:"var(--font-heading-primary)",fontSize:20,fontWeight:500,
              color:C.white,lineHeight:1.15,marginBottom:3}}>{v.name}</h3>
            <div style={{fontSize:11,color:C.grey,fontFamily:"var(--font-body)"}}>
              {v.city}, {v.region}
            </div>
          </div>
          {v.verified && (
            <span style={{fontSize:8,letterSpacing:"1px",textTransform:"uppercase",
              color:C.green,border:`1px solid rgba(34,197,94,0.25)`,
              padding:"2px 6px",whiteSpace:"nowrap"}}>✓</span>
          )}
        </div>

        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
          <Stars r={v.rating}/>
          <span style={{fontSize:11,color:C.grey}}>({v.reviews})</span>
        </div>

        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
          {v.styles.slice(0,2).map(s => <Pill key={s} text={s}/>)}
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          paddingTop:12,borderTop:`1px solid ${C.border}`}}>
          <div>
            <div style={{fontSize:9,color:C.grey,letterSpacing:"1.5px",textTransform:"uppercase",
              marginBottom:2}}>From</div>
            <div style={{fontFamily:"var(--font-heading-primary)",fontSize:18,
              color:C.gold,fontWeight:600}}>{v.priceFrom}</div>
          </div>
          <div style={{fontSize:11,color:C.grey,textAlign:"right"}}>
            <div>Up to {v.capacity}</div>
            <div style={{fontSize:9,letterSpacing:"1px",textTransform:"uppercase",marginTop:2}}>guests</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FEATURED SLIDER — full-width break
// ═══════════════════════════════════════════════════════════════
function FeaturedSlider({ venues }) {
  const [idx, setIdx] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef(null);

  const goTo = (i) => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => { setIdx(i); setTransitioning(false); }, 400);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      goTo((idx + 1) % venues.length);
    }, 5500);
    return () => clearInterval(timerRef.current);
  }, [idx, venues.length]);

  const cur = venues[idx];
  return (
    <div style={{position:"relative",height:580,overflow:"hidden",background:"#040302"}}>
      {/* Gold shimmer border */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,zIndex:10,
        background:"linear-gradient(90deg,#C9A84C,#e8c97a,#C9A84C)",
        backgroundSize:"200%",animation:"shimmer 3s linear infinite"}}/>

      {/* Images */}
      {venues.map((v,i) => (
        <div key={v.id} style={{
          position:"absolute",inset:0,
          opacity:i===idx?(transitioning?0:1):0,
          transition:"opacity 0.8s ease",
        }}>
          <img src={v.imgs[0]} alt={v.name} style={{
            width:"100%",height:"100%",objectFit:"cover",
            transform:i===idx?"scale(1.03)":"scale(1)",
            transition:"transform 6s ease",
          }}/>
        </div>
      ))}

      {/* Gradient overlays */}
      <div style={{position:"absolute",inset:0,zIndex:2,
        background:"linear-gradient(to right,rgba(4,3,2,0.85) 0%,rgba(4,3,2,0.5) 55%,rgba(4,3,2,0.15) 100%)"}}/>
      <div style={{position:"absolute",inset:0,zIndex:2,
        background:"linear-gradient(180deg,transparent 40%,rgba(4,3,2,0.6) 100%)"}}/>

      {/* Section label */}
      <div style={{position:"absolute",top:40,left:80,zIndex:5,
        display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:28,height:1,background:"rgba(201,168,76,0.7)"}}/>
        <span style={{fontSize:9,letterSpacing:"4px",textTransform:"uppercase",
          color:"rgba(201,168,76,0.9)",fontFamily:"var(--font-body)",fontWeight:600}}>
          ✦ Featured Venues
        </span>
      </div>

      {/* Content */}
      <div style={{
        position:"absolute",bottom:72,left:80,right:"40%",zIndex:5,
        opacity:transitioning?0:1,transform:transitioning?"translateY(12px)":"translateY(0)",
        transition:"all 0.4s ease",
      }}>
        {cur.tag && (
          <div style={{marginBottom:16}}>
            <GoldBadge text={cur.tag}/>
          </div>
        )}
        <h2 style={{fontFamily:"var(--font-heading-primary)",
          fontSize:"clamp(36px,4.5vw,58px)",fontWeight:400,fontStyle:"italic",
          color:"#ffffff",lineHeight:1.05,marginBottom:12,letterSpacing:"-0.5px"}}>
          {cur.name}
        </h2>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.6)",marginBottom:16,
          display:"flex",alignItems:"center",gap:8,fontFamily:"var(--font-body)"}}>
          <span style={{color:"rgba(201,168,76,0.8)",fontSize:10}}>◆</span>
          {cur.city}, {cur.region} · Italy
          <span style={{color:"rgba(255,255,255,0.25)"}}>·</span>
          Up to {cur.capacity} guests
        </div>
        <p style={{fontSize:14,color:"rgba(255,255,255,0.65)",lineHeight:1.75,
          fontFamily:"var(--font-body)",fontWeight:300,marginBottom:28,maxWidth:500}}>
          {cur.desc}
        </p>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <button style={{
            background:"linear-gradient(135deg,#C9A84C,#e8c97a)",
            border:"none",color:"#0f0d0a",
            padding:"12px 28px",fontSize:11,fontWeight:800,letterSpacing:"2px",
            textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit",
            transition:"opacity 0.2s",
          }}>
            View Venue →
          </button>
          <div style={{display:"flex",alignItems:"center",gap:6,marginLeft:8}}>
            <Stars r={cur.rating}/>
            <span style={{fontSize:12,color:"rgba(255,255,255,0.55)"}}>
              {cur.rating} ({cur.reviews} reviews)
            </span>
          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
      {[{dir:-1,pos:"left:28px",label:"‹"},{dir:1,pos:"right:28px",label:"›"}].map((a,i) => (
        <button key={i} onClick={()=>goTo((idx+a.dir+venues.length)%venues.length)}
          style={{
            position:"absolute",[i===0?"left":"right"]:28,top:"50%",transform:"translateY(-50%)",zIndex:6,
            width:46,height:46,borderRadius:"50%",
            background:"rgba(255,255,255,0.08)",
            border:"1px solid rgba(255,255,255,0.18)",
            color:"rgba(255,255,255,0.8)",cursor:"pointer",fontSize:22,
            display:"flex",alignItems:"center",justifyContent:"center",
            transition:"all 0.2s",fontFamily:"inherit",
          }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,168,76,0.25)";e.currentTarget.style.borderColor="#C9A84C";}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.08)";e.currentTarget.style.borderColor="rgba(255,255,255,0.18)";}}>
          {a.label}
        </button>
      ))}

      {/* Progress dots */}
      <div style={{position:"absolute",bottom:28,left:80,zIndex:6,display:"flex",gap:8,alignItems:"center"}}>
        {venues.map((_,i) => (
          <button key={i} onClick={()=>goTo(i)}
            style={{
              height:2,width:i===idx?28:10,
              background:i===idx?"#C9A84C":"rgba(255,255,255,0.3)",
              border:"none",cursor:"pointer",padding:0,
              transition:"all 0.4s ease",
            }}/>
        ))}
        <span style={{fontSize:10,color:"rgba(255,255,255,0.35)",marginLeft:8,
          fontFamily:"var(--font-body)",letterSpacing:"1px"}}>
          {String(idx+1).padStart(2,"0")} / {String(venues.length).padStart(2,"0")}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EDITORIAL VISUAL BANNER — second break
// ═══════════════════════════════════════════════════════════════
function EditorialBanner() {
  const C = useContext(Ctx);
  return (
    <div style={{position:"relative",height:420,overflow:"hidden",background:"#040302"}}>
      <img
        src="https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1920&q=80"
        alt="Italy weddings" style={{
          width:"100%",height:"100%",objectFit:"cover",opacity:0.4,transform:"scale(1.03)"
        }}/>
      <div style={{position:"absolute",inset:0,
        background:"linear-gradient(135deg,rgba(4,3,2,0.85) 0%,rgba(4,3,2,0.6) 50%,rgba(4,3,2,0.75) 100%)"}}/>

      {/* Content centred */}
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
        alignItems:"center",justifyContent:"center",textAlign:"center",padding:"0 40px",zIndex:2}}>

        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24}}>
          <div style={{width:60,height:1,background:"rgba(201,168,76,0.5)"}}/>
          <span style={{fontSize:9,letterSpacing:"5px",textTransform:"uppercase",
            color:"rgba(201,168,76,0.8)",fontFamily:"var(--font-body)",fontWeight:600}}>
            Exclusively Curated
          </span>
          <div style={{width:60,height:1,background:"rgba(201,168,76,0.5)"}}/>
        </div>

        <h2 style={{fontFamily:"var(--font-heading-primary)",fontSize:"clamp(32px,4vw,54px)",
          fontWeight:300,color:"#ffffff",lineHeight:1.15,marginBottom:16,maxWidth:760,
          letterSpacing:"-0.5px"}}>
          Italy — where every moment becomes a memory<br/>
          <em style={{fontStyle:"italic",color:"rgba(201,168,76,0.9)"}}>
            worth keeping forever.
          </em>
        </h2>

        <p style={{fontSize:14,color:"rgba(255,255,255,0.5)",fontFamily:"var(--font-body)",
          fontWeight:300,lineHeight:1.7,maxWidth:520,marginBottom:32}}>
          Every venue in our Italian collection has been personally visited and approved by our editorial team. Only the exceptional makes the list.
        </p>

        <div style={{display:"flex",gap:12}}>
          <button style={{
            background:"linear-gradient(135deg,#C9A84C,#e8c97a)",
            border:"none",color:"#0f0d0a",
            padding:"12px 32px",fontSize:11,fontWeight:800,letterSpacing:"2px",
            textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit",
          }}>
            Start Planning
          </button>
          <button style={{
            background:"none",border:"1px solid rgba(255,255,255,0.25)",
            color:"rgba(255,255,255,0.7)",
            padding:"12px 28px",fontSize:11,fontWeight:600,letterSpacing:"1.5px",
            textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit",
            transition:"all 0.25s",
          }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="#C9A84C";e.currentTarget.style.color="#C9A84C";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.25)";e.currentTarget.style.color="rgba(255,255,255,0.7)";}}>
            Talk to a Consultant
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAP VIEW
// ═══════════════════════════════════════════════════════════════
function MapSection({ venues }) {
  const C = useContext(Ctx);
  const [active, setActive] = useState(null);
  return (
    <div style={{maxWidth:1280,margin:"0 auto",padding:"40px 48px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:0,
        border:`1px solid ${C.border}`,overflow:"hidden",height:620}}>

        {/* Map iframe */}
        <div style={{position:"relative",background:"#e8e4df"}}>
          <iframe
            title="Italy venues map"
            src="https://www.openstreetmap.org/export/embed.html?bbox=6.6272%2C35.4897%2C18.7845%2C47.0921&layer=mapnik"
            style={{width:"100%",height:"100%",border:"none",filter:"saturate(0.8) contrast(0.95)"}}
          />
          {/* Map overlay header */}
          <div style={{position:"absolute",top:0,left:0,right:0,
            background:`linear-gradient(180deg,${C.dark}ee 0%,transparent 100%)`,
            padding:"16px 20px",pointerEvents:"none"}}>
            <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",
              color:C.gold,fontWeight:700,fontFamily:"var(--font-body)"}}>
              ◎ Interactive Map · Italy
            </div>
          </div>
          {/* Notice */}
          <div style={{position:"absolute",bottom:12,left:12,right:12,
            background:"rgba(4,3,2,0.75)",padding:"8px 14px",
            border:"1px solid rgba(201,168,76,0.2)"}}>
            <p style={{fontSize:11,color:"rgba(255,255,255,0.6)",fontFamily:"var(--font-body)",
              textAlign:"center",letterSpacing:"0.5px"}}>
              ✦ Leaflet integration ready — venue pins will appear here
            </p>
          </div>
        </div>

        {/* Venue side panel */}
        <div style={{borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",
          background:C.card,overflow:"hidden"}}>
          <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}`,
            background:C.dark,flexShrink:0}}>
            <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",
              color:C.grey,marginBottom:4,fontFamily:"var(--font-body)"}}>
              Venues in view
            </div>
            <div style={{fontFamily:"var(--font-heading-primary)",fontSize:20,color:C.white}}>
              {venues.length} Italian Estates
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto"}}>
            {venues.map(v => (
              <div key={v.id}
                onMouseEnter={()=>setActive(v.id)}
                onMouseLeave={()=>setActive(null)}
                style={{
                  display:"flex",gap:12,padding:"14px 16px",cursor:"pointer",
                  borderBottom:`1px solid ${C.border}`,
                  background:active===v.id?C.goldDim:"transparent",
                  transition:"background 0.2s",
                }}>
                <img src={v.imgs[0]} alt={v.name} style={{
                  width:60,height:60,objectFit:"cover",flexShrink:0,
                  border:`1px solid ${active===v.id?C.gold:C.border}`,
                  transition:"border-color 0.2s",
                }}/>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:13,fontFamily:"var(--font-heading-primary)",
                    color:C.white,fontWeight:500,marginBottom:2,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {v.name}
                  </div>
                  <div style={{fontSize:11,color:C.grey,marginBottom:4,fontFamily:"var(--font-body)"}}>
                    {v.region} · {v.capacity} guests
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <Stars r={v.rating}/>
                    <span style={{fontSize:10,color:C.gold,fontWeight:700}}>{v.priceFrom}</span>
                  </div>
                </div>
                <div style={{fontSize:10,color:C.gold,marginLeft:"auto",alignSelf:"center",
                  opacity:active===v.id?1:0,transition:"opacity 0.2s"}}>→</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BOTTOM SEO TEXT BLOCK
// ═══════════════════════════════════════════════════════════════
function SEOBlock() {
  const C = useContext(Ctx);
  const [openFaq, setOpenFaq] = useState(null);
  const faqs = [
    { q:"When is the best time to get married in Italy?", a:"Late April through June and September through October offer the finest weather — warm, dry days with a golden light that photographers love. August can be intensely hot, particularly in Tuscany and Puglia, so consider early morning or late evening ceremonies." },
    { q:"Do I need a civil or religious ceremony in Italy?", a:"Both options are available. Civil ceremonies at the Comune (town hall) are legally binding in Italy. Religious ceremonies require additional legal paperwork. Many couples opt for a symbolic ceremony abroad followed by a legal ceremony at home." },
    { q:"How far in advance should I book an Italian venue?", a:"Our top venues, particularly those in Tuscany, Lake Como and the Amalfi Coast, book 18–24 months in advance for peak season dates. We recommend beginning your venue search at least 18 months before your intended wedding date." },
    { q:"What is the average cost of an Italian wedding venue?", a:"Premium exclusive-use villa estates typically range from £12,000 to £35,000 for venue hire alone, excluding catering, florals and accommodation. Intimate properties in Puglia and Umbria can be more accessible from £8,000." },
  ];
  return (
    <div style={{background:C.dark,borderTop:`1px solid ${C.border}`}}>
      <div style={{maxWidth:1280,margin:"0 auto",padding:"80px 48px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:80}}>

          {/* Left: editorial */}
          <div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
              <div style={{width:28,height:1,background:C.gold}}/>
              <span style={{fontSize:9,letterSpacing:"4px",textTransform:"uppercase",
                color:C.gold,fontWeight:700,fontFamily:"var(--font-body)"}}>Planning Guide</span>
            </div>
            <h2 style={{fontFamily:"var(--font-heading-primary)",fontSize:38,fontWeight:400,
              color:C.white,lineHeight:1.15,marginBottom:24,letterSpacing:"-0.3px"}}>
              Planning Your<br/><em style={{fontStyle:"italic"}}>Italian Wedding</em>
            </h2>
            <div style={{width:40,height:1,background:C.gold,marginBottom:28,opacity:0.5}}/>
            <p style={{fontSize:14,color:C.grey,lineHeight:1.85,fontFamily:"var(--font-body)",
              fontWeight:300,marginBottom:18}}>
              Italy's enduring appeal as a wedding destination lies not just in its beauty, but in its culture. A country that has celebrated love, feasting and family for millennia, it brings an unparalleled depth to any wedding celebration.
            </p>
            <p style={{fontSize:14,color:C.grey,lineHeight:1.85,fontFamily:"var(--font-body)",
              fontWeight:300,marginBottom:18}}>
              Whether you dream of a candlelit dinner among Brunello vines, a ceremony on a clifftop above the Mediterranean, or a black-tie reception in a Venetian palazzo, Italy holds a setting for every vision and every scale.
            </p>
            <p style={{fontSize:14,color:C.grey,lineHeight:1.85,fontFamily:"var(--font-body)",
              fontWeight:300,marginBottom:36}}>
              Our editorial team has personally visited every venue in this collection. We negotiate on your behalf with venue owners, recommend the finest local suppliers, and provide the legal guidance needed to marry in Italy with confidence.
            </p>

            {/* Region quick links */}
            <div style={{marginBottom:28}}>
              <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",
                color:C.grey,marginBottom:14,fontFamily:"var(--font-body)"}}>
                Explore by Region
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {["Tuscany","Lake Como","Venice","Amalfi Coast","Puglia","Sicily","Rome","Umbria"].map(r => (
                  <span key={r} style={{
                    fontSize:12,color:C.white,background:C.card,
                    border:`1px solid ${C.border}`,padding:"6px 14px",
                    cursor:"pointer",transition:"all 0.2s",fontFamily:"var(--font-body)",
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.color=C.gold;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.white;}}>
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: FAQ */}
          <div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
              <div style={{width:28,height:1,background:C.gold}}/>
              <span style={{fontSize:9,letterSpacing:"4px",textTransform:"uppercase",
                color:C.gold,fontWeight:700,fontFamily:"var(--font-body)"}}>FAQ</span>
            </div>
            <h3 style={{fontFamily:"var(--font-heading-primary)",fontSize:30,fontWeight:400,
              color:C.white,lineHeight:1.2,marginBottom:32}}>
              Common Questions
            </h3>
            <div>
              {faqs.map((f,i) => (
                <div key={i} style={{borderTop:`1px solid ${C.border}`,
                  borderBottom:i===faqs.length-1?`1px solid ${C.border}`:"none"}}>
                  <button onClick={()=>setOpenFaq(openFaq===i?null:i)}
                    style={{
                      width:"100%",background:"none",border:"none",
                      padding:"20px 0",display:"flex",justifyContent:"space-between",
                      alignItems:"center",cursor:"pointer",fontFamily:"inherit",gap:12,
                      textAlign:"left",
                    }}>
                    <span style={{fontSize:14,color:C.white,fontFamily:"var(--font-body)",
                      fontWeight:500,lineHeight:1.4}}>
                      {f.q}
                    </span>
                    <span style={{color:C.gold,fontSize:18,flexShrink:0,
                      transform:openFaq===i?"rotate(45deg)":"rotate(0deg)",
                      transition:"transform 0.3s"}}>
                      +
                    </span>
                  </button>
                  {openFaq===i && (
                    <div style={{padding:"0 0 20px",fontSize:13,color:C.grey,
                      lineHeight:1.8,fontFamily:"var(--font-body)",fontWeight:300}}>
                      {f.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Key stats */}
            <div style={{marginTop:40,display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              {[
                {val:"142",label:"Curated venues"},
                {val:"9",label:"Italian regions"},
                {val:"18–24mo",label:"Avg. booking lead"},
                {val:"100%",label:"Personally verified"},
              ].map((s,i) => (
                <div key={i} style={{padding:"16px 20px",border:`1px solid ${C.border}`,
                  background:C.card}}>
                  <div style={{fontFamily:"var(--font-heading-primary)",fontSize:28,
                    color:C.gold,fontWeight:600,lineHeight:1}}>{s.val}</div>
                  <div style={{fontSize:10,letterSpacing:"1.5px",textTransform:"uppercase",
                    color:C.grey,marginTop:6,fontFamily:"var(--font-body)"}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN CATEGORY PAGE
// ═══════════════════════════════════════════════════════════════
export default function CategoryPage({ onBack = () => {}, onViewVenue = () => {} }) {
  const [darkMode, setDarkMode] = useState(false);
  const C = darkMode ? DARK_C : LIGHT_C;
  const [filters, setFilters] = useState({
    region: REGIONS[0], style: STYLES[0], capacity: CAPS[0], price: PRICES[0],
  });
  const [viewMode, setViewMode] = useState("list");
  const [visibleCount, setVisibleCount] = useState(10);
  const [savedIds, setSavedIds] = useState([]);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const toggleSave = (id) =>
    setSavedIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  // Filter logic
  const filtered = VENUES.filter(v => {
    const rOk = filters.region === REGIONS[0] || v.region === filters.region;
    const sOk = filters.style  === STYLES[0]  || v.styles.includes(filters.style);
    const pOk = filters.price  === PRICES[0]  || v.priceLabel === filters.price;
    const cOk = (() => {
      if (filters.capacity === CAPS[0]) return true;
      if (filters.capacity === CAPS[1]) return v.capacity <= 50;
      if (filters.capacity === CAPS[2]) return v.capacity > 50  && v.capacity <= 100;
      if (filters.capacity === CAPS[3]) return v.capacity > 100 && v.capacity <= 200;
      if (filters.capacity === CAPS[4]) return v.capacity > 200;
      return true;
    })();
    return rOk && sOk && pOk && cOk;
  });

  const batch1 = filtered.slice(0, 5);
  const batch2 = filtered.slice(5, Math.min(visibleCount, filtered.length));
  const featuredVenues = VENUES.filter(v => v.featured);

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Gilda+Display&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,600&family=Outfit:wght@300;400;500;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:var(--font-body);background:${C.black};color:${C.white};}
    ::-webkit-scrollbar{width:4px;}
    ::-webkit-scrollbar-track{background:${C.dark};}
    ::-webkit-scrollbar-thumb{background:${C.gold};}
    @keyframes shimmer{0%{background-position:-200% 0;}100%{background-position:200% 0;}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
    @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
    select option{background:${C.dark};color:${C.white};}
  `;

  return (
    <Ctx.Provider value={C}>
      <div style={{background:C.black,minHeight:"100vh",color:C.white}}>
        <style>{CSS}</style>

        <CatNav
          onBack={onBack}
          scrolled={scrolled}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(d => !d)}
        />

        {/* Hero */}
        <Hero count={filtered.length} />

        {/* Info strip */}
        <InfoStrip />

        {/* Latest 5 venues + SEO text split */}
        <LatestSplit venues={VENUES.slice(0, 5)} />

        {/* Divider */}
        <div style={{maxWidth:1280,margin:"0 auto",padding:"0 48px"}}>
          <div style={{height:1,background:C.border}}/>
        </div>

        {/* Filter bar (sticky) */}
        <FilterBar
          filters={filters}
          onChange={setFilters}
          viewMode={viewMode}
          onViewMode={setViewMode}
          total={filtered.length}
        />

        {/* ── MAP VIEW ── */}
        {viewMode === "map" && <MapSection venues={filtered} />}

        {/* ── LIST / GRID VIEW ── */}
        {viewMode !== "map" && (
          <>
            {/* Batch 1 */}
            <div style={{maxWidth:1280,margin:"0 auto",padding:"40px 48px 0"}}>
              {filtered.length === 0 ? (
                <div style={{textAlign:"center",padding:"80px 0"}}>
                  <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",
                    color:C.grey,marginBottom:12}}>No Results</div>
                  <div style={{fontFamily:"var(--font-heading-primary)",fontSize:28,color:C.white,
                    marginBottom:16}}>No venues match your filters</div>
                  <button onClick={()=>setFilters({region:REGIONS[0],style:STYLES[0],capacity:CAPS[0],price:PRICES[0]})}
                    style={{background:"none",border:`1px solid ${C.gold}`,color:C.gold,
                      padding:"10px 24px",fontSize:11,fontWeight:700,letterSpacing:"2px",
                      textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit"}}>
                    Clear Filters
                  </button>
                </div>
              ) : viewMode === "grid" ? (
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
                  {batch1.map(v => (
                    <GCard key={v.id} v={v}
                      saved={savedIds.includes(v.id)}
                      onSave={toggleSave}
                      onView={onViewVenue}/>
                  ))}
                </div>
              ) : (
                batch1.map(v => (
                  <HCard key={v.id} v={v}
                    saved={savedIds.includes(v.id)}
                    onSave={toggleSave}
                    onView={onViewVenue}/>
                ))
              )}
            </div>

            {/* ── FEATURED SLIDER break 1 ── */}
            {featuredVenues.length > 0 && filtered.length >= 5 && (
              <div style={{marginTop:48}}>
                <FeaturedSlider venues={featuredVenues} />
              </div>
            )}

            {/* Batch 2 */}
            {batch2.length > 0 && (
              <div style={{maxWidth:1280,margin:"0 auto",padding:"48px 48px 0"}}>
                {viewMode === "grid" ? (
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
                    {batch2.map(v => (
                      <GCard key={v.id} v={v}
                        saved={savedIds.includes(v.id)}
                        onSave={toggleSave}
                        onView={onViewVenue}/>
                    ))}
                  </div>
                ) : (
                  batch2.map(v => (
                    <HCard key={v.id} v={v}
                      saved={savedIds.includes(v.id)}
                      onSave={toggleSave}
                      onView={onViewVenue}/>
                  ))
                )}
              </div>
            )}

            {/* ── EDITORIAL BANNER break 2 ── */}
            <div style={{marginTop:64}}>
              <EditorialBanner />
            </div>

            {/* Load more */}
            {visibleCount < filtered.length && (
              <div style={{textAlign:"center",padding:"52px 0 16px"}}>
                <div style={{fontSize:11,color:C.grey,marginBottom:16,fontFamily:"var(--font-body)"}}>
                  Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} venues
                </div>
                <button
                  onClick={() => setVisibleCount(c => c + 10)}
                  style={{
                    background:"none", border:`1px solid ${C.gold}`, color:C.gold,
                    padding:"13px 40px", fontSize:11, fontWeight:700, letterSpacing:"2px",
                    textTransform:"uppercase", cursor:"pointer", fontFamily:"inherit",
                    transition:"all 0.25s",
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.background=C.gold;e.currentTarget.style.color="#fff";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color=C.gold;}}>
                  Load More Venues
                </button>
              </div>
            )}
          </>
        )}

        {/* Bottom SEO block */}
        <SEOBlock />

        {/* Footer strip */}
        <div style={{background:C.dark,borderTop:`1px solid ${C.border}`,
          padding:"28px 48px",textAlign:"center"}}>
          <div style={{fontFamily:"var(--font-heading-primary)",fontSize:14,color:C.grey}}>
            Luxury <span style={{color:C.gold}}>Wedding</span> Directory · Italy
            <span style={{margin:"0 16px",opacity:0.3}}>|</span>
            <span style={{fontSize:11,letterSpacing:"1px"}}>142 Curated Venues · Personally Verified</span>
          </div>
        </div>
      </div>
    </Ctx.Provider>
  );
}
