-- ========================================
-- AUDIT LOG - Script de Criação
-- ========================================
-- Execute este script no Supabase SQL Editor

-- 0. Criar tabela de roles (permissões)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user', -- 'admin', 'user', 'viewer'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- 1. Criar tabela de audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL, -- 'LOGIN', 'LOGOUT', 'VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', etc
  resource TEXT NOT NULL, -- 'Dashboard', 'Contratos', 'Faturas', etc
  resource_id TEXT, -- ID do recurso afetado (opcional)
  details JSONB DEFAULT NULL, -- Dados adicionais
  ip_address INET,
  user_agent TEXT,
  status TEXT DEFAULT 'success', -- 'success', 'error', 'warning'
  error_message TEXT,
  duration_ms INTEGER, -- Tempo de execução em ms
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índices
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_composite ON audit_logs(user_id, created_at DESC);

-- 2. Enable RLS (Row Level Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política: Usuários admin podem ver todos os logs
CREATE POLICY "admin_can_view_all_logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Usuários podem ver seus próprios logs
CREATE POLICY "users_can_view_own_logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Qualquer pessoa logada pode inserir (log próprio)
CREATE POLICY "authenticated_can_insert_logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Função para criar log automaticamente (exemplo)
CREATE OR REPLACE FUNCTION log_audit_action(
  p_user_id UUID,
  p_user_email TEXT,
  p_action TEXT,
  p_resource TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_status TEXT DEFAULT 'success'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    user_email,
    action,
    resource,
    resource_id,
    details,
    status,
    created_at
  )
  VALUES (
    p_user_id,
    p_user_email,
    p_action,
    p_resource,
    p_resource_id,
    p_details,
    p_status,
    now()
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Função para listar logs do usuário (paginado)
CREATE OR REPLACE FUNCTION get_audit_logs(
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_resource TEXT DEFAULT NULL,
  p_action TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_email TEXT,
  action TEXT,
  resource TEXT,
  resource_id TEXT,
  details JSONB,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.user_email,
    al.action,
    al.resource,
    al.resource_id,
    al.details,
    al.status,
    al.created_at,
    COUNT(*) OVER() as total_count
  FROM audit_logs al
  WHERE 
    (p_resource IS NULL OR al.resource = p_resource)
    AND (p_action IS NULL OR al.action = p_action)
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 5. Função para estatísticas
CREATE OR REPLACE FUNCTION get_audit_stats(p_days INT DEFAULT 30)
RETURNS TABLE (
  action TEXT,
  count BIGINT,
  success_count BIGINT,
  error_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.action,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE al.status = 'success')::BIGINT,
    COUNT(*) FILTER (WHERE al.status = 'error')::BIGINT
  FROM audit_logs al
  WHERE al.created_at >= now() - INTERVAL '1 day' * p_days
  GROUP BY al.action
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Testes (opcional)
-- ========================================

-- Inserir seu usuário como ADMIN (substitua seu email)
-- Descomente e execute com seu email real
/*
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users
WHERE email = 'seu-email@email.com'
ON CONFLICT (user_id, role) DO NOTHING;
*/

-- Inserir log de teste
SELECT log_audit_action(
  auth.uid(),
  (SELECT email FROM auth.users WHERE id = auth.uid()),
  'LOGIN',
  'Dashboard',
  NULL,
  jsonb_build_object('browser', 'Chrome'),
  'success'
);

-- Ver logs
SELECT * FROM get_audit_logs(50, 0) LIMIT 10;

-- Ver estatísticas
SELECT * FROM get_audit_stats(30);
