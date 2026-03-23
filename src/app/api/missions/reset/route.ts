import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkDailyReset, getTodayStr } from "@/lib/game-logic";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: hero } = await supabase.from("heroes").select("*").eq("user_id", user.id).single();
  if (!hero) return NextResponse.json({ error: "Hero not found" }, { status: 404 });

  const { data: missions } = await supabase
    .from("missions")
    .select("*")
    .eq("hero_id", hero.id);

  const today = getTodayStr();
  const result = checkDailyReset(hero, missions || [], today);

  if (!result) {
    return NextResponse.json({ resetCount: 0, hpPenalty: 0 });
  }

  // Batch update missions
  for (const reset of result.missionResets) {
    await supabase
      .from("missions")
      .update(reset.updates)
      .eq("id", reset.id);
  }

  // Update hero
  await supabase
    .from("heroes")
    .update(result.heroUpdates)
    .eq("user_id", user.id);

  return NextResponse.json({
    resetCount: result.resetCount,
    hpPenalty: result.hpPenalty,
  });
}
