const https = require("https")

const SUPABASE_URL = "https://uakmvwwgtjrwdymfwtrf.supabase.co"
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY
const EMAIL        = process.env.TARGET_EMAIL
const NEW_PASSWORD = process.env.NEW_PASSWORD

function apiCall(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const url  = new URL(path, SUPABASE_URL)
    const opts = {
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method,
      headers: {
        "apikey":        SERVICE_KEY,
        "Authorization": `Bearer ${SERVICE_KEY}`,
        "Content-Type":  "application/json",
        ...(data ? {"Content-Length": Buffer.byteLength(data)} : {}),
      }
    }
    const req = https.request(opts, res => {
      let b = ""
      res.on("data", d => b += d)
      res.on("end", () => {
        try { resolve({status: res.statusCode, body: JSON.parse(b)}) }
        catch { resolve({status: res.statusCode, body: b}) }
      })
    })
    req.on("error", reject)
    if (data) req.write(data)
    req.end()
  })
}

async function main() {
  // Find user by email
  const list = await apiCall("GET", "/auth/v1/admin/users?page=1&per_page=50")
  if (list.status !== 200) { console.error("Failed to list users:", list.body); process.exit(1) }

  const user = list.body.users?.find(u => u.email === EMAIL)
  if (!user) { console.error(`User ${EMAIL} not found`); process.exit(1) }
  console.log(`Found user: ${user.email} (${user.id})`)

  // Update password
  const update = await apiCall("PUT", `/auth/v1/admin/users/${user.id}`, {
    password: NEW_PASSWORD
  })
  if (update.status === 200) {
    console.log(`✅ Password updated for ${EMAIL}`)
  } else {
    console.error("Failed:", update.body)
    process.exit(1)
  }
}

main().catch(e => { console.error(e.message); process.exit(1) })
