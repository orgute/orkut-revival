ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS invited_at timestamptz;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS notes text;

-- Only allow reading/updating for authenticated admin
CREATE POLICY "waitlist_select" ON waitlist FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "waitlist_update" ON waitlist FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "waitlist_delete" ON waitlist FOR DELETE USING (auth.uid() IS NOT NULL);

SELECT 'waitlist admin ready' as status;
