const https = require("https")
const http  = require("http")
const zlib  = require("zlib")

const PROJECT = "uakmvwwgtjrwdymfwtrf"
const KEY     = process.env.SUPABASE_SERVICE_KEY

// ── Supabase management API query ────────────────────────────────────────────
function mgmt(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql })
    const opts = {
      hostname: "api.supabase.com",
      path: `/v1/projects/${PROJECT}/database/query`,
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KEY}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
      }
    }
    const req = https.request(opts, res => {
      let b = ""
      res.on("data", d => b += d)
      res.on("end", () => resolve({ status: res.statusCode, body: b }))
    })
    req.on("error", reject)
    req.write(data); req.end()
  })
}

// ── Supabase REST upsert (anon key — bypasses management API) ─────────────────
function restUpsert(rows) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(rows)
    const opts = {
      hostname: `${PROJECT}.supabase.co`,
      path: "/rest/v1/communities",
      method: "POST",
      headers: {
        "apikey":        KEY,
        "Authorization": `Bearer ${KEY}`,
        "Content-Type":  "application/json",
        "Prefer":        "resolution=merge-duplicates,return=minimal",
        "Content-Length": Buffer.byteLength(data)
      }
    }
    const req = https.request(opts, res => {
      let b = ""
      res.on("data", d => b += d)
      res.on("end", () => resolve({ status: res.statusCode, body: b }))
    })
    req.on("error", reject)
    req.write(data); req.end()
  })
}

// ── Fetch first chunk of the community list to understand format ──────────────
function fetchChunk(url, startByte, endByte) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http
    const opts = new URL(url)
    const reqOpts = {
      hostname: opts.hostname,
      path: opts.pathname + opts.search,
      method: "GET",
      headers: { "Range": `bytes=${startByte}-${endByte}`, "User-Agent": "Mozilla/5.0" }
    }
    const req = mod.request(reqOpts, res => {
      let chunks = []
      res.on("data", d => chunks.push(d))
      res.on("end", () => resolve({ status: res.statusCode, data: Buffer.concat(chunks).toString("utf8") }))
    })
    req.on("error", reject)
    req.end()
  })
}

// ── Fetch full file (streaming, with line-by-line processing) ─────────────────
function streamAndProcess(url, onLine, maxLines) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http
    const opts = new URL(url)
    let lineCount = 0
    let buffer = ""
    let done = false

    const req = mod.request({
      hostname: opts.hostname,
      path: opts.pathname + opts.search,
      method: "GET",
      headers: { "User-Agent": "Mozilla/5.0" }
    }, res => {
      console.log(`HTTP ${res.statusCode}, Content-Type: ${res.headers["content-type"]}`)
      
      let stream = res
      if (res.headers["content-encoding"] === "gzip") {
        stream = res.pipe(zlib.createGunzip())
      }

      stream.on("data", chunk => {
        if (done) return
        buffer += chunk.toString("utf8")
        const lines = buffer.split("\n")
        buffer = lines.pop() // keep incomplete last line
        
        for (const line of lines) {
          if (done) break
          onLine(line.trim())
          lineCount++
          if (maxLines && lineCount >= maxLines) {
            done = true
            req.destroy()
            break
          }
        }
      })
      stream.on("end", () => {
        if (buffer.trim()) onLine(buffer.trim())
        resolve(lineCount)
      })
      stream.on("error", reject)
    })
    req.on("error", e => {
      if (done) resolve(lineCount)  // expected abort
      else reject(e)
    })
    req.end()
  })
}

async function main() {
  console.log("=== Orkut Community Import ===\n")

  const FILE_URL = "https://archive.org/download/orkut-community-list/Orkut%20Community%20List.txt"

  // ── Step 1: peek at first 2KB to understand format ───────────────────────
  console.log("1. Peeking at file format...")
  const peek = await fetchChunk(FILE_URL, 0, 2000)
  console.log(`Status: ${peek.status}`)
  console.log("First 2000 chars:\n" + peek.data.slice(0, 2000))
  console.log("\n---\n")

  // ── Step 2: Check existing communities count ─────────────────────────────
  const existing = await mgmt("SELECT count(*) FROM communities")
  console.log(`2. Existing communities: ${existing.body}`)

  // ── Step 3: Stream and collect communities ───────────────────────────────
  console.log("\n3. Streaming community list (first 500K lines)...")

  const communities = []
  let linesSeen = 0
  let parseErrors = 0

  // We'll collect up to 500K lines to understand the full dataset,
  // then filter and insert the best ones
  await streamAndProcess(FILE_URL, (line) => {
    if (!line || line.startsWith("#")) return
    linesSeen++

    // Log first 20 lines to understand format
    if (linesSeen <= 20) console.log(`  Line ${linesSeen}: ${line.slice(0, 120)}`)

    // Try to parse — format TBD based on peek
    // Common formats: "code|name|category|members" or "code,name" or JSON
    try {
      // Try pipe-separated
      const parts = line.split("|")
      if (parts.length >= 2) {
        const [code, name, category, members] = parts
        if (name && name.length > 1) {
          communities.push({ code: code.trim(), name: name.trim(), 
            category: (category||"Geral").trim(), 
            members: parseInt(members)||0 })
        }
      } else {
        // Try comma
        const cparts = line.split(",")
        if (cparts.length >= 2) {
          communities.push({ code: cparts[0].trim(), name: cparts[1].trim(), 
            category: "Geral", members: 0 })
        } else if (line.length > 2) {
          // Just a name
          communities.push({ code: "", name: line, category: "Geral", members: 0 })
        }
      }
    } catch(e) { parseErrors++ }
  }, 500000)

  console.log(`\nLines seen: ${linesSeen}`)
  console.log(`Parsed: ${communities.length}`)
  console.log(`Parse errors: ${parseErrors}`)
  console.log(`\nSample communities:`)
  communities.slice(0, 10).forEach(c => console.log(`  ${JSON.stringify(c)}`))

  if (communities.length === 0) {
    console.log("\n⚠️  No communities parsed — check format above and adjust script")
    process.exit(0)
  }

  // ── Step 4: Insert into Supabase ─────────────────────────────────────────
  console.log("\n4. Inserting communities into Supabase...")

  // Map to our schema
  const rows = communities.slice(0, 50000).map((c, i) => ({
    name:          c.name.slice(0, 200),
    category:      c.category || "Geral",
    description:   null,
    seed:          c.code || ("og"+i),
    members_count: c.members || 0,
    orkut_code:    c.code || null,
  }))

  // Batch insert (100 at a time)
  let inserted = 0
  const BATCH = 100
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const res = await restUpsert(batch)
    if (res.status >= 200 && res.status < 300) {
      inserted += batch.length
    } else {
      console.log(`  Batch ${i}-${i+BATCH}: ${res.status} — ${res.body.slice(0,100)}`)
    }
    if (i % 5000 === 0) console.log(`  Progress: ${inserted}/${rows.length}`)
  }

  console.log(`\n✅ Inserted ${inserted} communities`)
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1) })
