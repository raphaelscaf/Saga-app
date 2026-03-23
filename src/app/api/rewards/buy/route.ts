import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { POTIONS } from "@/lib/constants";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: hero } = await supabase.from("heroes").select("*").eq("user_id", user.id).single();
  if (!hero) return NextResponse.json({ error: "Hero not found" }, { status: 404 });

  const body = await request.json();
  const { reward_id, potion_index } = body;

  if (reward_id) {
    // Buy a reward
    const { data: reward } = await supabase
      .from("rewards")
      .select("*")
      .eq("id", reward_id)
      .eq("hero_id", hero.id)
      .single();

    if (!reward) return NextResponse.json({ error: "Reward not found" }, { status: 404 });

    if (hero.coins < reward.cost) {
      return NextResponse.json({ error: "Not enough coins" }, { status: 400 });
    }

    const newCoins = hero.coins - reward.cost;

    // Insert purchase record
    await supabase.from("reward_purchases").insert({
      hero_id: hero.id,
      reward_id: reward.id,
      reward_name: reward.name,
      cost: reward.cost,
    });

    // Update hero coins
    const { data: updatedHero, error } = await supabase
      .from("heroes")
      .update({ coins: newCoins })
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ hero: updatedHero });
  }

  if (potion_index !== undefined) {
    // Buy a potion
    const potion = POTIONS[potion_index];
    if (!potion) return NextResponse.json({ error: "Invalid potion index" }, { status: 400 });

    if (hero.coins < potion.cost) {
      return NextResponse.json({ error: "Not enough coins" }, { status: 400 });
    }

    const newCoins = hero.coins - potion.cost;
    const newHp = Math.min(hero.hp + potion.hp, hero.hp_max);

    // Insert purchase record
    await supabase.from("reward_purchases").insert({
      hero_id: hero.id,
      reward_id: null,
      reward_name: potion.name,
      cost: potion.cost,
    });

    // Update hero
    const { data: updatedHero, error } = await supabase
      .from("heroes")
      .update({ coins: newCoins, hp: newHp })
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ hero: updatedHero });
  }

  return NextResponse.json({ error: "Must provide reward_id or potion_index" }, { status: 400 });
}
