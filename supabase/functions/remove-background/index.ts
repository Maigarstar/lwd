import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const { image_url } = await req.json();
    const apiKey = Deno.env.get('REMOVE_BG_API_KEY');
    if (!apiKey) throw new Error('REMOVE_BG_API_KEY not configured. Get a free key at remove.bg');

    const formData = new FormData();
    formData.append('image_url', image_url);
    formData.append('size', 'auto');

    const res = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.errors?.[0]?.title || 'remove.bg error');
    }

    // Response is the PNG image binary — upload to Supabase storage
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const imgBuffer = await res.arrayBuffer();
    const path = `removebg/${Date.now()}.png`;
    await supabase.storage.from('magazine-pages').upload(path, imgBuffer, { contentType: 'image/png', upsert: true });
    const { data: { publicUrl } } = supabase.storage.from('magazine-pages').getPublicUrl(path);

    return new Response(JSON.stringify({ url: publicUrl }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
