// ─── src/components/seo/SeoHead.jsx ──────────────────────────────────────────
// Reusable SEO head component using react-helmet-async.
// Renders title, meta, canonical, OG, and Twitter card tags.
// Props are used directly - callers must supply real listing/article fields.
// Never renders noindex on public pages unless explicitly passed.

import { Helmet } from "react-helmet-async";

const SITE_NAME = "Luxury Wedding Directory";
const SITE_URL  = import.meta.env.VITE_SITE_URL || "https://www.luxuryweddingdirectory.co.uk";

/**
 * @param {object} props
 * @param {string}  props.title        - Page title (shown in <title> tag)
 * @param {string}  [props.description]  - Meta description
 * @param {string|string[]} [props.keywords] - Meta keywords (string or array)
 * @param {string}  [props.canonicalUrl]  - Full canonical URL
 * @param {string}  [props.ogImage]     - Open Graph image URL
 * @param {string}  [props.ogType]      - OG type, defaults to "website"
 * @param {boolean} [props.noIndex]     - If true, adds noindex robots tag
 */
export default function SeoHead({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage,
  ogType = "website",
  noIndex = false,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

  const keywordsStr = Array.isArray(keywords)
    ? keywords.filter(Boolean).join(", ")
    : (keywords || "");

  const resolvedImage = ogImage || `${SITE_URL}/og-default.jpg`;
  const resolvedUrl   = canonicalUrl || SITE_URL;

  return (
    <Helmet>
      {/* Primary */}
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywordsStr  && <meta name="keywords"    content={keywordsStr} />}
      {canonicalUrl && <link rel="canonical"    href={resolvedUrl} />}
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />

      {/* Open Graph */}
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:type"        content={ogType} />
      <meta property="og:url"         content={resolvedUrl} />
      <meta property="og:image"       content={resolvedImage} />
      <meta property="og:site_name"   content={SITE_NAME} />
      {description && <meta property="og:description" content={description} />}

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:image"       content={resolvedImage} />
      {description && <meta name="twitter:description" content={description} />}
    </Helmet>
  );
}
