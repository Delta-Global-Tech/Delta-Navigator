import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClienteCadastral } from '@/data/cadastralApi';
import { getFaturasData } from '@/data/faturasApi';
import { Loader, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface StatementTransaction {
  account_id: string;
  personal_name: string;
  personal_document: string;
  email: string;
  statement_id: string;
  kind: string;
  amount: number;
  balance: number;
  fechamento: string;
  vencimento: string;
  status: string;
  description?: string;
  saldo_posterior?: number;
  recipients_document?: string;
  recipients_bank?: string;
  pix_free_description?: string;
}

interface ClienteDetailModalProps {
  cliente: ClienteCadastral | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ClienteDetailModal({ cliente, isOpen, onClose }: ClienteDetailModalProps) {
  const [transacoes, setTransacoes] = useState<StatementTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && cliente) {
      loadClienteTransactions();
    }
  }, [isOpen, cliente]);

  const loadClienteTransactions = async () => {
    if (!cliente) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Carregando extrato para:', cliente.cpf_cnpj);
      const response = await getFaturasData(cliente.cpf_cnpj);
      console.log('📊 Extrato carregado:', response.data);
      setTransacoes(response.data);
    } catch (err) {
      console.error('❌ Erro ao carregar extrato:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar extrato');
    } finally {
      setLoading(false);
    }
  };

  if (!cliente) return null;

  // Calcular estatísticas
  const totalEntrada = transacoes
    .filter(t => t.kind === 'entrada' || t.kind === 'credit' || (t.amount && parseFloat(String(t.amount)) > 0))
    .reduce((sum, t) => {
      const valor = t.amount !== undefined ? Math.abs(parseFloat(String(t.amount)) || 0) : Math.abs(parseFloat(String(t.balance)) || 0);
      return sum + valor;
    }, 0);

  const totalSaida = transacoes
    .filter(t => t.kind === 'saida' || t.kind === 'debit' || (t.amount && parseFloat(String(t.amount)) < 0))
    .reduce((sum, t) => {
      const valor = t.amount !== undefined ? Math.abs(parseFloat(String(t.amount)) || 0) : Math.abs(parseFloat(String(t.balance)) || 0);
      return sum + valor;
    }, 0);

  const saldoLiquido = totalEntrada - totalSaida;
  const quantidadeTransacoes = transacoes.length;

  // Últimas 10 transações
  const ultimasTransacoes = transacoes.slice(0, 10);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto w-[95vw]" style={{ background: 'rgba(6, 22, 43, 0.95)', border: '1px solid rgba(196, 138, 63, 0.3)' }}>
        <DialogHeader className="border-b" style={{ borderColor: 'rgba(196, 138, 63, 0.2)' }}>
          <DialogTitle className="text-2xl" style={{ color: '#C48A3F' }}>
            Extrato - {cliente.nome}
          </DialogTitle>
        </DialogHeader>

        {/* Informações Básicas */}
        <div className="space-y-4 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg" style={{ background: 'rgba(196, 138, 63, 0.1)', border: '1px solid rgba(196, 138, 63, 0.3)' }}>
              <p style={{ color: '#C48A3F' }} className="text-xs font-bold uppercase">CPF/CNPJ</p>
              <p className="text-white font-mono mt-1">{cliente.cpf_cnpj}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'rgba(196, 138, 63, 0.1)', border: '1px solid rgba(196, 138, 63, 0.3)' }}>
              <p style={{ color: '#C48A3F' }} className="text-xs font-bold uppercase">Conta</p>
              <p className="text-white font-mono mt-1">{cliente.numero_da_conta}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'rgba(196, 138, 63, 0.1)', border: '1px solid rgba(196, 138, 63, 0.3)' }}>
              <p style={{ color: '#C48A3F' }} className="text-xs font-bold uppercase">Status</p>
              <Badge className="mt-1" style={{ backgroundColor: cliente.status_conta.toLowerCase().includes('desbloqueado') ? '#10b981' : '#ef4444' }}>
                {cliente.status_conta}
              </Badge>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'rgba(196, 138, 63, 0.1)', border: '1px solid rgba(196, 138, 63, 0.3)' }}>
              <p style={{ color: '#C48A3F' }} className="text-xs font-bold uppercase">Crédito Limite</p>
              <p className="text-white font-mono mt-1">R$ {parseFloat(String(cliente.credit_limit)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* Estado de Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12 gap-3">
            <Loader className="h-5 w-5 animate-spin" style={{ color: '#C48A3F' }} />
            <p className="text-gray-300">Carregando extrato...</p>
          </div>
        )}

        {/* Estado de Erro */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-900/20 border border-red-500/50 mt-4">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-300 font-semibold">Erro ao carregar extrato</p>
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* KPIs de Transações */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              {/* Total de Transações */}
              <Card className="border-0" style={{ background: 'rgba(196, 138, 63, 0.1)' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold" style={{ color: '#C48A3F' }}>TRANSAÇÕES TOTAL</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{quantidadeTransacoes}</p>
                </CardContent>
              </Card>

              {/* Total Entrada */}
              <Card className="border-0" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: '#10b981' }}>
                    <TrendingUp className="h-4 w-4" /> ENTRADA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold" style={{ color: '#10b981' }}>
                    R$ {totalEntrada.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>

              {/* Total Saída */}
              <Card className="border-0" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: '#ef4444' }}>
                    <TrendingDown className="h-4 w-4" /> SAÍDA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold" style={{ color: '#ef4444' }}>
                    R$ {totalSaida.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>

              {/* Saldo Líquido */}
              <Card className="border-0" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold" style={{ color: '#3b82f6' }}>SALDO LÍQUIDO</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold" style={{ color: saldoLiquido >= 0 ? '#10b981' : '#ef4444' }}>
                    R$ {saldoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Transações */}
            {ultimasTransacoes.length > 0 ? (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Últimas Transações</h3>
                <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'rgba(196, 138, 63, 0.3)' }}>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow style={{ backgroundColor: 'rgba(196, 138, 63, 0.12)', borderBottomColor: 'rgba(196, 138, 63, 0.3)' }}>
                          <TableHead style={{ color: '#C48A3F', fontWeight: '700', fontSize: '0.85rem' }}>ID</TableHead>
                          <TableHead style={{ color: '#C48A3F', fontWeight: '700', fontSize: '0.85rem' }}>Tipo</TableHead>
                          <TableHead style={{ color: '#C48A3F', fontWeight: '700', fontSize: '0.85rem' }}>Descrição</TableHead>
                          <TableHead style={{ color: '#C48A3F', fontWeight: '700', fontSize: '0.85rem' }}>Valor</TableHead>
                          <TableHead style={{ color: '#C48A3F', fontWeight: '700', fontSize: '0.85rem' }}>Para/De</TableHead>
                          <TableHead style={{ color: '#C48A3F', fontWeight: '700', fontSize: '0.85rem' }}>Banco</TableHead>
                          <TableHead style={{ color: '#C48A3F', fontWeight: '700', fontSize: '0.85rem' }}>PIX Info</TableHead>
                          <TableHead style={{ color: '#C48A3F', fontWeight: '700', fontSize: '0.85rem' }}>Data/Hora</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ultimasTransacoes.map((transacao, idx) => {
                          const valor = transacao.amount !== undefined ? parseFloat(String(transacao.amount)) : parseFloat(String(transacao.balance));
                          const dataHora = transacao.fechamento ? new Date(transacao.fechamento) : null;
                          const dataFormatada = dataHora ? dataHora.toLocaleDateString('pt-BR') : '-';
                          const horaFormatada = dataHora ? dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-';
                          
                          return (
                            <TableRow key={idx} style={{ borderBottomColor: 'rgba(196, 138, 63, 0.15)' }}>
                              <TableCell className="font-mono text-xs text-gray-400 py-3">{transacao.statement_id}</TableCell>
                              <TableCell className="text-white text-sm py-3">
                                <Badge style={{ backgroundColor: valor > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: valor > 0 ? '#10b981' : '#ef4444', border: `1px solid ${valor > 0 ? '#10b981' : '#ef4444'}` }}>
                                  {transacao.kind?.toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-gray-300 text-sm py-3 max-w-xs truncate" title={transacao.description || ''}>
                                {transacao.description || '-'}
                              </TableCell>
                              <TableCell className="py-3">
                                <span style={{ color: valor > 0 ? '#10b981' : '#ef4444' }} className="font-semibold text-sm">
                                  R$ {Math.abs(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </TableCell>
                              <TableCell className="text-gray-400 text-sm py-3 max-w-xs truncate" title={transacao.recipients_document || ''}>
                                {transacao.recipients_document || '-'}
                              </TableCell>
                              <TableCell className="text-gray-400 text-sm py-3">
                                {transacao.recipients_bank || '-'}
                              </TableCell>
                              <TableCell className="text-gray-400 text-sm py-3 max-w-xs truncate" title={transacao.pix_free_description || ''}>
                                {transacao.pix_free_description || '-'}
                              </TableCell>
                              <TableCell className="text-gray-400 text-sm py-3">
                                <div className="flex flex-col">
                                  <span>{dataFormatada}</span>
                                  <span className="text-xs text-gray-500">{horaFormatada}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 mt-6">
                <p className="text-gray-400">Nenhuma transação encontrada para este cliente</p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
