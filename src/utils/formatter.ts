export type IMaskPatternType =
  | "cpfCnpj"
  | "cep"
  | "phone"
  | "numbers"
  | "letters"
  | "date"
  | "dateTime"
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

  private maskDateInternal = (dbDate: string | Date | null | undefined, includeTime: boolean = false): string => {
    if (!dbDate) {
      return "-";
    }

    let dateObj: Date;

    if (typeof dbDate === "string") {
      // Check if it's just a date string (YYYY-MM-DD) and append time to avoid UTC issues if needed.
      // However, Supabase often returns full ISO strings, so direct parsing is usually fine.
      dateObj = new Date(dbDate);
    } else if (dbDate instanceof Date) {
      dateObj = dbDate;
    } else {
      return "-"; // Or some other placeholder for invalid input
    }

    if (isNaN(dateObj.getTime())) {
      return "-"; // Invalid date
    }

    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // Meses são 0-indexados
    const year = dateObj.getFullYear();

    if (includeTime) {
      const hours = String(dateObj.getHours()).padStart(2, "0");
      const minutes = String(dateObj.getMinutes()).padStart(2, "0");
      const seconds = String(dateObj.getSeconds()).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }

    return `${day}/${month}/${year}`;
  };

  public maskDate = (dbDate: string | Date | null | undefined): string => {
    return this.maskDateInternal(dbDate, false);
  }

  public maskDateTime = (dbDate: string | Date | null | undefined): string => {
    return this.maskDateInternal(dbDate, true);
  }

  private maskOnlyLetters = (value: string) => {
    return value.replace(/[0-9!@#¨$%^&*)(+=._-]+/g, "");
  };

  private maskCEP = (value: string) => {
    return value.replace(/\D/g, "").replace(/^(\d{5})(\d{3})+?$/, "$1-$2");
  };

  public maskMoney = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') {
      return "-";
    }
    const numValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    if (isNaN(numValue)) {
        return "R$ -";
    }
    return Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue);
  };

  private maskBoolean = (value: string) => {
    if (value.toLowerCase() === "true") return "Ativo";
    if (value.toLowerCase() === "false") return "Inativo";
    return "Inativo";
  };

  applyMask(value: any, type: IMaskPatternType): string {
    switch (type) {
      case "cep":
        return this.maskCEP(String(value));
      case "cpfCnpj":
        return this.document(String(value));
      case "date":
        return this.maskDate(value); // value can be Date object or string
      case "dateTime":
        return this.maskDateTime(value); // value can be Date object or string
      case "phone":
        return this.phone(String(value));
      case "numbers":
        return this.maskOnlyNumbers(String(value));
      case "letters":
        return this.maskOnlyLetters(String(value));
      case "money":
        return this.maskMoney(value); // value can be number or string
      case "status":
        return this.maskBoolean(String(value));
      default:
        return "invalid type";
    }
  }
}

// Export standalone functions for easier import
const instance = new MaskPattern();

export const formatDateTime = (value: string | Date | null | undefined): string => {
  return instance.maskDateTime(value);
};

export const formatDate = (value: string | Date | null | undefined): string => {
  return instance.maskDate(value);
};

export const formatCurrency = (value: number | string | null | undefined): string => {
  return instance.maskMoney(value);
};

export const applyMask = (value: any, type: IMaskPatternType): string => {
  return instance.applyMask(value, type);
};
