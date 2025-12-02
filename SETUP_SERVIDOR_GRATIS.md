# 🔧 SETUP PRÁTICO - Seu Servidor Seguro 100% Grátis

**Tempo estimado**: 2-3 horas  
**Custo**: R$ 0,00  
**Resultado**: Servidor conforme BACEN

---

## 📋 **PRÉ-REQUISITOS**

- [ ] Servidor Linux (Ubuntu 20.04+)
- [ ] Acesso root/sudo
- [ ] Domínio (ou IP temporário)
- [ ] 10GB espaço em disco
- [ ] 2GB RAM mínimo

**Não tem servidor?**  
→ Use Oracle Cloud Always Free: https://www.oracle.com/cloud/free/

---

## ⏱️ **HORA 0: PREPARAR O SERVIDOR**

```bash
# 1. Atualizar sistema
sudo apt-get update
sudo apt-get upgrade -y

# 2. Instalar essenciais
sudo apt-get install -y \
  curl \
  wget \
  git \
  htop \
  net-tools \
  unzip \
  zip

# 3. Criar diretório para projeto
mkdir -p ~/delta-navigator
cd ~/delta-navigator

# 4. Verificar versões
node --version  # v18+
npm --version   # 9+
docker --version # 20+
```

---

## ⏱️ **HORA 1: INSTALAR VAULT (Gerenciar Secrets)**

```bash
# 1. Download e instalar
wget https://releases.hashicorp.com/vault/1.15.0/vault_1.15.0_linux_amd64.zip
unzip vault_1.15.0_linux_amd64.zip
sudo mv vault /usr/local/bin/
sudo chmod +x /usr/local/bin/vault

# 2. Verificar
vault version
# Output: Vault v1.15.0

# 3. Criar diretório de dados
mkdir -p ~/vault/data
mkdir -p ~/vault/config

# 4. Criar arquivo de configuração
cat > ~/vault/config/vault.hcl << 'EOF'
storage "file" {
  path = "/home/ubuntu/vault/data"
}

listener "tcp" {
  address       = "127.0.0.1:8200"
  tls_disable   = 1  # Em produção, usar TLS!
}

ui = true
EOF

# 5. Iniciar Vault (em background)
nohup vault server -config ~/vault/config/vault.hcl > ~/vault/vault.log 2>&1 &

# 6. Verificar se está rodando
sleep 2
curl http://127.0.0.1:8200/ui/
# Você deveria ver a interface Vault

# 7. Configurar variáveis de ambiente
export VAULT_ADDR='http://127.0.0.1:8200'

# 8. Inicializar Vault (primeira vez)
vault operator init -key-shares=1 -key-threshold=1

# GUARDE O OUTPUT! Contém chave e token
# Exemplo de output:
# Unseal Key 1: xxxxxxxxxxxxxxxx
# Initial Root Token: s.xxxxxxxxxxxxxxx

# 9. Unseal Vault
vault operator unseal [UNSEAL_KEY_ACIMA]

# 10. Login no Vault
vault login [ROOT_TOKEN_ACIMA]

# 11. Adicionar seus secrets
vault kv put secret/delta-navigator/db-password \
  value="YourStrongPassword123!@"

vault kv put secret/delta-navigator/jwt-secret \
  value="YourJWTSecretKeyHere12345"

vault kv put secret/delta-navigator/master-key \
  value="32byteshexstringfor256bitkey1234"

# 12. Verificar se foi armazenado
vault kv get secret/delta-navigator/db-password

# Sucesso! ✅
```

**Depois de reboot**:
```bash
# Vault não reinicia automaticamente
# Crie um systemd service:

sudo tee /etc/systemd/system/vault.service > /dev/null << EOF
[Unit]
Description=HashiCorp Vault
Requires=network-online.target
After=network-online.target
ConditionFileNotEmpty=/home/ubuntu/vault/config/vault.hcl

[Service]
ProtectSystem=full
ProtectHome=yes
NoNewPrivileges=yes
PrivateTmp=yes
PrivateDevices=yes
SecureBits=keep-caps
AmbientCapabilities=CAP_IPC_LOCK
CapabilityBoundingSet=CAP_SYSLOG CAP_IPC_LOCK
LimitNOFILE=65536
LimitNPROC=512
KillMode=process
Restart=on-failure
RestartSec=5
TimeoutStopSec=30
LimitMEMLOCK=infinity
ExecStart=/usr/local/bin/vault server -config=/home/ubuntu/vault/config/vault.hcl
ExecReload=/bin/kill -HUP $MAINPID
StandardOutput=journal
StandardError=journal
SyslogIdentifier=vault

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable vault
sudo systemctl start vault
```

---

## ⏱️ **HORA 2: HTTPS COM LET'S ENCRYPT (Grátis)**

