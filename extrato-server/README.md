# Servidor de Extrato

Este servidor fornece dados de extrato bancário conectando-se ao banco PostgreSQL específico.

## Configuração

1. **Instalar dependências:**
```bash
cd extrato-server
npm install
```

2. **Configurar variáveis de ambiente:**
O arquivo `.env` já está configurado com:
```
HOST=10.174.1.116
PORT=5432
DB=postgres
USER=postgres
PASSWORD=XwrNUm9YshZsdQxQ
SERVER_PORT=3003
```

3. **Iniciar o servidor:**
```bash
# A partir do diretório raiz:
npm run server:extrato

# Ou diretamente no diretório do servidor:
cd extrato-server
npm start
```

## Endpoints Disponíveis

### 1. Teste de Conexão
- **GET** `/api/test`
- Verifica se a conexão com o banco está funcionando

### 2. Buscar Extrato
- **GET** `/api/statement`
- Parâmetros opcionais:
  - `startDate`: Data inicial (YYYY-MM-DD)
  - `endDate`: Data final (YYYY-MM-DD)
  - `personalDocument`: CPF/CNPJ
- Retorna lista de transações do extrato

### 3. Resumo do Extrato
- **GET** `/api/statement/summary`
- Parâmetros opcionais: mesmos do endpoint anterior
- Retorna resumo com totais e estatísticas

## Estrutura da Query

O servidor executa a seguinte query principal:

```sql
select 
    da.personal_name 
    ,da.personal_document 
    ,da.email 
    ,da.status_description
    ,to_char(fas.transaction_date, 'DD/MM/YYYY') as transaction_date
    ,fas."type"
    ,fas.description 
    ,fas.amount 
    ,fas.saldo_posterior 
    ,fas.recipients_name as beneficiario
    ,fas.recipients_bank as banco_beneficiario
    ,fas.senders_name as nome_pagador
from paysmart.dim_account as da
inner join paysmart.fct_account_statement fas
    on da.account_id = fas.account_id
where 1=1
ORDER BY fas.transaction_date DESC, fas.amount DESC
```

**Observação:** As tabelas estão no schema `paysmart`.

## Integração com Frontend

O frontend usa React Query para consumir esses dados. Os componentes estão localizados em:
- `src/pages/Statement.tsx` - Página principal do extrato
- `src/data/statementApi.ts` - Funções de API
- `src/components/statement/` - Componentes relacionados

## Desenvolvimento

Para executar em modo de desenvolvimento com hot reload:
```bash
cd extrato-server
npm run dev
```
