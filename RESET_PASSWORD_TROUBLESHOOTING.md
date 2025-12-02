# 🔐 Reset de Senha - Troubleshooting

## ❌ Erro: `otp_expired` ou `access_denied`

Significa que o link de reset expirou ou foi invalidado.

### 🔧 Solução Rápida

1. **Peça um novo link**:
   - Acesse: http://192.168.8.149/#/login
   - Clique em: "Esqueceu sua senha?"
   - Digite seu email
   - **Clique no link IMEDIATAMENTE** quando receber o email (o link expira em 1 hora por padrão)

2. **Cuidado com**:
   - ❌ Não usar link duas vezes
   - ❌ Não aguardar muito tempo antes de clicar
   - ❌ Não atualizar a página durante o reset

---

## 🚀 Aumentar Tempo de Expiração

Se os links estão expirando muito rápido, você pode aumentar o tempo no Supabase:

### Via Supabase Dashboard

1. Acesse: https://app.supabase.com
2. Seu projeto: **Delta Navigator**
3. Vá para: **Authentication → Providers → Email**
4. Role para baixo até: **Email Template**
5. Procure por: **Expiration time**
6. Altere para: **7200** (2 horas) ou **86400** (24 horas)
7. Salve

### Via SQL (Alternativa)

```sql
-- Aumentar expiração para 24 horas
UPDATE auth.config 
SET mailer_settings = jsonb_set(
  mailer_settings,
  '{token_expiry_duration}',
  '"86400"'
)
WHERE key = 'smtp';
```

---

## 🔍 Debugar Problema

### Verificar logs de email no Supabase

1. Acesse: https://app.supabase.com
2. Seu projeto: **Delta Navigator**
3. Vá para: **Logs → Edge Function Logs**
4. Procure por erros relacionados a email

### Verificar se o email foi enviado

1. Acesse: https://app.supabase.com
2. Seu projeto: **Delta Navigator**
3. Vá para: **Authentication → Users**
4. Procure seu usuário
5. Verifique se há tokens de recovery

---

## 💡 Fluxo Correto de Reset

```
1. Login → "Esqueceu a senha?" 
   ↓
2. Email enviado (imediatamente)
   ↓
3. CLIQUE NO LINK (dentro de 1 hora)
   ↓
4. Pagina /reset-password com formulário
   ↓
5. Preencha nova senha (8+ caracteres, maiúscula, minúscula, número, especial)
   ↓
6. Clique em "Resetar Senha"
   ↓
7. Sucesso! Faça login com nova senha
```

---

## 🛠️ Se o Link Ainda Não Funciona

Tente isso:

```bash
# 1. Limpe o cache do navegador
Ctrl + Shift + Delete

# 2. Abra em modo incógnito/privado
Ctrl + Shift + N

# 3. Tente novamente
```

---

## 📧 Configuração de Email no Supabase

Se os emails NÃO estão chegando, verifique:

1. **SMTP está configurado?**
   - Authentication → Providers → Email
   - Veja se "Custom SMTP" está ativado

2. **Email vem do remetente certo?**
   - Verifique o `from_email` no config.toml

3. **Domínio está verificado?**
   - Se usar domínio customizado, ele precisa estar verificado no SPF/DKIM

---

## 🔗 URLs Importantes

| Página | URL |
|--------|-----|
| Login | http://192.168.8.149/#/login |
| Esqueceu Senha | http://192.168.8.149/#/login (clique no botão) |
| Reset | http://192.168.8.149/#/reset-password |
| Admin Audit Log | http://192.168.8.149/#/admin/audit-logs |

---

## ❓ Perguntas Frequentes

**P: Link expirou, o que fazer?**
R: Peça outro link clicando em "Esqueceu sua senha?" novamente

**P: Quanto tempo o link dura?**
R: 1 hora por padrão (pode aumentar nas configurações)

**P: Email não chegou?**
R: Verifique spam, ou configure SMTP no Supabase Dashboard

**P: Criar nova senha, mas não consegue fazer login?**
R: Aguarde 1-2 minutos para o Supabase sincronizar, depois tente novamente

---

## 📞 Suporte

Se o problema persiste:
1. Verifique os logs do Supabase Dashboard
2. Confira a configuração de SMTP
3. Teste com um email diferente
4. Contate o suporte do Supabase

