"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  ShoppingBag,
  Plus,
  Heart,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Key,
  RotateCcw,
  Coins,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { POTIONS } from "@/lib/constants";

interface Hero {
  id: string;
  coins: number;
  total_coins: number;
  hp: number;
  hp_max: number;
  api_key?: string | null;
  [key: string]: unknown;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  is_default: boolean;
}

interface Purchase {
  id: string;
  reward_name: string;
  cost: number;
  created_at: string;
}

export default function StorePage() {
  const router = useRouter();
  const [hero, setHero] = useState<Hero | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIcon, setFormIcon] = useState("");
  const [formCost, setFormCost] = useState<number>(50);

  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // History state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Settings state
  const [apiKey, setApiKey] = useState("");
  const [savingKey, setSavingKey] = useState(false);

  const fetchHero = useCallback(async () => {
    const res = await fetch("/api/hero");
    const data = await res.json();
    if (data.hero) {
      setHero(data.hero);
      setApiKey(data.hero.api_key ? "••••••••••" : "");
    }
  }, []);

  const fetchRewards = useCallback(async () => {
    const res = await fetch("/api/rewards");
    const data = await res.json();
    if (data.rewards) setRewards(data.rewards);
  }, []);

  useEffect(() => {
    Promise.all([fetchHero(), fetchRewards()]).finally(() => setLoading(false));
  }, [fetchHero, fetchRewards]);

  // Buy potion
  const buyPotion = async (index: number) => {
    const potion = POTIONS[index];
    if (!hero) return;

    if (hero.coins < potion.cost) {
      toast.error("Moedas insuficientes!");
      return;
    }

    if (!window.confirm(`Comprar ${potion.name} por ${potion.cost} moedas?`)) return;

    const res = await fetch("/api/rewards/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ potion_index: index }),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Erro ao comprar pocao");
      return;
    }

    toast.success(`+${potion.hp} HP restaurado!`);
    await fetchHero();
  };

  // Buy reward
  const buyReward = async (reward: Reward) => {
    if (!hero) return;

    if (hero.coins < reward.cost) {
      toast.error("Moedas insuficientes!");
      return;
    }

    if (!window.confirm(`Comprar ${reward.name} por ${reward.cost} moedas?`)) return;

    const res = await fetch("/api/rewards/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reward_id: reward.id }),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Erro ao comprar recompensa");
      return;
    }

    toast.success(`${reward.icon} ${reward.name} comprada!`);
    await fetchHero();
  };

  // Delete reward
  const deleteReward = async (reward: Reward) => {
    if (!window.confirm(`Excluir "${reward.name}"?`)) return;

    const res = await fetch(`/api/rewards/${reward.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Erro ao excluir recompensa");
      return;
    }

    toast.success("Recompensa excluida");
    setOpenDropdown(null);
    await fetchRewards();
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingReward(null);
    setFormName("");
    setFormDescription("");
    setFormIcon("🎁");
    setFormCost(50);
    setModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (reward: Reward) => {
    setEditingReward(reward);
    setFormName(reward.name);
    setFormDescription(reward.description);
    setFormIcon(reward.icon);
    setFormCost(reward.cost);
    setOpenDropdown(null);
    setModalOpen(true);
  };

  // Submit create/edit
  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast.error("Nome e obrigatorio");
      return;
    }

    const payload = {
      name: formName.trim(),
      description: formDescription.trim(),
      icon: formIcon || "🎁",
      cost: formCost,
    };

    if (editingReward) {
      const res = await fetch(`/api/rewards/${editingReward.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        toast.error("Erro ao atualizar recompensa");
        return;
      }
      toast.success("Recompensa atualizada!");
    } else {
      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        toast.error("Erro ao criar recompensa");
        return;
      }
      toast.success("Recompensa criada!");
    }

    setModalOpen(false);
    await fetchRewards();
  };

  // Fetch purchase history
  const fetchHistory = async () => {
    if (!hero) return;
    setLoadingHistory(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("reward_purchases")
      .select("*")
      .eq("hero_id", hero.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (data) setPurchases(data);
    setLoadingHistory(false);
  };

  const toggleHistory = () => {
    const next = !historyOpen;
    setHistoryOpen(next);
    if (next) fetchHistory();
  };

  // Save API key
  const saveApiKey = async () => {
    if (!apiKey || apiKey === "••••••••••") {
      toast.error("Digite uma API key valida");
      return;
    }
    setSavingKey(true);
    const res = await fetch("/api/hero", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey }),
    });
    setSavingKey(false);

    if (!res.ok) {
      toast.error("Erro ao salvar API Key");
      return;
    }
    toast.success("API Key salva!");
    setApiKey("••••••••••");
  };

  // Reset app
  const resetApp = async () => {
    if (
      !window.confirm(
        "ATENCAO: Isso vai apagar todos os seus dados (heroi, missoes, recompensas). Tem certeza?"
      )
    )
      return;

    if (!window.confirm("Ultima chance! Essa acao e irreversivel. Continuar?")) return;

    await fetch("/api/hero", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleted: true }),
    });

    router.push("/onboarding");
  };

  if (loading) {
    return (
      <div className="px-4 pt-4 flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground text-sm animate-pulse">Carregando loja...</div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 space-y-6 pb-6">
      {/* Page Title */}
      <div className="flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-bold">Loja</h1>
      </div>

      {/* ── Coins Banner ── */}
      <div className="rounded-xl border border-border bg-card p-4 neon-border-yellow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🪙</span>
            <div>
              <div className="text-3xl font-black text-yellow-400" style={{ textShadow: "0 0 12px oklch(0.82 0.14 85 / 0.5), 0 0 24px oklch(0.82 0.14 85 / 0.2)" }}>
                {hero?.coins ?? 0}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">moedas</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Ganho</div>
            <div className="text-lg font-bold text-yellow-400/70">{hero?.total_coins ?? 0}</div>
          </div>
        </div>
      </div>

      {/* ── Pocoes de Cura ── */}
      <section>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
          <Heart className="w-3.5 h-3.5 text-red-400" />
          Pocoes de Cura
        </div>
        <div className="grid grid-cols-3 gap-3">
          {POTIONS.map((potion, i) => (
            <button
              key={i}
              onClick={() => buyPotion(i)}
              className="rounded-xl border border-border bg-card p-4 text-center cursor-pointer hover:border-red-500/30 transition-all active:scale-95"
            >
              <div className="text-3xl mb-2">{potion.icon}</div>
              <div className="text-xs font-semibold mb-1">{potion.name}</div>
              <div className="text-red-400 text-xs font-bold mb-2">{potion.description}</div>
              <div className="flex items-center justify-center gap-1 text-yellow-400 font-semibold text-xs">
                <span>🪙</span>
                {potion.cost}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Recompensas ── */}
      <section>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
          <span>🎁</span>
          Recompensas
          <button
            onClick={openCreateModal}
            className="ml-auto flex items-center gap-1 bg-primary/15 border border-primary/30 text-primary rounded-lg px-2.5 py-1 text-[10px] font-semibold hover:bg-primary/25 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Nova
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 relative"
            >
              <div className="text-2xl flex-shrink-0">{reward.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{reward.name}</div>
                {reward.description && (
                  <div className="text-xs text-muted-foreground italic truncate">
                    {reward.description}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1 text-yellow-400 font-semibold text-xs">
                  <span>🪙</span>
                  {reward.cost}
                </div>
                <button
                  onClick={() => buyReward(reward)}
                  className="bg-primary/15 border border-primary/30 text-primary rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-primary/25 transition-colors"
                >
                  Comprar
                </button>
                <div className="relative">
                  <button
                    onClick={() =>
                      setOpenDropdown(openDropdown === reward.id ? null : reward.id)
                    }
                    className="p-1 rounded-md hover:bg-muted transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {openDropdown === reward.id && (
                    <div className="absolute right-0 top-8 z-40 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[120px]">
                      <button
                        onClick={() => openEditModal(reward)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </button>
                      <button
                        onClick={() => deleteReward(reward)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-destructive hover:bg-muted transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {rewards.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              Nenhuma recompensa ainda. Crie a primeira!
            </div>
          )}
        </div>
      </section>

      {/* ── Historico de Compras ── */}
      <section>
        <button
          onClick={toggleHistory}
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 w-full"
        >
          <Coins className="w-3.5 h-3.5" />
          Historico de Compras
          {historyOpen ? (
            <ChevronUp className="w-3.5 h-3.5 ml-auto" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 ml-auto" />
          )}
        </button>

        {historyOpen && (
          <div className="mt-3 space-y-2">
            {loadingHistory ? (
              <div className="text-xs text-muted-foreground animate-pulse py-4 text-center">
                Carregando...
              </div>
            ) : purchases.length === 0 ? (
              <div className="text-xs text-muted-foreground py-4 text-center">
                Nenhuma compra realizada ainda.
              </div>
            ) : (
              purchases.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-3 py-2"
                >
                  <div>
                    <div className="text-xs font-medium">{p.reward_name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400 text-xs font-semibold">
                    <span>🪙</span>
                    -{p.cost}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* ── Configuracoes ── */}
      <section>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
          <span>⚙️</span>
          Configuracoes
        </div>

        {/* API Key */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Key className="w-4 h-4 text-primary" />
            API Key (Claude)
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                hero?.api_key ? "bg-green-400" : "bg-red-400"
              }`}
            />
            {hero?.api_key ? "Chave configurada" : "Nenhuma chave configurada"}
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onFocus={() => {
                if (apiKey === "••••••••••") setApiKey("");
              }}
              placeholder="sk-ant-..."
              className="flex-1 bg-input border border-border rounded-lg px-3 py-2.5 text-sm"
            />
            <button
              onClick={saveApiKey}
              disabled={savingKey}
              className="bg-primary/15 border border-primary/30 text-primary rounded-lg px-4 py-2.5 text-xs font-semibold hover:bg-primary/25 transition-colors disabled:opacity-50"
            >
              {savingKey ? "..." : "Salvar"}
            </button>
          </div>
        </div>

        {/* Reset App */}
        <div className="mt-3 rounded-xl border border-destructive/20 bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <RotateCcw className="w-4 h-4" />
                Resetar App
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Apaga todos os dados e volta ao inicio
              </div>
            </div>
            <button
              onClick={resetApp}
              className="bg-destructive/15 border border-destructive/30 text-destructive rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-destructive/25 transition-colors"
            >
              Resetar
            </button>
          </div>
        </div>
      </section>

      {/* ── Create/Edit Reward Modal ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="bg-card border-t border-border rounded-t-2xl p-6 w-full animate-in slide-in-from-bottom duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold">
                {editingReward ? "Editar Recompensa" : "Nova Recompensa"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-muted rounded-md">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Emoji</label>
                <input
                  type="text"
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  maxLength={2}
                  className="w-20 bg-input border border-border rounded-lg px-3 py-2.5 text-sm text-center text-2xl"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nome</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Dia de folga"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Descricao</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Descricao breve..."
                  className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Custo (moedas)</label>
                <input
                  type="number"
                  value={formCost}
                  onChange={(e) => setFormCost(Number(e.target.value))}
                  min={1}
                  className="w-32 bg-input border border-border rounded-lg px-3 py-2.5 text-sm"
                />
              </div>

              <button
                onClick={handleSubmit}
                className="w-full bg-primary text-primary-foreground rounded-lg py-3 text-sm font-bold hover:opacity-90 transition-opacity mt-2"
              >
                {editingReward ? "Salvar Alteracoes" : "Criar Recompensa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
