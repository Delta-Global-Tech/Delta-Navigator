import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  X, 
  DollarSign, 
  Calendar, 
  FileText,
  CheckCircle,
  AlertCircle,
  Briefcase,
  TrendingUp
} from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '@/lib/api-config';

interface Contrato {
  descricao: string;
  nome: string;
  vl_financ: number;
  vlr_tac: number;
  vlr_iof: number;
  out_vlr: number;
  vlr_liberado: number;
  valor_solic: number;
  nr_cpf_cnpj: string;
  nome_inst: string;
  data_entrada: string;
  nome_conven: string;
  nome_filial: string;
  data_mov_lib: string;
  contrato: string;
  taxa: number;
  taxa_real: number;
  taxa_cet: number;
  status_final: string;
  vlr_prestacao?: number;
  qtd_parcelas?: number;
  posicao?: {
    nomeCliente: string;
    valorLiquido: number;
    valorTotalDevedor: number;
    valorParcelas: number;
    prestacoesPagasTotal: number;
    quantidadeDeParcelas: number;
    valorPago: number;
    saldoDevedorAtual: number;
    dataPrimeiroPagamento: string;
    dataUltimaParcela: string;
    percentualPago: number;
    duracaoMeses: number;
  };
}

interface ClienteContratoModalProps {
  isOpen: boolean;
  onClose: () => void;
  cpfCnpj: string;
  nomeCliente: string;
}

const formatCurrency = (value: number | string | null | undefined) => {
  if (!value && value !== 0) return 'R$ 0,00';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numValue);
};

const formatDate = (date: string | null) => {
  if (!date) return '-';
  try {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  } catch {
    return date;
  }
};

const getStatusColor = (status: string | null) => {
  if (!status) return 'bg-gray-100 text-gray-800';
  const statusLower = status.toLowerCase();
  if (statusLower.includes('liberado')) return 'bg-green-100 text-green-800';
  if (statusLower.includes('pendente')) return 'bg-yellow-100 text-yellow-800';
  if (statusLower.includes('reprovado')) return 'bg-red-100 text-red-800';
  return 'bg-blue-100 text-blue-800';
};

const StatusIcon = ({ status }: { status: string | null }) => {
  if (!status) return <AlertCircle className="h-4 w-4" />;
  const statusLower = status.toLowerCase();
  if (statusLower.includes('liberado')) return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (statusLower.includes('pendente')) return <AlertCircle className="h-4 w-4 text-yellow-600" />;
  if (statusLower.includes('reprovado')) return <X className="h-4 w-4 text-red-600" />;
  return <FileText className="h-4 w-4" />;
};

