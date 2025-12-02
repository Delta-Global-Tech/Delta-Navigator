/**
 * Script de teste simples para verificar interception
 * Cole isto no console e veja se as requisições são capturadas
 */

export function testInterception() {
  console.log('=== TESTE DE INTERCEPTION ===');
  
  // Teste 1: Verificar fetch
  console.log('1️⃣ Testando Fetch...');
  fetch('http://localhost:3001/api/positions?limit=1')
    .then(r => r.json())
    .then(d => {
      console.log('✅ Fetch 1 respondeu:', d);
    })
    .catch(e => console.log('❌ Fetch 1 erro:', e.message));

  // Aguardar 1 segundo
  setTimeout(() => {
    console.log('2️⃣ Testando segundo Fetch...');
    fetch('http://localhost:3002/api/some-endpoint')
      .then(r => r.json())
      .then(d => {
        console.log('✅ Fetch 2 respondeu:', d);
      })
      .catch(e => console.log('❌ Fetch 2 erro:', e.message));
  }, 1000);

  // Verificar após 3 segundos
  setTimeout(() => {
    console.log('3️⃣ Verificando métricas capturadas...');
    console.log('Procure por logs [RequestMonitoring] acima');
  }, 3000);
}

// Exportar para poder chamar window.testInterception() no console
(window as any).testInterception = testInterception;
