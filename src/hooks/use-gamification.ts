/**
 * HOOKS CUSTOMIZADOS PARA GAMIFICAÇÃO
 * Use em qualquer componente para adicionar XP, badges, etc
 */

import { useEffect, useCallback, useRef } from 'react';
import { useGamification } from '@/providers/gamification-provider';
import { GamificationEventType, XP_CONFIGS } from '@/types/gamification';

/**
 * Hook para adicionar XP automaticamente ao visitar uma página
 * @param pageType - Tipo de página/evento
 */
export const usePageXP = (pageType: GamificationEventType = 'page_visit') => {
  const { addXP, logEvent } = useGamification();
  const hasLoggedRef = useRef(false);

  useEffect(() => {
    if (hasLoggedRef.current) return;
    hasLoggedRef.current = true;

    // Adicionar XP pela visita à página
    const xpAmount = XP_CONFIGS[pageType as keyof typeof XP_CONFIGS] || 5;
    addXP(xpAmount, `Visitou página`, '👀');

    // Log do evento
    logEvent({
      type: pageType,
      xpAmount,
      description: `Visitou página`,
    });
  }, [pageType, addXP, logEvent]);
};

/**
 * Hook para adicionar XP quando usuário realiza ação específica
 * @param action - Descrição da ação
 * @param xpAmount - Quantidade de XP (opcional, usa config padrão)
 */
export const useActionXP = (action: string, xpAmount?: number) => {
  const { addXP, logEvent } = useGamification();

  const triggerXP = useCallback(
    (customXP?: number) => {
      const finalXP = customXP ?? xpAmount ?? 10;
      addXP(finalXP, action, '⚡');
      logEvent({
        type: 'custom_dashboard_created',
        xpAmount: finalXP,
        description: action,
      });
    },
    [action, xpAmount, addXP, logEvent]
  );

  return triggerXP;
};

/**
 * Hook para monitorar progresso e desbloquear badges automáticamente
 * @param badgeId - ID da badge
 * @param condition - Função que retorna true quando badge deve ser desbloqueada
 */
export const useBadgeUnlock = (badgeId: string, condition: () => boolean) => {
  const { unlockBadge, hasBadge } = useGamification();
  const checkRef = useRef(false);

  useEffect(() => {
    if (checkRef.current || hasBadge(badgeId as any)) return;

    if (condition()) {
      unlockBadge(badgeId as any);
      checkRef.current = true;
    }
  }, [condition, badgeId, unlockBadge, hasBadge]);
};

/**
 * Hook para incrementar counter e desbloquear badge ao atingir meta
 * @param badgeId - ID da badge
 * @param metaValue - Quantidade necessária
 * @param currentValue - Valor atual
 */
export const useMilestoneTracker = (
  badgeId: string,
  metaValue: number,
  currentValue: number
) => {
  const { unlockBadge, hasBadge } = useGamification();

  useEffect(() => {
    if (currentValue >= metaValue && !hasBadge(badgeId as any)) {
      unlockBadge(badgeId as any);
    }
  }, [currentValue, metaValue, badgeId, unlockBadge, hasBadge]);

  return {
    progress: Math.min((currentValue / metaValue) * 100, 100),
    isComplete: currentValue >= metaValue,
  };
};

/**
 * Hook para daily login streak
 */
export const useDailyStreak = () => {
  const { userStats, addXP } = useGamification();
  const lastCheckRef = useRef<string | null>(null);

  useEffect(() => {
    const today = new Date().toDateString();

    if (lastCheckRef.current === today) return;
    lastCheckRef.current = today;

    // Daily login bonus
    addXP(XP_CONFIGS.DAILY_LOGIN_BONUS, 'Login Diário', '🎁');
  }, [addXP]);

  return {
    streakDays: userStats?.streakDays || 0,
  };
};

/**
 * Hook para obter informações do usuário em gamificação
 */
export const useUserGamificationStats = () => {
  const { userStats, rankings, getUserRanking } = useGamification();

  return {
    level: userStats?.level.level || 1,
    totalXP: userStats?.level.totalXP || 0,
    currentXP: userStats?.level.currentXP || 0,
    levelTitle: userStats?.level.title || 'Iniciante',
    badges: userStats?.badges || [],
    badgeCount: userStats?.badges.length || 0,
    ranking: getUserRanking(),
    streakDays: userStats?.streakDays || 0,
  };
};

/**
 * Hook para monitorar ganho de XP em tempo real
 */
export const useXPAnimations = () => {
  const { addXP, getCurrentLevelProgress } = useGamification();
  const progressRef = useRef(getCurrentLevelProgress());

  useEffect(() => {
    progressRef.current = getCurrentLevelProgress();
  }, [getCurrentLevelProgress]);

  return {
    progress: progressRef.current,
    gainXP: addXP,
  };
};
