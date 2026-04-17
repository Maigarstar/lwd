// ─── PageSlotPanel.jsx ────────────────────────────────────────────────────────
// Slide-in panel (right side, 380px) for assigning a vendor page slot to the
// currently-open page in PageDesigner. Part of the Revenue Engine.

import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { GOLD, DARK, CARD, BORDER, MUTED, NU, GD } from './designerConstants';
import { sendEmail } from '../../../services/emailSendService';

function generateInvoicePDF(slot, issueName, pageLabel) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const G = [201, 168, 76];
  const W = 210, M = 24;
  doc.setFillColor(...G); doc.rect(0, 0, W, 3, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...G);
  doc.text('LUXURY WEDDING DIRECTORY', M, 20);
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(120,100,80);
  doc.text('editorial@luxuryweddingdirectory.com', M, 26);
  doc.setFont('helvetica','bold'); doc.setFontSize(22); doc.setTextColor(20,16,10);
  doc.text('INVOICE', W - M, 24, { align: 'right' });
  const invNum = 'LWD-' + Date.now().toString(36).toUpperCase();
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(120,100,80);
  doc.text('No: ' + invNum, W - M, 31, { align: 'right' });
  doc.text('Date: ' + new Date().toLocaleDateString('en-GB', { day:'numeric',month:'long',year:'numeric' }), W - M, 37, { align: 'right' });
  doc.setDrawColor(...G); doc.setLineWidth(0.3); doc.line(M, 44, W - M, 44);
  doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...G);
  doc.text('BILL TO', M, 54);
  doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(20,16,10);
  doc.text(slot.vendor_name || 'Vendor', M, 61);
  if (slot.vendor_email) { doc.setFontSize(8); doc.setTextColor(100,80,60); doc.text(slot.vendor_email, M, 67); }
  const TY = 88;
  doc.setFillColor(245,240,230); doc.rect(M, TY-6, W-M*2, 10, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(20,16,10);
  doc.text('Description', M+2, TY); doc.text('Publication', 110, TY); doc.text('Amount', W-M-2, TY, { align:'right' });
  doc.setDrawColor(200,180,140); doc.line(M, TY+2, W-M, TY+2);
  const tierLabels = { standard:'Standard Page Feature', featured:'Featured Placement', showcase:'Showcase Spread' };
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(20,16,10);
  doc.text(tierLabels[slot.tier] || 'Editorial Feature', M+2, TY+12);
  doc.text(pageLabel || 'Editorial Page', M+2, TY+18);
  doc.setTextColor(100,80,60); doc.setFontSize(8);
  doc.text(issueName || 'Issue', 110, TY+12);
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...G);
  doc.text('£' + Number(slot.price||0).toLocaleString(), W-M-2, TY+12, { align:'right' });
  doc.setDrawColor(...G); doc.line(M, TY+28, W-M, TY+28);
  doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(20,16,10);
  doc.text('Total Due', M+2, TY+38);
  doc.setTextColor(...G); doc.setFontSize(14);
  doc.text('£' + Number(slot.price||0).toLocaleString(), W-M-2, TY+38, { align:'right' });
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(150,130,100);
  doc.text('Payment confirms editorial placement in ' + (issueName||'our next issue') + '.', M, 250);
  doc.text('© ' + new Date().getFullYear() + ' Luxury Wedding Directory · luxuryweddingdirectory.com', M, 256);
  doc.save('lwd-invoice-' + (slot.vendor_name||'vendor').toLowerCase().replace(/\s+/g,'-') + '.pdf');
}

const TIER_DEFAULTS = {
  standard:  850,
  featured:  1500,
  showcase:  2500,
};

const TIERS = [
  { key: 'standard',  label: 'Standard',  price: 850,  desc: 'Full page vendor feature' },
  { key: 'featured',  label: 'Featured',  price: 1500, desc: 'Priority placement + badge' },
  { key: 'showcase',  label: 'Showcase',  price: 2500, desc: 'Premium double-page spread' },
];

