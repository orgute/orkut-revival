const https = require("https")

const SUPABASE_URL = "https://uakmvwwgtjrwdymfwtrf.supabase.co"
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY
const EMAIL        = "elton.marques@gmail.com"
const NEW_PASSWORD = "Testtest123@"

function apiCall(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const url  = new URL(path, SUPABASE_URL)
    const opts = {
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method,
      headers: {
        "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        ...(data ? {"Content-Length": Buffer.byteLength(data)} : {}),
      }
    }
    const req = https.request(opts, res => {
      let b = ""
      res.on("data", d => b += d)
      res.on("end", () => { try { resolve({status:res.statusCode,body:JSON.parse(b)}) } catch { resolve({status:res.statusCode,body:b}) } })
    })
    req.on("error", reject)
    if (data) req.write(data)
    req.end()
  })
}

async function main() {
  console.log(`Target: ${EMAIL}`)
  console.log(`Supabase: ${SUPABASE_URL}\n`)

  // List all users
  const list = await apiCall("GET", "/auth/v1/admin/users?page=1&per_page=50")
  console.log(`List users: ${list.status}`)

  if (list.status !== 200) {
    console.log("Response:", typeof list.body === 'string' ? list.body : JSON.stringify(list.body))
    // Try creating the user directly
    console.log("\nTrying to create user instead...")
    const create = await apiCall("POST", "/auth/v1/admin/users", {
      email: EMAIL, password: NEW_PASSWORD,
      email_confirm: true,
    })
    console.log(`Create: ${create.status}`, JSON.stringify(create.body).slice(0,200))
    process.exit(create.status === 200 ? 0 : 1)
  }

  const users = list.body.users || []
  console.log(`Total users found: ${users.length}`)
  users.forEach(u => console.log(`  - ${u.email} (${u.id})`))

  const user = users.find(u => u.email === EMAIL)

  if (!user) {
    console.log(`\nUser not found — creating ${EMAIL}...`)
    const create = await apiCall("POST", "/auth/v1/admin/users", {
      email: EMAIL, password: NEW_PASSWORD, email_confirm: true,
    })
    console.log(`Create: ${create.status}`, JSON.stringify(create.body).slice(0,200))
    process.exit(create.status === 200 ? 0 : 1)
  }

  console.log(`\nFound: ${user.email} (${user.id})`)
  const update = await apiCall("PUT", `/auth/v1/admin/users/${user.id}`, {
    password: NEW_PASSWORD
  })
  console.log(`Update: ${update.status}`)
  if (update.status === 200) {
    console.log(`✅ Password set to Testtest123@`)
  } else {
    console.log("Error:", JSON.stringify(update.body))
    process.exit(1)
  }
}

main().catch(e => { console.error(e.message); process.exit(1) })
