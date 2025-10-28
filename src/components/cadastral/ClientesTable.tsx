import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getClientesCadastral, ClienteCadastral } from '@/data/cadastralApi';
import { Search, Mail, MapPin, DollarSign, ChevronUp, ChevronDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ClienteDetailModal } from './ClienteDetailModal';

interface ClientesTableProps {
  dataInicio: string;
  dataFim: string;
  onDataInicioChange: (value: string) => void;
  onDataFimChange: (value: string) => void;
}

export function ClientesTable({ dataInicio, dataFim, onDataInicioChange, onDataFimChange }: ClientesTableProps) {
  const [clientes, setClientes] = useState<ClienteCadastral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<ClienteCadastral | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Converter datas do formato YYYY-MM-DD para DD/MM/YYYY
        const formatDate = (dateStr: string) => {
          if (!dateStr) return undefined;
          const parts = dateStr.split('-');
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        };
        
        const response = await getClientesCadastral(
          debouncedSearch || undefined, 
          undefined, 
          500,
          formatDate(dataInicio),
          formatDate(dataFim)
        );
        setClientes(response.clientes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar clientes');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [debouncedSearch, dataInicio, dataFim]);

  const getStatusColor = (status: string) => {
    if (status.toLowerCase().includes('ativo')) return 'bg-green-500/10 text-green-700 dark:text-green-400';
    if (status.toLowerCase().includes('inativo')) return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
  };

  const handleClienteClick = (cliente: ClienteCadastral) => {
    setSelectedCliente(cliente);
    setIsModalOpen(true);
  };

  const handleSortById = () => {
    if (sortOrder === null || sortOrder === 'desc') {
      setSortOrder('asc');
    } else {
      setSortOrder('desc');
    }
  };

  // Aplicar ordenação
  const sortedClientes = sortOrder 
    ? [...clientes].sort((a, b) => {
        const aId = parseInt(a.account_id);
        const bId = parseInt(b.account_id);
        if (sortOrder === 'asc') {
          return aId - bId;
        } else {
          return bId - aId;
        }
      })
    : clientes;

  return (
    <Card className="border-0 bg-transparent">
      <CardHeader className="pb-8 px-8 pt-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            <CardTitle style={{ color: '#FFF', fontSize: '1.75rem' }}>
              Clientes Cadastrados
            </CardTitle>
            <CardDescription className="text-gray-300 mt-2 text-base">
              {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} encontrado{clientes.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="🔍 Buscar por nome, CPF/CNPJ ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 py-4 bg-gray-900/50 border-2 text-white placeholder:text-gray-400 text-base"
              style={{
                borderColor: '#C48A3F'
              }}
            />
          </div>
          
          {/* Filtros de Data */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data Início
              </label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => onDataInicioChange(e.target.value)}
                className="py-3 bg-gray-900/50 border-2 text-white"
                style={{
                  borderColor: '#C48A3F'
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data Fim
              </label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => onDataFimChange(e.target.value)}
                className="py-3 bg-gray-900/50 border-2 text-white"
                style={{
                  borderColor: '#C48A3F'
                }}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  onDataInicioChange('');
                  onDataFimChange('');
                  setSearch('');
                }}
                className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors border-2"
                style={{
                  borderColor: '#C48A3F'
                }}
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-8 pb-8">
        {error && (
          <div className="text-center text-red-400 py-12 text-base">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-400 text-lg">⏳ Carregando clientes...</p>
          </div>
        ) : clientes.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-400 text-lg">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg">
            <Table>
              <TableHeader>
                <TableRow style={{ borderBottomColor: 'rgba(196, 138, 63, 0.3)', backgroundColor: 'rgba(196, 138, 63, 0.12)' }}>
                  <TableHead 
                    style={{ 
                      color: '#C48A3F', 
                      fontWeight: '700', 
                      fontSize: '0.95rem', 
                      padding: '1rem',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                    onClick={handleSortById}
                    className="hover:bg-orange-500/10 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2">
                      ID
                      {sortOrder === 'asc' && <ChevronUp className="h-4 w-4" />}
                      {sortOrder === 'desc' && <ChevronDown className="h-4 w-4" />}
                      {sortOrder === null && <div className="h-4 w-4" />}
                    </div>
                  </TableHead>
                  <TableHead style={{ color: '#C48A3F', fontWeight: '700', fontSize: '0.95rem', padding: '1rem' }}>Nome</TableHead>
                  <TableHead style={{ color: '#C48A3F', fontWeight: '700', fontSize: '0.95rem', padding: '1rem' }}>CPF/CNPJ</TableHead>
                  <TableHead style={{ color: '#C48A3F', fontWeight: '700', fontSize: '0.95rem', padding: '1rem' }}>Email</TableHead>
                  <TableHead style={{ color: '#C48A3F', fontWeight: '700', fontSize: '0.95rem', padding: '1rem' }}>Conta</TableHead>
                  <TableHead style={{ color: '#C48A3F', fontWeight: '700', fontSize: '0.95rem', padding: '1rem' }}>Status</TableHead>
                  <TableHead style={{ color: '#C48A3F', fontWeight: '700', fontSize: '0.95rem', padding: '1rem', textAlign: 'right' }}>Crédito Liberado</TableHead>
                  <TableHead style={{ color: '#C48A3F', fontWeight: '700', fontSize: '0.95rem', padding: '1rem' }}>Data Criação</TableHead>
                  <TableHead style={{ color: '#C48A3F', fontWeight: '700', fontSize: '0.95rem', padding: '1rem' }}>Localização</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedClientes.map((cliente) => (
                  <TableRow 
                    key={cliente.account_id} 
                    className="hover:bg-gray-900/30 transition-colors duration-200 cursor-pointer"
                    style={{ borderBottomColor: 'rgba(196, 138, 63, 0.15)' }}
                    onClick={() => handleClienteClick(cliente)}
                  >
                    <TableCell className="font-mono text-sm text-gray-400 py-5 px-4">{cliente.account_id}</TableCell>
                    <TableCell className="font-semibold text-white py-5 px-4 text-base">{cliente.nome}</TableCell>
                    <TableCell className="font-mono text-sm text-gray-300 py-5 px-4">{cliente.cpf_cnpj}</TableCell>
                    <TableCell className="py-5 px-4">
                      <a
                        href={`mailto:${cliente.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors text-sm"
                      >
                        <Mail className="h-4 w-4" />
                        <span className="hover:underline">{cliente.email}</span>
                      </a>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-gray-300 py-5 px-4">{cliente.numero_da_conta}</TableCell>
                    <TableCell className="py-5 px-4">
                      <Badge 
                        className={`py-2 px-4 text-sm font-semibold ${
                          cliente.status_conta.toLowerCase().includes('desbloqueado')
                            ? 'bg-green-900 text-green-200'
                            : 'bg-red-900 text-red-200'
                        }`}
                      >
                        {cliente.status_conta}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-white py-5 px-4 text-base">
                      <div className="flex items-center justify-end gap-2">
                        <DollarSign className="h-4 w-4" style={{ color: '#C48A3F' }} />
                        {parseFloat(String(cliente.credit_limit)).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-gray-300 py-5 px-4">
                      {cliente.data_criacao || 'N/A'}
                    </TableCell>
                    <TableCell className="py-5 px-4">
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <MapPin className="h-4 w-4" style={{ color: '#C48A3F' }} />
                        <span>
                          {cliente.cidade}, {cliente.estado}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <ClienteDetailModal 
        cliente={selectedCliente} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </Card>
  );
}