const STATUSES = [
  { key: 'available',   label: 'Available',   color: 'rgba(255,255,255,0.4)' },
  { key: 'offered',     label: 'Offered',     color: GOLD },
  { key: 'paid',        label: 'Paid',        color: '#34d399' },
  { key: 'proof_sent',  label: 'Proof Sent',  color: '#a78bfa' },
  { key: 'published',   label: 'Published',   color: '#60a5fa' },
];

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${BORDER}`,
  borderRadius: 4,
  color: '#fff',
  fontFamily: NU,
  fontSize: 12,
  padding: '8px 10px',
  outline: 'none',
};

const labelStyle = {
  display: 'block',
  fontFamily: NU,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: MUTED,
  marginBottom: 6,
  marginTop: 14,
};

// ── Proof email HTML builder ──────────────────────────────────────────────────
function buildProofEmail({ vendorName, issueName, proofUrl, approvalUrl }) {
  const displayName  = vendorName  || 'there';
  const displayIssue = issueName   || 'our next issue';

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0908;font-family:sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="border-top:3px solid #C9A84C;padding-top:32px;margin-bottom:32px;">
      <p style="font-family:sans-serif;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#C9A84C;text-transform:uppercase;margin:0 0 12px;">
        Luxury Wedding Directory — Editorial Proof
      </p>
      <h1 style="font-family:Georgia,serif;font-size:28px;font-style:italic;font-weight:400;color:#F0EBE0;margin:0 0 8px;line-height:1.25;">
        Your editorial proof is ready — LWD
      </h1>
    </div>

    <p style="font-size:15px;color:rgba(240,235,224,0.8);line-height:1.7;margin:0 0 24px;">
      Dear ${displayName},
    </p>
    <p style="font-size:15px;color:rgba(240,235,224,0.8);line-height:1.7;margin:0 0 24px;">
      Your page in <em>${displayIssue}</em> is ready for review. Please look it over carefully and reply to this email to approve or request any changes.
    </p>

    ${proofUrl ? `
    <!-- Proof image -->
    <div style="margin:0 0 28px;text-align:center;">
      <img src="${proofUrl}" alt="Your editorial proof" style="max-width:100%;border:1px solid rgba(201,168,76,0.2);border-radius:3px;box-shadow:0 8px 32px rgba(0,0,0,0.5);" />
    </div>
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${proofUrl}" style="display:inline-block;padding:12px 28px;background:transparent;border:1px solid #C9A84C;color:#C9A84C;font-family:sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;border-radius:2px;">
        View Full Size ↗
      </a>
    </div>` : ''}

    ${approvalUrl ? `
    <!-- Approval buttons -->
    <div style="text-align:center;margin:24px 0 16px;">
      <a href="${approvalUrl}" style="display:inline-block;padding:12px 28px;background:#34d399;color:#0A0908;font-family:sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;border-radius:2px;margin-right:10px;">
        ✓ Approve
      </a>
      <a href="${approvalUrl}?action=changes" style="display:inline-block;padding:12px 28px;background:transparent;border:1px solid rgba(240,235,224,0.3);color:rgba(240,235,224,0.7);font-family:sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;border-radius:2px;">
        Request Changes
      </a>
    </div>` : ''}

    <p style="font-size:13px;color:rgba(240,235,224,0.5);line-height:1.7;margin:0 0 8px;">
      To approve, click the button above or reply to this email with "Approved". For changes, describe what you'd like adjusted.
    </p>
    <p style="font-size:12px;color:rgba(240,235,224,0.35);line-height:1.7;margin:0;">
      Please respond within 48 hours to keep your placement on schedule.
    </p>

    <div style="border-top:1px solid rgba(255,255,255,0.08);margin-top:40px;padding-top:20px;text-align:center;">
      <span style="font-size:10px;color:rgba(255,255,255,0.3);font-family:sans-serif;">
        © ${new Date().getFullYear()} Luxury Wedding Directory · <a href="mailto:editorial@luxuryweddingdirectory.com" style="color:rgba(201,168,76,0.4);">editorial@luxuryweddingdirectory.com</a>
      </span>
    </div>
  </div>
</body>
</html>`;
}

