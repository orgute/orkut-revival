import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email } = await req.json()

    if (!name || !email) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_KEY}`
      },
      body: JSON.stringify({
        from: 'Orgute <convite@orgute.org>',
        to: email,
        subject: 'Pedido de convite recebido 🧡',
        html: `
          <div style="font-family:Verdana,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#dce3f0;">
            <div style="font-size:42px;font-family:Georgia,serif;color:#e8197d;margin-bottom:8px;">Oi</div>
            <h2 style="color:#2a3f6f;font-size:20px;margin-bottom:16px;">Olá, ${name}!</h2>
            <p style="color:#444;line-height:1.8;margin-bottom:16px;">
              Recebemos seu pedido de convite para o <strong>Orgute</strong>.<br/>
              Em breve você receberá seu convite por aqui. 🧡
            </p>
            <p style="color:#666;font-size:12px;line-height:1.6;">
              Comunidade por convite. Sem anúncios. Sem algoritmo. Conexões reais.
            </p>
            <hr style="border:none;border-top:1px solid #c8d0e0;margin:24px 0;"/>
            <p style="color:#999;font-size:11px;">
              <a href="https://orgute.org" style="color:#e8197d;">orgute.org</a> · 
              <a href="https://instagram.com/orguteoficial" style="color:#999;">@orguteoficial</a>
            </p>
          </div>
        `
      })
    })

    const data = await res.json()

    if (!res.ok) {
      return new Response(JSON.stringify({ error: data }), {
        status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ id: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
