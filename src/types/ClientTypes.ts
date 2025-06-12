export interface Client {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  ativo: boolean;
  cpf: string;
  rg: string;
  endereco: string;
  paymentStatus?: string; // New field for financial status
}