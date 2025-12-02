# 🚀 Recursos Legais do Supabase para Delta Navigator

## 1. 🔐 Autenticação Avançada

### Já Implementado:
- ✅ Login/Logout com email e senha
- ✅ Reset de senha
- ✅ Sessões persistentes

### Fácil de Adicionar:

#### A. **Login com Google/GitHub**
```typescript
// No LoginForm.tsx
await supabase.auth.signInWithOAuth({
  provider: 'google', // ou 'github'
  options: {
    redirectTo: `${window.location.origin}/#/dashboard`,
  },
})
```

#### B. **Autenticação de Dois Fatores (2FA)**
```typescript
// Ativar no Supabase Dashboard → Authentication → MFA
await supabase.auth.verifyOTP({
  email,
  token: codeFromUser,
  type: 'email',
})
```

#### C. **Magic Link (sem senha)**
```typescript
await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${window.location.origin}`,
  },
})
```

---

## 2. 📊 Banco de Dados em Tempo Real

### A. **Tabelas SQL**
Você já tem PostgreSQL. Criar tabela:

```typescript
// Criar tabela via SQL Editor no Supabase Dashboard
CREATE TABLE users_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  theme TEXT DEFAULT 'dark',
  language TEXT DEFAULT 'pt-BR',
  created_at TIMESTAMP DEFAULT now()
);
```

### B. **Usar em Tempo Real**
```typescript
// Escutar mudanças em tempo real
supabase
  .channel('public:users_preferences')
  .on('*', payload => {
    console.log('Preferência atualizada!', payload.new)
  })
  .subscribe()
```

### C. **CRUD Operações**
```typescript
// Criar
const { data, error } = await supabase
  .from('users_preferences')
  .insert({ user_id: userId, theme: 'light' })

// Ler
const { data } = await supabase
  .from('users_preferences')
  .select('*')
  .eq('user_id', userId)

// Atualizar
await supabase
  .from('users_preferences')
  .update({ theme: 'dark' })
  .eq('user_id', userId)

// Deletar
await supabase
  .from('users_preferences')
  .delete()
  .eq('id', preferencesId)
```

---

## 3. 👥 Row Level Security (RLS) - Segurança por Linha

Controlar quem pode ver/editar dados:

```sql
-- Exemplo: Usuário só vê seus próprios dados
ALTER TABLE users_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON users_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON users_preferences FOR UPDATE
  USING (auth.uid() = user_id);
```

---

## 4. 📁 Storage (Arquivos)

Armazenar imagens, PDFs, etc:

```typescript
// Upload de arquivo
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/profile.jpg`, file)

// Download
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/profile.jpg`)

console.log(data.publicUrl)
```

---

## 5. 🔗 Funções SQL (Functions)

Executar lógica no banco de dados:

```sql
-- Criar função
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS TABLE(total_logins INT, last_login TIMESTAMP)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INT,
    MAX(created_at)
  FROM audit_logs
  WHERE user_id = user_id;
END;
$$ LANGUAGE plpgsql;
```

```typescript
// Chamar de TypeScript
const { data } = await supabase
  .rpc('get_user_stats', { user_id: userId })
```

---

## 6. 📧 Triggers (Gatilhos Automáticos)

Executar ações automaticamente:

```sql
-- Quando um usuário se cadastra, criar registro na tabela users_preferences
CREATE TRIGGER create_user_preferences
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

CREATE FUNCTION handle_new_user()
RETURNS void AS $$
BEGIN
  INSERT INTO users_preferences (user_id, theme, language)
  VALUES (new.id, 'dark', 'pt-BR');
END;
$$ LANGUAGE plpgsql;
```

---

## 7. 🔍 Full-Text Search

Buscar em múltiplos campos:

```sql
-- Criar índice de busca
CREATE INDEX idx_search ON documents 
USING GIN(to_tsvector('portuguese', content));
```

```typescript
// Buscar
const { data } = await supabase
  .from('documents')
  .select('*')
  .textSearch('content', 'palavra chave')
```

