import { AlunoOld } from "../services/homeServices";

/**
 * Utilitário para mapear dados da estrutura alunos_old para diferentes formatos
 */

/**
 * Converte um objeto AlunoOld para formato de exibição simples
 */
export const formatAlunoForDisplay = (aluno: AlunoOld) => ({
  id: aluno.alunoID,
  nome: aluno.alunoNome,
  telefone: aluno.alunoCelular || aluno.alunoTelefone || "N/A",
  email: aluno.alunoEmail || "N/A",
  status: aluno.alunoExcluido ? "Inativo" : "Ativo",
  dataNascimento: aluno.alunoDataNascimento,
  sexo: aluno.alunoSexo === 1 ? "Feminino" : "Masculino",
  endereco: `${aluno.alunoEndereco || ""}, ${aluno.alunoBairro || ""}, ${aluno.alunoCidade || ""} - ${aluno.alunoEstado || ""}`.replace(/^[, ]+|[, ]+$/g, ""),
});

/**
 * Converte data do formato brasileiro DD/MM/AAAA para ISO AAAA-MM-DD
 */
export const convertDateBRToISO = (dateBR: string): string => {
  if (!dateBR || dateBR.length !== 10) return "";
  const [day, month, year] = dateBR.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

/**
 * Converte sexo do formato string (M/F) para número (0/1) usado no banco alunos_old
 */
export const convertSexoToNumber = (sexo: string): number => {
  return sexo === "F" ? 1 : 0;
};

/**
 * Converte sexo do formato número (0/1) para string (M/F) usado no formulário
 */
export const convertSexoToString = (sexo: number): string => {
  return sexo === 1 ? "F" : "M";
};

/**
 * Converte data do formato ISO AAAA-MM-DD para brasileiro DD/MM/AAAA
 */
export const convertDateISOToBR = (dateISO: string): string => {
  if (!dateISO) return "";
  const date = new Date(dateISO);
  if (isNaN(date.getTime())) return "";
  
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Valida se um CPF está no formato correto (mesmo que seja null na base)
 */
export const formatCPF = (cpf: string | null): string => {
  if (!cpf) return "";
  const numbers = cpf.replace(/\D/g, "");
  if (numbers.length === 11) {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return cpf;
};

/**
 * Formata telefone/celular para exibição
 */
export const formatPhone = (phone: string | null): string => {
  if (!phone) return "";
  const numbers = phone.replace(/\D/g, "");
  
  if (numbers.length === 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (numbers.length === 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  
  return phone;
};

/**
 * Converte sexo numérico para texto
 */
export const formatSexo = (sexo: number): string => {
  switch (sexo) {
    case 1: return "Masculino";
    case 2: return "Feminino";
    default: return "Não informado";
  }
};

/**
 * Cria um resumo do aluno para tooltip ou card resumido
 */
export const createAlunoSummary = (aluno: AlunoOld): string => {
  const parts = [
    `Nome: ${aluno.alunoNome}`,
    `Matrícula: ${aluno.alunoMatricula}`,
    `Sexo: ${aluno.alunoSexo === 1 ? "Feminino" : "Masculino"}`,
    aluno.alunoCelular ? `Celular: ${formatPhone(aluno.alunoCelular)}` : null,
    aluno.alunoEmail ? `Email: ${aluno.alunoEmail}` : null,
    `Status: ${aluno.alunoExcluido ? "Inativo" : "Ativo"}`,
    `Nascimento: ${aluno.alunoDataNascimento}`,
  ].filter(Boolean);
  
  return parts.join("\n");
};