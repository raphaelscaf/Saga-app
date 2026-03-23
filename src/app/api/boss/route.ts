import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateBoss, getCurrentMonthKey } from "@/lib/game-logic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: hero } = await supabase.from("heroes").select("*").eq("user_id", user.id).single();
  if (!hero) return NextResponse.json({ error: "Hero not found" }, { status: 404 });

  const monthKey = getCurrentMonthKey();

  // Check for existing boss this month
  const { data: existingBoss } = await supabase
    .from("boss_fights")
    .select("*")
    .eq("hero_id", hero.id)
    .eq("month_key", monthKey)
    .single();

  if (existingBoss) {
    return NextResponse.json({ boss: existingBoss });
  }

  // Generate new boss
  const bossData = generateBoss(monthKey);

  const { data: boss, error } = await supabase
    .from("boss_fights")
    .insert({
      hero_id: hero.id,
      ...bossData,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ boss });
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: hero } = await supabase.from("heroes").select("*").eq("user_id", user.id).single();
  if (!hero) return NextResponse.json({ error: "Hero not found" }, { status: 404 });

  const monthKey = getCurrentMonthKey();

  const { data: boss } = await supabase
    .from("boss_fights")
    .select("*")
    .eq("hero_id", hero.id)
    .eq("month_key", monthKey)
    .single();

  if (!boss) return NextResponse.json({ error: "No boss found" }, { status: 404 });
  if (boss.defeated) return NextResponse.json({ error: "Boss already defeated" }, { status: 400 });

  const newHp = boss.current_hp - 1;
  const defeated = newHp <= 0;

  // Update boss
  const { data: updatedBoss, error: bossError } = await supabase
    .from("boss_fights")
    .update({
      current_hp: Math.max(0, newHp),
      defeated,
      defeated_at: defeated ? new Date().toISOString() : null,
    })
    .eq("id", boss.id)
    .select()
    .single();

  if (bossError) return NextResponse.json({ error: bossError.message }, { status: 500 });

  // If defeated, award hero
  if (defeated) {
    await supabase
      .from("heroes")
      .update({
        xp: hero.xp + 200,
        coins: hero.coins + 150,
        total_coins: hero.total_coins + 150,
      })
      .eq("user_id", user.id);
  }

  return NextResponse.json({ boss: updatedBoss });
}
