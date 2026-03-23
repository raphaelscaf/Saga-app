import type { Category } from "@/types/database";

export const CATEGORIES: Record<Category, {
  label: string;
  icon: string;
  color: string;
  attr: keyof import("@/types/database").HeroAttrs;
}> = {
  health: { label: "Saude", icon: "Heart", color: "var(--cat-health)", attr: "energy" },
  work: { label: "Trabalho", icon: "Briefcase", color: "var(--cat-work)", attr: "productivity" },
  mind: { label: "Mente", icon: "Brain", color: "var(--cat-mind)", attr: "focus" },
  finance: { label: "Financas", icon: "Wallet", color: "var(--cat-finance)", attr: "discipline" },
  social: { label: "Relacionamentos", icon: "Users", color: "var(--cat-social)", attr: "creativity" },
};

export const CATEGORY_EMOJI: Record<Category, string> = {
  health: "❤️",
  work: "💼",
  mind: "🧠",
  finance: "💰",
  social: "🤝",
};

export const CLASS_NAMES = [
  "Iniciante",
  "Aprendiz",
  "Guerreiro",
  "Veterano",
  "Campeao",
  "Lendario",
];

export const HERO_CLASSES = [
  {
    id: "Estrategista",
    name: "Estrategista",
    icon: "🧠",
    description: "Planeja cada passo. Foco em resultados e eficiencia.",
  },
  {
    id: "Guerreiro",
    name: "Guerreiro",
    icon: "⚔️",
    description: "Age com forca e determinacao. Nunca recua.",
  },
  {
    id: "Construtor",
    name: "Construtor",
    icon: "🔨",
    description: "Cria sistemas e habitos. Consistencia e sua arma.",
  },
  {
    id: "Visionario",
    name: "Visionario",
    icon: "🌟",
    description: "Pensa grande. Objetivos epicos sao seu combustivel.",
  },
];

export const AVATARS = [
  "⚡", "🔥", "💎", "🌙",
  "⭐", "🎯", "🚀", "💀",
  "🐉", "🦅", "🐺", "🦁",
  "👾", "🤖", "🎮", "🕹️",
];

export const STRENGTH_OPTIONS = [
  "Resiliencia",
  "Lideranca",
  "Criatividade",
  "Foco",
  "Empatia",
  "Disciplina",
  "Comunicacao",
  "Adaptabilidade",
  "Persistencia",
  "Visao Estrategica",
];

export const WEAKNESS_OPTIONS = [
  "Procrastinacao",
  "Ansiedade",
  "Desorganizacao",
  "Perfeccionismo",
  "Impaciencia",
  "Distracao",
  "Excesso de autocritica",
  "Dificuldade em delegar",
];

export const POTIONS = [
  { name: "Pocao Pequena", hp: 30, cost: 60, icon: "🧪", description: "+30 HP" },
  { name: "Pocao Mediana", hp: 50, cost: 110, icon: "🫧", description: "+50 HP" },
  { name: "Pocao Grande", hp: 70, cost: 140, icon: "🏺", description: "+70 HP" },
];

export const DEFAULT_REWARDS = [
  { name: "Serie ou Filme", description: "Uma noite de entretenimento", icon: "🎬", cost: 50 },
  { name: "Refeicao Especial", description: "Aquele restaurante especial", icon: "🍽️", cost: 100 },
  { name: "Dia de Folga", description: "Descanso total, sem culpa", icon: "😴", cost: 200 },
  { name: "Compra Desejada", description: "Aquele item que voce quer", icon: "🛍️", cost: 300 },
];

export interface AchievementDef {
  id: string;
  name: string;
  icon: string;
  story: string;
  condition: (stats: GameStats) => boolean;
}

export interface GameStats {
  totalMissionsDone: number;
  streak: number;
  totalCoins: number;
  level: number;
  bossKills: number;
  categoriesCompleted: string[];
}

export const ACHIEVEMENTS_DEF: AchievementDef[] = [
  {
    id: "first_mission",
    name: "Primeira Batalha",
    icon: "⚔️",
    story: "O guerreiro ergueu sua espada pela primeira vez. Naquele momento, a jornada se tornou real.",
    condition: (s) => s.totalMissionsDone >= 1,
  },
  {
    id: "streak_3",
    name: "Chama Persistente",
    icon: "🔥",
    story: "Tres dias consecutivos de batalha. A chama nao se apagou nem diante do cansaco.",
    condition: (s) => s.streak >= 3,
  },
  {
    id: "streak_7",
    name: "Semana de Ferro",
    icon: "🛡️",
    story: "Uma semana inteira de disciplina forjou uma armadura invisivel ao redor do heroi.",
    condition: (s) => s.streak >= 7,
  },
  {
    id: "coins_100",
    name: "Cofre do Guerreiro",
    icon: "🪙",
    story: "As moedas acumuladas narram cada vitoria. Cada missao, uma recompensa merecida.",
    condition: (s) => s.totalCoins >= 100,
  },
  {
    id: "level_3",
    name: "Ascensao",
    icon: "⭐",
    story: "Do iniciante ao guerreiro — a evolucao nao acontece da noite pro dia, mas acontece.",
    condition: (s) => s.level >= 3,
  },
  {
    id: "missions_10",
    name: "Dezena Lendaria",
    icon: "🏅",
    story: "Dez batalhas vencidas. O que era dificil agora e rotina. O crescimento e silencioso mas real.",
    condition: (s) => s.totalMissionsDone >= 10,
  },
  {
    id: "missions_30",
    name: "O Constante",
    icon: "💎",
    story: "Trinta missoes. Nao existe sorte aqui — existe consistencia, a virtude mais rara de todas.",
    condition: (s) => s.totalMissionsDone >= 30,
  },
  {
    id: "boss_first",
    name: "Cacador de Dragoes",
    icon: "🐉",
    story: "O Boss do mes caiu. O heroi encarou o dragao nos olhos e nao recuou.",
    condition: (s) => s.bossKills >= 1,
  },
  {
    id: "all_cats",
    name: "Guerreiro Completo",
    icon: "🌟",
    story: "Saude, trabalho, mente, financas e relacoes — o heroi forjou equilibrio em todas as frentes.",
    condition: (s) => s.categoriesCompleted.length >= 5,
  },
];

export const MILESTONES = [
  { label: "1 Dia", icon: "🚩", days: 1 },
  { label: "1 Semana", icon: "⭐", days: 7 },
  { label: "2 Semanas", icon: "🏆", days: 14 },
  { label: "1 Mes", icon: "🔥", days: 30 },
  { label: "2 Meses", icon: "👑", days: 60 },
  { label: "3 Meses", icon: "🌟", days: 90 },
];

export const BOSS_TEMPLATES = [
  {
    name: "Dragao da Procrastinacao",
    description: "Complete 15 missoes neste mes para derrota-lo",
    icon: "🐉",
    max_hp: 15,
  },
  {
    name: "Hidra do Caos",
    description: "Complete 20 missoes neste mes para derrota-la",
    icon: "🐲",
    max_hp: 20,
  },
  {
    name: "Demonio da Distracao",
    description: "Complete 12 habitos diarios neste mes",
    icon: "👿",
    max_hp: 12,
  },
  {
    name: "Golem da Inercia",
    description: "Complete 10 sprints neste mes para destrui-lo",
    icon: "🗿",
    max_hp: 10,
  },
];
