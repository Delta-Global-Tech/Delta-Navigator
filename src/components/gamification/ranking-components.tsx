/**
 * COMPONENTE: Ranking Leaderboard
 * Tabela de ranking com posição do usuário e animações
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from '@/providers/gamification-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Zap } from 'lucide-react';

export const RankingLeaderboard: React.FC<{ limit?: number }> = ({ limit = 10 }) => {
  const { rankings, updateRankings, getUserRanking, userStats } = useGamification();
  const [sortedRankings, setSortedRankings] = useState(rankings.slice(0, limit));
  const userRanking = getUserRanking();

  useEffect(() => {
    updateRankings();
  }, [updateRankings]);

  useEffect(() => {
    setSortedRankings(rankings.slice(0, limit));
  }, [rankings, limit]);

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '⭐';
    }
  };

  const getMedalColor = (position: number) => {
    switch (position) {
      case 1:
        return 'from-yellow-500 to-yellow-600';
      case 2:
        return 'from-gray-400 to-gray-500';
      case 3:
        return 'from-orange-600 to-orange-700';
      default:
        return 'from-blue-500 to-blue-600';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Ranking Global
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <AnimatePresence>
            {sortedRankings.map((ranking, index) => (
              <motion.div
                key={`${ranking.userId}_${index}`}
                className={`
                  relative p-3 rounded-lg border-2 transition-all duration-300
                  ${
                    userRanking?.userId === ranking.userId
                      ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500'
                      : 'border-border hover:border-primary'
                  }
                `}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between">
                  {/* Posição */}
                  <motion.div
                    className={`
                      flex items-center justify-center w-12 h-12 rounded-full
                      bg-gradient-to-br ${getMedalColor(ranking.position)}
                      text-white font-bold text-lg
                    `}
                    animate={{
                      scale: index < 3 ? [1, 1.1, 1] : 1,
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {getMedalIcon(ranking.position)}
                  </motion.div>

                  {/* Informações do usuário */}
                  <div className="flex-1 ml-4">
                    <p className="font-semibold text-sm">
                      {ranking.username}
                      {userRanking?.userId === ranking.userId && (
                        <Badge variant="outline" className="ml-2">
                          Você
                        </Badge>
                      )}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Nível {ranking.level}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {ranking.badgeCount} Conquistas
                      </span>
                    </div>
                  </div>

                  {/* XP */}
                  <div className="text-right">
                    <motion.p
                      className="text-lg font-bold text-yellow-400"
                      key={ranking.totalXP}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.3 }}
                    >
                      {ranking.totalXP.toLocaleString()}
                    </motion.p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((ranking.totalXP / 5000) * 100, 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* User's ranking if not in top */}
          {userRanking && userRanking.position > limit && (
            <motion.div
              className="p-3 rounded-lg border-2 border-dashed border-purple-500 bg-purple-500/5 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Sua posição</p>
                  <p className="text-xs text-muted-foreground">
                    Você está em #{userRanking.position} 📍
                  </p>
                </div>
                <motion.div
                  className="text-2xl font-bold text-purple-400"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  #{userRanking.position}
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * COMPONENTE: Mini Ranking Card
 * Card compacto para exibir ranking em qualquer lugar
 */
export const MiniRankingCard: React.FC = () => {
  const { userStats, getUserRanking } = useGamification();
  const ranking = getUserRanking();

  if (!ranking || !userStats) return null;

  return (
    <motion.div
      className="p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className="text-3xl font-bold text-yellow-400"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            #{ranking.position}
          </motion.div>
          <div>
            <p className="text-sm font-semibold">No Ranking</p>
            <p className="text-xs text-muted-foreground">
              de {ranking.totalUsers || 1000} usuários
            </p>
          </div>
        </div>

        <motion.div
          className="text-right"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
        >
          <p className="text-2xl font-bold text-purple-400">{ranking.level}</p>
          <p className="text-xs text-muted-foreground">Nível</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

/**
 * COMPONENTE: Competitive Achievement
 * Badge mostrando conquista de posição
 */
export const CompetitiveAchievement: React.FC<{
  positionBefore: number;
  positionAfter: number;
}> = ({ positionBefore, positionAfter }) => {
  const isClimbingUp = positionAfter < positionBefore;
  const positionChange = Math.abs(positionBefore - positionAfter);

  if (positionChange === 0) return null;

  return (
    <motion.div
      className={`
        p-3 rounded-lg border-2 text-center
        ${
          isClimbingUp
            ? 'border-green-500 bg-green-500/10'
            : 'border-red-500 bg-red-500/10'
        }
      `}
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 1, repeat: 2 }}
    >
      <p className="text-lg font-bold">
        {isClimbingUp ? '📈 Subindo no Ranking!' : '📉 Posição mudou'}
      </p>
      <p className="text-sm text-muted-foreground">
        Você {isClimbingUp ? 'subiu' : 'desceu'} {positionChange} posições!
      </p>
    </motion.div>
  );
};
