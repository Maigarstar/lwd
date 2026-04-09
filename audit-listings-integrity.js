/**
 * LISTINGS INTEGRITY AUDIT SCRIPT
 *
 * Run this against your Supabase database to verify data integrity
 * after the listings.ts corruption incident (2026-04-09)
 *
 * Usage:
 * 1. Set your SUPABASE_URL and SUPABASE_KEY as environment variables
 * 2. Run: node audit-listings-integrity.js
 * 3. Review the audit-report.json output
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: VITE_SUPABASE_URL and SUPABASE_ANON_KEY environment variables required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const audit = {
  timestamp: new Date().toISOString(),
  totalListings: 0,
  cleanCount: 0,
  affectedCount: 0,
  findings: [],
  issues: {
    missingName: [],
    missingSlug: [],
    missingRoutingContext: [],
    duplicateSlug: [],
    duplicateName: [],
    slugNameMismatch: [],
    suspiciousContent: [],
    malformedLocation: [],
  },
};

function slugify(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function runAudit() {
  console.log('🔍 Starting Listings Integrity Audit...\n');

  try {
    // Fetch all listings
    const { data: listings, error: fetchError } = await supabase
      .from('listings')
      .select('id, name, slug, country_slug, region_slug, category_slug, description, hero_image, updated_at')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('ERROR fetching listings:', fetchError);
      process.exit(1);
    }

    if (!listings || listings.length === 0) {
      console.error('ERROR: No listings found');
      process.exit(1);
    }

    audit.totalListings = listings.length;
    console.log(`✓ Fetched ${listings.length} listings\n`);

    // Build content hashes for duplicate detection
    const contentHashes = {};
    const slugMap = {};
    const nameMap = {};

    listings.forEach((listing) => {
      const contentHash = `${listing.description?.substring(0, 100) || ''}${listing.hero_image || ''}`.toLowerCase();
      const slugKey = listing.slug?.toLowerCase();
      const nameKey = listing.name?.toLowerCase();

      if (contentHash) {
        if (!contentHashes[contentHash]) contentHashes[contentHash] = [];
        contentHashes[contentHash].push(listing.id);
      }

      if (slugKey) {
        if (!slugMap[slugKey]) slugMap[slugKey] = [];
        slugMap[slugKey].push(listing.id);
      }

      if (nameKey) {
        if (!nameMap[nameKey]) nameMap[nameKey] = [];
        nameMap[nameKey].push(listing.id);
      }
    });

    // Run integrity checks
    console.log('Running integrity checks...\n');

    listings.forEach((listing) => {
      const issues = [];

      // 1. Missing name
      if (!listing.name || listing.name.trim() === '') {
        issues.push('missing_name');
        audit.issues.missingName.push(listing.id);
      }

      // 2. Missing slug
      if (!listing.slug || listing.slug.trim() === '') {
        issues.push('missing_slug');
        audit.issues.missingSlug.push(listing.id);
      }

      // 3. Missing routing context
      if (!listing.country_slug || !listing.region_slug || !listing.category_slug) {
        issues.push('missing_routing_context');
        audit.issues.missingRoutingContext.push(listing.id);
      }

      // 4. Slug doesn't match name
      if (listing.name && listing.slug) {
        const expectedSlug = slugify(listing.name);
        if (listing.slug.toLowerCase() !== expectedSlug.toLowerCase()) {
          issues.push('slug_name_mismatch');
          audit.issues.slugNameMismatch.push({
            id: listing.id,
            name: listing.name,
            slug: listing.slug,
            expectedSlug: expectedSlug,
          });
        }
      }

      // 5. Duplicate slug
      const slugKey = listing.slug?.toLowerCase();
      if (slugKey && slugMap[slugKey] && slugMap[slugKey].length > 1) {
        issues.push('duplicate_slug');
        if (!audit.issues.duplicateSlug.some(item => item.id === listing.id)) {
          audit.issues.duplicateSlug.push({
            slug: listing.slug,
            ids: slugMap[slugKey],
          });
        }
      }

      // 6. Duplicate name
      const nameKey = listing.name?.toLowerCase();
      if (nameKey && nameMap[nameKey] && nameMap[nameKey].length > 1) {
        issues.push('duplicate_name');
        if (!audit.issues.duplicateName.some(item => item.name === listing.name)) {
          audit.issues.duplicateName.push({
            name: listing.name,
            ids: nameMap[nameKey],
          });
        }
      }

      // 7. Suspicious content duplication
      const contentHash = `${listing.description?.substring(0, 100) || ''}${listing.hero_image || ''}`.toLowerCase();
      if (contentHash && contentHashes[contentHash] && contentHashes[contentHash].length > 1) {
        issues.push('suspicious_content_duplication');
        if (!audit.issues.suspiciousContent.some(item => item.hash === contentHash)) {
          audit.issues.suspiciousContent.push({
            hash: contentHash,
            ids: contentHashes[contentHash],
            affectedListings: contentHashes[contentHash].map(id => {
              const l = listings.find(x => x.id === id);
              return { id, name: l?.name };
            }),
          });
        }
      }

      if (issues.length > 0) {
        audit.affectedCount++;
        audit.findings.push({
          id: listing.id,
          name: listing.name,
          slug: listing.slug,
          issues: issues,
          updatedAt: listing.updated_at,
        });
      } else {
        audit.cleanCount++;
      }
    });

    // Generate report
    console.log('\n📊 AUDIT RESULTS\n');
    console.log(`Total Listings:     ${audit.totalListings}`);
    console.log(`Clean:              ${audit.cleanCount}`);
    console.log(`Affected:           ${audit.affectedCount}`);
    console.log(`Pass Rate:          ${((audit.cleanCount / audit.totalListings) * 100).toFixed(1)}%\n`);

    if (audit.affectedCount > 0) {
      console.log('⚠️  ISSUES FOUND:\n');
      console.log(`Missing Names:                 ${audit.issues.missingName.length}`);
      console.log(`Missing Slugs:                 ${audit.issues.missingSlug.length}`);
      console.log(`Missing Routing Context:       ${audit.issues.missingRoutingContext.length}`);
      console.log(`Slug/Name Mismatches:          ${audit.issues.slugNameMismatch.length}`);
      console.log(`Duplicate Slugs:               ${audit.issues.duplicateSlug.length}`);
      console.log(`Duplicate Names:               ${audit.issues.duplicateName.length}`);
      console.log(`Suspicious Content Duplication: ${audit.issues.suspiciousContent.length}\n`);

      console.log('⚠️  AFFECTED LISTINGS:\n');
      audit.findings.forEach((finding) => {
        console.log(`  ID: ${finding.id}`);
        console.log(`  Name: ${finding.name || '(missing)'}`);
        console.log(`  Slug: ${finding.slug || '(missing)'}`);
        console.log(`  Issues: ${finding.issues.join(', ')}`);
        console.log(`  Updated: ${finding.updatedAt}\n`);
      });
    } else {
      console.log('✅ All listings passed integrity checks!\n');
    }

    // Write full report
    const reportPath = './audit-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(audit, null, 2));
    console.log(`\n📄 Full report written to: ${reportPath}`);

    // Summary for next steps
    console.log('\n🔧 NEXT STEPS:\n');
    if (audit.affectedCount > 0) {
      console.log('1. Review audit-report.json for detailed findings');
      console.log('2. For each affected listing:');
      console.log('   - Verify correct data in database');
      console.log('   - Restore from backup if corrupted');
      console.log('   - Correct slug/name/location fields if mismatched');
      console.log('3. Merge or remove duplicate entries');
      console.log('4. Re-run audit to confirm fixes');
    } else {
      console.log('✅ All listings are integrity-clean');
      console.log('Proceed with preventive actions:\n');
      console.log('1. Add defensive state reset in editor (done ✓)');
      console.log('2. Add build guard for empty service files');
      console.log('3. Add validation layer in updateListing()');
      console.log('4. Add CI checks for admin vs public parity');
    }

    process.exit(0);
  } catch (err) {
    console.error('AUDIT ERROR:', err.message);
    process.exit(1);
  }
}

runAudit();
