// Teste da Função de Padronização de Produtos
// Cole este código no console do navegador para testar

const extrairCategoriaProduto = (produto) => {
  if (!produto?.trim()) return 'Sem Produto';
  
  // Lista COMPLETA de cidades e estados brasileiros
  const cidadesEstados = [
    // Estados (siglas) - IMPORTANTE incluir para remover "SP", "RJ", etc
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
    
    // Capitais de estados
    'Aracaju', 'Belém', 'Belo Horizonte', 'Boa Vista', 'Brasília',
    'Campo Grande', 'Cuiabá', 'Curitiba', 'Fortaleza', 'Goiânia',
    'João Pessoa', 'Maceió', 'Macapá', 'Manaus', 'Natal',
    'Palmas', 'Porto Alegre', 'Recife', 'Rio Branco', 'Rio de Janeiro',
    'Salvador', 'São Luís', 'São Paulo', 'Teresina',
    
    // Grandes cidades
    'Campinas', 'Contagem', 'Divinópolis', 'Duque de Caxias',
    'Diadema', 'Guarulhos', 'Joinville', 'Jundiaí', 'Juiz de Fora',
    'Londrina', 'Mossoró', 'Osasco', 'Piracicaba', 'Ribeirão Preto',
    'Santo André', 'Santos', 'São Bernardo do Campo', 'São Gonçalo',
    'Sorocaba', 'Uberlândia', 'Vitória'
  ];
  
  let categoria = produto.trim();
  
  // PRIORIDADE 1: Remove percentuais (CRÍTICO!)
  categoria = categoria
    .replace(/\s*\d+,\d+%.*$/g, '')           // Remove "1,29% a 2,04%" etc no final
    .replace(/\s*\(\s*\d+,\d+%\s*\)/g, '')    // Remove "(1,50%)" patterns
    .replace(/\s*\[\s*\d+,\d+%\s*\]/g, '')    // Remove "[1,50%]" patterns
    .replace(/\s+%/g, '');                    // Remove "%" solto
  
  // PRIORIDADE 2: Remove modificadores de seguro
  categoria = categoria.replace(/\s+(S\/|Com|SEM|com)\s+(Seguro|seguro|SEGURO)/gi, '');
  
  // PRIORIDADE 3: Remove cidades e estados
  cidadesEstados.forEach(local => {
    // Usa word boundary para evitar remover palavras parciais
    const regex = new RegExp(`\\b${local}\\b`, 'gi');
    categoria = categoria.replace(regex, '');
  });
  
  // PRIORIDADE 4: Limpeza final
  categoria = categoria
    .replace(/\s*[-–—]\s*/g, ' ')             // Hyphens → espaço
    .replace(/[\[\(\{]\s*[\]\)\}]/g, '')      // Parênteses vazios
    .replace(/,\s*$/g, '')                    // Vírgulas no final
    .trim()
    .replace(/\s+/g, ' ');                    // Espaços múltiplos → um espaço
  
  return categoria || 'Sem Categoria';
};

// CASOS DE TESTE
const testCases = [
  // [Input, Expected Output]
  ['COMPRA DE DÍVIDA - Joinville (1,29% a 2,04%)', 'COMPRA DE DÍVIDA'],
  ['COMPRA DE DÍVIDA - Belo Horizonte (1,50%)', 'COMPRA DE DÍVIDA'],
  ['COMPRA DE DÍVIDA - São Paulo SP (1,29%)', 'COMPRA DE DÍVIDA'],
  ['FGTS - Rio de Janeiro (0,99% a 1,50%)', 'FGTS'],
  ['FGTS - S/ Seguro', 'FGTS'],
  ['FGTS - Com Seguro', 'FGTS'],
  ['FGTS - SEM Seguro', 'FGTS'],
  ['CRÉDITO PESSOAL - Curitiba PR (2,00% a 3,00%)', 'CRÉDITO PESSOAL'],
  ['CRÉDITO RURAL - Brasília DF (0,75%)', 'CRÉDITO RURAL'],
  ['CRÉDITO IMOBILIÁRIO', 'CRÉDITO IMOBILIÁRIO'],
  ['Empréstimo Consignado - Rio de Janeiro RJ', 'Empréstimo Consignado'],
  ['Empréstimo Consignado - Rio de Janeiro - RJ (1,50%)', 'Empréstimo Consignado'],
  ['REFINANCIAMENTO - Guarulhos - SP (1,00% a 1,50%)', 'REFINANCIAMENTO'],
  ['LINHA DE CRÉDITO - Camaçari - BA', 'LINHA DE CRÉDITO'],
  ['', 'Sem Categoria'],
  [null, 'Sem Categoria'],
  ['   ', 'Sem Categoria'],
  ['COMPRA DE DÍVIDA - Joinville', 'COMPRA DE DÍVIDA'],
  ['COMPRA DE DÍVIDA - SP', 'COMPRA DE DÍVIDA'],
];

// EXECUTAR TESTES
console.log('🧪 TESTES DE NORMALIZAÇÃO DE PRODUTOS');
console.log('=====================================\n');

let passou = 0;
let falhou = 0;

testCases.forEach(([input, expected], index) => {
  const resultado = extrairCategoriaProduto(input);
  const passou_test = resultado === expected;
  
  if (passou_test) {
    console.log(`✅ Teste ${index + 1} PASSOU`);
    passou++;
  } else {
    console.log(`❌ Teste ${index + 1} FALHOU`);
    console.log(`   Input:    "${input}"`);
    console.log(`   Esperado: "${expected}"`);
    console.log(`   Obtido:   "${resultado}"`);
    falhou++;
  }
});

console.log(`\n=====================================`);
console.log(`📊 RESULTADO: ${passou} ✅ | ${falhou} ❌`);
console.log(`Taxa de Sucesso: ${((passou / testCases.length) * 100).toFixed(1)}%`);

// ADICIONAL: Mostrar exemplos de agregação
console.log('\n\n📈 EXEMPLOS DE AGREGAÇÃO:');
console.log('=====================================');

const exemplos = [
  'COMPRA DE DÍVIDA - Joinville (1,29% a 2,04%)',
  'COMPRA DE DÍVIDA - Belo Horizonte (1,50%)',
  'COMPRA DE DÍVIDA - São Paulo SP (1,29%)',
  'FGTS - Rio de Janeiro (0,99%)',
  'FGTS - Com Seguro',
  'FGTS - S/ Seguro',
  'CRÉDITO PESSOAL - Curitiba PR',
];

const agregados = {};
exemplos.forEach(ex => {
  const cat = extrairCategoriaProduto(ex);
  agregados[cat] = (agregados[cat] || 0) + 1;
});

console.log('\nProdutos originais agrupados por categoria:');
Object.entries(agregados).forEach(([cat, count]) => {
  console.log(`  "${cat}": ${count} variante(s)`);
});
