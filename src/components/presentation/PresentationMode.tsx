/**
 * PRESENTATION MODE - EXECUTIVE PRESENTATION
 * Professional full-screen presentation with cinema-quality transitions
 * Controls: Arrow Keys, Space, ESC | Keyboard shortcuts for advanced navigation
 * 
 * Features:
 * - Multiple slide layouts (Title, Content, Metrics, Comparison, Split)
 * - Sophisticated animations and transitions
 * - Speaker notes and presenter mode
 * - Keyboard + mouse controls
 * - Professional color schemes and typography
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, SkipBack, SkipForward, Menu, Settings, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Enhanced Slide Types
export interface PresentationSlide {
  id: string;
  title: string;
  subtitle?: string;
  type: 'title' | 'content' | 'metrics' | 'chart' | 'comparison' | 'split';
  content?: React.ReactNode;
  backgroundColor?: string;
  accentColor?: string;
  icon?: string;
  notes?: string; // Speaker notes
  layout?: 'centered' | 'left-aligned' | 'full-width';
}

// Professional slides with enhanced design
const DEFAULT_SLIDES: PresentationSlide[] = [
  {
    id: '1',
    type: 'title',
    title: 'DELTA NAVIGATOR',
    subtitle: 'Plataforma Executiva de Enterprise Analytics',
    backgroundColor: 'from-slate-950 via-slate-900 to-slate-800',
    accentColor: 'from-blue-500 to-cyan-500',
    notes: 'Apresentação sobre a plataforma Delta Navigator - foco em inovação e resultados.',
    layout: 'centered',
  },
  {
    id: '2',
    type: 'content',
    title: 'Visão Abrangente do Sistema',
    content: (
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-12">
          <motion.div
            className="group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ x: 10 }}
          >
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 group-hover:shadow-xl transition-shadow">
                <span className="text-3xl">📋</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Gerenciamento de Contratos</h3>
                <p className="text-base text-white/75 leading-relaxed">Análise avançada de contratos com comparativas em tempo real e relatórios executivos detalhados</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="group"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ x: -10 }}
          >
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 group-hover:shadow-xl transition-shadow">
                <span className="text-3xl">🏛️</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Sistema de Licitações</h3>
                <p className="text-base text-white/75 leading-relaxed">Acompanhamento integrado de oportunidades públicas com alertas inteligentes e análise de viabilidade</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ x: 10 }}
          >
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 group-hover:shadow-xl transition-shadow">
                <span className="text-3xl">💰</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Gestão Financeira Integrada</h3>
                <p className="text-base text-white/75 leading-relaxed">Controle completo de desembolsos, faturas e fluxo de caixa com previsões de cash flow</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="group"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ x: -10 }}
          >
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 group-hover:shadow-xl transition-shadow">
                <span className="text-3xl">📊</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Business Intelligence</h3>
                <p className="text-base text-white/75 leading-relaxed">Painéis analíticos avançados com dados em tempo real para tomada de decisão estratégica</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    ),
    backgroundColor: 'from-slate-900 via-slate-850 to-slate-800',
    accentColor: 'from-blue-400 to-cyan-400',
    notes: 'Destaque: Todos os módulos trabalham de forma integrada. O sistema foi projetado para ser modular mas conectado.',
    layout: 'full-width',
  },
  {
    id: '3',
    type: 'content',
    title: 'Módulos de Gestão Integrados',
    content: (
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-8">
          <motion.div
            className="group"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ x: 5 }}
          >
            <div className="relative bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-2xl border border-blue-500/30 p-6 hover:border-blue-500/60 transition-all">
              <h3 className="text-2xl font-bold text-white mb-4">Dashboard Executivo</h3>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Visão consolidada de todos os KPIs
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Gráficos interativos em tempo real
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Alerts customizáveis por indicador
                </li>
              </ul>
            </div>
          </motion.div>

          <motion.div
            className="group"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            whileHover={{ x: -5 }}
          >
            <div className="relative bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-2xl border border-purple-500/30 p-6 hover:border-purple-500/60 transition-all">
              <h3 className="text-2xl font-bold text-white mb-4">Análise de Contratos</h3>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  1.2K contratos gerenciados
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Comparativas avançadas automáticas
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Análise de cláusulas críticas
                </li>
              </ul>
            </div>
          </motion.div>

          <motion.div
            className="group"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ x: 5 }}
          >
            <div className="relative bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl border border-emerald-500/30 p-6 hover:border-emerald-500/60 transition-all">
              <h3 className="text-2xl font-bold text-white mb-4">Sistema de Licitações</h3>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Monitoramento de oportunidades públicas
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Análise de viabilidade automática
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Histórico e estatísticas de participação
                </li>
              </ul>
            </div>
          </motion.div>

          <motion.div
            className="group"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            whileHover={{ x: -5 }}
          >
            <div className="relative bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-2xl border border-orange-500/30 p-6 hover:border-orange-500/60 transition-all">
              <h3 className="text-2xl font-bold text-white mb-4">Gestão Financeira</h3>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  Desembolsos e faturas centralizados
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  Fluxo de caixa com previsões
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  Auditoria e compliance integrados
                </li>
              </ul>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-white/10 rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-white/90 text-lg leading-relaxed">
            <span className="font-semibold text-white">Todos os módulos trabalham em sinergia:</span> Os dados fluem seamlessly entre sistemas, criando uma visão única e unificada do seu negócio. Decisões informadas em tempo real, baseadas em dados consolidados e confiáveis.
          </p>
        </motion.div>
      </div>
    ),
    backgroundColor: 'from-slate-900 via-slate-850 to-slate-800',
    accentColor: 'from-emerald-400 to-cyan-400',
    notes: 'Enfatizar a integração entre módulos e como isso elimina silos de informação.',
    layout: 'full-width',
  },
  {
    id: '4',
    type: 'content',
    title: 'Telas e Funcionalidades Principais',
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <motion.div
              className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4 hover:border-blue-500/60 transition-all cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              <h4 className="text-lg font-bold text-white mb-2">Comparativo de Contratos</h4>
              <p className="text-sm text-white/70">Análise lado-a-lado de múltiplos contratos com highlighting de diferenças críticas</p>
            </motion.div>

            <motion.div
              className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4 hover:border-purple-500/60 transition-all cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              <h4 className="text-lg font-bold text-white mb-2">Comparativo de Desembolsos</h4>
              <p className="text-sm text-white/70">Visualização detalhada de desembolsos com análise de tendências e desvios</p>
            </motion.div>

            <motion.div
              className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-xl p-4 hover:border-emerald-500/60 transition-all cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              <h4 className="text-lg font-bold text-white mb-2">Cadastral</h4>
              <p className="text-sm text-white/70">Gerenciamento centralizado de dados cadastrais com validação em tempo real</p>
            </motion.div>
          </motion.div>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-xl p-4 hover:border-orange-500/60 transition-all cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              <h4 className="text-lg font-bold text-white mb-2">Relatórios Executivos</h4>
              <p className="text-sm text-white/70">Geração automatizada de relatórios profissionais com exportação em múltiplos formatos</p>
            </motion.div>

            <motion.div
              className="bg-gradient-to-r from-rose-500/10 to-red-500/10 border border-rose-500/30 rounded-xl p-4 hover:border-rose-500/60 transition-all cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              <h4 className="text-lg font-bold text-white mb-2">Tomada de Decisão</h4>
              <p className="text-sm text-white/70">Painel de suporte a decisões com IA, recomendações e análise de cenários</p>
            </motion.div>

            <motion.div
              className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border border-indigo-500/30 rounded-xl p-4 hover:border-indigo-500/60 transition-all cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              <h4 className="text-lg font-bold text-white mb-2">Backoffice</h4>
              <p className="text-sm text-white/70">Área administrativa com controles de acesso, auditoria e configurações do sistema</p>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-white/10 rounded-2xl p-6 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-white/90 text-base leading-relaxed">
            <span className="font-semibold text-white">23 telas documentadas e otimizadas</span> para cada etapa do seu fluxo de trabalho. Cada tela foi desenhada com base em feedback dos usuários e best practices de UX enterprise.
          </p>
        </motion.div>
      </div>
    ),
    backgroundColor: 'from-slate-900 via-slate-850 to-slate-800',
    accentColor: 'from-cyan-400 to-blue-400',
    notes: 'Mencionar: 23 telas totalmente documentadas. Se tiver interesse, o Delta Assistant explica cada uma.',
    layout: 'full-width',
  },
  {
    id: '5',
    type: 'content',
    title: 'Engajamento através da Gamificação',
    content: (
      <div className="grid grid-cols-2 gap-12">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-xl">⭐</span>
            </div>
            <div>
              <h4 className="text-xl font-bold text-white mb-2">Sistema de Níveis</h4>
              <p className="text-white/75">Progressão clara com recompensas tangíveis</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-xl">🏆</span>
            </div>
            <div>
              <h4 className="text-xl font-bold text-white mb-2">Badges & Conquistas</h4>
              <p className="text-white/75">Reconhecimento por desempenho consistente</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-xl">📈</span>
            </div>
            <div>
              <h4 className="text-xl font-bold text-white mb-2">Competição Saudável</h4>
              <p className="text-white/75">Leaderboards inspiram melhoria contínua</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-xl">�</span>
            </div>
            <div>
              <h4 className="text-xl font-bold text-white mb-2">Resultados Comprovados</h4>
              <p className="text-white/75">+40% produtividade, +60% engajamento</p>
            </div>
          </div>
        </motion.div>
      </div>
    ),
    backgroundColor: 'from-slate-900 via-amber-900/30 to-slate-800',
    accentColor: 'from-amber-400 to-orange-400',
    notes: 'Demonstrar o dashboard de gamificação ao vivo se possível. Mostrar o ranking.',
    layout: 'full-width',
  },
  {
    id: '6',
    type: 'content',
    title: 'Engajamento através da Gamificação',
    content: (
      <div className="grid grid-cols-2 gap-12">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-xl">⭐</span>
            </div>
            <div>
              <h4 className="text-xl font-bold text-white mb-2">Sistema de Níveis</h4>
              <p className="text-white/75">Progressão clara com recompensas tangíveis</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-xl">🏆</span>
            </div>
            <div>
              <h4 className="text-xl font-bold text-white mb-2">Badges & Conquistas</h4>
              <p className="text-white/75">Reconhecimento por desempenho consistente</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-xl">📈</span>
            </div>
            <div>
              <h4 className="text-xl font-bold text-white mb-2">Competição Saudável</h4>
              <p className="text-white/75">Leaderboards inspiram melhoria contínua</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-xl">🚀</span>
            </div>
            <div>
              <h4 className="text-xl font-bold text-white mb-2">Resultados Comprovados</h4>
              <p className="text-white/75">+40% produtividade, +60% engajamento</p>
            </div>
          </div>
        </motion.div>
      </div>
    ),
    backgroundColor: 'from-slate-900 via-amber-900/30 to-slate-800',
    accentColor: 'from-amber-400 to-orange-400',
    notes: 'Demonstrar o dashboard de gamificação ao vivo se possível. Mostrar o ranking.',
    layout: 'full-width',
  },
  {
    id: '7',
    type: 'content',
    title: 'Delta Assistant - Inteligência Artificial',
    content: (
      <div className="flex gap-12 items-center">
        <motion.div
          className="flex-1"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="space-y-4">
            <p className="text-2xl text-white font-semibold mb-8">Assistente Virtual Disponível 24/7</p>
            <motion.div className="space-y-3">
              {[
                'Explica cada tela do sistema interativamente',
                '23 telas completamente documentadas',
                'Menu em cascata com contexto adaptado',
                'Sugestões baseadas em padrões de uso',
                'Integrado com XP e sistema de gamificação',
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-4 text-white/90 text-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 flex-shrink-0" />
                  <span>{item}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className="flex-1 relative h-72"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl blur-2xl" />
          <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 p-6 h-full flex flex-col justify-between">
            <div className="text-sm text-white/60 font-mono">{'> System Online'}</div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-white/80 text-sm">Delta Assistant Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-white/80 text-sm">Knowledge Base: 23 screens</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-white/80 text-sm">Learning: Active</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    ),
    backgroundColor: 'from-slate-900 via-cyan-900/20 to-slate-800',
    accentColor: 'from-cyan-400 to-blue-400',
    notes: 'Mencionar: O Delta Assistant está sempre disponível e aprendendo com as interações.',
    layout: 'full-width',
  },
  {
    id: '8',
    type: 'title',
    title: 'TRANSFORMANDO DADOS EM DECISÕES',
    subtitle: 'Delta Navigator - Seu Parceiro Estratégico em Enterprise Analytics',
    backgroundColor: 'from-emerald-950 via-slate-900 to-slate-950',
    accentColor: 'from-emerald-400 to-cyan-400',
    notes: 'Slide final - Deixar a marca! Tempo para perguntas.',
    layout: 'centered',
  },
];

interface PresentationModeProps {
  slides?: PresentationSlide[];
  onClose?: () => void;
  presenterMode?: boolean;
}

// Animation presets for cinematic transitions
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
  }),
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export const PresentationMode: React.FC<PresentationModeProps> = ({
  slides = DEFAULT_SLIDES,
  onClose,
  presenterMode = false,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showNotes, setShowNotes] = useState(presenterMode);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Navigation helpers
  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
    setShowMenu(false);
  }, [currentSlide]);

  // Keyboard controls with enhanced shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'p':
            e.preventDefault();
            setShowNotes(!showNotes);
            return;
          case 'o':
            e.preventDefault();
            setShowMenu(!showMenu);
            return;
          default:
            break;
        }
      }

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevSlide();
          break;
        case 'Escape':
          e.preventDefault();
          onClose?.();
          break;
        case 'Home':
          e.preventDefault();
          goToSlide(0);
          break;
        case 'End':
          e.preventDefault();
          goToSlide(slides.length - 1);
          break;
        case 'm':
          e.preventDefault();
          setShowMenu(!showMenu);
          break;
        case 'n':
          e.preventDefault();
          setShowNotes(!showNotes);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextSlide, prevSlide, onClose, slides.length, showNotes, showMenu, goToSlide]);

  const slide = slides[currentSlide];
  const bgGradient = slide.backgroundColor || 'from-slate-900 to-slate-800';
  const accentGradient = slide.accentColor || 'from-blue-500 to-cyan-500';

  return (
    <div className="fixed inset-0 bg-black z-[9999] overflow-hidden flex flex-col" ref={containerRef}>
      {/* Main Presentation Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={`bg-${currentSlide}`}
              className={`absolute inset-0 bg-gradient-to-br ${bgGradient}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            />
          </AnimatePresence>
          
          {/* Subtle animated orbs for visual interest */}
          <motion.div
            className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${accentGradient}`}
            animate={{
              y: [0, 30, 0],
              x: [0, 20, 0],
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-15 bg-gradient-to-tr ${accentGradient}`}
            animate={{
              y: [0, -30, 0],
              x: [0, -20, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          />
        </div>

        {/* Main Slide Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.5 },
            }}
            className="relative z-10 w-full h-full flex flex-col items-center justify-center p-12 md:p-16"
          >
            {/* Title Slide Layout */}
            {slide.type === 'title' ? (
              <motion.div
                className="text-center space-y-8 max-w-4xl"
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.7 }}
              >
                <motion.h1
                  className="text-7xl md:text-8xl font-black text-white tracking-tight"
                  style={{
                    textShadow: '0 20px 40px rgba(0,0,0,0.5)',
                  }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.8, type: 'spring' }}
                >
                  {slide.title}
                </motion.h1>
                {slide.subtitle && (
                  <motion.p
                    className="text-2xl md:text-3xl text-white/80 font-light tracking-wide"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.7 }}
                  >
                    {slide.subtitle}
                  </motion.p>
                )}
                {/* Accent line */}
                <motion.div
                  className={`h-1 w-24 bg-gradient-to-r ${accentGradient} mx-auto`}
                  initial={{ width: 0 }}
                  animate={{ width: 96 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                />
              </motion.div>
            ) : (
              /* Content Slide Layout */
              <motion.div
                className="w-full max-w-7xl"
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.7 }}
              >
                <motion.h2
                  className="text-5xl md:text-6xl font-bold text-white mb-8 md:mb-12"
                  style={{
                    textShadow: '0 10px 30px rgba(0,0,0,0.4)',
                  }}
                  initial={{ x: -40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  {slide.title}
                </motion.h2>
                <motion.div
                  className="text-lg md:text-xl text-white/90 leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  {slide.content}
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Slide Counter - Bottom Left */}
        <motion.div
          className="absolute bottom-8 left-8 text-white/60 text-sm font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <span className="font-semibold">{String(currentSlide + 1).padStart(2, '0')}</span>
          <span className="text-white/40"> / {String(slides.length).padStart(2, '0')}</span>
        </motion.div>

        {/* Progress Bar - Bottom */}
        <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full z-20">
          <motion.div
            className={`h-full bg-gradient-to-r ${accentGradient} shadow-lg`}
            initial={{ width: '0%' }}
            animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
          />
        </div>
      </div>

      {/* Presenter Mode Footer */}
      {presenterMode && (
        <motion.div
          className="bg-black/80 backdrop-blur-md border-t border-white/10 p-4"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {slide.notes && (
            <p className="text-sm text-white/70 max-h-20 overflow-y-auto">
              <span className="text-white/50 font-mono">Notes: </span>
              {slide.notes}
            </p>
          )}
        </motion.div>
      )}

      {/* Top Controls Bar */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/60 to-transparent p-6 flex justify-between items-center"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {/* Left: Presentation Info */}
        <div className="text-white/60 text-sm font-mono">
          <span>Delta Navigator</span>
          <span className="text-white/40"> • Presentation Mode</span>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-3">
          {presenterMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotes(!showNotes)}
              className="text-white hover:bg-white/10 gap-2"
              title="Alternar notas (N)"
            >
              {showNotes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="text-xs">Notas</span>
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMenu(!showMenu)}
            className="text-white hover:bg-white/10 gap-2"
            title="Menu de slides (M)"
          >
            <Menu className="h-4 w-4" />
            <span className="text-xs">Menu</span>
          </Button>

          <div className="w-px h-6 bg-white/20" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/10 gap-2"
            title="Sair (ESC)"
          >
            <X className="h-4 w-4" />
            <span className="text-xs">Sair</span>
          </Button>
        </div>
      </motion.div>

      {/* Bottom Controls */}
      <motion.div
        className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 z-40"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => goToSlide(0)}
          className="text-white/70 hover:text-white hover:bg-white/10 transition-all"
          title="Primeiro slide (Home)"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={prevSlide}
          className="text-white/70 hover:text-white hover:bg-white/10 transition-all"
          title="Anterior (←)"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
          <span className="text-white/80 text-sm font-mono font-semibold">
            {currentSlide + 1} <span className="text-white/40">/ {slides.length}</span>
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={nextSlide}
          className="text-white/70 hover:text-white hover:bg-white/10 transition-all"
          title="Próximo (→)"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => goToSlide(slides.length - 1)}
          className="text-white/70 hover:text-white hover:bg-white/10 transition-all"
          title="Último slide (End)"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Slide Menu Panel */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
            />

            {/* Menu */}
            <motion.div
              className="absolute top-24 right-8 w-96 bg-slate-950/95 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl z-40"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="p-6 border-b border-white/5">
                <h3 className="text-white font-bold text-lg">Slides</h3>
                <p className="text-white/50 text-sm mt-1">Navegação rápida</p>
              </div>

              <div className="max-h-96 overflow-y-auto p-2 space-y-1">
                {slides.map((s, i) => (
                  <motion.button
                    key={s.id}
                    onClick={() => goToSlide(i)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all text-sm ${
                      currentSlide === i
                        ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-white border border-blue-500/50 font-semibold'
                        : 'text-white/70 hover:bg-white/5 hover:text-white/90'
                    }`}
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs opacity-60 min-w-6">{String(i + 1).padStart(2, '0')}</span>
                      <span className="truncate">{s.title}</span>
                      {currentSlide === i && <div className="ml-auto w-2 h-2 rounded-full bg-blue-400" />}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Help - Bottom Right */}
      <motion.div
        className="absolute bottom-6 right-6 text-white/50 text-xs font-mono hidden lg:block z-30 bg-black/40 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="space-y-1">
          <p><span className="text-blue-400">→</span> Próximo | <span className="text-blue-400">←</span> Anterior</p>
          <p><span className="text-blue-400">M</span> Menu | <span className="text-blue-400">N</span> Notas</p>
          <p><span className="text-blue-400">ESC</span> Sair</p>
        </div>
      </motion.div>
    </div>
  );
};

export default PresentationMode;