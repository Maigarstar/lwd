// ═══════════════════════════════════════════════════════════════════════════════
// Seed script for real_weddings table with Puglia mock data
//
// Purpose: Populate the real_weddings and real_wedding_vendors tables with
// sample data for testing the Real Weddings gallery feature on region pages.
//
// Usage:
//   node scripts/seed-real-weddings.js
//
// Prerequisites:
//   - .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
//   - real_weddings and real_wedding_vendors tables created in Supabase
//   - Service role key (or anon key with insert permissions)
//
// Data Structure:
//   - 6 sample Puglia weddings with romantic descriptions
//   - Vendor credits for the first wedding (venue, catering, photography)
//   - Location-based filtering for regional searches
//
// Future Improvements:
//   - Accept region parameter to seed different regions
//   - Batch insert for better performance
//   - Conflict handling (update if exists)
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  console.error("VITE_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("VITE_SUPABASE_ANON_KEY:", supabaseKey ? "✓" : "✗");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const realWeddingsData = [
  {
    title: "Isabella & Marco's Masseria Romance",
    slug: "isabella-marco-masseria",
    description: "A romantic celebration in a traditional Puglian masseria with olive grove views",
    couple_names: "Isabella & Marco",
    wedding_date: "2025-06-15",
    location: "Puglia, Italy",
    featured_image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
    gallery_images: [],
    couple_story:
      "We fell in love with Puglia the moment we arrived. The warmth of the people, the golden light, and the timeless beauty of the countryside made it the perfect backdrop for our celebration.",
    featured: true,
    status: "published",
  },
  {
    title: "Sophia & Luca's Trulli Tale",
    slug: "sophia-luca-trulli",
    description: "An enchanting wedding among the iconic cone-shaped houses of the Itria Valley",
    couple_names: "Sophia & Luca",
    wedding_date: "2025-07-20",
    location: "Puglia, Italy",
    featured_image:
      "https://images.unsplash.com/photo-1522202176988-8f6c92e1c869?auto=format&fit=crop&w=800&q=80",
    gallery_images: [],
    couple_story:
      "The trulli houses of Alberobello stole our hearts. Our wedding day felt like a fairytale, surrounded by centuries of history and Puglian hospitality.",
    featured: true,
    status: "published",
  },
  {
    title: "Elena & Giovanni's Coastal Celebration",
    slug: "elena-giovanni-coastal",
    description: "A stunning seaside wedding overlooking the Adriatic Sea in Lecce",
    couple_names: "Elena & Giovanni",
    wedding_date: "2025-08-10",
    location: "Puglia, Italy",
    featured_image:
      "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?auto=format&fit=crop&w=800&q=80",
    gallery_images: [],
    couple_story:
      "The white buildings of Lecce, the limestone cliffs, and the Adriatic waters created the most magical setting for our wedding. Every moment felt like we were celebrating in paradise.",
    featured: true,
    status: "published",
  },
  {
    title: "Valentina & Francesco's Salento Secret",
    slug: "valentina-francesco-salento",
    description: "An intimate gathering in the heart of Salento's wine country",
    couple_names: "Valentina & Francesco",
    wedding_date: "2025-09-05",
    location: "Puglia, Italy",
    featured_image:
      "https://images.unsplash.com/photo-1522235862519-e6d10d5c1b3e?auto=format&fit=crop&w=800&q=80",
    gallery_images: [],
    couple_story:
      "From the olive groves to the vineyards, Salento showed us why Puglia is the soul of southern Italy. Our wedding was a celebration of love, tradition, and Italian beauty.",
    featured: false,
    status: "published",
  },
  {
    title: "Giulia & Alessandro's Garden Bliss",
    slug: "giulia-alessandro-garden",
    description: "A romantic garden wedding in the countryside of the Itria Valley",
    couple_names: "Giulia & Alessandro",
    wedding_date: "2025-10-12",
    location: "Puglia, Italy",
    featured_image:
      "https://images.unsplash.com/photo-1519225421421-e8ab825cbf13?auto=format&fit=crop&w=800&q=80",
    gallery_images: [],
    couple_story:
      "We chose Puglia for its authenticity and warmth. Our celebration was filled with local food, genuine smiles, and the kind of magic that only Italy can provide.",
    featured: false,
    status: "published",
  },
  {
    title: "Chiara & Matteo's Baroque Beauty",
    slug: "chiara-matteo-baroque",
    description: "A sophisticated celebration in Lecce, surrounded by baroque architecture",
    couple_names: "Chiara & Matteo",
    wedding_date: "2025-11-22",
    location: "Puglia, Italy",
    featured_image:
      "https://images.unsplash.com/photo-1519224537898-9496c6a778b2?auto=format&fit=crop&w=800&q=80",
    gallery_images: [],
    couple_story:
      "Lecce's baroque splendor and golden stone provided an unforgettable backdrop. We felt like royalty celebrating in a living, breathing masterpiece.",
    featured: false,
    status: "published",
  },
];

const vendorCreditsData = [
  {
    wedding_slug: "isabella-marco-masseria",
    vendors: [
      {
        vendor_name: "Masseria San Giuseppe",
        vendor_category: "venue",
        vendor_slug: "masseria-san-giuseppe",
        role_description: "The stunning olive-grove venue that made this celebration unforgettable",
      },
      {
        vendor_name: "Puglia Cuisine Catering",
        vendor_category: "catering",
        vendor_slug: "puglia-cuisine-catering",
        role_description: "Local flavors and authentic Puglian dishes that delighted our guests",
      },
      {
        vendor_name: "Southern Light Photography",
        vendor_category: "photography",
        vendor_slug: "southern-light-photography",
        role_description: "Captured the golden hour magic and timeless moments of our celebration",
      },
    ],
  },
];

async function seed() {
  try {
    console.log("🌱 Starting real weddings seed...");

    // Clear existing data (optional - comment out to preserve existing data)
    // const { error: deleteError } = await supabase
    //   .from("real_weddings")
    //   .delete()
    //   .neq("status", "");
    // if (deleteError) console.warn("Delete warning:", deleteError);

    // Insert real weddings
    console.log(`📝 Inserting ${realWeddingsData.length} real weddings...`);
    const { data: insertedWeddings, error: weddingsError } = await supabase
      .from("real_weddings")
      .upsert(realWeddingsData, { onConflict: "slug" });

    if (weddingsError) {
      console.error("❌ Error inserting real weddings:", weddingsError);
      process.exit(1);
    }

    console.log(`✅ Inserted ${insertedWeddings?.length || 0} weddings`);

    // Insert vendor credits
    console.log("📝 Inserting vendor credits...");
    for (const creditGroup of vendorCreditsData) {
      // Find the wedding ID
      const { data: wedding } = await supabase
        .from("real_weddings")
        .select("id")
        .eq("slug", creditGroup.wedding_slug)
        .single();

      if (!wedding) {
        console.warn(`⚠️  Wedding not found: ${creditGroup.wedding_slug}`);
        continue;
      }

      const vendorsToInsert = creditGroup.vendors.map((v) => ({
        ...v,
        real_wedding_id: wedding.id,
      }));

      const { error: vendorError } = await supabase
        .from("real_wedding_vendors")
        .upsert(vendorsToInsert, { onConflict: "real_wedding_id,vendor_name" });

      if (vendorError) {
        console.error(`⚠️  Error inserting vendors for ${creditGroup.wedding_slug}:`, vendorError);
      } else {
        console.log(`✅ Added ${vendorsToInsert.length} vendors for ${creditGroup.wedding_slug}`);
      }
    }

    console.log("🎉 Real weddings seed completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
