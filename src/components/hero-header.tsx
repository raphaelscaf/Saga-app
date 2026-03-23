"use client";

import { useEffect, useState } from "react";
import { Flame, Heart } from "lucide-react";
import { getClassName, calculateXpForLevel } from "@/lib/game-logic";
import type { Hero } from "@/types/database";

export function HeroHeader() {
  const [hero, setHero] = useState<Hero | null>(null);

  useEffect(() => {
    fetch("/api/hero")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.hero) setHero(data.hero);
      })
      .catch(() => {});
  }, []);

  if (!hero) {
    return (
      <header className="bg-background/95 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-1.5 w-full bg-muted rounded-full animate-pulse" />
          </div>
        </div>
      </header>
    );
  }

  const xpPercent = hero.xp_max > 0 ? Math.round((hero.xp / hero.xp_max) * 100) : 0;
  const className = getClassName(hero.level);

  return (
    <header className="bg-background/95 backdrop-blur-md border-b border-border px-4 py-3">
      {/* Top row */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-full border-2 border-primary neon-border-cyan flex items-center justify-center text-xl bg-black/30">
            {hero.avatar}
          </div>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
            {hero.level}
          </span>
        </div>

        {/* Name + class */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">
                {hero.name}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {className}
              </p>
            </div>

            {/* Stats pills */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Streak */}
              <span className="flex items-center gap-1 bg-black/40 border border-destructive/40 rounded-full px-2 py-0.5 text-xs font-semibold text-destructive">
                <Flame className="w-3 h-3" />
                {hero.streak}
              </span>
              {/* Coins */}
              <span className="flex items-center gap-1 bg-black/40 border border-yellow-500/40 rounded-full px-2 py-0.5 text-xs font-semibold text-yellow-400">
                🪙 {hero.coins}
              </span>
              {/* HP */}
              <span className="flex items-center gap-1 bg-black/40 border border-red-500/40 rounded-full px-2 py-0.5 text-xs font-semibold text-red-400">
                <Heart className="w-3 h-3 fill-current" />
                {hero.hp}
              </span>
            </div>
          </div>

          {/* XP bar */}
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden neon-progress-cyan">
              <div
                className="h-full rounded-full progress-fill transition-all duration-700"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground font-mono tabular-nums shrink-0">
              {hero.xp}/{hero.xp_max}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
