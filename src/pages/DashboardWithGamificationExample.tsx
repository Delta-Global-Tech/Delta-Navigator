/**
 * EXEMPLO PRÁTICO: Dashboard com Gamificação Integrada
 * Este é um exemplo de como usar TODOS os componentes juntos
 * Copie e adapte para suas páginas!
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Zap, Target } from 'lucide-react';

// Importações de gamificação
import {
  usePageXP,
  useActionXP,
  useUserGamificationStats,
  XPBar,
  LevelCard,
  BadgeGrid,
  RankingLeaderboard,
  AISuggestionsPanel,
  usePresentationMode,
  PresentationMode,
} from '@/components/gamification';

import { StaggeredContainer } from "@/components/motion/StaggeredContainer"
export default function DashboardWithGamification() {
  // ==================== GAMIFICAÇÃO ====================

  // Adiciona XP automático ao visitar
  usePageXP('page_visit');

  // Stats do usuário
  const stats = useUserGamificationStats();

  // Hook para ganhar XP em ações
  const gainXPAnalyzing = useActionXP('Analisou o dashboard', 15);
  const gainXPExporting = useActionXP('Exportou relatório', 50);

  // Presentation Mode
  const { isActive, setIsActive, slides } = usePresentationMode();

  // Handle actions
  const handleAnalyzeData = () => {
    // Sua lógica de análise aqui...
    gainXPAnalyzing();
  };

  const handleExportReport = () => {
    // Sua lógica de exportação aqui...
    gainXPExporting();
  };

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      {/* ========== HEADER COM GAMIFICAÇÃO ========== */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Dashboard Executivo</h1>
            <p className="text-muted-foreground">
              Bem-vindo de volta! 👋 Seu progresso está evoluindo
            </p>
          </div>
          <motion.button
            onClick={() => setIsActive(true)}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🎬 Modo Apresentação
          </motion.button>
        </div>

        {/* XP Bar no topo */}
        <div className="bg-card border border-border rounded-lg p-4">
          <XPBar />
        </div>
      </div>

      {/* ========== GRID PRINCIPAL ========== */}
      <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ===== COLUNA 1: LEVEL & BADGES ===== */}
        <div className="lg:col-span-1 space-y-6">
          {/* Level Card */}
          <LevelCard animated={true} />

          {/* Stats resumidas */}
          <div className="space-y-3">
            <motion.div
              className="p-4 rounded-lg border border-border bg-card"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-xs text-muted-foreground">No Ranking</p>
                  <p className="text-lg font-bold">#{stats.ranking?.position || 'N/A'}</p>
                </StaggeredContainer>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-lg border border-border bg-card"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Total XP</p>
                  <p className="text-lg font-bold">{stats.totalXP.toLocaleString()}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-lg border border-border bg-card"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Conquistas</p>
                  <p className="text-lg font-bold">{stats.badgeCount}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ===== COLUNA 2-3: CONTEÚDO PRINCIPAL ===== */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sugestões IA */}
          <div>
            <h2 className="text-xl font-bold mb-4">Recomendações Inteligentes</h2>
            <AISuggestionsPanel />
          </div>

          {/* Cards de ação com XP */}
          <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="hover:border-purple-500 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  📊 Analisar Dados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Explore dados detalhados e ganhe insights valiosos
                </p>
                <Button
                  onClick={handleAnalyzeData}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Analisar Agora (+15 XP)
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-green-500 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  📄 Exportar Relatório
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Gere relatórios profissionais em PDF ou Excel
                </p>
                <Button
                  onClick={handleExportReport}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Exportar (+50 XP)
                </Button>
              </CardContent>
            </Card>
          </StaggeredContainer>

          {/* Badges showcase */}
          <div>
            <h2 className="text-xl font-bold mb-4">Suas Conquistas</h2>
            <Card>
              <CardContent className="pt-6">
                <BadgeGrid maxDisplay={8} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ===== COLUNA 4: RANKING ===== */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold mb-4">Top 5 Ranking</h2>
          <RankingLeaderboard limit={5} />
        </div>
      </div>

      {/* ========== MÉTRICAS ADICIONAIS ========== */}
      <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Streak Diário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-500 mb-2">
              {stats.streakDays}
            </StaggeredContainer>
            <p className="text-xs text-muted-foreground">dias consecutivos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Progressão do Nível</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-500 mb-2">
              {stats.level}
            </div>
            <p className="text-xs text-muted-foreground">{stats.levelTitle}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Próxima Meta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-500 mb-2">
              {Math.ceil((stats.level + 1) * 100 - stats.totalXP)}
            </div>
            <p className="text-xs text-muted-foreground">XP para próximo nível</p>
          </CardContent>
        </Card>
      </div>

      {/* ========== PRESENTATION MODE ========== */}
      {isActive && (
        <PresentationMode slides={slides} onClose={() => setIsActive(false)} />
      )}
    </div>
  );
}

/**
 * DICAS PARA USAR ESTE EXEMPLO:
 *
 * 1. Copie este arquivo e adapte para suas páginas
 * 2. Use usePageXP() em cada página para adicionar XP automático
 * 3. Use useActionXP() para ações específicas que dão XP
 * 4. Customize os valores de XP em src/types/gamification.ts
 * 5. Adicione mais badges conforme suas necessidades
 * 6. Integre com APIs reais para persistir dados
 *
 * RESULTADO FINAL:
 * - Usuários ganham XP ao usar o sistema
 * - Desbloqueiam badges e achievements
 * - Competem no ranking global
 * - Usam o assistente Delta para ajuda
 * - Podem fazer apresentações em modo CEO
 *
 * TUDO FUNCIONANDO SEM QUEBRAR NADA! ✅
 */
