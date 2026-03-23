export type MissionType = "daily" | "sprint" | "epic";
export type Category = "health" | "work" | "mind" | "finance" | "social";
export type Priority = "normal" | "high";
export type ChatRole = "user" | "sage";

export interface HeroAttrs {
  focus: number;
  discipline: number;
  energy: number;
  creativity: number;
  productivity: number;
}

export interface HeroObjective {
  id: number;
  text: string;
  icon: string;
}

export interface Hero {
  id: string;
  user_id: string;
  name: string;
  avatar: string;
  class: string;
  level: number;
  xp: number;
  xp_max: number;
  hp: number;
  hp_max: number;
  coins: number;
  total_coins: number;
  streak: number;
  last_active: string;
  join_date: string;
  objectives: HeroObjective[];
  strengths: string[];
  weaknesses: string[];
  attrs: HeroAttrs;
  api_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface Mission {
  id: string;
  hero_id: string;
  name: string;
  type: MissionType;
  category: Category;
  xp: number;
  coins: number;
  priority: Priority;
  done: boolean;
  streak: number;
  progress: number;
  total: number;
  done_at: string | null;
  created_at: string;
}

export interface Reward {
  id: string;
  hero_id: string;
  name: string;
  description: string | null;
  icon: string;
  cost: number;
  is_default: boolean;
  created_at: string;
}

export interface RewardPurchase {
  id: string;
  hero_id: string;
  reward_id: string | null;
  reward_name: string;
  cost: number;
  purchased_at: string;
}

export interface ChatMessage {
  id: string;
  hero_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
}

export interface BossFight {
  id: string;
  hero_id: string;
  name: string;
  description: string | null;
  icon: string;
  max_hp: number;
  current_hp: number;
  month_key: string;
  defeated: boolean;
  defeated_at: string | null;
  created_at: string;
}

export interface Achievement {
  id: string;
  hero_id: string;
  achievement_key: string;
  unlocked_at: string;
}

export interface GeneratedMission {
  name: string;
  type: MissionType;
  cat: Category;
  xp: number;
  coins: number;
  priority: Priority;
  why?: string;
}
