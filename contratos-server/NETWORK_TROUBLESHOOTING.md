# 🔧 Solução para Acesso Externo ao Contratos Server

## 📋 **Resumo do Problema**
O servidor está funcionando no localhost (127.0.0.1:3004), mas não está acessível de outros computadores na rede devido ao **firewall do Windows**.

## 🌐 **Informações da Rede**
- **IP Local:** 192.168.8.149
- **Porta:** 3004
- **URL Externa:** http://192.168.8.149:3004

## ✅ **Soluções (Execute na ordem)**

### **1. Configurar Firewall (RECOMENDADO)**

**Opção A - Via Interface Gráfica:**
1. Pressione `Win + R` e digite `wf.msc`
2. Clique em "Regras de Entrada" → "Nova Regra"
3. Escolha "Porta" → Avançar
4. TCP → Portas locais específicas: `3004` → Avançar
5. "Permitir a conexão" → Avançar
6. Marque todos os perfis → Avançar
7. Nome: "Contratos Server 3004" → Concluir

**Opção B - Via PowerShell (Como Administrador):**
```powershell
# Execute o script que foi criado:
cd "c:\Users\alexsandro.costa\Delta-Navigator\contratos-server"
.\setup-firewall.ps1
```

### **2. Verificar se Funcionou**

Execute este comando **DO SEU PC**:
```powershell
curl http://192.168.8.149:3004/api/test-connection
```

Execute este comando **DE OUTRO PC** na rede:
```bash
curl http://192.168.8.149:3004/api/test-connection
```

### **3. Testar no Frontend**

Se o teste acima funcionar, atualize a configuração do frontend:
- Acesse: http://192.168.8.149:3000 (ou a porta do seu frontend)
- Verifique se consegue acessar a tela de desembolso

## 🔍 **Diagnóstico**

Execute o script de diagnóstico:
```powershell
cd "c:\Users\alexsandro.costa\Delta-Navigator\contratos-server"
.\test-network.ps1
```

## 🛠️ **Alternativas se o Firewall não Resolver**

1. **Desabilitar Firewall Temporariamente** (NÃO RECOMENDADO):
   ```powershell
   # CUIDADO - Só para teste!
   netsh advfirewall set allprofiles state off
   # Para reativar depois:
   netsh advfirewall set allprofiles state on
   ```

2. **Verificar Antivírus:**
   - Alguns antivírus bloqueiam conexões
   - Adicione exceção para Node.js ou porta 3004

3. **Usar Porta Diferente:**
   - Altere no server.js: `const port = 3005;`
   - Teste se a nova porta funciona

## 📝 **Status Atual**
- ✅ Servidor rodando corretamente
- ✅ Escutando em 0.0.0.0:3004 (todas as interfaces)
- ✅ CORS configurado para redes locais
- ❌ Firewall bloqueando conexões externas
- ❌ Falta regra de firewall para porta 3004

## 🎯 **URLs para Teste**
- **Local:** http://localhost:3004/health
- **Rede:** http://192.168.8.149:3004/health
- **API Teste:** http://192.168.8.149:3004/api/test-connection
- **Desembolso:** http://192.168.8.149:3004/api/contratos/desembolso

## 💡 **Dicas**
1. **Sempre teste local primeiro** antes de tentar acesso externo
2. **Execute PowerShell como Administrador** para comandos de firewall
3. **Verifique se outros serviços** (3000, 3003) também precisam de regras
4. **Reinicie o servidor** após mudanças de firewall (às vezes necessário)

---
*Última atualização: 15/10/2025*