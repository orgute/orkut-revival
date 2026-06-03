-- ═══════════════════════════════════════════════════════════
-- PRIVACY MIGRATION — Full private social network
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ── Helper: are two users friends? ──────────────────────────
CREATE OR REPLACE FUNCTION are_friends(uid1 uuid, uid2 uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
    AND ((requester_id = uid1 AND addressee_id = uid2)
      OR (requester_id = uid2 AND addressee_id = uid1))
  )
$$;

-- ── PROFILES ─────────────────────────────────────────────────
-- Logged-in users can see all profiles (for search)
-- but we control what fields are exposed at app level
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ── FRIENDSHIPS ──────────────────────────────────────────────
DROP POLICY IF EXISTS "friendships_select" ON friendships;
CREATE POLICY "friendships_select" ON friendships
  FOR SELECT USING (auth.uid() IN (requester_id, addressee_id));

DROP POLICY IF EXISTS "friendships_insert" ON friendships;
CREATE POLICY "friendships_insert" ON friendships
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "friendships_update" ON friendships;
CREATE POLICY "friendships_update" ON friendships
  FOR UPDATE USING (auth.uid() = addressee_id);

-- ── RECADOS — only friends can see/post ──────────────────────
DROP POLICY IF EXISTS "recados_select" ON recados;
CREATE POLICY "recados_select" ON recados
  FOR SELECT USING (
    auth.uid() = to_id OR
    auth.uid() = from_id OR
    are_friends(auth.uid(), to_id)
  );

DROP POLICY IF EXISTS "recados_insert" ON recados;
CREATE POLICY "recados_insert" ON recados
  FOR INSERT WITH CHECK (
    auth.uid() = from_id AND
    (auth.uid() = to_id OR are_friends(auth.uid(), to_id))
  );

DROP POLICY IF EXISTS "recados_delete" ON recados;
CREATE POLICY "recados_delete" ON recados
  FOR DELETE USING (auth.uid() = to_id OR auth.uid() = from_id);

-- ── DEPOIMENTOS — friends only ───────────────────────────────
DROP POLICY IF EXISTS "depoimentos_select" ON depoimentos;
CREATE POLICY "depoimentos_select" ON depoimentos
  FOR SELECT USING (
    auth.uid() = to_id OR
    auth.uid() = from_id OR
    are_friends(auth.uid(), to_id)
  );

DROP POLICY IF EXISTS "depoimentos_insert" ON depoimentos;
CREATE POLICY "depoimentos_insert" ON depoimentos
  FOR INSERT WITH CHECK (
    auth.uid() = from_id AND are_friends(auth.uid(), to_id)
  );

-- ── MESSAGES — direct only between friends ───────────────────
DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (auth.uid() IN (from_id, to_id));

DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = from_id AND are_friends(auth.uid(), to_id)
  );

-- ── COMMUNITIES — visible to all members ─────────────────────
DROP POLICY IF EXISTS "communities_select" ON communities;
CREATE POLICY "communities_select" ON communities
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ── COMMUNITY POSTS — members only ───────────────────────────
DROP POLICY IF EXISTS "community_posts_select" ON community_posts;
CREATE POLICY "community_posts_select" ON community_posts
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (SELECT 1 FROM memberships WHERE community_id = community_posts.community_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "community_posts_insert" ON community_posts;
CREATE POLICY "community_posts_insert" ON community_posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (SELECT 1 FROM memberships WHERE community_id = community_posts.community_id AND user_id = auth.uid())
  );

-- ── MEMBERSHIPS ──────────────────────────────────────────────
DROP POLICY IF EXISTS "memberships_select" ON memberships;
CREATE POLICY "memberships_select" ON memberships
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "memberships_insert" ON memberships;
CREATE POLICY "memberships_insert" ON memberships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "memberships_delete" ON memberships;
CREATE POLICY "memberships_delete" ON memberships
  FOR DELETE USING (auth.uid() = user_id);

-- ── INVITES ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "invites_select" ON invites;
CREATE POLICY "invites_select" ON invites
  FOR SELECT USING (auth.uid() = created_by OR auth.uid() = used_by OR used_by IS NULL);

-- ── PROFILE VISITS ───────────────────────────────────────────
DROP POLICY IF EXISTS "visits_select" ON profile_visits;
CREATE POLICY "visits_select" ON profile_visits
  FOR SELECT USING (auth.uid() = visited_id);

DROP POLICY IF EXISTS "visits_insert" ON profile_visits;
CREATE POLICY "visits_insert" ON profile_visits
  FOR INSERT WITH CHECK (auth.uid() = visitor_id);

-- ═══════════════════════════════════════════════════════════
-- ALBUMS + PHOTOS tables
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS albums (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name        text NOT NULL,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "albums_select" ON albums
  FOR SELECT USING (
    auth.uid() = user_id OR are_friends(auth.uid(), user_id)
  );
CREATE POLICY "albums_insert" ON albums
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "albums_delete" ON albums
  FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS album_photos (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id    uuid REFERENCES albums(id) ON DELETE CASCADE NOT NULL,
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  storage_path text NOT NULL,
  caption     text,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE album_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "photos_select" ON album_photos
  FOR SELECT USING (
    auth.uid() = user_id OR are_friends(auth.uid(), user_id)
  );
CREATE POLICY "photos_insert" ON album_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "photos_delete" ON album_photos
  FOR DELETE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════
-- STORAGE: make avatars bucket private
-- (run separately if needed)
-- ═══════════════════════════════════════════════════════════
-- UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Storage RLS for avatars bucket
DROP POLICY IF EXISTS "avatars_select" ON storage.objects;
CREATE POLICY "avatars_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'avatars' AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "avatars_insert" ON storage.objects;
CREATE POLICY "avatars_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
CREATE POLICY "avatars_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

COMMENT ON TABLE albums IS 'User photo albums';
COMMENT ON TABLE album_photos IS 'Photos within albums, stored in Supabase Storage';

SELECT 'Privacy migration complete' as status;
