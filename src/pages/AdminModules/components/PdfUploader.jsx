/**
 * PdfUploader.jsx
 * Drag-and-drop + click-to-upload PDF component.
 * Handles: upload to Supabase Storage → triggers processPdf pipeline.
 * Shows progress via PageProcessor.
 */

import { useState, useRef, useCallback } from 'react';
import { uploadIssuePdf } from '../../../services/magazineIssuesService';
import { processPdf } from '../../../services/pdfProcessorService';
import PageProcessor from './PageProcessor';

const GOLD = '#C9A84C';
const NU   = "var(--font-body, 'Nunito Sans', sans-serif)";

const MAX_PDF_MB = 100;
const MAX_PDF_BYTES = MAX_PDF_MB * 1024 * 1024;

function formatBytes(bytes) {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

/**
 * @param {Object}   props
 * @param {string}   props.issueId
 * @param {number}   props.renderVersion
 * @param {function} props.onComplete       - Called with { pageCount } when done
 * @param {boolean}  props.disabled
 * @param {string}   props.existingPdfUrl   - If set, shows current PDF info
 */
export default function PdfUploader({ issueId, renderVersion, onComplete, disabled, existingPdfUrl }) {
  const [dragging,  setDragging]  = useState(false);
  const [file,      setFile]      = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [progress,  setProgress]  = useState(null); // ProcessProgress | null
  const inputRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f) return;
    if (f.type !== 'application/pdf' && !f.name.endsWith('.pdf')) {
      setUploadErr('Please upload a PDF file.');
      return;
    }
    if (f.size > MAX_PDF_BYTES) {
      setUploadErr(`File is too large. Max ${MAX_PDF_MB} MB.`);
      return;
    }
    setUploadErr('');
    setFile(f);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    handleFile(f);
  }, [handleFile]);

  const handleInputChange = useCallback((e) => {
    handleFile(e.target.files?.[0]);
  }, [handleFile]);

  const startProcessing = useCallback(async () => {
    if (!file || !issueId || uploading) return;
    setUploading(true);
    setUploadErr('');
    setProgress({ current: 0, total: 0, phase: 'loading' });

    try {
      // 1. Upload PDF to storage
      const { error: uploadErr } = await uploadIssuePdf(issueId, file);
      if (uploadErr) throw uploadErr;

      // 2. Run PDF processing pipeline
      const { pageCount, error: processErr } = await processPdf({
        issueId,
        renderVersion,
        file,
        onProgress: setProgress,
      });
      if (processErr) throw processErr;

      onComplete?.({ pageCount });
    } catch (err) {
      setUploadErr(err.message || 'Processing failed. Please try again.');
      setProgress(null);
    } finally {
      setUploading(false);
    }
  }, [file, issueId, renderVersion, uploading, onComplete]);

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
          borderRadius: 6,
          padding: '32px 20px',
          textAlign: 'center',
          background: dragging ? 'rgba(201,168,76,0.04)' : 'rgba(255,255,255,0.02)',
          cursor: isActive ? 'pointer' : 'default',
          transition: 'all 0.15s',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />

        {file ? (
          <div>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
            <div style={{ fontFamily: NU, fontSize: 13, color: '#fff', fontWeight: 600 }}>{file.name}</div>
            <div style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
              {formatBytes(file.size)}
            </div>
            {isActive && (
              <div style={{ fontFamily: NU, fontSize: 10, color: GOLD, marginTop: 6, letterSpacing: '0.05em' }}>
                Click to change
              </div>
            )}
          </div>
        ) : existingPdfUrl ? (
          <div>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            <div style={{ fontFamily: NU, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
              PDF already uploaded
            </div>
            <div style={{ fontFamily: NU, fontSize: 10, color: GOLD, marginTop: 4 }}>
              Drop a new PDF here to replace it
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 40, marginBottom: 10, opacity: 0.5 }}>⊕</div>
            <div style={{ fontFamily: NU, fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
              Drop PDF here or click to browse
            </div>
            <div style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
              Maximum {MAX_PDF_MB} MB · PDF only
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {uploadErr && (
        <div style={{ fontFamily: NU, fontSize: 11, color: '#f87171', marginTop: 8 }}>
          ⚠ {uploadErr}
        </div>
      )}

      {/* Progress */}
      {progress && <PageProcessor progress={progress} style={{ marginTop: 12 }} />}

      {/* Start button */}
      {file && !uploading && !progress?.phase?.includes('done') && (
        <button
          onClick={startProcessing}
          disabled={!file || uploading}
          style={{
            marginTop: 14, width: '100%',
            background: GOLD, border: 'none', borderRadius: 4,
            color: '#1a1806', fontFamily: NU, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '10px 0', cursor: 'pointer',
          }}
        >
          ✦ Process PDF ({file.name.slice(-30)})
        </button>
      )}
    </div>
  );
}
