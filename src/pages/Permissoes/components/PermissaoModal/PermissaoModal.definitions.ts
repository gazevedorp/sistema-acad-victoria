import { CategoriaPermissao } from '../../../../types/PermissaoTypes';

export interface PermissaoModalProps {
  permissao?: CategoriaPermissao | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}
