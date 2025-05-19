import * as yup from "yup";

export enum ModalMode {
  CREATE = "create",
  VIEW = "view",
  EDIT = "edit",
}

export interface BaseModalProps {
  open: boolean;
  mode: ModalMode;
  onClose: () => void;
}

export type MaskPatternType = 'phone' | 'cpfCnpj' | 'cep';

export interface PlanoFromSupabase {
  id: string;
  nome: string;
  valor_mensal: number;
  modalidade_id: string;
}

export interface TurmaFromSupabase {
  id: string;
  nome: string;
  modalidade_id?: string;
  horarios_descricao?: string;
}

export interface DadosCadastraisFormData {
  nome: string;
  cpf: string;
  rg?: string;
  data_nascimento: string;
  telefone: string;
  email?: string;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  possuiResponsavel?: boolean;
  responsavelNome?: string;
  responsavelCpf?: string;
  responsavelTelefone?: string;
  responsavelParentesco?: string;
}

export interface Aluno extends DadosCadastraisFormData {
    id: string; 
    created_at?: string;
    updated_at?: string;
}

export interface MatriculaItem {
  planoId: string;
  turmaId: string;
  valorOriginalPlano: number;
}

export interface MatriculaFormData {
  matriculaItens: MatriculaItem[];
  dataMatricula: string;
  diaVencimento?: number;
  statusMatricula: 'ativa' | 'inativa';
  observacoesMatricula?: string;
}

export function isValidCPF(cpf: string | null | undefined): boolean {
  if (!cpf) return false;
  const cpfLimp = String(cpf).replace(/[^\d]+/g, '');
  if (cpfLimp.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpfLimp)) return false;
  let add = 0;
  for (let i = 0; i < 9; i++) add += parseInt(cpfLimp.charAt(i)) * (10 - i);
  let rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpfLimp.charAt(9))) return false;
  add = 0;
  for (let i = 0; i < 10; i++) add += parseInt(cpfLimp.charAt(i)) * (11 - i);
  rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpfLimp.charAt(10))) return false;
  return true;
}

const normalizeDate = (value: any, originalValue: any): string | undefined => {
    if (originalValue && typeof originalValue === 'string') {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(originalValue)) {
        const parts = originalValue.split('/');
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(originalValue)) {
        return originalValue;
      }
    }
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return originalValue === "" || originalValue === null ? undefined : originalValue;
};

export const dadosCadastraisSchema = yup.object().shape({
  nome: yup.string().required("Nome é obrigatório").min(3, "Nome muito curto"),
  cpf: yup.string().required("CPF é obrigatório").transform(value => String(value).replace(/[^\d]/g, '')).test('cpf-valido', 'CPF inválido', value => isValidCPF(value)),
  rg: yup.string().optional().nullable().default(undefined),
  data_nascimento: yup.string().required("Data de Nascimento é obrigatória").transform(normalizeDate).matches(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  telefone: yup.string().required("Telefone é obrigatório").transform(value => String(value).replace(/[^\d]/g, '')).matches(/^\d{10,11}$/, "Telefone inválido"),
  email: yup.string().email("E-mail inválido").optional().nullable().default(undefined),
  cep: yup.string().required("CEP é obrigatório").transform(value => String(value).replace(/[^\d]/g, '')).matches(/^\d{8}$/, "CEP deve ter 8 dígitos"),
  rua: yup.string().required("Rua é obrigatória").min(2, "Rua muito curta"),
  numero: yup.string().required("Número é obrigatório"),
  complemento: yup.string().optional().nullable().default(undefined),
  bairro: yup.string().required("Bairro é obrigatório").min(2, "Bairro muito curto"),
  cidade: yup.string().required("Cidade é obrigatória").min(2, "Cidade muito curta"),
  estado: yup.string().required("Estado (UF) é obrigatório").length(2, "UF inválida").matches(/^[A-Za-z]{2}$/, "UF inválida"),
  possuiResponsavel: yup.boolean().optional().nullable(),
  responsavelNome: yup.string().when('possuiResponsavel', {is: true, then: schema => schema.required("Nome do Responsável é obrigatório").min(3), otherwise: schema => schema.optional().nullable().default(undefined)}),
  responsavelCpf: yup.string().when('possuiResponsavel', {is: true, then: schema => schema.optional().nullable().default(undefined).transform(v => v ? String(v).replace(/[^\d]/g, '') : null).test('cpf-valido-resp', 'CPF do Resp. inválido', v => !v || isValidCPF(v)) , otherwise: schema => schema.optional().nullable().default(undefined)}),
  responsavelTelefone: yup.string().when('possuiResponsavel', {is: true, then: schema => schema.optional().nullable().default(undefined).transform(v => v ? String(v).replace(/[^\d]/g, '') : null).test('tel-valido-resp', 'Telefone do Resp. inválido', v => !v || /^\d{10,11}$/.test(v)) , otherwise: schema => schema.optional().nullable().default(undefined)}),
  responsavelParentesco: yup.string().when('possuiResponsavel', {is: true, then: schema => schema.required("Parentesco é obrigatório"), otherwise: schema => schema.optional().nullable().default(undefined)}),
});

export const matriculaSchema = yup.object().shape({
    matriculaItens: yup.array().of(yup.object().shape({
        planoId: yup.string().required("Plano é obrigatório"),
        turmaId: yup.string().required("Turma é obrigatória"),
        valorOriginalPlano: yup.number().required("Valor do plano é necessário"),
    })).min(1, "Adicione pelo menos um plano/turma").required(),
    dataMatricula: yup.string().required("Data da matrícula é obrigatória").transform(normalizeDate).matches(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
    diaVencimento: yup.number().required("Dia de vencimento é obrigatório").min(1).max(31).typeError("Dia inválido"),
    statusMatricula: yup.string().oneOf(['ativa', 'inativa'], "Status inválido").required("Status é obrigatório"),
    observacoesMatricula: yup.string().optional().nullable().default(undefined),
});

export const UFs = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];