export function ClienteContratoModal({ 
  isOpen, 
  onClose, 
  cpfCnpj, 
  nomeCliente 
}: ClienteContratoModalProps) {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && cpfCnpj) {
      fetchContratos();
    }
  }, [isOpen, cpfCnpj]);

  const fetchContratos = async () => {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = getApiUrl(3003, 'VITE_EXTRATO_API_URL');
      const response = await axios.get(`${baseUrl}/api/cadastral/contratos-por-cpf`, {
        params: { cpf_cnpj: cpfCnpj }
      });

      setContratos(response.data.contratos || []);
    } catch (err) {
      console.error('[ClienteContratoModal] Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar contratos');
      setContratos([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-6xl max-h-[95vh] overflow-y-auto bg-slate-800 border-slate-700"
      >
        <DialogHeader className="border-b border-slate-700 pb-4">
          <div className="flex items-center justify-between w-full">
            <div>
              <DialogTitle className="text-2xl text-white flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-yellow-500" />
                Contratos de {nomeCliente}
              </DialogTitle>
              <p className="text-sm text-slate-400 mt-2">CPF/CNPJ: {cpfCnpj}</p>
            </div>
          </div>
          <div className="sr-only">
            Visualização de contratos e posição do cliente {nomeCliente}
          </div>
          <DialogDescription className="hidden">
            {nomeCliente} - Detalhes de contratos e posição
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-500 mr-3" />
              <p className="text-slate-300">Carregando contratos...</p>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <p className="text-red-400">⚠️ {error}</p>
            </div>
          ) : contratos.length === 0 ? (
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-300 font-medium">Nenhum contrato encontrado</p>
              <p className="text-slate-400 text-sm">Este cliente não possui contratos registrados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Resumo dos contratos */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Card className="bg-blue-900/20 border-blue-700/50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-blue-400 mb-1">Total de Contratos</p>
                      <p className="text-3xl font-bold text-blue-500">{contratos.length}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-900/20 border-green-700/50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-green-400 mb-1">Total Liberado</p>
                      <p className="text-2xl font-bold text-green-500">
                        {formatCurrency(contratos.reduce((sum, c) => sum + (c.vlr_liberado || 0), 0))}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-orange-900/20 border-orange-700/50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-orange-400 mb-1">Total Financiado</p>
                      <p className="text-2xl font-bold text-orange-500">
                        {formatCurrency(contratos.reduce((sum, c) => sum + (c.vl_financ || 0), 0))}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-900/20 border-purple-700/50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-purple-400 mb-1">Taxa Média CET</p>
                      <p className="text-2xl font-bold text-purple-500">
                        {(contratos.reduce((sum, c) => sum + (c.taxa_cet || 0), 0) / Math.max(contratos.length, 1)).toFixed(2)}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de contratos */}
              <div className="space-y-3">
                {contratos.map((contrato, idx) => (
                  <Card key={idx} className="bg-slate-700/50 border-slate-600 hover:border-yellow-500/50 transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-white flex items-center gap-2">
                            <StatusIcon status={contrato.status_final} />
                            {contrato.descricao || contrato.nome || 'Contrato sem descrição'}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge className={getStatusColor(contrato.status_final)}>
                              {contrato.status_final || 'Desconhecido'}
                            </Badge>
                            {contrato.contrato && (
                              <Badge className="bg-slate-600 text-slate-200">
                                #{contrato.contrato}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-400">Liberado</p>
                          <p className="text-xl font-bold text-green-500">
                            {formatCurrency(contrato.vlr_liberado)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Informações principais */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-semibold">Solicitado</p>
                          <p className="text-sm font-bold text-slate-200 mt-1">
                            {formatCurrency(contrato.valor_solic)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-semibold">Financiado</p>
                          <p className="text-sm font-bold text-slate-200 mt-1">
                            {formatCurrency(contrato.vl_financ)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-semibold">Data Entrada</p>
                          <p className="text-sm font-bold text-slate-200 mt-1">
                            {formatDate(contrato.data_entrada)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-semibold">Data Liberação</p>
                          <p className="text-sm font-bold text-slate-200 mt-1">
                            {formatDate(contrato.data_mov_lib)}
                          </p>
                        </div>
                      </div>

                      {/* Custos e Taxas */}
                      <div className="bg-slate-800/50 rounded-lg p-3 space-y-2 border border-slate-600/50">
                        <p className="text-xs text-slate-400 uppercase font-semibold mb-3">Custos e Taxas</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-slate-400">TAC: </span>
                            <span className="font-semibold text-slate-200">
                              {formatCurrency(contrato.vlr_tac)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">IOF: </span>
                            <span className="font-semibold text-slate-200">
                              {formatCurrency(contrato.vlr_iof)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Outros: </span>
                            <span className="font-semibold text-slate-200">
                              {formatCurrency(contrato.out_vlr)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Total Custos: </span>
                            <span className="font-semibold text-slate-200">
                              {formatCurrency((contrato.vlr_tac || 0) + (contrato.vlr_iof || 0) + (contrato.out_vlr || 0))}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Taxas */}
                      <div className="bg-slate-800/50 rounded-lg p-3 space-y-2 border border-slate-600/50">
                        <p className="text-xs text-slate-400 uppercase font-semibold mb-3">Taxas Contratadas</p>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-slate-400">Taxa Nominal: </span>
                            <span className="font-semibold text-slate-200">
                              {contrato.taxa?.toFixed(4) || '-'}% a.m.
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Taxa Real: </span>
                            <span className="font-semibold text-slate-200">
                              {contrato.taxa_real?.toFixed(4) || '-'}% a.m.
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">CET: </span>
                            <span className="font-semibold text-slate-200">
                              {contrato.taxa_cet?.toFixed(4) || '-'}% a.a.
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Informações de origem */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Instituição</p>
                          <p className="text-slate-200 font-medium">{contrato.nome_inst || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Convênio</p>
                          <p className="text-slate-200 font-medium">{contrato.nome_conven || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Filial</p>
                          <p className="text-slate-200 font-medium">{contrato.nome_filial || '-'}</p>
                        </div>
                      </div>

                      {/* POSIÇÃO DE CONTRATO (se disponível) */}
                      {contrato.posicao && (
                        <div className="border-t border-slate-600 pt-4 mt-4">
                          <p className="text-xs text-yellow-400 uppercase font-semibold mb-3 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Posição Atual do Contrato
                          </p>
                          
                          {/* Cards de resumo de posição */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                            <div className="bg-red-900/20 border border-red-700/50 rounded p-3">
                              <p className="text-xs text-red-400 mb-1">Saldo Devedor</p>
                              <p className="text-base font-bold text-red-500">
                                {formatCurrency(contrato.posicao.saldoDevedorAtual)}
                              </p>
                            </div>
                            <div className="bg-green-900/20 border border-green-700/50 rounded p-3">
                              <p className="text-xs text-green-400 mb-1">Valor Pago</p>
                              <p className="text-base font-bold text-green-500">
                                {formatCurrency(contrato.posicao.valorPago)}
                              </p>
                            </div>
                            <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3">
                              <p className="text-xs text-blue-400 mb-1">Parcelas Pagas</p>
                              <p className="text-base font-bold text-blue-500">
                                {contrato.posicao.prestacoesPagasTotal} / {contrato.posicao.quantidadeDeParcelas}
                              </p>
                            </div>
                            <div className="bg-purple-900/20 border border-purple-700/50 rounded p-3">
                              <p className="text-xs text-purple-400 mb-1">Progresso</p>
                              <p className="text-base font-bold text-purple-500">
                                {contrato.posicao.percentualPago?.toFixed(1) || '0'}%
                              </p>
                            </div>
                          </div>

                          {/* Barra de progresso */}
                          <div className="bg-slate-700 rounded-full h-3 overflow-hidden mb-4">
                            <div
                              className="bg-gradient-to-r from-yellow-500 to-green-500 h-full"
                              style={{ width: `${Math.min(contrato.posicao.percentualPago || 0, 100)}%` }}
                            />
                          </div>

                          {/* Detalhes de posição */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Valor Total Devedor</p>
                              <p className="text-slate-200 font-medium">{formatCurrency(contrato.posicao.valorTotalDevedor)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Valor Prestação</p>
                              <p className="text-slate-200 font-medium">{formatCurrency(contrato.posicao.valorParcelas)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 uppercase font-semibold mb-1">1ª Prestação</p>
                              <p className="text-slate-200 font-medium">{formatDate(contrato.posicao.dataPrimeiroPagamento)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Última Prestação</p>
                              <p className="text-slate-200 font-medium">{formatDate(contrato.posicao.dataUltimaParcela)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Duração</p>
                              <p className="text-slate-200 font-medium">{contrato.posicao.duracaoMeses} meses</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Valor Liquido</p>
                              <p className="text-slate-200 font-medium">{formatCurrency(contrato.posicao.valorLiquido)}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Parcelas (se disponível) */}
                      {contrato.qtd_parcelas && (
                        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-blue-400 uppercase font-semibold mb-1">Qtd. Parcelas</p>
                              <p className="text-blue-200 font-bold text-lg">{contrato.qtd_parcelas}</p>
                            </div>
                            {contrato.vlr_prestacao && (
                              <div>
                                <p className="text-xs text-blue-400 uppercase font-semibold mb-1">Valor Parcela</p>
                                <p className="text-blue-200 font-bold text-lg">
                                  {formatCurrency(contrato.vlr_prestacao)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-700 pt-4 flex justify-end">
          <Button 
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 text-white"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
