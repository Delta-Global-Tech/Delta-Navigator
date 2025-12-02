# ❓ FAQ - Perguntas Frequentes sobre Conformidade BACEN

**Versão**: 1.0  
**Atualizado**: 25 de Novembro de 2025

---

## 🏦 PERGUNTAS SOBRE BACEN

### **P: O que é BACEN e por que preciso estar em conformidade?**

R: BACEN (Banco Central do Brasil) é a autoridade reguladora de instituições financeiras. Desde 2021, todas as instituições (inclusive fintechs) que processam dados financeiros/creditícios devem estar em conformidade com suas resoluções.

**Consequências de não estar conforme**:
- Multas de até R$ 2 milhões
- Bloqueio do sistema
- Perda de licença
- Processos judiciais

---

### **P: Qual é a principal resolução BACEN que me afeta?**

R: **Resolução BACEN 4.893/2021** - Segurança da Informação. Outras importantes:

- **4.658/2018** - Infraestrutura de TI
- **Instrução Normativa 162/2021** - Controles internos
- **Circular 4.068/2021** - Governança de dados

Todas estão documentadas em: `CONFORMIDADE_BACEN_GOVERNANCA.md`

---

### **P: BACEN já fiscalizou meu sistema?**

R: Não há como saber até notificarem. Mas estão fiscalizando ativas desde 2023. **Não aguarde notificação, implemente agora.**

---

### **P: Posso fazer isso em fases?**

R: **SIM**. Recomendamos:
1. **Fase 1 (4 semanas)**: Segurança crítica
2. **Fase 2 (4 semanas)**: Criptografia
3. **Fase 3 (4 semanas)**: Auditoria
4. **Fase 4 (4 semanas)**: Governança

---

### **P: Se BACEN notificar, quanto tempo tenho?**

R: Normalmente 30-90 dias para plano de ação. **Melhor prevenir que remediar.**

---

## 💰 PERGUNTAS SOBRE CUSTO

### **P: Por que custa R$ 146.200?**

R: Distribuição:
- **R$ 98.000** - Desenvolvimento (490 horas de eng.)
- **R$ 15.000** - Auditoria segurança
- **R$ 8.000** - Teste penetração
- **R$ 12.000** - Consultoria compliance
- **R$ 5.000** - Treinamento
- **R$ 8.200** - Infraestrutura e ferramentas

---

### **P: Esse valor é por quanto tempo?**

R: **Uma vez** para implementação completa + 4 meses de manutenção. Após isso, apenas manutenção regular.

---

### **P: E se não fizer, quanto pode custar?**

R: **R$ 2 a 5 milhões** em multas BACEN + custos legais + perda de cliente.

**Cálculo**: Fazer agora custa 0.0003% vs. não fazer custa 20%+ do faturamento.

---

### **P: Posso usar desenvolvedores internos e economizar?**

R: **Sim**. A documentação e código pronto permite isso. Você paga:
- Salários internos (já alocados)
- **+ R$ 30.000** para auditoria/consultoria externa

---

### **P: Preciso contratar alguém novo?**

R: **DPO (Data Protection Officer)** é **obrigatório por LGPD**. Pode ser interno ou contratado:
- **Interno**: +1 profissional alocado 100%
- **Externo**: R$ 3-5K/mês (empresa especializada)

---

## ⏱️ PERGUNTAS SOBRE TIMELINE

### **P: Posso fazer em menos de 4 meses?**

R: Com toda equipe 100% dedicada, talvez 8-10 semanas. Mas recomendamos 4 meses para qualidade.

---

### **P: Posso estender para 6-12 meses?**

R: Sim, mas **prioritize Fase 1** (segurança) nos primeiros 4 semanas. Resto pode ser mais lento se recursos limitados.

---

### **P: Que mês começar para não impactar produção?**

R: Recomendamos:
- **Desenvolvimento**: Dezembro a Março (4 meses)
- **Deploy produção**: Conforme pronto (staged)
- **Certificação**: Abril

---

### **P: E se faltar orçamento em algum mês?**

R: Priorize assim:
1. **Essencial** (Fase 1): Credenciais, CORS, TLS
2. **Crítico** (Fase 2): Criptografia de dados
3. **Importante** (Fase 3): Auditoria
4. **Desejado** (Fase 4): Governança completa

---

## 🔐 PERGUNTAS SOBRE SEGURANÇA

### **P: Qual é meu maior risco de segurança?**

R: **Credenciais em código** (password em server.js). Mesmo arquivo. Qualquer um com acesso Git consegue BD.

**Risco**: Perda total de dados + multa BACEN + perda de cliente

---

### **P: TLS (HTTPS) é realmente necessário?**

R: **SIM**. BACEN obriga. Sem TLS, dados em trânsito são plaintext. Interceptável.

