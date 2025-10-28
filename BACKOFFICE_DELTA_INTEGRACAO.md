# Integração Backoffice Delta - Gerenciamento de Limites PIX

## Visão Geral
Esta documentação descreve a integração do módulo **Backoffice Delta** ao Sistema Delta Navigator, com foco na gestão de limites PIX.

## Arquitetura

### 📁 Estrutura de Arquivos Criados

```
src/
├── services/
│   └── pixLimitService.ts          # Serviço de integração com API
├── components/
│   └── backoffice/
│       ├── AlterarLimitePix.tsx    # Componente de alteração de limites
│       └── GerenciarSolicitacoes.tsx # Componente de gerenciamento
├── pages/
│   └── BackofficeDeltatype.tsx     # Página principal do Backoffice
```

## Funcionalidades Implementadas

### 1. **Alterar Limite PIX** ✅
- Página: `/backoffice-delta`
- **Funcionalidades:**
  - Carrega limites atuais da conta PIX
  - Permite configurar limites em 3 categorias:
    - PIX Interno
    - PIX Externo
    - Saque PIX
  - Cada categoria possui:
    - Limite Diurno
    - Limite Noturno
    - Limite por Transação (Diurno e Noturno)
    - Hora de início do período noturno
  - Salva as alterações na API

### 2. **Gerenciar Solicitações de Aumento** ✅
- Visualiza todas as solicitações pendentes
- Permite:
  - **Aprovar** solicitações
  - **Recusar** solicitações (com justificativa)
- Exibe informações detalhadas:
  - CPF/CNPJ do cliente
  - Valor solicitado
  - Data/Hora da solicitação
  - Turno (Diurno/Noturno)
  - Tipo de cobertura (PIX/Transferência)
  - Status atual

## Endpoints da API Integrados

### 1. Buscar Limite PIX
```
GET /conta-digital/api/v1/accounts/{accountId}/pix/getLimit
Headers: x-api-key: 1a6109b1-096c-4e59-9026-6cd5d3caa16d
```

### 2. Alterar Limite PIX
```
PUT /conta-digital/api/v1/accounts/{accountId}/pix/limit
Body: {
  "pixLimitInternal": {...},
  "pixLimitExternal": {...},
  "pixLimitWithdraw": {...}
}
```

### 3. Buscar Solicitações de Aumento
```
GET /conta-digital/api/v1/accounts/pix/limit/getRaiseLimitRequests
Params: status=S&accountId={accountId}
```

### 4. Processar Solicitação
```
PUT /conta-digital/api/v1/accounts/pix/limit/processLimitRequest
Body: {
  "status": "A" | "N",
  "requestId": number,
  "rejectionReason": string
}
```

## Serviço: pixLimitService

Localização: `src/services/pixLimitService.ts`

### Métodos Disponíveis

```typescript
// Buscar limite PIX atual
pixLimitService.getPixLimit(accountId: number): Promise<PixLimitResponse>

// Atualizar limite PIX
pixLimitService.updatePixLimit(
  accountId: number,
  pixLimitData: PixLimitResponse
): Promise<PixLimitResponse>

// Buscar solicitações de aumento
pixLimitService.getRaiseLimitRequests(
  accountId: number,
  status?: string
): Promise<RaiseLimitResponse>

// Processar solicitação (aprovar ou recusar)
pixLimitService.processLimitRequest(
  payload: ProcessLimitRequestPayload
): Promise<any>
```

### Tipos de Dados

```typescript
interface PixLimit {
  startNightTime: string;          // Formato: "HH:MM:SS"
  dayLimit: number;                // Em reais
  dayTransactionLimit: number;     // Em reais
  nightLimit: number;              // Em reais
  nightTransactionLimit: number;   // Em reais
  status: number;
}

interface PixLimitResponse {
  pixLimitInternal: PixLimit;
  pixLimitExternal: PixLimit;
  pixLimitWithdraw: PixLimit;
}

interface RaiseLimitRequest {
  id: number;
  accountControlLimitId: number;
  requestedValue: number;
  requestDateTime: string;
  coverage: string;                // "P" | "T"
  shift: string;                   // "D" | "N"
  status: string;                  // "S" | "A" | "N"
  statusBackOffice: string;
  rejectionReason: string | null;
  notified: boolean;
  accountId: number;
  document: string;                // CPF/CNPJ
}

interface ProcessLimitRequestPayload {
  status: 'A' | 'N';               // A = Aprovar, N = Recusar
  requestId: number;
  rejectionReason: string;
}
```

## Componentes

### AlterarLimitePix
**Localização:** `src/components/backoffice/AlterarLimitePix.tsx`

- Exibe interface com abas para cada tipo de limite
- Permite edição de todos os campos
- Carrega dados iniciais e permite recarregar
- Valida e salva as alterações
- Notificações de sucesso/erro via toast

### GerenciarSolicitacoes
**Localização:** `src/components/backoffice/GerenciarSolicitacoes.tsx`

- Lista todas as solicitações pendentes
- Filtro por documento, ID ou valor
- Interface clara com status códigos
- Ações inline (Aprovar/Recusar)
- Campo de justificativa para recusas
- Notificações em tempo real

## Página Principal

