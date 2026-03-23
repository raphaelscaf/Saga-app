import type { Hero, HeroAttrs, Mission, BossFight } from "@/types/database";
import { CATEGORIES, CLASS_NAMES, ACHIEVEMENTS_DEF, BOSS_TEMPLATES, type GameStats } from "./constants";

export function getClassName(level: number): string {
  return CLASS_NAMES[Math.min(level - 1, CLASS_NAMES.length - 1)] || "Lendario";
}

export function calculateXpForLevel(level: number): number {
  let xpMax = 200;
  for (let i = 1; i < level; i++) {
    xpMax = Math.floor(xpMax * 1.5);
  }
  return xpMax;
}

export interface MissionCompleteResult {
  heroUpdates: Partial<Hero>;
  missionUpdates: Partial<Mission>;
  bossDamage: number;
  leveledUp: boolean;
  newLevel?: number;
}

export function processMissionComplete(
  hero: Hero,
  mission: Mission
): MissionCompleteResult {
  const heroUpdates: Partial<Hero> = {};
  const missionUpdates: Partial<Mission> = {
    done: true,
    done_at: new Date().toISOString(),
  };

  // XP and coins
  let newXp = hero.xp + mission.xp;
  let newLevel = hero.level;
  let newXpMax = hero.xp_max;
  let leveledUp = false;

  // Level up check
  if (newXp >= newXpMax) {
    newLevel++;
    newXp -= newXpMax;
    newXpMax = Math.floor(newXpMax * 1.5);
    leveledUp = true;
  }

  heroUpdates.xp = newXp;
  heroUpdates.level = newLevel;
  heroUpdates.xp_max = newXpMax;
  heroUpdates.coins = hero.coins + mission.coins;
  heroUpdates.total_coins = hero.total_coins + mission.coins;

  // Streak for dailies
  if (mission.type === "daily") {
    missionUpdates.streak = (mission.streak || 0) + 1;
    heroUpdates.streak = (hero.streak || 0) + 1;
  }

  // Attribute boost by category
  const cat = CATEGORIES[mission.category];
  if (cat) {
    const attrs = { ...hero.attrs };
    const attrKey = cat.attr as keyof HeroAttrs;
    attrs[attrKey] = Math.min((attrs[attrKey] || 0) + 1, 100);
    heroUpdates.attrs = attrs;
  }

  // Boss damage (30% chance, 0.5 damage)
  let bossDamage = 0;
  if (Math.random() < 0.3) {
    bossDamage = 0.5;
  }

  return {
    heroUpdates,
    missionUpdates,
    bossDamage,
    leveledUp,
    newLevel: leveledUp ? newLevel : undefined,
  };
}

export interface DailyResetResult {
  heroUpdates: Partial<Hero>;
  missionResets: { id: string; updates: Partial<Mission> }[];
  hpPenalty: number;
  resetCount: number;
}

export function checkDailyReset(
  hero: Hero,
  missions: Mission[],
  today: string
): DailyResetResult | null {
  if (hero.last_active === today) return null;

  const heroUpdates: Partial<Hero> = { last_active: today };
  const missionResets: { id: string; updates: Partial<Mission> }[] = [];
  let hpPenalty = 0;

  // Check streak continuity
  const lastActive = new Date(hero.last_active);
  const todayDate = new Date(today);
  const diffDays = Math.floor(
    (todayDate.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays > 1) {
    heroUpdates.streak = 0;
  }

  // Reset daily missions
  let resetCount = 0;
  missions
    .filter((m) => m.type === "daily")
    .forEach((m) => {
      if (!m.done) {
        // Didn't complete yesterday - HP penalty
        hpPenalty += 5;
        missionResets.push({
          id: m.id,
          updates: { done: false, streak: 0 },
        });
      } else {
        // Was done, reset for today but keep streak
        missionResets.push({
          id: m.id,
          updates: {
            done: false,
            streak: diffDays === 1 ? m.streak : 0,
          },
        });
      }
      resetCount++;
    });

  if (hpPenalty > 0) {
    heroUpdates.hp = Math.max(10, hero.hp - hpPenalty);
  }

  return { heroUpdates, missionResets, hpPenalty, resetCount };
}

export function checkAchievements(
  stats: GameStats,
  unlockedKeys: string[]
): string[] {
  const newUnlocks: string[] = [];
  ACHIEVEMENTS_DEF.forEach((a) => {
    if (!unlockedKeys.includes(a.id) && a.condition(stats)) {
      newUnlocks.push(a.id);
    }
  });
  return newUnlocks;
}

export function generateBoss(monthKey: string): Omit<BossFight, "id" | "hero_id" | "created_at"> {
  const template = BOSS_TEMPLATES[Math.floor(Math.random() * BOSS_TEMPLATES.length)];
  return {
    name: template.name,
    description: template.description,
    icon: template.icon,
    max_hp: template.max_hp,
    current_hp: template.max_hp,
    month_key: monthKey,
    defeated: false,
    defeated_at: null,
  };
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}`;
}

export function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getDaysSince(dateStr: string): number {
  const start = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}
