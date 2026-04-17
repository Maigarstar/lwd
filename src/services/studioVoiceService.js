// ─── studioVoiceService.js ────────────────────────────────────────────────────
// Persists the publication studio's editorial voice training data in localStorage
// so it survives sessions without needing a database column.
//
// Shape:
//   toneWords     string[]   e.g. ['Cinematic', 'Intimate', 'Specific']
//   avoidWords    string[]   e.g. ['amazing', 'stunning', 'perfect']
//   rules         string[]   e.g. ['Name specific flowers by variety', 'Use second person sparingly']
//   sampleCopy    string     A sample paragraph that exemplifies the voice
//   publication   string     Name of the publication (e.g. 'Luxury Wedding Directory')
//   updatedAt     number     timestamp

const KEY = 'lwd_studio_voice';

const DEFAULTS = {
  toneWords:   ['Luxury Editorial', 'Cinematic', 'Intimate', 'Specific'],
  avoidWords:  ['amazing', 'stunning', 'perfect', 'beautiful', 'incredible', 'wonderful', 'gorgeous', 'lovely'],
  rules:       [
    'Name specific architectural details, flowers, fabrics, and textures',
    'Use sensory language — sight, scent, sound, touch',
    'Avoid generic wedding clichés — write like Condé Nast Traveller',
    'Lead every section with a scene-setting sentence',
    'Every venue/vendor must be named and described with one unique distinguishing detail',
  ],
  sampleCopy:  '',
  publication: 'Luxury Wedding Directory',
  updatedAt:   0,
};

export function loadVoice() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveVoice(voice) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...voice, updatedAt: Date.now() }));
  } catch { /* storage full */ }
}

/**
 * Returns a formatted string block for injection into any AI system prompt.
 * If no voice is configured, returns an empty string.
 */
export function getVoiceInjection() {
  const v = loadVoice();
  const parts = [];

  parts.push(`PUBLICATION: ${v.publication || 'Luxury Wedding Directory'}`);

  if (v.toneWords?.length) {
    parts.push(`EDITORIAL TONE: ${v.toneWords.join(', ')}`);
  }

  if (v.rules?.length) {
    parts.push(`HOUSE WRITING RULES:\n${v.rules.map(r => `- ${r}`).join('\n')}`);
  }

  if (v.avoidWords?.length) {
    parts.push(`WORDS TO NEVER USE: ${v.avoidWords.join(', ')}`);
  }

  if (v.sampleCopy?.trim()) {
    parts.push(`VOICE REFERENCE — write in the same register as this sample:\n"${v.sampleCopy.trim().slice(0, 600)}"`);
  }

  return parts.join('\n\n');
}
