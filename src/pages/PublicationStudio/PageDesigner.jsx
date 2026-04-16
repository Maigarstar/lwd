import { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, Textbox, FabricImage, Rect, Circle, Line } from 'fabric';
import { loadGoogleFont } from './templates/fontCatalog';
import { PAGE_SIZES, ELEMENT_DEFAULTS, GOLD, DARK, CARD, BORDER, MUTED, NU, GD } from './PageDesigner/designerConstants';
import ElementsPanel from './PageDesigner/ElementsPanel';
import PropertiesPanel from './PageDesigner/PropertiesPanel';
import PageListPanel from './PageDesigner/PageListPanel';
import DesignerToolbar from './PageDesigner/DesignerToolbar';
import { canvasToJpegBlob, canvasToPrintJpegBlob, generatePrintPDF, downloadPDF } from './PageDesigner/exportUtils';
import { upsertPage, uploadPageImage, uploadThumbImage } from '../../services/magazinePageService';

function genId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Grid overlay ──────────────────────────────────────────────────────────────
function GridOverlay({ width, height, cellPx = 40 }) {
  const lines = [];
  for (let x = cellPx; x < width; x += cellPx) {
    lines.push(
      <line key={`v${x}`} x1={x} y1={0} x2={x} y2={height}
        stroke="rgba(201,169,110,0.12)" strokeWidth={0.5} />
    );
  }
  for (let y = cellPx; y < height; y += cellPx) {
    lines.push(
      <line key={`h${y}`} x1={0} y1={y} x2={width} y2={y}
        stroke="rgba(201,169,110,0.12)" strokeWidth={0.5} />
    );
  }
  return (
    <svg
      width={width} height={height}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 5 }}
    >
      {lines}
    </svg>
  );
}

