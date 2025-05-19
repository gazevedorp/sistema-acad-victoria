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

export type MaskPatternType = "phone" | "cpfCnpj" | "cep";

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
}

export function isValidCPF(cpf: string | null | undefined): boolean {
  if (!cpf) return false;
  const cpfLimp = String(cpf).replace(/[^\d]+/g, "");
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
  if (originalValue && typeof originalValue === "string") {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(originalValue)) {
      const parts = originalValue.split("/");
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(originalValue)) {
      return originalValue;
    }
  }
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }
  return originalValue === "" || originalValue === null
    ? undefined
    : originalValue;
};

export const dadosCadastraisSchema = yup.object().shape({
  nome: yup.string().required("Nome é obrigatório").min(3, "Nome muito curto"),
  cpf: yup
    .string()
    .required("CPF é obrigatório")
    .transform((value) => String(value).replace(/[^\d]/g, ""))
    .test("cpf-valido", "CPF inválido", (value) => isValidCPF(value)),
  rg: yup.string().optional().nullable().default(undefined),
  data_nascimento: yup
    .string()
    .required("Data de Nascimento é obrigatória")
    .transform(normalizeDate)
    .matches(
      /^\d{4}-\d{2}-\d{2}$/,
      "Data inválida (use DD/MM/AAAA ou AAAA-MM-DD)"
    ),
  telefone: yup
    .string()
    .required("Telefone é obrigatório")
    .transform((value) => String(value).replace(/[^\d]/g, ""))
    .matches(/^\d{10,11}$/, "Telefone inválido (DDD + 8 ou 9 dígitos)"),
  email: yup
    .string()
    .email("E-mail inválido")
    .optional()
    .nullable()
    .default(undefined),
  cep: yup
    .string()
    .required("CEP é obrigatório")
    .transform((value) => String(value).replace(/[^\d]/g, ""))
    .matches(/^\d{8}$/, "CEP deve ter 8 dígitos"),
  rua: yup.string().required("Rua é obrigatória").min(2, "Rua muito curta"),
  numero: yup.string().required("Número é obrigatório"),
  complemento: yup.string().optional().nullable().default(undefined),
  bairro: yup
    .string()
    .required("Bairro é obrigatório")
    .min(2, "Bairro muito curto"),
  cidade: yup
    .string()
    .required("Cidade é obrigatória")
    .min(2, "Cidade muito curta"),
  estado: yup
    .string()
    .required("Estado (UF) é obrigatório")
    .length(2, "UF inválida (2 letras)")
    .matches(/^[A-Za-z]{2}$/, "UF inválida"),
});

export const UFs = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];