---

### **P: Onde armazeno as chaves de criptografia?**

R: **Nunca em código**. Use:
1. AWS Secrets Manager (melhor)
2. Azure Key Vault
3. HashiCorp Vault (auto-hospedado)
4. Último recurso: .env (não em git)

---

### **P: Preciso criptografar TUDO?**

R: Não. Criptografe **dados sensíveis**:
- ✅ CPF/CNPJ
- ✅ Dados bancários
- ✅ Senhas
- ✅ Tokens
- ✅ Email (opcional)

Não precisa:
- ❌ Nomes públicos
- ❌ Endereços (sem coordenadas)
- ❌ IDs genéricos

---

### **P: Quanto overhead a criptografia adiciona?**

R: Minimal (~5-10%) com implementação correta. Com índices na chave hash, busca é rápida.

---

### **P: Tenho que mexer em produção?**

R: **Não**. Fazer assim:
1. Implementar em **staging**
2. Testar tudo lá
3. Migrar dados (com backup)
4. Deploy em **produção** durante manutenção planejada

---

## 📋 PERGUNTAS SOBRE AUDITORIA

### **P: Quando devo fazer auditoria externa?**

R: **No final** de Fase 4 (mês 4). Assim:
1. Você implementa conformidade
2. Auditoria externa verifica
3. Você recebe relatório

---

### **P: Quanto custa auditoria externa?**

R: R$ 15-25K para compliance BACEN. Incluído no orçamento de R$ 146.200.

---

### **P: Preciso certificação SOC 2?**

R: Não é obrigatório, mas muito útil:
- Aumenta confiança de cliente
- Acelera vendas B2B
- Custa ~R$ 50K
- Recomendado (não crítico)

---

### **P: Como provo que estou conforme?**

R: Com:
- Relatório de auditoria externa ✅
- Documentação de conformidade ✅
- Audit logs imutáveis ✅
- Testes de penetração limpo ✅

---

## 👥 PERGUNTAS SOBRE PAPÉIS

### **P: Quem é o DPO?**

R: **Data Protection Officer**. Responsável por:
- Compliance LGPD
- Direitos do titular
- Data breach notification
- Registro de processamento

**Obrigatório por lei LGPD** (Lei 13.709/2018)

---

### **P: Pode ser interno ou precisa ser externo?**

R: Pode ser **ambos**:
- **Interno**: Profissional seu dedicado 100%
- **Externo**: Consultoria especializada
- **Híbrido**: DPO interno + consultoria para DPIA

---

### **P: Quem é o CISO?**

R: **Chief Information Security Officer**. Responsável por:
- Segurança de dados
- Implementação técnica
- Testes de penetração
- Resposta a incidentes

---

### **P: Precisa ser C-level?**

R: Não obrigatoriamente, mas deve ter:
- Independência (não pode ser demitido por regulação)
- Acesso irrestrito (pode auditar qualquer coisa)
- Reporta para diretoria
- Não tem conflito de interesse

---

## 🛠️ PERGUNTAS TÉCNICAS

### **P: Posso usar o código pronto que vocês forneceram?**

R: **SIM**. Está em `TEMPLATES_PRONTOS.md`. Basta copiar/colar e customizar.

---

### **P: Em qual linguagem está o código?**

R: **TypeScript/JavaScript** (Node.js). Mesma stack do seu projeto.

---

### **P: Preciso mudar minha arquitetura?**

R: **Não**. Adiciona camadas de segurança, mantém estrutura.

---

### **P: Vai quebrar meu código existente?**

R: Se feito cuidadosamente, **não**. Testes em staging primeiro.

---

### **P: Como fazer migrations de dados?**

R: Incluído no GUIA_IMPLEMENTACAO_PRATICA.md. Scripts SQL prontos.

---

### **P: E se eu usar PostgreSQL?**

R: Melhor ainda. SQL fornecido é PostgreSQL. Tudo já adaptado.

---

## 📊 PERGUNTAS SOBRE CONFORMIDADE

### **P: O que é DPIA?**

R: **Data Protection Impact Assessment**. Documento obrigatório LGPD que avalia:
- Que dados você processa
- Por que processa
- Riscos associados
- Medidas de proteção

Template incluído em documentação.

---

### **P: O que é "Direito ao Esquecimento"?**

R: Cliente pode pedir exclusão total de dados. Você tem 30 dias para:
1. Deletar dados pessoais
2. Notificar terceiros
3. Confirmar exclusão

LGPD obriga. Implementar em `FASE 4`.

---

### **P: Preciso notificar cliente em data breach?**

R: **SIM**. Dentro de **72 horas**. Incluir:
- O que aconteceu
- Quais dados foram expostos
- O que você está fazendo
- Contato DPO

---

### **P: E dados de teste/desenvolvimento?**

