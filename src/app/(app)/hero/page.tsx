"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { NeonProgress } from "@/components/neon-progress";
import { getClassName } from "@/lib/game-logic";
import type { Hero } from "@/types/database";

const ATTRIBUTES = [
  { key: "focus" as const, label: "Foco", icon: "🎯", color: "cyan" as const },
  { key: "discipline" as const, label: "Disciplina", icon: "⚡", color: "yellow" as const },
  { key: "energy" as const, label: "Energia", icon: "💪", color: "green" as const },
  { key: "creativity" as const, label: "Criatividade", icon: "🎨", color: "magenta" as const },
  { key: "productivity" as const, label: "Produtividade", icon: "📈", color: "cyan" as const },
];

export default function HeroPage() {
  const [hero, setHero] = useState<Hero | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hero")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.hero) setHero(data.hero);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !hero) {
    return (
      <div className="px-4 pt-4 space-y-4">
        {/* Hero card skeleton */}
        <div className="rounded-xl bg-card border border-border p-6 flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-muted animate-pulse" />
          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
          <div className="h-3 w-24 bg-muted rounded animate-pulse" />
          <div className="w-full space-y-3 mt-2">
            <div className="h-2 w-full bg-muted rounded-full animate-pulse" />
            <div className="h-2 w-full bg-muted rounded-full animate-pulse" />
          </div>
        </div>
        {/* Attrs skeleton */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-xl bg-card border border-border p-4 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const className = getClassName(hero.level);
  const hpPercent = hero.hp_max > 0 ? Math.round((hero.hp / hero.hp_max) * 100) : 0;
  const xpPercent = hero.xp_max > 0 ? Math.round((hero.xp / hero.xp_max) * 100) : 0;

  return (
    <div className="px-4 pt-4 pb-6 space-y-6 overflow-y-auto">
      {/* Hero Card */}
      <div className="rounded-xl bg-card border border-border p-6 flex flex-col items-center gap-3">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full border-[3px] border-primary neon-border-cyan flex items-center justify-center text-4xl bg-black/30">
          {hero.avatar}
        </div>

        {/* Name */}
        <h1 className="text-xl font-bold text-primary">{hero.name}</h1>

        {/* Class + Level */}
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {hero.class} &middot; Lv.{hero.level} {className}
        </p>

        {/* HP Bar */}
        <div className="w-full mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              HP
            </span>
            <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
              {hero.hp}/{hero.hp_max}
            </span>
          </div>
          <NeonProgress value={hpPercent} color="red" height="h-2" />
        </div>

        {/* XP Bar */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              XP
            </span>
            <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
              {hero.xp}/{hero.xp_max}
            </span>
          </div>
          <NeonProgress value={xpPercent} color="cyan" height="h-2" />
        </div>
      </div>

      {/* Atributos */}
      <section>
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 px-1">
          Atributos
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {ATTRIBUTES.map((attr) => {
            const value = hero.attrs?.[attr.key] ?? 0;
            return (
              <div
                key={attr.key}
                className="rounded-xl bg-card border border-border p-4 flex flex-col items-center gap-2"
              >
                <span className="text-2xl">{attr.icon}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {attr.label}
                </span>
                <span className="text-2xl font-bold text-foreground font-mono tabular-nums">
                  {value}
                </span>
                <div className="w-full">
                  <NeonProgress value={value} color={attr.color} height="h-1" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Objetivos Epicos */}
      {hero.objectives && hero.objectives.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 px-1">
            Objetivos Epicos
          </h2>
          <div className="space-y-2">
            {hero.objectives.map((obj) => (
              <div
                key={obj.id}
                className="rounded-xl bg-card border border-border px-4 py-3 flex items-center gap-3"
              >
                <span className="text-lg">{obj.icon}</span>
                <span className="text-sm text-foreground">{obj.text}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Forcas */}
      {hero.strengths && hero.strengths.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 px-1">
            Forcas
          </h2>
          <div className="flex flex-wrap gap-2">
            {hero.strengths.map((s) => (
              <span
                key={s}
                className="rounded-full bg-primary/10 border border-primary/20 text-primary text-sm px-3 py-1"
              >
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Fraquezas */}
      {hero.weaknesses && hero.weaknesses.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 px-1">
            Fraquezas
          </h2>
          <div className="flex flex-wrap gap-2">
            {hero.weaknesses.map((w) => (
              <span
                key={w}
                className="rounded-full bg-accent/10 border border-accent/20 text-accent text-sm px-3 py-1"
              >
                {w}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
