/**
 * pipelineAssignmentService.js
 *
 * Automatically assigns new prospects to the correct pipeline.
 *
 * Assignment order:
 *   1. Rule-based match  (instant, no AI cost)
 *   2. AI classification (if enabled and no rule matched)
 *   3. Configured fallback pipeline
 *
 * Rules are stored in `pipeline_assignment_rules` and evaluated by priority DESC.
 * Settings (AI toggle, fallback pipeline) live in `pipeline_assignment_settings`.
 */

import { supabase } from '../lib/supabaseClient';

// ── DB helpers ────────────────────────────────────────────────────────────────

export async function fetchAssignmentRules() {
  const { data, error } = await supabase
    .from('pipeline_assignment_rules')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchAssignmentSettings() {
  const { data, error } = await supabase
    .from('pipeline_assignment_settings')
    .select('*')
    .limit(1)
    .single();
  if (error) return { ai_fallback_enabled: true, fallback_pipeline_id: null };
  return data;
}

export async function saveAssignmentRule(rule) {
  if (rule.id) {
    const { data, error } = await supabase
      .from('pipeline_assignment_rules')
      .update({ ...rule, updated_at: new Date().toISOString() })
      .eq('id', rule.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase
    .from('pipeline_assignment_rules')
    .insert([rule])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAssignmentRule(id) {
  const { error } = await supabase
    .from('pipeline_assignment_rules')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function updateAssignmentSettings(fields) {
  const { data: existing } = await supabase
    .from('pipeline_assignment_settings')
    .select('id')
    .limit(1)
    .single();

  const payload = { ...fields, updated_at: new Date().toISOString() };

  if (existing?.id) {
    const { data, error } = await supabase
      .from('pipeline_assignment_settings')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('pipeline_assignment_settings')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Rule engine ───────────────────────────────────────────────────────────────

/**
 * Test a single condition. Exported so the Test tool can show which rule matched.
 */
export function testCondition(fieldValue, condition, ruleValue) {
  const haystack = (fieldValue || '').toLowerCase();
  const needle   = ruleValue.toLowerCase();
  switch (condition) {
    case 'contains':     return haystack.includes(needle);
    case 'equals':       return haystack === needle;
    case 'starts_with':  return haystack.startsWith(needle);
    case 'not_contains': return !haystack.includes(needle);
    default:             return false;
  }
}

/**
 * Evaluate sorted rules against a prospect. Returns pipeline_id of first match or null.
 * rules must be sorted by priority DESC (as fetchAssignmentRules() returns them).
 */
export function matchRules(prospectData, rules) {
  for (const rule of rules) {
    const fieldValue = prospectData[rule.rule_field];
    if (testCondition(fieldValue, rule.rule_condition, rule.rule_value)) {
      return rule.pipeline_id;
    }
  }
  return null;
}

// ── AI classification ─────────────────────────────────────────────────────────

async function classifyWithAI(prospectData) {
  const systemPrompt = `You are a classification assistant for Luxury Wedding Directory.
Classify wedding industry businesses into exactly one of three categories.

venue: Any physical location that hosts weddings (hotel, castle, barn, estate, manor, country house, chateau, vineyard, resort, garden, private house, destination venue).
vendor: Any product or service supplier to a wedding (florist, photographer, videographer, caterer, cake maker, band, DJ, hair stylist, makeup artist, bridal boutique, jeweller, stationer, transport, chauffeur, entertainment).
planner: Any person or company that organises or coordinates weddings (wedding planner, coordinator, event stylist, event manager, wedding director).

Return ONLY valid JSON with no markdown or explanation: {"partner_type": "venue"}`;

  const lines = [`Company: ${prospectData.company_name || 'Unknown'}`];
  if (prospectData.venue_type)    lines.push(`Listed type: ${prospectData.venue_type}`);
  if (prospectData.website)       lines.push(`Website: ${prospectData.website}`);
  if (prospectData.source)        lines.push(`Source: ${prospectData.source}`);
  if (prospectData.notes)         lines.push(`Notes: ${prospectData.notes.slice(0, 300)}`);

  const userPrompt = `Classify this business:\n${lines.join('\n')}\n\nReturn only JSON.`;

  try {
    const { data, error } = await supabase.functions.invoke('ai-generate', {
      body: { feature: 'pipeline_classify', systemPrompt, userPrompt },
    });
    if (error || !data?.text) return null;
    const cleaned = data.text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    const parsed  = JSON.parse(cleaned);
    return parsed.partner_type || null; // 'venue' | 'vendor' | 'planner'
  } catch {
    return null;
  }
}

// ── Main assignment function ───────────────────────────────────────────────────

/**
 * Determine which pipeline to assign a new prospect to.
 *
 * @param {object} prospectData  - Form data (company_name, venue_type, source, notes, website, email, country)
 * @param {object} options
 *   @param {Array}  options.rules     - Pre-loaded rules (avoids extra DB call)
 *   @param {object} options.settings  - Pre-loaded settings
 *   @param {Array}  options.pipelines - Pre-loaded pipelines list
 * @returns {Promise<{
 *   pipeline_id: string|null,
 *   method: 'rule'|'ai'|'fallback',
 *   confidence: 'high'|'medium'|'low',
 *   matchedRule?: object,
 *   aiPartnerType?: string
 * }>}
 */
export async function assignProspectPipeline(prospectData, options = {}) {
  const rules     = options.rules     || await fetchAssignmentRules();
  const settings  = options.settings  || await fetchAssignmentSettings();
  const pipelines = options.pipelines || [];

  // 1. Rule-based match (instant)
  const matchedPipelineId = matchRules(prospectData, rules);
  if (matchedPipelineId) {
    const matchedRule = rules.find(r => testCondition(prospectData[r.rule_field], r.rule_condition, r.rule_value));
    return { pipeline_id: matchedPipelineId, method: 'rule', confidence: 'high', matchedRule };
  }

  // 2. AI classification fallback
  if (settings.ai_fallback_enabled) {
    try {
      const partnerType = await classifyWithAI(prospectData);
      if (partnerType) {
        const match = pipelines.find(p => p.partner_type === partnerType && p.is_default)
                   || pipelines.find(p => p.partner_type === partnerType);
        if (match) {
          return { pipeline_id: match.id, method: 'ai', confidence: 'medium', aiPartnerType: partnerType };
        }
      }
    } catch (e) {
      console.warn('[pipelineAssignment] AI classification failed:', e.message);
    }
  }

  // 3. Configured fallback
  const fallbackId = settings.fallback_pipeline_id
    || pipelines.find(p => p.is_default)?.id
    || pipelines[0]?.id
    || null;

  return { pipeline_id: fallbackId, method: 'fallback', confidence: 'low' };
}

// ── Test tool ─────────────────────────────────────────────────────────────────

/**
 * Dry-run the full assignment logic and return a human-readable explanation.
 * Used by the "Test Assignment" panel in PipelineBuilderModule.
 */
export async function testAssignmentRules(prospectData, rules, settings, pipelines) {
  // Rule match
  const matchedPipelineId = matchRules(prospectData, rules);
  if (matchedPipelineId) {
    const pipe = pipelines.find(p => p.id === matchedPipelineId);
    const matchedRule = rules.find(r => testCondition(prospectData[r.rule_field], r.rule_condition, r.rule_value));
    return {
      assigned_pipeline: pipe?.name || 'Unknown pipeline',
      method:            'rule',
      confidence:        'high',
      explanation:       `Rule matched: ${matchedRule?.rule_field} ${matchedRule?.rule_condition} "${matchedRule?.rule_value}" (priority ${matchedRule?.priority})`,
    };
  }

  // AI fallback
  if (!settings.ai_fallback_enabled) {
    const fallback = pipelines.find(p => p.id === settings.fallback_pipeline_id)
                  || pipelines.find(p => p.is_default);
    return {
      assigned_pipeline: fallback?.name || 'None',
      method:            'fallback',
      confidence:        'low',
      explanation:       'No rules matched. AI fallback is disabled. Using default pipeline.',
    };
  }

  try {
    const partnerType = await classifyWithAI(prospectData);
    if (partnerType) {
      const match = pipelines.find(p => p.partner_type === partnerType && p.is_default)
                 || pipelines.find(p => p.partner_type === partnerType);
      return {
        assigned_pipeline: match?.name || 'Unknown pipeline',
        method:            'ai',
        confidence:        'medium',
        explanation:       `AI classified as: ${partnerType}`,
      };
    }
  } catch (e) {
    // fall through to fallback
  }

  const fallback = pipelines.find(p => p.id === settings.fallback_pipeline_id)
                || pipelines.find(p => p.is_default);
  return {
    assigned_pipeline: fallback?.name || 'None',
    method:            'fallback',
    confidence:        'low',
    explanation:       'No rules matched and AI returned no result. Using default pipeline.',
  };
}
