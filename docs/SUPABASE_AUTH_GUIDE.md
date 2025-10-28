# 🔐 Documentação Completa - Sistema de Autenticação Supabase

**Delta Navigator - Guia Definitivo de Autenticação**

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Arquitetura do Sistema](#-arquitetura-do-sistema)
3. [Configuração Inicial](#-configuração-inicial)
4. [Estrutura de Arquivos](#-estrutura-de-arquivos)
5. [Componentes de Autenticação](#-componentes-de-autenticação)
6. [Fluxo de Login/Cadastro](#-fluxo-de-logincadastro)
7. [Proteção de Rotas](#-proteção-de-rotas)
8. [Configuração do Banco](#-configuração-do-banco)
9. [Migração para Nova Conta](#-migração-para-nova-conta)
10. [Troubleshooting](#-troubleshooting)

---

## 🎯 Visão Geral

O **Delta Navigator** utiliza **Supabase Auth** como sistema de autenticação, oferecendo:

- ✅ **Login/Cadastro** com email e senha
- ✅ **Confirmação por email** automática
- ✅ **Sessão persistente** entre navegações
- ✅ **Proteção de rotas** baseada em autenticação
- ✅ **Row Level Security (RLS)** no banco de dados
- ✅ **Gerenciamento de perfis** de usuário

---

## 🏗️ Arquitetura do Sistema

```
🌐 Frontend (React + TypeScript)
├── 🔐 Supabase Client (Autenticação)
├── 🛡️ Context API (Estado Global)
├── 🚪 Protected Routes (Proteção)
└── 📱 Componentes de Auth

📊 Supabase Backend
├── 🗄️ Auth Tables (users, sessions)
├── 👤 User Profiles (public.user_profiles)
├── 🔒 Row Level Security (RLS)
└── 📧 Email Templates
```

---

## ⚙️ Configuração Inicial

### 1. **Criar Projeto Supabase**

```bash
# 1. Acesse https://supabase.com
# 2. Criar novo projeto
# 3. Anotar credenciais:
Project URL: https://[PROJECT-ID].supabase.co
Anon Key: eyJ...
Service Role Key: eyJ... (admin)
```

### 2. **Configurar Variáveis de Ambiente**

```bash
# Criar arquivo .env na raiz
VITE_SUPABASE_URL=https://seu-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...sua_anon_key...
```

### 3. **Instalar Dependências**

```bash
npm install @supabase/supabase-js
npm install @tanstack/react-query  # Para cache
```

---

## 📁 Estrutura de Arquivos

```
src/
├── integrations/supabase/
│   ├── client.ts              # Cliente Supabase
│   └── types.ts               # Tipos TypeScript
├── components/auth/
│   ├── LoginForm.tsx          # Formulário de login
│   ├── SignUpForm.tsx         # Formulário de cadastro
│   └── ProtectedRoute.tsx     # Proteção de rotas
├── hooks/
│   └── useAuth.tsx            # Context + hooks de auth
└── data/
    └── supabase.ts            # Configuração alternativa

supabase/
├── config.toml                # Configuração CLI
├── setup-auth.sql             # Script de setup
└── migrations/                # Migrações do banco
```

---

## 🔧 Componentes de Autenticação

### **1. Cliente Supabase (`client.ts`)**

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://seu-project-id.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJ...";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,        // Onde salvar sessão
    persistSession: true,         // Manter sessão ativa
    autoRefreshToken: true,       // Renovar token automaticamente
  }
});
```

### **2. Context de Autenticação (`useAuth.tsx`)**

```typescript
interface AuthContextType {
  user: User | null;              // Usuário logado
  session: Session | null;        // Sessão ativa
  loading: boolean;               // Estado de carregamento
  error: string | null;           // Mensagens de erro
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);
}
```

### **3. Proteção de Rotas (`ProtectedRoute.tsx`)**

```typescript
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginForm />;  // Redireciona para login
  }

  return <>{children}</>;  // Permite acesso
}
```

---

## 🔄 Fluxo de Login/Cadastro

### **📝 Cadastro (SignUpForm.tsx)**

```typescript
const handleSignUp = async (email: string, password: string) => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (!error) {
    // Mostrar mensagem: "Verifique seu email"
  }
};
```

**🎯 O que acontece:**
1. ✅ Usuário preenche formulário
2. ✅ Supabase cria conta **não verificada**
3. ✅ Email de confirmação é enviado
4. ✅ Usuário clica no link do email
5. ✅ Conta é ativada automaticamente

### **🔐 Login (LoginForm.tsx)**

```typescript
const handleLogin = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (!error) {
    // Redireciona para dashboard
  }
};
```

### **🚪 Logout**

```typescript
const handleLogout = async () => {
  await supabase.auth.signOut();
  // Context atualiza automaticamente
};
```

---

## 🛡️ Proteção de Rotas

### **App.tsx - Estrutura Principal**

```typescript
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<LoginForm />} />
          
          {/* Rotas protegidas */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/propostas" element={
            <ProtectedRoute>
              <PropostasPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```

### **Uso em Componentes**

```typescript
function Dashboard() {
  const { user, logout } = useAuth();
  
  return (
    <div>
      <h1>Bem-vindo, {user?.email}</h1>
      <button onClick={logout}>Sair</button>
    </div>
  );
}
```

---

## 🗄️ Configuração do Banco

### **1. Setup Inicial (setup-auth.sql)**

```sql
-- 1. Habilitar Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Criar tabela de perfis
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Políticas de acesso
CREATE POLICY "Usuários podem ver seus próprios perfis" 
ON user_profiles FOR SELECT 
USING (auth.uid() = id);

-- 4. Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### **2. Configurar Email Templates**

**No Dashboard Supabase:**
- `Authentication` → `Email Templates`
- Customizar templates:
  - **Confirm signup** (confirmação de cadastro)
  - **Reset password** (recuperação de senha)
  - **Magic link** (login sem senha)

---

## 🔄 Migração para Nova Conta

### **Passo 1: Atualizar Credenciais**

```typescript
// src/integrations/supabase/client.ts
const SUPABASE_URL = "https://SEU-NOVO-PROJECT-ID.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "SUA-NOVA-ANON-KEY";
```

### **Passo 2: Atualizar Configurações**

```toml
# supabase/config.toml
project_id = "SEU-NOVO-PROJECT-ID"
```

### **Passo 3: Executar Setup no Novo Banco**

```bash
# No SQL Editor do novo projeto, executar:
# - setup-auth.sql
# - Configurar email templates
# - Testar login/cadastro
```

---

## 📊 Estados de Autenticação

| Estado | Usuário | Sessão | Ação |
|--------|---------|--------|------|
| **Deslogado** | `null` | `null` | Mostrar LoginForm |
| **Carregando** | `null` | `loading` | Mostrar Spinner |
| **Logado** | `User` | `Session` | Permitir acesso |
| **Erro** | `null` | `null` | Mostrar mensagem erro |

---

## 🧪 Teste de Funcionalidades

### **1. Testar Cadastro**
```bash
# 1. Abrir http://localhost:3000
# 2. Clicar "Criar Conta"
# 3. Preencher email/senha
# 4. Verificar mensagem de confirmação
# 5. Checar email e clicar no link
```

### **2. Testar Login**
```bash
# 1. Usar email confirmado
# 2. Fazer login
# 3. Verificar redirecionamento
# 4. Testar logout
```

### **3. Testar Proteção**
```bash
# 1. Acessar rota protegida sem login
# 2. Deve redirecionar para login
# 3. Após login, deve acessar a rota
```

---

## 🔧 Troubleshooting

### **❌ Problemas Comuns**

| Problema | Causa | Solução |
|----------|--------|---------|
| "Invalid API Key" | Chave incorreta | Verificar VITE_SUPABASE_ANON_KEY |
| "Email not confirmed" | Usuário não clicou no link | Reenviar confirmação |
| "Session expired" | Token expirado | Fazer login novamente |
| "RLS policy" | Política de segurança | Verificar setup-auth.sql |

### **🔍 Debug**

```typescript
// Verificar sessão atual
supabase.auth.getSession().then(console.log);

// Escutar eventos de auth
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session);
});

// Verificar usuário atual
console.log('Current user:', supabase.auth.getUser());
```

---

## 📝 Checklist Completo

### **✅ Setup Inicial**
- [ ] Criar projeto Supabase
- [ ] Configurar variáveis de ambiente
- [ ] Instalar dependências
- [ ] Executar setup-auth.sql

### **✅ Implementação**
- [ ] Configurar client.ts
- [ ] Implementar AuthProvider
- [ ] Criar componentes de auth
- [ ] Proteger rotas
- [ ] Testar fluxo completo

### **✅ Customização**
- [ ] Personalizar templates de email
- [ ] Configurar domínio customizado
- [ ] Adicionar campos extras no perfil
- [ ] Implementar roles/permissões

---

## 🚀 Resumo Executivo

O sistema de autenticação do **Delta Navigator** é construído sobre o **Supabase Auth**, oferecendo uma solução robusta e escalável para gerenciamento de usuários. 

**Pontos-chave:**
- 🔐 **Segurança**: RLS + JWT tokens
- 📧 **UX**: Confirmação automática por email  
- 🔄 **Performance**: Sessões persistentes + cache
- 🛠️ **Manutenibilidade**: Context API + hooks customizados
- 📱 **Responsividade**: Funciona em todos dispositivos

**Para migrar para nova conta, basta atualizar as credenciais e re-executar o setup SQL!** ⚡

---

*Documentação criada em: Outubro 2025*  
*Versão: Delta Navigator v2.0*