import { FaEllipsisH, FaEye, FaEdit, FaTrash } from "react-icons/fa";
import * as S from "./ActionMenu.styles"; // importa os styled components

interface ActionsMenuCellProps<T> {
  rowValue: T;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onView?(row: T): void;
  onEdit?(row: T): void;
  onDelete?(row: T): void;
}

function ActionsMenu<T extends Record<string, any>>(props: ActionsMenuCellProps<T>) {
  const { rowValue, onView, onEdit, onDelete, isOpen, onToggle, onClose } = props;


  const handleView = () => {
    onView?.(rowValue);
    onClose();
  };

  const handleEdit = () => {
    onEdit?.(rowValue);
    onClose();
  };

  const handleDelete = () => {
    onDelete?.(rowValue);
    onClose();
  };

  return (
    <S.Container>
      <S.MenuButton onClick={onToggle}>
        <FaEllipsisH />
      </S.MenuButton>

      {isOpen && (
        <S.Popup>
          <S.MenuItem onClick={handleView}>
            <FaEye />
            <span>Detalhes</span>
          </S.MenuItem>
          <S.MenuItem onClick={handleEdit}>
            <FaEdit />
            <span>Editar</span>
          </S.MenuItem>
          <S.MenuItemDelete onClick={handleDelete}>
            <FaTrash />
            <span>Excluir</span>
          </S.MenuItemDelete>
        </S.Popup>
      )}
    </S.Container>
  );
}

export default ActionsMenu;
