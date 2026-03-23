import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { GeneratedMission } from "@/types/database";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: hero } = await supabase.from("heroes").select("*").eq("user_id", user.id).single();
  if (!hero) return NextResponse.json({ error: "Hero not found" }, { status: 404 });

  const body = await request.json();
  const { message } = body;

  if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });

  // Get API key
  if (!hero.api_key) {
    return NextResponse.json({ error: "API key not configured. Please add your Anthropic API key in settings." }, { status: 400 });
  }

  // Get last 10 chat messages
  const { data: chatHistory } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("hero_id", hero.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const messages = (chatHistory || []).reverse();

  // Build hero profile for system prompt
  const profile = {
    name: hero.name,
    class: hero.class,
    level: hero.level,
    xp: hero.xp,
    xp_max: hero.xp_max,
    hp: hero.hp,
    hp_max: hero.hp_max,
    coins: hero.coins,
    streak: hero.streak,
    attrs: hero.attrs,
    objectives: hero.objectives,
    strengths: hero.strengths,
    weaknesses: hero.weaknesses,
  };

  const systemPrompt = `Voce e Sage, Mentor Sabio de um RPG pessoal chamado SAGA.

PERFIL DO HEROI:
${JSON.stringify(profile, null, 2)}

CATEGORIAS DISPONIVEIS: health (Saude), work (Trabalho), mind (Mente), finance (Financas), social (Relacionamentos)

REGRAS IMPORTANTES:
1. Fale em portugues brasileiro, tom motivacional mas direto e util
2. Use termos de RPG naturalmente: missoes, XP, guerreiro, jornada
3. Quando o usuario pedir missoes: SEMPRE faca 1-2 perguntas de esclarecimento ANTES de criar
4. Quando tiver informacao suficiente: crie as missoes e inclua JSON
5. Para pedidos diretos simples: responda direto SEM fazer perguntas
6. Maximo 3 paragrafos de texto, seja conciso

FORMATO JSON (apenas quando criar missoes):
[MISSIONS_JSON]{"missions":[{"name":"Nome","type":"daily","cat":"health","xp":20,"coins":10,"priority":"normal","why":"Razao"}]}[/MISSIONS_JSON]

Tipos: daily (habito diario), sprint (objetivo de semanas), epic (objetivo de meses)
XP sugerido: daily=15-30, sprint=80-200, epic=500-2000`;

  // Build conversation messages for Claude API
  const apiMessages = messages.map((m) => ({
    role: m.role === "sage" ? "assistant" : "user",
    content: m.content,
  }));
  apiMessages.push({ role: "user", content: message });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": hero.api_key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Claude API error: ${response.status} - ${errorData?.error?.message || "Unknown error"}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const sageMessage = data.content?.[0]?.text || "";

    // Extract missions JSON if present
    let missions: GeneratedMission[] | undefined;
    const jsonMatch = sageMessage.match(/\[MISSIONS_JSON\](.*?)\[\/MISSIONS_JSON\]/s);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        missions = parsed.missions;
      } catch {
        // JSON parse failed, ignore
      }
    }

    // Save user message
    await supabase.from("chat_messages").insert({
      hero_id: hero.id,
      role: "user",
      content: message,
    });

    // Save sage response
    await supabase.from("chat_messages").insert({
      hero_id: hero.id,
      role: "sage",
      content: sageMessage,
    });

    return NextResponse.json({ message: sageMessage, missions });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to connect to Claude API: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 502 }
    );
  }
}