// ── Offer email HTML builder ──────────────────────────────────────────────────
function buildOfferEmail({ vendorName, tier, price, issueName, pageName }) {
  const tierLabels = { standard: 'Standard Page Feature', featured: 'Featured Placement', showcase: 'Showcase Spread' };
  const tierLabel  = tierLabels[tier] || tier;
  const displayName = vendorName || 'there';
  const displayIssue = issueName || 'our next issue';
  const displayPage  = pageName  || 'a dedicated editorial page';

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0908;font-family:sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="border-top:3px solid #C9A84C;padding-top:32px;margin-bottom:32px;">
      <p style="font-family:sans-serif;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#C9A84C;text-transform:uppercase;margin:0 0 12px;">
        Luxury Wedding Directory — Editorial
      </p>
      <h1 style="font-family:Georgia,serif;font-size:28px;font-style:italic;font-weight:400;color:#F0EBE0;margin:0 0 8px;line-height:1.25;">
        You've been invited to feature in ${displayIssue}.
      </h1>
    </div>

    <p style="font-size:15px;color:rgba(240,235,224,0.8);line-height:1.7;margin:0 0 24px;">
      Dear ${displayName},
    </p>
    <p style="font-size:15px;color:rgba(240,235,224,0.8);line-height:1.7;margin:0 0 24px;">
      We're building the next edition of the Luxury Wedding Directory editorial magazine and we'd love to feature you. We've reserved ${displayPage} specifically for your business.
    </p>

    <!-- Slot details card -->
    <div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.25);border-radius:6px;padding:24px;margin:0 0 28px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="font-family:sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(240,235,224,0.45);padding:6px 0;width:40%;">Placement</td>
          <td style="font-family:Georgia,serif;font-size:15px;font-style:italic;color:#F0EBE0;padding:6px 0;">${tierLabel}</td>
        </tr>
        <tr>
          <td style="font-family:sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(240,235,224,0.45);padding:6px 0;">Page</td>
          <td style="font-family:Georgia,serif;font-size:15px;font-style:italic;color:#F0EBE0;padding:6px 0;">${displayPage}</td>
        </tr>
        <tr>
          <td style="font-family:sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(240,235,224,0.45);padding:6px 0;">Investment</td>
          <td style="font-family:Georgia,serif;font-size:22px;font-style:italic;color:#C9A84C;padding:6px 0;">£${Number(price).toLocaleString()}</td>
        </tr>
      </table>
    </div>

    <p style="font-size:14px;color:rgba(240,235,224,0.6);line-height:1.7;margin:0 0 32px;">
      This is a curated, editorial-first publication — not a directory listing. Your page will be designed by our editorial team, written in the style of Condé Nast Traveller, and distributed to our qualified couple audience.
    </p>

    <p style="font-size:13px;color:rgba(240,235,224,0.5);line-height:1.7;margin:0 0 8px;">
      To confirm your placement, simply reply to this email or reach us at <a href="mailto:editorial@luxuryweddingdirectory.com" style="color:#C9A84C;">editorial@luxuryweddingdirectory.com</a>.
    </p>
    <p style="font-size:12px;color:rgba(240,235,224,0.35);line-height:1.7;margin:0;">
      Placements are limited and allocated on a first-confirmed basis.
    </p>

    <div style="border-top:1px solid rgba(255,255,255,0.08);margin-top:40px;padding-top:20px;text-align:center;">
      <span style="font-size:10px;color:rgba(255,255,255,0.3);font-family:sans-serif;">
        © ${new Date().getFullYear()} Luxury Wedding Directory
      </span>
    </div>
  </div>
