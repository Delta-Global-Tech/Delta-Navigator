const sql = require('mssql');

const config = {
  server: 'localhost',
  user: 'sa',
  password: 'YOUR_PASSWORD_HERE', // ⚠️ CONFIGURE YOUR PASSWORD
  database: 'deltaexpress_prd',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function testFullQuery() {
  try {
    console.log('Conectando ao SQL Server...');
    const pool = await sql.connect(config);
    console.log('Conexão estabelecida!');

    console.log('Executando contagem total...');
    const countResult = await pool.request().query(`
      SELECT COUNT(*) as total 
      FROM dbo.fact_proposals_newcorban 
      WHERE status_nome = 'PAGO'
    `);
    console.log('Total de registros PAGO:', countResult.recordset[0].total);

    console.log('Executando query completa...');
    const fullResult = await pool.request().query(`
      SELECT
        proposta_id,
        banco_id,
        banco_nome,
        convenio_nome,
        valor_financiado,
        status_nome,
        cliente_nome,
        date_cadastro
      FROM dbo.fact_proposals_newcorban
      WHERE status_nome = 'PAGO'
      ORDER BY date_cadastro DESC
    `);
    
    console.log('Registros retornados pela query completa:', fullResult.recordset.length);
    console.log('Primeiros 3 registros:');
    fullResult.recordset.slice(0, 3).forEach((record, index) => {
      console.log(`${index + 1}. ID: ${record.proposta_id}, Cliente: ${record.cliente_nome}`);
    });

    await pool.close();
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

testFullQuery();
