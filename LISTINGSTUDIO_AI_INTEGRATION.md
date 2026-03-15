# ListingStudio AI Integration Guide

## Overview

This guide shows how to wire up ListingStudio sections to use the AIContentGenerator component for AI-powered content generation.

## Architecture

```
ListingStudio Section
  ↓
AIContentGenerator (user clicks "Generate")
  ↓
/api/ai/generate (backend)
  ↓
Load AI provider from database
  ↓
Call OpenAI/Gemini/Claude (server-side only)
  ↓
Log usage to ai_usage_log
  ↓
Return generated content to AIContentGenerator
  ↓
User previews and clicks "Insert"
  ↓
Content inserted into form field
```

## Example: Adding AI to About Description

### Step 1: Import AIContentGenerator and Prompts

In any ListingStudio section component:

```javascript
import AIContentGenerator from '../../../components/AIAssistant/AIContentGenerator';
import { LUXURY_TONE_SYSTEM, buildAboutPrompt } from '../../../lib/aiPrompts';
```

### Step 2: Use FormData Directly (Single Source of Truth)

⚠️ **CRITICAL:** Do NOT create separate state like `const [aboutDescription, setState]` if the field already belongs to ListingStudio's shared `formData` state.

Using two sources of truth creates sync issues and bugs.

Instead, use the pattern:
- Read from: `formData.about_description`
- Update via: `onChange('about_description', value)`

### Step 3: Add AIContentGenerator to JSX

This is the production pattern - simple and safe:

```jsx
<div style={{ marginBottom: 20 }}>
  <label style={LABEL}>About Description</label>

  {/* AI Content Generator - Preview & Insert */}
  <div style={{ marginBottom: 16 }}>
    <AIContentGenerator
      feature="about_description"
      systemPrompt={LUXURY_TONE_SYSTEM}
      userPrompt={buildAboutPrompt(formData.venueName, formData)}
      venueId={listingId}
      onInsert={(text) => onChange('about_description', text)}
      label="Generate About"
    />
  </div>

  {/* Rich Text Editor - Manual Editing */}
  <RichTextEditor
    value={formData.about_description || ''}
    onChange={(html) => onChange('about_description', html)}
    placeholder="Enter about description or use AI to generate..."
    minHeight={200}
  />
</div>
```

### Step 4: Form Submission (No Changes Needed)

The form submission already handles all fields in formData, including AI-generated content:

```javascript
const handleSave = async () => {
  // All fields from formData are already there, including about_description
  await saveListing(formData);
};
```

## Available AI Features (Phase 1)

These can be added to any ListingStudio section:

| Feature | System Prompt | User Prompt Template |
|---------|---------------|---------------------|
| `about_description` | LUXURY_TONE_SYSTEM | Generate editorial description |
| `seo_title` | SEO_SYSTEM | Generate SEO-optimized title (50-60 chars) |
| `seo_description` | SEO_SYSTEM | Generate meta description (150-160 chars) |
| `seo_keywords` | SEO_SYSTEM | Generate 5-8 keywords (comma-separated) |
| `image_alt_text` | ALT_TEXT_SYSTEM | Generate accessible alt text for image |
| `faq` | FAQ_SYSTEM | Generate 5-8 FAQ questions and answers |

## Reusable System Prompts

✅ **DO:** Centralize all prompts in `src/lib/aiPrompts.js`

❌ **DO NOT:** Duplicate prompt text across section components

Create a single source of truth:

```javascript
// src/lib/aiPrompts.js

export const LUXURY_TONE_SYSTEM = `You are a luxury wedding magazine editor (Vogue, Condé Nast Traveller, Tatler).

Write elegant, editorial prose that feels like a private magazine feature.
- Avoid generic marketing language and clichés
- Use only information provided - never invent facts
- Write in flowing paragraphs, not bullet points
- Emphasize exclusivity, craftsmanship, and timeless elegance
- Maintain a sophisticated yet warm tone
- Focus on experience and emotion, not just features`;

export const SEO_SYSTEM = `You are an SEO-focused luxury copywriter.

