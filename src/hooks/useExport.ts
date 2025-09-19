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

  return {
    exportToPDF,
    exportToExcel
  };
};
