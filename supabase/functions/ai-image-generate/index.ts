import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const { prompt } = await req.json();
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) throw new Error('OPENAI_API_KEY not configured');

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: `Luxury wedding editorial photography: ${prompt}. High-end magazine quality, cinematic lighting, elegant.`,
        n: 1,
        size: '1024x1792',
        quality: 'standard',
      }),
    });

    if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || 'OpenAI error'); }
    const data = await res.json();
    const url = data.data?.[0]?.url;
    if (!url) throw new Error('No image returned');

    return new Response(JSON.stringify({ url }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
