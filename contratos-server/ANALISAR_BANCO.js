#!/usr/bin/env node

/**
 * Script para verificar estrutura dos dados na tabela em.a_desembolsar
 * Usa as mesmas credenciais do servidor
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'delta_nav',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function analisarDados() {
  try {
    console.log('\n🔍 ANALISANDO ESTRUTURA DOS DADOS\n');
    console.log('='.repeat(150));

    // 1. Ver primeiros registros
    console.log('\n1️⃣  PRIMEIROS 10 REGISTROS (COLUNA PRODUTO):');
    console.log('-'.repeat(150));
    
    const registros = await pool.query(`
      SELECT 
        produto, 
        cd_produt,
        vlr_solic, 
        vlr_liberado,
        carteira
      FROM em.a_desembolsar
      LIMIT 10
    `);
    
    registros.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. Produto: "${row.produto}"`);
      console.log(`   cd_produt: ${row.cd_produt}`);
      console.log(`   Carteira: ${row.carteira}`);
      console.log(`   Solic: ${row.vlr_solic} | Liberado: ${row.vlr_liberado}`);
      console.log();
    });

    // 2. Ver produtos únicos
    console.log('\n2️⃣  PRODUTOS ÚNICOS (COUNT):');
    console.log('-'.repeat(150));
    
    const produtosUnicos = await pool.query(`
      SELECT 
        produto,
        COUNT(*) as quantidade,
        SUM(CAST(vlr_solic AS NUMERIC)) as total_solicitado,
        SUM(CAST(vlr_liberado AS NUMERIC)) as total_liberado
      FROM em.a_desembolsar
      GROUP BY produto
      ORDER BY total_solicitado DESC
      LIMIT 20
    `);
    
    console.log(`\nTotal de produtos DIFERENTES: ${produtosUnicos.rows.length}`);
    console.log();
    
    produtosUnicos.rows.forEach((row, idx) => {
      const pct = row.total_solicitado > 0 
        ? ((row.total_liberado / row.total_solicitado) * 100).toFixed(1)
        : '0.0';
      console.log(`${idx + 1}. "${row.produto}"`);
      console.log(`   Qtd: ${row.quantidade} | Total Solic: ${row.total_solicitado} | Total Lib: ${row.total_liberado} | % Lib: ${pct}%`);
    });

    // 3. Ver estrutura de names com padrões
    console.log('\n\n3️⃣  PADRÕES ENCONTRADOS:');
    console.log('-'.repeat(150));
    
    const patterns = await pool.query(`
      SELECT DISTINCT produto
      FROM em.a_desembolsar
      ORDER BY produto
    `);
    
    console.log(`\nTodos os ${patterns.rows.length} produtos únicos:\n`);
    patterns.rows.forEach((row, idx) => {
      console.log(`${String(idx + 1).padStart(3)}. ${row.produto}`);
    });

    // 4. Análise de cd_produt
    console.log('\n\n4️⃣  ANÁLISE DE cd_produt:');
    console.log('-'.repeat(150));
    
    const cdProdut = await pool.query(`
      SELECT 
        cd_produt,
        COUNT(*) as quantidade,
        COUNT(DISTINCT produto) as produtos_diferentes
      FROM em.a_desembolsar
      WHERE cd_produt IS NOT NULL
      GROUP BY cd_produt
      ORDER BY quantidade DESC
      LIMIT 20
    `);
    
    console.log(`\nCódigos de produtos (cd_produt):\n`);
    cdProdut.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. cd_produt: "${row.cd_produt}" | Qtd: ${row.quantidade} | Nomes diferentes: ${row.produtos_diferentes}`);
    });

    console.log('\n\n5️⃣  ESTATÍSTICAS GERAIS:');
    console.log('-'.repeat(150));
    
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_registros,
        COUNT(DISTINCT produto) as produtos_unicos,
        COUNT(DISTINCT cd_produt) as cd_produtos_unicos,
        COUNT(DISTINCT carteira) as carteiras_unicas,
        SUM(CAST(vlr_solic AS NUMERIC)) as total_solic,
        SUM(CAST(vlr_liberado AS NUMERIC)) as total_liberado
      FROM em.a_desembolsar
    `);
    
    const s = stats.rows[0];
    console.log(`\nTotal de registros: ${s.total_registros}`);
    console.log(`Produtos únicos (por nome): ${s.produtos_unicos}`);
    console.log(`cd_produtos únicos: ${s.cd_produtos_unicos}`);
    console.log(`Carteiras únicas: ${s.carteiras_unicas}`);
    console.log(`Total Solicitado: R$ ${parseFloat(s.total_solic).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log(`Total Liberado: R$ ${parseFloat(s.total_liberado).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);

    console.log('\n' + '='.repeat(150));
    console.log('✅ ANÁLISE CONCLUÍDA!\n');

  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('\nVerifique:');
    console.error('1. Se o banco está rodando');
    console.error('2. Se a tabela em.a_desembolsar existe');
    console.error('3. Se as credenciais estão corretas (.env)');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

analisarDados();
