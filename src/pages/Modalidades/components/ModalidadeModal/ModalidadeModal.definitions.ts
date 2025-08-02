export enum ModalMode {
  CREATE = "create",
  EDIT = "edit",
  VIEW = "view",
}

export interface ModalidadeModalProps {
  open: boolean;
  mode: ModalMode;
  onClose: () => void;
  initialData?: Partial<import("../../../../types/ModalidadeTypes").ModalidadeFormData>;
  modalidadeIdToEdit?: string;
  onSaveComplete: (error: any | null, savedData?: import("../../../../types/ModalidadeTypes").ModalidadeFormData, mode?: ModalMode) => void;
}
