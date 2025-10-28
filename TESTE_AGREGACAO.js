#!/usr/bin/env node

/**
 * Teste da Agregação por cd_produt
 * Execute: node TESTE_AGREGACAO.js
 */

const http = require('http');

console.log('🧪 TESTE DE AGREGAÇÃO POR cd_produt');
console.log('====================================\n');

// Função para fazer requisição HTTP
function testarAPI() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3004,
      path: '/api/em/a-desembolsar',
      method: 'GET',
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (err) {
          reject(new Error(`Erro ao parsear JSON: ${err.message}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Erro na requisição: ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout na requisição (servidor não respondeu em 10s)'));
    });

    req.end();
  });
}

// Executar teste
testarAPI()
  .then((response) => {
    console.log('✅ Conexão bem-sucedida!\n');

    // Verificar estrutura
    console.log('📋 ESTRUTURA DA RESPOSTA:');
    console.log('========================');
    console.log(`✓ Sucesso: ${response.sucesso}`);
    console.log(`✓ Total de registros: ${response.dados?.length || 0}`);
    console.log(`✓ Produtos agregados: ${response.produtos_agregados?.length || 0}`);
    console.log(`✓ Estatísticas: ${response.estatisticas ? '✓' : '✗'}\n`);

    // Verificar estatísticas
    if (response.estatisticas) {
      console.log('📊 ESTATÍSTICAS:');
      console.log('================');
      console.log(`Total Solicitado: R$ ${(response.estatisticas.total_solicitado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`Total Liberado: R$ ${(response.estatisticas.total_liberado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`% Liberação: ${(response.estatisticas.percentual_liberacao || 0).toFixed(2)}%`);
      console.log(`Códigos de Produtos Únicos: ${response.estatisticas.cd_produtos_unicos || 'N/A'}\n`);
    }

    // Mostrar primeiros produtos agregados
    if (response.produtos_agregados && response.produtos_agregados.length > 0) {
      console.log('📈 PRIMEIROS 5 PRODUTOS AGREGADOS:');
      console.log('===================================');
      response.produtos_agregados.slice(0, 5).forEach((p, i) => {
        console.log(`\n${i + 1}. ${p.cd_produt} - ${p.produto || 'N/A'}`);
        console.log(`   Quantidade: ${p.quantidade}`);
        console.log(`   Solicitado: R$ ${(p.vlr_solic_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        console.log(`   Liberado: R$ ${(p.vlr_liberado_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        console.log(`   Status: ${p.empenhos_liberados} liberados, ${p.empenhos_pendentes} pendentes, ${p.empenhos_parciais} parciais`);
      });
      console.log('\n');
    }

    // Validações
    console.log('🔍 VALIDAÇÕES:');
    console.log('===============');

    let validacoes = 0;
    let erros = 0;

    // V1: Tem dados?
    if (response.dados && response.dados.length > 0) {
      console.log('✅ Dados detalhados presentes');
      validacoes++;
    } else {
      console.log('❌ Nenhum dado detalhado retornado');
      erros++;
    }

    // V2: Tem agregação?
    if (response.produtos_agregados && response.produtos_agregados.length > 0) {
      console.log('✅ Agregação por cd_produt presente');
      validacoes++;
    } else {
      console.log('❌ Nenhuma agregação retornada');
      erros++;
    }

    // V3: Tem cd_produt?
    if (response.produtos_agregados?.[0]?.cd_produt) {
      console.log('✅ Campo cd_produt presente');
      validacoes++;
    } else {
      console.log('❌ Campo cd_produt faltando');
      erros++;
    }

    // V4: Tem vlr_solic_total?
    if (response.produtos_agregados?.[0]?.vlr_solic_total !== undefined) {
      console.log('✅ Campo vlr_solic_total presente');
      validacoes++;
    } else {
      console.log('❌ Campo vlr_solic_total faltando');
      erros++;
    }

    // V5: Tem quantidade?
    if (response.produtos_agregados?.[0]?.quantidade !== undefined) {
      console.log('✅ Campo quantidade presente');
      validacoes++;
    } else {
      console.log('❌ Campo quantidade faltando');
      erros++;
    }

    console.log(`\n📊 RESULTADO: ${validacoes} ✅ | ${erros} ❌`);

    if (erros === 0) {
      console.log('\n🎉 TUDO FUNCIONANDO CORRETAMENTE!');
    } else {
      console.log('\n⚠️  Há problemas na agregação. Verifique os logs do backend.');
    }
  })
  .catch((err) => {
    console.error('❌ ERRO:', err.message);
    console.log('\n💡 Dicas:');
    console.log('  1. Verifique se o servidor está rodando (porta 3004)');
    console.log('  2. Verifique o console do servidor para erros');
    console.log('  3. Verifique se a tabela em.a_desembolsar existe');
    console.log('  4. Verifique se a coluna cd_produt existe no banco');
    process.exit(1);
  });
