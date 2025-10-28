/**
 * TIPOS DE GAMIFICAÇÃO - DELTA NAVIGATOR
 * Sistema modular que funciona em todas as telas
 */

// ================== TIPOS BÁSICOS ==================

export type BadgeType = 
  | 'first_login' 
  | 'power_user' 
  | 'data_master' 
  | 'speed_demon' 
  | 'analyst_pro' 
  | 'champion' 
  | 'milestone_100xp'
  | 'milestone_500xp'
  | 'milestone_1000xp'
  | 'daily_warrior'
  | 'streak_7days'
  | 'streak_30days';

export interface Badge {
  id: BadgeType;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
  progress?: number; // Para badges progressivas
  maxProgress?: number;
}

export interface UserLevel {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  title: string; // Ex: "Analista", "Especialista", "Mestre"
}

export interface UserStats {
  userId: string;
  username: string;
  avatar?: string;
  level: UserLevel;
  badges: Badge[];
  ranking: {
    position: number;
    totalUsers: number;
  };
  streakDays: number;
  lastLoginDate: Date;
  joinDate: Date;
}

export interface XPGain {
  amount: number;
  reason: string;
  timestamp: Date;
  icon?: string;
}

export interface Ranking {
  position: number;
  userId: string;
  username: string;
  avatar?: string;
  level: number;
  totalXP: number;
  badgeCount: number;
  badge?: string;
  totalUsers?: number;
}

// ================== EVENTOS DE GAMIFICAÇÃO ==================

export type GamificationEventType =
  | 'page_visit'
  | 'data_viewed'
  | 'report_generated'
  | 'data_filtered'
  | 'export_data'
  | 'comparison_made'
  | 'chart_analyzed'
  | 'custom_dashboard_created'
  | 'badge_unlocked'
  | 'level_up'
  | 'daily_login';

export interface GamificationEvent {
  type: GamificationEventType;
  xpAmount: number;
  description: string;
  icon?: string;
  badgeUnlocked?: Badge;
  levelUp?: boolean;
  newLevel?: number;
}

// ================== ASSISTENTE VIRTUAL ==================

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  suggestions?: string[]; // Sugestões automáticas
  dataContext?: {
    metric?: string;
    value?: number;
    icon?: string;
  };
}

export interface AssistantContext {
  currentPage: string;
  userId: string;
  userLevel: number;
  recentMetrics?: Record<string, number>;
  dashboardData?: Record<string, any>;
}

// ================== MODO PRESENTATION ==================

export interface PresentationMode {
  isActive: boolean;
  currentSlide: number;
  totalSlides: number;
  theme: 'dark' | 'light';
  showNotes: boolean;
  autoPlay: boolean;
}

// ================== NOTIFICAÇÕES GAMIFICAÇÃO ==================

export interface GamificationNotification {
  id: string;
  type: 'xp_gain' | 'badge_unlock' | 'level_up' | 'ranking_change' | 'achievement';
  title: string;
  message: string;
  icon: string;
  color?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ================== CONFIGURAÇÕES GLOBAIS ==================

export const XP_CONFIGS = {
  PAGE_VISIT: 5,
  DATA_VIEWED: 10,
  REPORT_GENERATED: 50,
  DATA_FILTERED: 8,
  EXPORT_DATA: 15,
  COMPARISON_MADE: 25,
  CHART_ANALYZED: 12,
  CUSTOM_DASHBOARD: 100,
  DAILY_LOGIN_BONUS: 20,
  LEVEL_UP_MILESTONE: 100, // XP por nível
} as const;

export const LEVEL_TITLES = [
  'Iniciante',
  'Aprendiz',
  'Analista',
  'Especialista',
  'Mestre',
  'Consultor',
  'Diretor',
  'Executivo',
  'Presidente',
  'Lenda',
] as const;

export const BADGE_DEFINITIONS: Record<BadgeType, Badge> = {
  first_login: {
    id: 'first_login',
    name: '🎯 Primeira Conexão',
    description: 'Você entrou no Delta Navigator pela primeira vez',
    icon: '🎯',
    rarity: 'common',
  },
  power_user: {
    id: 'power_user',
    name: '⚡ Power User',
    description: 'Ganhe 500 XP em um único dia',
    icon: '⚡',
    rarity: 'epic',
  },
  data_master: {
    id: 'data_master',
    name: '📊 Mestre dos Dados',
    description: 'Analise mais de 100 dados diferentes',
    icon: '📊',
    rarity: 'epic',
  },
  speed_demon: {
    id: 'speed_demon',
    name: '🚀 Speed Demon',
    description: 'Visualize 50 dashboards em uma semana',
    icon: '🚀',
    rarity: 'rare',
  },
  analyst_pro: {
    id: 'analyst_pro',
    name: '🎓 Analista Pro',
    description: 'Crie 10 comparativos de dados',
    icon: '🎓',
    rarity: 'rare',
  },
  champion: {
    id: 'champion',
    name: '👑 Campeão',
    description: 'Fique no topo do ranking por 7 dias',
    icon: '👑',
    rarity: 'legendary',
  },
  milestone_100xp: {
    id: 'milestone_100xp',
    name: '💯 Primeiro Milestone',
    description: 'Ganhe 100 XP totais',
    icon: '💯',
    rarity: 'common',
  },
  milestone_500xp: {
    id: 'milestone_500xp',
    name: '🔥 Fogo na Veia',
    description: 'Ganhe 500 XP totais',
    icon: '🔥',
    rarity: 'rare',
  },
  milestone_1000xp: {
    id: 'milestone_1000xp',
    name: '💎 Elite Navigator',
    description: 'Ganhe 1000 XP totais',
    icon: '💎',
    rarity: 'epic',
  },
  daily_warrior: {
    id: 'daily_warrior',
    name: '⚔️ Guerreiro Diário',
    description: 'Acesse o sistema 10 dias consecutivos',
    icon: '⚔️',
    rarity: 'rare',
  },
  streak_7days: {
    id: 'streak_7days',
    name: '🔥 Streak 7 Dias',
    description: 'Mantenha 7 dias de login consecutivos',
    icon: '🔥',
    rarity: 'rare',
  },
  streak_30days: {
    id: 'streak_30days',
    name: '🌟 Streak 30 Dias',
    description: 'Mantenha 30 dias de login consecutivos',
    icon: '🌟',
    rarity: 'legendary',
  },
};
