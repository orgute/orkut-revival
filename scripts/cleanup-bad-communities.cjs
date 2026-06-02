const https = require("https")
const PROJECT = "uakmvwwgtjrwdymfwtrf"
const KEY     = process.env.SUPABASE_SERVICE_KEY

function mgmt(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql })
    const req  = https.request({
      hostname: "api.supabase.com",
      path: `/v1/projects/${PROJECT}/database/query`,
      method: "POST",
      headers: { "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }
    }, res => { let b=""; res.on("data",d=>b+=d); res.on("end",()=>resolve({status:res.statusCode,body:b})) })
    req.on("error", reject); req.write(data); req.end()
  })
}

async function main() {
  let r

  // ── 1. Fix bio on all profiles ────────────────────────────────────────────
  r = await mgmt(`UPDATE profiles SET bio = 'Olá! Estou de volta :)' WHERE bio = 'Olá! Estou de volta no Orkut :)'`)
  console.log(`Bio fix: ${r.status} — ${r.body.slice(0,100)}`)

  // ── 2. Communities — nuclear approach ─────────────────────────────────────
  // Show exactly what patterns still exist
  r = await mgmt(`SELECT name FROM communities WHERE name ~ '[/\\\\]?c[0-9]{4,}' LIMIT 20`)
  console.log(`\nSamples with codes:\n${r.body.slice(0,600)}`)

  // Delete ANY community where name contains /cNNNN or cNNNN (5+ digits)
  r = await mgmt(`DELETE FROM communities WHERE name ~ '/c[0-9]{4,}'`)
  console.log(`\nDeleted /cNNNN entries: ${r.status} — ${r.body.slice(0,80)}`)

  r = await mgmt(`DELETE FROM communities WHERE name ~ '(^|\\s)c[0-9]{5,}($|\\s)'`)
  console.log(`Deleted standalone cNNNNN entries: ${r.status}`)

  // Strip trailing code patterns like " /c12345" or " c12345" from names
  r = await mgmt(`UPDATE communities SET name = trim(regexp_replace(name, '[[:space:]]*/c[0-9]+[[:space:]]*', '', 'g'))`)
  console.log(`Stripped /cNNN from names: ${r.status}`)

  r = await mgmt(`UPDATE communities SET name = trim(regexp_replace(name, '[[:space:]]+c[0-9]{5,}[[:space:]]*$', ''))`)
  console.log(`Stripped trailing cNNNNN: ${r.status}`)

  // Clean up "0 " prefix 
  r = await mgmt(`UPDATE communities SET name = trim(substring(name from 3)) WHERE name ~ '^0 '`)
  console.log(`Removed "0 " prefix: ${r.status}`)

  // Delete anything now empty or too short
  r = await mgmt(`DELETE FROM communities WHERE length(trim(name)) < 3`)
  console.log(`Deleted short names: ${r.status}`)

  // Final check
  r = await mgmt(`SELECT count(*) FROM communities WHERE name ~ 'c[0-9]{4,}'`)
  console.log(`\nStill has codes: ${r.body}`)

  r = await mgmt(`SELECT count(*) FROM communities`)
  console.log(`Total: ${r.body}`)

  r = await mgmt(`SELECT name FROM communities ORDER BY members_count DESC LIMIT 8`)
  console.log(`Top 8:\n${r.body.slice(0,400)}`)
}
main().catch(e=>{ console.error(e.message); process.exit(1) })
