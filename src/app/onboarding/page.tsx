"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Zap,
  Brain,
  Target,
  BarChart3,
  Swords,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  Key,
} from "lucide-react";
import {
  AVATARS,
  HERO_CLASSES,
  STRENGTH_OPTIONS,
  WEAKNESS_OPTIONS,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

const TOTAL_STEPS = 6;

const FEATURES = [
  { icon: Swords, label: "Missoes diarias que mudam de verdade" },
  { icon: BarChart3, label: "XP, nivel e evolucao visivel" },
  { icon: Brain, label: "IA que entende seu perfil" },
  { icon: Target, label: "Objetivos reais, gamificados" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form state
  const [heroName, setHeroName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [heroClass, setHeroClass] = useState("");
  const [objectives, setObjectives] = useState({
    main: "",
    professional: "",
    personal: "",
  });
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState("");

  function next() {
    // Validate current step before advancing
    if (step === 1) {
      if (!heroName.trim()) {
        toast.error("Escolha um nome para seu heroi.");
        return;
      }
      if (!avatar) {
        toast.error("Selecione um avatar.");
        return;
      }
    }
    if (step === 2 && !heroClass) {
      toast.error("Escolha uma classe.");
      return;
    }
    if (step === 3 && !objectives.main.trim()) {
      toast.error("Preencha seu objetivo principal.");
      return;
    }
    if (step === 4) {
      if (strengths.length === 0) {
        toast.error("Selecione ao menos 1 forca.");
        return;
      }
      if (weaknesses.length === 0) {
        toast.error("Selecione ao menos 1 fraqueza.");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function toggleStrength(val: string) {
    setStrengths((prev) =>
      prev.includes(val)
        ? prev.filter((s) => s !== val)
        : prev.length < 4
          ? [...prev, val]
          : prev
    );
  }

  function toggleWeakness(val: string) {
    setWeaknesses((prev) =>
      prev.includes(val)
        ? prev.filter((w) => w !== val)
        : prev.length < 3
          ? [...prev, val]
          : prev
    );
  }

  async function handleSubmit() {
    if (!heroName.trim() || !avatar || !heroClass || !objectives.main.trim()) {
      toast.error("Dados incompletos. Revise os passos anteriores.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const res = await fetch("/api/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id,
          name: heroName.trim(),
          avatar,
          class: heroClass,
          objectives,
          strengths,
          weaknesses,
          api_key: apiKey || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao criar heroi.");
      }

      router.push("/missions");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao criar heroi.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  // ── Progress Bar ──────────────────────────────────────────────
  function ProgressDots() {
    return (
      <div className="flex items-center justify-center gap-2 mb-8">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step
                ? "w-8 bg-primary"
                : i < step
                  ? "w-6 bg-primary/60"
                  : "w-6 bg-border"
            }`}
          />
        ))}
      </div>
    );
  }

  // ── Step 0: Welcome ───────────────────────────────────────────
  function StepWelcome() {
    return (
      <div className="flex flex-col items-center text-center gap-8 animate-in fade-in duration-500">
        <div className="space-y-3">
          <h1 className="text-6xl font-black tracking-widest neon-text-cyan">
            SAGA
          </h1>
          <p className="text-muted-foreground text-lg max-w-md">
            Gamifique sua vida. Missoes, XP e evolucao real.
          </p>
        </div>

        <div className="grid gap-4 w-full max-w-sm">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
            >
              <f.icon className="h-5 w-5 text-primary shrink-0" />
              <span className="text-sm text-foreground">{f.label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={next}
          className="flex items-center gap-2 bg-primary/15 border border-primary/30 text-primary px-8 py-3 rounded-xl font-semibold text-lg hover:bg-primary/25 transition-colors"
        >
          <Sparkles className="h-5 w-5" />
          Criar meu Heroi
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    );
  }

  // ── Step 1: Hero Name + Avatar ────────────────────────────────
  function StepNameAvatar() {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-foreground">
            Quem e seu heroi?
          </h2>
          <p className="text-muted-foreground text-sm">
            Escolha um nome e um avatar
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Nome do Heroi
          </label>
          <input
            type="text"
            maxLength={20}
            value={heroName}
            onChange={(e) => setHeroName(e.target.value)}
            placeholder="Ex: Shadow, Phoenix, Drako..."
            className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          <p className="text-xs text-muted-foreground text-right">
            {heroName.length}/20
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Avatar</label>
          <div className="grid grid-cols-4 gap-3">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className={`text-3xl p-3 rounded-xl border transition-all duration-200 ${
                  avatar === a
                    ? "border-primary bg-primary/10 neon-border-cyan scale-110"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Class Selection ───────────────────────────────────
  function StepClass() {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-foreground">
            Escolha sua classe
          </h2>
          <p className="text-muted-foreground text-sm">
            Isso define seu estilo de jogo
          </p>
        </div>

        <div className="grid gap-3">
          {HERO_CLASSES.map((c) => (
            <button
              key={c.id}
              onClick={() => setHeroClass(c.id)}
              className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${
                heroClass === c.id
                  ? "border-primary bg-primary/10 neon-border-cyan"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <span className="text-3xl">{c.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{c.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {c.description}
                </p>
              </div>
              {heroClass === c.id && (
                <Check className="h-5 w-5 text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Step 3: Objectives ────────────────────────────────────────
  function StepObjectives() {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-foreground">
            Defina seus objetivos
          </h2>
          <p className="text-muted-foreground text-sm">
            A IA usara isso para criar suas missoes
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Objetivo principal *
            </label>
            <textarea
              value={objectives.main}
              onChange={(e) =>
                setObjectives((o) => ({ ...o, main: e.target.value }))
              }
              placeholder="Ex: Sair do sedentarismo e criar uma rotina saudavel"
              rows={3}
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Objetivo profissional{" "}
              <span className="text-muted-foreground">(opcional)</span>
            </label>
            <textarea
              value={objectives.professional}
              onChange={(e) =>
                setObjectives((o) => ({ ...o, professional: e.target.value }))
              }
              placeholder="Ex: Conseguir uma promocao ate dezembro"
              rows={2}
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Objetivo pessoal{" "}
              <span className="text-muted-foreground">(opcional)</span>
            </label>
            <textarea
              value={objectives.personal}
              onChange={(e) =>
                setObjectives((o) => ({ ...o, personal: e.target.value }))
              }
              placeholder="Ex: Ler 12 livros este ano"
              rows={2}
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Step 4: Strengths & Weaknesses ────────────────────────────
  function StepTraits() {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-foreground">
            Forcas e Fraquezas
          </h2>
          <p className="text-muted-foreground text-sm">
            Isso calibra a dificuldade das missoes
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            <Zap className="inline h-4 w-4 text-primary mr-1" />
            Forcas{" "}
            <span className="text-muted-foreground">
              (max 4 — {strengths.length}/4)
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {STRENGTH_OPTIONS.map((s) => {
              const selected = strengths.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleStrength(s)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                    selected
                      ? "border-primary bg-primary/10 text-primary neon-border-cyan"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {selected && <Check className="inline h-3 w-3 mr-1" />}
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            <Target className="inline h-4 w-4 text-accent mr-1" />
            Fraquezas{" "}
            <span className="text-muted-foreground">
              (max 3 — {weaknesses.length}/3)
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {WEAKNESS_OPTIONS.map((w) => {
              const selected = weaknesses.includes(w);
              return (
                <button
                  key={w}
                  onClick={() => toggleWeakness(w)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                    selected
                      ? "border-accent bg-accent/10 text-accent shadow-[0_0_8px_rgba(232,112,106,0.3)]"
                      : "border-border bg-card text-muted-foreground hover:border-accent/40"
                  }`}
                >
                  {selected && <Check className="inline h-3 w-3 mr-1" />}
                  {w}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Step 5: Summary + API Key ─────────────────────────────────
  function StepSummary() {
    const selectedClass = HERO_CLASSES.find((c) => c.id === heroClass);

    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-foreground">Resumo do Heroi</h2>
          <p className="text-muted-foreground text-sm">
            Confira antes de entrar na saga
          </p>
        </div>

        {/* Hero preview card */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{avatar}</span>
            <div>
              <h3 className="text-xl font-bold text-foreground">{heroName}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{selectedClass?.icon}</span>
                <span>{selectedClass?.name}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Objetivo principal
            </p>
            <p className="text-sm text-foreground">{objectives.main}</p>
          </div>

          {strengths.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Forcas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {strengths.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded-full text-xs border border-primary/30 bg-primary/10 text-primary"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {weaknesses.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Fraquezas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {weaknesses.map((w) => (
                  <span
                    key={w}
                    className="px-2 py-0.5 rounded-full text-xs border border-accent/30 bg-accent/10 text-accent"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            Chave API Anthropic{" "}
            <span className="text-muted-foreground">(opcional)</span>
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          <p className="text-xs text-muted-foreground">
            Usada para gerar missoes com IA. Armazenada de forma segura.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-primary/15 border border-primary/30 text-primary px-8 py-3 rounded-xl font-semibold text-lg hover:bg-primary/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="animate-pulse">Criando heroi...</span>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Entrar na Saga
            </>
          )}
        </button>
      </div>
    );
  }

  // ── Render Step ───────────────────────────────────────────────
  function renderStep() {
    switch (step) {
      case 0:
        return <StepWelcome />;
      case 1:
        return <StepNameAvatar />;
      case 2:
        return <StepClass />;
      case 3:
        return <StepObjectives />;
      case 4:
        return <StepTraits />;
      case 5:
        return <StepSummary />;
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-background bg-grid flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {step > 0 && <ProgressDots />}

        {renderStep()}

        {/* Navigation buttons (steps 1-4) */}
        {step > 0 && step < 5 && (
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={back}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
            <button
              onClick={next}
              className="flex items-center gap-1 bg-primary/15 border border-primary/30 text-primary px-5 py-2 rounded-lg font-medium hover:bg-primary/25 transition-colors text-sm"
            >
              Proximo
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Back button on summary step */}
        {step === 5 && (
          <div className="flex items-center justify-start mt-4">
            <button
              onClick={back}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
