export interface StatementItem {
  id: string;
  date: string;
  description: string;
  type: 'credit' | 'debit';
  category: string;
  amount: number;
  balance: number;
  reference?: string;
  status: 'completed' | 'pending' | 'cancelled';
}

export const mockStatementData: StatementItem[] = [
  {
    id: '1',
    date: '2025-09-08',
    description: 'Comissão - Vendas Setembro',
    type: 'credit',
    category: 'Comissões',
    amount: 125000.00,
    balance: 850000.00,
    reference: 'COM-2025-09-001',
    status: 'completed'
  },
  {
    id: '2',
    date: '2025-09-07',
    description: 'Taxa Administrativa',
    type: 'debit',
    category: 'Taxas',
    amount: 5000.00,
    balance: 725000.00,
    reference: 'TAX-2025-09-007',
    status: 'completed'
  },
  {
    id: '3',
    date: '2025-09-06',
    description: 'Recebimento de Parcela - Cliente XYZ',
    type: 'credit',
    category: 'Recebimentos',
    amount: 75000.00,
    balance: 730000.00,
    reference: 'REC-2025-09-006',
    status: 'completed'
  },
  {
    id: '4',
    date: '2025-09-05',
    description: 'Repasse para Correspondente',
    type: 'debit',
    category: 'Repasses',
    amount: 45000.00,
    balance: 655000.00,
    reference: 'REP-2025-09-005',
    status: 'completed'
  },
  {
    id: '5',
    date: '2025-09-04',
    description: 'Comissão - Crédito Consignado',
    type: 'credit',
    category: 'Comissões',
    amount: 89000.00,
    balance: 700000.00,
    reference: 'COM-2025-09-004',
    status: 'pending'
  },
  {
    id: '6',
    date: '2025-09-03',
    description: 'Pagamento de Fornecedores',
    type: 'debit',
    category: 'Operacional',
    amount: 25000.00,
    balance: 611000.00,
    reference: 'PAG-2025-09-003',
    status: 'completed'
  },
  {
    id: '7',
    date: '2025-09-02',
    description: 'Recebimento - Financiamento Imobiliário',
    type: 'credit',
    category: 'Recebimentos',
    amount: 150000.00,
    balance: 636000.00,
    reference: 'REC-2025-09-002',
    status: 'completed'
  },
  {
    id: '8',
    date: '2025-09-01',
    description: 'Taxa de Manutenção Sistema',
    type: 'debit',
    category: 'Tecnologia',
    amount: 8000.00,
    balance: 486000.00,
    reference: 'TEC-2025-09-001',
    status: 'completed'
  }
];

export const statementSummary = {
  totalCredits: 439000.00,
  totalDebits: 83000.00,
  netFlow: 356000.00,
  currentBalance: 850000.00,
  previousBalance: 577000.00,
  transactionCount: 8,
  period: {
    start: '2025-09-01',
    end: '2025-09-08'
  }
};