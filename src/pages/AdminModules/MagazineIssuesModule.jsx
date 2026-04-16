/**
 * MagazineIssuesModule.jsx
 * Admin module for managing LWD Magazine print issues.
 * Route: Admin → Content → Magazine Issues
 *
 * List view: all issues, create new, status filters
 * Detail view: opens MagazineIssueEditor
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchIssues, createIssue } from '../../services/magazineIssuesService';
import MagazineIssueEditor from './MagazineIssueEditor';

const GOLD = '#C9A84C';
const GD   = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const NU   = "var(--font-body, 'Nunito Sans', sans-serif)";

const STATUS_CONFIG = {
  draft:     { label: 'Draft',     color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.08)'  },
  published: { label: 'Published', color: '#34d399',               bg: 'rgba(52,211,153,0.12)'  },
  archived:  { label: 'Archived',  color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.05)' },
};

const PROC_CONFIG = {
  idle:       { label: '—',          color: 'rgba(255,255,255,0.3)' },
  processing: { label: '⟳ Processing', color: GOLD                  },
  ready:      { label: '✓ Ready',    color: '#34d399'               },
  failed:     { label: '✕ Failed',   color: '#f87171'               },
};

function fmt(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusPill({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span style={{
      fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: s.color, background: s.bg,
      borderRadius: 10, padding: '3px 9px', whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

function CreateIssueModal({ onClose, onCreate }) {
  const [title,       setTitle]       = useState('');
  const [issueNumber, setIssueNumber] = useState('');
  const [year,        setYear]        = useState(new Date().getFullYear());
  const [creating,    setCreating]    = useState(false);
  const [error,       setError]       = useState('');

  const handleCreate = async () => {
    if (!title.trim()) { setError('Title is required.'); return; }
    setCreating(true);
    setError('');
    const { data, error: err } = await createIssue({
      title: title.trim(),
      issue_number: issueNumber ? parseInt(issueNumber) : null,
      year,
    });
    if (err) {
      setError(err.message);
      setCreating(false);
      return;
    }
    onCreate?.(data);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#111', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 8, padding: 28, width: '100%', maxWidth: 400,
      }}>
        <div style={{ fontFamily: GD, fontSize: 22, color: '#fff', marginBottom: 20 }}>New Issue</div>

        {/* Title */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
            Title <span style={{ color: '#f87171' }}>*</span>
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. The Grand Wedding Edition"
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 4, color: '#fff', fontFamily: NU, fontSize: 13, padding: '8px 10px', outline: 'none',
            }}
          />
        </div>

        {/* Issue number + year */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
              Issue No.
            </label>
            <input
              type="number"
              value={issueNumber}
              onChange={e => setIssueNumber(e.target.value)}
              placeholder="01"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 4, color: '#fff', fontFamily: NU, fontSize: 13, padding: '8px 10px', outline: 'none',
              }}
            />
          </div>
          <div>
            <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
              Year
            </label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(parseInt(e.target.value) || new Date().getFullYear())}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 4, color: '#fff', fontFamily: NU, fontSize: 13, padding: '8px 10px', outline: 'none',
              }}
            />
          </div>
        </div>

        {error && <div style={{ fontFamily: NU, fontSize: 11, color: '#f87171', marginBottom: 12 }}>⚠ {error}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 4, color: 'rgba(255,255,255,0.5)', fontFamily: NU, fontSize: 11,
              padding: '8px 18px', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            style={{
              background: GOLD, border: 'none', borderRadius: 4,
              color: '#1a1806', fontFamily: NU, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '8px 20px', cursor: creating ? 'default' : 'pointer',
              opacity: creating ? 0.6 : 1,
            }}
          >
            {creating ? 'Creating…' : 'Create Issue'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * @param {Object} props
 * @param {Object} props.C - Color config (passed from AdminDashboard)
 */
export default function MagazineIssuesModule({ C }) {
  const [issues,     setIssues]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [filter,     setFilter]     = useState('all');
  const [editingId,  setEditingId]  = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await fetchIssues();
    if (err) {
      // Show friendly message if table doesn't exist yet
      if (err.message?.includes('does not exist') || err.code === '42P01') {
        setError('magazine_issues table not found. Run the migration first.');
      } else {
        setError(err.message || 'Failed to load issues.');
      }
    } else {
      setIssues(data);
    }
    setLoading(false);
    setLastFetched(new Date());
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreate = useCallback((newIssue) => {
    setShowCreate(false);
    setIssues(prev => [newIssue, ...prev]);
    setEditingId(newIssue.id);
  }, []);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = filter === 'all'
    ? issues
    : issues.filter(i => i.status === filter);

  // ── If editing, show editor ───────────────────────────────────────────────
  if (editingId) {
    return (
      <MagazineIssueEditor
        issueId={editingId}
        onBack={async () => { setEditingId(null); await load(); }}
        C={C}
      />
    );
  }

  // ── Stats strip ───────────────────────────────────────────────────────────
  const counts = {
    all:       issues.length,
    draft:     issues.filter(i => i.status === 'draft').length,
    published: issues.filter(i => i.status === 'published').length,
    archived:  issues.filter(i => i.status === 'archived').length,
  };

  return (
    <div style={{ padding: '28px 32px', minHeight: '100%' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: GD, fontSize: 28, color: '#fff', lineHeight: 1.2 }}>
            Publications
          </div>
          <div style={{ fontFamily: NU, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
            PDF flipbook issues · {counts.all} issue{counts.all !== 1 ? 's' : ''} · public at /publications
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={load}
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 4, color: 'rgba(255,255,255,0.5)', fontFamily: NU, fontSize: 11,
              padding: '9px 14px', cursor: 'pointer',
            }}
          >
            ↻ Refresh
          </button>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              background: GOLD, border: 'none', borderRadius: 4,
              color: '#1a1806', fontFamily: NU, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.07em', textTransform: 'uppercase',
              padding: '9px 18px', cursor: 'pointer',
            }}
          >
            ✦ New Issue
          </button>
        </div>
      </div>

      {/* ── Stats pills ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { key: 'all',       label: `All (${counts.all})`             },
          { key: 'draft',     label: `Draft (${counts.draft})`         },
          { key: 'published', label: `Published (${counts.published})` },
          { key: 'archived',  label: `Archived (${counts.archived})`   },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
              textTransform: 'uppercase', border: `1px solid ${filter === f.key ? GOLD : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 20, padding: '5px 14px', cursor: 'pointer',
              background: filter === f.key ? 'rgba(201,168,76,0.12)' : 'transparent',
              color: filter === f.key ? GOLD : 'rgba(255,255,255,0.5)',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Loading / Error ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ fontFamily: NU, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Loading issues…</div>
        </div>
      )}

      {!loading && error && (
        <div style={{
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: 6, padding: '14px 16px', marginBottom: 20,
        }}>
          <div style={{ fontFamily: NU, fontSize: 12, color: '#f87171' }}>⚠ {error}</div>
          {error.includes('migration') && (
            <div style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
              Run <code style={{ color: GOLD, background: 'rgba(201,168,76,0.08)', padding: '1px 5px', borderRadius: 3 }}>supabase/migrations/20260416_magazine_issues.sql</code> in the Supabase SQL Editor.
            </div>
          )}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '64px 20px',
          border: '2px dashed rgba(255,255,255,0.08)', borderRadius: 8,
        }}>
          <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.2 }}>◈</div>
          <div style={{ fontFamily: GD, fontSize: 24, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
            {filter === 'all' ? 'No issues yet' : `No ${filter} issues`}
          </div>
          <div style={{ fontFamily: NU, fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>
            Create your first magazine issue to get started.
          </div>
          {filter === 'all' && (
            <button
              onClick={() => setShowCreate(true)}
              style={{
                background: GOLD, border: 'none', borderRadius: 4,
                color: '#1a1806', fontFamily: NU, fontSize: 11, fontWeight: 700,
                letterSpacing: '0.07em', textTransform: 'uppercase',
                padding: '10px 22px', cursor: 'pointer',
              }}
            >
              ✦ Create First Issue
            </button>
          )}
        </div>
      )}

      {/* ── Issues table ── */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden' }}>

          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 100px 90px 110px 80px 80px',
            gap: 0,
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '0 16px',
          }}>
            {['Cover', 'Title / Slug', 'Status', 'Pages', 'Processing', 'Created', ''].map((h, i) => (
              <div key={i} style={{
                fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
                padding: '10px 0', paddingRight: 8,
              }}>
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          {filtered.map(issue => {
            const proc = PROC_CONFIG[issue.processing_state] || PROC_CONFIG.idle;
            return (
              <div
                key={issue.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 100px 90px 110px 80px 80px',
                  gap: 0,
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  alignItems: 'center',
                  transition: 'background 0.1s',
                  cursor: 'default',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Cover thumbnail */}
                <div style={{ paddingRight: 8 }}>
                  <div style={{
                    width: 40, height: 52, borderRadius: 2, overflow: 'hidden',
                    background: '#1a1a18', border: '1px solid rgba(255,255,255,0.08)',
                    flexShrink: 0,
                  }}>
                    {issue.cover_image
                      ? <img src={issue.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', fontSize: 16 }}>◈</div>
                    }
                  </div>
                </div>

                {/* Title / slug */}
                <div style={{ paddingRight: 12, overflow: 'hidden' }}>
                  <div style={{
                    fontFamily: GD, fontSize: 15, color: '#fff', fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {issue.title || 'Untitled'}
                  </div>
                  <div style={{
                    fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.35)',
                    marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    /{issue.slug}
                  </div>
                  {issue.issue_number && (
                    <div style={{ fontFamily: NU, fontSize: 10, color: GOLD, marginTop: 2 }}>
                      Issue {issue.issue_number}{issue.season ? ` · ${issue.season}` : ''}{issue.year ? ` ${issue.year}` : ''}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div><StatusPill status={issue.status} /></div>

                {/* Page count */}
                <div style={{ fontFamily: NU, fontSize: 12, color: issue.page_count ? '#fff' : 'rgba(255,255,255,0.25)' }}>
                  {issue.page_count || '—'}
                </div>

                {/* Processing */}
                <div style={{ fontFamily: NU, fontSize: 11, color: proc.color }}>
                  {proc.label}
                </div>

                {/* Created */}
                <div style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                  {fmt(issue.created_at)}
                </div>

                {/* Edit button */}
                <div>
                  <button
                    onClick={() => setEditingId(issue.id)}
                    style={{
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.14)',
                      borderRadius: 3, color: 'rgba(255,255,255,0.6)',
                      fontFamily: NU, fontSize: 10, fontWeight: 600,
                      padding: '5px 12px', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Last fetched ── */}
      {lastFetched && !loading && (
        <div style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 12, textAlign: 'right' }}>
          Updated {lastFetched.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      )}

      {/* ── Create modal ── */}
      {showCreate && (
        <CreateIssueModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
