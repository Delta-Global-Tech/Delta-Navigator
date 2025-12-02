-- ========================================
-- Aumentar Expiração de Token de Reset
-- ========================================
-- Execute este script no Supabase SQL Editor

-- Aumentar expiração para 7 dias (604800 segundos)
UPDATE auth.config 
SET value = '604800'
WHERE key = 'password_reset_token_expiry';

-- Aumentar expiração de email confirmation para 7 dias também
UPDATE auth.config 
SET value = '604800'
WHERE key = 'email_confirmation_token_expiry';

-- Verificar se foi alterado
SELECT key, value FROM auth.config 
WHERE key IN ('password_reset_token_expiry', 'email_confirmation_token_expiry');

-- Se não funcionar acima, tente isso:
-- Atualizar via settings
UPDATE auth.sessions
SET expires_at = now() + INTERVAL '7 days'
WHERE created_at > now() - INTERVAL '1 day';
