import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { MissionType, Category } from "@/types/database";

const VALID_TYPES: MissionType[] = ["daily", "sprint", "epic"];
const VALID_CATEGORIES: Category[] = ["health", "work", "mind", "finance", "social"];

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: hero } = await supabase.from("heroes").select("*").eq("user_id", user.id).single();
  if (!hero) return NextResponse.json({ error: "Hero not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  let query = supabase.from("missions").select("*").eq("hero_id", hero.id);
  if (type) {
    query = query.eq("type", type);
  }

  const { data: missions, error } = await query.order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ missions });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: hero } = await supabase.from("heroes").select("*").eq("user_id", user.id).single();
  if (!hero) return NextResponse.json({ error: "Hero not found" }, { status: 404 });

  const body = await request.json();
  const { name, type, category, xp, coins, priority } = body;

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid type. Must be daily, sprint, or epic" }, { status: 400 });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category. Must be health, work, mind, finance, or social" }, { status: 400 });
  }

  const { data: mission, error } = await supabase
    .from("missions")
    .insert({
      hero_id: hero.id,
      name,
      type,
      category,
      xp,
      coins,
      priority: priority || "normal",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ mission });
}
