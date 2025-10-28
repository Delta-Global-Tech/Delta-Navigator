#!/bin/bash
# Script para setup dos certificados do PIX Gateway

echo "╔════════════════════════════════════════════════╗"
echo "║ Setup PIX Gateway - Certificados             ║"
echo "╚════════════════════════════════════════════════╝"

# Criar pasta de certificados
mkdir -p server/certs
echo "✓ Pasta 'server/certs' criada"

echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Copie seu private.key para: server/certs/private.key"
echo "2. Copie seu certificate.crt para: server/certs/certificate.crt"
echo ""
echo "   Exemplo (Windows PowerShell):"
echo "   cp C:\Downloads\private.key server\certs\private.key"
echo "   cp C:\Downloads\certificate.crt server\certs\certificate.crt"
echo ""
echo "3. Instale dependências:"
echo "   npm install"
echo ""
echo "4. Teste a conexão:"
echo "   npm run dev:pix-gateway"
echo ""
echo "✅ Setup concluído!"
