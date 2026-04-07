/**
 * ContentGuidelinesEditor.jsx
 *
 * Structured form for category content guidelines.
 * Converts human-friendly form inputs to/from JSON:
 *   {tone, formality, topics, rules, avoid}
 */

import { useState, useEffect } from 'react';
import { Field, Select, FU, S } from './StudioShared';

const TONE_OPTIONS = [
  { value: '', label: '— Select —' },
  { value: 'elegant', label: 'Elegant' },
  { value: 'bold', label: 'Bold' },
  { value: 'warm', label: 'Warm' },
  { value: 'analytical', label: 'Analytical' },
  { value: 'fashion-forward', label: 'Fashion Forward' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'conversational', label: 'Conversational' },
];

const FORMALITY_OPTIONS = [
  { value: '', label: '— Select —' },
  { value: 'high', label: 'High (formal, editorial)' },
  { value: 'medium', label: 'Medium (balanced)' },
  { value: 'relaxed', label: 'Relaxed (casual, approachable)' },
];

const TOPIC_OPTIONS = [
  'bridal', 'travel', 'beauty', 'style', 'planning',
  'culture', 'honeymoon', 'venue', 'fashion', 'luxury',
  'sustainability', 'wellness', 'real-weddings', 'trends',
];

const RULE_CHIPS = [
  'editorial first',
  'no salesy copy',
  'expert voice',
  'luxury focus',
  'short intros',
  'storytelling',
  'visual led',
  'data driven',
];

const AVOID_CHIPS = [
  'mass market language',
  'overly promotional copy',
  'generic advice',
  'trends without substance',
  'low end language',
  'clickbait',
  'jargon heavy',
];

export default function ContentGuidelinesEditor({ value = {}, onChange, isLight = false }) {
  const S_current = { ...S, ...(isLight ? {} : {}) };

  const [tone, setTone] = useState(value.tone || '');
  const [formality, setFormality] = useState(value.formality || '');
  const [topics, setTopics] = useState(value.topics || []);
  const [rules, setRules] = useState(value.rules || []);
  const [avoid, setAvoid] = useState(value.avoid || []);

  // Emit changes upward
  useEffect(() => {
    onChange({ tone, formality, topics, rules, avoid });
  }, [tone, formality, topics, rules, avoid]);

  const toggleTopic = (topic) => {
    setTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const toggleRule = (rule) => {
    setRules(prev =>
      prev.includes(rule) ? prev.filter(r => r !== rule) : [...prev, rule]
    );
  };

  const toggleAvoid = (item) => {
    setAvoid(prev =>
      prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Tone */}
      <Field label="Tone">
        <Select
          value={tone}
          onChange={e => setTone(e.target.value)}
          options={TONE_OPTIONS}
        />
        <div style={{ fontFamily: FU, fontSize: 10, color: S_current.muted, marginTop: 6 }}>
          How should articles in this category sound?
        </div>
      </Field>

      {/* Formality */}
      <Field label="Formality">
        <Select
          value={formality}
          onChange={e => setFormality(e.target.value)}
          options={FORMALITY_OPTIONS}
        />
      </Field>

      {/* Topics */}
      <Field label="Topics (select all that apply)">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {TOPIC_OPTIONS.map(topic => (
            <button
              key={topic}
              onClick={() => toggleTopic(topic)}
              style={{
                padding: '6px 12px', borderRadius: 16,
                fontFamily: FU, fontSize: 10, fontWeight: 500,
                border: topics.includes(topic) ? `2px solid ${S_current.gold}` : `1px solid ${S_current.border}`,
                background: topics.includes(topic) ? `${S_current.gold}15` : 'transparent',
                color: topics.includes(topic) ? S_current.gold : S_current.text,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {topic}
            </button>
          ))}
        </div>
      </Field>

      {/* Rules */}
      <Field label="Editorial Rules (select all that apply)">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {RULE_CHIPS.map(rule => (
            <button
              key={rule}
              onClick={() => toggleRule(rule)}
              style={{
                padding: '6px 12px', borderRadius: 16,
                fontFamily: FU, fontSize: 10, fontWeight: 500,
                border: rules.includes(rule) ? `2px solid ${S_current.gold}` : `1px solid ${S_current.border}`,
                background: rules.includes(rule) ? `${S_current.gold}15` : 'transparent',
                color: rules.includes(rule) ? S_current.gold : S_current.text,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {rule}
            </button>
          ))}
        </div>
      </Field>

      {/* Avoid */}
      <Field label="Avoid (select all that apply)">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {AVOID_CHIPS.map(item => (
            <button
              key={item}
              onClick={() => toggleAvoid(item)}
              style={{
                padding: '6px 12px', borderRadius: 16,
                fontFamily: FU, fontSize: 10, fontWeight: 500,
                border: avoid.includes(item) ? `2px solid ${S_current.gold}` : `1px solid ${S_current.border}`,
                background: avoid.includes(item) ? `${S_current.gold}15` : 'transparent',
                color: avoid.includes(item) ? S_current.gold : S_current.text,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}
