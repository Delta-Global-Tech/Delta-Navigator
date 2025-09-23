#!/bin/bash

# Script para testar conectividade das APIs
echo "=== Testando conectividade das APIs ==="
echo ""

# Obter IP da máquina atual
CURRENT_IP=$(hostname -I | awk '{print $1}')
echo "IP atual da máquina: $CURRENT_IP"
echo ""

# Testar cada porta
ports=("3001" "3002" "3003")
api_names=("SQL Server" "PostgreSQL" "Extrato")

for i in "${!ports[@]}"; do
    port="${ports[$i]}"
    name="${api_names[$i]}"
    
    echo "Testando $name (porta $port):"
    
    # Testar localhost
    echo -n "  localhost:$port -> "
    if curl -s --max-time 5 "http://localhost:$port/health" > /dev/null 2>&1; then
        echo "✅ OK"
    else
        echo "❌ FALHOU"
    fi
    
    # Testar IP da rede
    echo -n "  $CURRENT_IP:$port -> "
    if curl -s --max-time 5 "http://$CURRENT_IP:$port/health" > /dev/null 2>&1; then
        echo "✅ OK"
    else
        echo "❌ FALHOU"
    fi
    
    echo ""
done

echo "=== Fim do teste ==="