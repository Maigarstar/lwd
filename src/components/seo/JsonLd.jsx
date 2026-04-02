// ─── src/components/seo/JsonLd.jsx ───────────────────────────────────────────
// Injects a JSON-LD <script> block into the page head.
// Used with structured data helpers from src/utils/structuredData.js

import { Helmet } from "react-helmet-async";

/**
 * @param {{ schema: object }} props
 */
export default function JsonLd({ schema }) {
  if (!schema) return null;
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}
