import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import postgres from 'https://deno.land/x/postgresjs@v3.4.4/mod.js';

serve(async (req) => {
  const { sql } = await req.json().catch(() => ({}));
  const dbUrl = Deno.env.get('SUPABASE_DB_URL');
  if (!dbUrl || !sql) return new Response(JSON.stringify({ error: 'missing' }), { status: 400 });
  
  const db = postgres(dbUrl, { max: 1 });
  try {
    await db.unsafe(sql);
    await db.end();
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    await db.end();
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
