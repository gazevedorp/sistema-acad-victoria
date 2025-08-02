# Sistema de Permissões - Sistema Acadêmico Victoria

## Resumo das Mudanças

O sistema agora utiliza um controle de permissões baseado na tabela `categoria_permissoes` do Supabase. As verificações são feitas através do `authStore` que carrega as permissões do usuário durante o login.

## Como Funciona

### 1. Estrutura de Permissões

- **Tabela**: `categoria_permissoes`
- **Campos principais**:
  - `categoria_usuario`: 'admin' ou 'recepcao'
  - `modulo`: nome do módulo (ex: 'produtos', 'usuarios', 'planos')
  - `permissao`: tipo de ação ('visualizar', 'criar', 'editar', 'excluir')
  - `ativo`: boolean para ativar/desativar permissões

### 2. Categorias de Usuário

#### Admin
- Acesso total a todos os módulos
- Pode realizar todas as ações (visualizar, criar, editar, excluir)
- Acesso exclusivo aos módulos: usuarios, permissoes, templates_fechamento

#### Recepção
- Acesso limitado baseado nas permissões da tabela
- Pode gerenciar clientes completamente
- Pode operar caixa
- Apenas visualização para: planos, modalidades, turmas, produtos, relatórios

### 3. Módulos do Sistema

- `home` - Dashboard principal
- `clientes` - Gerenciamento de clientes
- `planos` - Planos de pagamento
- `modalidades` - Modalidades esportivas
- `turmas` - Gerenciamento de turmas
- `produtos` - Produtos e serviços
- `usuarios` - Gerenciamento de usuários (apenas admin)
- `caixa` - Operações de caixa
- `relatorios` - Relatórios do sistema
- `permissoes` - Gestão de permissões (apenas admin)
- `formas_pagamento` - Formas de pagamento
- `templates_fechamento` - Templates de fechamento (apenas admin)

### 4. Como Usar no Código

#### No `authStore`:
```typescript
const hasPermission = useAuthStore((state) => state.hasPermission);

// Verificar se pode visualizar produtos
if (hasPermission('produtos', 'visualizar')) {
  // Mostrar produtos
}

// Verificar se pode criar planos
if (hasPermission('planos', 'criar')) {
  // Mostrar botão criar
}
```

#### Em Componentes:
```typescript
import { useAuthStore } from '../store/authStore';

const MyComponent = () => {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  
  return (
    <div>
      {hasPermission('produtos', 'visualizar') && <ProductList />}
      {hasPermission('produtos', 'criar') && (
        <button onClick={handleCreate}>Criar Produto</button>
      )}
    </div>
  );
};
```

### 5. Rotas Protegidas

As rotas são automaticamente protegidas pelo componente `ProtectedRoute`. Se o usuário não tiver permissão de "visualizar" um módulo, será redirecionado com uma mensagem de "Acesso Negado".

### 6. Sidebar Dinâmico

O sidebar mostra apenas os itens de menu que o usuário tem permissão para visualizar, baseado nas verificações de permissão.

## Configuração do Banco de Dados

Execute o script `database/reset_categoria_permissoes.sql` no SQL Editor do Supabase para criar a tabela e inserir as permissões padrão.

## Testando as Permissões

1. Execute o script SQL no Supabase
2. Faça login com diferentes tipos de usuário
3. Use o script `test-permissions.js` no console do navegador para verificar as permissões carregadas
4. Verifique se o sidebar e as rotas estão funcionando corretamente

## Troubleshooting

### Problema: Permissões não carregam
- Verifique se a tabela `categoria_permissoes` existe
- Confirme se o usuário tem a categoria correta ('admin' ou 'recepcao')
- Verifique se as permissões estão marcadas como `ativo = true`

### Problema: Usuário admin não tem acesso
- Admins sempre têm acesso total, independente da tabela
- Verifique se `user.permissao === 'admin'` no localStorage

### Problema: Sidebar vazio
- Verifique se as permissões estão carregadas em `user.permissions`
- Confirme se os nomes dos módulos estão corretos na tabela
