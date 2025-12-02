/**
 * Teste para verificar se a interception de fetch está funcionando
 */

export function testFetchInterception() {
  console.log('🧪 [TEST] Iniciando teste de interception de fetch...');
  
  // Verificar se o originalFetch existe
  const originalFetch = (window as any).__originalFetch;
  console.log('🧪 [TEST] window.__originalFetch existe?', !!originalFetch);
  
  // Verificar se window.fetch foi substituído
  console.log('🧪 [TEST] window.fetch:', window.fetch?.toString().substring(0, 50));
  
  // Fazer uma requisição de teste
  console.log('🧪 [TEST] Fazendo requisição de teste para localhost:3001...');
  
  fetch('http://localhost:3001/api/test')
    .then(r => {
      console.log('🧪 [TEST] ✅ Requisição concluída:', r.status);
      return r.json();
    })
    .catch(e => {
      console.log('🧪 [TEST] ❌ Erro na requisição:', e.message);
    });
}
