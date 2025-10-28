// 🧪 Teste Rápido - Cadastral Debug
// Abra o console do navegador (F12) e execute isto:

console.log('🧪 Iniciando teste do Cadastral...');

// Teste 1: Verificar se a API está respondendo
const testarAPI = async () => {
  console.log('\n📡 Teste 1: API Backend');
  try {
    const response = await fetch('http://localhost:3003/api/cadastral/estatisticas');
    console.log('Status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Sucesso!', data);
    } else {
      const error = await response.text();
      console.log('❌ Erro:', response.status, error);
    }
  } catch (err) {
    console.log('❌ Erro de conexão:', err);
  }
};

// Teste 2: Verificar URL da API
const testarURL = () => {
  console.log('\n🔗 Teste 2: URL da API');
  console.log('Navegador URL:', window.location.href);
  console.log('API deve estar em: http://localhost:3003/api/cadastral');
};

// Teste 3: Verificar se o componente carrega
const testarComponente = () => {
  console.log('\n🎨 Teste 3: Componente React');
  const elemento = document.querySelector('[class*="cadastral"]');
  if (elemento) {
    console.log('✅ Elemento encontrado:', elemento);
  } else {
    console.log('❌ Elemento não encontrado');
  }
};

// Executar testes
console.log('\n▶️  Executando testes...\n');
await testarAPI();
testarURL();
testarComponente();
console.log('\n✅ Testes completos!\n');

// Dicas
console.log(`
🔧 COMO CORRIGIR:

1. Se ver HTTP 404:
   └─ Reinicie: npm run server:extrato

2. Se ver HTTP 0 (sem conexão):
   └─ Backend não está rodando
   └─ Execute: npm run server:extrato

3. Se ver erro no JSON:
   └─ Banco de dados sem dados
   └─ Verifique: SELECT COUNT(*) FROM dim_account;

4. Se ver "tudo azul":
   └─ Abra F12 (console) e veja os erros
   └─ Compartilhe os erros
`);
