import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const { data: reward, error } = await supabase
    .from("rewards")
    .update(body)
    .eq("id", id)
    .eq("hero_id", hero.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ reward });
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
    .from("rewards")
    .delete()
    .eq("id", id)
    .eq("hero_id", hero.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
