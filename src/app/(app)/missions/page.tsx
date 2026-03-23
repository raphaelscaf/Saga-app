"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  Plus,
  Swords,
  MessageCircle,
  RefreshCw,
  Target,
  Check,
  Flame,
  X,
  Crown,
} from "lucide-react";
import type {
  Hero,
  Mission,
  BossFight,
  MissionType,
  Category,
  Priority,
  GeneratedMission,
} from "@/types/database";

/* ─── constants ─── */

const CATS: Record<string, { label: string; emoji: string; color: string }> = {
  health: { label: "Saude", emoji: "\u2764\uFE0F", color: "text-green-400" },
  work: { label: "Trabalho", emoji: "\uD83D\uDCBC", color: "text-cyan-400" },
  mind: { label: "Mente", emoji: "\uD83E\uDDE0", color: "text-fuchsia-400" },
  finance: { label: "Financas", emoji: "\uD83D\uDCB0", color: "text-yellow-400" },
  social: { label: "Relacoes", emoji: "\uD83E\uDD1D", color: "text-orange-400" },
};

const LAYERS = [
  { key: "daily", label: "Habitos", color: "text-primary", bg: "bg-primary/20", border: "border-primary", glow: "shadow-[0_0_12px_theme(colors.primary)]" },
  { key: "sprint", label: "Sprints", color: "text-yellow-400", bg: "bg-yellow-400/20", border: "border-yellow-400", glow: "shadow-[0_0_12px_theme(colors.yellow.400)]" },
  { key: "epic", label: "Epicos", color: "text-accent", bg: "bg-accent/20", border: "border-accent", glow: "shadow-[0_0_12px_theme(colors.accent)]" },
  { key: "boss", label: "Boss", color: "text-destructive", bg: "bg-destructive/20", border: "border-destructive", glow: "shadow-[0_0_12px_theme(colors.destructive)]" },
] as const;

type LayerKey = (typeof LAYERS)[number]["key"];

const TYPE_DEFAULTS: Record<MissionType, { xp: number; coins: number }> = {
  daily: { xp: 20, coins: 10 },
  sprint: { xp: 100, coins: 50 },
  epic: { xp: 1000, coins: 500 },
};

const TYPE_BORDER: Record<string, string> = {
  daily: "border-l-primary",
  sprint: "border-l-yellow-400",
  epic: "border-l-accent",
};

/* ─── page ─── */

