#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const pages = [
  { file: 'src/pages/ADesembolsar.tsx', gridLine: 'className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"' },
  { file: 'src/pages/ExtratoRanking.tsx', gridLine: 'className="grid grid-cols-1 md:grid-cols-3 gap-4"' },
  { file: 'src/pages/Licitacoes.tsx', gridLine: 'className="grid grid-cols-1 md:grid-cols-2 gap-4"' },
  { file: 'src/pages/Propostas.tsx', gridLine: 'className="grid grid-cols-1 md:grid-cols-2 gap-4"' },
];

pages.forEach(({ file, gridLine }) => {
  if (!fs.existsSync(file)) {
    console.log(`❌ ${file} não encontrado`);
    return;
  }
  
  let content = fs.readFileSync(file, 'utf8');
  const hasStaggeredImport = content.includes('StaggeredContainer');
  
  // Adicionar import se não tiver
  if (!hasStaggeredImport) {
    const importLine = 'import { StaggeredContainer } from "@/components/motion/StaggeredContainer";';
    const firstImportMatch = content.match(/^import /m);
    if (firstImportMatch) {
      const pos = content.indexOf('\n', content.indexOf('import'));
      content = content.slice(0, pos + 1) + importLine + '\n' + content.slice(pos + 1);
      fs.writeFileSync(file, content);
      console.log(`✅ Import adicionado a ${file}`);
    }
  } else {
    console.log(`✅ ${file} já tem StaggeredContainer`);
  }
});

console.log('\n✅ Processamento concluído!');
