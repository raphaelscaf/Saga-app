"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Trophy, Sword, Flame, Clock } from "lucide-react";
import { NeonProgress } from "@/components/neon-progress";
import { getDaysSince } from "@/lib/game-logic";
import { MILESTONES, ACHIEVEMENTS_DEF } from "@/lib/constants";
import type { Hero, Mission, Achievement, BossFight } from "@/types/database";

const ATTRIBUTES = [
  { key: "focus" as const, label: "Foco", icon: "🎯", color: "cyan" as const },
  { key: "discipline" as const, label: "Disciplina", icon: "⚡", color: "yellow" as const },
  { key: "energy" as const, label: "Energia", icon: "💪", color: "green" as const },
  { key: "creativity" as const, label: "Criatividade", icon: "🎨", color: "magenta" as const },
  { key: "productivity" as const, label: "Produtividade", icon: "📈", color: "cyan" as const },
];

export default function DashboardPage() {
  const [hero, setHero] = useState<Hero | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [boss, setBoss] = useState<BossFight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        const [heroRes, missionsRes, achievementsRes, bossRes] = await Promise.all([
          fetch("/api/hero"),
          fetch("/api/missions"),
          fetch("/api/achievements"),
          fetch("/api/boss"),
        ]);

        const [heroData, missionsData, achievementsData, bossData] = await Promise.all([
          heroRes.json(),
          missionsRes.json(),
          achievementsRes.json(),
          bossRes.json(),
        ]);

        if (heroData.hero) setHero(heroData.hero);
        if (missionsData.missions) setMissions(missionsData.missions);
        if (achievementsData.achievements) setAchievements(achievementsData.achievements);
        if (bossData.boss) setBoss(bossData.boss);
      } catch {
        toast.error("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  if (loading || !hero) {
    return (
      <div className="px-4 pt-4 space-y-4">
        <div className="rounded-xl bg-card border border-border p-6 h-32 animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl bg-card border border-border p-4 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const daysSinceJoin = getDaysSince(hero.join_date);
  const doneMissions = missions.filter((m) => m.done);
  const dailyMissions = missions.filter((m) => m.type === "daily");
  const defeatedBosses = boss?.defeated ? 1 : 0; // Current boss only; full count would need backend
  const unlockedKeys = achievements.map((a) => a.achievement_key);

  return (
    <div className="px-4 pt-4 pb-6 space-y-6 overflow-y-auto">
      {/* Journey Card */}
      <section className="rounded-xl bg-card border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Sua Jornada
          </h2>
        </div>

        {/* Days count */}
        <div className="text-center mb-5">
          <span className="text-4xl font-bold text-primary font-mono tabular-nums neon-text-cyan">
            {daysSinceJoin}
          </span>
          <p className="text-xs text-muted-foreground mt-1">dias na jornada</p>
        </div>

        {/* Milestone timeline */}
        <div className="flex items-center justify-between gap-1 px-2">
          {MILESTONES.map((ms, idx) => {
            const reached = daysSinceJoin >= ms.days;
            const isNext =
              !reached &&
              (idx === 0 || daysSinceJoin >= MILESTONES[idx - 1].days);

            return (
              <div key={ms.days} className="flex flex-col items-center gap-1.5 flex-1">
                {/* Dot */}
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm transition-all ${
                    reached
                      ? "border-primary bg-primary/10"
                      : isNext
                        ? "border-primary neon-pulse"
                        : "border-border opacity-40"
                  }`}
                >
                  {ms.icon}
                </div>
                <span
                  className={`text-[9px] text-center leading-tight ${
                    reached
                      ? "text-primary font-medium"
                      : isNext
                        ? "text-primary"
                        : "text-muted-foreground opacity-40"
                  }`}
                >
                  {ms.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats Grid */}
      <section>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Sword className="w-4 h-4 text-primary" />
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Estatisticas
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: "⚔️", value: doneMissions.length, label: "Total Missoes" },
            { icon: "🔥", value: hero.streak, label: "Streak Atual" },
            { icon: "🪙", value: hero.total_coins, label: "Moedas Totais" },
            { icon: "⭐", value: hero.level, label: "Level" },
            { icon: "🐉", value: defeatedBosses, label: "Bosses Derrotados" },
            { icon: "🔄", value: dailyMissions.length, label: "Habitos Ativos" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-card border border-border p-4 text-center flex flex-col items-center gap-1.5"
            >
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-2xl font-bold text-foreground font-mono tabular-nums">
                {stat.value}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Atributos */}
      <section>
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 px-1">
          Atributos
        </h2>
        <div className="rounded-xl bg-card border border-border p-4 space-y-4">
          {ATTRIBUTES.map((attr) => {
            const value = hero.attrs?.[attr.key] ?? 0;
            return (
              <div key={attr.key} className="flex items-center gap-3">
                <span className="text-lg w-7 text-center shrink-0">{attr.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {attr.label}
                    </span>
                    <span className="text-xs font-bold text-foreground font-mono tabular-nums">
                      {value}
                    </span>
                  </div>
                  <NeonProgress value={value} color={attr.color} height="h-1.5" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Conquistas */}
      <section>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Trophy className="w-4 h-4 text-primary" />
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Conquistas
          </h2>
          <span className="text-[10px] text-muted-foreground ml-auto font-mono tabular-nums">
            {unlockedKeys.length}/{ACHIEVEMENTS_DEF.length}
          </span>
        </div>
        <div className="space-y-3">
          {ACHIEVEMENTS_DEF.map((achDef) => {
            const unlocked = unlockedKeys.includes(achDef.id);
            const achData = achievements.find(
              (a) => a.achievement_key === achDef.id
            );

            return (
              <div
                key={achDef.id}
                className={`rounded-xl bg-card border border-border p-4 flex items-start gap-3 transition-opacity ${
                  unlocked ? "" : "opacity-40"
                }`}
              >
                <span className={`text-2xl ${unlocked ? "" : "grayscale"}`}>
                  {achDef.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold ${
                      unlocked ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {achDef.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {unlocked ? achDef.story : "???"}
                  </p>
                  {unlocked && achData && (
                    <p className="text-[10px] text-primary mt-1 font-mono">
                      Desbloqueado em{" "}
                      {new Date(achData.unlocked_at).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
