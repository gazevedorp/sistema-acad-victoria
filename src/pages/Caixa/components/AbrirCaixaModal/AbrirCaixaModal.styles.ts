import styled from "styled-components";

// Reutilize sua paleta COLORS ou defina uma aqui
const COLORS = {
  primary: '#0898e6',
  textBody: '#212529',
  textMuted: '#6c757d',
  borderDefault: '#dee2e6',
  white: '#fff',
  danger: '#dc3545',
};

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100dvh;
  background-color: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1060; // Acima do CaixaModal se ambos puderem estar abertos
  padding: 16px;
`;

export const ModalContainer = styled.div`
  background-color: ${COLORS.white};
  width: 400px;
  max-width: 90%;
  border-radius: 6px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
`;

export const ModalHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid ${COLORS.borderDefault};
`;

export const ModalTitle = styled.h2`
  margin: 0;
  font-weight: 600;
  font-size: 1.1rem;
  color: ${COLORS.textBody};
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.6rem;
  font-weight: bold;
  color: ${COLORS.textMuted};
  cursor: pointer;
  &:hover { color: ${COLORS.textBody}; }
`;

export const ModalBody = styled.div`
  padding: 20px 24px;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

export const FormGroup = styled.div`
  margin-bottom: 15px;
`;

export const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  color: ${COLORS.primary};
  margin-bottom: 5px;
  font-weight: 500;
`;

export const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  font-size: 0.875rem;
  border: 1px solid ${COLORS.borderDefault};
  border-radius: 3px;
  box-sizing: border-box;
  &:focus {
    border-color: ${COLORS.primary};
    outline: none;
    box-shadow: 0 0 0 0.2rem rgba(13, 136, 230, 0.25);
  }
`;
export const Textarea = styled.textarea`
 width: 100%;
  padding: 8px 12px;
  font-size: 0.875rem;
  border: 1px solid ${COLORS.borderDefault};
  border-radius: 3px;
  box-sizing: border-box;
  min-height: 70px;
  resize: vertical;
  &:focus {
    border-color: ${COLORS.primary};
    outline: none;
    box-shadow: 0 0 0 0.2rem rgba(13, 136, 230, 0.25);
  }
`;


export const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

export const Button = styled.button`
  padding: 9px 20px;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 3px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background-color 0.15s ease-in-out;

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

export const PrimaryButton = styled(Button)`
  background-color: ${COLORS.primary};
  color: ${COLORS.white};
  &:hover:not(:disabled) { background-color: ${COLORS.primary}; }
`;

export const SecondaryButton = styled(Button)`
  background-color: ${COLORS.textMuted};
  color: ${COLORS.white};
  &:hover:not(:disabled) { background-color: #5a6268; }
`;

export const ErrorMsg = styled.span`
  color: ${COLORS.danger};
  font-size: 0.75rem;
  margin-top: 4px;
  display: block;
`;