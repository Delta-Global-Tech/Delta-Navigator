#!/usr/bin/env node

/**
 * Script para analisar produtos únicos na tabela em.a_desembolsar
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'postgres',
  database: 'delta_nav',
  port: 5432
});

async function analisarProdutos() {
  try {
    console.log('🔍 Analisando produtos únicos...\n');

    const query = `
      SELECT 
        produto,
        COUNT(*) as quantidade,
        SUM(CAST(vlr_solic AS DECIMAL)) as vlr_solic_total,
        SUM(CAST(vlr_liberado AS DECIMAL)) as vlr_liberado_total
      FROM em.a_desembolsar
      GROUP BY produto
      ORDER BY vlr_solic_total DESC
    `;

    const result = await pool.query(query);
    
    console.log(`📊 Encontrados ${result.rows.length} produtos únicos:\n`);
    console.log('='.repeat(120));
    console.log('PRODUTO | QTD | SOLIC TOTAL | LIBERADO TOTAL | % LIBERADO');
    console.log('='.repeat(120));

    result.rows.forEach((row, index) => {
      const produto = (row.produto || 'SEM NOME').substring(0, 50);
      const qtd = row.quantidade || 0;
      const solic = parseFloat(row.vlr_solic_total) || 0;
      const lib = parseFloat(row.vlr_liberado_total) || 0;
      const pct = solic > 0 ? ((lib / solic) * 100).toFixed(1) : '0.0';

      console.log(`${index + 1}. ${produto.padEnd(50)} | ${String(qtd).padEnd(3)} | ${solic.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}).padEnd(11)} | ${lib.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}).padEnd(14)} | ${pct}%`);
    });

    console.log('='.repeat(120));
    console.log('\n📋 PRODUTOS ÚNICOS (PARA REFERÊNCIA):');
    console.log('=====================================\n');

    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. "${row.produto}"`);
    });

    console.log('\n✅ Análise completa!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

analisarProdutos();
