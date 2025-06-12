export interface SistemUser {
  id: string; // This will be auth.users.id from Supabase
  nome: string;
  email: string;
  telefone: string; // New field
  permissao: 'admin' | 'recepcao'; // New field with specific values
  ativo: boolean;
}