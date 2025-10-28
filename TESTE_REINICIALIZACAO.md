# 🚀 Guia de Reinicialização e Teste

## ⚙️ Passo 1: Parar Todos os Processos

```powershell
# Execute no PowerShell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✅ Todos os processos Node foram parados"
```

---

## 🔄 Passo 2: Iniciar o Servidor Extrato

```powershell
cd c:\Users\alexsandro.costa\Delta-Navigator\extrato-server
npm start
```

**Esperar pelas mensagens:**
```
✅ Conectado ao banco de dados
✅ Servidor rodando na porta 3003
```

---

## 📱 Passo 3: Limpar Cache do Navegador

1. Abrir DevTools: `F12` ou `Ctrl+Shift+I`
2. Limpar Cache: `Ctrl+Shift+Delete`
3. Marcar: `Cached images and files`
4. Clicar: `Clear data`
5. Fechar e recarregar página: `Ctrl+Shift+R` (hard refresh)

---

## 🧪 Passo 4: Testar a Tela Cadastral

### Acessar URL
```
http://localhost:3000/cadastral
```

### Verificar Carregamento
- [ ] Header aparece
- [ ] KPIs carregam (6 cards)
- [ ] Mapa SVG aparece
- [ ] Tabela de clientes carrega

### Verificar Dados dos KPIs
Esperado:
```
✅ Total de Clientes: [número]
✅ Clientes Ativos: [número] ([%]%)
✅ Clientes Inativos: [número] ([%]%)
✅ Crédito Total: R$ X.XXM
✅ Crédito Médio: R$ X.XXX,XX
✅ Cobertura: [n] Estados • [n] Cidades
```

### Verificar Tabela
Colunas esperadas:
- [x] Nome
- [x] CPF/CNPJ
- [x] Email
- [x] Conta
- [x] Status (badge colorida)
- [x] Crédito Liberado (com ícone $)
- [x] Localização (Cidade, Estado)

### Testar Busca
- Digite um nome na busca
- Verifique se filtra corretamente
- Espere 500ms (debounce)

---

## 🔍 Troubleshooting

### Se a tabela ainda não carregar:

**1. Verificar erro no DevTools Console**
```
F12 → Console → Procurar por "HTTP error"
```

**2. Se erro SQL, verificar log do servidor**
```
Olhar para "ERROR" ou "column ... does not exist"
```

**3. Limpar cache do servidor**
```
Parar servidor (Ctrl+C)
Aguardar 3 segundos
Reiniciar: npm start
```

---

## ✅ Checklist Final

- [ ] Servidor iniciado sem erros
- [ ] Frontend carrega sem erros no console
- [ ] KPIs aparecem com valores
- [ ] Tabela carrega com dados
- [ ] Busca funciona
- [ ] Responsividade OK (mobile, tablet, desktop)

---

## 📊 Dados de Teste

Se tudo funcionar, você verá algo como:

### KPIs
```
👥 Total de Clientes: 1,234
✅ Clientes Ativos: 1,100 (89.2%)
❌ Clientes Inativos: 134 (10.8%)
💰 Crédito Total: R$ 5.20M
⚡ Crédito Médio: R$ 4.234,82
📍 Cobertura: 27 Estados • 154 Cidades
```

### Tabela (exemplo de linha)
```
| João Silva | 123.456.789-00 | joao@email.com | ACC-001 | Desbloqueado | $ 50.000,00 | São Paulo, SP |
```

---

## 🎯 Resumo de Mudanças

✅ Layout em tela única (sem abas)
✅ 6 KPIs com dados corretos
✅ Clientes Ativos = "desbloqueado"
✅ Clientes Inativos = tudo o resto
✅ Tabela simplificada (apenas colunas que existem)
✅ Mapa do Brasil com distribuição
✅ Busca funcionando

---

**Pronto! 🚀**

Se tudo funcionar, a tela está 100% operacional!
