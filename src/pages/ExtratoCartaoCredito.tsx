import React, { useState, useMemo, useEffect, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  FileText,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  FileJson,
} from 'lucide-react';
import {
  getExtratoCartaoCreditoData,
  ExtratoCartaoCreditoItem,
  formatCurrency,
  formatCpfCnpj,
} from '@/data/extratoCartaoCreditoApi';
import { useSync } from '@/providers/sync-provider';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Componente memoizado para linhas da tabela
interface TableRowProps {
  item: ExtratoCartaoCreditoItem;
  index: number;
  copiedCell: string | null;
  onCopy: (text: string, cellId: string) => void;
}

const ExtratoTableRow = memo(({ item, index, copiedCell, onCopy }: TableRowProps) => {
  const isCredit = item.debito_ou_credito?.toLowerCase() === 'credit';
  const amount = parseFloat(item.valor.toString());
  const cellId = `${item.cpf_cnpj}-${index}`;
  
  const formatCurrencyDisplay = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  return (
    <TableRow 
      key={cellId} 
      className="border-b transition-colors hover:opacity-80" 
      style={{borderColor: 'rgba(192, 134, 58, 0.1)', background: 'rgba(3, 18, 38, 0.5)'}}
    >
      <TableCell style={{color: '#FFFFFF', padding: '0.75rem'}} className="text-sm font-medium">
        {item.nome}
      </TableCell>
      <TableCell style={{color: 'rgba(255, 255, 255, 0.7)', padding: '0.75rem'}} className="text-sm">
        {formatCpfCnpj(item.cpf_cnpj)}
      </TableCell>
      <TableCell style={{padding: '0.75rem'}} className="text-sm">
        <Badge 
          style={{
            background: item.aberta_ou_fechada?.toLowerCase() === 'aberta' 
              ? 'rgba(59, 130, 246, 0.2)' 
              : 'rgba(251, 146, 60, 0.2)', 
            color: item.aberta_ou_fechada?.toLowerCase() === 'aberta' 
              ? '#3b82f6' 
              : '#fb923c', 
            border: item.aberta_ou_fechada?.toLowerCase() === 'aberta'
              ? '1px solid rgba(59, 130, 246, 0.5)'
              : '1px solid rgba(251, 146, 60, 0.5)',
            padding: '0.5rem 0.75rem',
            fontSize: '0.75rem'
          }}
        >
          {item.aberta_ou_fechada}
        </Badge>
      </TableCell>
      <TableCell style={{color: 'rgba(255, 255, 255, 0.7)', padding: '0.75rem'}} className="text-sm">
        {item.data_trasacao}
      </TableCell>
      <TableCell style={{color: 'rgba(255, 255, 255, 0.85)', padding: '0.75rem'}} className="text-xs max-w-sm">
        <div className="truncate" title={item.descricao}>
          {item.descricao || '-'}
        </div>
      </TableCell>
      <TableCell style={{padding: '0.75rem'}} className="text-right">
        <button 
          onClick={() => onCopy(Math.abs(amount).toFixed(2), cellId + '-valor')}
          className="relative inline-flex items-center gap-1 group hover:opacity-80 transition w-full justify-end"
          title="Clique para copiar o valor"
        >
          <span className={`font-bold text-sm ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
            {isCredit ? '+' : '-'}{formatCurrencyDisplay(Math.abs(amount))}
          </span>
          {copiedCell === cellId + '-valor' ? (
            <CheckCircle2 className="h-3 w-3 text-green-400" />
          ) : (
            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition" style={{color: '#C0863A'}} />
          )}
        </button>
      </TableCell>
      <TableCell style={{padding: '0.75rem'}} className="text-sm">
        <Badge 
          style={{
            background: isCredit ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', 
            color: isCredit ? '#10b981' : '#ef4444', 
            border: `1px solid ${isCredit ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`, 
            padding: '0.5rem 0.75rem', 
            fontSize: '0.75rem'
          }}
        >
          {isCredit ? '📥 Crédito' : '📤 Débito'}
        </Badge>
      </TableCell>
      <TableCell style={{color: 'rgba(255, 255, 255, 0.7)', padding: '0.75rem'}} className="text-sm">
        {item.data_fechamento || '-'}
      </TableCell>
      <TableCell style={{color: 'rgba(255, 255, 255, 0.7)', padding: '0.75rem'}} className="text-sm">
        {item.data_pagamento || '-'}
      </TableCell>
    </TableRow>
  );
});

ExtratoTableRow.displayName = 'ExtratoTableRow';

const ExtratoCartaoCredito = () => {
  const { updateSync } = useSync();

  // Estados para filtros (inputs não aplicados)
  const [inputPersonalDocument, setInputPersonalDocument] = useState('');
  const [inputDataInicio, setInputDataInicio] = useState('');
  const [inputDataFim, setInputDataFim] = useState('');

  // Estados para filtros aplicados
  const [personalDocument, setPersonalDocument] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Estados para visualização
  const [showFilters, setShowFilters] = useState(true);
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

  // Função para copiar
  const handleCopy = (text: string, cellId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCell(cellId);
    setTimeout(() => setCopiedCell(null), 2000);
  };

  // Função para aplicar os filtros
  const handleApplyFilters = () => {
    setPersonalDocument(inputPersonalDocument);
    setDataInicio(inputDataInicio);
    setDataFim(inputDataFim);
    setCurrentPage(1);
  };

  // Função para limpar filtros
  const limparFiltros = () => {
    setInputPersonalDocument('');
    setInputDataInicio('');
    setInputDataFim('');
    setPersonalDocument('');
    setDataInicio('');
    setDataFim('');
    setCurrentPage(1);
  };

  // Função para aplicar filtros ao pressionar Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyFilters();
    }
  };

  // Função para remover formatação de CPF/CNPJ
  const removeCpfCnpjFormatting = (value: string): string => {
    return value.replace(/[.\-/]/g, '');
  };

  // Query para buscar dados do extrato
  const { data: extratoResponse, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['extrato-cartao-credito', personalDocument, dataInicio, dataFim],
    queryFn: () => getExtratoCartaoCreditoData(removeCpfCnpjFormatting(personalDocument), dataInicio, dataFim),
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  // Atualizar sync quando dados chegarem
  useEffect(() => {
    if (extratoResponse) {
      const now = new Date();
      const timestamp = now.toLocaleTimeString('pt-BR');
      console.log('[EXTRATO CARTAO CREDITO] Atualizando sync para:', timestamp);
      updateSync(timestamp);
    }
  }, [extratoResponse, updateSync]);

  // Processar dados para paginação
  const extratoData = useMemo(() => {
    if (!extratoResponse?.data) return [];
    return extratoResponse.data;
  }, [extratoResponse]);

  // Calcular estatísticas corrigidas
  const statistics = useMemo(() => {
    if (!extratoData || extratoData.length === 0) {
      return {
        totalTransacoes: 0,
        totalCreditos: 0,
        totalDebitos: 0,
        saldoLiquido: 0,
        clientesUnicos: 0,
      };
    }

    let totalCreditos = 0;
    let totalDebitos = 0;

    extratoData.forEach((item) => {
      const valor = parseFloat(item.valor.toString()) || 0;
      if (item.debito_ou_credito?.toLowerCase() === 'credit') {
        totalCreditos += valor;
      } else if (item.debito_ou_credito?.toLowerCase() === 'debit') {
        totalDebitos += valor;
      }
    });

    const clientesUnicos = new Set(extratoData.map((item) => item.cpf_cnpj)).size;

    console.log('[STATS] Créditos:', totalCreditos, 'Débitos:', totalDebitos);

    return {
      totalTransacoes: extratoData.length,
      totalCreditos,
      totalDebitos,
      saldoLiquido: totalCreditos - totalDebitos,
      clientesUnicos,
    };
  }, [extratoData]);

  // Paginação
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return extratoData.slice(startIndex, endIndex);
  }, [extratoData, currentPage]);

  const totalPages = Math.ceil(extratoData.length / itemsPerPage);

  // Exportar para Excel
  const handleExportExcel = () => {
    if (!extratoData || extratoData.length === 0) {
      alert('Nenhum dado para exportar');
      return;
    }

    const worksheetData = extratoData.map((item) => ({
      Nome: item.nome,
      'CPF/CNPJ': formatCpfCnpj(item.cpf_cnpj),
      'Tipo': item.aberta_ou_fechada,
      'Data Transação': item.data_trasacao,
      'Descrição': item.descricao,
      'Valor': item.valor,
      'Débito/Crédito': item.debito_ou_credito,
      'Data Fechamento': item.data_fechamento || '-',
      'Data Pagamento': item.data_pagamento || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Extrato Cartão Crédito');

    // Ajustar largura das colunas
    const colWidths = [25, 18, 15, 15, 30, 12, 15, 18, 18, 15];
    worksheet['!cols'] = colWidths.map((width) => ({ wch: width }));

    XLSX.writeFile(workbook, `extrato-cartao-credito-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Exportar para PDF
  const handleExportPDF = () => {
    if (!extratoData || extratoData.length === 0) {
      alert('Nenhum dado para exportar');
      return;
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const now = new Date();
    const dateString = now.toLocaleDateString('pt-BR');
    const timeString = now.toLocaleTimeString('pt-BR');

    // Título
    doc.setFontSize(14);
    doc.setTextColor(192, 134, 58);
    doc.text('Extrato Cartão de Crédito', 15, 15);

    // Data e hora
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${dateString} às ${timeString}`, 15, 22);

    // Estatísticas
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const statsText = [
      `Total de Transações: ${statistics.totalTransacoes}`,
      `Clientes Únicos: ${statistics.clientesUnicos}`,
      `Total Créditos: ${formatCurrencyDisplay(statistics.totalCreditos)}`,
      `Total Débitos: ${formatCurrencyDisplay(statistics.totalDebitos)}`,
      `Saldo Líquido: ${formatCurrencyDisplay(statistics.saldoLiquido)}`,
    ];

    let statsY = 28;
    statsText.forEach((text) => {
      doc.text(text, 15, statsY);
      statsY += 5;
    });

    // Tabela
    const tableData = extratoData.map((item) => [
      item.nome,
      formatCpfCnpj(item.cpf_cnpj),
      item.aberta_ou_fechada,
      item.data_trasacao,
      item.descricao || '-',
      formatCurrencyDisplay(parseFloat(item.valor.toString())),
      item.debito_ou_credito === 'credit' ? '📥 Crédito' : '📤 Débito',
      item.data_fechamento || '-',
      item.data_pagamento || '-',
    ]);

    autoTable(doc, {
      head: [['Nome', 'CPF/CNPJ', 'Tipo', 'Data Transação', 'Descrição', 'Valor', 'Débito/Crédito', 'Data Fechamento', 'Data Pagamento']],
      body: tableData,
      startY: statsY + 5,
      theme: 'grid',
      headStyles: {
        fillColor: [192, 134, 58],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        textColor: [0, 0, 0],
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 18 },
        2: { cellWidth: 15 },
        3: { cellWidth: 18 },
        4: { cellWidth: 30 },
        5: { cellWidth: 20 },
        6: { cellWidth: 18 },
        7: { cellWidth: 18 },
        8: { cellWidth: 18 },
      },
    });

    // Rodapé
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`extrato-cartao-credito-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const formatCurrencyDisplay = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6" style={{background: 'linear-gradient(135deg, #030212 0%, #0f2438 50%, #051d2c 100%)'}}>
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{background: 'rgba(192, 134, 58, 0.2)'}}>
            <CreditCard className="w-6 h-6" style={{color: '#C0863A'}} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Extrato Cartão de Crédito</h1>
            <p style={{color: 'rgba(255, 255, 255, 0.6)'}}>Visualize as transações do cartão de crédito</p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card style={{background: 'rgba(3, 18, 38, 0.8)', border: '1px solid rgba(192, 134, 58, 0.2)'}}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p style={{color: 'rgba(255, 255, 255, 0.6)'}} className="text-sm">Transações</p>
                <p className="text-2xl font-bold text-white mt-1">{statistics.totalTransacoes}</p>
              </div>
              <FileText className="w-8 h-8" style={{color: 'rgba(255, 255, 255, 0.3)'}} />
            </div>
          </CardContent>
        </Card>

        <Card style={{background: 'rgba(3, 18, 38, 0.8)', border: '1px solid rgba(192, 134, 58, 0.2)'}}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p style={{color: 'rgba(255, 255, 255, 0.6)'}} className="text-sm">Clientes</p>
                <p className="text-2xl font-bold text-white mt-1">{statistics.clientesUnicos}</p>
              </div>
              <User className="w-8 h-8" style={{color: 'rgba(255, 255, 255, 0.3)'}} />
            </div>
          </CardContent>
        </Card>

        <Card style={{background: 'rgba(3, 18, 38, 0.8)', border: '1px solid rgba(16, 185, 129, 0.2)'}}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p style={{color: 'rgba(255, 255, 255, 0.6)'}} className="text-sm">Créditos</p>
                <p className="text-2xl font-bold text-green-400 mt-1">
                  {formatCurrencyDisplay(statistics.totalCreditos)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card style={{background: 'rgba(3, 18, 38, 0.8)', border: '1px solid rgba(239, 68, 68, 0.2)'}}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p style={{color: 'rgba(255, 255, 255, 0.6)'}} className="text-sm">Débitos</p>
                <p className="text-2xl font-bold text-red-400 mt-1">
                  {formatCurrencyDisplay(statistics.totalDebitos)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card style={{background: 'rgba(3, 18, 38, 0.8)', border: '1px solid rgba(192, 134, 58, 0.2)'}}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p style={{color: 'rgba(255, 255, 255, 0.6)'}} className="text-sm">Saldo Líquido</p>
                <p
                  className={`text-2xl font-bold mt-1`}
                  style={{color: statistics.saldoLiquido >= 0 ? '#10b981' : '#ef4444'}}
                >
                  {formatCurrencyDisplay(statistics.saldoLiquido)}
                </p>
              </div>
              <CreditCard className="w-8 h-8" style={{color: '#C0863A'}} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
        <Card style={{background: 'rgba(3, 18, 38, 0.8)', border: '1px solid rgba(192, 134, 58, 0.2)'}}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5" style={{color: 'rgba(255, 255, 255, 0.6)'}} />
              <CardTitle style={{color: '#FFFFFF'}}>Filtros</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-gray-400 hover:text-white"
            >
              {showFilters ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="document" style={{color: 'rgba(255, 255, 255, 0.8)'}}>
                  CPF/CNPJ
                </Label>
                <Input
                  id="document"
                  placeholder="Digite o CPF/CNPJ"
                  value={inputPersonalDocument}
                  onChange={(e) => setInputPersonalDocument(e.target.value)}
                  onKeyPress={handleKeyPress}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(192, 134, 58, 0.3)',
                    color: '#FFFFFF'
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataInicio" style={{color: 'rgba(255, 255, 255, 0.8)'}}>
                  Data Início
                </Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={inputDataInicio}
                  onChange={(e) => setInputDataInicio(e.target.value)}
                  onKeyPress={handleKeyPress}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(192, 134, 58, 0.3)',
                    color: '#FFFFFF'
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataFim" style={{color: 'rgba(255, 255, 255, 0.8)'}}>
                  Data Fim
                </Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={inputDataFim}
                  onChange={(e) => setInputDataFim(e.target.value)}
                  onKeyPress={handleKeyPress}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(192, 134, 58, 0.3)',
                    color: '#FFFFFF'
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleApplyFilters}
                style={{background: '#C0863A'}}
                className="text-white hover:opacity-80"
              >
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
              <Button
                onClick={limparFiltros}
                variant="outline"
                style={{borderColor: 'rgba(192, 134, 58, 0.3)', color: 'rgba(255, 255, 255, 0.6)'}}
                className="hover:opacity-80"
              >
                Limpar Filtros
              </Button>
              <Button
                onClick={handleExportExcel}
                variant="outline"
                style={{borderColor: 'rgba(192, 134, 58, 0.3)', color: 'rgba(255, 255, 255, 0.6)'}}
                className="hover:opacity-80 ml-auto"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>
              <Button
                onClick={handleExportPDF}
                variant="outline"
                style={{borderColor: 'rgba(192, 134, 58, 0.3)', color: 'rgba(255, 255, 255, 0.6)'}}
                className="hover:opacity-80"
              >
                <FileJson className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tabela */}
      <Card style={{background: 'rgba(3, 18, 38, 0.8)', border: '1px solid rgba(192, 134, 58, 0.2)'}}>
        <CardHeader>
          <CardTitle style={{color: '#FFFFFF'}}>
            Extrato Cartão de Crédito
            {extratoData.length > 0 && (
              <span style={{color: 'rgba(255, 255, 255, 0.6)'}} className="text-sm font-normal ml-2">
                ({extratoData.length} transações)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{borderColor: '#C0863A'}}></div>
              <span style={{color: 'rgba(255, 255, 255, 0.6)'}} className="ml-2">Carregando dados...</span>
            </div>
          ) : error ? (
            <div style={{color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)'}} className="p-4 rounded">
              Erro ao carregar dados: {error instanceof Error ? error.message : 'Erro desconhecido'}
            </div>
          ) : extratoData.length === 0 ? (
            <div style={{color: 'rgba(255, 255, 255, 0.6)'}} className="text-center py-8">
              Nenhuma transação encontrada com os filtros aplicados
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow style={{borderColor: 'rgba(192, 134, 58, 0.1)'}}>
                      <TableHead style={{color: 'rgba(255, 255, 255, 0.7)'}}>Nome</TableHead>
                      <TableHead style={{color: 'rgba(255, 255, 255, 0.7)'}}>CPF/CNPJ</TableHead>
                      <TableHead style={{color: 'rgba(255, 255, 255, 0.7)'}}>Tipo</TableHead>
                      <TableHead style={{color: 'rgba(255, 255, 255, 0.7)'}}>Data Transação</TableHead>
                      <TableHead style={{color: 'rgba(255, 255, 255, 0.7)'}}>Descrição</TableHead>
                      <TableHead style={{color: 'rgba(255, 255, 255, 0.7)'}} className="text-right">Valor</TableHead>
                      <TableHead style={{color: 'rgba(255, 255, 255, 0.7)'}}>Tipo</TableHead>
                      <TableHead style={{color: 'rgba(255, 255, 255, 0.7)'}}>Data Fechamento</TableHead>
                      <TableHead style={{color: 'rgba(255, 255, 255, 0.7)'}}>Data Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((item, index) => (
                      <ExtratoTableRow
                        key={`${item.cpf_cnpj}-${index}`}
                        item={item}
                        index={index}
                        copiedCell={copiedCell}
                        onCopy={handleCopy}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4" style={{borderTop: '1px solid rgba(192, 134, 58, 0.1)'}}>
                  <div style={{color: 'rgba(255, 255, 255, 0.6)'}} className="text-sm">
                    Página {currentPage} de {totalPages} • Total: {extratoData.length} transações
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      style={{
                        borderColor: 'rgba(192, 134, 58, 0.3)',
                        color: 'rgba(255, 255, 255, 0.6)'
                      }}
                      className="hover:opacity-80 disabled:opacity-50"
                    >
                      Anterior
                    </Button>
                    <Button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      style={{
                        borderColor: 'rgba(192, 134, 58, 0.3)',
                        color: 'rgba(255, 255, 255, 0.6)'
                      }}
                      className="hover:opacity-80 disabled:opacity-50"
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExtratoCartaoCredito;
