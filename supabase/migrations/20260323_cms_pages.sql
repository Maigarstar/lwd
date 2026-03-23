-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: CMS Pages System
-- Creates cms_pages and cms_page_versions tables for the admin content editor
-- Includes full seed content for all 5 legal/support pages
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Main pages table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cms_pages (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key         text        UNIQUE NOT NULL,
  page_type        text        DEFAULT 'legal'
                   CHECK (page_type IN ('legal', 'support', 'editorial', 'landing')),
  title            text        NOT NULL,
  slug             text        UNIQUE NOT NULL,
  seo_title        text,
  meta_description text,
  summary          text,
  content_html     text        DEFAULT '',
  published_html   text        DEFAULT '',
  status           text        DEFAULT 'draft'
                   CHECK (status IN ('draft', 'published')),
  last_updated     timestamptz DEFAULT now(),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- ── Version history table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cms_page_versions (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key      text        NOT NULL REFERENCES cms_pages(page_key) ON DELETE CASCADE,
  content_html  text        NOT NULL,
  title         text,
  version_label text,
  created_by    text        DEFAULT 'admin',
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cms_page_versions_key
  ON cms_page_versions(page_key, created_at DESC);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_page_versions ENABLE ROW LEVEL SECURITY;

-- Anon/public can read published pages only
DROP POLICY IF EXISTS "Public read published cms_pages" ON cms_pages;
CREATE POLICY "Public read published cms_pages" ON cms_pages
  FOR SELECT TO anon USING (status = 'published');

-- Admin full access (JWT is_admin claim OR service role)
DROP POLICY IF EXISTS "Admin full access cms_pages" ON cms_pages;
CREATE POLICY "Admin full access cms_pages" ON cms_pages
  FOR ALL USING (
    COALESCE((auth.jwt() ->> 'is_admin')::boolean, false) = true
    OR auth.role() = 'service_role'
  );

-- Admin full access on versions
DROP POLICY IF EXISTS "Admin full access cms_page_versions" ON cms_page_versions;
CREATE POLICY "Admin full access cms_page_versions" ON cms_page_versions
  FOR ALL USING (
    COALESCE((auth.jwt() ->> 'is_admin')::boolean, false) = true
    OR auth.role() = 'service_role'
  );

-- ── Seed Data ─────────────────────────────────────────────────────────────────
-- Company: 5 Star Weddings Ltd · 87 Serpentine Close, Stevenage, Hertfordshire SG1 6AR
-- Phone: +44 07960 497211 · Email: contact@5starweddingdirectory.com

INSERT INTO cms_pages (page_key, page_type, title, slug, seo_title, meta_description, summary, status, last_updated, content_html, published_html)
VALUES (
  'privacy',
  'legal',
  'Privacy Policy',
  '/privacy',
  'Privacy Policy — Luxury Wedding Directory',
  'How Luxury Wedding Directory collects, uses and protects your personal data. Your privacy matters to us.',
  'Our commitment to protecting your personal information.',
  'published',
  now(),
  $CONTENT$<h2>Privacy Policy</h2>
<p>Last updated: March 2026</p>
<hr>
<h2>1. Who We Are</h2>
<p>Luxury Wedding Directory is operated by <strong>5 Star Weddings Ltd</strong>, a company registered in England and Wales.</p>
<p><strong>Registered Address:</strong><br>5 Star Weddings Ltd<br>87 Serpentine Close<br>Stevenage, Hertfordshire SG1 6AR<br>United Kingdom</p>
<p><strong>Contact:</strong><br>Email: <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a><br>Phone: +44 07960 497211</p>
<p>We are committed to protecting your personal information and being transparent about what we collect, why we collect it, and how we use it. This policy applies to all users of our platform, including couples planning their wedding and vendors listed on our directory.</p>
<hr>
<h2>2. What Data We Collect</h2>
<h3>Couples &amp; Visitors</h3>
<ul>
<li>Name, email address and contact preferences when you create an account or enquire</li>
<li>Wedding date, location preferences and planning details you provide</li>
<li>Saved venues, shortlists and search history within your account</li>
<li>Messages sent to vendors through our platform</li>
<li>Device information, browser type and IP address for security and analytics</li>
<li>Cookies and usage data (see our Cookie Policy for full details)</li>
</ul>
<h3>Vendors &amp; Business Listings</h3>
<ul>
<li>Business name, contact details and billing information</li>
<li>Profile content including descriptions, images and pricing</li>
<li>Enquiry and lead data generated through your listing</li>
<li>Dashboard analytics and performance metrics</li>
<li>Payment and subscription records</li>
</ul>
<hr>
<h2>3. Legal Basis for Processing</h2>
<p>We process your data on the following legal grounds under the UK GDPR:</p>
<ul>
<li><strong>Contract:</strong> To provide the services you have requested, including account management, vendor listings and enquiry handling</li>
<li><strong>Legitimate interests:</strong> To improve our platform, prevent fraud and communicate relevant updates</li>
<li><strong>Consent:</strong> For marketing communications and non-essential cookies — you may withdraw consent at any time</li>
<li><strong>Legal obligation:</strong> To comply with applicable laws and regulations</li>
</ul>
<hr>
<h2>4. How We Use Your Data</h2>
<ul>
<li>To create and manage your account and provide our services</li>
<li>To connect couples with vendors and process enquiries</li>
<li>To process payments and manage vendor subscriptions</li>
<li>To send transactional emails (booking confirmations, enquiry notifications)</li>
<li>To send marketing communications where you have opted in</li>
<li>To power AI-assisted features via Taigenic.ai (part of 5 Star Weddings Ltd)</li>
<li>To analyse platform performance and improve user experience</li>
<li>To protect against fraud, abuse and security threats</li>
</ul>
<hr>
<h2>5. Data Sharing</h2>
<p>We do not sell your personal data. We share information only in the following circumstances:</p>
<ul>
<li><strong>Between couples and vendors:</strong> When you submit an enquiry, your contact details are shared with the relevant vendor</li>
<li><strong>Service providers:</strong> We use Supabase (database), Resend (email delivery) and Stripe (payments) as trusted processors under contractual data protection obligations</li>
<li><strong>AI services:</strong> Content may be processed by our AI infrastructure (Taigenic.ai) to power recommendations and smart features</li>
<li><strong>Legal requirements:</strong> Where required by law, court order or regulatory authority</li>
</ul>
<hr>
<h2>6. Your Rights</h2>
<p>Under the UK GDPR, you have the following rights:</p>
<ul>
<li><strong>Right of access:</strong> Request a copy of the personal data we hold about you</li>
<li><strong>Right to rectification:</strong> Ask us to correct inaccurate or incomplete data</li>
<li><strong>Right to erasure:</strong> Request deletion of your data where there is no lawful basis for retention</li>
<li><strong>Right to restrict processing:</strong> Ask us to limit how we use your data</li>
<li><strong>Right to data portability:</strong> Receive your data in a portable, machine-readable format</li>
<li><strong>Right to object:</strong> Object to processing based on legitimate interests or for direct marketing</li>
<li><strong>Right to withdraw consent:</strong> Withdraw any consent given at any time</li>
</ul>
<p>To exercise any of these rights, please contact us at <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a>. We will respond within 30 days.</p>
<hr>
<h2>7. Data Retention</h2>
<p>We retain your data only for as long as necessary:</p>
<ul>
<li>Active accounts: retained while your account remains active</li>
<li>Enquiry records: retained for 3 years for dispute resolution purposes</li>
<li>Billing and payment records: retained for 7 years in compliance with UK tax law</li>
<li>Marketing data: retained until you withdraw consent or request deletion</li>
</ul>
<hr>
<h2>8. Cookies</h2>
<p>We use essential, analytics and marketing cookies. Please see our full <a href="/cookies">Cookie Policy</a> for detailed information on the cookies we use and how to manage your preferences.</p>
<hr>
<h2>9. International Transfers</h2>
<p>Some of our service providers may process data outside the UK or EEA. Where this occurs, we ensure appropriate safeguards are in place, including Standard Contractual Clauses approved by the UK Information Commissioner's Office.</p>
<hr>
<h2>10. Changes to This Policy</h2>
<p>We may update this Privacy Policy from time to time. We will notify you of significant changes by email or via a notice on our platform. The date of the most recent revision is shown at the top of this page.</p>
<hr>
<h2>11. Contact &amp; Complaints</h2>
<p>If you have any concerns about how we handle your data, please contact us:</p>
<p><strong>5 Star Weddings Ltd</strong><br>87 Serpentine Close, Stevenage, Hertfordshire SG1 6AR<br>Email: <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a><br>Phone: +44 07960 497211</p>
<p>You also have the right to lodge a complaint with the UK Information Commissioner's Office (ICO) at <a href="https://ico.org.uk">ico.org.uk</a>.</p>$CONTENT$,
  $CONTENT$<h2>Privacy Policy</h2>
<p>Last updated: March 2026</p>
<hr>
<h2>1. Who We Are</h2>
<p>Luxury Wedding Directory is operated by <strong>5 Star Weddings Ltd</strong>, a company registered in England and Wales.</p>
<p><strong>Registered Address:</strong><br>5 Star Weddings Ltd<br>87 Serpentine Close<br>Stevenage, Hertfordshire SG1 6AR<br>United Kingdom</p>
<p><strong>Contact:</strong><br>Email: <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a><br>Phone: +44 07960 497211</p>
<p>We are committed to protecting your personal information and being transparent about what we collect, why we collect it, and how we use it. This policy applies to all users of our platform, including couples planning their wedding and vendors listed on our directory.</p>
<hr>
<h2>2. What Data We Collect</h2>
<h3>Couples &amp; Visitors</h3>
<ul>
<li>Name, email address and contact preferences when you create an account or enquire</li>
<li>Wedding date, location preferences and planning details you provide</li>
<li>Saved venues, shortlists and search history within your account</li>
<li>Messages sent to vendors through our platform</li>
<li>Device information, browser type and IP address for security and analytics</li>
<li>Cookies and usage data (see our Cookie Policy for full details)</li>
</ul>
<h3>Vendors &amp; Business Listings</h3>
<ul>
<li>Business name, contact details and billing information</li>
<li>Profile content including descriptions, images and pricing</li>
<li>Enquiry and lead data generated through your listing</li>
<li>Dashboard analytics and performance metrics</li>
<li>Payment and subscription records</li>
</ul>
<hr>
<h2>3. Legal Basis for Processing</h2>
<p>We process your data on the following legal grounds under the UK GDPR:</p>
<ul>
<li><strong>Contract:</strong> To provide the services you have requested, including account management, vendor listings and enquiry handling</li>
<li><strong>Legitimate interests:</strong> To improve our platform, prevent fraud and communicate relevant updates</li>
<li><strong>Consent:</strong> For marketing communications and non-essential cookies — you may withdraw consent at any time</li>
<li><strong>Legal obligation:</strong> To comply with applicable laws and regulations</li>
</ul>
<hr>
<h2>4. How We Use Your Data</h2>
<ul>
<li>To create and manage your account and provide our services</li>
<li>To connect couples with vendors and process enquiries</li>
<li>To process payments and manage vendor subscriptions</li>
<li>To send transactional emails (booking confirmations, enquiry notifications)</li>
<li>To send marketing communications where you have opted in</li>
<li>To power AI-assisted features via Taigenic.ai (part of 5 Star Weddings Ltd)</li>
<li>To analyse platform performance and improve user experience</li>
<li>To protect against fraud, abuse and security threats</li>
</ul>
<hr>
<h2>5. Data Sharing</h2>
<p>We do not sell your personal data. We share information only in the following circumstances:</p>
<ul>
<li><strong>Between couples and vendors:</strong> When you submit an enquiry, your contact details are shared with the relevant vendor</li>
<li><strong>Service providers:</strong> We use Supabase (database), Resend (email delivery) and Stripe (payments) as trusted processors under contractual data protection obligations</li>
<li><strong>AI services:</strong> Content may be processed by our AI infrastructure (Taigenic.ai) to power recommendations and smart features</li>
<li><strong>Legal requirements:</strong> Where required by law, court order or regulatory authority</li>
</ul>
<hr>
<h2>6. Your Rights</h2>
<p>Under the UK GDPR, you have the following rights:</p>
<ul>
<li><strong>Right of access:</strong> Request a copy of the personal data we hold about you</li>
<li><strong>Right to rectification:</strong> Ask us to correct inaccurate or incomplete data</li>
<li><strong>Right to erasure:</strong> Request deletion of your data where there is no lawful basis for retention</li>
<li><strong>Right to restrict processing:</strong> Ask us to limit how we use your data</li>
<li><strong>Right to data portability:</strong> Receive your data in a portable, machine-readable format</li>
<li><strong>Right to object:</strong> Object to processing based on legitimate interests or for direct marketing</li>
<li><strong>Right to withdraw consent:</strong> Withdraw any consent given at any time</li>
</ul>
<p>To exercise any of these rights, please contact us at <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a>. We will respond within 30 days.</p>
<hr>
<h2>7. Data Retention</h2>
<p>We retain your data only for as long as necessary:</p>
<ul>
<li>Active accounts: retained while your account remains active</li>
<li>Enquiry records: retained for 3 years for dispute resolution purposes</li>
<li>Billing and payment records: retained for 7 years in compliance with UK tax law</li>
<li>Marketing data: retained until you withdraw consent or request deletion</li>
</ul>
<hr>
<h2>8. Cookies</h2>
<p>We use essential, analytics and marketing cookies. Please see our full <a href="/cookies">Cookie Policy</a> for detailed information on the cookies we use and how to manage your preferences.</p>
<hr>
<h2>9. International Transfers</h2>
<p>Some of our service providers may process data outside the UK or EEA. Where this occurs, we ensure appropriate safeguards are in place, including Standard Contractual Clauses approved by the UK Information Commissioner's Office.</p>
<hr>
<h2>10. Changes to This Policy</h2>
<p>We may update this Privacy Policy from time to time. We will notify you of significant changes by email or via a notice on our platform. The date of the most recent revision is shown at the top of this page.</p>
<hr>
<h2>11. Contact &amp; Complaints</h2>
<p>If you have any concerns about how we handle your data, please contact us:</p>
<p><strong>5 Star Weddings Ltd</strong><br>87 Serpentine Close, Stevenage, Hertfordshire SG1 6AR<br>Email: <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a><br>Phone: +44 07960 497211</p>
<p>You also have the right to lodge a complaint with the UK Information Commissioner's Office (ICO) at <a href="https://ico.org.uk">ico.org.uk</a>.</p>$CONTENT$
),
(
  'terms',
  'legal',
  'Terms of Use',
  '/terms',
  'Terms of Use — Luxury Wedding Directory',
  'The terms and conditions governing your use of Luxury Wedding Directory for couples and vendors.',
  'Terms and conditions for using our platform.',
  'published',
  now(),
  $CONTENT$<h2>Terms of Use</h2>
<p>Last updated: March 2026</p>
<hr>
<h2>1. Agreement to Terms</h2>
<p>By accessing or using Luxury Wedding Directory (the "Platform"), you agree to be bound by these Terms of Use. If you do not agree, please do not use the Platform.</p>
<p>The Platform is operated by <strong>5 Star Weddings Ltd</strong>, registered in England and Wales.</p>
<p><strong>Registered Address:</strong><br>5 Star Weddings Ltd<br>87 Serpentine Close<br>Stevenage, Hertfordshire SG1 6AR</p>
<p>Email: <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a></p>
<hr>
<h2>2. Who May Use the Platform</h2>
<p>You must be at least 18 years of age to use the Platform. By using it, you represent that you meet this requirement. The Platform is intended for:</p>
<ul>
<li><strong>Couples:</strong> individuals planning a wedding who wish to browse venues and contact vendors</li>
<li><strong>Vendors:</strong> businesses and sole traders in the wedding industry seeking to list their services</li>
</ul>
<hr>
<h2>3. Accounts</h2>
<p>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must notify us immediately of any unauthorised use at <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a>.</p>
<p>We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent, abusive or harmful conduct.</p>
<hr>
<h2>4. Use of the Platform</h2>
<p>You agree not to:</p>
<ul>
<li>Use the Platform for any unlawful purpose or in violation of applicable regulations</li>
<li>Submit false, misleading or fraudulent information in listings or enquiries</li>
<li>Attempt to access accounts, systems or data you are not authorised to access</li>
<li>Scrape, harvest or systematically extract data from the Platform without written permission</li>
<li>Post content that is defamatory, obscene, discriminatory or infringes third-party rights</li>
<li>Use automated bots or scripts to interact with the Platform</li>
<li>Circumvent any security features or access controls</li>
</ul>
<hr>
<h2>5. Vendor Listings</h2>
<p>Vendors are responsible for ensuring their listings are accurate, up to date and compliant with applicable laws including the Consumer Rights Act 2015 and the Advertising Standards Authority (ASA) guidelines.</p>
<ul>
<li>Listing content must be genuine and relate only to your own business</li>
<li>Pricing information, if displayed, must be accurate and inclusive of applicable taxes</li>
<li>You must not infringe any third-party intellectual property rights in content you submit</li>
<li>We reserve the right to remove or edit listings that violate our standards at our discretion</li>
</ul>
<hr>
<h2>6. Enquiries and Bookings</h2>
<p>Luxury Wedding Directory facilitates introductions between couples and vendors. We are not a party to any contract formed between them. Any booking, payment or service agreement is solely between the couple and the vendor.</p>
<p>We do not accept responsibility for the quality, accuracy or outcome of any vendor service.</p>
<hr>
<h2>7. Vendor Subscriptions and Billing</h2>
<p>Vendor listings are available on a subscription basis. Pricing, billing cycles and cancellation terms are set out in the Pricing Plans section of the Platform. All fees are inclusive of applicable VAT where charged.</p>
<p>Subscriptions auto-renew unless cancelled before the renewal date. Refunds are issued at our discretion in accordance with applicable consumer protection law.</p>
<hr>
<h2>8. Intellectual Property</h2>
<p>All content, design, trademarks and technology on the Platform are owned by 5 Star Weddings Ltd or licensed to us. You may not reproduce, distribute or create derivative works without our prior written consent.</p>
<p>By submitting content (listings, reviews, photos), you grant us a non-exclusive, royalty-free licence to use, display and distribute that content in connection with the Platform.</p>
<hr>
<h2>9. Reviews</h2>
<p>Reviews submitted through the Platform are subject to our <a href="/reviews-policy">Review Policy</a>. We reserve the right to moderate, remove or decline to publish any review that violates our policies.</p>
<hr>
<h2>10. Disclaimers</h2>
<p>The Platform is provided "as is" without warranty of any kind. We do not guarantee the accuracy, completeness or reliability of any listing, review or user-generated content.</p>
<p>To the fullest extent permitted by law, 5 Star Weddings Ltd excludes all liability for indirect, consequential or economic losses arising from use of the Platform.</p>
<hr>
<h2>11. Governing Law</h2>
<p>These Terms are governed by the law of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
<hr>
<h2>12. Changes to These Terms</h2>
<p>We may update these Terms from time to time. Continued use of the Platform after changes are published constitutes acceptance of the updated Terms. We will give reasonable notice of material changes.</p>
<hr>
<h2>13. Contact</h2>
<p>For questions about these Terms, please contact:<br><strong>5 Star Weddings Ltd</strong><br>87 Serpentine Close, Stevenage, Hertfordshire SG1 6AR<br>Email: <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a><br>Phone: +44 07960 497211</p>$CONTENT$,
  $CONTENT$<h2>Terms of Use</h2>
<p>Last updated: March 2026</p>
<hr>
<h2>1. Agreement to Terms</h2>
<p>By accessing or using Luxury Wedding Directory (the "Platform"), you agree to be bound by these Terms of Use. If you do not agree, please do not use the Platform.</p>
<p>The Platform is operated by <strong>5 Star Weddings Ltd</strong>, registered in England and Wales.</p>
<p><strong>Registered Address:</strong><br>5 Star Weddings Ltd<br>87 Serpentine Close<br>Stevenage, Hertfordshire SG1 6AR</p>
<p>Email: <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a></p>
<hr>
<h2>2. Who May Use the Platform</h2>
<p>You must be at least 18 years of age to use the Platform. By using it, you represent that you meet this requirement. The Platform is intended for:</p>
<ul>
<li><strong>Couples:</strong> individuals planning a wedding who wish to browse venues and contact vendors</li>
<li><strong>Vendors:</strong> businesses and sole traders in the wedding industry seeking to list their services</li>
</ul>
<hr>
<h2>3. Accounts</h2>
<p>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must notify us immediately of any unauthorised use at <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a>.</p>
<p>We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent, abusive or harmful conduct.</p>
<hr>
<h2>4. Use of the Platform</h2>
<p>You agree not to:</p>
<ul>
<li>Use the Platform for any unlawful purpose or in violation of applicable regulations</li>
<li>Submit false, misleading or fraudulent information in listings or enquiries</li>
<li>Attempt to access accounts, systems or data you are not authorised to access</li>
<li>Scrape, harvest or systematically extract data from the Platform without written permission</li>
<li>Post content that is defamatory, obscene, discriminatory or infringes third-party rights</li>
<li>Use automated bots or scripts to interact with the Platform</li>
<li>Circumvent any security features or access controls</li>
</ul>
<hr>
<h2>5. Vendor Listings</h2>
<p>Vendors are responsible for ensuring their listings are accurate, up to date and compliant with applicable laws including the Consumer Rights Act 2015 and the Advertising Standards Authority (ASA) guidelines.</p>
<ul>
<li>Listing content must be genuine and relate only to your own business</li>
<li>Pricing information, if displayed, must be accurate and inclusive of applicable taxes</li>
<li>You must not infringe any third-party intellectual property rights in content you submit</li>
<li>We reserve the right to remove or edit listings that violate our standards at our discretion</li>
</ul>
<hr>
<h2>6. Enquiries and Bookings</h2>
<p>Luxury Wedding Directory facilitates introductions between couples and vendors. We are not a party to any contract formed between them. Any booking, payment or service agreement is solely between the couple and the vendor.</p>
<p>We do not accept responsibility for the quality, accuracy or outcome of any vendor service.</p>
<hr>
<h2>7. Vendor Subscriptions and Billing</h2>
<p>Vendor listings are available on a subscription basis. Pricing, billing cycles and cancellation terms are set out in the Pricing Plans section of the Platform. All fees are inclusive of applicable VAT where charged.</p>
<p>Subscriptions auto-renew unless cancelled before the renewal date. Refunds are issued at our discretion in accordance with applicable consumer protection law.</p>
<hr>
<h2>8. Intellectual Property</h2>
<p>All content, design, trademarks and technology on the Platform are owned by 5 Star Weddings Ltd or licensed to us. You may not reproduce, distribute or create derivative works without our prior written consent.</p>
<p>By submitting content (listings, reviews, photos), you grant us a non-exclusive, royalty-free licence to use, display and distribute that content in connection with the Platform.</p>
<hr>
<h2>9. Reviews</h2>
<p>Reviews submitted through the Platform are subject to our <a href="/reviews-policy">Review Policy</a>. We reserve the right to moderate, remove or decline to publish any review that violates our policies.</p>
<hr>
<h2>10. Disclaimers</h2>
<p>The Platform is provided "as is" without warranty of any kind. We do not guarantee the accuracy, completeness or reliability of any listing, review or user-generated content.</p>
<p>To the fullest extent permitted by law, 5 Star Weddings Ltd excludes all liability for indirect, consequential or economic losses arising from use of the Platform.</p>
<hr>
<h2>11. Governing Law</h2>
<p>These Terms are governed by the law of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
<hr>
<h2>12. Changes to These Terms</h2>
<p>We may update these Terms from time to time. Continued use of the Platform after changes are published constitutes acceptance of the updated Terms. We will give reasonable notice of material changes.</p>
<hr>
<h2>13. Contact</h2>
<p>For questions about these Terms, please contact:<br><strong>5 Star Weddings Ltd</strong><br>87 Serpentine Close, Stevenage, Hertfordshire SG1 6AR<br>Email: <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a><br>Phone: +44 07960 497211</p>$CONTENT$
),
(
  'cookies',
  'legal',
  'Cookie Policy',
  '/cookies',
  'Cookie Policy — Luxury Wedding Directory',
  'Information about the cookies we use on Luxury Wedding Directory and how to manage your preferences.',
  'How we use cookies and tracking technologies.',
  'published',
  now(),
  $CONTENT$<h2>Cookie Policy</h2>
<p>Last updated: March 2026</p>
<hr>
<h2>1. What Are Cookies</h2>
<p>Cookies are small text files placed on your device when you visit our website. They allow the site to remember your preferences, understand how you use our platform, and provide a better experience. Some cookies are essential for the Platform to function; others are used for analytics or marketing purposes.</p>
<hr>
<h2>2. Who Sets These Cookies</h2>
<p>Cookies on Luxury Wedding Directory are set by <strong>5 Star Weddings Ltd</strong>. We also use trusted third-party services that may set their own cookies.</p>
<hr>
<h2>3. Categories of Cookies We Use</h2>
<h3>Essential Cookies</h3>
<p>These cookies are necessary for the Platform to function. They cannot be disabled.</p>
<ul>
<li><strong>Session management:</strong> Keeps you logged in during your visit</li>
<li><strong>Security:</strong> Protects against cross-site request forgery (CSRF)</li>
<li><strong>Load balancing:</strong> Ensures stable performance across our servers</li>
</ul>
<h3>Functional Cookies</h3>
<p>These cookies remember your preferences and provide enhanced features.</p>
<ul>
<li><strong>Theme preference:</strong> Remembers your light/dark mode setting</li>
<li><strong>Search filters:</strong> Saves your recent search preferences</li>
<li><strong>Language settings:</strong> Remembers your preferred language</li>
</ul>
<h3>Analytics Cookies</h3>
<p>These help us understand how visitors use our Platform so we can improve it. All data is aggregated and anonymised.</p>
<ul>
<li><strong>Google Analytics:</strong> Page views, session duration, user journeys</li>
<li><strong>Platform analytics:</strong> Feature usage, conversion tracking, vendor performance metrics</li>
</ul>
<h3>Marketing Cookies</h3>
<p>Used to show you relevant advertising and measure the effectiveness of campaigns.</p>
<ul>
<li><strong>Retargeting:</strong> Displays relevant ads across partner networks after your visit</li>
<li><strong>Conversion tracking:</strong> Measures the success of our advertising campaigns</li>
<li><strong>Social media:</strong> Enables social sharing features and may track visits for ad platforms</li>
</ul>
<hr>
<h2>4. Third-Party Cookies</h2>
<p>We work with the following trusted partners who may set cookies on our Platform:</p>
<ul>
<li><strong>Google Analytics</strong> — traffic and behaviour analytics</li>
<li><strong>Supabase</strong> — authentication session management</li>
<li><strong>Stripe</strong> — payment processing (vendor billing pages only)</li>
<li><strong>Social platforms</strong> (Instagram, Facebook, Pinterest) — share buttons and embedded content</li>
</ul>
<hr>
<h2>5. Managing Your Cookie Preferences</h2>
<p>You can manage your cookie preferences at any time:</p>
<ul>
<li><strong>Cookie settings:</strong> Click "Cookie Settings" in the footer of any page to update your preferences</li>
<li><strong>Browser settings:</strong> Most browsers allow you to block or delete cookies. Visit your browser's help section for guidance</li>
<li><strong>Opt-out tools:</strong> You may opt out of Google Analytics at <a href="https://tools.google.com/dlpage/gaoptout">tools.google.com/dlpage/gaoptout</a></li>
</ul>
<p>Please note that disabling certain cookies may affect the functionality of the Platform.</p>
<hr>
<h2>6. Changes to This Policy</h2>
<p>We may update this Cookie Policy periodically. The date of the most recent revision is shown at the top of this page.</p>
<hr>
<h2>7. Contact</h2>
<p>If you have questions about our use of cookies, please contact:<br><strong>5 Star Weddings Ltd</strong><br>87 Serpentine Close, Stevenage, Hertfordshire SG1 6AR<br>Email: <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a></p>$CONTENT$,
  $CONTENT$<h2>Cookie Policy</h2>
<p>Last updated: March 2026</p>
<hr>
<h2>1. What Are Cookies</h2>
<p>Cookies are small text files placed on your device when you visit our website. They allow the site to remember your preferences, understand how you use our platform, and provide a better experience. Some cookies are essential for the Platform to function; others are used for analytics or marketing purposes.</p>
<hr>
<h2>2. Who Sets These Cookies</h2>
<p>Cookies on Luxury Wedding Directory are set by <strong>5 Star Weddings Ltd</strong>. We also use trusted third-party services that may set their own cookies.</p>
<hr>
<h2>3. Categories of Cookies We Use</h2>
<h3>Essential Cookies</h3>
<p>These cookies are necessary for the Platform to function. They cannot be disabled.</p>
<ul>
<li><strong>Session management:</strong> Keeps you logged in during your visit</li>
<li><strong>Security:</strong> Protects against cross-site request forgery (CSRF)</li>
<li><strong>Load balancing:</strong> Ensures stable performance across our servers</li>
</ul>
<h3>Functional Cookies</h3>
<p>These cookies remember your preferences and provide enhanced features.</p>
<ul>
<li><strong>Theme preference:</strong> Remembers your light/dark mode setting</li>
<li><strong>Search filters:</strong> Saves your recent search preferences</li>
<li><strong>Language settings:</strong> Remembers your preferred language</li>
</ul>
<h3>Analytics Cookies</h3>
<p>These help us understand how visitors use our Platform so we can improve it. All data is aggregated and anonymised.</p>
<ul>
<li><strong>Google Analytics:</strong> Page views, session duration, user journeys</li>
<li><strong>Platform analytics:</strong> Feature usage, conversion tracking, vendor performance metrics</li>
</ul>
<h3>Marketing Cookies</h3>
<p>Used to show you relevant advertising and measure the effectiveness of campaigns.</p>
<ul>
<li><strong>Retargeting:</strong> Displays relevant ads across partner networks after your visit</li>
<li><strong>Conversion tracking:</strong> Measures the success of our advertising campaigns</li>
<li><strong>Social media:</strong> Enables social sharing features and may track visits for ad platforms</li>
</ul>
<hr>
<h2>4. Third-Party Cookies</h2>
<p>We work with the following trusted partners who may set cookies on our Platform:</p>
<ul>
<li><strong>Google Analytics</strong> — traffic and behaviour analytics</li>
<li><strong>Supabase</strong> — authentication session management</li>
<li><strong>Stripe</strong> — payment processing (vendor billing pages only)</li>
<li><strong>Social platforms</strong> (Instagram, Facebook, Pinterest) — share buttons and embedded content</li>
</ul>
<hr>
<h2>5. Managing Your Cookie Preferences</h2>
<p>You can manage your cookie preferences at any time:</p>
<ul>
<li><strong>Cookie settings:</strong> Click "Cookie Settings" in the footer of any page to update your preferences</li>
<li><strong>Browser settings:</strong> Most browsers allow you to block or delete cookies. Visit your browser's help section for guidance</li>
<li><strong>Opt-out tools:</strong> You may opt out of Google Analytics at <a href="https://tools.google.com/dlpage/gaoptout">tools.google.com/dlpage/gaoptout</a></li>
</ul>
<p>Please note that disabling certain cookies may affect the functionality of the Platform.</p>
<hr>
<h2>6. Changes to This Policy</h2>
<p>We may update this Cookie Policy periodically. The date of the most recent revision is shown at the top of this page.</p>
<hr>
<h2>7. Contact</h2>
<p>If you have questions about our use of cookies, please contact:<br><strong>5 Star Weddings Ltd</strong><br>87 Serpentine Close, Stevenage, Hertfordshire SG1 6AR<br>Email: <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a></p>$CONTENT$
),
(
  'reviews-policy',
  'legal',
  'Reviews Policy',
  '/reviews-policy',
  'Reviews Policy — Luxury Wedding Directory',
  'How reviews work on Luxury Wedding Directory — submission, verification, moderation and vendor responses.',
  'Our standards for collecting and publishing authentic wedding vendor reviews.',
  'published',
  now(),
  $CONTENT$<h2>Reviews Policy</h2>
<p>Last updated: March 2026</p>
<hr>
<h2>1. Our Commitment to Authentic Reviews</h2>
<p>Luxury Wedding Directory is committed to maintaining the integrity of our review system. Every review on our platform should reflect a genuine experience. We do not permit fake, incentivised or misleading reviews, and we take active steps to verify submissions and moderate content.</p>
<hr>
<h2>2. Who Can Submit a Review</h2>
<p>Reviews may be submitted by:</p>
<ul>
<li>Couples who have made an enquiry through our platform to the relevant vendor</li>
<li>Clients who have worked directly with a listed vendor and can provide verifiable details</li>
</ul>
<p>To maintain authenticity, we may ask for supporting evidence such as a booking reference, invoice or wedding date to verify your experience before publication.</p>
<hr>
<h2>3. Review Submission Standards</h2>
<p>All reviews must meet the following standards:</p>
<ul>
<li><strong>Genuine:</strong> Based on your own first-hand experience with the vendor</li>
<li><strong>Relevant:</strong> Related to the service provided — not unrelated personal matters</li>
<li><strong>Respectful:</strong> Constructive and professional in tone; no offensive language or personal attacks</li>
<li><strong>Accurate:</strong> Free from false statements of fact that could be defamatory</li>
<li><strong>Independent:</strong> Not submitted in exchange for a discount, payment or other benefit</li>
</ul>
<hr>
<h2>4. Verification Process</h2>
<p>We use a two-tier verification system:</p>
<ul>
<li><strong>Platform-verified:</strong> Reviews from couples who submitted an enquiry through Luxury Wedding Directory are automatically flagged as platform-verified</li>
<li><strong>Standard reviews:</strong> Reviews from clients outside the platform are accepted but clearly distinguished; we may request supporting documentation</li>
</ul>
<p>Vendors cannot pay for or influence the verification status of reviews.</p>
<hr>
<h2>5. Moderation</h2>
<p>All submitted reviews enter a moderation queue before publication. Our editorial team reviews each submission to ensure it meets our standards. We aim to process reviews within 5 working days.</p>
<p>We may decline to publish, or remove after publication, any review that:</p>
<ul>
<li>Contains offensive, discriminatory or defamatory content</li>
<li>Is submitted by a competitor or party with a clear conflict of interest</li>
<li>Relates to matters outside the scope of the vendor's services</li>
<li>Is submitted fraudulently or in bad faith</li>
<li>Is the subject of a verified legal complaint</li>
</ul>
<hr>
<h2>6. Vendor Responses</h2>
<p>Vendors listed on our platform may respond publicly to reviews of their business. Responses must be professional and relevant. We reserve the right to remove vendor responses that are inappropriate, contain personal attacks or violate our community standards.</p>
<hr>
<h2>7. Review Removal Requests</h2>
<p>If you believe a review about your business is false, defamatory or violates our policy, you may submit a removal request by contacting us at <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a>. Please include the specific review, the grounds for your request and any supporting evidence.</p>
<p>We will investigate and respond within 10 working days. We will not remove negative reviews solely because they reflect poorly on a vendor.</p>
<hr>
<h2>8. Review Ratings</h2>
<p>Reviews are rated on a scale of 1 to 5 stars across multiple dimensions including overall experience, communication, value and quality. These ratings contribute to each vendor's LWD Curated Index score.</p>
<hr>
<h2>9. Contact</h2>
<p>For questions or concerns about our review system, please contact:<br><strong>5 Star Weddings Ltd</strong><br>87 Serpentine Close, Stevenage, Hertfordshire SG1 6AR<br>Email: <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a><br>Phone: +44 07960 497211</p>$CONTENT$,
  $CONTENT$<h2>Reviews Policy</h2>
<p>Last updated: March 2026</p>
<hr>
<h2>1. Our Commitment to Authentic Reviews</h2>
<p>Luxury Wedding Directory is committed to maintaining the integrity of our review system. Every review on our platform should reflect a genuine experience. We do not permit fake, incentivised or misleading reviews, and we take active steps to verify submissions and moderate content.</p>
<hr>
<h2>2. Who Can Submit a Review</h2>
<p>Reviews may be submitted by:</p>
<ul>
<li>Couples who have made an enquiry through our platform to the relevant vendor</li>
<li>Clients who have worked directly with a listed vendor and can provide verifiable details</li>
</ul>
<p>To maintain authenticity, we may ask for supporting evidence such as a booking reference, invoice or wedding date to verify your experience before publication.</p>
<hr>
<h2>3. Review Submission Standards</h2>
<p>All reviews must meet the following standards:</p>
<ul>
<li><strong>Genuine:</strong> Based on your own first-hand experience with the vendor</li>
<li><strong>Relevant:</strong> Related to the service provided — not unrelated personal matters</li>
<li><strong>Respectful:</strong> Constructive and professional in tone; no offensive language or personal attacks</li>
<li><strong>Accurate:</strong> Free from false statements of fact that could be defamatory</li>
<li><strong>Independent:</strong> Not submitted in exchange for a discount, payment or other benefit</li>
</ul>
<hr>
<h2>4. Verification Process</h2>
<p>We use a two-tier verification system:</p>
<ul>
<li><strong>Platform-verified:</strong> Reviews from couples who submitted an enquiry through Luxury Wedding Directory are automatically flagged as platform-verified</li>
<li><strong>Standard reviews:</strong> Reviews from clients outside the platform are accepted but clearly distinguished; we may request supporting documentation</li>
</ul>
<p>Vendors cannot pay for or influence the verification status of reviews.</p>
<hr>
<h2>5. Moderation</h2>
<p>All submitted reviews enter a moderation queue before publication. Our editorial team reviews each submission to ensure it meets our standards. We aim to process reviews within 5 working days.</p>
<p>We may decline to publish, or remove after publication, any review that:</p>
<ul>
<li>Contains offensive, discriminatory or defamatory content</li>
<li>Is submitted by a competitor or party with a clear conflict of interest</li>
<li>Relates to matters outside the scope of the vendor's services</li>
<li>Is submitted fraudulently or in bad faith</li>
<li>Is the subject of a verified legal complaint</li>
</ul>
<hr>
<h2>6. Vendor Responses</h2>
<p>Vendors listed on our platform may respond publicly to reviews of their business. Responses must be professional and relevant. We reserve the right to remove vendor responses that are inappropriate, contain personal attacks or violate our community standards.</p>
<hr>
<h2>7. Review Removal Requests</h2>
<p>If you believe a review about your business is false, defamatory or violates our policy, you may submit a removal request by contacting us at <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a>. Please include the specific review, the grounds for your request and any supporting evidence.</p>
<p>We will investigate and respond within 10 working days. We will not remove negative reviews solely because they reflect poorly on a vendor.</p>
<hr>
<h2>8. Review Ratings</h2>
<p>Reviews are rated on a scale of 1 to 5 stars across multiple dimensions including overall experience, communication, value and quality. These ratings contribute to each vendor's LWD Curated Index score.</p>
<hr>
<h2>9. Contact</h2>
<p>For questions or concerns about our review system, please contact:<br><strong>5 Star Weddings Ltd</strong><br>87 Serpentine Close, Stevenage, Hertfordshire SG1 6AR<br>Email: <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a><br>Phone: +44 07960 497211</p>$CONTENT$
),
(
  'support',
  'support',
  'Support & Help Centre',
  '/support',
  'Support & Help Centre — Luxury Wedding Directory',
  'Get help with Luxury Wedding Directory. FAQs, contact details and support for couples and vendors.',
  'Help and support for couples and wedding vendors.',
  'published',
  now(),
  $CONTENT$<h2>Support &amp; Help Centre</h2>
<p>We are here to help. Whether you are a couple planning your dream day or a vendor managing your listing, our team is on hand to assist.</p>
<hr>
<h2>Contact Us</h2>
<p><strong>Email:</strong> <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a><br><strong>Phone:</strong> +44 07960 497211<br><strong>WhatsApp:</strong> <a href="https://wa.me/447960497211">Chat with us on WhatsApp</a><br><strong>Response time:</strong> We aim to respond to all enquiries within 1 working day.</p>
<hr>
<h2>For Couples</h2>
<h3>How do I create an account?</h3>
<p>Click "Sign Up" in the top navigation and complete the registration form. You can also sign up when saving your first venue to a shortlist. Account creation is free.</p>
<h3>How do I contact a vendor?</h3>
<p>Visit the vendor's profile and click "Enquire Now". Complete the enquiry form with your wedding date, location and message. The vendor will be notified and aim to respond within 24–48 hours.</p>
<h3>How do I save a venue to my shortlist?</h3>
<p>Click the bookmark icon on any venue or vendor card. You will need to be logged in. Access your saved shortlist from your account dashboard.</p>
<h3>How do I submit a review?</h3>
<p>After your wedding, visit the vendor's profile and click "Leave a Review". You can also submit a review via the link in your post-wedding email. Reviews are moderated before publication. See our <a href="/reviews-policy">Reviews Policy</a> for full details.</p>
<h3>I am having trouble logging in — what should I do?</h3>
<p>Click "Forgot Password" on the login screen to receive a reset link by email. If you continue to experience issues, please contact us at <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a>.</p>
<hr>
<h2>For Vendors</h2>
<h3>How do I list my business?</h3>
<p>Visit the <a href="/vendor">Vendor Portal</a> and click "List Your Business". Choose a subscription plan, create your account and complete your listing profile. Your listing will be reviewed by our editorial team before going live.</p>
<h3>How do I manage my listing?</h3>
<p>Log in to your Vendor Dashboard at <a href="/vendor">luxuryweddingdirectory.com/vendor</a>. From your dashboard you can update your profile, manage enquiries, view analytics and access your AI insights.</p>
<h3>How do I upgrade my subscription?</h3>
<p>Go to your Vendor Dashboard and select Billing from the sidebar. You can view your current plan and upgrade at any time. Changes take effect immediately.</p>
<h3>How do leads and enquiries work?</h3>
<p>When a couple submits an enquiry through your listing, you will receive an instant email notification with their details. You can manage all your leads from the Lead Management section of your dashboard.</p>
<h3>What is the LWD Curated Index?</h3>
<p>The LWD Curated Index is our proprietary quality score, calculated from your review ratings, profile completeness, response rate and verified bookings. A higher score improves your visibility and ranking in search results.</p>
<h3>I have a billing query — who do I contact?</h3>
<p>For billing questions, contact us at <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a> with your account email and query. We will respond within 1 working day.</p>
<hr>
<h2>Technical Support</h2>
<p>If you experience a technical issue with the platform, please email <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a> with a description of the issue and, if possible, a screenshot. We prioritise technical reports and aim to resolve them within 24 hours.</p>
<hr>
<h2>Still Need Help?</h2>
<p>Our team is available Monday to Friday, 9am–6pm (GMT).<br>Email: <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a><br>Phone: +44 07960 497211</p>$CONTENT$,
  $CONTENT$<h2>Support &amp; Help Centre</h2>
<p>We are here to help. Whether you are a couple planning your dream day or a vendor managing your listing, our team is on hand to assist.</p>
<hr>
<h2>Contact Us</h2>
<p><strong>Email:</strong> <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a><br><strong>Phone:</strong> +44 07960 497211<br><strong>WhatsApp:</strong> <a href="https://wa.me/447960497211">Chat with us on WhatsApp</a><br><strong>Response time:</strong> We aim to respond to all enquiries within 1 working day.</p>
<hr>
<h2>For Couples</h2>
<h3>How do I create an account?</h3>
<p>Click "Sign Up" in the top navigation and complete the registration form. You can also sign up when saving your first venue to a shortlist. Account creation is free.</p>
<h3>How do I contact a vendor?</h3>
<p>Visit the vendor's profile and click "Enquire Now". Complete the enquiry form with your wedding date, location and message. The vendor will be notified and aim to respond within 24–48 hours.</p>
<h3>How do I save a venue to my shortlist?</h3>
<p>Click the bookmark icon on any venue or vendor card. You will need to be logged in. Access your saved shortlist from your account dashboard.</p>
<h3>How do I submit a review?</h3>
<p>After your wedding, visit the vendor's profile and click "Leave a Review". You can also submit a review via the link in your post-wedding email. Reviews are moderated before publication. See our <a href="/reviews-policy">Reviews Policy</a> for full details.</p>
<h3>I am having trouble logging in — what should I do?</h3>
<p>Click "Forgot Password" on the login screen to receive a reset link by email. If you continue to experience issues, please contact us at <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a>.</p>
<hr>
<h2>For Vendors</h2>
<h3>How do I list my business?</h3>
<p>Visit the <a href="/vendor">Vendor Portal</a> and click "List Your Business". Choose a subscription plan, create your account and complete your listing profile. Your listing will be reviewed by our editorial team before going live.</p>
<h3>How do I manage my listing?</h3>
<p>Log in to your Vendor Dashboard at <a href="/vendor">luxuryweddingdirectory.com/vendor</a>. From your dashboard you can update your profile, manage enquiries, view analytics and access your AI insights.</p>
<h3>How do I upgrade my subscription?</h3>
<p>Go to your Vendor Dashboard and select Billing from the sidebar. You can view your current plan and upgrade at any time. Changes take effect immediately.</p>
<h3>How do leads and enquiries work?</h3>
<p>When a couple submits an enquiry through your listing, you will receive an instant email notification with their details. You can manage all your leads from the Lead Management section of your dashboard.</p>
<h3>What is the LWD Curated Index?</h3>
<p>The LWD Curated Index is our proprietary quality score, calculated from your review ratings, profile completeness, response rate and verified bookings. A higher score improves your visibility and ranking in search results.</p>
<h3>I have a billing query — who do I contact?</h3>
<p>For billing questions, contact us at <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a> with your account email and query. We will respond within 1 working day.</p>
<hr>
<h2>Technical Support</h2>
<p>If you experience a technical issue with the platform, please email <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a> with a description of the issue and, if possible, a screenshot. We prioritise technical reports and aim to resolve them within 24 hours.</p>
<hr>
<h2>Still Need Help?</h2>
<p>Our team is available Monday to Friday, 9am–6pm (GMT).<br>Email: <a href="mailto:contact@5starweddingdirectory.com">contact@5starweddingdirectory.com</a><br>Phone: +44 07960 497211</p>$CONTENT$
)
ON CONFLICT (page_key) DO NOTHING;
