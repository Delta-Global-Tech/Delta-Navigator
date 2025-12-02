# 📋 Audit Log - Guia de Implementação

## ✅ O que foi criado

1. **Tabela SQL** (`audit_logs`) no Supabase
2. **Hook useAuditLog** para registrar ações
3. **Página de visualização** com filtros e paginação
4. **Funções SQL** para consultas rápidas
5. **Integração no App.tsx** na rota `/admin/audit-logs`

---

## 🚀 Como Começar

### Passo 1: Criar a Tabela no Supabase

1. Acesse: https://app.supabase.com
2. Seu projeto: **Delta Navigator**
3. Vá para: **SQL Editor**
4. Copie e cole o conteúdo de `supabase/audit-log-setup.sql`
5. Execute o script

### Passo 2: Usar o Hook em Seus Componentes

```typescript
import { useAuditLog } from '@/hooks/useAuditLog'

function MeuComponente() {
  const { logAction, logCreate, logUpdate, logDelete } = useAuditLog()

  // Exemplo 1: Log simples
  const handleClick = async () => {
    await logAction({
      action: 'CUSTOM_ACTION',
      resource: 'Dashboard',
      details: { foo: 'bar' }
    })
  }

  // Exemplo 2: Criar registro
  const handleCreate = async (data) => {
    await logCreate('Contrato', '123', { valor: 10000 })
  }

  // Exemplo 3: Atualizar
  const handleUpdate = async (changes) => {
    await logUpdate('Contrato', '123', changes)
  }

  // Exemplo 4: Deletar
  const handleDelete = async () => {
    await logDelete('Contrato', '123')
  }

  return (
    // ...
  )
}
```

### Passo 3: Visualizar Logs

Acesse: `http://192.168.8.149/admin/audit-logs`

---

## 📊 Métodos do Hook

### `logAction(entry)`
Log genérico com todos os parâmetros.

```typescript
await logAction({
  action: 'VIEW',
  resource: 'Contratos',
  resourceId: '12345',
  details: { filtros_aplicados: true },
  status: 'success'
})
```

### `logView(resource, resourceId?)`
Log de visualização.

```typescript
await logView('Dashboard', '123')
```

### `logCreate(resource, resourceId, details?)`
Log de criação.

```typescript
await logCreate('Contrato', 'id-novo', { valor: 50000 })
```

### `logUpdate(resource, resourceId, changes?)`
Log de atualização.

```typescript
await logUpdate('Contrato', '123', { status: 'aprovado' })
```

### `logDelete(resource, resourceId, details?)`
Log de exclusão.

```typescript
await logDelete('Contrato', '123', { motivo: 'cancelado' })
```

### `logExport(resource, format, count)`
Log de exportação.

```typescript
await logExport('Contratos', 'PDF', 100)
```

### `logError(resource, action, errorMsg, details?)`
Log de erro.

```typescript
await logError('Contrato', 'CREATE', 'Falha ao salvar', { error_code: 500 })
```

### `logLogin()`
Log de login (sem parâmetros).

```typescript
await logLogin()
```

### `logLogout()`
Log de logout (sem parâmetros).

```typescript
await logLogout()
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Dashboard com Logs

```typescript
import { useAuditLog } from '@/hooks/useAuditLog'

