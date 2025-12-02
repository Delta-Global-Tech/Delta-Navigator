# ⚡ Como Testar Agora (Enquanto TI Configura DNS)

## 🎯 Objetivo
Usar o email de teste do Resend agora para verificar se tudo funciona, enquanto o TI configura o DNS do seu domínio.

## 📋 Passo 1: Mudar Email de Teste no Supabase

1. Acesse: https://app.supabase.com
2. Seu projeto: **Delta Navigator**
3. Vá para: **Authentication → SMTP Settings**
4. **Mude o From Email** de:
   ```
   noreply@deltaglobalbank.com.br
   ```
   Para:
   ```
   onboarding@resend.dev
   ```
5. **Clique: Save changes**

## 📋 Passo 2: Testar Reset de Senha

1. Acesse: http://192.168.8.149/#/login
2. Clique em: **"Esqueceu sua senha?"**
3. Digite: **ms957697@gmail.com** (seu email de teste)
4. Clique em: **"Enviar"**
5. **Verifique seu email** (deve chegar em segundos!)

## ✅ Se Funcionou:

- ✅ Email chegou
- ✅ Clique no link
- ✅ Página de reset aparece
- ✅ Resete a senha com sucesso
- ✅ Faça login com a nova senha

**Parabéns! O sistema funciona!** 🎉

## 📋 Passo 3: Quando TI Confirmar DNS

Depois que o TI disser que adicionou os registros DNS e tudo foi verificado:

1. **Volta no Supabase → SMTP Settings**
2. **Mude de volta** para: `noreply@deltaglobalbank.com.br`
3. **Save**
4. **Pronto!** Agora funciona com todos os emails corporativos

## 💡 Resumo

| Fase | From Email | Funciona Para |
|------|-----------|---------------|
| **Agora (Teste)** | `onboarding@resend.dev` | `ms957697@gmail.com` |
| **Depois (Produção)** | `noreply@deltaglobalbank.com.br` | Qualquer email corporativo |

---

**Faça esses testes agora e me diz se funcionou!** 🚀
