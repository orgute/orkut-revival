import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const { name, email } = await req.json()
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({
      from: 'Orgute <convite@orgute.org>',
      to: email,
      subject: 'Pedido de convite recebido 🧡',
      html: `<div style="font-family:Verdana,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#dce3f0;">
        <div style="font-size:42px;font-family:Georgia,serif;color:#e8197d;margin-bottom:8px;">Oi</div>
        <h2 style="color:#2a3f6f;font-size:18px;margin-bottom:16px;">Olá, ${name}!</h2>
        <p style="color:#444;line-height:1.8;margin-bottom:16px;">
          Recebemos seu pedido de convite para o <strong>Orgute</strong>.<br/>
          Em breve você receberá seu convite por aqui. 🧡
        </p>
        <p style="color:#666;font-size:12px;line-height:1.6;">Comunidade por convite. Sem anúncios. Sem algoritmo. Conexões reais.</p>
        <div style="margin-top:20px;padding:16px;background:#f0e8f5;border-radius:4px;text-align:center;">
          <p style="color:#2a3f6f;font-size:13px;font-weight:700;margin:0 0 8px;">Já conta pra galera! 🧡</p>
          <p style="color:#666;font-size:12px;line-height:1.6;margin:0 0 12px;">Siga e marque seus amigos nos stories — quanto mais gente souber, mais gostoso fica!</p>
          <div>
            <a href="https://instagram.com/orguteoficial" style="display:inline-block;background:#e8197d;color:#fff;padding:8px 18px;border-radius:20px;text-decoration:none;font-weight:700;font-size:12px;margin:4px;">📸 Instagram</a>
            <a href="https://tiktok.com/@orguteoficial" style="display:inline-block;background:#2a3f6f;color:#fff;padding:8px 18px;border-radius:20px;text-decoration:none;font-weight:700;font-size:12px;margin:4px;">🎵 TikTok</a>
          </div>
        </div>
        <hr style="border:none;border-top:1px solid #c8d0e0;margin:24px 0;"/>
        <p style="color:#999;font-size:11px;"><a href="https://orgute.org" style="color:#e8197d;">orgute.org</a> · <a href="https://instagram.com/orguteoficial" style="color:#999;">@orguteoficial</a></p>
      </div>`
    })
  })
  const data = await res.json()
  return new Response(JSON.stringify(data), { headers: { ...cors, 'Content-Type': 'application/json' } })
})
