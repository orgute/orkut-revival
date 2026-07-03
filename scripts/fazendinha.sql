CREATE TABLE IF NOT EXISTS farms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  level int DEFAULT 1, coins int DEFAULT 50, xp int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "farms_select" ON farms FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "farms_insert" ON farms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "farms_update" ON farms FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS plots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id uuid REFERENCES farms(id) ON DELETE CASCADE NOT NULL,
  position int NOT NULL CHECK (position >= 0 AND position < 16),
  state text DEFAULT 'empty' CHECK (state IN ('empty','planted','ready')),
  crop_type text, planted_at timestamptz, ready_at timestamptz,
  UNIQUE(farm_id, position)
);
ALTER TABLE plots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plots_select" ON plots FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "plots_insert" ON plots FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM farms WHERE id = farm_id));
CREATE POLICY "plots_update" ON plots FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "plots_delete" ON plots FOR DELETE USING (auth.uid() = (SELECT user_id FROM farms WHERE id = farm_id));

CREATE TABLE IF NOT EXISTS farm_animals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id uuid REFERENCES farms(id) ON DELETE CASCADE NOT NULL,
  animal_type text NOT NULL,
  last_collected timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE farm_animals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "animals_select" ON farm_animals FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "animals_insert" ON farm_animals FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM farms WHERE id = farm_id));
CREATE POLICY "animals_update" ON farm_animals FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS farm_actions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  target_farm_id uuid REFERENCES farms(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL CHECK (action IN ('stole','harvested','gifted')),
  crop_type text, coins_gained int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE farm_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "actions_select" ON farm_actions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "actions_insert" ON farm_actions FOR INSERT WITH CHECK (auth.uid() = actor_id);

CREATE TABLE IF NOT EXISTS generosity_points (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  points int DEFAULT 0, total_earned int DEFAULT 0
);
ALTER TABLE generosity_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gen_select" ON generosity_points FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "gen_all" ON generosity_points FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS farm_daily_limits (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action_date date DEFAULT CURRENT_DATE,
  steals_done int DEFAULT 0, gifts_done int DEFAULT 0,
  PRIMARY KEY (user_id, action_date)
);
ALTER TABLE farm_daily_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "limits_all" ON farm_daily_limits FOR ALL USING (auth.uid() = user_id);

SELECT 'fazendinha ready' as status;

-- Helper RPCs for atomic coin/xp updates
CREATE OR REPLACE FUNCTION add_coins_xp(uid uuid, coins int, xp int)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE farms SET
    coins = GREATEST(0, farms.coins + coins),
    xp = farms.xp + xp,
    level = CASE WHEN farms.xp + xp >= farms.level * 100 THEN farms.level + 1 ELSE farms.level END
  WHERE user_id = uid;
$$;

CREATE OR REPLACE FUNCTION decrement_coins(uid uuid, amount int)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE farms SET coins = GREATEST(0, coins - amount) WHERE user_id = uid;
$$;

-- Upsert generosity points properly
CREATE OR REPLACE FUNCTION add_generosity(uid uuid, pts int)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  INSERT INTO generosity_points(user_id, points, total_earned)
  VALUES (uid, pts, pts)
  ON CONFLICT(user_id) DO UPDATE
    SET points = generosity_points.points + pts,
        total_earned = generosity_points.total_earned + pts;
$$;
