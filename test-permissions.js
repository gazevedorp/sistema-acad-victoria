// Script simples para testar as permissões no console do navegador
// Execute isso após fazer login

// Obter o estado do authStore
const authState = JSON.parse(localStorage.getItem('auth-storage'));
console.log('Estado do authStore:', authState);

if (authState && authState.state && authState.state.user) {
  const user = authState.state.user;
  console.log('Usuário:', user.email);
  console.log('Categoria:', user.permissao);
  console.log('Permissões:', user.permissions);
  
  // Testar algumas verificações
  const hasPermissionFunction = (modulo, acao) => {
    if (!user) return false;
    if (user.permissao === 'admin') return true;
    return user.permissions?.[modulo]?.[acao] || false;
  };
  
  console.log('Testes de permissão:');
  console.log('produtos + visualizar:', hasPermissionFunction('produtos', 'visualizar'));
  console.log('usuarios + visualizar:', hasPermissionFunction('usuarios', 'visualizar'));
  console.log('permissoes + visualizar:', hasPermissionFunction('permissoes', 'visualizar'));
  console.log('planos + criar:', hasPermissionFunction('planos', 'criar'));
} else {
  console.log('Usuário não está logado ou dados não encontrados');
}
