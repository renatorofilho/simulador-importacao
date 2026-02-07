# 📖 Guia de Uso - Simulador de Importação Pro (Versão Melhorada)

## 🚀 Como Usar as Novas Funcionalidades

### 1. **Edição de Itens**

#### Como Editar um Item:
1. Acesse uma simulação existente
2. Na tabela de itens, localize o item que deseja editar
3. Clique no botão **Editar** (ícone de lápis) na coluna "Ações"
4. No modal que abrir, edite os campos:
   - **Quantidade:** Número de unidades
   - **Peso Unitário:** Peso em kg por unidade
   - **Volume Unitário:** Volume em m³ por unidade
   - **Valor Unitário:** Valor em USD por unidade
5. Observe os **valores calculados** em tempo real (peso total, volume total, valor total)
6. Clique em **Salvar Alterações**
7. Os impostos serão **recalculados automaticamente**

#### Como Excluir um Item:
1. Na tabela de itens, clique no botão **Excluir** (ícone X) na coluna "Ações"
2. Confirme a exclusão no diálogo que aparecer
3. O item será removido e a tabela atualizada automaticamente

#### Validações:
- ✅ Quantidade deve ser maior que 0
- ✅ Valor unitário deve ser maior que 0
- ✅ Peso e volume não podem ser negativos
- ✅ Mensagens de erro claras em caso de entrada inválida

---

### 2. **Cache de NCMs**

#### Como Funciona:
O sistema agora armazena NCMs consultadas por **24 horas** no navegador (localStorage). Isso significa que:
- **Primeira busca:** Vai para a API Siscomex (mais lenta)
- **Buscas seguintes:** Vêm do cache local (instantâneas)
- **Economia:** ~90% de redução em chamadas à API

#### Visualizar Status do Cache:
1. No topo da página de simulação, clique no botão **"Cache: X"**
2. Um popover mostrará:
   - Número de NCMs em cache
   - Número de NCMs expiradas
   - Indicador de economia de API

#### Limpar Cache Manualmente:
1. Clique no botão **"Cache: X"**
2. No popover, clique em **"Limpar Cache"**
3. Todas as NCMs armazenadas serão removidas

#### Identificar Origem dos Dados:
- Toast **"NCM encontrada (cache)":** Dados vieram do cache local (rápido)
- Toast **"NCM encontrada (API)":** Dados vieram da API Siscomex (mais lento)

---

### 3. **Avisos Visuais de Validação**

#### Card de Informações Tributárias:
Na seção **"Configurações"** da simulação, você verá um card azul com:

**Regime Tributário:**
- **Simples Nacional (Amarelo):** "PIS e COFINS zerados"
  - Tooltip: Explica que PIS e COFINS não são recuperáveis
- **Lucro Presumido (Laranja):** "PIS e COFINS zerados"
  - Tooltip: Explica que PIS e COFINS não são recuperáveis
- **Lucro Real (Verde):** "Todos os créditos recuperáveis"
  - Tooltip: Explica que todos os impostos são recuperáveis

**TTD (Santa Catarina):**
- **TTD 409:** Diferimento do ICMS na entrada
  - Benefício: "Diferimento total do ICMS" (exceto Simples Nacional)
- **TTD 410:** Redução de 75% do ICMS
  - Benefício: "Redução de 75% + crédito do restante" (exceto Simples Nacional)

#### Como Interpretar:
- **Amarelo/Laranja:** Atenção - alguns impostos são zerados automaticamente
- **Verde:** Tudo certo - todos os créditos são recuperáveis
- **Ícones:**
  - ⚠️ AlertCircle: Atenção para validações
  - ✅ CheckCircle2: Tudo correto
  - ℹ️ Info: Informações adicionais

---

## 🔧 Instalação e Configuração

### Requisitos:
- Node.js 22.13.0
- pnpm 10.4.1+
- MySQL ou TiDB

### Passos:
1. Extrair o arquivo `import-simulator-pro-melhorado.zip`
2. Navegar até a pasta do projeto
3. Instalar dependências:
   ```bash
   pnpm install
   ```
4. Configurar variáveis de ambiente no arquivo `.env`
5. Executar migrações do banco de dados:
   ```bash
   pnpm db:push
   ```
6. Iniciar em desenvolvimento:
   ```bash
   pnpm dev
   ```
7. Ou fazer build para produção:
   ```bash
   pnpm build
   pnpm start
   ```

---

## 📊 Fluxo de Trabalho Recomendado

### Criar Nova Simulação:
1. Acesse **"Simulações"** no menu
2. Clique em **"Nova Simulação"**
3. Configure regime, TTD, incoterm, câmbio
4. Salve a simulação

### Adicionar Itens:
1. Abra a simulação criada
2. **Opção 1:** Importar Proforma Invoice (botão "Importar Proforma")
3. **Opção 2:** Adicionar manualmente (botão "Adicionar Item")
   - Busque a NCM (use o cache!)
   - Preencha quantidade, peso, volume, valor
   - Adicione o item

### Editar e Ajustar:
1. Revise os itens na tabela
2. Edite valores conforme necessário (botão Editar)
3. Exclua itens incorretos (botão Excluir)
4. Observe o recálculo automático dos impostos

### Analisar Resultados:
1. Veja o **Resumo Financeiro** no final da página
2. Observe os **avisos de validação** no card de configurações
3. Entenda os benefícios do TTD aplicado

---

## 💡 Dicas e Boas Práticas

### Performance:
- ✅ Use o cache de NCMs para buscas repetidas
- ✅ Limpe o cache apenas quando necessário
- ✅ Importe proforma invoices para adicionar múltiplos itens de uma vez

### Precisão:
- ✅ Revise os dados importados antes de salvar
- ✅ Use a edição de itens para ajustes finos
- ✅ Observe os avisos de validação tributária

### Organização:
- ✅ Nomeie simulações de forma descritiva
- ✅ Use descrições para adicionar contexto
- ✅ Mantenha apenas simulações relevantes

---

## 🐛 Solução de Problemas

### Cache não está funcionando:
- Verifique se o localStorage está habilitado no navegador
- Limpe o cache e tente novamente
- Verifique o console do navegador para erros

### Edição de item não salva:
- Verifique se todos os campos obrigatórios estão preenchidos
- Certifique-se de que os valores são válidos (positivos)
- Veja mensagens de erro no toast

### NCM não encontrada:
- Verifique se o NCM tem exatamente 8 dígitos
- Tente buscar na API oficial da Receita Federal
- Verifique se há conexão com a internet

---

## 📞 Suporte

Para dúvidas, sugestões ou problemas:
- Acesse: https://help.manus.im
- Ou consulte a documentação completa em `MELHORIAS_IMPLEMENTADAS.md`

---

**Versão:** 1.1.0  
**Data:** 07 de Fevereiro de 2026  
**Status:** ✅ Pronto para Uso
