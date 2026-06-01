const https = require("https")

const PROJECT = "uakmvwwgtjrwdymfwtrf"
const KEY     = process.env.SUPABASE_SERVICE_KEY

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

async function main() {
  console.log("=== Invite System Check & Seed ===\n")

  // 1. Check if invites table exists
  let r = await mgmt("SELECT count(*) FROM information_schema.tables WHERE table_name='invites' AND table_schema='public'")
  console.log(`Table check: ${r.status} — ${r.body}`)

  if (r.body.includes('"count":"0"') || r.body.includes('"count": "0"')) {
    console.log("\n⚠️  Invites table missing — creating now...")

    const statements = [
      `CREATE TABLE IF NOT EXISTS invites (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        code text UNIQUE NOT NULL,
        created_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
        used_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
        used_at timestamptz,
        created_at timestamptz DEFAULT now()
      )`,
      `ALTER TABLE invites ENABLE ROW LEVEL SECURITY`,
      `DROP POLICY IF EXISTS "invites_select" ON invites`,
      `CREATE POLICY "invites_select" ON invites FOR SELECT USING (true)`,
      `DROP POLICY IF EXISTS "invites_insert" ON invites`,
      `CREATE POLICY "invites_insert" ON invites FOR INSERT WITH CHECK (true)`,
      `DROP POLICY IF EXISTS "invites_update" ON invites`,
      `CREATE POLICY "invites_update" ON invites FOR UPDATE USING (true)`,
      `CREATE OR REPLACE FUNCTION generate_invites_for_user(user_id uuid)
       RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
       DECLARE i int; code text; BEGIN
         FOR i IN 1..10 LOOP
           code := upper(substring(md5(random()::text || user_id::text || i::text) from 1 for 8));
           INSERT INTO invites (code, created_by) VALUES (code, user_id) ON CONFLICT (code) DO NOTHING;
         END LOOP;
       END; $$`,
      `CREATE OR REPLACE FUNCTION handle_new_profile()
       RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
       BEGIN PERFORM generate_invites_for_user(new.id); RETURN new; END; $$`,
      `DROP TRIGGER IF EXISTS on_profile_created ON profiles`,
      `CREATE TRIGGER on_profile_created AFTER INSERT ON profiles FOR EACH ROW EXECUTE PROCEDURE handle_new_profile()`
    ]

    for (const stmt of statements) {
      const res = await mgmt(stmt)
      const ok = res.status >= 200 && res.status < 300
      console.log(`  ${ok ? '✅' : '❌'} ${stmt.slice(0, 50).replace(/\n/g,' ')}`)
      if (!ok) console.log(`     → ${res.body.slice(0,150)}`)
    }
  } else {
    console.log("✅ Invites table exists")
  }

  // 2. Check existing profiles
  r = await mgmt("SELECT id, name FROM profiles LIMIT 10")
  console.log(`\nProfiles: ${r.status} — ${r.body.slice(0,300)}`)

  // 3. Seed invites for ALL existing profiles that don't have them
  r = await mgmt(`
    SELECT p.id, p.name, count(i.id) as invite_count
    FROM profiles p
    LEFT JOIN invites i ON i.created_by = p.id
    GROUP BY p.id, p.name
  `)
  console.log(`\nInvite counts per user:\n${r.body.slice(0,500)}`)

  // 4. Generate for anyone with 0 invites
  r = await mgmt(`
    SELECT generate_invites_for_user(p.id)
    FROM profiles p
    WHERE (SELECT count(*) FROM invites i WHERE i.created_by = p.id) = 0
  `)
  console.log(`\nSeeded: ${r.status} — ${r.body.slice(0,200)}`)

  // 5. Show final codes
  r = await mgmt(`SELECT p.name, i.code, i.used_by FROM invites i JOIN profiles p ON p.id=i.created_by ORDER BY p.name, i.code`)
  console.log(`\nFinal invite codes:\n${r.body.slice(0,1000)}`)
}

main().catch(e => { console.error(e.message); process.exit(1) })
