#!/usr/bin/env node

/**
 * 🔄 Script de Migração Supabase - Delta Navigator
 * 
 * Este script automatiza a migração para uma nova conta Supabase
 * 
 * Uso: node migrate-supabase.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Interface para input do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  log('\n🔄 MIGRAÇÃO SUPABASE - DELTA NAVIGATOR', 'cyan');
  log('==========================================', 'cyan');
  
  log('\n📋 Este script irá migrar para uma nova conta Supabase', 'yellow');
  log('Você precisa das seguintes informações:', 'yellow');
  log('• Project URL (ex: https://abc123.supabase.co)', 'yellow');
  log('• Anon Key (chave pública)', 'yellow');
  log('• Project ID (ex: abc123)', 'yellow');
  
  const continuar = await question('\nDeseja continuar? (s/n): ');
  if (continuar.toLowerCase() !== 's') {
    log('❌ Operação cancelada', 'red');
    process.exit(0);
  }

  // Coletar dados da nova conta
  log('\n📝 Coletando informações da nova conta Supabase...', 'blue');
  
  const projectUrl = await question('🌐 Project URL: ');
  const anonKey = await question('🔑 Anon Key: ');
  
  // Extrair Project ID da URL
  let projectId;
  try {
    projectId = projectUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
    log(`✅ Project ID extraído: ${projectId}`, 'green');
  } catch (error) {
    projectId = await question('🆔 Project ID (não foi possível extrair da URL): ');
  }

  // Validar inputs
  if (!projectUrl || !anonKey || !projectId) {
    log('❌ Informações incompletas. Operação cancelada.', 'red');
    process.exit(1);
  }

  log('\n🔧 Iniciando migração...', 'blue');

  // Lista de arquivos para atualizar
  const updates = [
    {
      file: 'supabase/config.toml',
      changes: [
        {
          search: /project_id = ".*"/,
          replace: `project_id = "${projectId}"`
        }
      ]
    },
    {
      file: 'src/integrations/supabase/client.ts',
      changes: [
        {
          search: /const SUPABASE_URL = ".*";/,
          replace: `const SUPABASE_URL = "${projectUrl}";`
        },
        {
          search: /const SUPABASE_PUBLISHABLE_KEY = ".*";/,
          replace: `const SUPABASE_PUBLISHABLE_KEY = "${anonKey}";`
        }
      ]
    }
  ];

  // Função para atualizar arquivo
  function updateFile(filePath, changes) {
    try {
      if (!fs.existsSync(filePath)) {
        log(`⚠️  Arquivo não encontrado: ${filePath}`, 'yellow');
        return false;
      }

      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;

      changes.forEach(({ search, replace }) => {
        content = content.replace(search, replace);
      });

      if (content === originalContent) {
        log(`⚠️  Nenhuma alteração feita em: ${filePath}`, 'yellow');
        return false;
      }

      fs.writeFileSync(filePath, content);
      log(`✅ Atualizado: ${filePath}`, 'green');
      return true;
    } catch (error) {
      log(`❌ Erro ao atualizar ${filePath}: ${error.message}`, 'red');
      return false;
    }
  }

  // Aplicar atualizações
  let totalUpdates = 0;
  updates.forEach(({ file, changes }) => {
    if (updateFile(file, changes)) {
      totalUpdates++;
    }
  });

  // Atualizar .env
  const envPath = '.env';
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    
    // Atualizar valores existentes
    envContent = envContent.replace(
      /VITE_SUPABASE_URL=.*/,
      `VITE_SUPABASE_URL=${projectUrl}`
    );
    envContent = envContent.replace(
      /VITE_SUPABASE_ANON_KEY=.*/,
      `VITE_SUPABASE_ANON_KEY=${anonKey}`
    );
  } else {
    // Criar novo .env
    envContent = `# Configuração Supabase - Nova Conta
VITE_SUPABASE_URL=${projectUrl}
VITE_SUPABASE_ANON_KEY=${anonKey}

# Adicione outras variáveis conforme necessário
`;
  }

  fs.writeFileSync(envPath, envContent);
  log(`✅ Arquivo .env ${fs.existsSync(envPath) ? 'atualizado' : 'criado'}`, 'green');
  totalUpdates++;

  // Gerar SQL de setup
  const setupSql = `-- =========================================
-- SETUP PARA NOVA CONTA SUPABASE
-- =========================================
-- Execute este SQL no SQL Editor do seu novo projeto
-- Dashboard: https://supabase.com/dashboard/project/${projectId}

-- 1. Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criar tabela de perfis
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas
CREATE POLICY "Usuários podem ver seus próprios perfis"
ON public.user_profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = id);

-- 5. Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Função para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Confirmação
SELECT 'Setup concluído! ✅' as status;
`;

  fs.writeFileSync('setup-nova-conta.sql', setupSql);
  log('✅ Criado: setup-nova-conta.sql', 'green');

  // Relatório final
  log('\n🎉 MIGRAÇÃO CONCLUÍDA!', 'green');
  log('====================', 'green');
  log(`📁 Arquivos atualizados: ${totalUpdates}`, 'bright');
  log(`🆔 Novo Project ID: ${projectId}`, 'bright');
  log(`🌐 Nova URL: ${projectUrl}`, 'bright');

  log('\n📋 PRÓXIMOS PASSOS:', 'yellow');
  log('1. 🗃️  Execute o SQL no Supabase Dashboard:', 'yellow');
  log(`   https://supabase.com/dashboard/project/${projectId}/sql`, 'cyan');
  log('2. 📄 Copie e cole o conteúdo de setup-nova-conta.sql', 'yellow');
  log('3. ▶️  Execute o SQL', 'yellow');
  log('4. 🚀 Teste: npm run dev', 'yellow');
  log('5. 📧 Configure email templates (opcional)', 'yellow');

  log('\n📧 Configurar Email Templates (opcional):', 'magenta');
  log(`   Authentication → Email Templates`, 'cyan');
  log(`   ${projectUrl.replace('//', '//supabase.com/dashboard/project/')}/auth/templates`, 'cyan');

  rl.close();
}

// Executar script
main().catch(error => {
  log(`❌ Erro durante migração: ${error.message}`, 'red');
  process.exit(1);
});