-- SAGA RPG Pessoal - Supabase Schema
-- Run this in Supabase SQL Editor

-- Heroes table (one per user)
CREATE TABLE heroes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  name text NOT NULL,
  avatar text DEFAULT '⚡',
  class text DEFAULT 'Estrategista',
  level int DEFAULT 1,
  xp int DEFAULT 0,
  xp_max int DEFAULT 200,
  hp int DEFAULT 100,
  hp_max int DEFAULT 100,
  coins int DEFAULT 50,
  total_coins int DEFAULT 50,
  streak int DEFAULT 0,
  last_active date DEFAULT CURRENT_DATE,
  join_date timestamptz DEFAULT now(),
  objectives jsonb DEFAULT '[]',
  strengths text[] DEFAULT '{}',
  weaknesses text[] DEFAULT '{}',
  attrs jsonb DEFAULT '{"focus":25,"discipline":20,"energy":30,"creativity":25,"productivity":20}',
  api_key text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Missions
CREATE TABLE missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_id uuid REFERENCES heroes(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('daily','sprint','epic')),
  category text NOT NULL CHECK (category IN ('health','work','mind','finance','social')),
  xp int DEFAULT 20,
  coins int DEFAULT 10,
  priority text DEFAULT 'normal' CHECK (priority IN ('normal','high')),
  done boolean DEFAULT false,
  streak int DEFAULT 0,
  progress int DEFAULT 0,
  total int DEFAULT 1,
  done_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Rewards (user-configurable)
CREATE TABLE rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_id uuid REFERENCES heroes(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  icon text DEFAULT '🎯',
  cost int NOT NULL DEFAULT 100,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Reward purchases (history)
CREATE TABLE reward_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_id uuid REFERENCES heroes(id) ON DELETE CASCADE NOT NULL,
  reward_id uuid REFERENCES rewards(id) ON DELETE SET NULL,
  reward_name text NOT NULL,
  cost int NOT NULL,
  purchased_at timestamptz DEFAULT now()
);

-- Chat messages
CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_id uuid REFERENCES heroes(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user','sage')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Boss fights
CREATE TABLE boss_fights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_id uuid REFERENCES heroes(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  icon text DEFAULT '🐉',
  max_hp int NOT NULL,
  current_hp int NOT NULL,
  month_key text NOT NULL,
  defeated boolean DEFAULT false,
  defeated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Achievements
CREATE TABLE achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_id uuid REFERENCES heroes(id) ON DELETE CASCADE NOT NULL,
  achievement_key text NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(hero_id, achievement_key)
);

-- Indexes
CREATE INDEX idx_missions_hero ON missions(hero_id);
CREATE INDEX idx_missions_type ON missions(hero_id, type);
CREATE INDEX idx_rewards_hero ON rewards(hero_id);
CREATE INDEX idx_chat_hero ON chat_messages(hero_id);
CREATE INDEX idx_boss_hero ON boss_fights(hero_id, month_key);
CREATE INDEX idx_achievements_hero ON achievements(hero_id);

-- RLS Policies
ALTER TABLE heroes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own hero" ON heroes FOR ALL USING (user_id = auth.uid());

ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own missions" ON missions FOR ALL
  USING (hero_id IN (SELECT id FROM heroes WHERE user_id = auth.uid()));

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own rewards" ON rewards FOR ALL
  USING (hero_id IN (SELECT id FROM heroes WHERE user_id = auth.uid()));

ALTER TABLE reward_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own purchases" ON reward_purchases FOR ALL
  USING (hero_id IN (SELECT id FROM heroes WHERE user_id = auth.uid()));

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own chat" ON chat_messages FOR ALL
  USING (hero_id IN (SELECT id FROM heroes WHERE user_id = auth.uid()));

ALTER TABLE boss_fights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bosses" ON boss_fights FOR ALL
  USING (hero_id IN (SELECT id FROM heroes WHERE user_id = auth.uid()));

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own achievements" ON achievements FOR ALL
  USING (hero_id IN (SELECT id FROM heroes WHERE user_id = auth.uid()));
