/**
 * seo-studio/ai.js — AI caller for SEO Studio
 */

import { supabase } from '../../../lib/supabaseClient';
import { SEO_SYSTEM } from '../../../lib/aiPrompts';

const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function callAI(feature, userPrompt) {
  const { data, error } = await supabase.functions.invoke('ai-generate', {
    body: { feature, systemPrompt: SEO_SYSTEM, userPrompt },
    headers: { Authorization: `Bearer ${ANON_KEY}` },
  });
  if (error) throw new Error(error.message || 'AI service error');
  if (!data || data.error) throw new Error(data?.error || 'AI service unavailable');
  return (data.text || '').trim();
}
