# 🔧 Troubleshooting - Cadastral

## ❌ Problemas Comuns e Soluções

### 1. "Página Cadastral não aparece no menu"

**Sintomas**: 
- Menu Delta Global Bank existe
- Mas "Cadastral" não está lá

**Causa Provável**: Sidebar não carregou a mudança

**Solução**:
```bash
# 1. Limpe o cache do navegador
Ctrl + Shift + Delete (no navegador)

# 2. Hard refresh
Ctrl + Shift + R

# 3. Se ainda não funcionar, verificar arquivo:
cat src/components/layout/Sidebar.tsx | grep -i cadastral
```

---

### 2. "Erro 404 na rota /cadastral"

**Sintomas**:
- Menu clicável, mas página não carrega
- Erro: "Cannot find module or route not found"

**Causa Provável**: 
- App.tsx não foi modificado corretamente
- Arquivo Cadastral.tsx não existe

**Solução**:
```bash
# 1. Verificar arquivo existe
ls src/pages/Cadastral.tsx

# 2. Verificar importação em App.tsx
grep "import Cadastral" src/App.tsx
grep "/cadastral" src/App.tsx

# 3. Se não estiver, adicione manualmente em App.tsx:
# No topo, com outros imports:
import Cadastral from "./pages/Cadastral";

# Na seção de rotas:
<Route path="/cadastral" element={<Cadastral />} />
```

---

### 3. "API retorna erro 500"

**Sintomas**:
- Página carrega mas sem dados
- Console mostra erro HTTP 500

**Causa Provável**:
- Backend não iniciado
- Banco de dados não acessível
- Query SQL com erro

**Solução**:
```bash
# 1. Verificar se backend está rodando
curl http://localhost:3003/api/cadastral/estatisticas

# 2. Se não funcionar, iniciar:
cd extrato-server
node server.js

# 3. Verificar conexão com banco:
# No servidor, você deve ver na console:
# "Connection successful"

# 4. Testar query manualmente:
# Use DBeaver ou psql:
SELECT COUNT(*) FROM dim_account;
```

---

### 4. "Nenhum dado exibindo na tabela"

**Sintomas**:
- Página carrega
- KPIs aparecem
- Mas tabela/mapa vazios

**Causa Provável**:
- Sem registros no banco
- Query SQL retorna 0 registros

**Solução**:
```sql
-- Verificar se tem dados:
SELECT COUNT(*) as total FROM dim_account;

-- Se retornar 0, precisam inserir dados
-- Verificar tabelas relacionadas:
SELECT COUNT(*) FROM dim_account_address;
SELECT COUNT(*) FROM fact_account_limit_snapshot;

-- Se alguma estiver vazia, migrar dados
-- Consultar: SUPABASE_AUTH_GUIDE.md
```

---

### 5. "Erro: Cannot find module 'cadastralApi'"

**Sintomas**:
- Erro no console
- TypeScript error
- Página não carrega

**Causa Provável**:
- Arquivo cadastralApi.ts não criado
- Path incorreto no import

**Solução**:
```bash
# 1. Verificar arquivo existe
ls src/data/cadastralApi.ts

# 2. Se não existir, criar:
touch src/data/cadastralApi.ts

# 3. Copiar conteúdo de:
# CADASTRAL_IMPLEMENTATION.md seção "API Client"
```

---

### 6. "Busca muito lenta"

**Sintomas**:
- Demora vários segundos para filtrar
- Muitas requisições simultâneas

**Causa Provável**:
- Debounce não funcionando
- Banco de dados lento
- Sem índices nas colunas

**Solução**:
```javascript
// Frontend - verificar debounce em ClientesTable.tsx:
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(search);
  }, 500); // 500ms é correto
  
  return () => clearTimeout(timer);
}, [search]);

// Backend - criar índices (SQL):
CREATE INDEX idx_dim_account_name ON dim_account(personal_name);
CREATE INDEX idx_dim_account_doc ON dim_account(personal_document);
CREATE INDEX idx_dim_account_email ON dim_account(email);
CREATE INDEX idx_dim_account_address_state ON dim_account_address(state);
```

---

### 7. "Erro: 'Cannot read property of undefined'"

**Sintomas**:
- Console mostra erro JavaScript
- Componente não renderiza
- Página branca ou com erro

**Causa Provável**:
- Resposta da API diferente do esperado
- Campo não existe nos dados

**Solução**:
```bash
# 1. Abrir DevTools (F12)
# 2. Verificar aba Network
# 3. Clicar em requisição /api/cadastral/*
# 4. Ver o JSON retornado
# 5. Comparar com interfaces em cadastralApi.ts

# 6. Se estrutura diferente, atualizar interface:
interface ClienteCadastral {
  account_id: string; // Verificar nomes
  nome: string;
  // ... outros campos
}
```

---

### 8. "Filtro por estado não funciona"

**Sintomas**:
- Clica em estado mas nada muda
- Dados continuam os mesmos

**Causa Provável**:
- onClick handler não atualiza state
- Requisição não enviando parâmetro

**Solução**:
```typescript
// Em Cadastral.tsx, verificar:
<button
  onClick={() => setSelectedEstado(estado)} // Deve estar assim
  className={...}
>
  {estado}
</button>

// E no componente filho:
<MapaCidadesCard estado={selectedEstado} /> // Pass prop
<ClientesTable estado={selectedEstado} />   // Pass prop

// Verificar que componentes usam a prop:
useEffect(() => {
  fetchData(estado); // Estado deve ser usado aqui
}, [estado]); // E aqui no dependency array
```

---

### 9. "Cache muito agressivo, dados antigos"

**Sintomas**:
- Atualiza dados no banco
- Aplicação mostra dados antigos
- Demora 30 segundos para atualizar

