// ─── src/pages/VendorReachPage.jsx ───────────────────────────────────────────
// Public shareable vendor analytics page.
// Route: /magazine/reach/:issueSlug/:vendorSlug
//
// Shows a vendor their page analytics from a published issue.
// No auth required — public proof-of-performance.

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { fetchIssueBySlug } from '../services/magazineIssuesService';
import { fetchPages } from '../services/magazinePageService';

const GOLD   = '#C9A96E';
const DARK   = '#0C0B09';
const BORDER = 'rgba(255,255,255,0.08)';
const MUTED  = 'rgba(255,255,255,0.38)';
const NU     = "'Jost', sans-serif";
const GD     = "'Cormorant Garamond', Georgia, serif";

function msToReadable(ms) {
  if (!ms || ms <= 0) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

function normaliseSlug(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function StatCard({ label, value, sub, gold }) {
  return (
    <div style={{
      flex: 1, minWidth: 140,
      background: gold ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${gold ? 'rgba(201,168,76,0.25)' : BORDER}`,
      borderRadius: 8, padding: '20px 22px',
    }}>
      <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: gold ? GOLD : MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontFamily: GD, fontSize: 36, fontStyle: 'italic', color: gold ? GOLD : '#fff', lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, marginTop: 6 }}>{sub}</div>
      )}
    </div>
  );
}

export default function VendorReachPage({ issueSlug, vendorSlug, onBack }) {
  const [state, setState]         = useState('loading'); // loading | not-found | ready
  const [issue, setIssue]         = useState(null);
  const [vendorName, setVendorName] = useState('');
  const [vendorPageNum, setVendorPageNum] = useState(null);
  const [totalPages, setTotalPages]       = useState(0);
  const [totalReaders, setTotalReaders]   = useState(0);
  const [vendorViews, setVendorViews]     = useState(0);
  const [avgDwellMs, setAvgDwellMs]       = useState(null);
  const [reachPct, setReachPct]           = useState(0);

  useEffect(() => {
    if (!issueSlug || !vendorSlug) { setState('not-found'); return; }
    (async () => {
      try {
        // 1. Fetch issue
        const { data: issueData } = await fetchIssueBySlug(issueSlug);
        if (!issueData) { setState('not-found'); return; }
        setIssue(issueData);

        // 2. Fetch pages — find vendor page
        const { data: pagesData } = await fetchPages(issueData.id);
        const pages = pagesData || [];
        setTotalPages(pages.length);

        const normTarget = normaliseSlug(vendorSlug);
        const vendorPage = pages.find(p => {
          const vn = p.template_data?.slot?.vendor_name || '';
          return normaliseSlug(vn) === normTarget || vn.toLowerCase().includes(vendorSlug.toLowerCase().replace(/-/g, ' '));
        });

        if (vendorPage) {
          setVendorPageNum(vendorPage.page_number);
          setVendorName(vendorPage.template_data?.slot?.vendor_name || vendorSlug.replace(/-/g, ' '));
        } else {
          // Try fuzzy: any page where vendor slug appears in vendor_name
          const fallback = pages.find(p => {
            const vn = normaliseSlug(p.template_data?.slot?.vendor_name || '');
            return vn.includes(normTarget) || normTarget.includes(vn);
          });
          if (fallback) {
            setVendorPageNum(fallback.page_number);
            setVendorName(fallback.template_data?.slot?.vendor_name || vendorSlug.replace(/-/g, ' '));
          } else {
            setVendorName(vendorSlug.replace(/-/g, ' '));
          }
        }

        // 3. Fetch analytics
        const { data: events } = await supabase
          .from('magazine_read_events')
          .select('session_id, event_type, page_number, duration_ms')
          .eq('issue_id', issueData.id);

        if (events) {
          const uniqueSessions = new Set(events.map(e => e.session_id)).size;
          setTotalReaders(uniqueSessions);

          if (vendorPage) {
            const vpn = vendorPage.page_number;
            const pvOnVendorPage = events.filter(e => e.event_type === 'page_view' && e.page_number === vpn);
            const uniqueOnPage = new Set(pvOnVendorPage.map(e => e.session_id)).size;
            setVendorViews(uniqueOnPage);
            setReachPct(uniqueSessions > 0 ? Math.round((uniqueOnPage / uniqueSessions) * 100) : 0);

            // Avg dwell on vendor page
            const dwells = events.filter(e => e.event_type === 'page_view' && e.page_number === vpn && e.duration_ms);
            if (dwells.length > 0) {
              setAvgDwellMs(Math.round(dwells.reduce((s, e) => s + e.duration_ms, 0) / dwells.length));
            }
          }
        }

        setState('ready');
      } catch (err) {
        console.error('[VendorReachPage]', err);
        setState('not-found');
      }
    })();
  }, [issueSlug, vendorSlug]);

  const pubDate = issue?.published_at
    ? new Date(issue.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  // ── Render states ──────────────────────────────────────────────────────────

  if (state === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 32, opacity: 0.2, animation: 'spin 2s linear infinite' }}>◈</div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <span style={{ fontFamily: NU, fontSize: 11, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Loading analytics…
        </span>
      </div>
    );
  }

  if (state === 'not-found') {
    return (
      <div style={{ minHeight: '100vh', background: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
        <span style={{ fontSize: 36, opacity: 0.25 }}>◈</span>
        <div style={{ fontFamily: GD, fontSize: 28, fontStyle: 'italic', color: 'rgba(255,255,255,0.5)' }}>Report not found</div>
        <div style={{ fontFamily: NU, fontSize: 13, color: MUTED, maxWidth: 340, lineHeight: 1.6 }}>
          This analytics report could not be found. The issue may not be published, or the link may be incorrect.
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: DARK, fontFamily: NU }}>

      {/* Decorative top border */}
      <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* LWD brand */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: GD, fontSize: 14, fontStyle: 'italic', color: GOLD, letterSpacing: '0.12em', marginBottom: 6 }}>
            Luxury Wedding Directory
          </div>
          <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Editorial Analytics Report
          </div>
        </div>

        {/* Issue header */}
        <div style={{ textAlign: 'center', marginBottom: 48, padding: '32px 0', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
          {pubDate && (
            <div style={{ fontFamily: NU, fontSize: 9, color: GOLD, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>
              Published {pubDate}
            </div>
          )}
          <div style={{ fontFamily: GD, fontSize: 32, fontStyle: 'italic', color: '#fff', marginBottom: 12, lineHeight: 1.2 }}>
            {issue?.title || 'Untitled Issue'}
          </div>
          {/* Vendor name */}
          <div style={{ fontFamily: GD, fontSize: 42, fontStyle: 'italic', color: GOLD, lineHeight: 1, marginTop: 8 }}>
            {vendorName || 'Vendor'}
          </div>
          {vendorPageNum && (
            <div style={{ fontFamily: NU, fontSize: 11, color: MUTED, marginTop: 10 }}>
              Appearing on page {vendorPageNum} of {totalPages}
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 48 }}>
          <StatCard label="Total Readers" value={String(totalReaders)} sub="unique sessions" />
          <StatCard label="Reached Your Page" value={String(vendorViews)} sub="unique readers" gold />
          <StatCard label="% Readership" value={`${reachPct}%`} sub="of total issue readers" gold />
          <StatCard label="Avg Time on Page" value={msToReadable(avgDwellMs)} sub="per reader" />
        </div>

        {/* Placement bar */}
        {vendorPageNum && totalPages > 0 && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
              Your placement in this issue
            </div>
            <div style={{ position: 'relative', height: 28, background: 'rgba(255,255,255,0.04)', borderRadius: 4, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
              {/* fill up to vendor page */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${((vendorPageNum - 1) / totalPages) * 100}%`,
                background: 'rgba(255,255,255,0.05)',
              }} />
              {/* Vendor marker */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${((vendorPageNum - 1) / totalPages) * 100}%`,
                width: `${(1 / totalPages) * 100}%`,
                background: `linear-gradient(90deg, ${GOLD}, rgba(201,168,76,0.6))`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: NU, fontSize: 9, color: '#0C0B09', fontWeight: 700 }}>p{vendorPageNum}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontFamily: NU, fontSize: 9, color: MUTED }}>Page 1</span>
              <span style={{ fontFamily: NU, fontSize: 9, color: GOLD }}>Your page ({vendorPageNum})</span>
              <span style={{ fontFamily: NU, fontSize: 9, color: MUTED }}>Page {totalPages}</span>
            </div>
          </div>
        )}

        {/* Contextual note if no events yet */}
        {totalReaders === 0 && (
          <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`, borderRadius: 6, textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontFamily: GD, fontSize: 18, fontStyle: 'italic', color: MUTED, marginBottom: 8 }}>
              Analytics will appear here once readers open this issue.
            </div>
            <div style={{ fontFamily: NU, fontSize: 11, color: MUTED, lineHeight: 1.6 }}>
              Share the issue link to start building your readership data.
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 28, textAlign: 'center' }}>
          <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, lineHeight: 1.6 }}>
            Data from Luxury Wedding Directory editorial analytics
          </div>
          <div style={{ fontFamily: NU, fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>
            © {new Date().getFullYear()} Luxury Wedding Directory
          </div>
        </div>

      </div>
    </div>
  );
}
