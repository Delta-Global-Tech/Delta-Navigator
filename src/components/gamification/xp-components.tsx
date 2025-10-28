/**
 * COMPONENTE: XP Bar Animada
 * Barra de progressão com animações suaves e contador de números
 */

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGamification } from '@/providers/gamification-provider';

export const XPBar: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { userStats, getCurrentLevelProgress } = useGamification();
  const [displayProgress, setDisplayProgress] = React.useState(0);
  const progressRef = useRef(getCurrentLevelProgress());

  useEffect(() => {
    const current = getCurrentLevelProgress();
    progressRef.current = current;

    // Animar a mudança de progresso
    let start = displayProgress;
    let animationFrameId: number;

    const animate = () => {
      start += (current - start) * 0.1;
      setDisplayProgress(start);

      if (Math.abs(current - start) > 0.5) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayProgress(current);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [getCurrentLevelProgress, displayProgress]);

  if (!userStats) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">⭐</span>
          <div>
            <p className="text-sm font-semibold">{userStats.level.title}</p>
            <p className="text-xs text-muted-foreground">Nível {userStats.level.level}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">{Math.round(displayProgress)}%</p>
          <p className="text-xs text-muted-foreground">
            {userStats.level.currentXP} / {userStats.level.xpToNextLevel} XP
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="absolute h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
          initial={{ width: 0 }}
          animate={{ width: `${displayProgress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        {/* Shine effect */}
        <motion.div
          className="absolute h-full w-1/3 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
          animate={{ x: ['0%', '300%', '400%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Total XP */}
      <p className="text-xs text-center text-muted-foreground">
        Total: {userStats.level.totalXP} XP
      </p>
    </div>
  );
};

/**
 * COMPONENTE: Level Card
 * Card mostrando nível com animação de level up
 */
export const LevelCard: React.FC<{ animated?: boolean }> = ({ animated = true }) => {
  const { userStats } = useGamification();

  if (!userStats) return null;

  return (
    <motion.div
      className="relative p-6 rounded-lg border border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-pink-500/10"
      animate={animated ? { scale: [1, 1.05, 1], boxShadow: ['0 0 0px rgba(168, 85, 247, 0)', '0 0 20px rgba(168, 85, 247, 0.5)', '0 0 0px rgba(168, 85, 247, 0)'] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <div className="text-center">
        <motion.div
          className="text-6xl font-bold mb-2"
          animate={animated ? { y: [0, -5, 0] } : {}}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        >
          {userStats.level.level}
        </motion.div>
        <p className="text-lg font-semibold text-purple-300">{userStats.level.title}</p>
        <p className="text-sm text-muted-foreground">
          {userStats.level.totalXP} XP Total
        </p>
      </div>
    </motion.div>
  );
};

/**
 * COMPONENTE: Badge Grid
 * Grade de conquistas desbloqueadas
 */
export const BadgeGrid: React.FC<{ maxDisplay?: number }> = ({ maxDisplay = 12 }) => {
  const { userStats } = useGamification();

  if (!userStats || userStats.badges.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Desbloqueie conquistas para vê-las aqui! 🎯</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {userStats.badges.slice(0, maxDisplay).map((badge, index) => (
        <motion.div
          key={badge.id}
          className="relative group"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            duration: 0.5,
            delay: index * 0.05,
            type: 'spring',
            stiffness: 100,
          }}
        >
          {/* Badge Background */}
          <div
            className={`
              aspect-square rounded-lg p-3 flex items-center justify-center text-3xl
              border-2 backdrop-blur-sm transition-all duration-300
              ${
                badge.rarity === 'legendary'
                  ? 'border-yellow-500 bg-yellow-500/10 group-hover:shadow-lg group-hover:shadow-yellow-500'
                  : badge.rarity === 'epic'
                    ? 'border-purple-500 bg-purple-500/10 group-hover:shadow-lg group-hover:shadow-purple-500'
                    : badge.rarity === 'rare'
                      ? 'border-blue-500 bg-blue-500/10 group-hover:shadow-lg group-hover:shadow-blue-500'
                      : 'border-gray-500 bg-gray-500/10 group-hover:shadow-lg group-hover:shadow-gray-500'
              }
            `}
          >
            {badge.icon}
          </div>

          {/* Tooltip */}
          <div
            className="
              absolute -top-12 left-1/2 -translate-x-1/2 px-2 py-1
              bg-background border border-border rounded text-xs whitespace-nowrap
              opacity-0 group-hover:opacity-100 transition-opacity
              pointer-events-none z-10
            "
          >
            <p className="font-semibold">{badge.name}</p>
            <p className="text-muted-foreground">{badge.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

/**
 * COMPONENTE: XP Notification
 * Notificação flutuante de XP ganho
 */
export const XPNotification: React.FC<{
  xp: number;
  reason: string;
  position?: { x: number; y: number };
}> = ({ xp, reason, position = { x: 0, y: 0 } }) => {
  return (
    <motion.div
      className="fixed pointer-events-none"
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 0, y: -60 }}
      transition={{ duration: 2, ease: 'easeOut' }}
    >
      <div className="text-center">
        <p className="text-xl font-bold text-yellow-400">+{xp} XP</p>
        <p className="text-sm text-gray-300">{reason}</p>
      </div>
    </motion.div>
  );
};

/**
 * COMPONENTE: Level Up Celebration
 * Celebração épica ao fazer level up
 */
export const LevelUpCelebration: React.FC<{ newLevel: number; onComplete?: () => void }> = ({
  newLevel,
  onComplete,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background blur */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/30" />

      {/* Main celebration */}
      <div className="relative z-10 text-center">
        <motion.div
          className="text-8xl font-bold mb-4"
          animate={{ scale: [0.5, 1.2, 1], rotate: [0, 360, 0] }}
          transition={{ duration: 1 }}
        >
          🎉
        </motion.div>

        <motion.h1
          className="text-5xl font-bold text-yellow-400 mb-2"
          animate={{ y: [20, 0] }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          LEVEL UP!
        </motion.h1>

        <motion.p
          className="text-3xl font-bold text-white mb-4"
          animate={{ y: [20, 0] }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Você é agora Nível {newLevel}
        </motion.p>

        {/* Confetti particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="fixed w-2 h-2 rounded-full"
            style={{
              left: '50%',
              top: '50%',
              backgroundColor: ['#FFD700', '#FF69B4', '#00BFFF'][i % 3],
            }}
            animate={{
              x: Math.cos((i / 20) * Math.PI * 2) * 200,
              y: Math.sin((i / 20) * Math.PI * 2) * 200 - 100,
              opacity: [1, 0],
            }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />
        ))}
      </div>
    </motion.div>
  );
};
