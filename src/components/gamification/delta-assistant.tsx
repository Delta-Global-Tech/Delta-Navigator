/**
 * DELTA ASSISTANT - Chatbot Virtual Inteligente
 * Funcionaliades:
 * - Análise de dados em contexto
 * - Sugestões automáticas
 * - Interface conversacional épica
 * - Integração com métricas do sistema
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Lightbulb,
  TrendingUp,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { ChatMessage, AssistantContext } from '@/types/gamification';
import { useGamification } from '@/providers/gamification-provider';

interface DeltaAssistantProps {
  context?: AssistantContext;
  onClose?: () => void;
}

// 📚 Base de conhecimento sobre as telas do sistema
const SCREEN_KNOWLEDGE = {
  dashboard: {
    name: '📊 Dashboard Principal',
    description: 'Tela inicial do sistema com visão geral de métricas',
    features: [
      '📊 Visualização de KPIs principais',
      '📈 Gráficos de desempenho em tempo real',
      '🎯 Indicadores de progresso',
      '⚡ Atalhos para principais funcionalidades',
    ],
    howToUse: 'Acesse o dashboard para ter uma visão rápida do seu desempenho. Use os gráficos para identificar tendências e as métricas principais para acompanhar metas.',
    tips: [
      '💡 Clique nos gráficos para detalhes',
      '💡 Use filtros para personalizar dados',
      '💡 Exporte relatórios para análise offline',
    ],
  },
  contratos: {
    name: '📋 Posição de Contratos',
    description: 'Visualização completa da posição e status de todos os contratos',
    features: [
      '📋 Lista de todos os contratos ativos',
      '🔍 Filtros avançados por status e data',
      '⚖️ Comparação de valores e prazos',
      '📊 Análise de desempenho por contrato',
    ],
    howToUse: 'Navegue pela lista de contratos, use os filtros para encontrar o que procura, e utilize a funcionalidade de comparação para analisar múltiplos contratos lado a lado.',
    tips: [
      '💡 Use filtros por status, data ou valor',
      '💡 Compare até 5 contratos simultaneamente',
      '💡 Exporte dados para Excel',
    ],
  },
  licitacoes: {
    name: '🏛️ Licitações',
    description: 'Acompanhamento e análise de licitações públicas',
    features: [
      '🏛️ Consulta de licitações vigentes',
      '📢 Notificações de novas oportunidades',
      '📝 Detalhes completos de editais',
      '🎯 Rastreamento de participações',
    ],
    howToUse: 'Consulte licitações vigentes, receba notificações para oportunidades relevantes, e acompanhe o status de suas participações em tempo real.',
    tips: [
      '💡 Configure alertas para licitações de seu interesse',
      '💡 Baixe editais para análise offline',
      '💡 Compare dados de diferentes licitações',
    ],
  },
  propostas: {
    name: '📨 Propostas',
    description: 'Gerenciamento e análise de propostas comerciais',
    features: [
      '📨 Lista de propostas enviadas e recebidas',
      '🔄 Status em tempo real de negociações',
      '💰 Valores e prazos',
      '📊 Histórico completo',
    ],
    howToUse: 'Visualize todas as propostas em negociação, acompanhe o status de cada uma e negocie com base em dados históricos.',
    tips: [
      '💡 Filtre propostas por status',
      '💡 Veja histórico de negociações',
      '💡 Exporte para acompanhamento',
    ],
  },
  desembolso: {
    name: '💰 Desembolsos',
    description: 'Análise detalhada de desembolsos e fluxo de caixa',
    features: [
      '💰 Visualização de desembolsos por período',
      '📈 Gráficos de fluxo de caixa',
      '🔍 Filtros por contrato e data',
      '📊 Previsões de caixa',
    ],
    howToUse: 'Acompanhe os desembolsos realizados, identifique padrões de gastos e faça previsões de fluxo de caixa futuro.',
    tips: [
      '💡 Use gráficos para visualizar tendências',
      '💡 Exporte dados para planejamento financeiro',
      '💡 Configure alertas de limite',
    ],
  },
  faturas: {
    name: '📄 Faturas',
    description: 'Gerenciamento de emissão, recebimento e análise de faturas',
    features: [
      '📄 Registro de todas as faturas',
      '✅ Status de pagamento',
      '📊 Análise de vencimentos',
      '🔔 Alertas de atraso',
    ],
    howToUse: 'Mantenha registro de faturas, acompanhe pagamentos e receba alertas de vencimentos próximos.',
    tips: [
      '💡 Categorize faturas por tipo',
      '💡 Receba lembretes de vencimento',
      '💡 Exporte para auditoria',
    ],
  },
  gamificacao: {
    name: '🎮 Gamificação',
    description: 'Acompanhamento de XP, níveis e conquistas',
    features: [
      '⭐ Acúmulo de pontos XP',
      '🎖️ Sistema de níveis progressivos',
      '🏆 Badges e conquistas desbloqueáveis',
      '🏅 Ranking de usuários',
    ],
    howToUse: 'Complete ações no sistema para ganhar XP. Suba de nível, desbloqueie badges especiais e compita com outros usuários no ranking.',
    tips: [
      '💡 XP é acumulativo e nunca expira',
      '💡 Badges especiais têm requisitos únicos',
      '💡 Ranking é atualizado diariamente',
    ],
  },
  relatorios: {
    name: '📄 Gerador de Relatórios',
    description: 'Ferramenta para criar relatórios personalizados',
    features: [
      '📄 Templates pré-configurados',
      '🎨 Personalização total de dados',
      '📊 Múltiplos formatos de exportação',
      '⏰ Agendamento de relatórios automáticos',
    ],
    howToUse: 'Escolha um template, personalize os dados conforme sua necessidade, e exporte em PDF, Excel ou outros formatos.',
    tips: [
      '💡 Use templates para ganhar tempo',
      '💡 Agende relatórios automáticos',
      '💡 Compartilhe via email',
    ],
  },
  tomada_decisao: {
    name: '🧠 Tomada de Decisão',
    description: 'Insights e análises para auxílio em decisões estratégicas',
    features: [
      '🧠 Análises automáticas de dados',
      '📉 Previsões de tendências futuras',
      '⚖️ Comparativas de cenários',
      '💰 Análise de viabilidade',
    ],
    howToUse: 'Utilize as análises automáticas para embasar suas decisões. Compare cenários diferentes e veja recomendações do sistema.',
    tips: [
      '💡 Considere múltiplas análises',
      '💡 Use previsões para planejamento',
      '💡 Documente suas decisões',
    ],
  },
  comparativo_contratos: {
    name: '⚖️ Comparativo de Contratos',
    description: 'Ferramenta avançada para comparar múltiplos contratos lado a lado',
    features: [
      '⚖️ Compare até 5 contratos',
      '📊 Análise de diferenciais',
      '💰 Comparação de valores e termos',
      '🔍 Identificação de oportunidades',
    ],
    howToUse: 'Selecione os contratos que deseja comparar e visualize as diferenças principais em uma tabela interativa.',
    tips: [
      '💡 Use para negociações melhores',
      '💡 Identifique contratos mais vantajosos',
      '💡 Exporte comparativas',
    ],
  },
  comparativo_desembolso: {
    name: '💰 Comparativo de Desembolsos',
    description: 'Análise comparativa de desembolsos entre períodos ou contratos',
    features: [
      '📊 Visualização de desembolsos lado a lado',
      '📈 Gráficos comparativos',
      '🔍 Análise de variações',
      '💡 Insights de padrões',
    ],
    howToUse: 'Compare desembolsos de diferentes períodos ou contratos para identificar padrões e variações importantes.',
    tips: [
      '💡 Identifique anomalias',
      '💡 Use para planejamento financeiro',
      '💡 Exporte análises',
    ],
  },
  cadastral: {
    name: '📝 Cadastral',
    description: 'Gerenciamento centralizado de dados cadastrais e perfis',
    features: [
      '� Registro completo de dados',
      '👥 Gestão de perfis e permissões',
      '🔐 Segurança de dados',
      '🔄 Sincronização automática',
    ],
    howToUse: 'Mantenha seus dados cadastrais atualizados, gerencie perfis de acesso e garanta a integridade das informações.',
    tips: [
      '�💡 Mantenha dados sempre atualizados',
      '💡 Configure permissões corretamente',
      '💡 Realize backups regulares',
    ],
  },
  funil: {
    name: '🔻 Funil de Vendas',
    description: 'Visualização e acompanhamento do funil de vendas',
    features: [
      '🔻 Estágios do funil',
      '📊 Taxa de conversão',
      '💰 Valor em cada estágio',
      '🎯 Previsão de receita',
    ],
    howToUse: 'Acompanhe oportunidades através dos estágios do funil, identifique gargalos e otimize seu processo de vendas.',
    tips: [
      '💡 Priorize oportunidades por valor',
      '💡 Identifique estágios problemáticos',
      '💡 Faça previsões de receita',
    ],
  },
  producao: {
    name: '🏭 Produção',
    description: 'Acompanhamento de produção e análise de desempenho',
    features: [
      '🏭 Métricas de produção',
      '📊 Análise de eficiência',
      '⏱️ Tempos de ciclo',
      '📈 Metas e progressos',
    ],
    howToUse: 'Monitore a produção em tempo real, identifique gargalos e otimize processos.',
    tips: [
      '💡 Estabeleça metas realistas',
      '💡 Acompanhe eficiência',
      '💡 Corrija desvios rapidamente',
    ],
  },
  extrato_ranking: {
    name: '🏆 Extrato de Ranking',
    description: 'Visualização de rankings e posições competitivas',
    features: [
      '🏆 Seu ranking atual',
      '📊 Posição entre concorrentes',
      '📈 Histórico de progressão',
      '🎯 Próximas metas',
    ],
    howToUse: 'Acompanhe sua posição no ranking geral e nos rankings específicos de seu segmento.',
    tips: [
      '💡 Compete de forma saudável',
      '💡 Use como motivação',
      '💡 Analise estratégias top',
    ],
  },
  statement: {
    name: '📋 Statement',
    description: 'Extrato detalhado de transações e movimentações',
    features: [
      '📋 Histórico de transações',
      '💰 Movimentações financeiras',
      '🔍 Filtros avançados',
      '📊 Resumos periódicos',
    ],
    howToUse: 'Consulte seu statement para acompanhar todas as movimentações e transações realizadas.',
    tips: [
      '💡 Revise regularmente',
      '💡 Identifique padrões',
      '💡 Exporte para auditoria',
    ],
  },
  backoffice: {
    name: '⚙️ Backoffice Delta',
    description: 'Painel administrativo para gerenciar o sistema',
    features: [
      '⚙️ Configurações do sistema',
      '👥 Gerenciamento de usuários',
      '🔐 Controle de permissões',
      '📊 Relatórios administrativos',
    ],
    howToUse: 'Acesse como administrador para configurar o sistema, gerenciar usuários e visualizar relatórios de auditoria.',
    tips: [
      '💡 Configure permissões corretamente',
      '💡 Revise logs de atividade',
      '💡 Faça backups regularmente',
    ],
  },
  comparativo_posicao_completo: {
    name: '⚖️ Comparativo Posição Completa',
    description: 'Análise completa e detalhada de posição de contratos',
    features: [
      '📊 Visualização lado a lado completa',
      '🔍 Análise de desvios detalhada',
      '💰 Comparação de investimentos',
      '📈 Histórico de mudanças',
    ],
    howToUse: 'Compare a posição completa de contratos com análise profunda de variações e identificação de oportunidades.',
    tips: [
      '💡 Use para análise estratégica',
      '💡 Identifique tendências',
      '💡 Exporte dados detalhados',
    ],
  },
  propostas_abertura: {
    name: '📢 Propostas em Abertura',
    description: 'Gerenciamento de propostas em fase de abertura e negociação inicial',
    features: [
      '📢 Lista de propostas recentes',
      '🔄 Status de negociação',
      '⏰ Prazos e deadlines',
      '💼 Detalhes de oportunidades',
    ],
    howToUse: 'Acompanhe propostas em fase inicial, gerencie prazos e negocie termos antes da formalização.',
    tips: [
      '💡 Priorize por valor',
      '💡 Configure alertas de prazo',
      '💡 Documente negociações',
    ],
  },
  producao_compra: {
    name: '🛒 Produção - Compras',
    description: 'Gestão de compras e procurement associados à produção',
    features: [
      '🛒 Pedidos de compra',
      '📦 Rastreamento de entregas',
      '💰 Análise de preços',
      '📊 Histórico de fornecedores',
    ],
    howToUse: 'Gerencie pedidos de compra, acompanhe entregas e analise performance de fornecedores.',
    tips: [
      '💡 Compare preços de fornecedores',
      '💡 Agende entregas',
      '💡 Negocie melhores termos',
    ],
  },
  producao_novo: {
    name: '📝 Produção - Novo Contrato',
    description: 'Criação e setup de novos contratos de produção',
    features: [
      '📝 Formulário de criação',
      '⚙️ Configuração de parâmetros',
      '✅ Validações automáticas',
      '📊 Projeções iniciais',
    ],
    howToUse: 'Crie novos contratos de produção preenchendo os dados necessários e validando antes da ativação.',
    tips: [
      '💡 Preencha todos os campos obrigatórios',
      '💡 Revise antes de confirmar',
      '💡 Guarde referência do contrato',
    ],
  },
  producao_compra_novo: {
    name: '🛒 Produção - Nova Compra',
    description: 'Interface para criar novos pedidos de compra para produção',
    features: [
      '🛒 Pedidos de compra novo',
      '📦 Seleção de fornecedores',
      '💰 Orçamentação',
      '📋 Especificações técnicas',
    ],
    howToUse: 'Crie novos pedidos de compra selecionando fornecedores e definindo quantidades e especificações.',
    tips: [
      '💡 Solicite múltiplos orçamentos',
      '💡 Compare termos',
      '💡 Aprove antes de enviar',
    ],
  },
  network_test: {
    name: '🌐 Teste de Rede',
    description: 'Ferramentas de diagnóstico e teste de conectividade',
    features: [
      '🌐 Teste de latência',
      '📊 Status dos servidores',
      '🔍 Diagnóstico de conexão',
      '📈 Histórico de uptime',
    ],
    howToUse: 'Use as ferramentas de teste para diagnosticar problemas de conectividade e verificar saúde dos servidores.',
    tips: [
      '💡 Teste em horários críticos',
      '💡 Analise histórico de falhas',
      '💡 Documente problemas encontrados',
    ],
  },
};

export const DeltaAssistant: React.FC<DeltaAssistantProps> = ({ context, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [assistantContext, setAssistantContext] = useState<'menu' | 'screens-list' | 'screen-detail'>('menu');
  const [selectedScreen, setSelectedScreen] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Olá! 👋 Eu sou Delta, seu assistente inteligente. Como posso ajudá-lo hoje?',
      timestamp: new Date(),
      suggestions: [
        'Qual é meu progresso?',
        'Explicação de Telas',
        'Como ganhar mais XP?',
        'Me mostre insights',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastXPTime, setLastXPTime] = useState<number>(0);
  const [xpMessageCount, setXpMessageCount] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { userStats, addXP } = useGamification();

  // 🎯 Configurações MUITO RESTRITIVAS de XP para Delta Assistant
  const XP_COOLDOWN_MS = 120000; // 2 minutos (120 segundos)
  const XP_MAX_PER_SESSION = 1; // Máximo 1 mensagem com XP por sessão (só a primeira)
  const XP_AMOUNT = 10; // 10 XP apenas uma vez por sessão

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAIResponse = async (userMessage: string): Promise<{ message: string; context: 'menu' | 'screens-list' | 'screen-detail'; selectedScreen?: string }> => {
    const lowerMessage = userMessage.toLowerCase();

    // 1️⃣ MENU PRINCIPAL
    if (assistantContext === 'menu') {
      if (lowerMessage.includes('explicação de telas') || lowerMessage.includes('explique')) {
        return {
          message: `📚 Perfeito! Aqui estão as telas do sistema:\n\nEscolha uma para saber mais sobre como funciona:`,
          context: 'screens-list',
        };
      }

      if (
        lowerMessage.includes('progresso') ||
        lowerMessage.includes('xp') ||
        lowerMessage.includes('level')
      ) {
        return {
          message: `🎯 Seu Progresso Atual:\n- Nível: ${userStats?.level.level || 1}\n- XP: ${userStats?.level.totalXP || 0}\n- Conquistas: ${userStats?.badges.length || 0}\n\nContinue explorando o sistema para ganhar mais XP!`,
          context: 'menu',
        };
      }

      if (
        lowerMessage.includes('dados') ||
        lowerMessage.includes('análise') ||
        lowerMessage.includes('insight')
      ) {
        return {
          message: `📊 Recomendações de Análise:\n1. Verifique o comparativo de contratos\n2. Analise o ranking de propostas\n3. Explore os dados de desempenho\n4. Crie um relatório personalizado\n\nTenho certeza de que você encontrará insights valiosos!`,
          context: 'menu',
        };
      }

      if (lowerMessage.includes('ganhar xp') || lowerMessage.includes('como ganhar')) {
        return {
          message: `⚡ Formas de Ganhar XP:\n✓ Visualizar dados (+10 XP)\n✓ Gerar relatórios (+50 XP)\n✓ Criar comparativos (+25 XP)\n✓ Explorar dashboards (+5 XP por visita)\n✓ Login diário (+20 XP)\n\nMais você usa o sistema, mais XP ganha!`,
          context: 'menu',
        };
      }

      if (
        lowerMessage.includes('conquista') ||
        lowerMessage.includes('badge') ||
        lowerMessage.includes('achievement')
      ) {
        return {
          message: `🏆 Suas Conquistas:\nVocê desbloqueou ${userStats?.badges.length || 0} conquistas!\n\nPróximas metas:\n- Atinja 100 XP totais para "Primeiro Milestone"\n- Analise 10 dados para "Analista Pro"\n- Mantenha 7 dias de login para "Guerreiro Diário"\n\nContinue conquistando! 🎯`,
          context: 'menu',
        };
      }

      return {
        message: `Ótima pergunta! 🤔 Como posso ajudá-lo?`,
        context: 'menu',
      };
    }

    // 2️⃣ LISTA DE TELAS
    if (assistantContext === 'screens-list') {
      // Detectar qual tela o usuário quer
      for (const [key, screen] of Object.entries(SCREEN_KNOWLEDGE)) {
        if (lowerMessage.includes(key) || lowerMessage.includes(screen.name.toLowerCase())) {
          return {
            message: `� ${screen.name}\n\n${screen.description}\n\n✨ Funcionalidades principais:\n${screen.features.join('\n')}\n\n📖 Como usar:\n${screen.howToUse}\n\n💡 Dicas úteis:\n${screen.tips.join('\n')}`,
            context: 'screen-detail',
            selectedScreen: key,
          };
        }
      }

      // Se não encontrou, voltar ao menu de telas
      return {
        message: `Desculpe, não encontrei essa tela. Qual você gostaria de conhecer?`,
        context: 'screens-list',
      };
    }

    // 3️⃣ DETALHE DA TELA
    if (assistantContext === 'screen-detail') {
      if (lowerMessage.includes('voltar') || lowerMessage.includes('menu')) {
        return {
          message: `Voltando ao menu principal...`,
          context: 'menu',
        };
      }

      if (lowerMessage.includes('outra') || lowerMessage.includes('próxima')) {
        return {
          message: `Qual outra tela você gostaria de conhecer?`,
          context: 'screens-list',
        };
      }

      return {
        message: `Posso ajudá-lo com mais informações sobre essa tela ou gostaria de conhecer outra?`,
        context: 'screen-detail',
      };
    }

    return {
      message: `Como posso ajudá-lo?`,
      context: 'menu',
    };
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simular delay de resposta
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Get AI response
    const aiResponse = await getAIResponse(input);

    // Atualizar o contexto do assistente
    setAssistantContext(aiResponse.context);
    if (aiResponse.selectedScreen) {
      setSelectedScreen(aiResponse.selectedScreen);
    }

    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now()}_ai`,
      role: 'assistant',
      content: aiResponse.message,
      timestamp: new Date(),
      suggestions:
        aiResponse.context === 'screens-list'
          ? Object.values(SCREEN_KNOWLEDGE).map((s) => s.name)
          : aiResponse.context === 'screen-detail'
            ? ['Explique outra tela', 'Voltar ao menu']
            : ['Explicação de Telas', 'Ver meu progresso', 'Como ganhar XP?'],
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);

    // 🎯 Award XP para Delta Assistant - MUITO RESTRITIVO
    // Só libera XP UMA VEZ por sessão, após 2 minutos de uso
    const now = Date.now();
    const timeSinceLastXP = now - lastXPTime;

    // Condições MUITO estritas para liberar XP
    if (
      xpMessageCount === 0 && // Ainda não liberou XP nesta sessão
      timeSinceLastXP >= XP_COOLDOWN_MS // Passou 2 minutos
    ) {
      addXP(XP_AMOUNT, 'Usou o Delta Assistant', '🤖');
      setLastXPTime(now);
      setXpMessageCount(1); // Marca que já liberou
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <>
      {/* Main Chat Button */}
      <div className="fixed bottom-4 right-4 z-40">
        {!isOpen && (
          <motion.button
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center group relative"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <MessageCircle className="w-7 h-7" />
            </motion.div>

            {/* Pulse indicator */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-blue-400"
              animate={{ scale: [1, 1.3], opacity: [1, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>
        )}
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-4 right-4 w-96 h-[600px] bg-background border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden z-40"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Delta Assistant
                </h3>
                <p className="text-xs text-blue-100">Sempre aqui para ajudar</p>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onClose?.();
                }}
                className="text-white hover:bg-blue-600 rounded p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-muted text-foreground rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                    {/* Suggestions */}
                    {msg.suggestions && msg.role === 'assistant' && (
                      <div className="mt-3 space-y-2">
                        {msg.suggestions.map((suggestion, i) => (
                          <motion.button
                            key={i}
                            onClick={() => handleSuggestion(suggestion)}
                            className="w-full text-left text-xs py-2 px-3 rounded bg-background/50 hover:bg-background/80 transition-colors text-muted-foreground hover:text-foreground flex items-center justify-between group"
                            whileHover={{ x: 4 }}
                          >
                            <span>{suggestion}</span>
                            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  className="flex gap-2"
                  animate={{ opacity: [0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                  placeholder="Digite sua pergunta..."
                  className="flex-1 bg-muted rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <motion.button
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-muted text-white rounded p-2 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/**
 * COMPONENTE: AI Suggestions Panel
 * Mostra sugestões inteligentes baseadas no contexto
 */
export const AISuggestionsPanel: React.FC<{ context?: AssistantContext }> = ({ context }) => {
  const suggestions = [
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Analisar Desempenho',
      description: 'Veja suas métricas em detalhes',
      action: 'Analisar',
    },
    {
      icon: <Lightbulb className="w-5 h-5" />,
      title: 'Insights Diários',
      description: 'Descoberta de oportunidades',
      action: 'Ver Insights',
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Maximize XP',
      description: 'Ganhe mais points hoje',
      action: 'Como?',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {suggestions.map((suggestion, i) => (
        <motion.div
          key={i}
          className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
          whileHover={{ scale: 1.02, borderColor: 'hsl(240, 100%, 50%)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="text-blue-500 group-hover:text-cyan-400 transition-colors">
              {suggestion.icon}
            </div>
            <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground">
              {suggestion.action}
            </span>
          </div>
          <h3 className="font-semibold text-sm mb-1">{suggestion.title}</h3>
          <p className="text-xs text-muted-foreground">{suggestion.description}</p>
        </motion.div>
      ))}
    </div>
  );
};