**Causa Provável**:
- Cache backend com TTL 30s

**Solução**:
```bash
# Opção 1: Aguardar 30 segundos (cache expira)

# Opção 2: Hard refresh (Ctrl + Shift + R)

# Opção 3: Reduzir TTL em extrato-server/server.js:
const CACHE_TTL = 10000; // 10 segundos ao invés de 30

# Opção 4: Desabilitar cache (desenvolvimento):
const CACHE_TTL = 0; // Sem cache
```

---

### 10. "Erro de CORS"

**Sintomas**:
- Console: "Access to XMLHttpRequest blocked by CORS"
- Requisições falhando

**Causa Provável**:
- Backend CORS não configurado para seu host

**Solução**:
```javascript
// Em extrato-server/server.js, verificar CORS:
app.use(cors({ 
  origin: [
    'http://localhost:3000',
    /^http:\/\/192\.168\.\d+\.\d+:3000$/, // Seu IP?
    /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:3000$/
  ], 
  credentials: true 
}));

// Se ainda não funcionar, adicione seu IP:
origin: [
  'http://localhost:3000',
  'http://192.168.1.X:3000', // Seu IP específico
]
```

---

### 11. "Componentes não renderizando"

**Sintomas**:
- Apenas KPIs aparecem
- Mapa e tabela vazios
- Sem mensagens de erro

**Causa Provável**:
- Componentes importados errado
- Props não passadas
- Estado loading infinito

**Solução**:
```bash
# 1. Verificar imports em Cadastral.tsx:
grep "import.*Cadastral" src/pages/Cadastral.tsx
# Deve ter 3 linhas:
# - EstatisticasCadastralKPIs
# - MapaCidadesCard  
# - ClientesTable

# 2. Verificar pasta existe:
ls -la src/components/cadastral/

# 3. Verificar todos 3 arquivos:
ls src/components/cadastral/*.tsx
```

---

### 12. "Erro: address already in use :3003"

**Sintomas**:
- Backend não inicia
- "Error: listen EADDRINUSE: address already in use :::3003"

**Causa Provável**:
- Porta 3003 já em uso
- Processo anterior ainda rodando

**Solução**:
```bash
# Windows - Encontrar processo na porta:
netstat -ano | findstr :3003

# Matar processo (substitua PID):
taskkill /PID <PID> /F

# Ou mudar porta em extrato-server/server.js:
const port = process.env.SERVER_PORT || 3001; // Mudar de 3003

# Ou em .env:
SERVER_PORT=3002
```

---

### 13. "Dados muito grandes, página lenta"

**Sintomas**:
- Tabela com 500 registros
- Página demora para scrollar
- Freezes frequentes

**Causa Provável**:
- Sem virtualização de lista
- Renderizando todos os 500 itens

**Solução**:
```javascript
// Opção 1: Reduzir límite
// Em cadastralApi.ts:
const limite = parseInt(limite) || 250; // Era 500

// Opção 2: Implementar paginação
// Adicionar query param: ?page=1&pageSize=50

// Opção 3: Usar react-window para virtualização
// npm install react-window
// Implementar em ClientesTable.tsx (próxima fase)
```

---

### 14. "TypeScript errors mesmo com código correto"

**Sintomas**:
- Squiggly lines vermelhas no VSCode
- `npm run build` falha
- Mas `npm run dev` funciona

**Causa Provável**:
- tsconfig.json desatualizado
- Tipos TypeScript não alinhados

**Solução**:
```bash
# 1. Limpar cache TypeScript
rm -rf node_modules/.vite
rm -rf dist

# 2. Reinstalar deps
npm install

# 3. Se ainda não funcionar, verificar tipos em cadastralApi.ts:
# Garantir que todas interfaces estão exportadas:
export interface ClienteCadastral { ... }
export interface MapaCidade { ... }
export interface EstatisticasCadastral { ... }
```

---

### 15. "Erro de autenticação ao acessar página"

**Sintomas**:
- Redireciona para login
- Não consegue acessar /cadastral

**Causa Provável**:
- ProtectedRoute não reconhece usuário autenticado
- Token expirado

**Solução**:
```bash
# 1. Verificar se está autenticado
# Abrir DevTools > Application > Cookies
# Procurar por token/session

# 2. Se não existir, fazer login novamente

# 3. Se já existe mas não funciona:
# Limpar cookies e fazer login novamente

# 4. Verificar em App.tsx se ProtectedRoute está correto:
<ProtectedRoute>
  <Layout>
    <Routes>
      <Route path="/cadastral" element={<Cadastral />} />
    </Routes>
  </Layout>
</ProtectedRoute>
```

---

## 📋 Checklist de Diagnóstico

Quando algo não funciona, execute este checklist:

- [ ] Verificar console do navegador (F12)
- [ ] Verificar aba Network (requisições HTTP)
- [ ] Verificar se backend está rodando (port 3003)
- [ ] Verificar se banco de dados está acessível
- [ ] Verificar se todos arquivos foram criados
- [ ] Verificar se todas mudanças foram aplicadas
- [ ] Hard refresh (Ctrl + Shift + R)
- [ ] Limpar cache do navegador
- [ ] Reiniciar servidor backend
- [ ] Reiniciar servidor frontend
- [ ] Verificar arquivo de logs
- [ ] Testar com outro navegador
- [ ] Testar em modo privado/anônimo

## 📞 Suporte

Se nenhuma solução funcionou:

1. **Anote o erro exato** (do console)
2. **Tire um screenshot**
3. **Verifique os logs**
4. **Consulte**: CADASTRAL_IMPLEMENTATION.md
5. **Abra uma issue** com os detalhes

---

**Status**: ✅ Guia Completo  
**Última atualização**: Outubro 2025  
**Versão**: 1.0
