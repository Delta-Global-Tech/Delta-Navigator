-- Configuração de Autenticação para Data Corban Navigator
-- Execute este script no SQL Editor do Supabase

-- 1. Habilitar Row Level Security (RLS) nas tabelas existentes
ALTER TABLE IF EXISTS aberturas_contas ENABLE ROW LEVEL SECURITY;

-- 2. Criar política de acesso para usuários autenticados
CREATE POLICY "Permitir acesso para usuários autenticados" ON aberturas_contas
    FOR ALL USING (auth.role() = 'authenticated');

-- 3. Criar tabela de perfis de usuário (opcional)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Habilitar RLS na tabela de perfis
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Criar política para perfis de usuário
CREATE POLICY "Usuários podem ver e editar seus próprios perfis" ON user_profiles
    FOR ALL USING (auth.uid() = id);

-- 6. Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger para criar perfil quando um novo usuário se registra
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Conceder permissões
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