Generate precise, keyword-rich copy that maintains luxury tone.
- Be concise but descriptive
- Include relevant keywords naturally
- Never use clichés or overused travel/wedding phrases
- Focus on unique selling points`;

export const ALT_TEXT_SYSTEM = `You are an accessibility expert and SEO copywriter.

Write concise, descriptive alt text that:
- Describes what's visible in the image
- Includes relevant keywords naturally
- Is clear for screen reader users
- Is under 125 characters when possible`;

export const FAQ_SYSTEM = `You are a luxury customer experience expert.

Generate FAQ questions and answers that:
- Anticipate common customer concerns
- Provide valuable, specific information
- Maintain sophisticated tone
- Are concise but complete`;

// Prompt builders
export const buildAboutPrompt = (venueName, venueData) => {
  return `Generate a luxury editorial description for ${venueName}.

Context:
- Location: ${venueData.location || '(not provided)'}
- Style: ${venueData.style || '(not provided)'}
- Key Features: ${venueData.highlights?.join(', ') || '(not provided)'}

Write 2-3 paragraphs that capture the venue's essence for luxury couples.`;
};

export const buildSeoTitlePrompt = (venueName, venueData) => {
  return `Generate a concise SEO title for ${venueName} (50-60 characters).
Focus on luxury positioning and destination.`;
};

export const buildAltTextPrompt = (imageName, venueContext) => {
  return `Generate alt text for an image titled "${imageName}"
of ${venueContext || 'a luxury wedding venue'} (max 125 chars).`;
};

export const buildFaqPrompt = (venueName, venueData) => {
  return `Generate 5-8 FAQ questions and answers for ${venueName}.
Address common questions luxury couples ask about:
${venueData.capacity ? '- Capacity and guest limits' : ''}
${venueData.catering ? '- Catering options and menus' : ''}
${venueData.accommodations ? '- Accommodations and guest rooms' : ''}
- Ceremony and reception setup
- Timeline and scheduling
- Availability and booking`;
};
```

Then import and use in any section:

```javascript
import { LUXURY_TONE_SYSTEM, buildAboutPrompt } from '../../../lib/aiPrompts';

// In your section component:
<AIContentGenerator
  feature="about_description"
  systemPrompt={LUXURY_TONE_SYSTEM}
  userPrompt={buildAboutPrompt(formData.venueName, formData)}
  venueId={listingId}
  onInsert={(text) => onChange('about_description', text)}
  label="Generate About"
