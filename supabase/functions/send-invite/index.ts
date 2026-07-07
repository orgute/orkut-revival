import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const { name, email, inviteLink } = await req.json()
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({
      from: 'Orgute <convite@orgute.org>',
      to: email,
      subject: `${name}, seu convite para o Orgute chegou 🧡`,
      html: `<div style="font-family:Verdana,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#dce3f0;">
        <div style="font-size:42px;font-family:Georgia,serif;color:#e8197d;margin-bottom:8px;">Oi</div>
        <h2 style="color:#2a3f6f;font-size:18px;margin-bottom:16px;">Olá, ${name}!</h2>
        <p style="color:#444;line-height:1.8;margin-bottom:16px;">
          Seu convite para o <strong>Orgute</strong> chegou.<br/>
          A recriação do Orkut — sem anúncios, sem algoritmo, só conexões reais.
        </p>
        <a href="${inviteLink}" style="display:inline-block;margin:16px 0;background:#e8197d;
          color:#fff;padding:14px 32px;border-radius:3px;text-decoration:none;
          font-weight:700;font-family:Verdana,sans-serif;font-size:14px;">
          aceitar convite →
        </a>
        <p style="color:#666;font-size:12px;line-height:1.6;margin-top:16px;">
          Este link é pessoal e intransferível.<br/>
          Cada membro convida até 10 pessoas de confiança.
        </p>
        <hr style="border:none;border-top:1px solid #c8d0e0;margin:24px 0;"/>
        <p style="color:#999;font-size:11px;">
          <a href="https://orgute.org" style="color:#e8197d;">orgute.org</a> ·
          <a href="https://instagram.com/orguteoficial" style="color:#999;">@orguteoficial</a>
        </p>
      </div>`
    })
  })
  const data = await res.json()
  return new Response(JSON.stringify(data), {
    headers: { ...cors, 'Content-Type': 'application/json' }
  })
})