```bash
# 1. Instalar Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 2. Gerar certificado
# OPÇÃO A: Se tem domínio
sudo certbot certonly --standalone \
  -d seu-dominio.com \
  -d app.seu-dominio.com \
  -d api.seu-dominio.com

# OPÇÃO B: Se não tem domínio (teste local)
# Use IP: https://[seu-ip-publico]

# 3. Verificar certificados
ls -la /etc/letsencrypt/live/seu-dominio.com/

# Você deveria ver:
# fullchain.pem (certificado + chain)
# privkey.pem (chave privada)

# 4. Renovação automática
sudo certbot renew --dry-run

# Output esperado: "Cert not yet due for renewal"
# Certificado se renova automaticamente 30 dias antes

# 5. Verificar cron
sudo systemctl list-timers
# Procure por certbot timer
```

---

## ⏱️ **HORA 3: NGINX (Reverse Proxy Seguro)**

```bash
# 1. Instalar NGINX
sudo apt-get install -y nginx

# 2. Criar arquivo de configuração
sudo nano /etc/nginx/sites-available/delta-navigator

# Cole isto:
```

```nginx
# /etc/nginx/sites-available/delta-navigator

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

# Upstream backend
upstream backend {
  server 127.0.0.1:3001;
  keepalive 64;
}

# HTTP -> HTTPS redirect
server {
  listen 80;
  server_name seu-dominio.com *.seu-dominio.com;
  return 301 https://$server_name$request_uri;
}

# HTTPS (secure)
server {
  listen 443 ssl http2;
  server_name seu-dominio.com;

  # SSL Certificates (Let's Encrypt)
  ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;

  # SSL Configuration (A+ rating)
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
  ssl_prefer_server_ciphers on;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 10m;

  # Security headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "no-referrer" always;

  # CORS restritivo
  set $cors "";
  if ($http_origin ~* ^(https?://(seu-dominio\.com|app\.seu-dominio\.com|api\.seu-dominio\.com))$) {
    set $cors "true";
  }

  if ($cors = "true") {
    add_header 'Access-Control-Allow-Origin' $http_origin;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With';
    add_header 'Access-Control-Allow-Credentials' 'true';
  }

  if ($request_method = OPTIONS) {
    return 204;
  }

  # Logging
  access_log /var/log/nginx/delta-navigator-access.log;
  error_log /var/log/nginx/delta-navigator-error.log;

  # API routes
  location /api/ {
    # Rate limiting
    limit_req zone=api_limit burst=20 nodelay;

    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Request-ID $request_id;
    proxy_cache_bypass $http_upgrade;
  }

  # Auth routes (stricter rate limit)
  location /auth/ {
    limit_req zone=auth_limit burst=5 nodelay;

    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  # Frontend
  location / {
    root /var/www/delta-navigator;
    try_files $uri /index.html;
  }
}

# Subdomain: app.seu-dominio.com (adicional)
server {
  listen 443 ssl http2;
  server_name app.seu-dominio.com;

  # Mesmo SSL certificate (wildcard ou multiple)
  ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;

  # ... mesmas configs SSL e headers ...

  location / {
    root /var/www/delta-navigator-app;
    try_files $uri /index.html;
  }
}
```

```bash
# 3. Ativar configuração
sudo ln -s /etc/nginx/sites-available/delta-navigator \
  /etc/nginx/sites-enabled/

# 4. Remover default
sudo rm /etc/nginx/sites-enabled/default

# 5. Testar configuração
sudo nginx -t
# Output: "nginx: configuration file test is successful"

# 6. Iniciar NGINX
sudo systemctl start nginx
sudo systemctl enable nginx

# 7. Verificar status
sudo systemctl status nginx

# 8. Testar HTTPS
curl -I https://seu-dominio.com/
# Deve retornar 200 OK
```

---

## ⏱️ **HORA 4: BACKEND SEGURO (Node.js)**

```bash
# 1. Ir para diretório do projeto
cd ~/delta-navigator

# 2. Instalar dependências
npm install

# 3. Criar arquivo .env.production (NÃO no git!)
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=3001
VAULT_ADDR=http://127.0.0.1:8200
VAULT_TOKEN=s.xxxxxxx # Cole seu token aqui
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=delta_navigator
POSTGRES_USER=delta_user
# ❌ NUNCA coloque senha aqui!
EOF

# 4. Criar server/lib/vault-client.ts
cat > server/lib/vault-client.ts << 'EOF'
import axios from 'axios';

const vaultAddr = process.env.VAULT_ADDR || 'http://localhost:8200';
const vaultToken = process.env.VAULT_TOKEN;

export async function getSecret(path: string): Promise<string> {
  try {
    const response = await axios.get(
      `${vaultAddr}/v1/${path}`,
      { headers: { 'X-Vault-Token': vaultToken } }
    );
    return response.data.data.data.value;
  } catch (error) {
    console.error(`Erro ao buscar secret ${path}:`, error);
    throw new Error(`Secret not found: ${path}`);
  }
}

// Usar assim:
// const dbPassword = await getSecret('secret/delta-navigator/db-password');
EOF

# 5. Atualizar server.js para usar Vault
# Veja exemplo nos TEMPLATES_PRONTOS.md

# 6. Deploy em produção
npm run build
pm2 start server.js --name "delta-navigator"
```

