const https = require("https")
const PROJECT = "uakmvwwgtjrwdymfwtrf"
const KEY = process.env.SUPABASE_SERVICE_KEY

function mgmt(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql })
    const req = https.request({
      hostname: "api.supabase.com",
      path: `/v1/projects/${PROJECT}/database/query`,
      method: "POST",
      headers: { "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }
    }, res => { let b=""; res.on("data",d=>b+=d); res.on("end",()=>{ console.log(`mgmt: ${res.statusCode} — ${b.slice(0,200)}`); resolve() }) })
    req.on("error", e => { console.log(`mgmt error: ${e.message}`); resolve() })
    req.write(data); req.end()
  })
}

// Also try REST API directly
function rest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const req = https.request({
      hostname: `${PROJECT}.supabase.co`,
      path: `/rest/v1/${path}`, method,
      headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json", "Prefer": "return=representation", ...(data?{"Content-Length":Buffer.byteLength(data)}:{}) }
    }, res => { let b=""; res.on("data",d=>b+=d); res.on("end",()=>{ console.log(`rest ${method} ${path}: ${res.statusCode} — ${b.slice(0,200)}`); resolve() }) })
    req.on("error", e => { console.log(`rest error: ${e.message}`); resolve() })
    if(data) req.write(data)
    req.end()
  })
}

async function main() {
  console.log(`Key: ${KEY ? KEY.slice(0,30)+'...' : 'MISSING'}`)
  
  // Test mgmt API
  await mgmt("SELECT count(*) FROM communities")
  await mgmt("SELECT count(*) FROM profiles")
  
  // Test REST API  
  await rest("GET", "communities?select=count&limit=1", null)
  await rest("GET", "profiles?select=count&limit=1", null)
  
  // Try REST update directly
  await rest("PATCH", "profiles?bio=eq.Olá! Estou de volta no Orkut :)", { bio: "Olá! Estou de volta :)" })
  
  // Check communities with /c
  await rest("GET", "communities?name=like.%25/c%25&select=name,id&limit=5", null)
}
main().catch(e => console.error("FATAL:", e.message))
