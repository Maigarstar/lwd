/**
 * JpegPageUploader.jsx
 * Upload a single JPEG as a specific page number.
 * Used for manual page insertion outside of the PDF pipeline.
 */

import { useState, useRef, useCallback } from 'react';
import { uploadJpegPage } from '../../../services/pdfProcessorService';
import { upsertPage } from '../../../services/magazinePageService';
import { updatePageCount } from '../../../services/magazineIssuesService';

const GOLD = '#C9A84C';
const NU   = "var(--font-body, 'Nunito Sans', sans-serif)";

const MAX_JPG_MB    = 20;
const MAX_JPG_BYTES = MAX_JPG_MB * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * @param {Object}   props
 * @param {string}   props.issueId
 * @param {number}   props.renderVersion
 * @param {number}   props.currentPageCount  - Determines default page number
 * @param {function} props.onComplete        - Called with { pageRecord }
 * @param {boolean}  props.disabled
 */
export default function JpegPageUploader({ issueId, renderVersion, currentPageCount, onComplete, disabled }) {
  const [dragging,    setDragging]    = useState(false);
  const [file,        setFile]        = useState(null);
  const [preview,     setPreview]     = useState(null);
  const [pageNumber,  setPageNumber]  = useState((currentPageCount || 0) + 1);
  const [uploading,   setUploading]   = useState(false);
  const [error,       setError]       = useState('');
  const [done,        setDone]        = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError('Please upload a JPEG, PNG, or WebP image.');
      return;
    }
    if (f.size > MAX_JPG_BYTES) {
      setError(`File too large. Max ${MAX_JPG_MB} MB.`);
      return;
    }
    setError('');
    setDone(false);
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }, [handleFile]);

  const handleUpload = useCallback(async () => {
    if (!file || !issueId || uploading) return;
    if (!pageNumber || pageNumber < 1) { setError('Enter a valid page number.'); return; }

    setUploading(true);
    setError('');

    try {
      const { pageRecord, error: upErr } = await uploadJpegPage({
        issueId, renderVersion, pageNumber, file,
      });
      if (upErr) throw upErr;

      // Upsert DB record
      const { error: dbErr } = await upsertPage(pageRecord);
      if (dbErr) throw dbErr;

      // Update page count if this is beyond current count
      if (pageNumber > (currentPageCount || 0)) {
        await updatePageCount(issueId, pageNumber);
      }

      setDone(true);
      onComplete?.({ pageRecord });
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [file, issueId, renderVersion, pageNumber, uploading, currentPageCount, onComplete]);

  const isActive = !disabled && !uploading;

  return (
    <div>
      {/* Drop zone */}
      <div
        onClick={() => isActive && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); if (isActive) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? GOLD : file ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.15)'}`,
          borderRadius: 6, padding: '20px', textAlign: 'center',
          background: dragging ? 'rgba(201,168,76,0.04)' : 'rgba(255,255,255,0.02)',
          cursor: isActive ? 'pointer' : 'default',
          transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files?.[0])}
        />

        {preview ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
            <img src={preview} alt="" style={{ width: 60, height: 80, objectFit: 'cover', borderRadius: 3, border: `1px solid ${GOLD}` }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: NU, fontSize: 12, color: '#fff', fontWeight: 600 }}>{file.name}</div>
              {isActive && <div style={{ fontFamily: NU, fontSize: 10, color: GOLD, marginTop: 2 }}>Click to change</div>}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>🖼</div>
            <div style={{ fontFamily: NU, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              Drop JPEG here or click to browse
            </div>
            <div style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
              JPEG · PNG · WebP — max {MAX_JPG_MB} MB
            </div>
          </div>
        )}
      </div>

      {/* Page number selector */}
      {file && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
            Page No.
          </label>
          <input
            type="number"
            min={1}
            value={pageNumber}
            onChange={e => setPageNumber(parseInt(e.target.value) || 1)}
            style={{
              width: 70, background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 4, color: '#fff', fontFamily: NU, fontSize: 13,
              padding: '6px 8px', outline: 'none',
            }}
          />
          <span style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
            Current: {currentPageCount || 0} pages
          </span>
        </div>
      )}

      {error && <div style={{ fontFamily: NU, fontSize: 11, color: '#f87171', marginTop: 8 }}>⚠ {error}</div>}

      {done && (
        <div style={{ fontFamily: NU, fontSize: 11, color: '#34d399', marginTop: 8 }}>
          ✓ Page {pageNumber} uploaded successfully.
        </div>
      )}

      {file && !uploading && !done && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          style={{
            marginTop: 12, width: '100%',
            background: GOLD, border: 'none', borderRadius: 4,
            color: '#1a1806', fontFamily: NU, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '9px 0', cursor: 'pointer',
          }}
        >
          ✦ Upload as Page {pageNumber}
        </button>
      )}

      {uploading && (
        <div style={{ fontFamily: NU, fontSize: 11, color: GOLD, marginTop: 8, textAlign: 'center' }}>
          ⟳ Uploading…
        </div>
      )}
    </div>
  );
}
