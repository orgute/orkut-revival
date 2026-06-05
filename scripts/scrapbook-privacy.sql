-- ── Scrapbook privacy setting ────────────────────────────────
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS scrapbook_privacy text DEFAULT 'friends' 
  CHECK (scrapbook_privacy IN ('friends','friends_of_friends'));

-- ── Friends-of-friends helper ────────────────────────────────
CREATE OR REPLACE FUNCTION friends_of_friends(viewer uuid, owner uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM friendships f1
    JOIN friendships f2 ON (
      (f2.requester_id = f1.requester_id OR f2.requester_id = f1.addressee_id OR
       f2.addressee_id = f1.requester_id OR f2.addressee_id = f1.addressee_id)
    )
    WHERE f1.status = 'accepted' AND f2.status = 'accepted'
    AND (f1.requester_id = viewer OR f1.addressee_id = viewer)
    AND (f2.requester_id = owner  OR f2.addressee_id = owner)
    AND viewer != owner
  )
$$;

-- ── Helper: can viewer see owner's scrapbook? ─────────────────
CREATE OR REPLACE FUNCTION can_see_scrapbook(viewer uuid, owner uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT CASE
    WHEN viewer = owner THEN true
    WHEN are_friends(viewer, owner) THEN true
    WHEN (SELECT scrapbook_privacy FROM profiles WHERE id = owner) = 'friends_of_friends'
      AND friends_of_friends(viewer, owner) THEN true
    ELSE false
  END
$$;

-- ── Update recados RLS to respect privacy setting ─────────────
DROP POLICY IF EXISTS "recados_select" ON recados;
CREATE POLICY "recados_select" ON recados
  FOR SELECT USING (
    auth.uid() = to_id OR
    auth.uid() = from_id OR
    can_see_scrapbook(auth.uid(), to_id)
  );

DROP POLICY IF EXISTS "recados_insert" ON recados;
CREATE POLICY "recados_insert" ON recados
  FOR INSERT WITH CHECK (
    auth.uid() = from_id AND
    can_see_scrapbook(auth.uid(), to_id)
  );

SELECT 'Scrapbook privacy migration complete' as status;
