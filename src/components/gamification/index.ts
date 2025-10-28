/**
 * INDEX DE GAMIFICAÇÃO
 * Exporte tudo daqui para facilitar a integração
 */

// Types
export * from '@/types/gamification';

// Provider
export { GamificationProvider, useGamification } from '@/providers/gamification-provider';

// Hooks
export {
  usePageXP,
  useActionXP,
  useBadgeUnlock,
  useMilestoneTracker,
  useDailyStreak,
  useUserGamificationStats,
  useXPAnimations,
} from '@/hooks/use-gamification';

// Components - XP
export { XPBar, LevelCard, BadgeGrid, XPNotification, LevelUpCelebration } from './xp-components';

// Components - Ranking
export { RankingLeaderboard, MiniRankingCard, CompetitiveAchievement } from './ranking-components';

// Components - HUD
export {
  GamificationMiniHUD,
  GamificationFullPanel,
  GamificationNotificationsHub,
} from './gamification-hud';

// Components - Assistant
export { DeltaAssistant, AISuggestionsPanel } from './delta-assistant';

// Components - Presentation
export { PresentationMode, usePresentationMode } from './presentation-mode';
