// src/pages/PublicationStudio/ThumbnailRenderer.jsx
//
// Dev-only route renderer used by scripts/generate-template-thumbnails.mjs.
// URL: /studio-thumbnail/:id
//
// Renders a single template onto a 794×1123 Fabric canvas inside an element
// with id="capture", which Playwright screenshots to produce
// public/publication-studio/templates/{id}.jpg for ElementsPanel's hover
// preview.
//
// Not linked from any UI — intended to be hit directly by the thumbnail
// generator. Safe to ship to production: no auth-protected routes, no user
// data, just a static template renderer.

import { useEffect, useRef, useState } from 'react';
import { Canvas } from 'fabric';
import {
  applyTemplate,
  TEMPLATE_REF_W,
  TEMPLATE_REF_H,
} from './PageDesigner';
import { TEMPLATES } from './templates/definitions';

export default function ThumbnailRenderer({ templateId }) {
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const [status, setStatus] = useState('initialising');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!templateId) {
      setError('No template id in URL');
      setStatus('error');
      return;
    }

    const template = TEMPLATES.find(
      (t) => t.id === templateId || t.name === templateId,
    );
    if (!template) {
      setError(`Template not found: ${templateId}`);
      setStatus('error');
      return;
    }

    if (!canvasRef.current) return;
    if (fabricRef.current) {
      try { fabricRef.current.dispose(); } catch { /* noop */ }
      fabricRef.current = null;
    }

    const fc = new Canvas(canvasRef.current, {
      width: TEMPLATE_REF_W,
      height: TEMPLATE_REF_H,
      selection: false,
      preserveObjectStacking: true,
      renderOnAddRemove: true,
      enableRetinaScaling: false,
      backgroundColor: '#ffffff',
    });
    fabricRef.current = fc;

    try {
      applyTemplate(fc, template, { w: TEMPLATE_REF_W, h: TEMPLATE_REF_H });
      // applyTemplate fires async FabricImage.fromURL calls inside. Wait for
      // a heuristic settle window so the screenshot captures imagery.
      setStatus('rendering');
      const settle = setTimeout(() => {
        fc.requestRenderAll();
        setStatus('ready');
      }, 1800);
      return () => {
        clearTimeout(settle);
        try { fc.dispose(); } catch { /* noop */ }
        fabricRef.current = null;
      };
    } catch (e) {
      setError(e?.message || String(e));
      setStatus('error');
    }
  }, [templateId]);

  if (status === 'error') {
    return (
      <div style={{ padding: 40, fontFamily: 'monospace', color: '#c00' }}>
        <h1>ThumbnailRenderer error</h1>
        <pre>{error}</pre>
        <p>Template id: {String(templateId)}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#ffffff',
        minHeight: '100vh',
        padding: 0,
        margin: 0,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
      }}
    >
      {/* Playwright screenshots this element */}
      <div
        id="capture"
        data-status={status}
        style={{
          width: TEMPLATE_REF_W,
          height: TEMPLATE_REF_H,
          background: '#ffffff',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          width={TEMPLATE_REF_W}
          height={TEMPLATE_REF_H}
          style={{ display: 'block' }}
        />
      </div>
    </div>
  );
}
