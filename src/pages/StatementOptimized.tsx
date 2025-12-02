import React, { memo } from 'react';
import Statement from './Statement';

// Wrapper memoizado para Statement
// Isso previne re-renders quando o sidebar muda
const StatementWrapper = memo(() => {
  return <Statement />;
}, (prevProps, nextProps) => {
  // Retorna true se props são iguais (não re-renderiza)
  // Retorna false se props mudaram (re-renderiza)
  return JSON.stringify(prevProps) === JSON.stringify(nextProps);
});

StatementWrapper.displayName = 'StatementWrapper';

export default StatementWrapper;
