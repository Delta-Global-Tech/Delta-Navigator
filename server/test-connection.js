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

async function testConnection() {
  try {
    console.log('Iniciando teste de conexão...');
    console.log('Configuração:', {
      server: config.server,
      port: config.port,
      database: config.database,
      user: config.user
    });

    const pool = await sql.connect(config);
    console.log('✅ Conexão estabelecida com sucesso!');

    console.log('Testando query simples...');
    const result = await pool.request().query('SELECT 1 as test, GETDATE() as now');
    console.log('✅ Query executada:', result.recordset);

    console.log('Testando acesso à tabela...');
    const tableTest = await pool.request().query('SELECT TOP 3 proposta_id, cliente_nome FROM dbo.fact_proposals_newcorban');
    console.log('✅ Tabela acessada:', tableTest.recordset);

    await pool.close();
    console.log('✅ Conexão fechada.');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Código:', error.code);
    if (error.originalError) {
      console.error('Erro original:', error.originalError.message);
    }
  }
}

testConnection();
