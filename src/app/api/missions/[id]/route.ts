import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processMissionComplete } from "@/lib/game-logic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: hero } = await supabase.from("heroes").select("*").eq("user_id", user.id).single();
  if (!hero) return NextResponse.json({ error: "Hero not found" }, { status: 404 });

  const { id } = await params;
  const body = await request.json();

  // If completing a mission, process game logic
  if (body.done === true) {
    const { data: mission } = await supabase
      .from("missions")
      .select("*")
      .eq("id", id)
      .eq("hero_id", hero.id)
      .single();

    if (!mission) return NextResponse.json({ error: "Mission not found" }, { status: 404 });

    const result = processMissionComplete(hero, mission);

    // Update mission
    const { data: updatedMission, error: missionError } = await supabase
      .from("missions")
      .update(result.missionUpdates)
      .eq("id", id)
      .select()
      .single();

    if (missionError) return NextResponse.json({ error: missionError.message }, { status: 500 });

    // Update hero
    const { data: updatedHero, error: heroError } = await supabase
      .from("heroes")
      .update(result.heroUpdates)
      .eq("user_id", user.id)
      .select()
      .single();

    if (heroError) return NextResponse.json({ error: heroError.message }, { status: 500 });

    return NextResponse.json({
      mission: updatedMission,
      hero: updatedHero,
      leveledUp: result.leveledUp,
      bossDamage: result.bossDamage,
    });
  }

  // Regular update (not completion)
  const { data: updatedMission, error } = await supabase
    .from("missions")
    .update(body)
    .eq("id", id)
    .eq("hero_id", hero.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ mission: updatedMission });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: hero } = await supabase.from("heroes").select("*").eq("user_id", user.id).single();
  if (!hero) return NextResponse.json({ error: "Hero not found" }, { status: 404 });

  const { id } = await params;

  const { error } = await supabase
    .from("missions")
    .delete()
    .eq("id", id)
    .eq("hero_id", hero.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