---

## 8. 📱 Push Notifications

Enviar notificações em tempo real:

```typescript
// Inscrever usuário
await supabase
  .channel('notifications:' + userId)
  .on('broadcast', { event: 'alert' }, payload => {
    console.log('Notificação:', payload.message)
  })
  .subscribe()

// Enviar notificação
await supabase
  .channel('notifications:' + userId)
  .send({
    type: 'broadcast',
    event: 'alert',
    payload: { message: 'Nova mensagem!' }
  })
```

---

## 9. 🎯 Webhooks

Disparar eventos quando dados mudam:

1. **No Dashboard**: `Database` → `Webhooks`
2. **Criar webhook** que aponta para sua API
3. **Supabase envia POST** sempre que dados mudam

Exemplo de webhook:
```
POST /api/webhooks/user-created
{
  "type": "INSERT",
  "table": "auth.users",
  "record": { "id": "...", "email": "..." }
}
```

---

## 10. 📊 Extensões Úteis

Ativar no Dashboard → `SQL Editor` → `Extensions`:

- **uuid-ossp**: Gerar UUIDs
- **pgcrypto**: Criptografia
- **unaccent**: Remover acentos em buscas
- **pg_trgm**: Busca fuzzy

---

## 🎓 Exemplos Práticos para Delta Navigator

### Exemplo 1: Salvar Preferências do Usuário
```typescript
// Hook customizado
function useUserPreferences() {
  const { user } = useAuth()
  
  const saveTheme = async (theme: 'light' | 'dark') => {
    await supabase
      .from('users_preferences')
      .upsert({
        user_id: user?.id,
        theme,
        updated_at: new Date()
      })
  }
  
  return { saveTheme }
}
```

### Exemplo 2: Listar Documentos com Paginação
```typescript
const [page, setPage] = useState(1)
const pageSize = 10

const { data: documents } = await supabase
  .from('documents')
  .select('*')
  .order('created_at', { ascending: false })
  .range((page - 1) * pageSize, page * pageSize - 1)
```

### Exemplo 3: Busca com Filtros
```typescript
let query = supabase.from('contratos').select('*')

if (filters.status) {
  query = query.eq('status', filters.status)
}

if (filters.dataInicio) {
  query = query.gte('data', filters.dataInicio)
}

const { data } = await query
```

### Exemplo 4: Sincronização em Tempo Real
```typescript
useEffect(() => {
  const subscription = supabase
    .channel('contratos')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'contratos' },
      (payload) => {
        console.log('Contrato atualizado:', payload)
        // Atualizar UI
      }
    )
    .subscribe()
  
  return () => subscription.unsubscribe()
}, [])
```

---

## 🛠️ Como Implementar Cada Um

### Passo 1: Ir ao Supabase Dashboard
- https://app.supabase.com
- Seu projeto: `Delta Navigator`

### Passo 2: SQL Editor
- Criar tabelas e funções via SQL
- Ou usar UI visual para criar tabelas

### Passo 3: Auth (Já configurado)
- Adicionar OAuth providers
- Ativar 2FA

### Passo 4: Storage (Para arquivos)
- Criar buckets
- Configurar políticas públicas/privadas

### Passo 5: Usar no React
- Instalar: `npm install @supabase/supabase-js`
- Já tem no projeto! ✅

---

## 📚 Recursos para Aprender Mais

- **Docs Oficial**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Exemplos**: https://github.com/supabase/supabase/tree/master/examples

---

## ⚡ Funcionalidades Recomendadas para Delta Navigator

1. **Preferences do Usuário** → Salvar tema, idioma, etc
2. **Audit Log** → Registrar quem fez o quê e quando
3. **Notificações** → Alertas em tempo real
4. **Upload de Arquivos** → Para documentos/contratos
5. **Busca Full-Text** → Buscar em descrições, nomes

---

**Quer que eu implemente algo disso?** Só me avisar qual você quer começar! 🎯
