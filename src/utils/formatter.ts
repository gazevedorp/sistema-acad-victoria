export type IMaskPatternType =
  | "cpfCnpj"
  | "cep"
  | "phone"
  | "numbers"
  | "letters"
  | "date"
  | "dateTime"
  | "money"
  | "status"
  | "dateVarchar"
  | "timeVarchar"
  | "dateTimeVarchar";

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

  // Funções para campos VARCHAR de data/hora do banco
  private formatDateVarchar = (value: string | null | undefined): string => {
    if (!value || value === "") return "-";
    
    try {
      // Se a data já está no formato DD/MM/YYYY, apenas retorna
      if (value.includes('/') && value.length === 10) {
        const [day, month, year] = value.split('/');
        if (day.length === 2 && month.length === 2 && year.length === 4) {
          return value;
        }
      }
      
      // Se está no formato YYYY-MM-DD, converte para DD/MM/YYYY
      if (value.includes('-')) {
        const [year, month, day] = value.split('-');
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }
      
      // Se está no formato YYYYMMDD (8 dígitos), converte
      if (/^\d{8}$/.test(value)) {
        const year = value.substring(0, 4);
        const month = value.substring(4, 6);
        const day = value.substring(6, 8);
        return `${day}/${month}/${year}`;
      }
      
      // Tenta parselar como timestamp ISO e converter
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
      
      return value; // Retorna o valor original se não conseguir formatar
    } catch {
      return value || "-";
    }
  };

  private formatTimeVarchar = (value: string | null | undefined): string => {
    if (!value || value === "") return "-";
    
    try {
      // Se já tem os dois pontos e está no formato HH:MM ou HH:MM:SS, retorna
      if (value.includes(':')) {
        const parts = value.split(':');
        if (parts.length >= 2) {
          const hours = parts[0].padStart(2, '0');
          const minutes = parts[1].padStart(2, '0');
          return `${hours}:${minutes}`;
        }
      }
      
      // Se é só números (ex: 0800, 1430), formata para HH:MM
      if (/^\d{3,4}$/.test(value)) {
        if (value.length === 3) {
          // Ex: 800 -> 08:00
          const hours = value.substring(0, 1).padStart(2, '0');
          const minutes = value.substring(1, 3);
          return `${hours}:${minutes}`;
        } else if (value.length === 4) {
          // Ex: 0800 -> 08:00, 1430 -> 14:30
          const hours = value.substring(0, 2);
          const minutes = value.substring(2, 4);
          return `${hours}:${minutes}`;
        }
      }
      
      // Se tem 5 ou 6 dígitos, pode ser HHMMSS
      if (/^\d{5,6}$/.test(value)) {
        if (value.length === 5) {
          // Ex: 80000 -> 08:00:00
          const hours = value.substring(0, 1).padStart(2, '0');
          const minutes = value.substring(1, 3);
          const seconds = value.substring(3, 5);
          return `${hours}:${minutes}:${seconds}`;
        } else if (value.length === 6) {
          // Ex: 083000 -> 08:30:00
          const hours = value.substring(0, 2);
          const minutes = value.substring(2, 4);
          const seconds = value.substring(4, 6);
          return `${hours}:${minutes}:${seconds}`;
        }
      }
      
      return value; // Retorna o valor original se não conseguir formatar
    } catch {
      return value || "-";
    }
  };

  private formatDateTimeVarchar = (value: string | null | undefined): string => {
    if (!value || value === "") return "-";
    
    try {
      // Tenta parselar como timestamp ISO completo
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      }
      
      // Se contém espaço, pode ser "YYYY-MM-DD HH:MM" ou "DD/MM/YYYY HH:MM"
      if (value.includes(' ')) {
        const [datePart, timePart] = value.split(' ');
        const formattedDate = this.formatDateVarchar(datePart);
        const formattedTime = this.formatTimeVarchar(timePart);
        return `${formattedDate} ${formattedTime}`;
      }
      
      return value; // Retorna o valor original se não conseguir formatar
    } catch {
      return value || "-";
    }
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
      case "dateVarchar":
        return this.formatDateVarchar(String(value)); // Para campos VARCHAR de data
      case "timeVarchar":
        return this.formatTimeVarchar(String(value)); // Para campos VARCHAR de hora
      case "dateTimeVarchar":
        return this.formatDateTimeVarchar(String(value)); // Para campos VARCHAR de data/hora
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

// Funções específicas para campos VARCHAR do banco de dados
export const formatDateVarchar = (value: string | null | undefined): string => {
  return instance.applyMask(value, "dateVarchar");
};

export const formatTimeVarchar = (value: string | null | undefined): string => {
  return instance.applyMask(value, "timeVarchar");
};

export const formatDateTimeVarchar = (value: string | null | undefined): string => {
  return instance.applyMask(value, "dateTimeVarchar");
};

// Função para converter data DD/MM/YYYY para YYYY-MM-DD (para inputs date)
export const convertDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  
  try {
    // Se já está no formato YYYY-MM-DD, retorna
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Se está no formato DD/MM/YYYY, converte para YYYY-MM-DD
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return dateString;
  } catch {
    return "";
  }
};

// Função para converter hora para formato HH:MM (para inputs time)
export const convertTimeForInput = (timeString: string | null | undefined): string => {
  if (!timeString) return "";
  
  try {
    const formatted = formatTimeVarchar(timeString);
    // Retorna apenas HH:MM para inputs do tipo time
    return formatted.includes(':') ? formatted.split(':').slice(0, 2).join(':') : formatted;
  } catch {
    return "";
  }
};
