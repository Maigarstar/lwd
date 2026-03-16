/**
 * prospectDiscoveryService.js
 *
 * AI-powered prospect discovery in two modes:
 *
 *   1. Keyword mode - Admin provides search criteria; AI generates a list of
 *      realistic venue/vendor prospects in the given location to investigate.
 *
 *   2. URL mode - Admin provides a website URL; AI extracts company name,
 *      contact details, venue type and notes into a draft prospect.
 *
 * All imported prospects store:
 *   source = 'Discovery Engine'
 *   notes include: discovery_mode, discovery_query or source_url
 *
 * This allows later analysis of which discovery method yields the best leads.
 */

import { supabase }                 from '../lib/supabaseClient';
import { createProspect, findDuplicateProspects } from './salesPipelineService';
import { assignProspectPipeline }   from './pipelineAssignmentService';
import { calculateLeadScore }       from './leadScoringService';
import { fetchStages }              from './pipelineBuilderService';

// ── AI helpers ────────────────────────────────────────────────────────────────

async function callAI(feature, systemPrompt, userPrompt) {
  const { data, error } = await supabase.functions.invoke('ai-generate', {
    body: { feature, systemPrompt, userPrompt },
  });
  if (error || !data?.text) throw new Error(error?.message || 'AI generation failed');

  // Strip markdown code blocks if AI wraps in ```json
  const cleaned = data.text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();
  return cleaned;
}

function parseJSON(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    // Try to extract the first JSON array or object
    const arrMatch = raw.match(/\[[\s\S]*\]/);
    if (arrMatch) return JSON.parse(arrMatch[0]);
    const objMatch = raw.match(/\{[\s\S]*\}/);
    if (objMatch) return JSON.parse(objMatch[0]);
    throw new Error('AI returned invalid JSON');
  }
}

// ── Mode 1: Keyword discovery ─────────────────────────────────────────────────

/**
 * Generate a list of prospect suggestions based on search criteria.
 * Results are AI-generated and should be verified before being used for outreach.
 *
 * @param {object} opts
 *   @param {string} opts.query      - e.g. "luxury barn venues"
 *   @param {string} opts.location   - e.g. "Cotswolds, UK"
 *   @param {string} opts.venueType  - e.g. "Venue", "Photographer"
 *   @param {number} [opts.count]    - Number of suggestions (default 8)
 * @returns {Promise<Array<{ company_name, website, venue_type, notes, contact_name, country }>>}
 */
export async function discoverByKeywords({ query, location, venueType, count = 8 }) {
  const systemPrompt = `You are a luxury wedding industry researcher for a premium UK wedding directory.
Generate realistic wedding industry businesses that match the given criteria.
These are real-sounding prospects for a B2B sales team to research and approach.
Return ONLY a valid JSON array with no markdown or explanation.
Each item must have: company_name, website (likely URL), venue_type, notes (1-2 sentences about the business), contact_name (likely name), country.
Use UK English. Never use em dashes. Be specific and varied - not generic placeholder names.`;

  const userPrompt = `Generate ${count} ${venueType} businesses in ${location} matching: "${query}"
Return JSON array only: [{ "company_name": "", "website": "", "venue_type": "", "notes": "", "contact_name": "", "country": "" }]`;

  const raw  = await callAI('prospect_discovery', systemPrompt, userPrompt);
  const list = parseJSON(raw);

  if (!Array.isArray(list)) throw new Error('AI did not return an array');

  // Normalise each item
  return list.map(item => ({
    company_name:  item.company_name || 'Unknown',
    website:       item.website      || '',
    venue_type:    item.venue_type   || venueType || 'Venue',
    notes:         item.notes        || '',
    contact_name:  item.contact_name || '',
    email:         item.email        || '',
    country:       item.country      || 'United Kingdom',
    _discovery_mode:  'keyword',
    _discovery_query: `${query} | ${location}`,
  }));
}

// ── Mode 2: URL extraction ────────────────────────────────────────────────────

/**
 * Extract prospect details from a venue or vendor website URL.
 * AI describes what it knows about the business at the domain.
 *
 * @param {string} url
 * @returns {Promise<{ company_name, website, venue_type, contact_name, email, notes, country }>}
 */
