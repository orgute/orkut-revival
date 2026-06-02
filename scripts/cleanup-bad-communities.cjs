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
  let r = await mgmt("SELECT count(*) FROM communities")
  console.log(`Before: ${r.body}`)

  // Show samples of what still has codes
  r = await mgmt(`SELECT name FROM communities WHERE name ~ '/c[0-9]+' OR name ~ ' c[0-9]{4,}' LIMIT 15`)
  console.log(`Samples with codes still:\n${r.body.slice(0,600)}`)

  // Step 1: Strip " /cNNNNNN" from anywhere in the name (middle or end)
  r = await mgmt(`UPDATE communities SET name = trim(regexp_replace(name, '\\s*/c[0-9]+', '', 'g')) WHERE name ~ '/c[0-9]+'`)
  console.log(`Stripped /cXXX: ${r.status} — ${r.body.slice(0,80)}`)

  // Step 2: Strip " cNNNNNN" (space + c + digits) from end
  r = await mgmt(`UPDATE communities SET name = trim(regexp_replace(name, '\\s+c[0-9]{4,}\\s*$', '')) WHERE name ~ '\\s+c[0-9]{4,}$'`)
  console.log(`Stripped cXXX suffix: ${r.status}`)

  // Step 3: Delete rows where name is now empty or just a code
  r = await mgmt(`DELETE FROM communities WHERE trim(name) = '' OR name ~ '^c[0-9]+$' OR name ~ '^/c[0-9]+$' OR length(trim(name)) < 2`)
  console.log(`Deleted empty/code rows: ${r.status}`)

  // Step 4: Remove "0 " prefix left by earlier bad import
  r = await mgmt(`UPDATE communities SET name = trim(substring(name from 3)) WHERE name ~ '^0 ' AND members_count = 0`)
  console.log(`Removed "0 " prefix: ${r.status}`)

  // Final check — any remaining with codes?
  r = await mgmt(`SELECT count(*) FROM communities WHERE name ~ '/c[0-9]+'`)
  console.log(`Still has /c codes: ${r.body}`)

  r = await mgmt(`SELECT count(*) FROM communities WHERE name ~ ' c[0-9]{4,}'`)
  console.log(`Still has space+c codes: ${r.body}`)

  r = await mgmt("SELECT count(*) FROM communities")
  console.log(`Total after cleanup: ${r.body}`)

  r = await mgmt("SELECT name, members_count FROM communities ORDER BY members_count DESC LIMIT 8")
  console.log(`Top 8:\n${r.body.slice(0,400)}`)
}
main().catch(e=>{ console.error(e.message); process.exit(1) })