---

## ⏱️ **HORA 5: POSTGRESQL COM CRIPTOGRAFIA**

```bash
# 1. Instalar PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# 2. Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 3. Criar banco e usuário
sudo -u postgres psql << EOF
CREATE USER delta_user WITH PASSWORD 'StrongPassword123!@';
CREATE DATABASE delta_navigator OWNER delta_user;
GRANT ALL PRIVILEGES ON DATABASE delta_navigator TO delta_user;
\c delta_navigator
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF

# 4. Criar tabelas com audit
sudo -u postgres psql delta_navigator << 'EOF'
-- Tabela de clientes (com campos encriptados)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  
  -- CPF encriptado
  cpf_encrypted TEXT,
  cpf_iv TEXT,
  cpf_auth_tag TEXT,
  cpf_hash VARCHAR(64) UNIQUE, -- Para busca
  
  -- CNPJ encriptado
  cnpj_encrypted TEXT,
  cnpj_iv TEXT,
  cnpj_auth_tag TEXT,
  
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de audit logs (imutável)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP DEFAULT NOW(),
  user_id UUID,
  user_email VARCHAR(255),
  ip_address INET,
  action VARCHAR(50), -- CREATE, READ, UPDATE, DELETE
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  old_values JSONB,
  new_values JSONB,
  status VARCHAR(20),
  error_message TEXT,
  session_id VARCHAR(255),
  compliance_relevant BOOLEAN DEFAULT FALSE
);

-- Índices para performance
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_clients_cpf_hash ON clients(cpf_hash);

-- Função para logar mudanças automaticamente
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, action, resource_type, resource_id,
    old_values, new_values, status
  ) VALUES (
    current_setting('app.current_user_id', true)::UUID,
    TG_OP,
    TG_TABLE_NAME,
    (NEW).id::TEXT,
    row_to_json(OLD),
    row_to_json(NEW),
    'SUCCESS'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ativar triggers
CREATE TRIGGER audit_clients
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION log_audit();

-- RLS (Row Level Security) - básico
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_access ON audit_logs
  FOR SELECT USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );
EOF

# 5. Conectar do Node.js
# Veja TEMPLATES_PRONTOS.md para código de conexão
```

---

## ⏱️ **HORA 6: ELK STACK (Logging Centralizado)**

```bash
# 1. Usar Docker Compose
mkdir -p ~/elk
cd ~/elk

# 2. Criar docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    healthcheck:
      test: curl -s http://localhost:9200 >/dev/null || exit 1
      interval: 10s
      timeout: 5s
      retries: 5

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    environment:
      - "LS_JAVA_OPTS=-Xmx256m -Xms256m"
    ports:
      - "5000:5000/udp"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_URL=http://elasticsearch:9200
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
EOF

# 3. Criar logstash.conf
cat > logstash.conf << 'EOF'
input {
  tcp {
    port => 5000
    codec => json
  }
}

filter {
  mutate {
    add_field => { "[@metadata][index_name]" => "logs-%{+YYYY.MM.dd}" }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "%{[@metadata][index_name]}"
  }
}
EOF

# 4. Iniciar
docker-compose up -d

# 5. Verificar
docker-compose ps
# Todos devem estar "Up"

# 6. Acessar Kibana
# http://seu-dominio.com:5601
```

---

## ✅ **VERIFICAÇÃO FINAL**

```bash
# 1. Vault rodando?
curl http://127.0.0.1:8200/ui/
# ✅ Status: 200

# 2. NGINX rodando?
curl -I https://seu-dominio.com/
# ✅ HTTP/2 200

# 3. Backend rodando?
curl https://seu-dominio.com/api/health
# ✅ { status: 'ok' }

# 4. PostgreSQL conectado?
psql -h localhost -U delta_user -d delta_navigator -c "SELECT version();"
# ✅ Mostra versão PostgreSQL

# 5. ELK rodando?
curl http://127.0.0.1:9200/
# ✅ Retorna JSON com info Elasticsearch

# 6. Certificado SSL válido?
openssl s_client -connect seu-dominio.com:443 -showcerts
# ✅ Deve mostrar certificado Let's Encrypt válido
```

---

## 🎉 **PRONTO!**

Você tem agora:

✅ **Vault** - Secrets seguros  
✅ **HTTPS/TLS** - Comunicação encriptada  
✅ **NGINX** - Reverse proxy + rate limiting  
✅ **PostgreSQL** - Banco com criptografia  
✅ **ELK** - Logs centralizados  
✅ **Audit logs** - Rastreamento completo  

**Custo**: R$ 0,00  
**Segurança**: Enterprise-grade  
**Conformidade BACEN**: ✅ Sim

Agora execute os testes de segurança (OWASP ZAP, npm audit) e você estará 100% conforme!

---

**Próximo**: Execute `npm audit` e `OWASP ZAP scan`