export async function discoverFromUrl(url) {
  const systemPrompt = `You are a B2B research assistant for a luxury wedding directory.
Given a website URL, extract the business details as a prospect record.
Use your knowledge of the domain or website to fill in as much as possible.
If you don't know a field, use an empty string - never invent false details.
Return ONLY valid JSON with no markdown or explanation.`;

  const userPrompt = `Extract prospect details from this URL: ${url}
Return JSON only: { "company_name": "", "website": "${url}", "venue_type": "", "contact_name": "", "email": "", "notes": "", "country": "" }
venue_type should be one of: Venue, Photographer, Florist, Caterer, Planner, Musician, Hair and Makeup, Cake Designer, Stationery, Jewellery, Transport, Vendor`;

  const raw    = await callAI('prospect_url_extract', systemPrompt, userPrompt);
  const result = parseJSON(raw);

  return {
    company_name:    result.company_name  || '',
    website:         result.website       || url,
    venue_type:      result.venue_type    || 'Venue',
    contact_name:    result.contact_name  || '',
    email:           result.email         || '',
    notes:           result.notes         || '',
    country:         result.country       || 'United Kingdom',
    _discovery_mode: 'url',
    _source_url:     url,
  };
}

// ── Import ────────────────────────────────────────────────────────────────────

/**
 * Import selected discovered prospects into the pipeline.
 * Auto-assigns pipeline, seeds lead score, and tags source.
 *
 * @param {Array}  items             - Selected discovered prospects (from discoverByKeywords or discoverFromUrl)
 * @param {object} context
 *   @param {Array}  context.pipelines
 *   @param {Array}  context.rules
 *   @param {object} context.settings
 *   @param {Array}  context.allStages
 * @returns {Promise<Array>} Created prospect rows
 */
export async function importDiscoveredProspects(items, { pipelines, rules, settings, allStages }) {
  const created = [];

  for (const item of items) {
    // Build notes string with discovery attribution
    const discoveryNote = item._discovery_mode === 'keyword'
      ? `[Discovery Engine - Keyword: "${item._discovery_query}"]`
      : `[Discovery Engine - URL: ${item._source_url}]`;

    const notes = [item.notes, discoveryNote].filter(Boolean).join('\n');

    const prospectData = {
      company_name:  item.company_name,
      contact_name:  item.contact_name  || null,
      email:         item.email         || null,
      phone:         null,
      website:       item.website       || null,
      venue_type:    item.venue_type,
      source:        'Discovery Engine',
      country:       item.country       || 'United Kingdom',
      notes,
      package:       'Standard',
    };

    try {
      // Dedup check: skip if website/email already in pipeline
      const existing = await findDuplicateProspects({
        email:   prospectData.email,
        website: prospectData.website,
      });
      if (existing.length > 0) {
        console.info(`[DiscoveryEngine] Skipping duplicate: ${item.company_name} (matches ${existing[0].company_name})`);
        created.push({ _duplicate: true, _matched: existing[0], company_name: item.company_name });
        continue;
      }

      // 1. Auto-assign pipeline
      const assignment = await assignProspectPipeline(prospectData, { rules, settings, pipelines });
      const pipeline_id = assignment.pipeline_id;

      // 2. First stage of the assigned pipeline
      const pipelineStages = allStages
        .filter(s => s.pipeline_id === pipeline_id)
        .sort((a, b) => a.position - b.position);
      const firstStage = pipelineStages[0] || null;
      const stage_id   = firstStage?.id   || null;
      const pipeline_stage = firstStage?.name || 'Prospect';

      // 3. Seed lead score
      const lead_score = calculateLeadScore({ ...prospectData, pipeline_stage }, []);

      // 4. Create prospect
      const saved = await createProspect({
        ...prospectData,
        pipeline_id,
        stage_id,
        pipeline_stage,
        lead_score,
        status: 'active',
      });

      created.push({ ...saved, _assignment: assignment });
    } catch (err) {
      console.warn('[DiscoveryEngine] Failed to import', item.company_name, err.message);
    }
  }

  return created;
}
