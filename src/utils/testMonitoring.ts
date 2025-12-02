/**
 * Script de teste para verificar se o RequestMonitoring está funcionando
 * Execute no console do navegador (F12 > Console):
 * 
 * import('./src/services/requestMonitoring.js').then(({ getMetrics, getTotalRequests }) => {
 *   console.log('Total:', getTotalRequests());
 *   console.log('Métricas:', getMetrics());
 * });
 */

// Teste manual no console:
// 1. Abra o DevTools (F12)
// 2. Console
// 3. Cole isto:

/*
window.testMonitoring = async () => {
  console.log('=== TESTE DE MONITORAMENTO ===');
  
  // Verificar se fetch foi interceptado
  console.log('window.fetch:', typeof window.fetch);
  
  // Fazer uma requisição de teste
  console.log('Fazendo fetch test...');
  try {
    const response = await fetch('/api/test');
    console.log('✅ Fetch funcionou, status:', response.status);
  } catch (e) {
    console.log('❌ Erro no fetch:', e.message);
  }
  
  // Verificar sessionStorage
  console.log('sessionStorage.currentPage:', sessionStorage.getItem('currentPage'));
};

window.testMonitoring();
*/
