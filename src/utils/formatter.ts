export type IMaskPatternType =
  | "cpfCnpj"
  | "cep"
  | "phone"
  | "numbers"
  | "letters"
  | "date"
  | "money"
  | "status";

export class MaskPattern {
  private maskCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  private maskCNPJ = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  private maskCellPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})(\d+?)$/, "$1");
  };

  private maskPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{4})(\d+?)$/, "$1");
  };

  private maskOnlyNumbers = (value: string) => {
    return value.replace(/\D/g, "");
  };

  private document = (value: string) => {
    const v = this.maskOnlyNumbers(value);
    if (!v.length) return "";
    if (v.length > 14) return value.substr(0, 18);

    if (v.length <= 11) {
      return this.maskCPF(v);
    }

    if (v.length > 11 && v.length <= 14) {
      return this.maskCNPJ(v);
    }
    return "";
  };

  private phone = (value: string) => {
    const v = this.maskOnlyNumbers(value);
    if (!v.length) return "";
    if (v.length > 11) return value.substr(0, 15);

    if (v.length === 11 && v.substr(2, 1) === "9") {
      return this.maskCellPhone(v);
    }

    return this.maskPhone(value);
  };

  private maskDate = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1");
  };

  private maskOnlyLetters = (value: string) => {
    return value.replace(/[0-9!@#¨$%^&*)(+=._-]+/g, "");
  };

  private maskCEP = (value: string) => {
    return value.replace(/\D/g, "").replace(/^(\d{5})(\d{3})+?$/, "$1-$2");
  };

  private maskOnlyMoney = (value: string) => {
    return Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  private maskBoolean = (value: string) => {
    if (value.toLowerCase() === "true") return "Ativo";
    if (value.toLowerCase() === "false") return "Inativo";
    return "Inativo";
  };

  applyMask(value: string, type: IMaskPatternType): string {
    switch (type) {
      case "cep":
        return this.maskCEP(value);
      case "cpfCnpj":
        return this.document(value);
      case "date":
        return this.maskDate(value);
      case "phone":
        return this.phone(value);
      case "numbers":
        return this.maskOnlyNumbers(value);
      case "letters":
        return this.maskOnlyLetters(value);
      case "money":
        return this.maskOnlyMoney(value);
      case "status":
        return this.maskBoolean(value);
      default:
        return "invalid type";
    }
  }
}
