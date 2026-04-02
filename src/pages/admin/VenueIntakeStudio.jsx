// ─────────────────────────────────────────────────────────────────────────────
// Venue Intake Studio
// Pipeline: Upload → Extract → Review → Convert to venue draft
// Always venue-specific. Never auto-publishes.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import * as intakeService from '../../services/intakeService';

const NU = "'Inter', 'SF Pro Display', -apple-system, sans-serif";

const STATUS = {
  new:        { label: 'New',        color: '#64b5f6', desc: 'Created, nothing processed yet' },
  processing: { label: 'Processing', color: '#ffb74d', desc: 'Extraction running' },
  review:     { label: 'Review',     color: '#c9a84c', desc: 'Ready for admin review' },
  approved:   { label: 'Approved',   color: '#81c784', desc: 'Approved, not yet converted' },
  converted:  { label: 'Converted',  color: '#4caf50', desc: 'Pushed into venue listing' },
};

const PROCESSING_MODES = [
  {
    key:   'original',
    label: 'Use original copy',
    desc:  'Keep wording from source — cleaned and formatted only where needed',
    icon:  '◈',
  },
  {
    key:   'refine',
    label: 'Refine copy',
    desc:  'Improve clarity and flow while staying close to the source material',
    icon:  '◇',
  },
  {
    key:   'rewrite',
    label: 'Rewrite in LWD tone',
    desc:  'Full rewrite in luxury editorial style — elevated, aspirational, polished',
    icon:  '✦',
    default: true,
  },
];

const PROCESS_STAGES = [
  { key: 'uploading',  label: 'Uploading files…' },
  { key: 'extracting', label: 'Extracting content…' },
  { key: 'mapping',    label: 'Mapping to venue schema…' },
  { key: 'preparing',  label: 'Preparing review…' },
];

const EMPTY_FORM = {
  document:       null,
  images:         [],
  videoUrls:      [''],
  websiteUrl:     '',
  pastedText:     '',
  venueName:      '',
  notes:          '',
  processingMode: 'rewrite',
  assignmentMode: 'new',         // 'new' | 'existing'
  existingListingId:   null,
  existingListingName: '',
};

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────

