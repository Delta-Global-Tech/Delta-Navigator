import React from 'react';
import { StatementItem } from '@/data/mockStatement';

interface StatementTableProps {
  data: StatementItem[];
  onExport?: () => void;
}

export function StatementTable({ data, onExport }: StatementTableProps) {
  // Este componente agora é simplificado, pois a tabela foi movida para a página principal
  return null;
}