export default function MissionsPage() {
  const router = useRouter();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [hero, setHero] = useState<Hero | null>(null);
  const [boss, setBoss] = useState<BossFight | null>(null);
  const [currentLayer, setCurrentLayer] = useState<LayerKey>("daily");
  const [currentCat, setCurrentCat] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [pendingAiMissions, setPendingAiMissions] = useState<GeneratedMission[]>([]);
  const [loading, setLoading] = useState(true);

  /* ─── data fetching ─── */

  const fetchAll = useCallback(async () => {
    try {
      const [heroRes, missionsRes, bossRes] = await Promise.all([
        fetch("/api/hero"),
        fetch("/api/missions"),
        fetch("/api/boss"),
      ]);

      if (heroRes.ok) {
        const { hero: h } = await heroRes.json();
        setHero(h);
      }
      if (missionsRes.ok) {
        const { missions: m } = await missionsRes.json();
        setMissions(m ?? []);
      }
      if (bossRes.ok) {
        const { boss: b } = await bossRes.json();
        setBoss(b);
      }
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // daily reset then fetch
    fetch("/api/missions/reset", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.resetCount > 0) {
          toast(`\u{1F504} ${d.resetCount} habitos resetados`);
        }
        if (d?.hpPenalty > 0) {
          toast.error(`\u{1F494} -${d.hpPenalty} HP por habitos nao concluidos`);
        }
      })
      .catch(() => {})
      .finally(() => fetchAll());
  }, [fetchAll]);

  /* ─── mission complete ─── */

  const completeMission = async (m: Mission) => {
    if (m.done) return;
    try {
      const res = await fetch(`/api/missions/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: true }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(`\u2694\uFE0F +${m.xp} XP | +${m.coins} moedas`);
      if (data.leveledUp) {
        toast.success(`\u{1F389} Level UP! Voce subiu de nivel!`);
      }
      fetchAll();
    } catch {
      toast.error("Erro ao completar missao");
    }
  };

  /* ─── boss attack ─── */

  const attackBoss = async () => {
    try {
      const res = await fetch("/api/boss", { method: "POST" });
      if (!res.ok) throw new Error();
      const { boss: b } = await res.json();
      setBoss(b);
      if (b.defeated) {
        toast.success(`\u{1F451} Boss derrotado! +200 XP +150 moedas`);
      } else {
        toast(`\u2694\uFE0F Dano aplicado! HP: ${b.current_hp}/${b.max_hp}`);
      }
      fetchAll();
    } catch {
      toast.error("Erro ao atacar boss");
    }
  };

  /* ─── filtered missions ─── */

  const layerMissions = missions
    .filter((m) => {
      if (currentLayer === "boss") return false;
      return m.type === currentLayer;
    })
    .filter((m) => (currentCat === "all" ? true : m.category === currentCat))
    .sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1));

  const pendingCounts: Record<string, number> = {
    daily: missions.filter((m) => m.type === "daily" && !m.done).length,
    sprint: missions.filter((m) => m.type === "sprint" && !m.done).length,
    epic: missions.filter((m) => m.type === "epic" && !m.done).length,
    boss: boss && !boss.defeated ? 1 : 0,
  };

  /* ─── inline components ─── */

  function MissionCard({ mission }: { mission: Mission }) {
    const borderColor = TYPE_BORDER[mission.type] ?? "border-l-border";
    const cat = CATS[mission.category];

    return (
      <button
        onClick={() => completeMission(mission)}
        disabled={mission.done}
        className={`w-full text-left rounded-xl border border-border bg-card p-3 pl-0 flex items-start gap-3 transition-all border-l-[3px] ${borderColor} ${
          mission.done ? "opacity-50" : "hover:bg-card/80 active:scale-[0.98]"
        }`}
      >
        {/* checkbox */}
        <div className="flex items-center justify-center ml-3 mt-0.5">
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              mission.done
                ? "bg-green-500 border-green-500"
                : mission.type === "daily"
                ? "border-primary"
                : mission.type === "sprint"
                ? "border-yellow-400"
                : "border-accent"
            }`}
          >
            {mission.done && <Check className="w-3.5 h-3.5 text-white" />}
          </div>
        </div>

        {/* body */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium leading-tight ${
              mission.done ? "line-through text-muted-foreground" : "text-foreground"
            }`}
          >
            {mission.name}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className="text-[10px] font-bold bg-primary/20 text-primary rounded px-1.5 py-0.5">
              {mission.xp} XP
            </span>
            <span
              className={`text-[10px] rounded px-1.5 py-0.5 ${
                mission.type === "daily"
                  ? "bg-primary/10 text-primary"
                  : mission.type === "sprint"
                  ? "bg-yellow-400/10 text-yellow-400"
                  : "bg-accent/10 text-accent"
              }`}
            >
              {mission.type === "daily" ? "Habito" : mission.type === "sprint" ? "Sprint" : "Epico"}
            </span>
            {mission.priority === "high" && (
              <span className="text-[10px] bg-destructive/20 text-destructive rounded px-1.5 py-0.5 font-bold">
                ALTA
              </span>
            )}
            {cat && (
              <span className={`text-[10px] ${cat.color}`}>
                {cat.emoji}
              </span>
            )}
            {mission.type === "daily" && mission.streak > 0 && (
              <span className="text-[10px] bg-orange-500/20 text-orange-400 rounded px-1.5 py-0.5 flex items-center gap-0.5">
                <Flame className="w-3 h-3" />
                {mission.streak}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  }

  function BossBanner() {
    if (!boss) return null;
    const hpPercent = (boss.current_hp / boss.max_hp) * 100;

    return (
      <div className="rounded-xl border-2 border-destructive bg-card p-5 shadow-[0_0_20px_theme(colors.destructive/0.3)]">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-5xl">{boss.icon}</span>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-destructive flex items-center gap-2">
              <Crown className="w-5 h-5" />
              {boss.name}
            </h3>
            {boss.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{boss.description}</p>
            )}
          </div>
        </div>

        {/* HP bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">HP</span>
            <span className="text-destructive font-mono font-bold">
              {boss.current_hp} / {boss.max_hp}
            </span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500 shadow-[0_0_8px_theme(colors.red.500/0.6)]"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {boss.defeated ? (
          <div className="text-center py-2">
            <p className="text-green-400 font-bold text-sm flex items-center justify-center gap-2">
              <Crown className="w-4 h-4" /> Derrotado!
            </p>
            <p className="text-xs text-muted-foreground mt-1">+200 XP +150 moedas conquistados</p>
          </div>
        ) : (
          <button
            onClick={attackBoss}
            className="w-full py-2.5 rounded-lg bg-destructive text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-destructive/90 active:scale-[0.98] transition-all shadow-[0_0_12px_theme(colors.destructive/0.4)]"
          >
            <Swords className="w-4 h-4" />
            Atacar Boss
          </button>
        )}
      </div>
    );
  }

  /* ─── add mission modal ─── */

  function AddMissionModal() {
    const [name, setName] = useState("");
    const [type, setType] = useState<MissionType>("daily");
    const [category, setCategory] = useState<Category>("work");
    const [xp, setXp] = useState(20);
    const [coins, setCoins] = useState(10);
    const [priority, setPriority] = useState<Priority>("normal");
    const [creating, setCreating] = useState(false);

    const handleTypeChange = (t: MissionType) => {
      setType(t);
      setXp(TYPE_DEFAULTS[t].xp);
      setCoins(TYPE_DEFAULTS[t].coins);
    };

    const handleCreate = async () => {
      if (!name.trim()) {
        toast.error("Digite o nome da missao");
        return;
      }
      setCreating(true);
      try {
        const res = await fetch("/api/missions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), type, category, xp, coins, priority }),
        });
        if (!res.ok) throw new Error();
        toast.success(`\u2694\uFE0F Missao criada!`);
        setShowAddModal(false);
        fetchAll();
      } catch {
        toast.error("Erro ao criar missao");
      } finally {
        setCreating(false);
      }
    };

    return (
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center"
        onClick={() => setShowAddModal(false)}
      >
        <div
          className="w-full max-w-lg bg-card border border-border rounded-t-2xl p-5 pb-8 animate-in slide-in-from-bottom duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-foreground">Nova Missao</h2>
            <button
              onClick={() => setShowAddModal(false)}
              className="p-1 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* name */}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da missao..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4"
            autoFocus
          />

          {/* type selector */}
          <div className="mb-4">
            <label className="text-xs text-muted-foreground mb-1.5 block">Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              {(["daily", "sprint", "epic"] as MissionType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                    type === t
                      ? t === "daily"
                        ? "bg-primary/20 border-primary text-primary"
                        : t === "sprint"
                        ? "bg-yellow-400/20 border-yellow-400 text-yellow-400"
                        : "bg-accent/20 border-accent text-accent"
                      : "border-border text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  {t === "daily" ? "Habito" : t === "sprint" ? "Sprint" : "Epico"}
                </button>
              ))}
            </div>
          </div>

          {/* category */}
          <div className="mb-4">
            <label className="text-xs text-muted-foreground mb-1.5 block">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {Object.entries(CATS).map(([key, c]) => (
                <option key={key} value={key}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* xp / coins / priority */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">XP</label>
              <input
                type="number"
                value={xp}
                onChange={(e) => setXp(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Moedas</label>
              <input
                type="number"
                value={coins}
                onChange={(e) => setCoins(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>

          {/* create button */}
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_12px_theme(colors.primary/0.4)]"
          >
            {creating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Criar Missao
          </button>
        </div>
      </div>
    );
  }

  /* ─── AI missions modal ─── */

  function AiMissionsModal() {
    const [selected, setSelected] = useState<Set<number>>(
      () => new Set(pendingAiMissions.map((_, i) => i))
    );
    const [adding, setAdding] = useState(false);

    const toggle = (idx: number) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(idx)) next.delete(idx);
        else next.add(idx);
        return next;
      });
    };

    const handleAdd = async () => {
      setAdding(true);
      try {
        const toAdd = pendingAiMissions.filter((_, i) => selected.has(i));
        await Promise.all(
          toAdd.map((m) =>
            fetch("/api/missions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: m.name,
                type: m.type,
                category: m.cat,
                xp: m.xp,
                coins: m.coins,
                priority: m.priority,
              }),
            })
          )
        );
        toast.success(`\u2728 ${toAdd.length} missoes adicionadas!`);
        setShowAiModal(false);
        setPendingAiMissions([]);
        fetchAll();
      } catch {
        toast.error("Erro ao adicionar missoes");
      } finally {
        setAdding(false);
      }
    };

    return (
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center"
        onClick={() => setShowAiModal(false)}
      >
        <div
          className="w-full max-w-lg bg-card border border-border rounded-t-2xl p-5 pb-8 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              Missoes do Mentor
            </h2>
            <button
              onClick={() => setShowAiModal(false)}
              className="p-1 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-2 mb-5">
            {pendingAiMissions.map((m, i) => {
              const cat = CATS[m.cat];
              return (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  className={`w-full text-left rounded-xl border p-3 flex items-start gap-3 transition-all ${
                    selected.has(i)
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card opacity-60"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
                      selected.has(i)
                        ? "bg-primary border-primary"
                        : "border-muted-foreground"
                    }`}
                  >
                    {selected.has(i) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    {m.why && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{m.why}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] font-bold bg-primary/20 text-primary rounded px-1.5 py-0.5">
                        {m.xp} XP
                      </span>
                      <span
                        className={`text-[10px] rounded px-1.5 py-0.5 ${
                          m.type === "daily"
                            ? "bg-primary/10 text-primary"
                            : m.type === "sprint"
                            ? "bg-yellow-400/10 text-yellow-400"
                            : "bg-accent/10 text-accent"
                        }`}
                      >
                        {m.type === "daily" ? "Habito" : m.type === "sprint" ? "Sprint" : "Epico"}
                      </span>
                      {cat && <span className="text-[10px]">{cat.emoji}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleAdd}
            disabled={adding || selected.size === 0}
            className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent/90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_12px_theme(colors.accent/0.4)]"
          >
            {adding ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Adicionar Selecionadas ({selected.size})
          </button>
        </div>
      </div>
    );
  }

  /* ─── render ─── */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-3 space-y-4 max-w-lg mx-auto">
      {/* title */}
      <div className="flex items-center gap-2">
        <Swords className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Missoes</h1>
      </div>

      {/* layer tabs */}
      <div className="bg-card rounded-xl p-1 border border-border grid grid-cols-4 gap-1">
        {LAYERS.map((l) => {
          const active = currentLayer === l.key;
          return (
            <button
              key={l.key}
              onClick={() => setCurrentLayer(l.key)}
              className={`relative py-2 rounded-lg text-xs font-bold text-center transition-all ${
                active
                  ? `${l.bg} ${l.border} border ${l.color} ${l.glow}`
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.label}
              {pendingCounts[l.key] > 0 && (
                <span
                  className={`absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1 ${
                    l.key === "boss"
                      ? "bg-destructive text-white"
                      : l.key === "daily"
                      ? "bg-primary text-primary-foreground"
                      : l.key === "sprint"
                      ? "bg-yellow-400 text-black"
                      : "bg-accent text-accent-foreground"
                  }`}
                >
                  {pendingCounts[l.key]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* category filter (hidden on boss layer) */}
      {currentLayer !== "boss" && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setCurrentCat("all")}
            className={`shrink-0 rounded-full border text-xs px-3 py-1.5 font-medium transition-all ${
              currentCat === "all"
                ? "border-primary bg-primary/20 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Todas
          </button>
          {Object.entries(CATS).map(([key, c]) => (
            <button
              key={key}
              onClick={() => setCurrentCat(key)}
              className={`shrink-0 rounded-full border text-xs px-3 py-1.5 font-medium transition-all flex items-center gap-1 ${
                currentCat === key
                  ? `border-current ${c.color} bg-current/10`
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-[10px]">{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* action buttons */}
      {currentLayer !== "boss" && (
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-[0_0_10px_theme(colors.primary/0.3)]"
          >
            <Plus className="w-4 h-4" />
            Missao
          </button>
          <Link
            href="/mentor"
            className="flex-1 py-2.5 rounded-xl border border-accent bg-accent/10 text-accent font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent/20 active:scale-[0.98] transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            Pedir ao Mentor
          </Link>
        </div>
      )}

      {/* mission list or boss */}
      {currentLayer === "boss" ? (
        <BossBanner />
      ) : layerMissions.length === 0 ? (
        <div className="text-center py-12">
          <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">Nenhuma missao aqui ainda</p>
          <p className="text-xs text-muted-foreground mt-1">Crie uma missao ou peca ao Mentor</p>
        </div>
      ) : (
        <div className="space-y-2">
          {layerMissions.map((m) => (
            <MissionCard key={m.id} mission={m} />
          ))}
        </div>
      )}

      {/* modals */}
      {showAddModal && <AddMissionModal />}
      {showAiModal && pendingAiMissions.length > 0 && <AiMissionsModal />}
    </div>
  );
}
