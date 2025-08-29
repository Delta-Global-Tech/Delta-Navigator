# Data Corban Navigator

Sistema completo de análise e navegação de dados para gestão de propostas, funil de conversão e insights empresariais.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [🔐 Sistema de Autenticação](#-sistema-de-autenticação)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [🚀 Deploy e Publicação](#-deploy-e-publicação)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Execução](#execução)
- [Funcionalidades](#funcionalidades)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Banco de Dados](#banco-de-dados)
- [API](#api)
- [Contribuição](#contribuição)

## 🚀 Sobre o Projeto

O Data Corban Navigator é uma aplicação web moderna para análise e gestão de dados empresariais, oferecendo:

- **Dashboard Executivo**: KPIs e métricas principais
- **🔐 Sistema de Login**: Autenticação segura com Supabase
- **Gestão de Propostas**: Controle completo do ciclo de propostas
- **Funil de Conversão**: Análise detalhada do pipeline de vendas
- **Explorador de Dados**: Interface para consulta e análise
- **Relatórios**: Exportação para Excel e visualizações interativas
- **Qualidade de Dados**: Monitoramento e validação

## � Configuração de Segurança

### ⚠️ IMPORTANTE - Configuração de Credenciais

Este projeto **NÃO** inclui credenciais de banco de dados. Você deve configurar suas próprias:

#### 1. PostgreSQL Server
```bash
cd postgres-server
cp .env.example .env
```

Edite `postgres-server/.env`:
```env
HOST=seu_host_postgres
PORT=5432
DB=seu_banco_postgres
DB_USER=seu_usuario_postgres
PASSWORD=sua_senha_postgres
```

#### 2. SQL Server
```bash
cd server
cp .env.example .env
```

Edite `server/.env`:
```env
SQLSERVER_HOST=seu_host_sqlserver
SQLSERVER_PORT=1433
SQLSERVER_DATABASE=seu_banco_sqlserver
SQLSERVER_USER=seu_usuario_sqlserver
SQLSERVER_PASSWORD=sua_senha_sqlserver
```

#### 3. Arquivos de Teste
Os arquivos `test-connection.js` e `test-full-query.js` precisam ter as senhas configuradas manualmente.

### 🛡️ Segurança
- ✅ Credenciais protegidas em `.env`
- ✅ `.gitignore` configurado
- ✅ Variáveis de ambiente obrigatórias
- ⚠️ **NUNCA** commite arquivos `.env`

## �🔐 Sistema de Autenticação

**✅ LOGIN IMPLEMENTADO E FUNCIONAL!**

O sistema possui autenticação completa usando Supabase:

### 🚀 **Como Usar**
1. **Primeira vez**: Clique em "Criar conta" na tela de login
2. **Login**: Use seu e-mail e senha
3. **Logout**: Clique no avatar → "Sair"

### 🛡️ **Funcionalidades**
- ✅ Login seguro com e-mail/senha
- ✅ Registro de novos usuários
- ✅ Confirmação por e-mail
- ✅ Proteção completa de rotas
- ✅ Sessão persistente
- ✅ Interface responsiva

### 📖 **Documentação Completa**
Veja [AUTHENTICATION.md](./AUTHENTICATION.md) para instruções detalhadas de configuração e uso.

**⚠️ Importante**: Execute o script `supabase/setup-auth.sql` no Supabase antes do primeiro uso.

## 🛠 Tecnologias

### Frontend
- **React 18** - Framework principal
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes UI modernos
- **React Router** - Navegação SPA
- **Zustand** - Gerenciamento de estado
- **React Query** - Cache e sincronização de dados
- **Recharts** - Gráficos e visualizações
- **XLSX** - Exportação para Excel

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **SQL Server** - Banco principal (propostas)
- **PostgreSQL** - Banco secundário (funil)
- **Supabase** - Backend-as-a-Service + Autenticação
- **CORS** - Cross-Origin Resource Sharing

### Autenticação & Segurança
- **Supabase Auth** - Sistema de autenticação
- **JWT Tokens** - Tokens seguros
- **Row Level Security** - Proteção de dados
- **E-mail Verification** - Confirmação de conta

### Ferramentas
- **ESLint** - Linting
- **Concurrently** - Execução paralela
- **dotenv** - Variáveis de ambiente

## 🏗 Arquitetura

O sistema utiliza uma arquitetura multi-camadas:

```
Frontend (React + TypeScript)
    ↓
API Gateway / Routing
    ↓
┌─────────────────┬─────────────────┐
│   SQL Server    │   PostgreSQL    │
│   (Propostas)   │     (Funil)     │
│   Porta: 3001   │   Porta: 3002   │
└─────────────────┴─────────────────┘
```

## 🚀 Deploy e Publicação

**🌐 SISTEMA PRONTO PARA PUBLICAÇÃO NA WEB!**

### ⚡ **Deploy Rápido (10 minutos)**

#### 🥇 **Vercel + Railway (Recomendado)**
```bash
# 1. Frontend no Vercel (vercel.com)
#    - Conectar GitHub → Deploy automático
#    - URL: https://data-corban-navigator.vercel.app

# 2. Backends no Railway (railway.app)  
#    - 2 serviços: SQL + PostgreSQL APIs
#    - URLs automáticas com HTTPS
```

#### 🏆 **Opções de Hospedagem**

| Plataforma | Tipo | Custo | Tempo Deploy |
|------------|------|-------|--------------|
| **Vercel** | Frontend | Gratuito | 5 min |
| **Railway** | Full-Stack | Gratuito/5$ | 10 min |
| **Netlify** | Frontend | Gratuito | 3 min |
| **Render** | Full-Stack | Gratuito | 15 min |
| **AWS** | Completo | $20-100+ | 30+ min |

### 📚 **Guias Completos**
- **[DEPLOY-QUICK.md](./DEPLOY-QUICK.md)** - Deploy em 10 minutos
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guia completo com todas as opções

### 🔗 **URLs de Exemplo**
- **Demo**: `https://data-corban-navigator.vercel.app`
- **API SQL**: `https://sql-api.railway.app`
- **API PostgreSQL**: `https://postgres-api.railway.app`

### ✅ **Arquivos de Deploy Incluídos**
- `vercel.json` - Configuração Vercel
- `netlify.toml` - Configuração Netlify  
- `Dockerfile` - Container Docker
- `docker-compose.yml` - Stack completa

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- SQL Server
- PostgreSQL

### Clone e Dependências

```bash
# Clone o repositório
git clone https://github.com/2carllos/data-corban-navigator.git

# Navegue até o diretório
cd data-corban-navigator

# Instale as dependências do frontend
npm install

# Instale as dependências do backend SQL Server
cd server
npm install

# Instale as dependências do backend PostgreSQL
cd ../postgres-server
npm install

# Volte para o diretório raiz
cd ..

```

## ⚙️ Configuração

### Variáveis de Ambiente

Crie os arquivos `.env` em cada diretório:

#### Frontend (raiz)
```env
VITE_API_URL=http://localhost:3001
VITE_POSTGRES_API_URL=http://localhost:3002
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

#### Backend SQL Server (./server/.env)
```env
SQLSERVER_HOST=192.168.10.230
SQLSERVER_PORT=49172
SQLSERVER_USER=sa
SQLSERVER_PASSWORD=your_password
SQLSERVER_DB=treynor
PORT=3001
```

#### Backend PostgreSQL (./postgres-server/.env)
```env
HOST=localhost
PORT=5432
DB=funil_conversao
DB_USER=postgres
PASSWORD=your_password
```

## 🚀 Execução

### Desenvolvimento Completo (Recomendado)
```bash
# Executa frontend + ambos backends simultaneamente
npm run dev:full
```

### Execução Individual

#### Frontend apenas
```bash
npm run dev
```

#### Ambos backends
```bash
npm run servers
```

#### SQL Server apenas
```bash
npm run server:sql
# ou manualmente:
cd server && node server.js
```

#### PostgreSQL apenas
```bash
npm run server:postgres
# ou manualmente:
cd postgres-server && node server.js
```

### Como Executar os Dois Backends Manualmente

Para rodar ambos backends em terminais separados:

**Terminal 1:**
```bash
cd /home/alexsandro/Documentos/Github/deltaCorban/data-corban-navigator/server && node server.js
```

**Terminal 2:**
```bash
cd /home/alexsandro/Documentos/Github/deltaCorban/data-corban-navigator/postgres-server && node server.js
```

## ✨ Funcionalidades

### 📊 Dashboard
- KPIs executivos em tempo real
- Gráficos interativos com Recharts
- Métricas de performance
- Filtros por período

### 📋 Gestão de Propostas
- Listagem completa de propostas
- Filtros avançados por status, período, valor
- Exportação para Excel (XLSX)
- Formatação automática de valores monetários
- Visualização detalhada por cliente

### 🔄 Funil de Conversão
- Análise do pipeline de vendas
- Conversão por etapas
- Filtros interativos
- Exportação de dados
- Métricas de performance por etapa

### 🔍 Explorador de Dados
- Interface de consulta flexível
- Upload de arquivos
- Validação de dados
- Visualizações customizáveis

### 📈 Relatórios
- Relatórios executivos
- Insights automáticos
- Exportação em múltiplos formatos
- Agendamento de relatórios

### ✅ Qualidade de Dados
- Validação automática
- Identificação de inconsistências
- Sugestões de correção
- Monitoramento contínuo

## 📁 Estrutura do Projeto

```
data-corban-navigator/
├── 📂 src/                          # Frontend React
│   ├── 📂 components/               # Componentes React
│   │   ├── 📂 ui/                   # Componentes shadcn/ui
│   │   ├── 📂 layout/               # Layout (Header, Sidebar)
│   │   └── 📂 dashboard/            # Componentes do dashboard
│   ├── 📂 pages/                    # Páginas da aplicação
│   ├── 📂 hooks/                    # Custom hooks
│   ├── 📂 lib/                      # Utilitários
│   ├── 📂 data/                     # Configurações de dados
│   └── 📂 store/                    # Gerenciamento de estado
├── 📂 server/                       # Backend SQL Server
│   ├── server.js                    # Servidor Express (porta 3001)
│   ├── package.json                 # Dependências backend
│   └── .env                         # Variáveis SQL Server
├── 📂 postgres-server/              # Backend PostgreSQL
│   ├── server.js                    # Servidor Express (porta 3002)
│   ├── package.json                 # Dependências backend
│   └── .env                         # Variáveis PostgreSQL
├── 📂 supabase/                     # Configurações Supabase
│   ├── config.toml                  # Configuração do projeto
│   └── 📂 migrations/               # Migrações do banco
├── 📂 public/                       # Arquivos estáticos
│   ├── logo.png                     # Logo customizado
│   └── favicon.ico                  # Favicon
└── 📄 package.json                  # Dependências principais
```

## 🗄️ Banco de Dados

### SQL Server (Propostas)
- **Host**: 192.168.10.230:49172
- **Database**: treynor
- **Tabelas principais**:
  - Propostas
  - Clientes
  - Produtos
  - Status

### PostgreSQL (Funil)
- **Host**: localhost:5432
- **Database**: funil_conversao
- **Tabelas principais**:
  - Etapas
  - Conversões
  - Métricas

### Supabase
- Autenticação
- Storage de arquivos
- Real-time subscriptions

## 🔌 API

### Endpoints SQL Server (porta 3001)

```
GET    /api/propostas              # Lista propostas
GET    /api/propostas/:id          # Proposta específica
POST   /api/propostas              # Criar proposta
PUT    /api/propostas/:id          # Atualizar proposta
DELETE /api/propostas/:id          # Excluir proposta
GET    /api/dashboard              # KPIs dashboard
GET    /api/relatorios             # Relatórios
```

### Endpoints PostgreSQL (porta 3002)

```
GET    /api/funil                  # Dados do funil
GET    /api/funil/etapas           # Etapas do funil
GET    /api/funil/conversoes       # Conversões
POST   /api/funil/dados            # Inserir dados
GET    /api/funil/metricas         # Métricas de conversão
```

## 🔧 Scripts Disponíveis

```bash
# Frontend
npm run dev              # Desenvolvimento
npm run build            # Build produção
npm run preview          # Preview build
npm run lint             # Linting

# Backend
npm run server:sql       # SQL Server
npm run server:postgres  # PostgreSQL
npm run servers          # Ambos backends

# Completo
npm run dev:full         # Frontend + Backends
```

## 🎯 Tecnologias de Destaque

### Frontend Moderno
- **Vite**: Build ultrarrápido
- **TypeScript**: Type safety
- **Tailwind**: CSS utilitário
- **shadcn/ui**: Componentes consistentes

### Performance
- **React Query**: Cache inteligente
- **Code Splitting**: Carregamento otimizado
- **Tree Shaking**: Bundle mínimo

### UX/UI
- **Responsivo**: Mobile-first
- **Dark/Light Mode**: Temas dinâmicos
- **Acessibilidade**: ARIA compliant
- **Animações**: Smooth transitions

## 📊 Monitoramento

- **Sync Status**: Tempo real
- **Error Tracking**: Logs centralizados
- **Performance**: Métricas de load
- **Usage Analytics**: Tracking de uso

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença privada. Todos os direitos reservados.

## 👥 Equipe

- **Desenvolvedor Principal**: Alexsandro
- **Repositório**: https://github.com/2carllos/data-corban-navigator

## 🆘 Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Entre em contato com a equipe de desenvolvimento

---

**Versão**: 1.0.0  
**Última atualização**: Agosto 2025
```