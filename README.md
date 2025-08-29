# Delta Navigator 🚀

**Sistema avançado de análise de dados e dashboard executivo para gestão inteligente de propostas e conversões.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Tecnologias](#-tecnologias)
- [Configuração Rápida](#-configuração-rápida)
- [Instalação](#-instalação)
- [Banco de Dados](#-banco-de-dados)
- [Arquitetura](#-arquitetura)
- [Deploy](#-deploy)
- [Segurança](#-segurança)

## 🎯 Sobre o Projeto

O **Delta Navigator** é uma plataforma completa de Business Intelligence desenvolvida para análise avançada de dados empresariais, oferecendo insights em tempo real através de dashboards interativos e métricas de conversão.

### 🎮 **Demo Funcionalidades**
- ✅ **Dashboard Executivo** com KPIs em tempo real
- ✅ **Funil de Conversão** com análise completa do pipeline
- ✅ **Sistema de Autenticação** seguro com Supabase
- ✅ **Filtros Avançados** por status, produto e período
- ✅ **Exportação para Excel** de relatórios
- ✅ **Interface Responsiva** para desktop e mobile

## 🌟 Funcionalidades Principais

### 📊 **Dashboard Executivo**
- **Total de Clientes**: Contagem geral de leads/prospects
- **Finalizações**: Propostas com status FINALIZADO
- **Taxa de Conversão**: Percentual de conversão do funil
- **Gráficos Interativos**: Visualizações com Recharts

### 🔀 **Funil de Conversão**
- **6 Etapas do Pipeline**:
  1. Inicio
  2. Proposta Executivo
  3. Envio Proposta
  4. Retorno Proposta
  5. Contato Cliente
  6. Finalizado
- **Filtros Dinâmicos**: Status, produto, período
- **Métricas Detalhadas**: Conversão por etapa

### 🔐 **Autenticação Segura**
- **Login/Registro** com Supabase Auth
- **Proteção de Rotas** com ProtectedRoute
- **Sessão Persistente** automática
- **Confirmação por E-mail** opcional

## 🛠 Tecnologias

### Frontend
- **React 18** + **TypeScript** - Base sólida e tipada
- **Vite** - Build tool ultra-rápido  
- **Tailwind CSS** + **shadcn/ui** - Design system moderno
- **React Query** - Cache inteligente de dados
- **React Router** - Navegação SPA
- **Recharts** - Gráficos interativos
- **React Hook Form** - Formulários otimizados

### Backend
- **Node.js** + **Express** - APIs RESTful
- **SQL Server** - Banco principal (propostas/clientes)
- **PostgreSQL** - Banco analítico (funil/métricas)
- **Supabase** - Autenticação e backend services
- **dotenv** - Gerenciamento de configurações

### DevOps & Deploy
- **Docker** - Containerização
- **Vercel** - Deploy frontend
- **Railway** - Deploy backend
- **Git** - Controle de versão

## ⚡ Configuração Rápida

### 1. Clone o Repositório
```bash
git clone git@github.com:Delta-Global-Dados/Delta-Navigator.git
cd Delta-Navigator
```

### 2. Configure as Variáveis de Ambiente

#### Frontend (raiz do projeto)
```bash
cp .env.example .env
```

Edite `.env`:
```env
# Supabase
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_supabase

# APIs Backend
VITE_API_SQL_URL=http://localhost:3001
VITE_API_POSTGRES_URL=http://localhost:3002
```

#### Backend PostgreSQL
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

#### Backend SQL Server
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

### 3. Instale as Dependências
```bash
# Frontend
npm install

# Backend PostgreSQL
cd postgres-server && npm install && cd ..

# Backend SQL Server  
cd server && npm install && cd ..
```

### 4. Execute o Sistema
```bash
# Todos os serviços simultaneamente
npm run dev:all

# Ou individualmente:
npm run dev                    # Frontend (porta 8080)
npm run dev:postgres          # API PostgreSQL (porta 3002)
npm run dev:sqlserver         # API SQL Server (porta 3001)
```

### 5. Acesse o Sistema
- **Frontend**: http://localhost:8080
- **API PostgreSQL**: http://localhost:3002
- **API SQL Server**: http://localhost:3001

## 📦 Instalação

### Pré-requisitos
- **Node.js 18+**
- **npm** ou **yarn**
- **SQL Server** (com dados de propostas)
- **PostgreSQL** (com dados do funil)
- **Conta Supabase** (para autenticação)

### Comandos de Instalação Completa
```bash
# 1. Clone o repositório
git clone git@github.com:Delta-Global-Dados/Delta-Navigator.git
cd Delta-Navigator

# 2. Instale todas as dependências
npm install
cd postgres-server && npm install && cd ..
cd server && npm install && cd ..

# 3. Configure os arquivos .env (veja seção anterior)

# 4. Execute o sistema
npm run dev:all
```

## 🗄 Banco de Dados

### Estrutura dos Bancos

#### SQL Server (Propostas - Porta 3001)
- **Tabela**: `propostas`
- **Finalidade**: Dados de propostas e clientes
- **Campos principais**: `id`, `cliente`, `status`, `valor`, `data_criacao`

#### PostgreSQL (Funil - Porta 3002)
- **Tabela**: `funil_conversao`
- **Finalidade**: Dados do pipeline de conversão
- **Campos principais**: `id`, `etapa`, `cliente_id`, `status`, `data_etapa`

### Configuração dos Bancos
```sql
-- SQL Server: Criar tabela propostas (exemplo)
CREATE TABLE propostas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    cliente NVARCHAR(255),
    status NVARCHAR(50),
    valor DECIMAL(15,2),
    data_criacao DATETIME DEFAULT GETDATE()
);

-- PostgreSQL: Criar tabela funil_conversao (exemplo)
CREATE TABLE funil_conversao (
    id SERIAL PRIMARY KEY,
    etapa INTEGER,
    cliente_id INTEGER,
    status VARCHAR(50),
    data_etapa TIMESTAMP DEFAULT NOW()
);
```

## 🏗 Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (React + Vite)               │
│                     Porta: 8080                        │
└─────────────────────┬───────────────────────────────────┘
                      │
              ┌───────┴───────┐
              │               │
    ┌─────────▼─────────┐   ┌─▼─────────────────┐
    │   API SQL Server  │   │  API PostgreSQL  │
    │    Porta: 3001    │   │   Porta: 3002    │
    └─────────┬─────────┘   └─┬─────────────────┘
              │               │
    ┌─────────▼─────────┐   ┌─▼─────────────────┐
    │    SQL Server     │   │   PostgreSQL     │
    │    (Propostas)    │   │     (Funil)      │
    └───────────────────┘   └───────────────────┘
```

### Fluxo de Dados
1. **Frontend** faz requisições para ambas APIs
2. **API SQL Server** busca dados de propostas/clientes
3. **API PostgreSQL** busca dados do funil de conversão
4. **Frontend** combina dados e exibe dashboards

## 🚀 Deploy

### Opções de Deploy

| Plataforma | Tipo | Tempo | Complexidade |
|------------|------|-------|--------------|
| **Vercel** | Frontend | 5 min | ⭐ |
| **Railway** | Full-Stack | 10 min | ⭐⭐ |
| **Netlify** | Frontend | 3 min | ⭐ |
| **Docker** | Local/VPS | 15 min | ⭐⭐⭐ |

### Deploy no Vercel (Frontend)
```bash
# 1. Instale a CLI do Vercel
npm i -g vercel

# 2. Faça o deploy
vercel

# 3. Configure as variáveis de ambiente no dashboard
```

### Deploy no Railway (Backend)
```bash
# 1. Conecte o repositório no railway.app
# 2. Configure as variáveis de ambiente
# 3. Deploy automático via Git
```

### Docker (Completo)
```bash
# Execute todo o stack
docker-compose up -d

# Ou individual
docker build -t delta-navigator .
docker run -p 8080:8080 delta-navigator
```

## 🔒 Segurança

### Configurações de Segurança
- ✅ **Variáveis de ambiente** protegidas
- ✅ **Arquivo .env** no .gitignore
- ✅ **Autenticação JWT** com Supabase
- ✅ **CORS** configurado adequadamente
- ✅ **Validação de dados** nas APIs

### Variáveis Sensíveis
```bash
# ⚠️ NUNCA commite estes arquivos:
.env
.env.local
.env.production
server/.env
postgres-server/.env
```

### Backup de Configuração
```bash
# Sempre mantenha exemplos das configurações:
.env.example          # Frontend
server/.env.example   # SQL Server API
postgres-server/.env.example  # PostgreSQL API
```

## 📁 Estrutura do Projeto

```
Delta-Navigator/
├── 📁 src/                    # Frontend React
│   ├── 📁 components/         # Componentes reutilizáveis
│   ├── 📁 pages/             # Páginas principais
│   ├── 📁 hooks/             # Custom hooks
│   └── 📁 data/              # Configurações de API
├── 📁 postgres-server/        # API PostgreSQL
│   ├── server.js             # Servidor Express
│   └── .env.example          # Template configuração
├── 📁 server/                 # API SQL Server
│   ├── server.js             # Servidor Express
│   └── .env.example          # Template configuração
├── 📁 public/                 # Assets estáticos
├── package.json              # Dependências frontend
└── README.md                 # Este arquivo
```

## 🤝 Contribuição

### Como Contribuir
1. **Fork** o projeto
2. **Clone** seu fork
3. **Crie** uma branch para sua feature
4. **Commit** suas mudanças
5. **Push** para a branch
6. **Abra** um Pull Request

### Padrões de Commit
```bash
feat: nova funcionalidade
fix: correção de bug
docs: atualização de documentação
style: formatação de código
refactor: refatoração
test: adição de testes
```

## 📞 Suporte

- **GitHub Issues**: Para bugs e feature requests
- **Documentation**: Veja os arquivos `.md` do projeto
- **Email**: Contato através do GitHub

---

**Desenvolvido com ❤️ pela equipe Delta Global Dados**

*Sistema de análise de dados empresariais com tecnologias modernas e interface intuitiva.*
