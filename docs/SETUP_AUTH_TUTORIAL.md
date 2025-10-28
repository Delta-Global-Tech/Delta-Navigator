# 🚀 Tutorial Prático - Implementar Autenticação Supabase do Zero

**Guia completo para implementar autenticação Supabase no Delta Navigator**

---

## 📋 PASSO A PASSO COMPLETO

### **🎯 FASE 1: Preparação do Ambiente**

#### 1.1. Criar Projeto Supabase
```bash
# 1. Acesse https://supabase.com/dashboard
# 2. Clique "New Project"
# 3. Escolha organização
# 4. Nome: "Delta Navigator Auth"
# 5. Região: South America (São Paulo)
# 6. Database Password: [sua senha segura]
# 7. Aguardar criação (2-3 minutos)
```

#### 1.2. Coletar Credenciais
```bash
# No dashboard do projeto criado:
# Settings → API → copiar:

Project URL: https://[PROJECT-ID].supabase.co
Anon public key: eyJhbGci...
Service role key: eyJhbGci... (secret)
```

#### 1.3. Configurar Projeto Local
```bash
# Clonar repositório
git clone https://github.com/Delta-Global-Dados/Delta-Navigator.git
cd Delta-Navigator

# Instalar dependências
npm install

# Criar arquivo .env
touch .env
```

---

### **🎯 FASE 2: Configuração Base**

#### 2.1. Arquivo .env
```env
# .env (raiz do projeto)
VITE_SUPABASE_URL=https://[SEU-PROJECT-ID].supabase.co
VITE_SUPABASE_ANON_KEY=[SUA-ANON-KEY]
```

#### 2.2. Cliente Supabase
```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

#### 2.3. Context de Autenticação
```typescript
// src/hooks/useAuth.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error?.message };
  };

  const signup = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    return { error: error?.message };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

### **🎯 FASE 3: Componentes de Interface**

#### 3.1. Formulário de Login
```typescript
// src/components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await login(email, password);
    
    if (error) {
      setError(error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center">Delta Navigator</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
```

#### 3.2. Proteção de Rotas
```typescript
// src/components/auth/ProtectedRoute.tsx
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from './LoginForm';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return <>{children}</>;
}
```

---

### **🎯 FASE 4: Configuração do Banco**

#### 4.1. SQL Setup (Execute no Supabase SQL Editor)
```sql
-- 1. Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criar tabela de perfis
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas
CREATE POLICY "Usuários podem ver seus próprios perfis"
ON public.user_profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = id);

-- 5. Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Função para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

---

### **🎯 FASE 5: Integração no App**

#### 5.1. App Principal
```typescript
// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Dashboard } from '@/pages/Dashboard';
import { PropostasAbertura } from '@/pages/PropostasAbertura';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/propostas-abertura" element={
            <ProtectedRoute>
              <PropostasAbertura />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

#### 5.2. Layout com Logout
```typescript
// src/components/Layout.tsx
import React from 'react';
import { useAuth } from '@/hooks/useAuth';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Delta Navigator</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.email}
              </span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
```

---

### **🎯 FASE 6: Configurações Avançadas**

#### 6.1. Email Templates (Dashboard Supabase)
```bash
# Authentication → Email Templates

# 1. Confirm Signup
Subject: Confirme sua conta - Delta Navigator
Body: 
Olá!

Clique no link abaixo para confirmar sua conta:
{{ .ConfirmationURL }}

Obrigado!
Equipe Delta Navigator

# 2. Reset Password  
Subject: Redefinir senha - Delta Navigator
Body:
Olá!

Clique no link abaixo para redefinir sua senha:
{{ .ConfirmationURL }}

Se você não solicitou isso, ignore este email.

Equipe Delta Navigator
```

#### 6.2. Configurações de Autenticação
```bash
# Authentication → Settings

# Site URL: http://localhost:3000
# Redirect URLs: 
# - http://localhost:3000
# - http://localhost:3000/auth/callback
# - https://seu-dominio.com (produção)

# Email Auth: Enabled
# Confirm Email: Enabled
# Secure Email Change: Enabled
```

---

### **🎯 FASE 7: Testes e Validação**

#### 7.1. Script de Teste
```typescript
// tests/auth.test.ts
export async function testAuth() {
  console.log('🧪 Testando Sistema de Autenticação...');

  // 1. Testar conexão
  const { data } = await supabase.auth.getSession();
  console.log('✅ Conexão:', data ? 'OK' : 'ERRO');

  // 2. Testar cadastro
  const email = `teste-${Date.now()}@teste.com`;
  const { error: signupError } = await supabase.auth.signUp({
    email,
    password: 'teste123'
  });
  console.log('✅ Cadastro:', signupError ? 'ERRO' : 'OK');

  // 3. Verificar perfil criado
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', email)
    .single();
  console.log('✅ Perfil criado:', profile ? 'OK' : 'ERRO');
}
```

#### 7.2. Checklist Final
```bash
✅ Checklist de Validação:

[ ] Projeto Supabase criado
[ ] Credenciais configuradas no .env
[ ] SQL de setup executado
[ ] Componentes de auth implementados
[ ] ProtectedRoute funcionando
[ ] Email templates configurados
[ ] Teste de cadastro funciona
[ ] Teste de login funciona  
[ ] Logout funciona
[ ] Sessão persiste após reload
[ ] Perfil é criado automaticamente
[ ] RLS está funcionando
```

---

## 🚀 COMANDOS RÁPIDOS

### Setup Completo
```bash
# 1. Preparar projeto
git clone [repo] && cd Delta-Navigator
npm install

# 2. Configurar .env
echo "VITE_SUPABASE_URL=https://SEU-ID.supabase.co" > .env
echo "VITE_SUPABASE_ANON_KEY=SUA-CHAVE" >> .env

# 3. Rodar aplicação
npm run dev

# 4. Executar SQL no dashboard Supabase
# (copiar e colar o SQL de setup)

# 5. Testar cadastro/login
```

### Debug Comum
```typescript
// Verificar sessão atual
supabase.auth.getSession().then(console.log);

// Escutar eventos
supabase.auth.onAuthStateChange(console.log);

// Verificar perfil
supabase.from('user_profiles').select('*').then(console.log);
```

---

## 📞 Suporte

**Se algo não funcionar:**

1. ✅ **Verificar credenciais** no .env
2. ✅ **Executar SQL** no Supabase
3. ✅ **Limpar localStorage** do navegador
4. ✅ **Verificar console** por erros
5. ✅ **Testar em aba anônima**

---

**🎉 Pronto! Seu sistema de autenticação Supabase está funcionando!**

*Guia atualizado em: Outubro 2025*