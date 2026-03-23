import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAchievements } from "@/lib/game-logic";
import type { GameStats } from "@/lib/constants";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: hero } = await supabase.from("heroes").select("*").eq("user_id", user.id).single();
  if (!hero) return NextResponse.json({ error: "Hero not found" }, { status: 404 });

  const { data: achievements, error } = await supabase
    .from("achievements")
    .select("*")
    .eq("hero_id", hero.id)
    .order("unlocked_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ achievements });
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: hero } = await supabase.from("heroes").select("*").eq("user_id", user.id).single();
  if (!hero) return NextResponse.json({ error: "Hero not found" }, { status: 404 });

  // Get stats
  const { count: totalMissionsDone } = await supabase
    .from("missions")
    .select("*", { count: "exact", head: true })
    .eq("hero_id", hero.id)
    .eq("done", true);

  const { count: bossKills } = await supabase
    .from("boss_fights")
    .select("*", { count: "exact", head: true })
    .eq("hero_id", hero.id)
    .eq("defeated", true);

  // Get distinct categories with completed missions
  const { data: catData } = await supabase
    .from("missions")
    .select("category")
    .eq("hero_id", hero.id)
    .eq("done", true);

  const categoriesCompleted: string[] = Array.from(new Set((catData || []).map((m: { category: string }) => m.category)));

  // Get already unlocked
  const { data: existingAchievements } = await supabase
    .from("achievements")
    .select("achievement_key")
    .eq("hero_id", hero.id);

  const unlockedKeys = (existingAchievements || []).map((a: { achievement_key: string }) => a.achievement_key);

  const stats: GameStats = {
    totalMissionsDone: totalMissionsDone || 0,
    streak: hero.streak,
    totalCoins: hero.total_coins,
    level: hero.level,
    bossKills: bossKills || 0,
    categoriesCompleted,
  };

  const newUnlocks = checkAchievements(stats, unlockedKeys);

  // Insert new achievements
  if (newUnlocks.length > 0) {
    const inserts = newUnlocks.map((key) => ({
      hero_id: hero.id,
      achievement_key: key,
    }));
    await supabase.from("achievements").insert(inserts);
  }

  return NextResponse.json({ newUnlocks });
}
