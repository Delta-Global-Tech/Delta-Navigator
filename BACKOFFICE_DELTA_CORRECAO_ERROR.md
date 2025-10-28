# 🔧 CORREÇÃO - Network Error no Backoffice Delta

## ❌ Problema
```
Erro ao carregar dados
Network Error
```

## ✅ Solução

### O que aconteceu?
O certificado e a chave privada **NÃO** devem estar no código frontend! Eles são apenas para comunicação segura em backend (Node.js/Express).

### Como corrigir?

#### 1. **Remover do código (Se estiver)**
O `pixLimitService.ts` NÃO deve conter:
```typescript
// ❌ ERRADO - NÃO FAZER!
import fs from 'fs';
const key = fs.readFileSync('./certs/...');
```

Está correto usar apenas:
```typescript
// ✅ CORRETO
const API_KEY = import.meta.env.VITE_PIX_API_KEY;
```

#### 2. **Configurar variáveis de ambiente**

Crie um arquivo `.env` (NÃO fazer commit):
```bash
VITE_PIX_API_BASE=https://api-v2.conta-digital.paysmart.com.br/
VITE_PIX_API_KEY=1a6109b1-096c-4e59-9026-6cd5d3caa16d
VITE_PIX_API_KEY_HEADER=x-api-key
```

#### 3. **Certificados vão onde?**

Certificados e chaves privadas devem estar em um **servidor backend**, não no frontend:

```
Backend (Node.js/Express)
  └── certs/
      ├── deltaglobal-prd.paysmart.key   ← Private Key
      └── deltaglobal-prd.paysmart.crt   ← Certificate
```

**Frontend (React)** - Usa apenas:
```
✅ API Key (em env vars)
✅ API Base URL (em env vars)
✅ Headers seguros
```

#### 4. **Nunca fazer commit de:**
```
❌ .key (Private keys)
❌ .pem (Private keys)
❌ .p12 (Certificates)
❌ .crt (Public certificates)
❌ .env (Com credenciais reais)
```

### 5. **Teste a correção**

```bash
# 1. Parar o servidor
# (Ctrl + C no terminal)

# 2. Verificar se .env existe
ls -la .env

# 3. Reiniciar
npm run dev

# 4. Abrir em navegador
http://localhost:5173/backoffice-delta
```

---

## 📋 Checklist de Segurança

- [ ] `.env` foi criado com variáveis locais
- [ ] `.env` está no `.gitignore`
- [ ] Nenhum `.key` ou `.crt` no código
- [ ] API Key usa `import.meta.env`
- [ ] Certificados estão em `.gitignore`
- [ ] Backend separado tem os certificados (se aplicável)

---

## 🚀 Para Produção com Certificados

Se você quer usar certificados no backend:

1. Crie um servidor Node.js/Express com certificados
2. O frontend (React) chama esse servidor intermediário
3. O servidor aplica o mTLS para a API PaySmart

Veja: `BACKOFFICE_DELTA_CERTIFICADOS_SSL.md` para detalhes.

---

## 🆘 Ainda com erro?

Se ainda receber "Network Error":

1. **Verificar console do browser** (F12):
   ```
   • Qual é a mensagem de erro exato?
   • Qual é a URL da requisição?
   • Qual é o status HTTP?
   ```

2. **Testar com curl**:
   ```bash
   curl -X GET \
     "https://api-v2.conta-digital.paysmart.com.br/conta-digital/api/v1/accounts/158/pix/getLimit" \
     -H "x-api-key: 1a6109b1-096c-4e59-9026-6cd5d3caa16d"
   ```

3. **Se retornar erro 403**: API Key inválida ou expirada
4. **Se retornar erro 500**: Problema na API
5. **Se não responder**: Problema de conectividade/firewall

---

**Desenvolvido com ❤️ - Delta Global Bank**
