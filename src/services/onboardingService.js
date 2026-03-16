/**
 * onboardingService.js
 *
 * Vendor onboarding checklist management.
 * Created automatically when a prospect reaches a Closed Won stage.
 * Admin-managed: the sales team checks off items as they onboard the venue.
 *
 * On 100% completion:
 *   - status -> 'complete'
 *   - Logs an activity note to outreach_emails
 *   - Returns onboardingComplete: true so caller can prompt to publish listing
 */

import { supabase } from '../lib/supabaseClient';

// ── Default checklist ─────────────────────────────────────────────────────────

export const DEFAULT_CHECKLIST = [
  { id: 'photo',        label: 'Profile photo uploaded',          completed: false, completed_at: null },
  { id: 'description',  label: 'Venue description written',       completed: false, completed_at: null },
  { id: 'pricing',      label: 'Pricing tiers added',             completed: false, completed_at: null },
  { id: 'packages',     label: 'Package details complete',        completed: false, completed_at: null },
  { id: 'gallery',      label: 'Minimum 10 gallery images',       completed: false, completed_at: null },
  { id: 'logo',         label: 'Logo uploaded',                   completed: false, completed_at: null },
  { id: 'social',       label: 'Social media links added',        completed: false, completed_at: null },
  { id: 'category',     label: 'Listing category confirmed',      completed: false, completed_at: null },
  { id: 'contact',      label: 'Contact details verified',        completed: false, completed_at: null },
  { id: 'availability', label: 'First availability block added',  completed: false, completed_at: null },
  { id: 'welcome',      label: 'Welcome email sent to contact',   completed: false, completed_at: null },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Compute progress from a checklist_items array.
 * @param {Array} items
 * @returns {{ total: number, completed: number, percentage: number }}
 */
export function getOnboardingProgress(items = []) {
  const total     = items.length;
  const completed = items.filter(i => i.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percentage };
}

// ── DB operations ─────────────────────────────────────────────────────────────

/**
 * Fetch the onboarding task for a prospect.
 * Returns null if none exists yet.
 */
export async function fetchOnboardingTask(prospectId) {
  const { data, error } = await supabase
    .from('prospect_onboarding_tasks')
    .select('*')
    .eq('prospect_id', prospectId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

/**
 * Create a new onboarding task with the default 11-item checklist.
 * Safe to call multiple times - UNIQUE constraint on prospect_id means only one row per prospect.
 */
export async function createOnboardingTask(prospectId) {
  const { data, error } = await supabase
    .from('prospect_onboarding_tasks')
    .insert([{
      prospect_id:     prospectId,
      checklist_items: DEFAULT_CHECKLIST,
      status:          'in_progress',
      created_at:      new Date().toISOString(),
      updated_at:      new Date().toISOString(),
    }])
    .select()
    .single();

  // If already exists (UNIQUE constraint), fetch and return the existing row
  if (error?.code === '23505') {
    return fetchOnboardingTask(prospectId);
  }
  if (error) throw error;
  return data;
}

/**
 * Toggle a checklist item on/off.
 * Automatically sets status to 'complete' when all items are done.
 * Logs an activity note when onboarding completes.
 *
 * @param {string} taskId
 * @param {string} itemId  - checklist item id (e.g. 'photo', 'logo')
 * @returns {Promise<{ task: object, onboardingComplete: boolean }>}
 */
export async function toggleOnboardingItem(taskId, itemId) {
  // 1. Fetch current state
  const { data: task, error: fetchErr } = await supabase
    .from('prospect_onboarding_tasks')
    .select('*')
    .eq('id', taskId)
    .single();
  if (fetchErr) throw fetchErr;

  // 2. Toggle the item
  const items = (task.checklist_items || []).map(item => {
    if (item.id !== itemId) return item;
    const nowDone = !item.completed;
    return {
      ...item,
      completed:    nowDone,
      completed_at: nowDone ? new Date().toISOString() : null,
    };
  });

  // 3. Determine new status
  const allDone           = items.every(i => i.completed);
  const newStatus         = allDone ? 'complete' : 'in_progress';
  const onboardingComplete = allDone && task.status !== 'complete';

  // 4. Save
  const { data: updated, error: updateErr } = await supabase
    .from('prospect_onboarding_tasks')
    .update({
      checklist_items: items,
      status:          newStatus,
      updated_at:      new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();
  if (updateErr) throw updateErr;

  // 5. Log activity note when onboarding first completes
  if (onboardingComplete && task.prospect_id) {
    await supabase.from('outreach_emails').insert([{
      prospect_id: task.prospect_id,
      email_type:  'custom',
      subject:     'Onboarding complete',
      body:        'All onboarding checklist items completed. Venue profile is ready to publish.',
      status:      'sent',
      sent_at:     new Date().toISOString(),
    }]).catch(() => {}); // Non-fatal
  }

  return { task: updated, onboardingComplete };
}
