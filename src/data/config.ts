// Delta Global Center - Data Configuration
// Planilhas → Tabelas mapping and field synonyms

export const DataConfig = {
  tables: {
    // Planilhas → Tabelas
    aberturas: "aberturas_contas",           // ABERTURA DE CONTAS GERAL.xlsx
    operacoes: "operacoes",                  // OPERAÇÕES.xlsx

    total_novo:   "producao_total_novo",     // PRODUÇÃO TOTAL - NOVO.xlsx
    total_compra: "producao_total_compra",   // PRODUÇÃO TOTAL - COMPRA.xlsx

    fila_novo:    "producao_fila_novo",      // PRODUÇÃO NA FILA DE PAGAMENTO - NOVO.xlsx
    fila_compra:  "producao_fila_compra",    // PRODUÇÃO NA FILA DE PAGAMENTO - COMPRA.xlsx

    paga_novo:    "producao_paga_novo",      // PRODUÇÃO PAGA - NOVO.xlsx
    paga_compra:  "producao_paga_compra",    // PRODUÇÃO PAGA - COMPRA.xlsx
  },

  // Sinônimos por campo (mapeamento tolerante a variações de cabeçalho das planilhas)
  fields: {
    id:               ["id", "Id", "ID"],
    matricula:        ["Matricula", "Matrícula", "matricula"],
    
    // Datas
    dataFormalizacao: ["Data Formalização", "Data Formalizacao", "Formalização", "Formalizacao", "data_formalizacao"],
    dataEmissao:      ["Data de Emissão do Documento", "Data Emissão", "Emissão", "data_emissao"],
    dataAtualOn:      ["Data Atualização (on)", "Atualização on", "Atualizacao on", "data_atualizacao_on"],
    dataAtualOff:     ["Data Atualização (off)", "Atualização off", "Atualizacao off", "data_atualizacao_off"],
    dataDDB:          ["Data Desbloqueio (DDB)", "DDB", "Data DDB", "Desbloqueio", "data_ddb"],

    // Valores
    valorParcela:     ["Valor Parcela", "Valor", "Vl Parcela", "Vlr Parcela", "valor_parcela"],
    comissao:         ["Comissão Recebida", "Comissao Recebida", "Comissão", "Comissao", "comissao"],
    saldoDevedor:     ["Saldo Devedor", "Saldo", "saldo_devedor"],

    // Dimensões
    tipoDocumento:    ["Tipo do Documento", "Tipo Documento", "Documento", "tipo_documento"],
    tipoLiberacao:    ["Tipo de Liberação", "Tipo de Liberacao", "Liberação", "Liberacao", "tipo_liberacao"],
    prazo:            ["Prazo", "Prazo (meses)", "Prazo_meses", "prazo"],

    // Opcionais comuns
    canal:            ["Canal", "Origem", "Canal de Entrada", "canal"],
    segmento:         ["Segmento", "Tipo Cliente", "Perfil", "segmento"],
    status:           ["Status", "Situação", "Situacao", "status"],
  }
} as const;

// Feature Flags
export const Flags = {
  leadTimeDDB: false,      // liga quando dataDDB estiver consistente
  coortes: false,
  previsao: false,
  rbac: false,
  commandPalette: true,
  realTimeSync: false,
  advancedFilters: true,
  exportPremium: true,
} as const;

// Esquemas mínimos esperados por tabela
export const TableSchemas = {
  aberturas_contas: {
    required: ['data_formalizacao'],
    optional: ['id', 'matricula', 'canal', 'segmento', 'tipo_documento']
  },
  operacoes: {
    required: ['tipo_documento', 'tipo_liberacao', 'prazo', 'valor_parcela'],
    optional: ['id', 'matricula', 'data_emissao', 'saldo_devedor', 'status']
  },
  producao_total_novo: {
    required: ['data_formalizacao'],
    optional: ['matricula', 'tipo_documento', 'tipo_liberacao', 'prazo', 'valor_parcela']
  },
  producao_total_compra: {
    required: ['data_formalizacao'],
    optional: ['matricula', 'tipo_documento', 'tipo_liberacao', 'prazo', 'valor_parcela']
  },
  producao_fila_novo: {
    required: ['data_formalizacao'],
    optional: ['matricula', 'data_atualizacao_on', 'data_atualizacao_off', 'tipo_documento', 'tipo_liberacao', 'prazo', 'valor_parcela', 'status']
  },
  producao_fila_compra: {
    required: ['data_formalizacao'],
    optional: ['matricula', 'data_atualizacao_on', 'data_atualizacao_off', 'tipo_documento', 'tipo_liberacao', 'prazo', 'valor_parcela', 'status']
  },
  producao_paga_novo: {
    required: ['data_formalizacao', 'data_ddb'],
    optional: ['matricula', 'valor_parcela', 'comissao', 'tipo_documento', 'tipo_liberacao', 'prazo']
  },
  producao_paga_compra: {
    required: ['data_formalizacao', 'data_ddb'],
    optional: ['matricula', 'valor_parcela', 'comissao', 'tipo_documento', 'tipo_liberacao', 'prazo']
  }
} as const;