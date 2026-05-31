// Configure Supabase auth URLs — runs in GitHub Actions
const https = require("https")

const PROJECT_REF = "uakmvwwgtjrwdymfwtrf"
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const SITE_URL    = "https://orkut-revival-app.vercel.app"

function apiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const opts = {
      hostname: "api.supabase.com",
      path,
      method,
      headers: {
        "Authorization": `Bearer ${SERVICE_KEY}`,
        "Content-Type":  "application/json",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      }
    }
    const req = https.request(opts, res => {
      let body = ""
      res.on("data", d => body += d)
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }) }
        catch { resolve({ status: res.statusCode, body }) }
      })
    })
    req.on("error", reject)
    if (data) req.write(data)
    req.end()
  })
}

async function main() {
  console.log("🔧 Configuring Supabase auth URLs...")
  console.log(`   Project: ${PROJECT_REF}`)
  console.log(`   Site URL: ${SITE_URL}\n`)

  // Get current config
  const current = await apiRequest("GET", `/v1/projects/${PROJECT_REF}/config/auth`)
  console.log(`Current config status: ${current.status}`)

  if (current.status !== 200) {
    console.log("Response:", JSON.stringify(current.body).slice(0, 200))
    console.log("\n⚠️  Cannot reach Supabase Management API — set URLs manually:")
    console.log(`   Authentication → URL Configuration → Site URL: ${SITE_URL}`)
    console.log(`   Redirect URLs: ${SITE_URL}/**`)
    process.exit(0)
  }

  const currentSiteUrl   = current.body.site_url || ""
  const currentRedirects = current.body.uri_allow_list || ""
  console.log(`Current site_url: ${currentSiteUrl}`)
  console.log(`Current redirects: ${currentRedirects}`)

  // Build new redirect list — keep existing + add ours
  const existing = currentRedirects ? currentRedirects.split(",").map(s => s.trim()).filter(Boolean) : []
  const toAdd    = [`${SITE_URL}/**`, `${SITE_URL}`]
  const merged   = [...new Set([...existing, ...toAdd])].join(",")

  // Update config
  const update = await apiRequest("PATCH", `/v1/projects/${PROJECT_REF}/config/auth`, {
    site_url:       SITE_URL,
    uri_allow_list: merged,
  })

  console.log(`\nUpdate status: ${update.status}`)
  if (update.status === 200) {
    console.log("✅ Site URL set to:   " + SITE_URL)
    console.log("✅ Redirect URLs set: " + merged)
    console.log("\n🎉 Login will now work on https://orkut-revival-app.vercel.app")
  } else {
    console.log("❌ Update failed:", JSON.stringify(update.body).slice(0, 300))
  }
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1) })
