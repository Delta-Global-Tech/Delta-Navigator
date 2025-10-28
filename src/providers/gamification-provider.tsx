/**
 * CONTEXTO DE GAMIFICAÇÃO GLOBAL
 * Gerencia XP, Levels, Badges em tempo real
 * Funciona em todas as telas sem quebrar nada
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  UserStats,
  Badge,
  XPGain,
  GamificationEvent,
  GamificationNotification,
  Ranking,
  BadgeType,
  XP_CONFIGS,
  LEVEL_TITLES,
  BADGE_DEFINITIONS,
} from '@/types/gamification';
import { toast } from 'sonner';

interface GamificationContextType {
  // User Data
  userStats: UserStats | null;
  loading: boolean;

  // XP & Levels
  addXP: (amount: number, reason: string, icon?: string) => void;
  checkLevelUp: () => void;
  getCurrentLevelProgress: () => number; // 0-100%

  // Badges
  unlockBadge: (badgeId: BadgeType) => void;
  hasBadge: (badgeId: BadgeType) => boolean;
  getBadgeProgress: (badgeId: BadgeType) => { progress: number; maxProgress: number } | null;

  // Rankings
  rankings: Ranking[];
  getUserRanking: () => Ranking | undefined;
  updateRankings: () => Promise<void>;

  // Events
  logEvent: (event: GamificationEvent) => void;
  triggerNotification: (notification: GamificationNotification) => void;

  // Notifications
  notifications: GamificationNotification[];
  clearNotifications: () => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [notifications, setNotifications] = useState<GamificationNotification[]>([]);
  const [xpHistory, setXpHistory] = useState<XPGain[]>([]);

  // Inicializar usuário (mock - substituir por API real)
  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = () => {
    // Tentar carregar dados salvos do localStorage
    const savedStats = localStorage.getItem('gamification_stats');
    let userStats: UserStats;

    if (savedStats) {
      try {
        userStats = JSON.parse(savedStats);
        // Converter strings de data para objetos Date
        userStats.lastLoginDate = new Date(userStats.lastLoginDate);
        userStats.joinDate = new Date(userStats.joinDate);
        userStats.badges = userStats.badges.map(badge => ({
          ...badge,
          unlockedAt: new Date(badge.unlockedAt),
        }));
      } catch (error) {
        console.error('Erro ao carregar dados de gamificação:', error);
        userStats = createDefaultUser();
      }
    } else {
      userStats = createDefaultUser();
    }

    setUserStats(userStats);
    setLoading(false);

    // Check first login badge
    setTimeout(() => {
      unlockBadge('first_login');
    }, 500);
  };

  const createDefaultUser = (): UserStats => {
    return {
      userId: 'user_123',
      username: 'Seu Nome',
      level: {
        level: 1,
        currentXP: 0,
        xpToNextLevel: XP_CONFIGS.LEVEL_UP_MILESTONE,
        totalXP: 0,
        title: 'Iniciante',
      },
      badges: [],
      ranking: {
        position: 50,
        totalUsers: 1000,
      },
      streakDays: 1,
      lastLoginDate: new Date(),
      joinDate: new Date(),
    };
  };

  // ==================== XP & LEVELS ====================

  // 💾 Persistir dados no localStorage sempre que userStats muda
  useEffect(() => {
    if (userStats && !loading) {
      try {
        localStorage.setItem('gamification_stats', JSON.stringify(userStats));
      } catch (error) {
        console.error('Erro ao salvar dados de gamificação:', error);
      }
    }
  }, [userStats, loading]);

  const addXP = useCallback(
    (amount: number, reason: string, icon?: string) => {
      setUserStats((prev) => {
        if (!prev) return prev;

        const updated = { ...prev };
        const newCurrentXP = updated.level.currentXP + amount;
        const newTotalXP = updated.level.totalXP + amount;

        // Verificar level up
        let leveledUp = false;
        let newLevel = updated.level.level;

        if (newCurrentXP >= updated.level.xpToNextLevel) {
          newLevel += 1;
          leveledUp = true;
        }

        updated.level = {
          ...updated.level,
          currentXP: leveledUp ? 0 : newCurrentXP,
          totalXP: newTotalXP,
          level: newLevel,
          xpToNextLevel: XP_CONFIGS.LEVEL_UP_MILESTONE,
          title: LEVEL_TITLES[Math.min(newLevel - 1, LEVEL_TITLES.length - 1)] || 'Lenda',
        };

        // Registrar ganho de XP
        setXpHistory((prev) => [
          ...prev,
          { amount, reason, timestamp: new Date(), icon },
        ]);

        // Notificação visual
        toast.success(`+${amount} XP - ${reason}`, {
          description: `Total: ${newTotalXP} XP`,
          icon: icon || '⭐',
        });

        // Level up notification
        if (leveledUp) {
          triggerNotification({
            id: `levelup_${Date.now()}`,
            type: 'level_up',
            title: `🎉 LEVEL UP! Nível ${newLevel}`,
            message: `Você agora é ${LEVEL_TITLES[Math.min(newLevel - 1, LEVEL_TITLES.length - 1)]}!`,
            icon: '🎉',
            color: 'bg-yellow-500',
          });

          // Confetti celebration
          celebrateEvent('level_up');

          // Check milestone badges
          if (newTotalXP >= 100) unlockBadge('milestone_100xp');
          if (newTotalXP >= 500) unlockBadge('milestone_500xp');
          if (newTotalXP >= 1000) unlockBadge('milestone_1000xp');
        }

        return updated;
      });
    },
    []
  );

  const checkLevelUp = useCallback(() => {
    setUserStats((prev) => {
      if (!prev) return prev;
      if (prev.level.currentXP >= prev.level.xpToNextLevel) {
        return {
          ...prev,
          level: {
            ...prev.level,
            level: prev.level.level + 1,
            currentXP: 0,
            title: LEVEL_TITLES[Math.min(prev.level.level, LEVEL_TITLES.length - 1)] || 'Lenda',
          },
        };
      }
      return prev;
    });
  }, []);

  const getCurrentLevelProgress = useCallback(() => {
    if (!userStats) return 0;
    return (userStats.level.currentXP / userStats.level.xpToNextLevel) * 100;
  }, [userStats]);

  // ==================== BADGES ====================

  const unlockBadge = useCallback((badgeId: BadgeType) => {
    setUserStats((prev) => {
      if (!prev) return prev;

      const badgeAlreadyUnlocked = prev.badges.some((b) => b.id === badgeId);
      if (badgeAlreadyUnlocked) return prev;

      const badgeDefinition = BADGE_DEFINITIONS[badgeId];
      const newBadge: Badge = {
        ...badgeDefinition,
        unlockedAt: new Date(),
      };

      const updated = { ...prev };
      updated.badges = [...prev.badges, newBadge];

      // Notification
      triggerNotification({
        id: `badge_${badgeId}_${Date.now()}`,
        type: 'badge_unlock',
        title: `🏆 CONQUISTOU: ${newBadge.name}`,
        message: newBadge.description,
        icon: newBadge.icon,
        color: 'bg-purple-500',
      });

      // Celebrate
      celebrateEvent('badge_unlock');

      // Toast
      toast.success(`Conquistou ${newBadge.name}!`, {
        description: newBadge.description,
        icon: newBadge.icon,
      });

      return updated;
    });
  }, []);

  const hasBadge = useCallback(
    (badgeId: BadgeType) => {
      return userStats?.badges.some((b) => b.id === badgeId) ?? false;
    },
    [userStats]
  );

  const getBadgeProgress = useCallback(
    (badgeId: BadgeType) => {
      const badge = userStats?.badges.find((b) => b.id === badgeId);
      if (!badge || badge.maxProgress === undefined) return null;
      return {
        progress: badge.progress || 0,
        maxProgress: badge.maxProgress,
      };
    },
    [userStats]
  );

  // ==================== RANKINGS ====================

  const updateRankings = useCallback(async () => {
    // Mock rankings - substituir por API real
    const mockRankings: Ranking[] = Array.from({ length: 10 }, (_, i) => ({
      position: i + 1,
      userId: `user_${i}`,
      username: `Usuário ${i + 1}`,
      level: 10 - i,
      totalXP: (10 - i) * 500,
      badgeCount: Math.floor(Math.random() * 12),
    }));

    setRankings(mockRankings);
  }, []);

  const getUserRanking = useCallback(() => {
    return rankings.find((r) => r.userId === userStats?.userId);
  }, [rankings, userStats]);

  // ==================== EVENTS ====================

  const logEvent = useCallback((event: GamificationEvent) => {
    // Log para analytics
    console.log('[Gamification Event]', event);

    // XP automático baseado no tipo de evento
    if (event.xpAmount > 0) {
      addXP(event.xpAmount, event.description, event.icon);
    }

    // Badge unlock automático
    if (event.badgeUnlocked) {
      unlockBadge(event.badgeUnlocked.id as BadgeType);
    }
  }, [addXP, unlockBadge]);

  // ==================== NOTIFICATIONS ====================

  const triggerNotification = useCallback((notification: GamificationNotification) => {
    const id = notification.id || `notif_${Date.now()}`;
    const withId = { ...notification, id };

    setNotifications((prev) => [...prev, withId]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // ==================== HELPERS ====================

  const celebrateEvent = (eventType: string) => {
    // Trigger confetti, sounds, etc
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([100, 50, 100]);
      } catch (e) {
        // Silently fail if vibration API not available
      }
    }
  };

  const value: GamificationContextType = {
    userStats,
    loading,
    addXP,
    checkLevelUp,
    getCurrentLevelProgress,
    unlockBadge,
    hasBadge,
    getBadgeProgress,
    rankings,
    getUserRanking,
    updateRankings,
    logEvent,
    triggerNotification,
    notifications,
    clearNotifications,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within GamificationProvider');
  }
  return context;
};
