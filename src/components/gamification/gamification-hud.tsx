/**
 * COMPONENTE: Gamification HUD
 * Widget flutuante que mostra XP, Level, Badges em tempo real
 * Funciona em TODAS as telas sem quebrar nada!
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from '@/providers/gamification-provider';
import { useUserGamificationStats } from '@/hooks/use-gamification';
import { XPBar, LevelCard, BadgeGrid } from './xp-components';
import { MiniRankingCard } from './ranking-components';
import { ChevronUp, X, Sparkles } from 'lucide-react';

/**
 * COMPONENTE: Mini HUD
 * Versão compacta para exibir em canto da tela
 */
export const GamificationMiniHUD: React.FC<{ position?: 'bottom-right' | 'bottom-left' }> = ({
  position = 'bottom-right',
}) => {
  const { userStats } = useGamification();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!userStats) return null;

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed ${positionClasses[position]} z-50 pointer-events-auto`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        {/* Expandable Panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="absolute bottom-16 left-0 w-80 bg-background/95 border border-border rounded-lg shadow-2xl p-4 backdrop-blur-sm pointer-events-auto"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-4">
                {/* XP Bar */}
                <XPBar />

                {/* Badges Preview */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Últimas Conquistas</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {userStats.badges.slice(-8).map((badge) => (
                      <motion.div
                        key={badge.id}
                        className="text-2xl flex items-center justify-center"
                        whileHover={{ scale: 1.2, rotate: 10 }}
                      >
                        {badge.icon}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão Principal */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            w-14 h-14 rounded-full flex items-center justify-center
            bg-gradient-to-br from-purple-500 to-pink-500
            text-white font-bold shadow-lg hover:shadow-xl
            transition-all duration-300 relative pointer-events-auto
          `}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isExpanded ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
          </motion.div>

          {/* Badge count */}
          {userStats.badges.length > 0 && (
            <motion.div
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-400 text-black text-xs font-bold flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {userStats.badges.length}
            </motion.div>
          )}

          {/* Level indicator */}
          <motion.div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-yellow-400 text-black rounded-full text-xs font-bold"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Lv {userStats.level.level}
          </motion.div>
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * COMPONENTE: Full Gamification Panel
 * Painel completo com todas as informações
 */
export const GamificationFullPanel: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { userStats } = useGamification();
  const stats = useUserGamificationStats();

  if (!userStats) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-2xl max-h-[80vh] bg-background border border-border rounded-lg shadow-2xl overflow-y-auto"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            Meu Progresso
          </h1>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Level Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LevelCard animated={false} />
            <div className="md:col-span-2">
              <XPBar />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total XP', value: stats.totalXP, icon: '⭐' },
              { label: 'Nível', value: stats.level, icon: '📊' },
              { label: 'Conquistas', value: stats.badgeCount, icon: '🏆' },
              { label: 'Streak', value: `${stats.streakDays}d`, icon: '🔥' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="p-4 rounded-lg border border-border text-center"
                whileHover={{ scale: 1.05, borderColor: '#8b5cf6' }}
              >
                <p className="text-2xl mb-1">{stat.icon}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Badges Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Suas Conquistas ({stats.badgeCount})</h2>
            <BadgeGrid maxDisplay={12} />
          </div>

          {/* Ranking Section */}
          {stats.ranking && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Ranking</h2>
              <MiniRankingCard />
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * COMPONENTE: Notifications Hub
 * Central de notificações de gamificação
 */
export const GamificationNotificationsHub: React.FC = () => {
  const { notifications } = useGamification();

  return (
    <div className="fixed top-20 left-4 z-30 space-y-2 pointer-events-auto max-w-sm">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            className={`
              p-3 rounded-lg border border-border
              bg-background/95 backdrop-blur-sm
              shadow-lg w-full
              ${notif.color || 'bg-blue-500/10'}
            `}
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{notif.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-sm">{notif.title}</p>
                {notif.message && (
                  <p className="text-xs text-muted-foreground">{notif.message}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
