CREATE TABLE IF NOT EXISTS photo_comments (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id   uuid REFERENCES album_photos(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  text       text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE photo_comments ENABLE ROW LEVEL SECURITY;

-- Friends of the photo owner can see comments
CREATE POLICY "comments_select" ON photo_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Authenticated members can comment
CREATE POLICY "comments_insert" ON photo_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only own comments can be deleted
CREATE POLICY "comments_delete" ON photo_comments
  FOR DELETE USING (auth.uid() = user_id);

SELECT 'photo_comments ready' as status;