export default function Dashboard() {
  const { logView } = useAuditLog()

  useEffect(() => {
    // Log quando a página é carregada
    logView('Dashboard')
  }, [])

  return (
    // ...
  )
}
```

### Exemplo 2: Criar Contrato com Log

```typescript
async function handleCreateContrato(data) {
  const { logCreate, logError } = useAuditLog()

  try {
    const response = await api.post('/contratos', data)
    
    // Log de sucesso
    await logCreate('Contrato', response.id, {
      valor: data.valor,
      cliente: data.cliente
    })

    showSuccess('Contrato criado!')
  } catch (error) {
    // Log de erro
    await logError('Contrato', 'CREATE', error.message)
    showError(error.message)
  }
}
```

### Exemplo 3: Atualizar com Mudanças

```typescript
async function handleUpdateContrato(id, changes) {
  const { logUpdate } = useAuditLog()

  try {
    await api.put(`/contratos/${id}`, changes)
    await logUpdate('Contrato', id, changes)
    showSuccess('Atualizado!')
  } catch (error) {
    console.error(error)
  }
}
```

### Exemplo 4: Exportar com Log

```typescript
async function handleExport() {
  const { logExport } = useAuditLog()

  try {
    const response = await api.get('/contratos/export?format=csv')
    
    // Log da exportação
    await logExport('Contratos', 'CSV', response.count)
    
    // Download...
  } catch (error) {
    // ...
  }
}
```

---

## 🔍 Visualizar Logs

A página `/admin/audit-logs` permite:

✅ **Filtrar por:**
- Email do usuário
- Ação (CREATE, UPDATE, DELETE, etc)
- Recurso (Dashboard, Contratos, etc)
- Status (sucesso, erro, aviso)
- Data (de/até)

✅ **Visualizar:**
- Data/hora exata
- Usuário que fez a ação
- Detalhes em JSON
- Mensagens de erro (se houver)

✅ **Exportar:**
- CSV com todos os dados visíveis

---

## 📊 Consultas SQL Úteis

### Ver últimos 10 logs

```sql
SELECT * FROM audit_logs
ORDER BY created_at DESC
LIMIT 10;
```

### Logs de um usuário

```sql
SELECT * FROM audit_logs
WHERE user_email = 'usuario@email.com'
ORDER BY created_at DESC;
```

### Contar ações por tipo

```sql
SELECT action, COUNT(*) as total
FROM audit_logs
WHERE created_at >= now() - INTERVAL '7 days'
GROUP BY action
ORDER BY total DESC;
```

### Erros dos últimos 7 dias

```sql
SELECT * FROM audit_logs
WHERE status = 'error'
AND created_at >= now() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### Estatísticas

```sql
SELECT * FROM get_audit_stats(30);
```

---

## ⚙️ Configurações Avançadas

### Adicionar mais campos

Se quiser registrar mais informações, edite a tabela:

```sql
ALTER TABLE audit_logs
ADD COLUMN nova_coluna TEXT;
```

### Criar políticas de segurança

Exemplo: Apenas admin pode ver todos os logs

```sql
CREATE POLICY "admin_only_view_all"
  ON audit_logs FOR SELECT
  USING (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'
  );
```

### Limpeza automática

Para deletar logs muito antigos:

```sql
CREATE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < now() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Agendar para rodar diariamente (precisar de extensão pg_cron)
```

---

## 🐛 Troubleshooting

### "Tabela não existe"
- Verifique se você executou o script SQL no Supabase
- Verifique o nome da tabela (deve ser `audit_logs`)

### "Permissão negada"
- Verifique se as políticas RLS foram criadas corretamente
- Verifique se o usuário tem permissão de INSERT

### "Logs não aparecem"
- Verifique no DevTools console
- Verifique se o hook está sendo usado corretamente
- Verifique se o usuário está logado

---

## 📈 Próximos Passos

Você pode expandir o Audit Log para:

1. **Dashboard de Estatísticas**
   - Gráficos de ações por dia
   - Usuários mais ativos
   - Recursos mais usados

2. **Alertas Automáticos**
   - Notificar quando ação suspeita é detectada
   - Exemplo: múltiplos logins falhados

3. **Integração com Webhooks**
   - Enviar logs para sistema externo
   - Integrar com Slack/Email

4. **Assinatura Digital**
   - Garantir integridade dos logs
   - Impossível modificar logs antigos

---

## 📞 Suporte

Consulte:
- `SUPABASE_FEATURES.md` - Mais recursos do Supabase
- `supabase/audit-log-setup.sql` - Script completo

---

**Status**: ✅ Pronto para usar
**Versão**: 1.0
**Atualizado**: Novembro 2025
