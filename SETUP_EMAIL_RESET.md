# 📧 Configurar Email para Reset de Senha

## 🎯 Solução Rápida com Resend (Grátis)

### Passo 1: Criar Conta Resend
1. Acesse: https://resend.com
2. Clique: **Sign Up**
3. Use seu email
4. Confirme o email
5. **Pronto!** Você tem conta

### Passo 2: Pegar Chave de API
1. No dashboard Resend, clique: **API Keys**
2. Clique: **Create API Key**
3. **Copie a chave** (começa com `re_`)

### Passo 3: Configurar no Supabase

1. Acesse: https://app.supabase.com
2. Seu projeto: **Delta Navigator**
3. Vá para: **Authentication → Emails → SMTP Settings**
4. **Ative**: "Enable custom SMTP" (clique no toggle)
5. Preencha assim:

```
Host: smtp.resend.com
Port: 587
Username: resend
Password: [SUA_CHAVE_AQUI]
From Email: onboarding@resend.dev
```

6. Clique: **Save changes**

### Passo 4: Testar

1. Vá para: http://192.168.8.149/#/login
2. Clique: "Esqueceu sua senha?"
3. Digite seu email
4. **Aguarde alguns segundos**
5. Verifique seu email
6. O email deve chegar agora! ✅

---

## 🔄 Alternativa: SendGrid (Mais Confiável)

Se Resend não funcionar, use SendGrid:

### 1. Criar Conta SendGrid
- Acesse: https://sendgrid.com
- Clique: **Sign Up**
- Use seu email

### 2. Criar Chave de API
1. No dashboard: **Settings → API Keys**
2. Clique: **Create API Key**
3. **Copie a chave** (começa com `SG.`)

### 3. Configurar no Supabase

```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [SUA_CHAVE_SENDGRID]
From Email: seu-email@seudominio.com (ou noreply@seudominio.com)
```

---

## 🎁 Opção Gratuita: Gmail

### 1. Setup Gmail
1. Acesse: https://myaccount.google.com
2. Vá para: **Security**
3. Ative: **2-Step Verification**
4. Crie: **App Password** (pesquise por isso)
5. **Copie a senha gerada**

### 2. Configurar no Supabase

```
Host: smtp.gmail.com
Port: 587
Username: seu-email@gmail.com
Password: [SENHA_DO_APP_GERADA]
From Email: seu-email@gmail.com
```

---

## ✅ Qual Escolher?

| Serviço | Preço | Facilidade | Recomendação |
|---------|-------|-----------|--------------|
| **Resend** | Grátis | ⭐⭐⭐⭐⭐ | 👈 Comece por aqui |
| **SendGrid** | Grátis (100/dia) | ⭐⭐⭐⭐ | Melhor para produção |
| **Gmail** | Grátis | ⭐⭐⭐ | Se já usa Gmail |

---

## 🚀 Próximos Passos

1. **Escolha um** (recomendo Resend)
2. **Configure as credenciais** no Supabase
3. **Clique em Save Changes**
4. **Teste o reset** de senha
5. Email deve chegar em **segundos**! ✅

---

## 🧪 Testar Após Configurar

```
1. http://192.168.8.149/#/login
2. "Esqueceu sua senha?"
3. Seu email
4. Clique em "Enviar"
5. Verifique seu email (inbox + spam)
6. Clique no link dentro de 7 dias
7. Resete a senha
8. Faça login com a nova senha
```

---

## ❓ Dúvidas

**P: Qual é mais rápido?**
R: Todos são iguais, **Resend é só mais fácil de configurar**

**P: Precisa pagar?**
R: Não! Os 3 têm plano grátis

**P: E se não funcionar?**
R: Verifique se as credenciais estão corretas (sem espaços)

**P: Quanto tempo para email chegar?**
R: 1-5 segundos normalmente