/>
```

✅ **Benefits of centralization:**
- Consistent tone across all venues
- Easy to update all prompts at once
- Single source of truth for prompt drift prevention
- Reusable across different sections

## Security Considerations

✅ **Safe Architecture:**
- Frontend calls `/api/ai/generate` with feature request (systemPrompt, userPrompt, etc.)
- Backend loads **active provider** from `ai_settings` table (NOT from frontend)
- Backend reads real API key from database (server-side only)
- Backend calls OpenAI/Gemini/Claude
- Response sent to frontend (text, provider, tokens, cost)
- **NO API KEY exposed in any request or response**

❌ **Unsafe (DON'T DO THIS):**
- Storing API key in frontend code
- Passing real API key in fetch requests
- Calling OpenAI/Gemini/Claude directly from frontend
- Exposing API key in network requests
- Letting frontend choose which provider to use

✅ **Phase 1 Rule:**
The frontend does NOT choose the provider. `/api/ai/generate` always uses the single active provider configured in Admin Settings. This keeps the system simple and secure.

## Testing the Flow

### Prerequisites
- Backend `/api/admin/ai-settings` and `/api/ai/generate` endpoints deployed
- Database `ai_settings` and `ai_usage_log` tables created
- Admin can access "AI Settings" module in Admin Dashboard

### Step 1: Set Up AI Provider in Admin
1. Go to Admin Dashboard → AI Settings
2. Select ChatGPT (or Gemini/Claude)
3. Paste OpenAI API key (or provider key)
4. Select model (e.g., gpt-4.1)
5. Click "Save Settings"
6. Verify success message shows masked key (e.g., "sk-****-9x2K")

### Step 2: Test in ListingStudio
1. Go to ListingStudio (create or edit a listing)
2. Find a section with AI generation (e.g., About Description)
3. Click "Generate About" button
4. Wait for generation (5-15 seconds depending on provider)
5. Preview the generated suggestion in the modal
6. Click "Insert" to add content to field, or "Reject" to dismiss
7. Verify content appears in the field
8. Save the listing normally

### Step 3: Verify Security in Browser

**Critical:** No API key should ever appear in network traffic.

1. Open Developer Tools (F12)
2. Go to "Network" tab
3. Filter by "ai" requests
4. Look for `/api/ai/generate` request
5. Click on the request, check "Request" tab:
   - Should contain: `{ feature, systemPrompt, userPrompt, venue_id }`
   - Should NOT contain: `api_key` or any secret
6. Click on the response tab:
   - Should contain: `{ text, provider, model, tokens_used, estimated_cost }`
   - Should NOT contain: `api_key` or any secret
7. ✅ If no api_key appears, security is correct

## Error Handling

The AIContentGenerator handles common errors:

```
- No AI provider configured → "No active AI provider configured"
- API key invalid → "OpenAI API error: Invalid API key"
- Timeout → "Request timeout"
- Network error → "Failed to generate content"
- Rate limited → "Rate limited by OpenAI"
```

If generation fails, the user can:
- Click "Generate" again (retry)
- Write content manually
- Try a different provider in Admin Settings

## Performance Notes

- Generation typically takes 5-15 seconds
- Request timeout set to 30 seconds on backend
- Rate limiting: 100 requests/minute per provider
- Token usage tracked in `ai_usage_log` table

## Cost Estimation

Estimated cost is returned by the backend after each generation. The backend calculates this based on:
- Actual tokens consumed by the provider
- Provider's current pricing (updated periodically)
- Model used (gpt-4.1, gemini-pro, claude-3-opus, etc.)

**Display cost from backend response:**
```javascript
<strong>Cost:</strong> ${Number(suggestion.cost || 0).toFixed(4)}
```

Admin can view total costs in AI Settings usage dashboard for budget tracking and provider comparison.

## Implementation Sequence

1. ✅ Create `AI_SETTINGS_SETUP.sql` and apply database migration
2. ✅ Deploy `/api/admin/ai-settings` and `/api/ai/generate` endpoints
3. ✅ Create `AISettingsPage.jsx` and add to Admin Dashboard
4. ✅ Create `AIContentGenerator.jsx` reusable component
5. ✅ Create `src/lib/aiPrompts.js` with centralized prompts
6. ➜ Add AIContentGenerator to ONE ListingStudio section first (e.g., ListingInfoSection)
7. ➜ Test end-to-end with real venue data
8. ➜ Gradually roll out to other sections (BasicDetailsSection, SEOSection, etc.)
9. ➜ Monitor `ai_usage_log` for errors and performance

## Production Readiness Checklist

Before launching AI features to live:

- [ ] Backend endpoints (`/api/admin/ai-settings`, `/api/ai/generate`) deployed
- [ ] Database tables created (`ai_settings`, `ai_usage_log`)
- [ ] RLS policies enabled and verified (admin-only access)
- [ ] Admin can set API key in AI Settings without errors
- [ ] Test venue can generate AI content in ListingStudio
- [ ] Generated content is saved to listing correctly
- [ ] Usage log records all requests with correct timestamps
- [ ] Error handling graceful (bad API key, timeout, etc.)
- [ ] **Browser security verified:** No api_key in network tab
- [ ] Multiple generation retries work smoothly
- [ ] Cost estimation displays correctly (matches backend calculation)
- [ ] Prompts are centralized in `src/lib/aiPrompts.js`
- [ ] formData state used (no local state duplication)
- [ ] All section components use same prompt import pattern
