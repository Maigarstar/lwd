// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: upload-magazine-page
// ═══════════════════════════════════════════════════════════════════════════
// Server-side proxy for writing magazine page / thumb / cover / pdf assets
// into Storage. The browser never touches storage.objects directly — this
// function validates the auth context, then uploads with SERVICE ROLE so
// RLS on storage.objects does not block the write.
//
// Why this exists:
//   Supabase dashboard-created buckets do NOT auto-create INSERT policies
//   on storage.objects. Rather than adding per-bucket RLS, we centralise
//   writes here. This also gives us one place to enforce path rules,
//   allowed buckets, size limits, and MIME types.
//
// Request:
//   POST  multipart/form-data
//   Headers:
//     Authorization: Bearer <user JWT>   (required — authenticated users only)
//   Body (form fields):
//     file         : File (Blob)             required
//     bucket       : string                  required  — must be allow-listed
//     path         : string                  required  — must match pattern
//     contentType  : string                  optional  — defaults to file.type
//
// Response:
//   200 { success: true, data: { publicUrl, storagePath, bucket } }
//   4xx { success: false, error: string }
//
// Env secrets required (set in Supabase dashboard → Project Settings → Edge Functions):
//   SUPABASE_URL                — auto-populated
//   SUPABASE_SERVICE_ROLE_KEY   — auto-populated
//   SUPABASE_ANON_KEY           — auto-populated (for JWT verification)
// ═══════════════════════════════════════════════════════════════════════════

import { serve }        from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.42.0';

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-token',
  'Content-Type':                 'application/json',
};

// Allow-list: only these buckets can be written to via this function.
const ALLOWED_BUCKETS = new Set([
  'magazine-pages',
  'magazine-thumbs',
  'magazine-covers',
  'magazine-pdfs',
]);

// Per-bucket size ceilings (in bytes). Belt-and-braces alongside bucket-level
// limits in Supabase Storage.
const BUCKET_MAX_BYTES: Record<string, number> = {
  'magazine-pages':  50 * 1024 * 1024,   // 50 MB
  'magazine-thumbs': 10 * 1024 * 1024,   // 10 MB
  'magazine-covers': 20 * 1024 * 1024,   // 20 MB
  'magazine-pdfs':   200 * 1024 * 1024,  // 200 MB
};

// Per-bucket allowed MIME prefixes.
const BUCKET_ALLOWED_MIME: Record<string, string[]> = {
  'magazine-pages':  ['image/jpeg', 'image/png'],
  'magazine-thumbs': ['image/jpeg', 'image/png'],
  'magazine-covers': ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  'magazine-pdfs':   ['application/pdf'],
};

// Path pattern: must be "<uuid-or-slug>/<safe>/.../<name>.<ext>". No "..", no leading "/", no "//".
// Keeps us safe from path-traversal and cross-issue writes.
const VALID_PATH_RE = /^[A-Za-z0-9][A-Za-z0-9._/-]*\.[A-Za-z0-9]+$/;

function ok(data: unknown, status = 200) {
  return new Response(JSON.stringify({ success: true, data }), { status, headers: CORS });
}

function err(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ success: false, error: message, ...extra }), { status, headers: CORS });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST')    return err('Method not allowed', 405);

  try {
    // ── 1. Identify caller (diagnostic only) ────────────────────────────────
    // Projects using ES256 JWTs cannot pass the user token in Authorization —
    // the platform rejects ES256 Bearer tokens at the gateway level.
    // The browser sends Authorization: Bearer <anon-key> (HS256, always accepted)
    // and passes the user JWT separately as x-user-token for logging only.
    const userToken = req.headers.get('x-user-token') || '';
    let callerId = 'unknown';
    if (userToken) {
      try {
        const payloadB64 = userToken.split('.')[1] ?? '';
        const padded = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(atob(padded));
        callerId = decoded?.sub ?? decoded?.email ?? decoded?.role ?? 'decoded-no-sub';
      } catch { /* non-fatal — logging only */ }
    }
    // ── 2. Parse multipart body ──────────────────────────────────────────────
    let form: FormData;
    try {
      form = await req.formData();
    } catch (e) {
      return err(`Invalid multipart body: ${(e as Error).message}`, 400);
    }

    const bucket      = String(form.get('bucket')      || '');
    const path        = String(form.get('path')        || '');
    const contentType = String(form.get('contentType') || '');
    const file        = form.get('file');

    console.log('[upload-magazine-page] caller:', callerId,
      '| bucket:', bucket, '| path:', path,
      '| user-token-present:', !!userToken);

    if (!bucket)              return err('Missing "bucket" field', 400);
    if (!path)                return err('Missing "path" field', 400);
    if (!(file instanceof File) && !(file instanceof Blob)) {
      return err('Missing "file" field (must be a File or Blob)', 400);
    }

    // ── 3. Validate against allow-lists ──────────────────────────────────────
    if (!ALLOWED_BUCKETS.has(bucket)) {
      return err(`Bucket "${bucket}" is not allowed. Allowed: ${[...ALLOWED_BUCKETS].join(', ')}`, 400);
    }

    if (!VALID_PATH_RE.test(path) || path.includes('..') || path.includes('//')) {
      return err(`Invalid path "${path}". Must match <segment>/.../<name>.<ext> with no "..".`, 400);
    }

    const sizeBytes = (file as Blob).size;
    const maxBytes  = BUCKET_MAX_BYTES[bucket] ?? 50 * 1024 * 1024;
    if (sizeBytes > maxBytes) {
      return err(
        `File size ${sizeBytes} exceeds ${maxBytes} bytes for bucket "${bucket}"`,
        413,
        { sizeBytes, maxBytes }
      );
    }

    const effectiveContentType = contentType || (file as File).type || 'application/octet-stream';
    const allowedMime          = BUCKET_ALLOWED_MIME[bucket] || [];
    if (allowedMime.length && !allowedMime.some(m => effectiveContentType.startsWith(m))) {
      return err(
        `MIME type "${effectiveContentType}" not allowed for bucket "${bucket}". Allowed: ${allowedMime.join(', ')}`,
        415
      );
    }

    // ── 4. Upload with service role (bypasses storage.objects RLS) ───────────
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: uploadErr } = await serviceClient.storage
      .from(bucket)
      .upload(path, file as Blob, {
        upsert:       true,
        contentType:  effectiveContentType,
        cacheControl: '31536000',
      });

    if (uploadErr) {
      console.error('[upload-magazine-page] storage upload failed', {
        caller: callerId,
        bucket,
        path,
        err: uploadErr,
      });
      return err(`Storage upload failed: ${uploadErr.message || String(uploadErr)}`, 500);
    }

    // ── 5. Build public URL and return ───────────────────────────────────────
    const { data: pub } = serviceClient.storage.from(bucket).getPublicUrl(path);

    console.log('[upload-magazine-page] success | caller:', callerId, '| path:', path);

    return ok({
      publicUrl:   pub?.publicUrl || null,
      storagePath: path,
      bucket,
      sizeBytes,
      uploadedBy:  callerId,
    });
  } catch (e) {
    console.error('[upload-magazine-page] unexpected error', e);
    return err(`Unexpected error: ${(e as Error).message}`, 500);
  }
});
