const https = require("https")
const PROJECT = "uakmvwwgtjrwdymfwtrf"
const KEY = process.env.SUPABASE_SERVICE_KEY

function rest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const req = https.request({
      hostname: `${PROJECT}.supabase.co`,
      path: `/rest/v1/${path}`, method,
      headers: {
        "apikey": KEY,
        "Authorization": `Bearer ${KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {})
      }
    }, res => {
      let b = ""
      res.on("data", d => b += d)
      res.on("end", () => resolve({ status: res.statusCode, body: b }))
    })
    req.on("error", reject)
    if (data) req.write(data)
    req.end()
  })
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  console.log("KEY:", KEY ? KEY.slice(0, 30) + "..." : "MISSING")

  // Check count first
  let r = await rest("GET", "communities?select=count&members_count=eq.0", null)
  console.log("Zero-member count response:", r.status, r.body.slice(0, 200))

  r = await rest("GET", "communities?select=count", null)
  console.log("Total count:", r.status, r.body.slice(0, 100))

  // Try deleting zero-member communities directly
  r = await rest("DELETE", "communities?members_count=eq.0", null)
  console.log("Delete all zero-members:", r.status, r.body.slice(0, 200))

  // Check count after
  r = await rest("GET", "communities?select=count", null)
  console.log("After delete:", r.status, r.body.slice(0, 100))

  // Fix bio too
  r = await rest("PATCH",
    "profiles?bio=eq." + encodeURIComponent("Olá! Estou de volta no Orkut :)"),
    { bio: "Olá! Estou de volta :)" }
  )
  console.log("Bio fix:", r.status, r.body.slice(0, 100))
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1) })
