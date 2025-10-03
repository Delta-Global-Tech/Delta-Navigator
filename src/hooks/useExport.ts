import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { StatementItem } from '../data/statementApi';

export const useExport = () => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const exportToPDF = (data: StatementItem[], fileName: string = 'extrato-executivo') => {
    const pdf = new jsPDF();
    
    // Título
    pdf.setFontSize(16);
    pdf.text('Extrato Executivo', 14, 15);
    
    // Data do relatório
    pdf.setFontSize(10);
    pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 25);
    
    // Preparar dados para a tabela
    const tableData = data.map((item) => {
      let pagador = item.nome_pagador || '-';
      let beneficiario = item.beneficiario || '-';
      
      if (item.description.toLowerCase().includes('pix')) {
        if (item.type === 'debit') {
          pagador = item.personal_name;
          beneficiario = item.beneficiario || '-';
        } else if (item.type === 'credit') {
          pagador = item.nome_pagador || '-';
          beneficiario = item.personal_name;
        }
      }
      
      return [
        item.personal_name,
        item.type === 'credit' ? 'Crédito' : 'Débito',
        item.pix_free_description || '-',
        pagador,
        beneficiario,
        formatCurrency(Math.abs(parseFloat(item.amount))),
        item.transaction_date
      ];
    });

    // Gerar tabela
    autoTable(pdf, {
      head: [['Nome', 'Tipo', 'Descrição', 'Pagador', 'Beneficiário', 'Valor', 'Data']],
      body: tableData,
      startY: 35,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [33, 150, 243],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        2: { cellWidth: 40 }, // Descrição
        5: { halign: 'right' }, // Valor
        6: { cellWidth: 25 } // Data
      }
    });
    
    // Salvar arquivo
    pdf.save(`${fileName}.pdf`);
  };

  const exportToExcel = (data: StatementItem[], fileName: string = 'extrato-executivo') => {
    // Preparar dados para o Excel
    const excelData = data.map((item) => {
      let pagador = item.nome_pagador || '-';
      let beneficiario = item.beneficiario || '-';
      
      if (item.description.toLowerCase().includes('pix')) {
        if (item.type === 'debit') {
          pagador = item.personal_name;
          beneficiario = item.beneficiario || '-';
        } else if (item.type === 'credit') {
          pagador = item.nome_pagador || '-';
          beneficiario = item.personal_name;
        }
      }
      
      return {
        'Nome': item.personal_name,
        'Tipo Transação': item.type === 'credit' ? 'Crédito' : 'Débito',
        'Descrição': item.pix_free_description || '-',
        'Pagador': pagador,
        'Beneficiário': beneficiario,
        'Valor': parseFloat(item.amount),
        'Data': item.transaction_date,
        'Email': item.email,
        'Documento': item.personal_document,
        'Status': item.status_description,
        'Saldo Posterior': parseFloat(item.saldo_posterior),
        'Banco Beneficiário': item.banco_beneficiario || '-'
      };
    });

    // Criar workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Extrato Executivo');

    // Ajustar largura das colunas
    const wscols = [
      { wch: 25 }, // Nome
      { wch: 15 }, // Tipo
      { wch: 30 }, // Descrição
      { wch: 25 }, // Pagador
      { wch: 25 }, // Beneficiário
      { wch: 15 }, // Valor
      { wch: 20 }, // Data
      { wch: 30 }, // Email
      { wch: 15 }, // Documento
      { wch: 15 }, // Status
      { wch: 15 }, // Saldo Posterior
      { wch: 20 }  // Banco Beneficiário
    ];
    ws['!cols'] = wscols;

    // Gerar e salvar arquivo
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(dataBlob, `${fileName}.xlsx`);
  };

  const exportPropostasAberturaToPDF = (propostas: any[], estatisticas: any, fileName: string = 'propostas-abertura') => {
    const pdf = new jsPDF();
    
    // Título
    pdf.setFontSize(18);
    pdf.text('Relatório de Propostas de Abertura', 14, 20);
    
    // Data do relatório
    pdf.setFontSize(10);
    pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 30);
    
    // Estatísticas
    pdf.setFontSize(14);
    pdf.text('Resumo Estatístico', 14, 45);
    pdf.setFontSize(10);
    pdf.text(`Total de Propostas: ${estatisticas?.total || 0}`, 14, 55);
    pdf.text(`Aprovadas Automaticamente: ${estatisticas?.aprovadas_automaticamente || 0}`, 14, 62);
    pdf.text(`Aprovadas Manualmente: ${estatisticas?.aprovadas_manualmente || 0}`, 14, 69);
    pdf.text(`Reprovadas: ${estatisticas?.total_reprovadas || 0}`, 14, 76);
    pdf.text(`Outros Status: ${estatisticas?.outros || 0}`, 14, 83);
    
    // Preparar dados para a tabela
    const tableData = propostas.map((proposta) => [
      proposta.proposal_id || '-',
      proposta.document || '-',
      proposta.applicant_name || '-',
      proposta.proposed_at ? new Date(proposta.proposed_at).toLocaleDateString('pt-BR') : '-',
      proposta.status_desc || '-',
      proposta.status_description || '-'
    ]);
    
    // Adicionar tabela
    autoTable(pdf, {
      startY: 95,
      head: [['ID Proposta', 'Documento', 'Nome do Solicitante', 'Data da Proposta', 'Status da Proposta', 'Status da Conta']],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 30 },
        2: { cellWidth: 45 },
        3: { cellWidth: 25 },
        4: { cellWidth: 35 },
        5: { cellWidth: 30 }
      }
    });
    
    // Salvar PDF
    pdf.save(`${fileName}.pdf`);
  };

  return {
    exportToPDF,
    exportToExcel,
    exportPropostasAberturaToPDF
  };
};
