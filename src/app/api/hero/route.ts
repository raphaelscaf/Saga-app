import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_REWARDS } from "@/lib/constants";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: hero, error } = await supabase
    .from("heroes")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ hero });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, avatar, class: heroClass, objectives, strengths, weaknesses, api_key } = body;

  const { data: hero, error } = await supabase
    .from("heroes")
    .insert({
      user_id: user.id,
      name,
      avatar,
      class: heroClass,
      objectives,
      strengths,
      weaknesses,
      api_key: api_key || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create default rewards
  const rewards = DEFAULT_REWARDS.map((r) => ({
    hero_id: hero.id,
    name: r.name,
    description: r.description,
    icon: r.icon,
    cost: r.cost,
    is_default: true,
  }));

  await supabase.from("rewards").insert(rewards);

  // Create initial chat message from Sage
  await supabase.from("chat_messages").insert({
    hero_id: hero.id,
    role: "sage",
    content: `Saudacoes, ${name}! Eu sou Sage, seu mentor nesta jornada. Como ${heroClass}, voce tem um caminho unico pela frente. Estou aqui para guia-lo, criar missoes e ajuda-lo a evoluir. O que deseja fazer primeiro?`,
  });

  return NextResponse.json({ hero });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const { data: hero, error } = await supabase
    .from("heroes")
    .update(body)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ hero });
}
