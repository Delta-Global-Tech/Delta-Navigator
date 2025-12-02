# 📧 Mensagem Completa para o TI - Adicionar Registros DNS

Copie e cole exatamente isso:

---

## ASSUNTO: Solicitação - Adicionar Registros DNS para Sistema de Autenticação

Olá pessoal do TI,

Estou configurando um sistema de autenticação e reset de senha para a aplicação Delta Navigator. Para isso, preciso que vocês adicionem **3 registros DNS** no domínio **deltaglobalbank.com.br**.

Peço que adicionem os seguintes registros na sua plataforma de gerenciamento DNS:

### 📋 REGISTROS A ADICIONAR:

---

#### **1️⃣ REGISTRO TXT (DKIM - Domain Keys Identified Mail)**

| Campo | Valor |
|-------|-------|
| **Tipo** | TXT |
| **Nome/Host** | `resend._domainkey` |
| **Valor** | Ver abaixo |
| **TTL** | Auto (padrão) |

**Valor Completo (copiar exatamente):**
```
p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQChmE7tmXFGbPoiL57gm4b9RBPbeDIXzmRqK6Cx4JOWMkieZU3wtfwtHdf6fM8y4flonxwBtF4xL+SPayKv+wVzDo8gUnZLoaJhFKYF5Orb8jMn8+aa/OUv0cZMSz/cupbtNqCFF4qKsyxc6zqQD2KpI0VDxvfFA1b3RyT8LWKojQIDAQAB
```

---

#### **2️⃣ REGISTRO MX (Mail Exchange)**

| Campo | Valor |
|-------|-------|
| **Tipo** | MX |
| **Nome/Host** | `send` |
| **Valor/Mail Server** | Ver abaixo |
| **Prioridade** | **10** |
| **TTL** | Auto (padrão) |

**Valor Completo (copiar exatamente):**
```
feedback-smtp.sa-east-1.amazonses.com
```

---

#### **3️⃣ REGISTRO TXT (SPF - Sender Policy Framework)**

| Campo | Valor |
|-------|-------|
| **Tipo** | TXT |
| **Nome/Host** | `send` |
| **Valor** | Ver abaixo |
| **TTL** | Auto (padrão) |

**Valor Completo (copiar exatamente):**
```
v=spf1 include:amazonses.com ~all
```

---

#### **4️⃣ REGISTRO TXT (DMARC - RECOMENDADO)**

| Campo | Valor |
|-------|-------|
| **Tipo** | TXT |
| **Nome/Host** | `_dmarc` |
| **Valor** | Ver abaixo |
| **TTL** | Auto (padrão) |

**Valor Completo (copiar exatamente):**
```
v=DMARC1; p=none;
```

---

### ✅ CONFIRMAÇÃO:

Quando tiverem adicionado os 3 registros, por favor:
1. Confirmem que foram adicionados
2. Aguardem a propagação DNS (pode levar 5-30 minutos)
3. Avisar-me quando tiverem verificado que está tudo correto

---

### 💡 OBSERVAÇÕES:

- Estes registros são **seguros** e **padrão de indústria** para verificação de domínio
- Não afetam nenhuma função existente do email corporativo
- São necessários **apenas para** o sistema de reset de senha da aplicação
- Servidor: **Resend** (serviço confiável de envio de emails)
- Região: **sa-east-1** (São Paulo)

---

### 📞 DÚVIDAS:

Se tiverem dúvidas sobre os registros, peço que:
1. Verifiquem a documentação do Resend: https://resend.com/docs
2. Ou entrem em contato comigo para esclarecimentos

Obrigado!

---

*Data: [DATA DE HOJE]*  
*Projeto: Delta Navigator*  
*Domínio: deltaglobalbank.com.br*
