-- =============================================================================
-- 20260317_default_pipeline_packs.sql
-- Polished default pipeline library:
--   - Venue Partnerships:          expanded stages + full 7-template pack
--   - Vendor Partnerships:         full 6-template pack
--   - Wedding Planner Partnerships: full 5-template pack
--   - Luxury Brand Partnerships:   new pipeline, 8 stages, 6-template pack
--   - Campaign presets:             4 ready-to-use draft campaigns
-- All INSERTs use ON CONFLICT so the file is safe to re-run.
-- =============================================================================


-- =============================================================================
-- PIPELINE 1: VENUE PARTNERSHIPS
-- Update description + add two new stages: Researching Venue, Editorial Preview
-- Rename Conversation -> Conversation Started
-- Resequence positions (11 stages total)
-- =============================================================================

UPDATE pipelines
SET description = 'Full lifecycle pipeline for signing luxury wedding venues as directory partners.',
    updated_at  = NOW()
WHERE id = 'a1000000-0000-0000-0000-000000000001';

-- Reorder existing stages to make room for the two new ones
UPDATE pipeline_stages SET position = 2  WHERE id = 'b1000000-0000-0000-0000-000000000002'; -- Cold Email Sent
UPDATE pipeline_stages SET position = 3  WHERE id = 'b1000000-0000-0000-0000-000000000003'; -- Follow Up
UPDATE pipeline_stages SET position = 4, name = 'Conversation Started'
                                         WHERE id = 'b1000000-0000-0000-0000-000000000004'; -- was Conversation
UPDATE pipeline_stages SET position = 5  WHERE id = 'b1000000-0000-0000-0000-000000000005'; -- Meeting Booked
UPDATE pipeline_stages SET position = 7  WHERE id = 'b1000000-0000-0000-0000-000000000006'; -- Proposal Sent
UPDATE pipeline_stages SET position = 8  WHERE id = 'b1000000-0000-0000-0000-000000000007'; -- Negotiation
UPDATE pipeline_stages SET position = 9, closed_won_actions = '["activate_profile","send_welcome_email","add_to_newsletter","create_onboarding_checklist"]'
                                         WHERE id = 'b1000000-0000-0000-0000-000000000008'; -- Closed Won
UPDATE pipeline_stages SET position = 10 WHERE id = 'b1000000-0000-0000-0000-000000000009'; -- Closed Lost

-- Insert the two new stages (safe to re-run)
INSERT INTO pipeline_stages (id, pipeline_id, name, color, position, is_won, is_lost, auto_follow_up_days, closed_won_actions) VALUES
  ('b1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000001', 'Researching Venue',  '#a07830', 1, false, false, null, '[]'),
  ('b1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000001', 'Editorial Preview',  '#8a6a9a', 6, false, false, null, '[]')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- PIPELINE 2: VENDOR PARTNERSHIPS  (stages already correct, update descriptions)
-- =============================================================================

UPDATE pipelines
SET description = 'Pipeline for onboarding premium wedding suppliers: florists, photographers, caterers, stylists.',
    updated_at  = NOW()
WHERE id = 'a1000000-0000-0000-0000-000000000002';

-- Rename Conversation -> Conversation Started for consistency
UPDATE pipeline_stages SET name = 'Conversation Started'
WHERE id = 'b2000000-0000-0000-0000-000000000004';


-- =============================================================================
-- PIPELINE 3: WEDDING PLANNER PARTNERSHIPS  (stages already correct)
-- =============================================================================

UPDATE pipelines
SET description = 'Pipeline for recruiting top wedding planners and planning studios as editorial collaborators.',
    updated_at  = NOW()
WHERE id = 'a1000000-0000-0000-0000-000000000003';


-- =============================================================================
-- PIPELINE 4: LUXURY BRAND PARTNERSHIPS  (brand new)
-- Stages: Prospect, Intro Sent, Conversation Started, Opportunity Review,
--         Proposal Sent, Negotiation, Closed Won, Closed Lost
-- =============================================================================

