import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

export interface PageContextData {
  page: string
  pageName: string
  description: string
  availableData: string[]
  dataContext: Record<string, any>
  isFinancialPage: boolean
  isAdminPage: boolean
}

/**
 * Hook que detecta automaticamente:
 * - Em qual página o usuário está
 * - Quais dados estão disponíveis naquela página
 * - Contexto específico para passar ao bot IA
 */
export function usePageContext(dataContext?: Record<string, any>): PageContextData {
  const location = useLocation()
  const [contextData, setContextData] = useState<PageContextData>({
    page: '',
    pageName: '',
    description: '',
    availableData: [],
    dataContext: {},
    isFinancialPage: false,
    isAdminPage: false,
  })

  useEffect(() => {
    const path = location.pathname
    let context: PageContextData = {
      page: path,
      pageName: '',
      description: '',
      availableData: [],
      dataContext: dataContext || {},
      isFinancialPage: false,
      isAdminPage: false,
    }

    // Detectar página e seu contexto - MAPEAMENTO COMPLETO
    if (path === '/' || path === '/dashboard') {
      context.pageName = 'Dashboard Principal'
      context.description = 'Resumo executivo com métricas de performance, KPIs, gráficos e alertas'
      context.availableData = ['resumo total', 'gráficos de performance', 'alertas em tempo real', 'notificações', 'métricas por contrato']
      context.isAdminPage = true
    } else if (path === '/extrato') {
      context.pageName = 'Extrato Financeiro'
      context.description = 'Análise de transações bancárias com saldo em tempo real'
      context.availableData = [
        'transaction_date (data/hora)',
        'type (crédito/débito)',
        'amount (valor)',
        'saldo_posterior (saldo após transação)',
        'description (descrição)',
        'personal_name (titular)',
        'nome_pagador (origem/crédito)',
        'beneficiario (destino/débito)',
        'banco_beneficiario (banco)',
        'pix_free_description (descrição PIX)'
      ]
      context.isFinancialPage = true
    } else if (path === '/extrato-ranking') {
      context.pageName = 'Ranking de Extratos'
      context.description = 'Análise e ranking de movimentação bancária por período'
      context.availableData = ['ranking de transações', 'maiores movimentações', 'comparativo de períodos', 'tendências']
      context.isFinancialPage = true
    } else if (path === '/faturas') {
      context.pageName = 'Gestão de Faturas'
      context.description = 'Controle e análise de faturas com filtros por status e data'
      context.availableData = [
        'personal_document (CPF/CNPJ)',
        'balance (saldo devedor)',
        'fechamento (data de fechamento)',
        'vencimento (data de vencimento)',
        'status (situação do pagamento)',
        'gráficos de distribuição',
        'exportação em Excel'
      ]
      context.isFinancialPage = true
    } else if (path === '/a-desembolsar') {
      context.pageName = 'A Desembolsar'
      context.description = 'Controle de pagamentos e desembolsos pendentes com análise de carteiras'
      context.availableData = [
        'total_registros (quantidade)',
        'total_solicitado (valor solicitado)',
        'total_liberado (valor liberado)',
        'total_pendente (valor pendente)',
        'percentual_liberacao (% liberado)',
        'empenhos_liberados/pendentes/parciais (status)',
        'ticket_medio_solicitado/liberado (média)',
        'taxa_liberacao_empenhos (%)',
        'carteiras_unicas (quantidade)',
        'produtos_unicos (quantidade)'
      ]
      context.isFinancialPage = true
    } else if (path === '/desembolso') {
      context.pageName = 'Histórico de Desembolsos'
      context.description = 'Histórico detalhado de desembolsos com métricas financeiras complexas'
      context.availableData = [
        'vl_financ (valor financiado)',
        'vlr_tac (taxa administração)',
        'vlr_iof (taxa IOF)',
        'vlr_liberado (valor liberado)',
        'valor_solic (valor solicitado)',
        'nome, nr_cpf_cnpj (cliente)',
        'data_entrada, data_mov_lib (datas)',
        'nome_inst, nome_conven, nome_filial (estrutura)',
        'taxa, taxa_real, taxa_cet (taxas)',
        'status_final (situação)',
        'total_contratos, liberados, pendentes, reprovados (stats)',
        'eficiencia_liberacao (% eficiência)',
        'ticket_medio, taxa_media (médias)'
      ]
      context.isFinancialPage = true
    } else if (path === '/comparativo-desembolso') {
      context.pageName = 'Comparativo de Desembolsos'
      context.description = 'Análise comparativa de desembolsos entre períodos com breakdown por produto'
      context.availableData = [
        'period (período: mês ou dia)',
        'qtdRegistros (quantidade)',
        'valorSolicitado, valorFinanciado, valorTac, valorIof (valores)',
        'valorLiberado, totalDesembolsado (totais)',
        'ticketMedio, taxaMedia (médias)',
        'produtosDetalhes (análise por produto)',
        'variação vs período anterior (%)',
        'animações de comparação'
      ]
      context.isFinancialPage = true
    } else if (path === '/producao/analytics') {
      context.pageName = 'Produção - Analytics'
      context.description = 'Analytics avançado de produção com gráficos e métricas'
      context.availableData = ['dados de produção', 'gráficos de tendência', 'KPIs', 'comparativo mensal']
    } else if (path === '/producao-novo') {
      context.pageName = 'Produção Novo'
      context.description = 'Visão de nova produção com dados detalhados'
      context.availableData = ['novos produtos', 'previsão', 'pipeline', 'forecast']
    } else if (path === '/producao-compra') {
      context.pageName = 'Produção Compra'
      context.description = 'Análise de produção por compra com valores e quantidades'
      context.availableData = ['volume de compras', 'valor total', 'produtos adquiridos', 'fornecedores']
    } else if (path === '/funil') {
      context.pageName = 'Funil de Vendas'
      context.description = 'Visualização do funil de vendas com etapas, status e análise de conversão'
      context.availableData = [
        'estágios do funil (etapas)',
        'status dos processos',
        'produtos (filtro)',
        'conversão entre etapas',
        'dados por etapa específica',
        'KPIs do funil (geral)',
        'auto-atualização (30 segundos)',
        'análise detalhada por estágio'
      ]
    } else if (path === '/propostas') {
      context.pageName = 'Propostas'
      context.description = 'Gestão de propostas comerciais com análise de status e valores'
      context.availableData = [
        'cliente, telefone, email',
        'proposta_id (identificador)',
        'data_contrato, data_criacao, data_finalizacao (datas)',
        'valor_total, valor_liquido (financeiro)',
        'qtd_parcelas (parcelamento)',
        'canal_venda (origem)',
        'status_processo (estágio)',
        'KPI: total_propostas, clientes_unicos, valor_medio',
        'KPI: finalizadas, em_andamento, pendentes, canceladas (distribuição)',
        'gráfico de evolução temporal',
        'exportação em Excel'
      ]
    } else if (path === '/propostas-abertura') {
      context.pageName = 'Propostas - Abertura'
      context.description = 'Análise de propostas por data de abertura'
      context.availableData = ['propostas por período', 'tendência temporal', 'padrão de abertura', 'volumetria']
    } else if (path === '/licitacoes') {
      context.pageName = 'Licitações (Boletos)'
      context.description = 'Gestão de boletos bancários com rastreamento de pagamentos'
      context.availableData = [
        'client_name (cliente/empresa)',
        'processor_type (processador)',
        'amount (valor do boleto)',
        'paid_net_amount (valor pago líquido)',
        'fee_amount (taxa cobrada)',
        'status: paid/open/canceled/expired/overdue (situação)',
        'paid_at (data de pagamento)',
        'total_count, paid_count, open_count, canceled_count (stats)',
        'total_amount, total_paid_net, total_fees (totalizadores)',
        'avg_fee (taxa média)',
        'exportação em CSV'
      ]
      context.isFinancialPage = true
    } else if (path === '/licitacoes-v2') {
      context.pageName = 'Licitações V2'
      context.description = 'Visão melhorada de gestão de licitações e boletos'
      context.availableData = ['licitações em aberto', 'histórico', 'análise de resultados', 'tendências']
    } else if (path === '/cadastral' || path === '/cadastral-v2' || path === '/cadastral-v3') {
      if (path === '/cadastral-v3') {
        context.pageName = 'Cadastral V3'
      } else {
        context.pageName = 'Cadastral'
      }
      context.description = 'Base de dados cadastrais de clientes com análise geográfica e crédito'
      context.availableData = [
        'account_id, nome, cpf_cnpj, email',
        'numero_da_conta, status_conta (ativo/inativo)',
        'credit_limit (limite de crédito)',
        'estado, cidade (localização)',
        'data_criacao (quando cadastrou)',
        'total_clientes, clientes_ativos, clientes_inativos (stats)',
        'total_credito_liberado, credito_medio (financeiro)',
        'total_estados, total_cidades (cobertura)',
        'mapa geográfico por cidade',
        'evolução mensal (registros e crédito)',
        'exportação em Excel',
        'filtros por status, data, estado'
      ]
    } else if (path === '/tomada-decisao') {
      context.pageName = 'Tomada de Decisão'
      context.description = 'Dashboard executivo com análises estratégicas e inteligência de negócios'
      context.availableData = [
        'resumo executivo (KPIs gerais)',
        'total_operacoes, volume_total, ticket_medio_geral',
        'produtos_ativos, regioes_ativas, instituicoes_ativas',
        'análise por produto (eficiência, participação)',
        'análise geográfica (cidade, estado, diversificação)',
        'análise por instituição (operações, volume, portfolio)',
        'insights estratégicos (oportunidades)',
        'alertas críticos (risk management)',
        'matriz BCG (posicionamento produto)',
        'tendências de mercado',
        'scoring de oportunidades',
        'cross-sell opportunities'
      ]
    } else if (path === '/comparativo-contrato') {
      context.pageName = 'Comparativo por Contrato'
      context.description = 'Análise comparativa de desempenho por contrato'
      context.availableData = ['comparativo de contratos', 'métricas por contrato', 'performance', 'variance']
    } else if (path === '/posicao-contratos' || path === '/posicao-contratos-completa') {
      context.pageName = 'Posição de Contratos'
      context.description = 'Posição atual e histórico detalhado de todos os contratos'
      context.availableData = [
        'account_id, numero_contrato (identificadores)',
        'status_contrato (situação)',
        'saldo_atual (posição financeira)',
        'data_inicio, data_termino, data_proximo_aniversario (datas)',
        'valor_original, valor_limite (valores)',
        'taxa_principal, taxa_real, taxa_cet (taxas)',
        'parcelas_pagas, parcelas_totais (progresso)',
        'contrato_ativo_inativo (status)',
        'histórico de transações',
        'evolução de saldo',
        'análise por tipo de contrato',
        'vencimentos futuros'
      ]
    } else if (path === '/backoffice') {
      context.pageName = 'Backoffice'
      context.description = 'Ferramentas administrativas e de suporte operacional'
      context.availableData = ['operações', 'suporte', 'administração', 'controle']
    } else if (path === '/admin/fechamento-mes') {
      context.pageName = 'Fechamento do Mês'
      context.description = 'Análise detalhada de receitas, despesas e saldo mensal'
      context.availableData = [
        'receita total',
        'despesa total',
        'saldo',
        'dados por período',
        'gráficos de tendência',
        'tabela de transações',
        'exportação em CSV',
      ]
      context.isFinancialPage = true
      context.isAdminPage = true
    } else if (path === '/admin/users') {
      context.pageName = 'Gestão de Usuários'
      context.description = 'Gerenciamento de usuários, permissões e roles do sistema'
      context.availableData = [
        'lista de usuários',
        'permissões',
        'roles',
        'status de acesso',
        'histórico de atividades',
        'controle de permissões',
      ]
      context.isAdminPage = true
    } else if (path === '/admin/permissions') {
      context.pageName = 'Gerenciamento de Permissões'
      context.description = 'Configuração de permissões e acessos por usuário'
      context.availableData = [
        'permissões por tela',
        'roles',
        'permissões customizadas',
        'histórico de alterações',
      ]
      context.isAdminPage = true
    } else if (path === '/admin/monitoring') {
      context.pageName = 'Monitoramento do Sistema'
      context.description = 'Monitoramento de requisições, performance e erros do sistema'
      context.availableData = [
        'requisições HTTP',
        'performance',
        'erros',
        'alertas',
        'logs',
        'análise de throughput',
      ]
      context.isAdminPage = true
    } else if (path === '/network-test') {
      context.pageName = 'Teste de Rede'
      context.description = 'Ferramentas para teste de conectividade e performance de rede'
      context.availableData = ['testes de latência', 'bandwidth', 'conectividade', 'diagnóstico']
    } else if (path.includes('/admin')) {
      context.pageName = 'Painel Administrativo'
      context.description = 'Seção administrativa do sistema'
      context.availableData = ['dados administrativos', 'métricas do sistema', 'gestão']
      context.isAdminPage = true
    } else {
      context.pageName = 'Página'
      context.description = `Você está em: ${path}`
      context.availableData = ['informações gerais da página']
    }

    setContextData(context)
  }, [location.pathname, dataContext])

  return contextData
}