</body>
</html>`;
}

export default function PageSlotPanel({ slot, onSave, onClose, issueName, pageName, canvasJSON, issueId, pageNum }) {
  const [tier,        setTier]        = useState(slot?.tier        || 'standard');
  const [status,      setStatus]      = useState(slot?.status      || 'available');
  const [vendorName,  setVendorName]  = useState(slot?.vendor_name || '');
  const [vendorEmail, setVendorEmail] = useState(slot?.vendor_email || '');
  const [customPrice, setCustomPrice] = useState(slot?.price != null ? String(slot.price) : '');
  const [notes,       setNotes]       = useState(slot?.notes       || '');

  const [sending,     setSending]     = useState(false);
  const [sendResult,  setSendResult]  = useState(null); // 'sent' | 'error' | null

  const [proofSending, setProofSending] = useState(false);
  const [proofResult,  setProofResult]  = useState(null); // 'sent' | 'error' | null

  // Stripe payment link state
  const [paymentLink,        setPaymentLink]        = useState(slot?.payment_link_url || '');
  const [paymentLinkLoading, setPaymentLinkLoading] = useState(false);
  const [paymentLinkError,   setPaymentLinkError]   = useState('');
  const [paymentLinkCopied,  setPaymentLinkCopied]  = useState(false);

  // When tier changes, clear custom price so the default is used
  function handleTierChange(t) {
    setTier(t);
    setCustomPrice('');
  }

  function getEffectivePrice() {
    const p = parseFloat(customPrice);
    if (!isNaN(p) && p > 0) return p;
    return TIER_DEFAULTS[tier] ?? 850;
  }

  function handleSave() {
    const slotData = {
      tier,
      status,
      vendor_name:       vendorName.trim(),
      vendor_email:      vendorEmail.trim(),
      price:             getEffectivePrice(),
      notes:             notes.trim(),
      ...(paymentLink ? { payment_link_url: paymentLink } : {}),
    };
    onSave(slotData);
  }

  async function handleGeneratePaymentLink() {
    if (!vendorEmail.trim() || !tier) return;
    setPaymentLinkLoading(true);
    setPaymentLinkError('');
    try {
      const { supabase } = await import('../../../lib/supabaseClient');
      const tierLabels = { standard: 'Standard Page Feature', featured: 'Featured Placement', showcase: 'Showcase Spread' };
      const { data, error } = await supabase.functions.invoke('generate-payment-link', {
        body: {
          amount: getEffectivePrice() * 100,
          currency: 'gbp',
          description: (tierLabels[tier] || tier) + ' — ' + (issueName || 'LWD Issue'),
          vendor_email: vendorEmail.trim(),
          vendor_name: vendorName.trim(),
        },
      });
      if (error || !data?.url) {
        throw new Error(data?.error || error?.message || 'Unknown error');
      }
      setPaymentLink(data.url);
    } catch (err) {
      if (err.message?.includes('STRIPE_SECRET_KEY') || err.message?.includes('not configured') || err.message?.includes('FunctionsHttpError')) {
        setPaymentLinkError('Deploy the generate-payment-link edge function and add STRIPE_SECRET_KEY to Supabase secrets to activate');
      } else {
        setPaymentLinkError(err.message || 'Failed to generate payment link');
      }
    } finally {
      setPaymentLinkLoading(false);
    }
  }

  async function handleCopyPaymentLink() {
    try {
      await navigator.clipboard.writeText(paymentLink);
      setPaymentLinkCopied(true);
      setTimeout(() => setPaymentLinkCopied(false), 2000);
    } catch {}
  }

  async function handleSendPaymentLinkToVendor() {
    if (!vendorEmail.trim() || !paymentLink) return;
    try {
      const tierLabels = { standard: 'Standard Page Feature', featured: 'Featured Placement', showcase: 'Showcase Spread' };
      await sendEmail({
        subject: 'Your editorial placement payment link — LWD',
        fromName: 'Luxury Wedding Directory',
        fromEmail: 'editorial@luxuryweddingdirectory.com',
        html: `<!DOCTYPE html><html><body style="background:#0A0908;font-family:sans-serif;margin:0;padding:0"><div style="max-width:560px;margin:0 auto;padding:40px 24px"><div style="border-top:3px solid #C9A84C;padding-top:32px;margin-bottom:24px"><p style="font-size:10px;font-weight:700;letter-spacing:0.14em;color:#C9A84C;text-transform:uppercase;margin:0 0 12px">Luxury Wedding Directory — Editorial</p><h1 style="font-family:Georgia,serif;font-size:26px;font-style:italic;font-weight:400;color:#F0EBE0;margin:0;line-height:1.3">Your payment link is ready.</h1></div><p style="font-size:14px;color:rgba(240,235,224,0.8);line-height:1.7;margin:0 0 20px">Dear ${vendorName.trim() || 'there'},</p><p style="font-size:14px;color:rgba(240,235,224,0.8);line-height:1.7;margin:0 0 24px">Please use the link below to complete payment for your <em>${tierLabels[tier] || tier}</em> placement in <em>${issueName || 'our next issue'}</em>.</p><div style="text-align:center;margin:28px 0"><a href="${paymentLink}" style="display:inline-block;padding:14px 36px;background:#C9A84C;color:#0A0908;font-family:sans-serif;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;border-radius:2px">Complete Payment ✦</a></div><p style="font-size:11px;color:rgba(240,235,224,0.35);line-height:1.7;margin:0">Amount: £${getEffectivePrice().toLocaleString()}</p></div></body></html>`,
        recipients: [{ email: vendorEmail.trim(), name: vendorName.trim() || undefined }],
        type: 'campaign',
      });
    } catch (err) {
      console.error('[PageSlotPanel] Send payment link email failed:', err);
    }
  }

  function handleClear() {
    onSave(null);
  }

  async function handleSendOffer() {
    const email = vendorEmail.trim();
    if (!email) return;
    setSending(true);
    setSendResult(null);
    try {
      const price = getEffectivePrice();
      const html  = buildOfferEmail({ vendorName: vendorName.trim(), tier, price, issueName, pageName });
      await sendEmail({
        subject:    `An editorial placement has been reserved for you — LWD`,
        fromName:   'Luxury Wedding Directory',
        fromEmail:  'editorial@luxuryweddingdirectory.com',
        html,
        recipients: [{ email, name: vendorName.trim() || undefined }],
        type:       'campaign',
      });
      // Auto-advance status to 'offered' and save
      setStatus('offered');
      setSendResult('sent');
      // Persist immediately so the slot reflects the new status
      onSave({
        tier,
        status: 'offered',
        vendor_name:  vendorName.trim(),
        vendor_email: email,
        price,
        notes: notes.trim(),
      });
    } catch (err) {
      console.error('[PageSlotPanel] Send offer failed:', err);
      setSendResult('error');
    } finally {
      setSending(false);
    }
  }

  async function handleSendProof() {
    const email = vendorEmail.trim();
    if (!email || !canvasJSON || !issueId) return;
    setProofSending(true);
    setProofResult(null);
    let fc = null;
    try {
      const { Canvas: FC } = await import('fabric');
      const { supabase } = await import('../../../lib/supabaseClient');

      // Create off-screen canvas at A4 reference dimensions
      const canvasEl = document.createElement('canvas');
      canvasEl.width  = 794;
      canvasEl.height = 1123;
      fc = new FC(canvasEl);
      await fc.loadFromJSON(canvasJSON);
      fc.renderAll();
      await new Promise(r => setTimeout(r, 100));
      fc.renderAll();

      // Export JPEG blob from canvas element directly
      const blob = await new Promise((resolve, reject) => {
        try {
          canvasEl.toBlob(b => b ? resolve(b) : reject(new Error('toBlob returned null')), 'image/jpeg', 0.92);
        } catch (err) { reject(err); }
      });

      // Upload to Supabase storage
      const proofPath = `${issueId}/proofs/proof-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from('magazine-pages')
        .upload(proofPath, blob, { contentType: 'image/jpeg', upsert: true });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage
        .from('magazine-pages')
        .getPublicUrl(proofPath);

      // Generate approval URL
      const approvalToken = btoa([issueId, pageNum || 1, email].join(':'));
      const approvalUrl = 'https://luxuryweddingdirectory.com/magazine/proof-approval/' + approvalToken;

      // Send email
      const html = buildProofEmail({ vendorName: vendorName.trim(), issueName, proofUrl: publicUrl, approvalUrl });
      await sendEmail({
        subject:    'Your editorial proof is ready — LWD',
        fromName:   'Luxury Wedding Directory',
        fromEmail:  'editorial@luxuryweddingdirectory.com',
        html,
        recipients: [{ email, name: vendorName.trim() || undefined }],
        type:       'campaign',
      });

      // Advance to proof_sent
      setStatus('proof_sent');
      setProofResult('sent');
      onSave({
        tier,
        status: 'proof_sent',
        vendor_name:  vendorName.trim(),
        vendor_email: email,
        price:        getEffectivePrice(),
        notes:        notes.trim(),
        proof_url:    publicUrl,
      });
    } catch (err) {
      console.error('[PageSlotPanel] Send proof failed:', err);
      setProofResult('error');
    } finally {
      setProofSending(false);
      if (fc) { try { fc.dispose(); } catch {} }
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 900,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <style>{`@keyframes pspSlideIn { from { transform: translateX(40px); opacity:0; } to { transform: translateX(0); opacity:1; } }`}</style>

      {/* Panel */}
      <div
        style={{
          width: 380,
          background: '#141210',
          borderLeft: `1px solid ${BORDER}`,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          animation: 'pspSlideIn 0.2s ease',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 18px 14px',
          borderBottom: `1px solid ${BORDER}`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{
                fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD,
                letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2,
              }}>
                ◆ Page Slot
              </div>
              <div style={{ fontFamily: GD, fontSize: 16, fontStyle: 'italic', color: '#fff' }}>
                Vendor Assignment
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '0 18px 24px', overflowY: 'auto' }}>

          {/* Tier picker */}
          <div style={{ marginTop: 18 }}>
            <div style={{ ...labelStyle, marginTop: 0 }}>Tier</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TIERS.map(t => {
                const isSelected = tier === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => handleTierChange(t.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 4,
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSelected ? 'rgba(201,168,76,0.5)' : BORDER}`,
                      transition: 'all 0.12s',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{
                        fontFamily: NU, fontSize: 11, fontWeight: 700,
                        color: isSelected ? GOLD : '#fff',
                        letterSpacing: '0.04em', marginBottom: 2,
                      }}>
                        {t.label}
                      </div>
                      <div style={{ fontFamily: NU, fontSize: 10, color: MUTED }}>
                        {t.desc}
                      </div>
                    </div>
                    <div style={{
                      fontFamily: GD, fontSize: 16, fontStyle: 'italic',
                      color: isSelected ? GOLD : MUTED,
                      whiteSpace: 'nowrap', marginLeft: 12,
                    }}>
                      £{t.price.toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status pipeline */}
          <div>
            <label style={labelStyle}>Status</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {STATUSES.map(s => {
                const isActive = status === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => setStatus(s.key)}
                    style={{
                      flex: 1,
                      padding: '6px 4px',
                      borderRadius: 3,
                      cursor: 'pointer',
                      background: isActive ? `rgba(${hexToRgb(s.color)},0.15)` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isActive ? s.color : BORDER}`,
                      color: isActive ? s.color : MUTED,
                      fontFamily: NU,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      transition: 'all 0.12s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vendor name */}
          <div>
            <label style={labelStyle}>Vendor Name</label>
            <input
              type="text"
              value={vendorName}
              onChange={e => setVendorName(e.target.value)}
              placeholder="e.g. Villa di Ulignano"
              style={inputStyle}
            />
          </div>

          {/* Vendor email */}
          <div>
            <label style={labelStyle}>Vendor Email</label>
            <input
              type="email"
              value={vendorEmail}
              onChange={e => setVendorEmail(e.target.value)}
              placeholder="contact@vendor.com"
              style={inputStyle}
            />
          </div>

          {/* Custom price */}
          <div>
            <label style={labelStyle}>
              Custom Price (£)
              <span style={{ fontWeight: 400, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>
                — overrides tier default (leave blank for £{TIER_DEFAULTS[tier]?.toLocaleString()})
              </span>
            </label>
            <input
              type="number"
              min={0}
              step={50}
              value={customPrice}
              onChange={e => setCustomPrice(e.target.value)}
              placeholder={String(TIER_DEFAULTS[tier])}
              style={inputStyle}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Internal Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any internal notes about this slot…"
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: 72,
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* Price preview */}
          <div style={{
            marginTop: 16,
            padding: '12px 14px',
            background: 'rgba(201,168,76,0.06)',
            border: `1px solid rgba(201,168,76,0.2)`,
            borderRadius: 4,
          }}>
            <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Effective Price
            </div>
            <div style={{ fontFamily: GD, fontSize: 22, fontStyle: 'italic', color: GOLD }}>
              £{getEffectivePrice().toLocaleString()}
            </div>
            <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, marginTop: 2 }}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)} tier · {status.charAt(0).toUpperCase() + status.slice(1)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 18px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>

          {/* Send result feedback */}
          {sendResult === 'sent' && (
            <div style={{
              marginBottom: 10, padding: '8px 12px', borderRadius: 4,
              background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)',
              fontFamily: NU, fontSize: 10, fontWeight: 700, color: '#34d399',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              ✓ Offer email sent — status set to Offered
            </div>
          )}
          {sendResult === 'error' && (
            <div style={{
              marginBottom: 10, padding: '8px 12px', borderRadius: 4,
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
              fontFamily: NU, fontSize: 10, fontWeight: 700, color: '#f87171',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              ✕ Send failed — check email address and try again
            </div>
          )}

          {/* Proof result feedback */}
          {proofResult === 'sent' && (
            <div style={{
              marginBottom: 10, padding: '8px 12px', borderRadius: 4,
              background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.3)',
              fontFamily: NU, fontSize: 10, fontWeight: 700, color: '#a78bfa',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              ✓ Proof sent — status set to Proof Sent
            </div>
          )}
          {proofResult === 'error' && (
            <div style={{
              marginBottom: 10, padding: '8px 12px', borderRadius: 4,
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
              fontFamily: NU, fontSize: 10, fontWeight: 700, color: '#f87171',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              ✕ Proof delivery failed — check console for details
            </div>
          )}

          {/* Invoice download — shown when status is 'paid' or 'proof_sent' */}
          {(status === 'paid' || status === 'proof_sent') && vendorName.trim() && (
            <button
              onClick={() => generateInvoicePDF(
                { tier, status, vendor_name: vendorName.trim(), vendor_email: vendorEmail.trim(), price: getEffectivePrice(), notes: notes.trim() },
                issueName,
                pageName
              )}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 3, cursor: 'pointer',
                background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.25)',
                color: '#34d399',
                fontFamily: NU, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginBottom: 8, transition: 'all 0.15s',
              }}
            >
              ↓ Download Invoice PDF
            </button>
          )}

          {/* Stripe Payment Link — shown when email and tier are set */}
          {vendorEmail.trim() && tier && (
            <div style={{ marginBottom: 8 }}>
              <button
                onClick={handleGeneratePaymentLink}
                disabled={paymentLinkLoading}
                style={{
                  width: '100%', padding: '10px 0', borderRadius: 3,
                  cursor: paymentLinkLoading ? 'not-allowed' : 'pointer',
                  background: paymentLinkLoading ? 'rgba(96,165,250,0.04)' : 'rgba(96,165,250,0.1)',
                  border: `1px solid ${paymentLinkLoading ? 'rgba(96,165,250,0.15)' : 'rgba(96,165,250,0.35)'}`,
                  color: paymentLinkLoading ? 'rgba(96,165,250,0.4)' : '#60a5fa',
                  fontFamily: NU, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  marginBottom: paymentLink || paymentLinkError ? 8 : 0, transition: 'all 0.15s',
                }}
              >
                {paymentLinkLoading ? '⋯ Generating…' : '💳 Generate Payment Link'}
              </button>
              {paymentLinkError && (
                <div style={{
                  padding: '8px 12px', borderRadius: 4,
                  background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)',
                  fontFamily: NU, fontSize: 10, color: '#f87171', lineHeight: 1.5,
                }}>
                  {paymentLinkError}
                </div>
              )}
              {paymentLink && (
                <div style={{
                  padding: '10px 12px', borderRadius: 4,
                  background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)',
                }}>
                  <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: '#60a5fa', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                    ✓ Payment Link Generated
                  </div>
                  <code style={{
                    display: 'block', fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.65)',
                    background: 'rgba(255,255,255,0.05)', padding: '6px 8px', borderRadius: 3,
                    wordBreak: 'break-all', marginBottom: 8, lineHeight: 1.4,
                  }}>
                    {paymentLink}
                  </code>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={handleCopyPaymentLink}
                      style={{
                        flex: 1, padding: '6px 0', borderRadius: 3, cursor: 'pointer',
                        background: paymentLinkCopied ? 'rgba(52,211,153,0.1)' : 'rgba(96,165,250,0.08)',
                        border: `1px solid ${paymentLinkCopied ? 'rgba(52,211,153,0.3)' : 'rgba(96,165,250,0.25)'}`,
                        color: paymentLinkCopied ? '#34d399' : '#60a5fa',
                        fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                      }}
                    >
                      {paymentLinkCopied ? '✓ Copied' : '⎘ Copy'}
                    </button>
                    <button
                      onClick={handleSendPaymentLinkToVendor}
                      style={{
                        flex: 1, padding: '6px 0', borderRadius: 3, cursor: 'pointer',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.55)',
                        fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                      }}
                    >
                      ✉ Send to Vendor
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Send Proof button — shown when status is 'paid' and canvasJSON is available */}
          {status === 'paid' && canvasJSON && vendorEmail.trim() && (
            <button
              onClick={handleSendProof}
              disabled={proofSending}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 3,
                cursor: proofSending ? 'not-allowed' : 'pointer',
                background: proofSending ? 'rgba(167,139,250,0.06)' : 'linear-gradient(135deg,rgba(167,139,250,0.2),rgba(167,139,250,0.08))',
                border: `1px solid ${proofSending ? 'rgba(167,139,250,0.2)' : 'rgba(167,139,250,0.5)'}`,
                color: proofSending ? 'rgba(167,139,250,0.4)' : '#a78bfa',
                fontFamily: NU, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginBottom: 8, transition: 'all 0.15s',
              }}
            >
              {proofSending ? '⋯ Generating…' : '◈ Send Proof to Vendor'}
            </button>
          )}

          {/* Send Offer button — full width, prominent, shown when email is filled */}
          {vendorEmail.trim() && (
            <button
              onClick={handleSendOffer}
              disabled={sending}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 3,
                cursor: sending ? 'not-allowed' : 'pointer',
                background: sending ? 'rgba(201,168,76,0.06)' : 'linear-gradient(135deg,rgba(201,168,76,0.25),rgba(201,168,76,0.12))',
                border: `1px solid ${sending ? 'rgba(201,168,76,0.2)' : 'rgba(201,168,76,0.6)'}`,
                color: sending ? 'rgba(201,168,76,0.4)' : GOLD,
                fontFamily: NU, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginBottom: 8, transition: 'all 0.15s',
              }}
            >
              {sending ? '⋯ Sending…' : '✉ Send Offer to Vendor'}
            </button>
          )}

          {/* Clear + Save row */}
          <div style={{ display: 'flex', gap: 10 }}>
            {slot && (
              <button
                onClick={handleClear}
                style={{
                  padding: '9px 14px', borderRadius: 3, cursor: 'pointer',
                  background: 'rgba(248,113,113,0.08)',
                  border: '1px solid rgba(248,113,113,0.25)',
                  color: '#f87171',
                  fontFamily: NU, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                Clear Slot
              </button>
            )}
            <button
              onClick={handleSave}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 3, cursor: 'pointer',
                background: 'rgba(201,168,76,0.15)',
                border: `1px solid rgba(201,168,76,0.45)`,
                color: GOLD,
                fontFamily: NU, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}
            >
              ◆ Save Slot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper: convert hex or named colour to "r,g,b" string for rgba()
function hexToRgb(hex) {
  if (!hex || !hex.startsWith('#')) return '255,255,255';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '255,255,255';
  return `${r},${g},${b}`;
}