// ── Ruler ─────────────────────────────────────────────────────────────────────
function Ruler({ length, isVertical, scale = 1 }) {
  const TICK_EVERY = 40; // px
  const RULER_SIZE = 20;
  const ticks = [];
  const count = Math.ceil(length / TICK_EVERY);

  for (let i = 0; i <= count; i++) {
    const pos = i * TICK_EVERY;
    const isMajor = i % 5 === 0;
    const label = isMajor ? Math.round(pos / scale) : null;

    if (isVertical) {
      ticks.push(
        <g key={i}>
          <line
            x1={isMajor ? 0 : RULER_SIZE / 2} y1={pos}
            x2={RULER_SIZE} y2={pos}
            stroke="rgba(255,255,255,0.3)" strokeWidth={0.5}
          />
          {label !== null && (
            <text
              x={2} y={pos + 3}
              fill="rgba(255,255,255,0.35)"
              fontSize={7}
              fontFamily={NU}
              transform={`rotate(-90, 2, ${pos + 3})`}
            >
              {label}
            </text>
          )}
        </g>
      );
    } else {
      ticks.push(
        <g key={i}>
          <line
            x1={pos} y1={isMajor ? 0 : RULER_SIZE / 2}
            x2={pos} y2={RULER_SIZE}
            stroke="rgba(255,255,255,0.3)" strokeWidth={0.5}
          />
          {label !== null && (
            <text
              x={pos + 2} y={RULER_SIZE - 4}
              fill="rgba(255,255,255,0.35)"
              fontSize={7}
              fontFamily={NU}
            >
              {label}
            </text>
          )}
        </g>
      );
    }
  }

  if (isVertical) {
    return (
      <svg
        width={RULER_SIZE}
        height={length}
        style={{ flexShrink: 0, background: '#111' }}
      >
        {ticks}
      </svg>
    );
  }
  return (
    <svg
      width={length}
      height={RULER_SIZE}
      style={{ flexShrink: 0, background: '#111' }}
    >
      {ticks}
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PageDesigner({ issue, onIssueUpdate }) {
  const canvasElRef = useRef(null);
  const fabricRef = useRef(null);
  const initRef = useRef(false);

  const [pages, setPages] = useState([{
    id: genId(),
    pageNumber: 1,
    canvasJSON: null,
    thumbnailDataUrl: null,
    name: 'Page 1',
  }]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedObject, setSelectedObject] = useState(null);
  const [pageSize, setPageSize] = useState(issue?.page_size || 'A4');
  const [showGrid, setShowGrid] = useState(false);
  const [showRuler, setShowRuler] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [exportingDigital, setExportingDigital] = useState(false);
  const [exportingPrint, setExportingPrint] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const dims = PAGE_SIZES[pageSize] || PAGE_SIZES.A4;

  // ── Undo helpers ────────────────────────────────────────────────────────────
  const pushUndo = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const json = fc.toJSON(['id']);
    setUndoStack(prev => [...prev.slice(-29), json]);
    setRedoStack([]);
  }, []);

  // ── Canvas init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasElRef.current) return;

    if (fabricRef.current) {
      fabricRef.current.dispose();
      fabricRef.current = null;
    }

    const fc = new Canvas(canvasElRef.current, {
      width: dims.w,
      height: dims.h,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: true,
    });

    fabricRef.current = fc;

    fc.on('selection:created', (e) => setSelectedObject(e.selected?.[0] || null));
    fc.on('selection:updated', (e) => setSelectedObject(e.selected?.[0] || null));
    fc.on('selection:cleared', () => setSelectedObject(null));
    fc.on('object:modified', pushUndo);

    // Load existing page JSON
    const page = pages[currentPageIndex];
    if (page?.canvasJSON) {
      fc.loadFromJSON(page.canvasJSON).then(() => fc.renderAll());
    }

    return () => {
      if (fabricRef.current === fc) {
        fc.dispose();
        fabricRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize]);

  // ── Page switching ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    fc.clear();
    fc.backgroundColor = '#ffffff';
    const page = pages[currentPageIndex];
    if (page?.canvasJSON) {
      fc.loadFromJSON(page.canvasJSON).then(() => fc.renderAll());
    } else {
      fc.renderAll();
    }
    setSelectedObject(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageIndex]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    function handleKey(e) {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      if (mod && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); handleRedo(); }
      if (mod && e.key === 's') { e.preventDefault(); handleSave(); }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoStack, redoStack]);

  // ── Save current page to state ──────────────────────────────────────────────
  const saveCurrentPageToState = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const json = fc.toJSON(['id', 'name', 'custom']);
    const thumb = fc.toDataURL({ format: 'jpeg', quality: 0.5, multiplier: 0.3 });
    setPages(prev => prev.map((p, i) =>
      i === currentPageIndex ? { ...p, canvasJSON: json, thumbnailDataUrl: thumb } : p
    ));
  }, [currentPageIndex]);

  // ── Add elements ────────────────────────────────────────────────────────────
  const addElement = useCallback((variant, initialText) => {
    const fc = fabricRef.current;
    if (!fc) return;
    const defaults = ELEMENT_DEFAULTS[variant] || ELEMENT_DEFAULTS.text;

    let text = initialText;
    if (!text) {
      if (variant === 'heading') text = 'Your Headline';
      else if (variant === 'pullquote') text = '"A beautiful quote goes here"';
      else if (variant === 'caption') text = 'PHOTO CAPTION';
      else if (variant === 'subheading') text = 'Subheading';
      else if (variant === 'aitext') text = initialText || 'AI generated text';
      else text = 'Your text here';
    }

    const tb = new Textbox(text, {
      left: 60,
      top: 60,
      width: defaults.width || 300,
      fontSize: defaults.fontSize || 24,
      fontFamily: defaults.fontFamily || 'Cormorant Garamond',
      fill: defaults.fill || '#18120A',
      fontWeight: defaults.fontWeight || '400',
      fontStyle: defaults.fontStyle || 'normal',
      charSpacing: defaults.charSpacing || 0,
      lineHeight: 1.3,
      splitByGrapheme: false,
    });

    loadGoogleFont(defaults.fontFamily || 'Cormorant Garamond');
    fc.add(tb);
    fc.setActiveObject(tb);
    fc.renderAll();
    pushUndo();
  }, [pushUndo]);

  const addImage = useCallback(async (src) => {
    const fc = fabricRef.current;
    if (!fc) return;
    try {
      const img = await FabricImage.fromURL(src, { crossOrigin: 'anonymous' });
      const scale = (dims.w * 0.5) / img.width;
      img.set({ left: 60, top: 60, scaleX: scale, scaleY: scale });
      fc.add(img);
      fc.setActiveObject(img);
      fc.renderAll();
      pushUndo();
    } catch (e) {
      console.error('Failed to load image:', e);
    }
  }, [dims, pushUndo]);

  const addShape = useCallback((type) => {
    const fc = fabricRef.current;
    if (!fc) return;
    let shape;
    if (type === 'rect') {
      shape = new Rect({ left: 60, top: 60, width: 200, height: 120, fill: GOLD, rx: 0 });
    } else if (type === 'circle') {
      shape = new Circle({ left: 60, top: 60, radius: 60, fill: GOLD });
    } else if (type === 'line' || type === 'divider') {
      shape = new Line([0, 0, 200, 0], {
        left: 60, top: 100,
        stroke: GOLD,
        strokeWidth: type === 'divider' ? 1 : 2,
      });
    }
    if (shape) {
      fc.add(shape);
      fc.setActiveObject(shape);
      fc.renderAll();
      pushUndo();
    }
  }, [pushUndo]);

  function handleAddElement(variant, text) {
    if (['text', 'heading', 'caption', 'pullquote', 'subheading', 'aitext'].includes(variant)) {
      addElement(variant, text);
    } else if (['rect', 'circle', 'line', 'divider'].includes(variant)) {
      addShape(variant);
    }
  }

  function handleAddTemplate(templateId) {
    // Stub — templates can be wired to TemplatePicker later
    const fc = fabricRef.current;
    if (!fc) return;
    const label = new Textbox(`Template ${templateId + 1}`, {
      left: 60, top: 60,
      width: 400, fontSize: 32,
      fontFamily: 'Cormorant Garamond',
      fill: '#18120A',
    });
    fc.add(label);
    fc.setActiveObject(label);
    fc.renderAll();
    pushUndo();
  }

  // ── Undo / Redo ─────────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc || undoStack.length < 2) return;
    const prev = undoStack[undoStack.length - 2];
    const current = undoStack[undoStack.length - 1];
    setRedoStack(r => [...r, current]);
    setUndoStack(s => s.slice(0, -1));
    fc.loadFromJSON(prev).then(() => fc.renderAll());
  }, [undoStack]);

  const handleRedo = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc || redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(s => [...s, next]);
    setRedoStack(r => r.slice(0, -1));
    fc.loadFromJSON(next).then(() => fc.renderAll());
  }, [redoStack]);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true);
    saveCurrentPageToState();
    await new Promise(r => setTimeout(r, 80));
    setSaving(false);
  }, [saveCurrentPageToState]);

  // ── Digital Export ──────────────────────────────────────────────────────────
  const handleExportDigital = useCallback(async () => {
    if (!issue?.id) return;
    setExportingDigital(true);
    try {
      saveCurrentPageToState();
      await new Promise(r => setTimeout(r, 100));

      const renderVersion = (issue.render_version || 1) + 1;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const fc = fabricRef.current;
        if (!fc) break;

        if (page.canvasJSON) {
          await fc.loadFromJSON(page.canvasJSON);
          fc.renderAll();
        }

        const pageBlob = await canvasToJpegBlob(fc, 3);
        const thumbBlob = await canvasToJpegBlob(fc, 0.5);

        const { publicUrl: imageUrl, storagePath: imagePath } = await uploadPageImage(issue.id, renderVersion, i + 1, pageBlob);
        const { publicUrl: thumbUrl, storagePath: thumbPath } = await uploadThumbImage(issue.id, renderVersion, i + 1, thumbBlob);

        await upsertPage({
          issue_id: issue.id,
          page_number: i + 1,
          source_type: 'template',
          image_url: imageUrl,
          image_storage_path: imagePath,
          thumbnail_url: thumbUrl,
          thumbnail_storage_path: thumbPath,
          render_version: renderVersion,
          template_data: { engine: 'designer-v1', canvasJSON: page.canvasJSON },
        });
      }

      onIssueUpdate?.({ render_version: renderVersion, page_count: pages.length, processing_state: 'ready' });
      alert(`\u2713 ${pages.length} page${pages.length !== 1 ? 's' : ''} published to reader`);
    } catch (e) {
      console.error(e);
      alert('Export failed: ' + e.message);
    } finally {
      setExportingDigital(false);
    }
  }, [issue, pages, saveCurrentPageToState, onIssueUpdate]);

  // ── Print Export ────────────────────────────────────────────────────────────
  const handleExportPrint = useCallback(async () => {
    setExportingPrint(true);
    try {
      saveCurrentPageToState();
      await new Promise(r => setTimeout(r, 100));

      const printPages = [];
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const fc = fabricRef.current;
        if (!fc) break;
        if (page.canvasJSON) {
          await fc.loadFromJSON(page.canvasJSON);
          fc.renderAll();
        }
        const blob = await canvasToPrintJpegBlob(fc);
        printPages.push({ blob, pageSize });
      }

      const pdf = await generatePrintPDF(printPages, issue?.title || 'Magazine Issue', pageSize);
      downloadPDF(pdf, `${issue?.slug || 'issue'}_PRINT_READY.pdf`);
    } catch (e) {
      alert('Print export failed: ' + e.message);
    } finally {
      setExportingPrint(false);
    }
  }, [issue, pages, pageSize, saveCurrentPageToState]);

  // ── Page management ─────────────────────────────────────────────────────────
  function handleSelectPage(i) {
    saveCurrentPageToState();
    setCurrentPageIndex(i);
  }

  function handleAddPage() {
    saveCurrentPageToState();
    const newPage = {
      id: genId(),
      pageNumber: pages.length + 1,
      canvasJSON: null,
      thumbnailDataUrl: null,
      name: `Page ${pages.length + 1}`,
    };
    setPages(prev => [...prev, newPage]);
    setCurrentPageIndex(pages.length);
  }

  function handleDeletePage(i) {
    if (pages.length <= 1) return;
    setPages(prev => {
      const next = prev.filter((_, idx) => idx !== i);
      return next.map((p, idx) => ({ ...p, pageNumber: idx + 1, name: `Page ${idx + 1}` }));
    });
    setCurrentPageIndex(prev => Math.min(prev, pages.length - 2));
  }

  function handleDuplicatePage(i) {
    saveCurrentPageToState();
    setPages(prev => {
      const clone = { ...prev[i], id: genId() };
      const next = [...prev.slice(0, i + 1), clone, ...prev.slice(i + 1)];
      return next.map((p, idx) => ({ ...p, pageNumber: idx + 1, name: `Page ${idx + 1}` }));
    });
    setCurrentPageIndex(i + 1);
  }

  function handleReorderPage(from, to) {
    saveCurrentPageToState();
    setPages(prev => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next.map((p, idx) => ({ ...p, pageNumber: idx + 1, name: `Page ${idx + 1}` }));
    });
    setCurrentPageIndex(to);
  }

  // ── Page size change ────────────────────────────────────────────────────────
  function handlePageSizeChange(size) {
    saveCurrentPageToState();
    setPageSize(size);
  }

  // ── Zoom ────────────────────────────────────────────────────────────────────
  function handleZoomChange(z) {
    setZoom(z);
    const fc = fabricRef.current;
    if (!fc) return;
    fc.setZoom(z);
    fc.setWidth(dims.w * z);
    fc.setHeight(dims.h * z);
  }

  // ── Properties update ───────────────────────────────────────────────────────
  function handlePropertiesUpdate() {
    // Trigger thumbnail refresh after property changes
    const fc = fabricRef.current;
    if (!fc) return;
    const thumb = fc.toDataURL({ format: 'jpeg', quality: 0.5, multiplier: 0.3 });
    setPages(prev => prev.map((p, i) =>
      i === currentPageIndex ? { ...p, thumbnailDataUrl: thumb } : p
    ));
  }

  const RULER_SIZE = showRuler ? 20 : 0;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: '#141210',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Toolbar */}
      <DesignerToolbar
        issue={issue}
        pages={pages}
        currentPageIndex={currentPageIndex}
        canUndo={undoStack.length >= 2}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomChange={handleZoomChange}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(v => !v)}
        showRuler={showRuler}
        onToggleRuler={() => setShowRuler(v => !v)}
        onSave={handleSave}
        saving={saving}
        onExportDigital={handleExportDigital}
        exportingDigital={exportingDigital}
        onExportPrint={handleExportPrint}
        exportingPrint={exportingPrint}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Main area: panels + canvas */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Elements panel */}
        <ElementsPanel
          onAddElement={handleAddElement}
          onAddImage={addImage}
          onAddTemplate={handleAddTemplate}
          issue={issue}
        />

        {/* Canvas area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Ruler top row */}
          {showRuler && (
            <div style={{ display: 'flex', flexShrink: 0 }}>
              <div style={{ width: RULER_SIZE, height: RULER_SIZE, background: '#0D0C0A', flexShrink: 0 }} />
              <Ruler length={dims.w * zoom + 200} isVertical={false} scale={zoom} />
            </div>
          )}

          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
            {/* Ruler left */}
            {showRuler && (
              <Ruler length={dims.h * zoom + 200} isVertical scale={zoom} />
            )}

            {/* Scrollable canvas container */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              padding: 40,
              background: '#141210',
            }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <canvas ref={canvasElRef} />
                {showGrid && (
                  <GridOverlay
                    width={dims.w * zoom}
                    height={dims.h * zoom}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Properties panel */}
        <PropertiesPanel
          selectedObject={selectedObject}
          canvas={fabricRef.current}
          onUpdate={handlePropertiesUpdate}
        />
      </div>

      {/* Page list strip */}
      <PageListPanel
        pages={pages}
        currentPageIndex={currentPageIndex}
        onSelectPage={handleSelectPage}
        onAddPage={handleAddPage}
        onDeletePage={handleDeletePage}
        onDuplicatePage={handleDuplicatePage}
        onReorderPage={handleReorderPage}
      />
    </div>
  );
}
