CREATE TABLE IF NOT EXISTS feedback (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       text NOT NULL CHECK (length(trim(name)) >= 2 AND length(trim(name)) <= 60),
  text       text NOT NULL CHECK (length(trim(text)) >= 3 AND length(trim(text)) <= 280),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
-- Anyone can read
CREATE POLICY "feedback_select" ON feedback FOR SELECT USING (true);
-- Anyone can insert (no auth required — public guestbook)
CREATE POLICY "feedback_insert" ON feedback FOR INSERT WITH CHECK (
  length(trim(name)) >= 2 AND length(trim(text)) >= 3
);
SELECT 'feedback table ready' as status;
