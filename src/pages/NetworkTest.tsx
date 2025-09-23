import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_URLS, getApiEndpoint } from '@/lib/api-config';

export default function NetworkTest() {
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
  const currentPort = typeof window !== 'undefined' ? window.location.port : 'unknown';
  const currentProtocol = typeof window !== 'undefined' ? window.location.protocol : 'unknown';
  
  const testEndpoints = [
    { name: 'SQL Server - Produção Analytics', url: getApiEndpoint('SQLSERVER', '/api/producao/status-analysis?startDate=2025-01-01&endDate=2025-09-22') },
    { name: 'PostgreSQL - Funil Data', url: getApiEndpoint('POSTGRES', '/api/funil/data') },
    { name: 'PostgreSQL - Propostas', url: getApiEndpoint('POSTGRES', '/api/propostas/data') },
    { name: 'Extrato - Statement', url: getApiEndpoint('EXTRATO', '/api/statement') },
    { name: 'Extrato - Faturas', url: getApiEndpoint('EXTRATO', '/api/faturas') },
  ];

  const testApi = async (url: string) => {
    try {
      const response = await fetch(url);
      return {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      };
    } catch (error) {
      return {
        status: 'ERROR',
        ok: false,
        statusText: error.message
      };
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Teste de Conectividade de Rede</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Informações do Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Hostname:</strong> {currentHostname}
            </div>
            <div>
              <strong>Porta:</strong> {currentPort}
            </div>
            <div>
              <strong>Protocolo:</strong> {currentProtocol}
            </div>
            <div>
              <strong>URL Completa:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>URLs das APIs Configuradas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div><strong>SQL Server:</strong> {API_URLS.SQLSERVER}</div>
            <div><strong>PostgreSQL:</strong> {API_URLS.POSTGRES}</div>
            <div><strong>Extrato:</strong> {API_URLS.EXTRATO}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teste de Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testEndpoints.map((endpoint, index) => (
              <div key={index} className="border p-3 rounded">
                <div className="font-medium">{endpoint.name}</div>
                <div className="text-sm text-gray-600 mb-2">{endpoint.url}</div>
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                  onClick={async () => {
                    const result = await testApi(endpoint.url);
                    alert(`Status: ${result.status} - ${result.statusText}`);
                  }}
                >
                  Testar Conexão
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variáveis de Ambiente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div><strong>VITE_API_SQLSERVER_URL:</strong> {import.meta.env.VITE_API_SQLSERVER_URL || 'Não definida'}</div>
            <div><strong>VITE_API_POSTGRES_URL:</strong> {import.meta.env.VITE_API_POSTGRES_URL || 'Não definida'}</div>
            <div><strong>VITE_EXTRATO_API_URL:</strong> {import.meta.env.VITE_EXTRATO_API_URL || 'Não definida'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}