INSERT INTO pipelines (id, name, partner_type, description, color, is_default, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000004',
   'Luxury Brand Partnerships',
   'custom',
   'Pipeline for high-value brand partnerships: luxury fashion, jewellery, travel, hospitality, and lifestyle brands.',
   '#6b4c8a',
   false,
   3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO pipeline_stages (id, pipeline_id, name, color, position, is_won, is_lost, auto_follow_up_days, closed_won_actions) VALUES
  ('b4000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 'Prospect',            '#94a3b8', 0, false, false, null, '[]'),
  ('b4000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004', 'Intro Sent',          '#f59e0b', 1, false, false, 5,    '[]'),
  ('b4000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000004', 'Conversation Started','#8b5cf6', 2, false, false, null, '[]'),
  ('b4000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'Opportunity Review',  '#06b6d4', 3, false, false, 7,    '[]'),
  ('b4000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000004', 'Proposal Sent',       '#3b82f6', 4, false, false, 5,    '[]'),
  ('b4000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000004', 'Negotiation',         '#ec4899', 5, false, false, 3,    '[]'),
  ('b4000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000004', 'Closed Won',          '#22c55e', 6, true,  false, null, '["activate_profile","send_welcome_email","add_to_newsletter","create_onboarding_checklist"]'),
  ('b4000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000004', 'Closed Lost',         '#ef4444', 7, false, true,  null, '[]')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- EMAIL TEMPLATES
-- c1xxxxxx = Venue Partnerships
-- c2xxxxxx = Vendor Partnerships
-- c3xxxxxx = Wedding Planner Partnerships
-- c4xxxxxx = Luxury Brand Partnerships
-- =============================================================================

-- ----------------------------------------------------------------
-- VENUE PARTNERSHIPS: 7 templates
-- Existing: c1000000-...-000001 to 000005 (cold, fu1, fu2, proposal, welcome)
-- New:      c1000000-...-000006 (editorial preview), 000007 (negotiation nudge)
-- ----------------------------------------------------------------

-- Upgrade the existing cold email with a richer body
UPDATE pipeline_email_templates
SET subject = 'A partnership opportunity for {{company_name}}',
    body = 'Hi {{contact_name}},

I came across {{company_name}} recently and was genuinely struck by what you have built. The quality of the space and the attention to detail throughout is exactly the standard our couples are searching for.

I am reaching out because Luxury Wedding Directory is expanding its curated collection, and {{company_name}} would be an exceptional addition.

We connect high-net-worth couples planning luxury weddings with the finest venues in the UK and Europe. Our audience includes couples with budgets starting at £50,000, and our editorial style means listings read more like a magazine feature than a standard directory entry.

Would you be open to a short call this week to see whether there is a fit? I can talk you through the platform, how venues perform on it, and what we would put together for {{company_name}}.

Warm regards,
{{sender_name}}
Luxury Wedding Directory',
    updated_at = NOW()
WHERE id = 'c1000000-0000-0000-0000-000000000001';

-- Upgrade Follow Up 1
UPDATE pipeline_email_templates
SET subject = 'Following up - {{company_name}} and Luxury Wedding Directory',
    body = 'Hi {{contact_name}},

I wanted to follow up on my previous message about a potential partnership with Luxury Wedding Directory.

I know how busy venue teams are, so I will keep this brief. We currently feature some of the most sought-after venues in the UK, and we drive qualified enquiries from couples who are actively planning and ready to book.

A few things that tend to resonate with venue teams:

- No commission on bookings, ever
- Full editorial-style profile with gallery, story, and key stats
- Ongoing feature opportunities in our newsletter and magazine content
- A dedicated listing dashboard with enquiry tracking

If a short call works, I am flexible this week. Happy to work around you.

Best,
{{sender_name}}',
    updated_at = NOW()
WHERE id = 'c1000000-0000-0000-0000-000000000002';

-- Upgrade Follow Up 2
UPDATE pipeline_email_templates
SET subject = 'One last note, {{contact_name}}',
    body = 'Hi {{contact_name}},

I do not want to clutter your inbox, so this will be my last message on this for now.

If the timing is not right, I completely understand. The directory is growing steadily and I would love to have {{company_name}} in the collection when the moment makes sense.

If you do have 10 minutes this week, I am confident I can show you why venues of your calibre consistently perform well with us. But no pressure at all.

Either way, I wish you a wonderful season ahead.

Best wishes,
{{sender_name}}
Luxury Wedding Directory',
    updated_at = NOW()
WHERE id = 'c1000000-0000-0000-0000-000000000003';

-- Upgrade Proposal
UPDATE pipeline_email_templates
SET subject = 'Your partnership proposal - Luxury Wedding Directory x {{company_name}}',
    body = 'Hi {{contact_name}},

It was a genuine pleasure speaking with you. As promised, here is the partnership proposal for {{company_name}}.

What is included in your listing:

- Premium editorial profile with full photo gallery and venue story
- Priority placement in venue search results
- Dedicated feature in our weekly newsletter (sent to 15,000+ subscribers)
- Editorial feature opportunities in Luxury Wedding Directory Magazine
- Enquiry management dashboard with analytics
- Monthly performance report
- Dedicated account manager

Investment: from £{{proposal_value}} per year. No commission. No setup fees.

The full proposal document is attached. I am happy to walk you through it on a call, answer any questions, or adjust the package to suit {{company_name}} specifically.

Looking forward to welcoming you to the directory.

Best regards,
{{sender_name}}
Luxury Wedding Directory',
    updated_at = NOW()
WHERE id = 'c1000000-0000-0000-0000-000000000004';

-- Upgrade Welcome Email
UPDATE pipeline_email_templates
SET subject = 'Welcome to Luxury Wedding Directory - your next steps, {{contact_name}}',
    body = 'Hi {{contact_name}},

On behalf of the whole team, welcome to Luxury Wedding Directory. We are genuinely delighted to have {{company_name}} as part of our curated collection.

Here is what happens next:

1. Onboarding call: Our team will be in touch within 24 hours to schedule your onboarding session
2. Profile build: We will walk you through the dashboard and begin building your listing together
3. Content review: We will work with you on photography, venue story, and key details
4. Go live: Your profile will be published within 5 working days of completing onboarding

Your listing dashboard is being prepared now. You will receive your login details in a separate email shortly.

In the meantime, if there is anything at all you need, please reply here and someone on the team will come back to you the same day.

We look forward to introducing {{company_name}} to couples who will love it.

With warm regards,
{{sender_name}}
Luxury Wedding Directory',
    updated_at = NOW()
WHERE id = 'c1000000-0000-0000-0000-000000000005';

-- NEW: Editorial Preview template
INSERT INTO pipeline_email_templates (id, pipeline_id, stage_id, name, email_type, subject, body) VALUES
  (
    'c1000000-0000-0000-0000-000000000006',
    'a1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000011',
    'Venue Editorial Preview Pitch',
    'custom',
    'An exclusive editorial feature for {{company_name}}',
    'Hi {{contact_name}},

As part of our editorial calendar for this season, we are putting together a curated feature on exceptional venues - and {{company_name}} is exactly the kind of property we want to include.

The feature would run across our magazine, newsletter, and social channels, and is designed to read more like a high-end editorial spread than a standard listing. Think Conde Nast Traveller meets venue discovery.

What it involves:

- A full editorial profile written by our team
- 6 to 8 hero images (we can work with existing photography)
- An interview-style Q&A with your team or venue director
- Distribution to our full audience of luxury wedding couples and planners

There is no cost to participate. This is an editorial decision, not an advertising placement.

I would love to talk you through the format. Would a call this week work?

Best,
{{sender_name}}
Luxury Wedding Directory'
  )
ON CONFLICT (id) DO NOTHING;

-- NEW: Negotiation nudge template
INSERT INTO pipeline_email_templates (id, pipeline_id, stage_id, name, email_type, subject, body) VALUES
  (
    'c1000000-0000-0000-0000-000000000007',
    'a1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000007',
    'Venue Negotiation Follow-up',
    'custom',
    'Finalising the details for {{company_name}}',
    'Hi {{contact_name}},

I wanted to check in as we get close to finalising the partnership details for {{company_name}}.

If there are any remaining questions about the package, the terms, or anything specific you would like adjusted, I am very happy to talk through it. Partnerships like this work best when they feel right for both sides, so please do not hesitate to raise anything.

If it is helpful, I can also put you in touch with another venue on the platform so you can hear directly from them about their experience.

Let me know the best way to move things forward from here.

Best regards,
{{sender_name}}
Luxury Wedding Directory'
  )
ON CONFLICT (id) DO NOTHING;

-- Wire new stage template references
UPDATE pipeline_stages SET email_template_id = 'c1000000-0000-0000-0000-000000000006'
WHERE id = 'b1000000-0000-0000-0000-000000000011';
UPDATE pipeline_stages SET email_template_id = 'c1000000-0000-0000-0000-000000000007'
WHERE id = 'b1000000-0000-0000-0000-000000000007';


-- ----------------------------------------------------------------
-- VENDOR PARTNERSHIPS: 6 templates
-- ----------------------------------------------------------------

INSERT INTO pipeline_email_templates (id, pipeline_id, stage_id, name, email_type, subject, body) VALUES
  (
    'c2000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    'b2000000-0000-0000-0000-000000000002',
    'Vendor Cold Outreach',
    'cold',
    'Showcasing {{company_name}} to luxury wedding couples',
    'Hi {{contact_name}},

I came across {{company_name}} and was impressed by the quality and style of your work. It is exactly the standard our couples are searching for.

I am {{sender_name}} from Luxury Wedding Directory, and I am reaching out because we are expanding our curated supplier collection. We connect high-end couples planning luxury weddings with the finest suppliers in the industry, and {{company_name}} would be a natural fit.

Our couples are actively planning and typically have significant budgets. They use the directory to discover and shortlist suppliers at the beginning of their planning journey - which means meaningful, qualified enquiries rather than tyre-kicking.

Would you be open to a quick call to explore whether there is a fit?

Warm regards,
{{sender_name}}
Luxury Wedding Directory'
  ),
  (
    'c2000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000002',
    'b2000000-0000-0000-0000-000000000003',
    'Vendor Follow Up 1',
    'follow_up_1',
    'Following up - Luxury Wedding Directory',
    'Hi {{contact_name}},

Just a quick follow-up on my previous message about featuring {{company_name}} on Luxury Wedding Directory.

I know how full supplier calendars are at this time of year, so I will keep it brief. We have found that suppliers in our collection typically see a meaningful uplift in enquiry quality once they are live - couples who have specifically sought out premium suppliers, not generic searches.

If a 15-minute call works this week, I would love to show you what we put together for suppliers like you.

Best,
{{sender_name}}'
  ),
  (
    'c2000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000002',
    'b2000000-0000-0000-0000-000000000003',
    'Vendor Follow Up 2',
    'follow_up_2',
    'Last note from Luxury Wedding Directory',
    'Hi {{contact_name}},

I will not fill your inbox any further after this, so I wanted to make one last note.

If the timing is not right for a partnership at the moment, I completely understand. When the season settles and you are ready to explore new visibility channels, I would love to pick up the conversation.

If there is any chance of a brief chat this week, I am confident I can show you how {{company_name}} would sit within our collection and the kind of couples who would find you.

Wishing you a brilliant season ahead.

Best,
{{sender_name}}
Luxury Wedding Directory'
  ),
  (
    'c2000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000002',
    'b2000000-0000-0000-0000-000000000005',
    'Vendor Information Pack',
    'custom',
    'Partnership information for {{company_name}} - Luxury Wedding Directory',
    'Hi {{contact_name}},

Thank you for your interest in Luxury Wedding Directory. As requested, here is an overview of what a supplier partnership looks like.

What is included:

- Full editorial-style supplier profile with gallery and portfolio
- Search placement across relevant wedding categories
- Feature opportunities in our editorial magazine and weekly newsletter
- Enquiry notifications directly to your preferred contact
- Performance dashboard showing views, saves, and enquiry volume

Our supplier partners are listed on an annual basis with no commission taken on any booking, ever. The focus is on visibility and connection, not a percentage of your revenue.

I have included a sample profile link so you can see the quality of presentation. Happy to tailor a package specifically for {{company_name}} and talk through any questions on a call.

Best regards,
{{sender_name}}'
  ),
  (
    'c2000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000002',
    'b2000000-0000-0000-0000-000000000006',
    'Vendor Partnership Proposal',
    'proposal',
    'Your partnership proposal - Luxury Wedding Directory x {{company_name}}',
    'Hi {{contact_name}},

It was great speaking with you. As agreed, here is the partnership proposal for {{company_name}}.

What is included in your listing:

- Premium editorial supplier profile with full portfolio gallery
- Placement in relevant wedding supplier categories
- Featured in our weekly newsletter (15,000+ subscribers)
- Seasonal editorial feature opportunities
- Enquiry management dashboard and monthly analytics
- Dedicated account manager

Investment: from £{{proposal_value}} per year. No commission on bookings.

I have attached the full proposal document. Happy to talk through any aspects, answer questions, or adjust the package. This is the starting point, not a fixed position.

Looking forward to welcoming {{company_name}} to the collection.

Best regards,
{{sender_name}}
Luxury Wedding Directory'
  ),
  (
    'c2000000-0000-0000-0000-000000000006',
    'a1000000-0000-0000-0000-000000000002',
    'b2000000-0000-0000-0000-000000000007',
    'Vendor Welcome Email',
    'welcome',
    'Welcome to Luxury Wedding Directory, {{company_name}}',
    'Hi {{contact_name}},

Welcome to Luxury Wedding Directory. We are thrilled to have {{company_name}} as part of our curated supplier collection.

Here is what happens next:

1. Our onboarding team will be in touch within 24 hours to begin your profile setup
2. You will receive login details for your supplier dashboard
3. We will work together to build out your profile, gallery, and story
4. Your listing will go live within 5 working days of completing onboarding

If you have existing photography, portfolio images, or press features you would like included, please feel free to send them across with your reply.

We look forward to introducing {{company_name}} to couples who are looking for exactly what you offer.

With warm regards,
{{sender_name}}
Luxury Wedding Directory'
  )
ON CONFLICT (id) DO NOTHING;

-- Wire vendor stage templates
UPDATE pipeline_stages SET email_template_id = 'c2000000-0000-0000-0000-000000000001' WHERE id = 'b2000000-0000-0000-0000-000000000002';
UPDATE pipeline_stages SET email_template_id = 'c2000000-0000-0000-0000-000000000002' WHERE id = 'b2000000-0000-0000-0000-000000000003';
UPDATE pipeline_stages SET email_template_id = 'c2000000-0000-0000-0000-000000000004' WHERE id = 'b2000000-0000-0000-0000-000000000005';
UPDATE pipeline_stages SET email_template_id = 'c2000000-0000-0000-0000-000000000005' WHERE id = 'b2000000-0000-0000-0000-000000000006';
UPDATE pipeline_stages SET email_template_id = 'c2000000-0000-0000-0000-000000000006' WHERE id = 'b2000000-0000-0000-0000-000000000007';


-- ----------------------------------------------------------------
-- WEDDING PLANNER PARTNERSHIPS: 5 templates
-- ----------------------------------------------------------------

INSERT INTO pipeline_email_templates (id, pipeline_id, stage_id, name, email_type, subject, body) VALUES
  (
    'c3000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000003',
    'b3000000-0000-0000-0000-000000000002',
    'Planner Cold Outreach',
    'cold',
    'Collaborating with {{company_name}} on Luxury Wedding Directory',
    'Hi {{contact_name}},

I have been following {{company_name}} and the quality of your work is exactly the standard we celebrate on Luxury Wedding Directory.

I am reaching out because we are building a curated network of the UK and Europe''s finest planning studios, and we would love to explore a collaboration with you.

What we offer planners is slightly different from a standard directory listing. We see planning studios as editorial partners, not just suppliers. That means features in our magazine content, inclusion in our planning guides, and access to our engaged audience of couples who are actively looking for expert planners to guide their wedding.

Would you be open to a short conversation this week to explore what that might look like for {{company_name}}?

Warm regards,
{{sender_name}}
Luxury Wedding Directory'
  ),
  (
    'c3000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000003',
    'b3000000-0000-0000-0000-000000000002',
    'Planner Follow Up 1',
    'follow_up_1',
    'Following up - Luxury Wedding Directory collaboration',
    'Hi {{contact_name}},

I wanted to follow up on my previous note about a potential collaboration between {{company_name}} and Luxury Wedding Directory.

Planning studios at your level tend to find that our platform works well for them because it attracts couples who are already committed to working with a planner. They come to us specifically looking for expert guidance, which means a different type of enquiry than most other platforms.

I would love to walk you through what we have in mind for {{company_name}} specifically. Would a 20-minute call work this week?

Best,
{{sender_name}}'
  ),
  (
    'c3000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000003',
    'b3000000-0000-0000-0000-000000000004',
    'Planner Feature Discussion',
    'custom',
    'Editorial collaboration ideas for {{company_name}}',
    'Hi {{contact_name}},

It was great speaking with you. Following our conversation, I wanted to share a few ideas for how {{company_name}} could be featured within our editorial content.

Options we are considering:

- A "Meet the Planner" profile piece for our magazine and newsletter
- A "How to plan a luxury wedding in [location]" guide co-authored with your team
- Real wedding features using weddings you have planned (with couple consent)
- Inclusion in our seasonal planning guides sent to actively planning couples

All of these are editorial placements - not advertising - which means they carry the credibility of genuine editorial coverage rather than a paid promotion.

I would love to hear which of these resonates most with you, and whether there is a wedding or story from {{company_name}} that would be a natural fit.

Looking forward to the conversation.

Best,
{{sender_name}}'
  ),
  (
    'c3000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000003',
    'b3000000-0000-0000-0000-000000000005',
    'Planner Collaboration Proposal',
    'proposal',
    'Collaboration proposal - {{company_name}} x Luxury Wedding Directory',
    'Hi {{contact_name}},

Thank you for the conversation. Here is the collaboration proposal for {{company_name}} as discussed.

What the partnership includes:

- A full editorial profile on Luxury Wedding Directory (styled, not templated)
- Inclusion in our curated planner guides distributed to actively planning couples
- A featured "Meet the Planner" piece in our magazine and newsletter
- Access to the planner dashboard for enquiry management and analytics
- Invitation to contribute to seasonal editorial content

Annual investment from £{{proposal_value}}. No commission on any client engagement.

The focus is entirely on your profile, your work, and your voice. We want the couples who find {{company_name}} through us to already feel connected to your approach before they even make contact.

Happy to talk through any details or customise the package further.

Best regards,
{{sender_name}}
Luxury Wedding Directory'
  ),
  (
    'c3000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000003',
    'b3000000-0000-0000-0000-000000000006',
    'Planner Welcome Email',
    'welcome',
    'Welcome to Luxury Wedding Directory, {{contact_name}}',
    'Hi {{contact_name}},

Welcome to Luxury Wedding Directory. We are genuinely delighted to have {{company_name}} as part of our planner network.

Here is what happens next:

1. Your profile setup: Our team will be in touch within 24 hours to begin building your editorial profile
2. Content gathering: We will ask for your studio story, a selection of images, and any weddings you would like to feature
3. Editorial review: Our editorial team reviews and signs off the profile before it goes live
4. Live launch: Your profile will be published within 7 working days, with a newsletter mention on launch week

We will also reach out separately to discuss your first editorial feature opportunity.

If there is anything you need in the meantime, please reply here and we will come back to you the same day.

With warm regards,
{{sender_name}}
Luxury Wedding Directory'
  )
ON CONFLICT (id) DO NOTHING;

-- Wire planner stage templates
UPDATE pipeline_stages SET email_template_id = 'c3000000-0000-0000-0000-000000000001' WHERE id = 'b3000000-0000-0000-0000-000000000002';
UPDATE pipeline_stages SET email_template_id = 'c3000000-0000-0000-0000-000000000003' WHERE id = 'b3000000-0000-0000-0000-000000000004';
UPDATE pipeline_stages SET email_template_id = 'c3000000-0000-0000-0000-000000000004' WHERE id = 'b3000000-0000-0000-0000-000000000005';
UPDATE pipeline_stages SET email_template_id = 'c3000000-0000-0000-0000-000000000005' WHERE id = 'b3000000-0000-0000-0000-000000000006';


-- ----------------------------------------------------------------
-- LUXURY BRAND PARTNERSHIPS: 6 templates
-- ----------------------------------------------------------------

INSERT INTO pipeline_email_templates (id, pipeline_id, stage_id, name, email_type, subject, body) VALUES
  (
    'c4000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000004',
    'b4000000-0000-0000-0000-000000000002',
    'Brand Intro Email',
    'cold',
    'A partnership conversation - {{company_name}} and Luxury Wedding Directory',
    'Hi {{contact_name}},

I wanted to reach out about a partnership opportunity that I think could be genuinely interesting for {{company_name}}.

Luxury Wedding Directory sits at the intersection of luxury lifestyle and the wedding market. We serve an audience of high-net-worth couples planning significant weddings - people who are making substantial purchasing decisions across fashion, jewellery, travel, hospitality, and lifestyle in the months surrounding their wedding.

Our editorial approach puts brand partnerships in a context that feels considered and relevant, not transactional. Brands that appear in our content are positioned as the natural choice for couples at this stage of life, not as sponsors.

I would welcome the opportunity to share more about our audience and explore whether there is an alignment with {{company_name}}''s objectives this year.

Would a short call this week work for you?

Warm regards,
{{sender_name}}
Luxury Wedding Directory'
  ),
  (
    'c4000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000004',
    'b4000000-0000-0000-0000-000000000002',
    'Brand Follow Up',
    'follow_up_1',
    'Following up - Luxury Wedding Directory x {{company_name}}',
    'Hi {{contact_name}},

I wanted to follow up on my previous message about a potential partnership between {{company_name}} and Luxury Wedding Directory.

Our audience is a highly specific one: couples in the active planning phase, typically with household incomes placing them firmly in the luxury consumer bracket. They are engaged, emotionally invested, and making meaningful decisions across multiple spend categories simultaneously.

We are selective about the brands we feature, and {{company_name}} is a natural fit with the quality and positioning of our editorial content.

If a brief conversation works this week, I would love to outline what we have in mind.

Best,
{{sender_name}}'
  ),
  (
    'c4000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000004',
    'b4000000-0000-0000-0000-000000000004',
    'Brand Opportunity Review Brief',
    'custom',
    'Partnership brief for {{company_name}} - Luxury Wedding Directory',
    'Hi {{contact_name}},

Thank you for our conversation. As discussed, here is a brief overview of the partnership opportunity for {{company_name}}.

About our audience:

- Couples in the active wedding planning phase
- Average wedding budget: £75,000 to £250,000+
- High household income, luxury-oriented across lifestyle, travel, and fashion
- 62% are based in London and South East England; 28% are international (US, Middle East, Europe)
- Age range: 28 to 42, predominantly female primary planner

Partnership formats available:

- Editorial brand feature (magazine and newsletter)
- Sponsored content series tied to a theme (honeymoon travel, jewellery, fashion)
- Curated gift guide inclusion (seasonal)
- Exclusive reader offer or experience
- Event co-sponsorship at our partner venue events

I would love to understand which of these aligns best with {{company_name}}''s current marketing priorities. Happy to build a bespoke package around your objectives.

Best regards,
{{sender_name}}'
  ),
  (
    'c4000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000004',
    'b4000000-0000-0000-0000-000000000005',
    'Brand Partnership Proposal',
    'proposal',
    'Partnership proposal - Luxury Wedding Directory x {{company_name}}',
    'Hi {{contact_name}},

It has been a pleasure exploring this with you. Here is the formal partnership proposal for {{company_name}}.

Proposed partnership package:

- Lead editorial feature: A bespoke brand story placed within our magazine and distributed to our full newsletter audience
- Social content: Co-created content across our channels featuring {{company_name}}
- Reader experience: An exclusive offer or experience for Luxury Wedding Directory readers
- Analytics: Post-campaign reporting on reach, engagement, and enquiry volume

Investment: from £{{proposal_value}}. All deliverables and timelines are detailed in the attached document.

This is a starting point and I am happy to adapt the package to fit {{company_name}}''s objectives, budget, and timing.

If there are any questions or things you would like to discuss before moving forward, please do not hesitate to come back to me.

Best regards,
{{sender_name}}
Luxury Wedding Directory'
  ),
  (
    'c4000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000004',
    'b4000000-0000-0000-0000-000000000006',
    'Brand Negotiation Follow-up',
    'custom',
    'Finalising the partnership details, {{contact_name}}',
    'Hi {{contact_name}},

I wanted to check in as we work through the final details of the partnership for {{company_name}}.

If there are specific elements of the proposal you would like to adjust - scope, timing, format, or investment level - I am happy to work through those with you directly. Partnerships work best when both sides feel genuinely confident about what they are signing up to.

A few things I can flex on if it helps:

- Phased investment across two payment periods
- A pilot format at a reduced scope to establish the relationship
- Alternative activation formats if the ones proposed do not fit your current brief

Let me know what would be most helpful, and I will come back to you with options.

Best regards,
{{sender_name}}'
  ),
  (
    'c4000000-0000-0000-0000-000000000006',
    'a1000000-0000-0000-0000-000000000004',
    'b4000000-0000-0000-0000-000000000007',
    'Brand Welcome Email',
    'welcome',
    'Welcome to Luxury Wedding Directory - {{company_name}} partnership confirmed',
    'Hi {{contact_name}},

On behalf of the team at Luxury Wedding Directory, welcome. We are really pleased to have {{company_name}} as a brand partner.

Next steps from our side:

1. Your dedicated account contact will be in touch within 24 hours to begin the onboarding process
2. We will schedule a brief kick-off call to align on deliverables, timelines, and any brand guidelines we should have
3. Creative production will begin within one week of the kick-off
4. Your first piece of content will be scheduled and confirmed with you before publication

We want this partnership to work hard for {{company_name}}, and we will be proactive in sharing performance data and ideas as we go.

Thank you for choosing to work with us. We look forward to building something excellent together.

With warm regards,
{{sender_name}}
Luxury Wedding Directory'
  )
ON CONFLICT (id) DO NOTHING;

-- Wire luxury brand stage templates
UPDATE pipeline_stages SET email_template_id = 'c4000000-0000-0000-0000-000000000001' WHERE id = 'b4000000-0000-0000-0000-000000000002';
UPDATE pipeline_stages SET email_template_id = 'c4000000-0000-0000-0000-000000000003' WHERE id = 'b4000000-0000-0000-0000-000000000004';
UPDATE pipeline_stages SET email_template_id = 'c4000000-0000-0000-0000-000000000004' WHERE id = 'b4000000-0000-0000-0000-000000000005';
UPDATE pipeline_stages SET email_template_id = 'c4000000-0000-0000-0000-000000000005' WHERE id = 'b4000000-0000-0000-0000-000000000006';
UPDATE pipeline_stages SET email_template_id = 'c4000000-0000-0000-0000-000000000006' WHERE id = 'b4000000-0000-0000-0000-000000000007';


-- =============================================================================
-- CAMPAIGN PRESETS (4 ready-to-use draft campaigns)
-- status = 'draft' so they never auto-send; user hits Send when ready
-- =============================================================================

INSERT INTO prospect_campaigns (id, name, filters, subject, body, status, personalisation_mode) VALUES

  -- Campaign 1: Provence and South of France Venues
  (
    'e1000000-0000-0000-0000-000000000001',
    'Provence and Riviera Venue Recruitment',
    '{"pipeline_id": "a1000000-0000-0000-0000-000000000001", "venue_types": ["venue"], "statuses": ["active"]}',
    'Featuring the finest Provence venues on Luxury Wedding Directory',
    'Hi {{contact_name}},

I am reaching out because we are actively building out our Provence and French Riviera venue collection on Luxury Wedding Directory.

The demand from our audience for South of France weddings has grown significantly over the past two years. Couples planning destination weddings in the region consistently tell us they want a trusted, curated guide rather than sifting through dozens of options. {{company_name}} is exactly the kind of venue we want to present to them.

Our Provence collection features only a small number of properties, which means each venue receives genuine visibility and editorial attention rather than being lost in a crowd.

Would you be open to a short conversation about what a listing would look like for {{company_name}}?

Warm regards,
{{sender_name}}
Luxury Wedding Directory',
    'draft',
    'ai_assisted'
  ),

  -- Campaign 2: Lake Como and Italian Lakes Venues
  (
    'e1000000-0000-0000-0000-000000000002',
    'Lake Como and Italian Lakes Venue Recruitment',
    '{"pipeline_id": "a1000000-0000-0000-0000-000000000001", "venue_types": ["venue"], "statuses": ["active"]}',
    'Lake Como venues on Luxury Wedding Directory - an invitation',
    'Hi {{contact_name}},

I am writing to invite {{company_name}} to join our Lake Como and Italian Lakes collection on Luxury Wedding Directory.

Destination weddings in the Italian Lakes are among the most requested on our platform. Couples planning these weddings are typically working with significant budgets, and they rely on our curated directory to identify the very best venues before beginning their shortlist.

We keep our Italian Lakes collection deliberately selective. The goal is to offer couples a small number of exceptional properties they can trust, not an overwhelming list. {{company_name}} belongs in that collection.

I would love to tell you more about what the partnership looks like and what it would mean for your enquiry pipeline. Would a call this week work?

Best regards,
{{sender_name}}
Luxury Wedding Directory',
    'draft',
    'ai_assisted'
  ),

  -- Campaign 3: UK Luxury Hotel Outreach
  (
    'e1000000-0000-0000-0000-000000000003',
    'UK Luxury Hotel Outreach 2026',
    '{"pipeline_id": "a1000000-0000-0000-0000-000000000001", "venue_types": ["venue"], "statuses": ["active"]}',
    'Connecting luxury hotels with wedding couples - Luxury Wedding Directory',
    'Hi {{contact_name}},

I am reaching out about a partnership that I think could drive meaningful value for {{company_name}}''s wedding events business.

Luxury Wedding Directory is the destination for couples planning premium UK weddings. Our audience actively seeks hotel venues - particularly for exclusive-use buyouts, multi-day celebrations, and weddings combining accommodation with exceptional dining and settings.

We have seen strong performance from hotel properties on our platform, and we are focused on growing our UK hotel collection this year to meet that demand.

What we put together for hotel partners goes beyond a standard listing. It reads more like a hotel editorial feature - the kind of presentation that reflects the quality of your property and speaks to the couples who would genuinely love to celebrate there.

Would you be open to a short call to explore this?

Warm regards,
{{sender_name}}
Luxury Wedding Directory',
    'draft',
    'template'
  ),

  -- Campaign 4: UK Wedding Planner Collaboration
  (
    'e1000000-0000-0000-0000-000000000004',
    'UK Wedding Planner Collaboration 2026',
    '{"pipeline_id": "a1000000-0000-0000-0000-000000000003", "statuses": ["active"]}',
    'A collaboration opportunity for {{company_name}} - Luxury Wedding Directory',
    'Hi {{contact_name}},

I am reaching out because we are building out our planning studio network for 2026, and {{company_name}} is exactly the kind of studio we want to feature.

At Luxury Wedding Directory, we see planners differently from most platforms. Rather than listing you alongside hundreds of suppliers, we treat planning studios as editorial partners. That means features, guides, and real wedding content that puts your expertise and aesthetic front and centre.

The couples who use our platform are serious about their planning journey. Many have already committed to working with a planner and are using our editorial content to understand which studios align with their vision. Being present in that content matters.

I would love to explore what a collaboration with {{company_name}} could look like. Would a short call this week work?

Best,
{{sender_name}}
Luxury Wedding Directory',
    'draft',
    'ai_assisted'
  )

ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- Assignment rule: route luxury brand prospects to the new pipeline
-- =============================================================================

INSERT INTO pipeline_assignment_rules (pipeline_id, rule_field, rule_condition, rule_value, priority, is_active)
VALUES
  ('a1000000-0000-0000-0000-000000000004', 'venue_type', 'equals',   'brand',           95, true),
  ('a1000000-0000-0000-0000-000000000004', 'venue_type', 'contains', 'jewellery',        90, true),
  ('a1000000-0000-0000-0000-000000000004', 'venue_type', 'contains', 'jewelry',          90, true),
  ('a1000000-0000-0000-0000-000000000004', 'venue_type', 'contains', 'fashion',          90, true),
  ('a1000000-0000-0000-0000-000000000004', 'venue_type', 'contains', 'luxury brand',     90, true),
  ('a1000000-0000-0000-0000-000000000004', 'venue_type', 'contains', 'travel',           85, true),
  ('a1000000-0000-0000-0000-000000000004', 'venue_type', 'contains', 'hospitality brand',85, true),
  ('a1000000-0000-0000-0000-000000000004', 'notes',      'contains', 'luxury brand',     80, true),
  ('a1000000-0000-0000-0000-000000000004', 'notes',      'contains', 'brand partnership',80, true)
ON CONFLICT DO NOTHING;
