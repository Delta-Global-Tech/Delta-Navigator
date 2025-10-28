# 🔧 Exemplo Prático - Integração PIX v2.0

## 📝 Seu App.tsx Atual

Se seu `App.tsx` é algo assim:

```typescript
// ❌ ANTES
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import Users from '@/pages/Users';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
      </Routes>
    </Router>
  );
}

export default App;
```

---

## ✅ Seu App.tsx Modificado

Faça assim:

```typescript
// ✅ DEPOIS
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import Users from '@/pages/Users';

// ADICIONE ESTES IMPORTS
import DashboardPixV2 from '@/pages/DashboardPixV2';
import GerenciadorPixV2Page from '@/pages/GerenciadorPixV2Page';
import SolicitacoesPixV2Page from '@/pages/SolicitacoesPixV2Page';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />

        {/* ADICIONE ESTAS ROTAS */}
        <Route path="/backoffice/pix-v2" element={<DashboardPixV2 />} />
        <Route path="/backoffice/gerenciador-pix-v2" element={<GerenciadorPixV2Page />} />
        <Route path="/backoffice/solicitacoes-pix-v2" element={<SolicitacoesPixV2Page />} />
      </Routes>
    </Router>
  );
}

export default App;
```

---

## 🎯 Ponto de Entrada Recomendado

**Acesse primeiro o Dashboard:**

```
http://localhost:3000/backoffice/pix-v2
```

De lá você consegue acessar:
- **Gerenciador**: Para editar limites
- **Solicitações**: Para aprovar/rejeitar aumentos

---

## 🎨 Se Quiser Adicionar no Menu

Adicione links no seu menu/navbar:

```typescript
// Seu menu.tsx ou navbar.tsx
import { DollarSign, Settings, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function Menu() {
  return (
    <nav className="space-y-2">
      {/* Links existentes */}
      <Link to="/">Home</Link>
      <Link to="/users">Usuários</Link>

      {/* ADICIONE ESTES LINKS */}
      <div className="border-t pt-2 mt-2">
        <p className="text-xs text-gray-400 uppercase">PIX</p>
        
        <Link to="/backoffice/pix-v2" className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Dashboard PIX
        </Link>

        <Link to="/backoffice/gerenciador-pix-v2" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Gerenciador
        </Link>

        <Link to="/backoffice/solicitacoes-pix-v2" className="flex items-center gap-2">
          <ArrowUpRight className="h-4 w-4" />
          Solicitações
        </Link>
      </div>
    </nav>
  );
}

export default Menu;
```

---

## 💻 Testando no Navegador

1. **Inicie o servidor PIX** (se ainda não iniciou):
   ```bash
   # Na pasta do servidor
   npm run dev
   ```

2. **Inicie o frontend** (em outro terminal):
   ```bash
   # Na pasta do frontend
   npm run dev
   ```

3. **Acesse a página**:
   ```
   http://localhost:3000/backoffice/pix-v2
   ```

4. **Abra DevTools** (F12):
   - Vá para aba **Console**
   - Você verá logs como:
     ```
     🔄 Carregando dados PIX para accountId: 158
     ✅ Dados recebidos: {...}
     ```

5. **Digite um ID de conta** (ex: 158) e clique **"Carregar"**

6. **Os dados aparecerão em tempo real!**

---

## 🧪 O Que Você Vai Ver

### Na tela:
- ✅ Limite Interno (Dia e Noite)
- ✅ Limite Externo (Dia e Noite)
- ✅ Limite de Saque (Dia e Noite)
- ✅ Status de cada limite

### No console (F12):
```
🔄 Carregando dados PIX para accountId: 158
📤 [GET] /pix/limit/158
📥 [200] Resposta recebida
✅ Dados recebidos: {pixLimitInternal: {...}, ...}
```

### Na aba Network (F12):
```
GET http://localhost:3004/pix/limit/158
Status: 200 OK
Response: {pixLimitInternal: {...}}
```

---

## 🎮 Como Usar

### Para Visualizar Limites
1. Digite ID da conta
2. Clique "Carregar"
3. Dados aparecem na tela
4. Navegue pelas 3 abas

### Para Editar Limites
1. Clique na aba "Editar"
2. Clique "Editar Valores"
3. Modifique os campos
4. Clique "Salvar Alterações"
5. Toast mostra sucesso ou erro

### Para Gerenciar Solicitações
1. Vá para a aba "Solicitações" no Dashboard
2. Digite ID da conta
3. Clique "Carregar"
4. Aparecem as solicitações pendentes
5. Clique ✓ para aprovar ou ✕ para rejeitar

---

## 🐛 Se Der Erro

### Erro: "Cannot find module"
- Verifique se copou os arquivos corretamente
- Verifique se os caminhos dos imports estão certos
- Tente reiniciar o servidor (`npm run dev`)

### Erro: "Network Error"
1. Abra F12 → Network
2. Procure por requisições para `/pix/`
3. Verifique o Status Code
4. Se 404 → URL errada
5. Se 500 → Erro no servidor
6. Se "Connection refused" → Servidor não está rodando

### Erro: "Nada aparece na tela"
1. Abra F12 → Console
2. Procure por erro em vermelho
3. Copie o erro
4. Verifique se o ID é válido
5. Verifique se `.env` está correto

---

## ✨ Checklist Rápido

- [ ] Copiou os arquivos para as pastas certas?
- [ ] Adicionou os imports no `App.tsx`?
- [ ] Adicionou as rotas no `App.tsx`?
- [ ] Rodou `npm run dev`?
- [ ] Acessou `/backoffice/pix-v2`?
- [ ] Digitou ID 158 e clicou "Carregar"?
- [ ] Viu os dados na tela?
- [ ] Console (F12) mostra logs?

Se tudo acima ✅, **está funcionando!**

---

## 🚀 Agora Sim!

Você tem uma tela **100% funcional** e pronta para usar em produção!

- ✅ Gerencia limites PIX
- ✅ Processa solicitações
- ✅ Integrada ao seu projeto
- ✅ Com debug incluído
- ✅ Documentação completa

**Aproveite!** 🎉

---

**Tempo para integrar:** 5 minutos
**Dificuldade:** Muito fácil
**Status:** Pronto para usar
