# 🔍 Diagnóstico: Email Não Chegando

## 🎯 Checklist Rápido

- [ ] **Chave de API do Resend está correta?**
- [ ] **Email foi para spam?**
- [ ] **Resend Dashboard mostra tentativas de envio?**
- [ ] **Credenciais SMTP estão corretas no Supabase?**
- [ ] **Logs do Supabase mostram erros?**

---

## 🔧 Passo 1: Verificar Chave de API no Resend

1. Acesse: https://resend.com/dashboard
2. Clique em: **Settings → API Keys**
3. Procure por sua chave
4. **Copie a chave completa** (começando com `re_`)
5. **Volta no Supabase**
6. **Authentication → SMTP Settings**
7. **Cole a chave EXATAMENTE** no campo Password
8. **Clique: Save Changes**

---

## 🔧 Passo 2: Verificar Logs do Supabase

1. Acesse: https://app.supabase.com
2. Seu projeto: **Delta Navigator**
3. Vá para: **Logs → Edge Function Logs**
4. Procure por erros recentes
5. Procure por algo assim:
   ```
   ERROR: Failed to send email
   ERROR: SMTP connection failed
   ERROR: Invalid credentials
   ```

Se encontrar erro, compartilhe comigo!

---

## 🔧 Passo 3: Testar Direto no Resend

1. Acesse: https://resend.com/dashboard
2. Clique em: **Emails**
3. Clique em: **Send a test email**
4. Digite seu email
5. Clique: **Send**
6. **Você recebe o email do Resend?**

Se **SIM**: Resend funciona, problema é no Supabase
Se **NÃO**: Problema é na chave ou no Resend

---

## 🔧 Passo 4: Verificar se Email foi para Spam

1. Verifique seu **Spam/Lixo**
2. Procure por emails de `onboarding@resend.dev`
3. Se encontrar: **Marque como não spam**

---

## 🔧 Passo 5: Aumentar Debug

Se ainda não funciona, vou modificar o código para adicionar logs.

Abra seu navegador e:
1. Vá para: http://192.168.8.149/#/login
2. **F12** (abrir DevTools)
3. **Aba: Console**
4. Clique em "Esqueceu sua senha?"
5. Digite seu email
6. **Clique em "Enviar"**
7. **Procure por mensagens de erro no console**
8. **Compartilhe qualquer erro que aparecer**

---

## 📋 Possíveis Problemas

### Problema 1: Chave de API Inválida
**Solução:**
- Vá para Resend Dashboard
- Copie chave NOVAMENTE (toda inteira)
- Paste no Supabase
- Salve

### Problema 2: Email para Spam
**Solução:**
- Marque como confiável
- Ou use seu próprio domínio

### Problema 3: Timeout
**Solução:**
- Aguarde 30-60 segundos
- Se não funcionar, reinicie Supabase
- Tente novamente

### Problema 4: Credenciais Incorretas
**Solução:**
```
Username: resend (EXATAMENTE assim)
Host: smtp.resend.com (sem https://)
Port: 587 (NÃO 465)
```

---

## 🚀 O Que Fazer Agora

1. **Verifique a chave de API** no Resend
2. **Teste email direto** no Resend Dashboard
3. **Procure em Spam**
4. **Abra DevTools e procure erros**
5. **Compartilhe qualquer erro que encontrar**

---

## 💡 Alternativa: Usar Gmail

Se Resend não funcionar, use Gmail como fallback:

```
Host: smtp.gmail.com
Port: 587
Username: seu-email@gmail.com
Password: [sua-app-password]
```

Guia: Acesse Google Account → Security → App Passwords

