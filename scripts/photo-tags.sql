CREATE TABLE IF NOT EXISTS photo_tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id uuid REFERENCES album_photos(id) ON DELETE CASCADE NOT NULL,
  tagged_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tagged_by_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(photo_id, tagged_user_id)
);
ALTER TABLE photo_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags_select" ON photo_tags FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "tags_insert" ON photo_tags FOR INSERT WITH CHECK (auth.uid() = tagged_by_id);
CREATE POLICY "tags_delete" ON photo_tags FOR DELETE USING (auth.uid() = tagged_by_id OR auth.uid() = tagged_user_id);
SELECT 'photo_tags ready' as status;

-- Carousel grouping
ALTER TABLE album_photos ADD COLUMN IF NOT EXISTS carousel_id uuid;
ALTER TABLE album_photos ADD COLUMN IF NOT EXISTS carousel_order int DEFAULT 0;

-- Hidden "Posts" album per user (name starts with __ to hide from album list)
-- No SQL needed — created on-the-fly per user
SELECT 'carousel columns ready' as status;
