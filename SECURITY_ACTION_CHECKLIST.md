# 🚨 AÇÕES DE SEGURANÇA - Checklist Prático

## ✅ O QUE FOI FEITO

### Arquivos Sanitizados
- [x] README.md - Removeu credenciais
- [x] .env.example - Removeu chaves reais
- [x] postgres-server/.env.example - Removeu IP e senha
- [x] iugu-server/.env.example - Removeu senha
- [x] Documentação de segurança criada

---

## ⏳ O QUE VOCÊ PRECISA FAZER AGORA

### 1. REVOGAR CREDENCIAIS EXPOSTAS (CRÍTICO!)

```bash
# Passo 1: Conectar ao PostgreSQL
psql -h seu_host -U postgres -d airflow_treynor

# Passo 2: Alterar senha
\password postgres

# Passo 3: Digite a nova senha (não use a antiga!)
# Nova Senha: [gere uma senha forte]

# Passo 4: Confirme
\q
```

**Senhas que DEVEM ser alteradas:**
- `MinhaSenh@123` (PostgreSQL host 192.168.8.149)
- `u8@UWlfV@mT8TjSVtcEJmOTd` (PostgreSQL host 10.174.1.117)

---

### 2. REGENERAR CHAVES SUPABASE

**Se as chaves em `.env.example` forem reais (verificar!):**

```bash
# Vá em: https://app.supabase.com/projects
# 1. Clique em seu projeto
# 2. Settings → API
# 3. Clique em "Regenerate" para cada chave
# 4. Atualize seus servidores com as novas chaves
```

---

### 3. ATUALIZAR .env LOCALMENTE

```bash
# Copie o .env.example como template
cp .env.example .env

# Edite com suas NOVAS credenciais
code .env

# Verifique que está protegido
git check-ignore .env  # Deve retornar sem erro
```

---

### 4. VERIFICAR HISTÓRICO GIT

```powershell
# PowerShell - Procurar por credenciais no histórico
git log --all -S "MinhaSenh@123"
git log --all -S "u8@UWlfV@mT8TjSVtcEJmOTd"
git log --all -S "192.168.8.149"

# Se encontrar commits, contacte DevOps!
# Será necessário reescrever o histórico
```

---

### 5. INSTALAR FERRAMENTAS DE PREVENÇÃO

#### No Windows:

```powershell
# Executa o script de verificação antes de cada commit
.\pre-commit-check.ps1

# Para automatizar, create um git hook:
# (Copie o conteúdo para .git/hooks/pre-commit)
```

#### No Linux/Mac:

```bash
# Dar permissão de execução
chmod +x .git/hooks/pre-commit

# Instalar gitleaks
brew install gitleaks

# Testar
gitleaks detect --source . --verbose
```

---

### 6. CONFIGURAR EM PRODUÇÃO

#### Vercel (Frontend)
```
1. Dashboard → Settings → Environment Variables
2. Adicione:
   VITE_API_POSTGRES_URL=https://sua-api-producao.com
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua_chave_publica_aqui
3. Redeploy
```

#### Railway (Backend)
```
1. Project → Settings → Variables
2. Adicione:
   POSTGRES_HOST=seu_host_producao
   POSTGRES_PORT=5432
   POSTGRES_DATABASE=producao
   POSTGRES_USER=seu_usuario_forte
   POSTGRES_PASSWORD=sua_senha_forte_aqui
3. Redeploy automático
```

---

## 📋 CHECKLIST DE SEGURANÇA

### Imediato (Hoje)
```
☐ Revogar senha PostgreSQL: MinhaSenh@123
☐ Revogar senha PostgreSQL: u8@UWlfV@mT8TjSVtcEJmOTd
☐ Regenerar chaves Supabase (se necessário)
☐ Regenerar chave Iugu API
☐ Verificar histórico Git com padrões de credencial
☐ Atualizar .env localmente com novas credenciais
☐ Testar que tudo funciona
```

### Esta Semana
```
☐ Instalar pre-commit hooks em todos os PCs
☐ Notificar time sobre mudanças de credenciais
☐ Auditar logs de acesso ao banco de dados
☐ Fazer backup com credenciais revogadas
☐ Implementar GitHub Actions com gitleaks
```

### Este Mês
```
☐ Configurar HashiCorp Vault
☐ Implementar rotation automática de credenciais
☐ Fazer security training com o time
☐ Documentar processo de onboarding seguro
☐ Revisar política de access control
```

---

## 🔍 COMO VERIFICAR SE ESTÁ SEGURO

### 1. Verificar .gitignore

```bash
# Deve incluir:
cat .gitignore | grep "\.env"

# Esperado:
# .env
# .env.local
# .env.*.local
```

### 2. Verificar .env não está em staging

```bash
git status

# Não deve aparecer ".env" na lista de arquivos
```

### 3. Testar pre-commit hook

```bash
# Tentar commitar um .env falso
echo "PASSWORD=teste123" > teste.env
git add teste.env
git commit -m "test"

# Deve rejeitar com mensagem de erro
```

### 4. Executar verificação manual

```powershell
# Windows
.\pre-commit-check.ps1

# Linux/Mac
bash .git/hooks/pre-commit
```

---

## 🚨 EMERGÊNCIA - SE HOUVER VAZAMENTO

```bash
# 1. Revogar IMEDIATAMENTE
ALTER ROLE postgres WITH PASSWORD 'nova_senha_nao_use_a_antiga';

# 2. Verificar acessos
SELECT usename, datname, client_addr, state_change 
FROM pg_stat_activity 
WHERE datname='seu_banco';

# 3. Procurar no histórico
git log --all -S "senha_comprometida"

# 4. Reescrever histórico (contate DevOps)
# ⚠️ Isto é destrutivo!
git filter-branch --tree-filter 'sed -i "s/senha_comprometida/nova_senha/g"' -- --all

# 5. Force push (risco!)
git push --force-with-lease origin main
```

---

## 📞 SUPORTE

**Dúvidas sobre segurança?**
- 📧 Email: security@delta-global.com
- 💬 Discord: #security-channel
- 🐛 GitHub Issues: com label "security"

**Encontrou outra credencial exposta?**
- ⚠️ NÃO abra issue pública
- 📧 Envie para security@delta-global.com
- 🔒 Use GitHub Security Advisory

---

## ✨ Próximas Melhorias

- [ ] GitHub Actions com SAST (SonarQube)
- [ ] GitHub Actions com dependency scanning
- [ ] GitHub Actions com container scanning
- [ ] Implementar Vault para secrets
- [ ] 2FA obrigatório para acesso ao banco
- [ ] Audit logging de todas as queries
- [ ] Rotating access keys a cada 90 dias

---

**Última Atualização**: 2 de Dezembro de 2025  
**Status**: ✅ Repositório Seguro (com ações pendentes)  
**Responsável**: Delta Global Dados - Security Team

---

Não se preocupe, você está no caminho certo! 🚀
