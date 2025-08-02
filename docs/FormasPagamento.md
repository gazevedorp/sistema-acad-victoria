# Gerenciamento de Formas de Pagamento

## Descrição
Sistema completo para gerenciar formas de pagamento utilizadas tanto para vendas de produtos quanto para pagamento de mensalidades.

## Funcionalidades Implementadas

### 1. Interface de Gerenciamento (`FormasPagamento.tsx`)
- **Listagem**: Tabela com todas as formas de pagamento cadastradas
- **Busca**: Campo de pesquisa por nome ou descrição
- **Paginação**: Controle de linhas por página e navegação
- **Ações**: Botões para criar, editar, ativar/desativar formas de pagamento

### 2. Modal de Cadastro/Edição (`FormaPagamentoModal.tsx`)
- **Campos**:
  - Nome (obrigatório)
  - Descrição (opcional)
  - Ativo para vendas (checkbox)
  - Ativo para mensalidades (checkbox)
- **Modos**: Criar, Editar, Visualizar
- **Validação**: Usando Yup com react-hook-form

### 3. Estrutura do Banco de Dados
Tabela: `formas_pagamento`
```sql
- id (UUID, primary key)
- nome (varchar(100), obrigatório)
- descricao (varchar(255), opcional)
- ativo_venda (boolean, ativo para vendas)
- ativo_mensalidade (boolean, ativo para mensalidades)
- created_at (timestamp)
- updated_at (timestamp)
```

### 4. Integração ao Sistema
- **Rota**: `/formas-pagamento`
- **Menu**: Item "Formas de Pagamento" no sidebar
- **Navegação**: Protegida por autenticação

## Colunas da Tabela

1. **Nome**: Nome da forma de pagamento
2. **Descrição**: Descrição opcional
3. **Vendas**: Indica se está ativa para vendas de produtos
4. **Mensalidades**: Indica se está ativa para pagamento de mensalidades
5. **Ações**: Botões para editar e ativar/desativar ambos os campos

## Arquivos Criados

### Componentes
- `src/pages/FormasPagamento/FormasPagamento.tsx` - Página principal
- `src/pages/FormasPagamento/FormasPagamento.styles.ts` - Estilos da página
- `src/pages/FormasPagamento/components/FormaPagamentoModal/FormaPagamentoModal.tsx` - Modal
- `src/pages/FormasPagamento/components/FormaPagamentoModal/FormaPagamentoModal.styles.ts` - Estilos do modal
- `src/pages/FormasPagamento/components/FormaPagamentoModal/FormaPagamentoModal.definitions.ts` - Definições e schemas

### Tipos
- `src/types/FormaPagamentoTypes.ts` - Interfaces TypeScript

### Outros
- `database/formas_pagamento.sql` - Script SQL de criação da tabela

## Como Usar

1. **Acessar**: Navegue para "Formas de Pagamento" no menu lateral
2. **Criar**: Clique em "Cadastrar Forma de Pagamento"
3. **Editar**: Clique no botão "Editar" na linha desejada
4. **Ativar/Desativar**: Use o botão de toggle na coluna "Ações"
5. **Visualizar**: Clique em qualquer linha da tabela

## Validações

- Nome é obrigatório (mínimo 2 caracteres, máximo 100)
- Descrição é opcional (máximo 255 caracteres)
- Campos de ativo para venda e mensalidade são independentes

## Exemplos de Uso

### Forma de Pagamento para Ambos
```
Nome: PIX
Descrição: Pagamento instantâneo via PIX
Ativo para Vendas: ✓ Sim
Ativo para Mensalidades: ✓ Sim
```

### Forma de Pagamento Específica
```
Nome: Boleto
Descrição: Pagamento via boleto bancário
Ativo para Vendas: ✗ Não
Ativo para Mensalidades: ✓ Sim
```

## Benefícios

1. **Flexibilidade**: Controle granular sobre onde cada forma pode ser usada
2. **Facilidade**: Interface intuitiva para gestão
3. **Integração**: Pronto para ser consumido por outros módulos
4. **Escalabilidade**: Fácil adição de novas funcionalidades
5. **Manutenção**: Código organizado e bem estruturado
