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
  sexo: string; // 'M' para masculino, 'F' para feminino
  telefone: string;
  email?: string;
  cep: string;
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
  possuiResponsavel?: boolean;
  responsavelNome?: string;
  responsavelCpf?: string;
  responsavelTelefone?: string;
  observacoes?: string;
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
  nomePersonalizado?: string; // Para planos personalizados
}

export interface MatriculaFormData {
  matriculaItens: MatriculaItem[];
  dataMatricula: string;
  diaVencimento?: number;
  matriculaSituacao?: string; // Status real do banco: ATIVA, PENDENTE, BLOQUEADA, ENCERRADA, INATIVA
  observacoesMatricula?: string;
  valorPlano?: string;
  valorCobrado?: string;
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
  cpf: yup.string().optional().nullable().default(undefined).transform(value => value ? String(value).replace(/[^\d]/g, '') : null).test('cpf-valido', 'CPF inválido', value => !value || isValidCPF(value)),
  rg: yup.string().optional().nullable().default(undefined),
  data_nascimento: yup.string().optional().nullable().default(undefined).transform(normalizeDate).test('data-valida', 'Data inválida', value => !value || /^\d{4}-\d{2}-\d{2}$/.test(value)),
  sexo: yup.string().optional().nullable().default(undefined).test('sexo-valido', 'Selecione M ou F', value => !value || ['M', 'F'].includes(value)),
  telefone: yup.string().optional().nullable().default(undefined).transform(value => value ? String(value).replace(/[^\d]/g, '') : null).test('tel-valido', 'Telefone inválido', value => !value || /^\d{10,11}$/.test(value)),
  email: yup.string().email("E-mail inválido").optional().nullable().default(undefined),
  cep: yup.string().optional().nullable().default(undefined).transform(value => value ? String(value).replace(/[^\d]/g, '') : null).test('cep-valido', 'CEP deve ter 8 dígitos', value => !value || /^\d{8}$/.test(value)),
  rua: yup.string().optional().nullable().default(undefined),
  bairro: yup.string().optional().nullable().default(undefined),
  cidade: yup.string().optional().nullable().default(undefined),
  estado: yup.string().optional().nullable().default(undefined).test('uf-valida', 'UF inválida', value => !value || /^[A-Za-z]{2}$/.test(value)),
  possuiResponsavel: yup.boolean().optional().nullable(),
  responsavelNome: yup.string().when('possuiResponsavel', {is: true, then: schema => schema.required("Nome do Responsável é obrigatório").min(3), otherwise: schema => schema.optional().nullable().default(undefined)}),
  responsavelCpf: yup.string().when('possuiResponsavel', {is: true, then: schema => schema.optional().nullable().default(undefined).transform(v => v ? String(v).replace(/[^\d]/g, '') : null).test('cpf-valido-resp', 'CPF do Resp. inválido', v => !v || isValidCPF(v)) , otherwise: schema => schema.optional().nullable().default(undefined)}),
  responsavelTelefone: yup.string().when('possuiResponsavel', {is: true, then: schema => schema.optional().nullable().default(undefined).transform(v => v ? String(v).replace(/[^\d]/g, '') : null).test('tel-valido-resp', 'Telefone do Resp. inválido', v => !v || /^\d{10,11}$/.test(v)) , otherwise: schema => schema.optional().nullable().default(undefined)}),
  observacoes: yup.string().optional().nullable().default(undefined),
});

export const matriculaSchema = yup.object().shape({
    matriculaItens: yup.array().of(yup.object().shape({
        planoId: yup.string().required("Plano é obrigatório"),
        turmaId: yup.string().required("Turma é obrigatória"),
        valorOriginalPlano: yup.number().required("Valor do plano é necessário"),
        nomePersonalizado: yup.string().optional(),
    })).min(1, "Configure um plano para a matrícula").required(),
    dataMatricula: yup.string().required("Data da matrícula é obrigatória").transform(normalizeDate).matches(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
    diaVencimento: yup.number().required("Dia de vencimento é obrigatório").min(1).max(31).typeError("Dia inválido"),
    matriculaSituacao: yup.string().oneOf(['ATIVA', 'PENDENTE', 'BLOQUEADA', 'ENCERRADA'], "Status inválido").required("Status é obrigatório"),
    observacoesMatricula: yup.string().optional().nullable().default(undefined),
});

export const UFs = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];