export default function VenueIntakeStudio({ C }) {
  const [view, setView]               = useState('list');
  const [jobs, setJobs]               = useState([]);
  const [loading, setLoading]         = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm]               = useState(EMPTY_FORM);
  const [processStage, setProcessStage] = useState(null); // null | 'uploading' | 'extracting' | 'mapping' | 'preparing'
  const [currentJob, setCurrentJob]   = useState(null);
  const [extracted, setExtracted]     = useState(null);
  const [copyMode, setCopyMode]       = useState('rewrite');
  const [pushing, setPushing]         = useState(false);
  const [error, setError]             = useState(null);

  const docInputRef = useRef(null);
  const imgInputRef = useRef(null);

  useEffect(() => { loadJobs(); }, []);

  async function loadJobs() {
    setLoading(true);
    try {
      const data = await intakeService.fetchIntakeJobs();
      setJobs(data);
    } catch (e) {
      console.error('[VenueIntakeStudio]', e);
    } finally {
      setLoading(false);
    }
  }

  // ── Form handlers ──────────────────────────────────────────────────────────

  const setF = patch => setForm(f => ({ ...f, ...patch }));

  function handleDocDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) setF({ document: file });
  }

  function handleImgSelect(e) {
    const files = Array.from(e.target.files);
    setForm(f => ({ ...f, images: [...f.images, ...files] }));
  }

  const addVideo    = () => setForm(f => ({ ...f, videoUrls: [...f.videoUrls, ''] }));
  const removeVideo = i  => setForm(f => ({ ...f, videoUrls: f.videoUrls.filter((_, j) => j !== i) }));
  const updateVideo = (i, v) => setForm(f => {
    const a = [...f.videoUrls]; a[i] = v; return { ...f, videoUrls: a };
  });

  // ── Process intake ─────────────────────────────────────────────────────────

  async function handleProcess() {
    setError(null);
    let job = null;

    try {
      // Stage 1: upload
      setProcessStage('uploading');
      job = await intakeService.createIntakeJob({
        listing_type:   'venue',
        status:         'processing',
        notes:          form.notes || null,
        video_urls:     form.videoUrls.filter(v => v.trim()),
        website_url:    form.websiteUrl || null,
        pasted_text:    form.pastedText || null,
        copy_mode:      form.processingMode,
        listing_id:     form.assignmentMode === 'existing' ? form.existingListingId : null,
      });

      let docUrl = null, docName = null, docType = null;
      if (form.document) {
        const r = await intakeService.uploadIntakeDocument(form.document, job.id);
        docUrl  = r.url;
        docName = form.document.name;
        docType = intakeService.getDocumentType(form.document);
        await intakeService.updateIntakeJob(job.id, { document_url: docUrl, document_name: docName, document_type: docType });
      }

      let imageUrls = [];
      if (form.images.length > 0) {
        imageUrls = await intakeService.uploadIntakeImages(form.images, job.id);
        await intakeService.updateIntakeJob(job.id, { image_urls: imageUrls });
      }

      // Stage 2: extract
      setProcessStage('extracting');
      const result = await intakeService.runExtraction({
        jobId:        job.id,
        // listing_id enables enhance/learning mode in the edge function —
        // the AI will load existing listing data and build on it rather than starting from scratch
        listingId:    job.listing_id || null,
        document:     form.document,
        documentType: docType,
        videoUrls:    form.videoUrls.filter(v => v.trim()),
        websiteUrl:   form.websiteUrl,
        pastedText:   form.pastedText,
        venueName:    form.venueName,
        listingType:  'venue',
      });

      // Stage 3: mapping
      setProcessStage('mapping');
      await intakeService.updateIntakeJob(job.id, {
        extracted_json:  result.extracted,
        extraction_meta: result.meta,
        raw_text:        result.rawText,
        image_urls:      imageUrls,
        status:          'review',
      });

      // Stage 4: prepare
      setProcessStage('preparing');
      await new Promise(r => setTimeout(r, 600)); // brief visual pause

      setCurrentJob({ ...job, image_urls: imageUrls, video_urls: form.videoUrls.filter(v => v.trim()) });
      setExtracted(result.extracted);
      setCopyMode(form.processingMode);
      setProcessStage(null);
      setView('review');

    } catch (e) {
      setError(e.message || 'Processing failed. Please try again.');
      setProcessStage(null);
      if (job?.id) {
        await intakeService.updateIntakeJob(job.id, { status: 'new', notes: `Error: ${e.message}` }).catch(() => {});
      }
    }
  }

  // ── Convert to listing ─────────────────────────────────────────────────────

  async function handleConvert() {
    if (!currentJob || !extracted) return;
    setError(null);
    setPushing(true);
    try {
      const listingId = await intakeService.pushToListing({
        job:          currentJob,
        extractedData: extracted,
        copyMode,
        imageUrls:    currentJob.image_urls || [],
        videoUrls:    currentJob.video_urls || [],
      });
      await intakeService.updateIntakeJob(currentJob.id, {
        status:     'converted',
        pushed_at:  new Date().toISOString(),
        listing_id: listingId,
        copy_mode:  copyMode,
      });
      window.location.hash = `listing-studio/${listingId}`;
    } catch (e) {
      setError(e.message || 'Failed to create venue listing.');
    } finally {
      setPushing(false);
    }
  }

  // ── View routing ───────────────────────────────────────────────────────────

  if (view === 'new') {
    return (
      <NewIntakeView
        C={C}
        form={form}
        setF={setF}
        setForm={setForm}
        processStage={processStage}
        error={error}
        docInputRef={docInputRef}
        imgInputRef={imgInputRef}
        onBack={() => { setError(null); setProcessStage(null); setView('list'); }}
        onDocDrop={handleDocDrop}
        onDocSelect={e => { const f = e.target.files[0]; if (f) setF({ document: f }); }}
        onImgSelect={handleImgSelect}
        addVideo={addVideo}
        removeVideo={removeVideo}
        updateVideo={updateVideo}
        onProcess={handleProcess}
      />
    );
  }

  if (view === 'review') {
    return (
      <ReviewView
        C={C}
        job={currentJob}
        extracted={extracted}
        setExtracted={setExtracted}
        copyMode={copyMode}
        setCopyMode={setCopyMode}
        pushing={pushing}
        error={error}
        onBack={() => { loadJobs(); setView('list'); }}
        onConvert={handleConvert}
      />
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────

  const filtered = statusFilter === 'all' ? jobs : jobs.filter(j => j.status === statusFilter);

  return (
    <div style={{ fontFamily: NU }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ color: C.white, fontSize: 22, fontWeight: 700, margin: '0 0 5px', letterSpacing: -0.3 }}>
            Venue Intake Studio
          </h1>
          <p style={{ color: C.grey, fontSize: 13, margin: 0 }}>
            Upload a brochure, document, or website — AI extracts and maps it to the venue schema.
          </p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setError(null); setProcessStage(null); setView('new'); }}
          style={btnPrimary(C)}
        >
          + New Intake
        </button>
      </div>

      {/* Pipeline indicator */}
      <PipelineIndicator C={C} />

      {/* Status filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {['all', ...Object.keys(STATUS)].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              background:    statusFilter === s ? C.gold : 'transparent',
              color:         statusFilter === s ? C.black : C.grey,
              border:        `1px solid ${statusFilter === s ? C.gold : C.border}`,
              borderRadius:  3, padding: '5px 13px',
              fontFamily:    NU, fontSize: 11, fontWeight: 700,
              cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5,
            }}
          >
            {s === 'all' ? `All (${jobs.length})` : STATUS[s].label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ color: C.grey, fontSize: 13, textAlign: 'center', padding: 80 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <EmptyState C={C} onNew={() => { setForm(EMPTY_FORM); setError(null); setView('new'); }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={tableHeader(C)}>
            <span>Venue / Document</span>
            <span>Source</span>
            <span>Mode</span>
            <span>Status</span>
            <span>Created</span>
            <span></span>
          </div>
          {filtered.map(job => {
            const sc       = STATUS[job.status] || STATUS.new;
            const name     = job.extracted_json?.venue_name || job.document_name || 'Untitled intake';
            const sourceType = job.document_name ? (job.document_type?.toUpperCase() || 'DOC') : job.website_url ? 'URL' : job.pasted_text ? 'PASTE' : '—';
            const mode     = PROCESSING_MODES.find(m => m.key === job.copy_mode);
            return (
              <div
                key={job.id}
                style={tableRow(C)}
                onClick={() => {
                  setCurrentJob(job);
                  setExtracted(job.extracted_json);
                  setCopyMode(job.copy_mode || 'rewrite');
                  setView('review');
                }}
              >
                <div>
                  <div style={{ color: C.white, fontSize: 14, fontWeight: 600 }}>{name}</div>
                  {job.document_name && <div style={{ color: C.grey, fontSize: 11, marginTop: 2 }}>{job.document_name}</div>}
                </div>
                <div style={{ color: C.grey, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>{sourceType}</div>
                <div style={{ color: C.grey, fontSize: 11 }}>{mode?.label || '—'}</div>
                <div><StatusBadge status={job.status} /></div>
                <div style={{ color: C.grey, fontSize: 12 }}>
                  {new Date(job.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 700 }}>
                  {job.status === 'review'     && <span style={{ color: C.gold }}>Review →</span>}
                  {job.status === 'approved'   && <span style={{ color: '#81c784' }}>Convert →</span>}
                  {job.status === 'converted'  && <span style={{ color: '#4caf50' }}>✓ Converted</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// New Intake Form — three sections
// ─────────────────────────────────────────────────────────────────────────────

function NewIntakeView({
  C, form, setF, setForm, processStage, error,
  docInputRef, imgInputRef,
  onBack, onDocDrop, onDocSelect, onImgSelect,
  addVideo, removeVideo, updateVideo, onProcess,
}) {
  const [listingSearch, setListingSearch]   = useState('');
  const [listingResults, setListingResults] = useState([]);
  const [searchLoading, setSearchLoading]   = useState(false);

  const isProcessing = !!processStage;
  const hasSource = form.document || form.websiteUrl.trim() || form.pastedText.trim();
  const currentStage = PROCESS_STAGES.find(s => s.key === processStage);

  // Search existing listings
  useEffect(() => {
    if (form.assignmentMode !== 'existing' || listingSearch.length < 2) {
      setListingResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        // Route through admin edge function (service_role bypasses RLS)
        const { data: fnData } = await supabase.functions.invoke('admin-listings', {
          body: { action: 'search', nameQuery: listingSearch, limit: 8 },
        });
        setListingResults(fnData?.data || []);
      } catch { setListingResults([]); }
      finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [listingSearch, form.assignmentMode]);

  return (
    <div style={{ fontFamily: NU, maxWidth: 780 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
        <button onClick={onBack} disabled={isProcessing} style={btnBack(C)}>←</button>
        <div>
          <h1 style={{ color: C.white, fontSize: 20, fontWeight: 700, margin: 0 }}>New Venue Intake</h1>
          <p style={{ color: C.grey, fontSize: 13, margin: '4px 0 0' }}>
            Provide source material — AI extracts, structures, and maps to the venue schema.
          </p>
        </div>
      </div>

      {/* Processing overlay */}
      {isProcessing && (
        <div style={{ background: C.card, border: `1px solid ${C.gold}44`, borderRadius: 8, padding: '28px 24px', marginBottom: 28, textAlign: 'center' }}>
          <div style={{ color: C.gold, fontSize: 28, marginBottom: 12, animation: 'spin 1s linear infinite' }}>⟳</div>
          <div style={{ color: C.white, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{currentStage?.label}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
            {PROCESS_STAGES.map((s, i) => {
              const stageIdx   = PROCESS_STAGES.findIndex(x => x.key === processStage);
              const thisIdx    = i;
              const isDone     = thisIdx < stageIdx;
              const isActive   = thisIdx === stageIdx;
              return (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: isDone ? '#81c784' : isActive ? C.gold : C.border,
                    transition: 'background 0.3s',
                  }} />
                  <span style={{ color: isDone ? '#81c784' : isActive ? C.gold : C.grey, fontSize: 11, fontWeight: isActive ? 700 : 400 }}>
                    {s.label}
                  </span>
                  {i < PROCESS_STAGES.length - 1 && <span style={{ color: C.border, fontSize: 11 }}>→</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && !isProcessing && <ErrorBanner msg={error} />}

      {/* ── SECTION 1: Source Input ── */}
      <SectionHeader number="1" title="Source Input" desc="Provide one or more sources — all will be merged for extraction" C={C} />

      <Field label="Venue name" hint="Optional — improves extraction accuracy and listing naming" C={C}>
        <input
          value={form.venueName}
          onChange={e => setF({ venueName: e.target.value })}
          placeholder="e.g. Villa d'Este, Lake Como"
          disabled={isProcessing}
          style={inputStyle(C)}
        />
      </Field>

      <Field label="Upload document" hint=".docx, .pdf, or .txt — AI reads the full file" C={C}>
        <div
          onDrop={onDocDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => !isProcessing && docInputRef.current?.click()}
          style={{
            border:       `2px dashed ${form.document ? C.gold : C.border}`,
            borderRadius: 6, padding: 24, textAlign: 'center',
            cursor:       isProcessing ? 'not-allowed' : 'pointer',
            background:   form.document ? C.gold + '0a' : C.card,
            transition:   'border-color 0.2s',
            opacity:      isProcessing ? 0.6 : 1,
          }}
        >
          {form.document ? (
            <div>
              <div style={{ fontSize: 24, marginBottom: 5 }}>📄</div>
              <div style={{ color: C.white, fontSize: 14, fontWeight: 600 }}>{form.document.name}</div>
              <div style={{ color: C.grey, fontSize: 11, marginTop: 2 }}>{(form.document.size / 1024).toFixed(1)} KB</div>
              <button
                onClick={e => { e.stopPropagation(); setF({ document: null }); }}
                style={{ marginTop: 8, background: 'transparent', border: `1px solid ${C.border}`, color: C.grey, borderRadius: 3, padding: '3px 10px', fontSize: 11, cursor: 'pointer', fontFamily: NU }}
              >Remove</button>
            </div>
          ) : (
            <div>
              <div style={{ color: C.grey, fontSize: 26, marginBottom: 6 }}>⬆</div>
              <div style={{ color: C.white, fontSize: 13, fontWeight: 600 }}>Drop document here or click to browse</div>
              <div style={{ color: C.grey, fontSize: 12, marginTop: 3 }}>.docx · .pdf · .txt</div>
            </div>
          )}
        </div>
        <input ref={docInputRef} type="file" accept=".docx,.pdf,.txt" style={{ display: 'none' }} onChange={onDocSelect} />
      </Field>

      <Field label="Venue website URL" hint="We will scan key pages and extract structured content" C={C}>
        <input
          value={form.websiteUrl}
          onChange={e => setF({ websiteUrl: e.target.value })}
          placeholder="https://www.venuename.com"
          disabled={isProcessing}
          style={inputStyle(C)}
        />
      </Field>

      <Field label="Paste content" hint="Use this for press releases, brochures, or copied website text" C={C}>
        <textarea
          value={form.pastedText}
          onChange={e => setF({ pastedText: e.target.value })}
          placeholder="Paste venue copy, press releases, or any additional information here…"
          rows={4}
          disabled={isProcessing}
          style={{ ...inputStyle(C), resize: 'vertical', lineHeight: 1.65 }}
        />
      </Field>

      <Field label="Venue images" hint="These will be attached to the listing gallery" C={C}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          {form.images.map((img, i) => (
            <div key={i} style={{ position: 'relative', width: 88, height: 72, borderRadius: 4, overflow: 'hidden', background: C.card, border: `1px solid ${C.border}` }}>
              <img src={URL.createObjectURL(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.75)', border: 'none', color: '#fff', borderRadius: 2, width: 18, height: 18, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >×</button>
            </div>
          ))}
          <div
            onClick={() => !isProcessing && imgInputRef.current?.click()}
            style={{ width: 88, height: 72, borderRadius: 4, border: `2px dashed ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isProcessing ? 'not-allowed' : 'pointer', color: C.grey, fontSize: 22, background: C.card }}
          >+</div>
        </div>
        <input ref={imgInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onImgSelect} />
      </Field>

      <Field label="Video URLs" hint="YouTube, Vimeo, or direct links — attached to venue gallery" C={C}>
        {form.videoUrls.map((url, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              value={url}
              onChange={e => updateVideo(i, e.target.value)}
              placeholder="https://youtube.com/watch?v=…"
              disabled={isProcessing}
              style={{ ...inputStyle(C), flex: 1 }}
            />
            {form.videoUrls.length > 1 && (
              <button onClick={() => removeVideo(i)} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.grey, borderRadius: 3, padding: '0 14px', cursor: 'pointer', fontSize: 16, fontFamily: NU }}>×</button>
            )}
          </div>
        ))}
        <button onClick={addVideo} disabled={isProcessing} style={btnGhost(C)}>+ Add video URL</button>
      </Field>

      {/* ── SECTION 2: Assignment ── */}
      <SectionHeader number="2" title="Listing Assignment" desc="Where should this intake create or update a venue listing?" C={C} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { key: 'new',      label: 'Create new venue listing', desc: 'Start a fresh draft listing from this intake' },
          { key: 'existing', label: 'Attach to existing venue', desc: 'Update or supplement an existing venue record' },
        ].map(opt => (
          <button
            key={opt.key}
            onClick={() => setF({ assignmentMode: opt.key })}
            disabled={isProcessing}
            style={{
              background:   form.assignmentMode === opt.key ? C.gold + '14' : 'transparent',
              border:       `2px solid ${form.assignmentMode === opt.key ? C.gold : C.border}`,
              borderRadius: 5, padding: '14px 16px', cursor: 'pointer',
              textAlign: 'left', fontFamily: NU,
            }}
          >
            <div style={{ color: form.assignmentMode === opt.key ? C.gold : C.white, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{opt.label}</div>
            <div style={{ color: C.grey, fontSize: 12, lineHeight: 1.5 }}>{opt.desc}</div>
          </button>
        ))}
      </div>

      {form.assignmentMode === 'existing' && (
        <div style={{ marginBottom: 20, position: 'relative' }}>
          <input
            value={listingSearch}
            onChange={e => setListingSearch(e.target.value)}
            placeholder="Search venue listings by name…"
            disabled={isProcessing}
            style={{ ...inputStyle(C), marginBottom: 0 }}
          />
          {form.existingListingName && (
            <div style={{ marginTop: 8, background: C.gold + '14', border: `1px solid ${C.gold}44`, borderRadius: 4, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: C.gold, fontSize: 13, fontWeight: 600 }}>✓ {form.existingListingName}</span>
              <button onClick={() => setF({ existingListingId: null, existingListingName: '' })} style={{ background: 'transparent', border: 'none', color: C.grey, cursor: 'pointer', fontSize: 16, fontFamily: NU }}>×</button>
            </div>
          )}
          {listingResults.length > 0 && !form.existingListingId && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, zIndex: 10, marginTop: 2 }}>
              {listingResults.map(l => (
                <div
                  key={l.id}
                  onClick={() => { setF({ existingListingId: l.id, existingListingName: l.name }); setListingSearch(''); setListingResults([]); }}
                  style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = C.border}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ color: C.white, fontSize: 13, fontWeight: 600 }}>{l.name}</div>
                  {(l.city || l.country) && <div style={{ color: C.grey, fontSize: 11, marginTop: 2 }}>{[l.city, l.country].filter(Boolean).join(', ')}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 3: Processing Mode ── */}
      <SectionHeader number="3" title="Processing Mode" desc="How should AI treat the source content?" C={C} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
        {PROCESSING_MODES.map(mode => (
          <button
            key={mode.key}
            onClick={() => setF({ processingMode: mode.key })}
            disabled={isProcessing}
            style={{
              background:   form.processingMode === mode.key ? C.gold + '14' : 'transparent',
              border:       `2px solid ${form.processingMode === mode.key ? C.gold : C.border}`,
              borderRadius: 5, padding: '14px 16px', cursor: 'pointer',
              textAlign: 'left', fontFamily: NU, display: 'flex', alignItems: 'flex-start', gap: 14,
            }}
          >
            <div style={{ color: form.processingMode === mode.key ? C.gold : C.grey, fontSize: 18, marginTop: 1, flexShrink: 0 }}>{mode.icon}</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: form.processingMode === mode.key ? C.gold : C.white, fontSize: 13, fontWeight: 700 }}>{mode.label}</span>
                {mode.default && <span style={{ background: C.gold + '22', color: C.gold, border: `1px solid ${C.gold}44`, borderRadius: 3, padding: '1px 7px', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>RECOMMENDED</span>}
              </div>
              <div style={{ color: C.grey, fontSize: 12, marginTop: 3, lineHeight: 1.5 }}>{mode.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Notes */}
      <Field label="Internal notes" hint="Optional — visible to admin team only" C={C}>
        <textarea
          value={form.notes}
          onChange={e => setF({ notes: e.target.value })}
          placeholder="Any context for the team…"
          rows={2}
          disabled={isProcessing}
          style={{ ...inputStyle(C), resize: 'vertical' }}
        />
      </Field>

      {/* CTA */}
      <div style={{ display: 'flex', gap: 12, marginTop: 32, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
        <button
          onClick={onProcess}
          disabled={isProcessing || !hasSource}
          style={{
            ...btnPrimary(C),
            opacity:    (!hasSource || isProcessing) ? 0.45 : 1,
            cursor:     (!hasSource || isProcessing) ? 'not-allowed' : 'pointer',
            padding:    '13px 32px',
            fontSize:   14,
          }}
        >
          {isProcessing ? currentStage?.label || 'Processing…' : 'Process Intake →'}
        </button>
        {!hasSource && (
          <span style={{ color: C.grey, fontSize: 12, alignSelf: 'center' }}>Add a document, website URL, or pasted content to continue</span>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Review Screen — mapped to real venue schema
// ─────────────────────────────────────────────────────────────────────────────

function ReviewView({ C, job, extracted, setExtracted, copyMode, setCopyMode, pushing, error, onBack, onConvert }) {
  const d         = extracted || {};
  const meta      = d._meta  || {};
  const imageUrls = job?.image_urls || [];
  const videoUrls = (job?.video_urls || []).filter(v => v.trim());
  const missing   = meta.missing_fields || [];
  const confidence = meta.extraction_confidence || 'medium';
  const confColor  = confidence === 'high' ? '#81c784' : confidence === 'medium' ? '#ffb74d' : '#ef5350';

  function update(key, value) {
    setExtracted(prev => ({ ...prev, [key]: value }));
  }

  function updateContact(key, value) {
    setExtracted(prev => ({ ...prev, contact_profile: { ...(prev.contact_profile || {}), [key]: value } }));
  }

  const modeConfig = PROCESSING_MODES.find(m => m.key === copyMode) || PROCESSING_MODES[2];

  return (
    <div style={{ fontFamily: NU }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={onBack} style={btnBack(C)}>←</button>
          <div>
            <h1 style={{ color: C.white, fontSize: 20, fontWeight: 700, margin: 0 }}>
              {d.venue_name || 'Review Extracted Data'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <span style={{ background: confColor + '22', color: confColor, border: `1px solid ${confColor}44`, borderRadius: 3, padding: '2px 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                {confidence} confidence
              </span>
              {missing.length > 0 && (
                <span style={{ color: '#ffb74d', fontSize: 12 }}>⚠ {missing.length} field{missing.length !== 1 ? 's' : ''} not found</span>
              )}
              <span style={{ color: C.grey, fontSize: 12 }}>Mode: <span style={{ color: modeConfig.label.includes('LWD') ? C.gold : C.white }}>{modeConfig.label}</span></span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {error && <span style={{ color: '#ef5350', fontSize: 12 }}>{error}</span>}
          <button onClick={onConvert} disabled={pushing} style={{ ...btnPrimary(C), opacity: pushing ? 0.6 : 1, cursor: pushing ? 'not-allowed' : 'pointer' }}>
            {pushing ? '⟳ Creating draft…' : 'Create Venue Draft →'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

        {/* Left: venue schema sections */}
        <div>

          {/* Copy mode */}
          <div style={card(C, { marginBottom: 16 })}>
            <div style={sectionLabel}>Processing Mode</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {PROCESSING_MODES.map(m => (
                <button key={m.key} onClick={() => setCopyMode(m.key)}
                  style={{ flex: 1, background: copyMode === m.key ? C.gold + '14' : 'transparent', border: `2px solid ${copyMode === m.key ? C.gold : C.border}`, borderRadius: 4, padding: '10px 10px', cursor: 'pointer', textAlign: 'left', fontFamily: NU }}>
                  <div style={{ color: copyMode === m.key ? C.gold : C.white, fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{m.label}</div>
                  <div style={{ color: C.grey, fontSize: 11, lineHeight: 1.4 }}>{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <ReviewSection title="Venue Name & Location" C={C}>
            <EF label="Venue name"     value={d.venue_name}  onChange={v => update('venue_name', v)}  missing={!d.venue_name}  C={C} />
            <EF label="City"           value={d.city}        onChange={v => update('city', v)}        missing={!d.city}        C={C} />
            <EF label="Region"         value={d.region}      onChange={v => update('region', v)}      missing={!d.region}      C={C} />
            <EF label="Country"        value={d.country}     onChange={v => update('country', v)}     missing={!d.country}     C={C} />
            <EF label="Address"        value={d.address}     onChange={v => update('address', v)}                              C={C} />
            <EF label="Postcode"       value={d.postcode}    onChange={v => update('postcode', v)}                             C={C} />
          </ReviewSection>

          <ReviewSection title="Intro & Description" C={C}>
            <EF label="Summary (intro)"   value={d.summary}     onChange={v => update('summary', v)}     missing={!d.summary} C={C} multiLine hint="Max 240 chars — shown in listing cards" />
            <div style={{ marginTop: 10 }}>
              <div style={{ color: C.grey, fontSize: 11, marginBottom: 6 }}>
                Main description {!d.description && <span style={{ color: '#ef5350', marginLeft: 6 }}>— not found</span>}
              </div>
              <textarea
                defaultValue={d.description ? d.description.replace(/<[^>]+>/g, '') : ''}
                onBlur={e => update('description', `<p>${e.target.value}</p>`)}
                rows={5}
                placeholder="Main venue description…"
                style={{ ...inputStyle(C), resize: 'vertical', lineHeight: 1.65, fontSize: 13 }}
              />
            </div>
          </ReviewSection>

          <ReviewSection title="Capacity & Pricing" C={C}>
            <EF label="Capacity"    value={d.capacity}    onChange={v => update('capacity', v)}    C={C} hint="e.g. Up to 200 guests seated" />
            <EF label="Price range" value={d.price_range} onChange={v => update('price_range', v)} C={C} hint="e.g. From £15,000 exclusive use" />
          </ReviewSection>

          <ReviewSection title="Rooms & Accommodation" C={C}>
            <EF label="Total rooms"   value={d.rooms_total}       onChange={v => update('rooms_total', v)}       C={C} />
            <EF label="Suites"        value={d.rooms_suites}      onChange={v => update('rooms_suites', v)}      C={C} />
            <EF label="Max guests"    value={d.rooms_max_guests}  onChange={v => update('rooms_max_guests', v)}  C={C} />
            <EF label="Description"   value={d.rooms_description ? d.rooms_description.replace(/<[^>]+>/g, '') : ''} onChange={v => update('rooms_description', v)} C={C} multiLine />
          </ReviewSection>

          <ReviewSection title="Dining" C={C}>
            <EF label="Dining style" value={d.dining_style}     onChange={v => update('dining_style', v)}     C={C} />
            <EF label="Head chef"    value={d.dining_chef_name} onChange={v => update('dining_chef_name', v)} C={C} />
            <ToggleField label="In-house catering" value={d.dining_in_house} onChange={v => update('dining_in_house', v)} C={C} />
            <EF label="Description"  value={d.dining_description ? d.dining_description.replace(/<[^>]+>/g, '') : ''} onChange={v => update('dining_description', v)} C={C} multiLine />
          </ReviewSection>

          {d.spaces?.length > 0 && (
            <ReviewSection title={`Venue Spaces (${d.spaces.length})`} C={C}>
              {d.spaces.map((space, i) => (
                <div key={i} style={{ background: C.black, borderRadius: 4, padding: '12px 14px', marginBottom: 8 }}>
                  <div style={{ color: C.gold, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    {space.name || `Space ${i + 1}`}
                    {space.type && <span style={{ color: C.grey, fontWeight: 400, marginLeft: 8 }}>· {space.type}</span>}
                  </div>
                  {space.description && <div style={{ color: C.grey, fontSize: 12, marginBottom: 6 }}>{space.description}</div>}
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    {[['Ceremony', space.capacityCeremony], ['Reception', space.capacityReception], ['Dining', space.capacityDining]].map(([l, v]) =>
                      v ? <span key={l} style={{ color: C.grey, fontSize: 11 }}>{l}: <span style={{ color: C.white }}>{v}</span></span> : null
                    )}
                    {space.indoor !== null && <span style={{ color: C.grey, fontSize: 11 }}>{space.indoor ? '🏛 Indoor' : '🌿 Outdoor'}</span>}
                  </div>
                </div>
              ))}
            </ReviewSection>
          )}

          <ReviewSection title="Features & Amenities" C={C}>
            <EF label="Amenities" value={d.amenities} onChange={v => update('amenities', v)} C={C} multiLine hint="Comma-separated" />
          </ReviewSection>

          <ReviewSection title="Exclusive Use" C={C}>
            <ToggleField label="Exclusive use available" value={d.exclusive_use_enabled} onChange={v => update('exclusive_use_enabled', v)} C={C} />
            {d.exclusive_use_enabled && (
              <>
                <EF label="Title"   value={d.exclusive_use_title}   onChange={v => update('exclusive_use_title', v)}   C={C} />
                <EF label="Price"   value={d.exclusive_use_price}   onChange={v => update('exclusive_use_price', v)}   C={C} />
                <EF label="Subline" value={d.exclusive_use_subline} onChange={v => update('exclusive_use_subline', v)} C={C} />
              </>
            )}
          </ReviewSection>

          {d.faq_categories?.length > 0 && (
            <ReviewSection title={`FAQs (${d.faq_categories.reduce((a, c) => a + (c.questions?.length || 0), 0)} questions)`} C={C}>
              {d.faq_categories.map((cat, ci) => (
                <div key={ci} style={{ marginBottom: 10 }}>
                  <div style={{ color: C.gold, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{cat.category}</div>
                  {cat.questions?.map((q, qi) => (
                    <div key={qi} style={{ background: C.black, borderRadius: 4, padding: '9px 12px', marginBottom: 5 }}>
                      <div style={{ color: C.white, fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{q.q}</div>
                      <div style={{ color: C.grey, fontSize: 12, lineHeight: 1.55 }}>{q.a}</div>
                    </div>
                  ))}
                </div>
              ))}
            </ReviewSection>
          )}

          <ReviewSection title="SEO" C={C}>
            <EF label="SEO title"       value={d.seo_title}       onChange={v => update('seo_title', v)}       missing={!d.seo_title}       C={C} hint="Max 60 chars" />
            <EF label="SEO description" value={d.seo_description} onChange={v => update('seo_description', v)} missing={!d.seo_description} C={C} hint="150–160 chars" />
            <EF label="Keywords"        value={d.seo_keywords?.join(', ')} onChange={v => update('seo_keywords', v.split(',').map(s => s.trim()).filter(Boolean))} C={C} hint="Comma-separated" />
          </ReviewSection>

          <ReviewSection title="Contact" C={C}>
            <EF label="Name"      value={d.contact_profile?.name}      onChange={v => updateContact('name', v)}      C={C} />
            <EF label="Title"     value={d.contact_profile?.title}     onChange={v => updateContact('title', v)}     C={C} />
            <EF label="Email"     value={d.contact_profile?.email}     onChange={v => updateContact('email', v)}     C={C} />
            <EF label="Phone"     value={d.contact_profile?.phone}     onChange={v => updateContact('phone', v)}     C={C} />
            <EF label="Website"   value={d.contact_profile?.website}   onChange={v => updateContact('website', v)}   C={C} />
            <EF label="Instagram" value={d.contact_profile?.instagram} onChange={v => updateContact('instagram', v)} C={C} />
          </ReviewSection>

          {missing.length > 0 && (
            <div style={{ background: '#ffb74d0d', border: '1px solid #ffb74d33', borderRadius: 6, padding: 16, marginTop: 8 }}>
              <div style={{ color: '#ffb74d', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>⚠ Fields not found in source</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {missing.map(f => <span key={f} style={{ background: '#ffb74d14', color: '#ffb74d', border: '1px solid #ffb74d30', borderRadius: 3, padding: '2px 8px', fontSize: 11 }}>{f}</span>)}
              </div>
              <div style={{ color: C.grey, fontSize: 11, marginTop: 8 }}>Fill these in after the draft listing is created.</div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ position: 'sticky', top: 24 }}>
          {imageUrls.length > 0 && (
            <div style={card(C, { marginBottom: 14 })}>
              <div style={sectionLabel}>{imageUrls.length} image{imageUrls.length !== 1 ? 's' : ''}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                {imageUrls.map((url, i) => (
                  <div key={i} style={{ aspectRatio: '4/3', borderRadius: 3, overflow: 'hidden', background: C.black }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {videoUrls.length > 0 && (
            <div style={card(C, { marginBottom: 14 })}>
              <div style={sectionLabel}>{videoUrls.length} video{videoUrls.length !== 1 ? 's' : ''}</div>
              {videoUrls.map((url, i) => (
                <div key={i} style={{ background: C.black, borderRadius: 3, padding: '7px 10px', marginBottom: 5 }}>
                  <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#64b5f6', fontSize: 11, wordBreak: 'break-all', textDecoration: 'none' }}>{url}</a>
                </div>
              ))}
            </div>
          )}

          {meta.sources_used?.length > 0 && (
            <div style={card(C, { marginBottom: 14 })}>
              <div style={sectionLabel}>Sources analysed</div>
              {meta.sources_used.map((s, i) => (
                <div key={i} style={{ color: C.grey, fontSize: 12, padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>{s}</div>
              ))}
            </div>
          )}

          <button onClick={onConvert} disabled={pushing} style={{ ...btnPrimary(C), width: '100%', textAlign: 'center', opacity: pushing ? 0.6 : 1 }}>
            {pushing ? '⟳ Creating draft…' : 'Create Venue Draft →'}
          </button>
          <p style={{ color: C.grey, fontSize: 11, marginTop: 8, textAlign: 'center', lineHeight: 1.5 }}>
            Always creates as draft. Opens in Listing Studio for final review before publishing.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline indicator
// ─────────────────────────────────────────────────────────────────────────────

function PipelineIndicator({ C }) {
  const steps = [
    { label: 'Upload',  sub: 'Document, URL, or paste' },
    { label: 'Extract', sub: 'AI maps to venue schema' },
    { label: 'Review',  sub: 'Edit and approve' },
    { label: 'Convert', sub: 'Draft listing created' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '14px 20px', marginBottom: 24 }}>
      {steps.map((step, i) => (
        <div key={step.label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.white, fontSize: 12, fontWeight: 700 }}>{step.label}</div>
            <div style={{ color: C.grey, fontSize: 10, marginTop: 2 }}>{step.sub}</div>
          </div>
          {i < steps.length - 1 && (
            <div style={{ color: C.gold, fontSize: 16, marginX: 12, flexShrink: 0, padding: '0 10px' }}>→</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ number, title, desc, C }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.gold, color: C.black, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>{number}</div>
      <div>
        <div style={{ color: C.white, fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{title}</div>
        <div style={{ color: C.grey, fontSize: 12 }}>{desc}</div>
      </div>
    </div>
  );
}

function ReviewSection({ title, children, C }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: 18, marginBottom: 12 }}>
      <div style={{ color: C.gold, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

// Editable field (click to edit inline)
function EF({ label, value, onChange, missing, C, multiLine, hint }) {
  const [editing, setEditing] = useState(false);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 10, padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
      <div>
        <div style={{ color: C.grey, fontSize: 12 }}>{label}</div>
        {hint && <div style={{ color: C.grey + '88', fontSize: 10, marginTop: 1 }}>{hint}</div>}
      </div>
      <div>
        {editing ? (
          multiLine ? (
            <textarea autoFocus defaultValue={value || ''} onBlur={e => { onChange(e.target.value); setEditing(false); }} rows={3} style={{ ...inputStyle(C), resize: 'vertical', fontSize: 12, padding: '5px 8px' }} />
          ) : (
            <input autoFocus defaultValue={value || ''} onBlur={e => { onChange(e.target.value); setEditing(false); }} onKeyDown={e => { if (e.key === 'Enter') { onChange(e.target.value); setEditing(false); } }} style={{ ...inputStyle(C), fontSize: 12, padding: '4px 8px' }} />
          )
        ) : (
          <div onClick={() => setEditing(true)} style={{ color: value ? C.white : (missing ? '#ef5350' : C.grey + '55'), fontSize: 13, lineHeight: 1.5, cursor: 'text', minHeight: 20 }} title="Click to edit">
            {value || (missing ? '— not found' : '— click to add')}
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleField({ label, value, onChange, C }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 10, padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ color: C.grey, fontSize: 12, paddingTop: 2 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[true, false].map(v => (
          <button key={String(v)} onClick={() => onChange(v)}
            style={{ background: value === v ? C.gold + '22' : 'transparent', border: `1px solid ${value === v ? C.gold : C.border}`, color: value === v ? C.gold : C.grey, borderRadius: 3, padding: '4px 14px', fontSize: 12, cursor: 'pointer', fontFamily: NU }}>
            {v ? 'Yes' : 'No'}
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({ label, hint, children, C }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <label style={{ display: 'block', color: C.white, fontSize: 13, fontWeight: 600, marginBottom: hint ? 2 : 8 }}>{label}</label>
      {hint && <div style={{ color: C.grey, fontSize: 12, marginBottom: 8 }}>{hint}</div>}
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.new;
  return (
    <span style={{ background: s.color + '1a', color: s.color, border: `1px solid ${s.color}44`, borderRadius: 3, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{s.label}</span>
  );
}

function EmptyState({ C, onNew }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 40px', background: C.card, borderRadius: 8, border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 44, marginBottom: 16 }}>📥</div>
      <div style={{ color: C.white, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Start your first venue intake</div>
      <div style={{ color: C.grey, fontSize: 13, lineHeight: 1.65, maxWidth: 380, margin: '0 auto 28px' }}>
        Upload a brochure, document, or website and let the system build your listing — mapped to the full venue schema.
      </div>
      <button onClick={onNew} style={btnPrimary(C)}>+ New Intake</button>
    </div>
  );
}

function ErrorBanner({ msg }) {
  return (
    <div style={{ background: '#ef535014', border: '1px solid #ef535040', color: '#ef5350', borderRadius: 4, padding: '12px 16px', marginBottom: 20, fontSize: 13, lineHeight: 1.5 }}>
      {msg}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Style helpers
// ─────────────────────────────────────────────────────────────────────────────

const sectionLabel = { color: '#888', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 };

function btnPrimary(C) {
  return { background: C.gold, color: C.black, border: 'none', borderRadius: 4, padding: '11px 24px', fontFamily: NU, fontSize: 13, fontWeight: 700, cursor: 'pointer' };
}
function btnGhost(C) {
  return { background: 'transparent', border: `1px solid ${C.border}`, color: C.grey, borderRadius: 3, padding: '7px 14px', fontFamily: NU, fontSize: 12, cursor: 'pointer' };
}
function btnBack(C) {
  return { background: 'transparent', border: 'none', color: C.grey, cursor: 'pointer', fontSize: 20, padding: 0, lineHeight: 1 };
}
function inputStyle(C) {
  return { width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: '10px 12px', color: C.white, fontSize: 13, fontFamily: NU, outline: 'none', boxSizing: 'border-box' };
}
function tableHeader(C) {
  return { display: 'grid', gridTemplateColumns: '1fr 70px 130px 110px 120px 90px', gap: 12, padding: '8px 16px', color: C.grey, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 };
}
function tableRow(C) {
  return { display: 'grid', gridTemplateColumns: '1fr 70px 130px 110px 120px 90px', gap: 12, padding: '14px 16px', background: C.card, borderRadius: 4, alignItems: 'center', cursor: 'pointer' };
}
function card(C, extra = {}) {
  return { background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: 14, ...extra };
}