**Localização:** `src/pages/BackofficeDeltatype.tsx`

- Interface unificada com abas
- Estatísticas rápidas (funcionalidades, status, versão)
- Help section com dicas de uso
- Design responsivo e intuitivo
- Integração com toast notifications

## Navegação

### Sidebar Update
O componente Sidebar foi atualizado com:

- **Novo Grupo:** "Backoffice Delta"
- **Ícone:** Settings (gear icon)
- **Cor:** Vermelho (#FF6B6B)
- **Item:** "Alterar Limite PIX"
- **Badge:** 🔧 Novo

### Rotas Adicionadas
- `GET /backoffice-delta` → BackofficeDelta component

## Configuração da API

### Base URL
```
https://api-v2.conta-digital.paysmart.com.br/
```

### Headers Padrão
```
x-api-key: 1a6109b1-096c-4e59-9026-6cd5d3caa16d
Content-Type: application/json
```

### Autenticação
- Baseada em API Key no header `x-api-key`
- Pode ser expandida para suportar certificados SSL (CRT/Private Key)

## Fluxos de Negócio

### Fluxo 1: Alterar Limite PIX
1. Usuário acessa `/backoffice-delta`
2. Sistema carrega limites atuais via `getPixLimit`
3. Usuário edita os limites desejados
4. Clica em "Salvar Alterações"
5. Sistema envia via `updatePixLimit`
6. Confirmação visual ao usuário

### Fluxo 2: Gerenciar Solicitações
1. Usuário acessa aba "Solicitações"
2. Sistema carrega via `getRaiseLimitRequests`
3. Usuário seleciona uma solicitação
4. Usuário clica em "Aprovar" ou "Recusar"
5. Se recusar, adiciona justificativa
6. Sistema processa via `processLimitRequest`
7. Solicitação removida da lista
8. Confirmação visual ao usuário

## Estados e Transições

### Status de Solicitação
- **S (Solicitado):** Pendente de análise
- **A (Aprovado):** Solicitação foi aprovada
- **N (Negado):** Solicitação foi recusada

### Cobertura
- **P (PIX):** Transferência PIX
- **T (TEDTransferência):** Transferência bancária

### Turno
- **D (Diurno):** 00:00:00 até hora configurada
- **N (Noturno):** Hora configurada até 23:59:59

## Tratamento de Erros

O serviço implementa:
- ✅ Try-catch em todas as chamadas
- ✅ Logging em console
- ✅ Notificações ao usuário
- ✅ Estados de loading/erro na UI
- ✅ Retry automático disponível

## Performance e Otimizações

- ✅ Loading states para melhor UX
- ✅ Validação de dados antes de envio
- ✅ Cache implícito via React state
- ✅ Formatação de moeda (BRL)
- ✅ Timestamps formatados (pt-BR)

## Segurança

- ✅ API Key armazenada no serviço (pode ser movida para env)
- ✅ Validação de tipos TypeScript
- ✅ Proteção de rota via `ProtectedRoute`
- ✅ HTTPS para todas as requisições
- ✅ Suporte para certificados SSL (estrutura pronta)

## Próximas Melhorias

1. **Certificados SSL:**
   - Integrar CRT e Private Key para autenticação mTLS
   - Configurar axios para usar certificados

2. **Paginação:**
   - Implementar paginação para solicitações com muitos itens
   - Adicionar "Carregar Mais"

3. **Filtros Avançados:**
   - Filtro por data
   - Filtro por status
   - Filtro por turno

4. **Exportação:**
   - Exportar solicitações para CSV/PDF
   - Gerar relatórios

5. **Auditoria:**
   - Log de todas as ações
   - Histórico de alterações
   - Rastreamento de quem fez o quê

6. **Validação:**
   - Validação de horários (noturno não pode ser após 23:59)
   - Validação de limites (mínimo e máximo)
   - Alertas de inconsistência

## Testes

Para testar a integração:

### 1. Teste Local
```bash
npm run dev
# Acesse http://localhost:5173/backoffice-delta
```

### 2. Teste com Curl
```bash
# Buscar limite
curl -H "x-api-key: 1a6109b1-096c-4e59-9026-6cd5d3caa16d" \
  https://api-v2.conta-digital.paysmart.com.br/conta-digital/api/v1/accounts/158/pix/getLimit

# Processar solicitação
curl -X PUT \
  -H "x-api-key: 1a6109b1-096c-4e59-9026-6cd5d3caa16d" \
  -H "Content-Type: application/json" \
  -d '{"status":"A","requestId":550,"rejectionReason":""}' \
  https://api-v2.conta-digital.paysmart.com.br/conta-digital/api/v1/accounts/pix/limit/processLimitRequest
```

## Deploy

1. Certifique-se de que `axios` está instalado
2. Build: `npm run build`
3. Deploy: Segue o pipeline padrão
4. Verificar variáveis de ambiente se necessário

## Suporte

Para dúvidas ou problemas:
- Verificar console do navegador (F12)
- Verificar resposta da API
- Validar API Key
- Confirmar CORS (se aplicável)

---

**Versão:** 1.0.0  
**Data:** Outubro 2025  
**Autor:** Delta Global Bank - Equipe de Desenvolvimento