R: **Nunca usar dados reais**. Usar:
- Dados mascarados/fake
- PII gerado dinamicamente
- Deletar após 90 dias

---

### **P: Qual é a política de retenção?**

R: Depende do dado:
- **Clientes**: 5 anos pós-encerramento
- **Transações**: 5 anos pós-vencimento
- **Logs**: 7 anos (BACEN)
- **Testes**: 90 dias

Política formal necessária.

---

## 🚀 PERGUNTAS SOBRE IMPLEMENTAÇÃO

### **P: Começo pela front ou backend?**

R: **Backend primeiro**:
1. Segurança (credenciais, TLS, rate limit)
2. Criptografia
3. Auditoria
4. Frontend usa APIs protegidas

---

### **P: Qual é a ordem das implementações?**

R: Assim (veja `GUIA_IMPLEMENTACAO_PRATICA.md`):

**Semana 1-2**: Credenciais, HTTPS, CORS  
**Semana 3-4**: RBAC, Rate Limit  
**Semana 5-8**: Criptografia  
**Semana 9-12**: Auditoria expandida  
**Semana 13-16**: Governança

---

### **P: Preciso fazer tudo ou posso pular alguma coisa?**

R: **Tudo é obrigatório por BACEN**, mas priorize assim:

**Crítico** (fazer agora):
- Remover credenciais
- CORS restritivo
- HTTPS obrigatório

**Importante** (próximas 2 semanas):
- RBAC funcional
- Rate limiting
- Criptografia de PII

**Desejado** (depois):
- Governança completa
- SOC 2 certificado

---

### **P: Como testar se está correto?**

R: Cada seção tem "Verificação" com comandos. Exemplo:

```bash
# Verificar CORS
curl -H "Origin: hacker.com" https://seu-api.com
# Esperado: CORS error ❌
```

---

### **P: E se der erro durante implementação?**

R: Temos:
1. **Rollback procedure** documentado
2. **Backup** automático antes de mudança
3. **Staging environment** para testar
4. **Support** via documentação

---

## ⚖️ PERGUNTAS SOBRE LEI

### **P: BACEN pode processar-me criminalmente?**

R: Não. BACEN impõe **multas administrativas** (até R$ 2M). Lei criminal é outro processo (roubo de dados, etc).

---

### **P: Cliente pode processar-me por data breach?**

R: **SIM**. Por LGPD artigo 42/43 (direito indenizatória). Valor livre (tribunal decide).

---

### **P: Preciso avisar BACEN que estou implementando?**

R: Não obrigatório, mas se receber notificação, pode mostrar plano + progresso para mitigação.

---

### **P: E se BACEN bloquear meu sistema?**

R: Muito raro (último recurso). Mas se:
1. Você tem 60 dias para se conformar
2. BACEN pode designar um interventor
3. Seu sistema fica inoperável

---

## 📞 PERGUNTAS SOBRE SUPORTE

### **P: Quem responde dúvidas técnicas?**

R: A documentação é completa. Para dúvidas específicas:
1. Veja `CONFORMIDADE_BACEN_GOVERNANCA.md` (referência)
2. Veja `GUIA_IMPLEMENTACAO_PRATICA.md` (código)
3. Veja `TEMPLATES_PRONTOS.md` (exemplos)
4. Contrate consultoria se necessário

---

### **P: Preciso contratar consultoria?**

R: **Não é obrigatório**, mas recomendado para:
- Revisão de código
- Auditoria final
- DPIA
- Validação com BACEN

---

### **P: Quanto custa consultoria?**

R: R$ 150-300/hora. Para projeto completo: R$ 30-50K.

---

## 🎯 ÚLTIMA PERGUNTA

### **P: Por onde começo?**

R: **Assim**:

```
HOJE (25 Nov)
├─ Leia: RESUMO_EXECUTIVO.md (3 min)
├─ Aprove: Budget R$ 146.200
└─ Designe: DPO + CISO

AMANHÃ
├─ Leia: CONFORMIDADE_BACEN_GOVERNANCA.md
├─ Reúna: Tech Lead + DPO + CISO
└─ Comece: FASE 1 (PASSO 1 do GUIA_IMPLEMENTACAO_PRATICA.md)

SEMANA 1
└─ Auditoria de credenciais em código

SEMANA 2-4
└─ Fase 1: Segurança crítica completa
```

---

**Dúvidas específicas?** Veja o documento correspondente:
- Técnicas → GUIA_IMPLEMENTACAO_PRATICA.md
- Compliance → CONFORMIDADE_BACEN_GOVERNANCA.md
- Código → TEMPLATES_PRONTOS.md
- Aprovação → RESUMO_EXECUTIVO.md

---

**Última atualização**: 25 de Novembro de 2025  
**Versão**: 1.0 Final
