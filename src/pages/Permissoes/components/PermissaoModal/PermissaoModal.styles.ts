import styled from "styled-components";

const COLORS = {
  primary: "#0898e6",
  secondary: "#6c757d",
  success: "#28a745",
  danger: "#dc3545",
  warning: "#ffc107",
  info: "#17a2b8",
  light: "#f8f9fa",
  dark: "#343a40",
  white: "#ffffff",
  textPrimary: "#212529",
  textSecondary: "#6c757d",
  textMuted: "#6c757d",
  textBody: "#495057",
  borderDefault: "#dee2e6",
  backgroundLight: "#f8f9fa",
};

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  overflow-y: hidden;
`;

export const ModalContainer = styled.div`
  background-color: ${COLORS.white};
  width: 700px;
  max-width: 95%;
  border-radius: 6px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
`;

export const ModalHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid ${COLORS.borderDefault};
  flex-shrink: 0;
`;

export const ModalTitle = styled.h2`
  margin: 0;
  font-weight: 600;
  font-size: 1.2rem;
  color: ${COLORS.textBody};
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.6rem;
  font-weight: bold;
  color: ${COLORS.textMuted};
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out;

  &:hover {
    color: ${COLORS.textBody};
    background-color: ${COLORS.backgroundLight};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 0.2rem rgba(8, 152, 230, 0.25);
  }
`;

export const ModalBody = styled.div`
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
`;

export const FormGroup = styled.div`
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: ${COLORS.textBody};
  font-size: 0.875rem;
`;

export const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${COLORS.borderDefault};
  border-radius: 4px;
  font-size: 0.875rem;
  color: ${COLORS.textBody};
  background-color: ${COLORS.white};
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

  &:focus {
    outline: none;
    border-color: ${COLORS.primary};
    box-shadow: 0 0 0 0.2rem rgba(8, 152, 230, 0.25);
  }

  &::placeholder {
    color: ${COLORS.textMuted};
  }

  &:disabled {
    background-color: ${COLORS.backgroundLight};
    cursor: not-allowed;
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${COLORS.borderDefault};
  border-radius: 4px;
  font-size: 0.875rem;
  color: ${COLORS.textBody};
  background-color: ${COLORS.white};
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

  &:focus {
    outline: none;
    border-color: ${COLORS.primary};
    box-shadow: 0 0 0 0.2rem rgba(8, 152, 230, 0.25);
  }

  &:disabled {
    background-color: ${COLORS.backgroundLight};
    cursor: not-allowed;
  }
`;

export const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  accent-color: ${COLORS.primary};
`;

export const CheckboxLabel = styled.label`
  margin: 0;
  font-size: 0.875rem;
  color: ${COLORS.textBody};
  cursor: pointer;
`;

export const ModalFooter = styled.div`
  padding: 16px 20px;
  border-top: 1px solid ${COLORS.borderDefault};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
`;

export const FooterButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

export const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out, opacity 0.15s ease-in-out;

  ${({ variant = 'secondary' }) => {
    switch (variant) {
      case 'primary':
        return `
          background-color: ${COLORS.primary};
          color: ${COLORS.white};
          
          &:hover:not(:disabled) {
            background-color: #0678c4;
          }
          
          &:focus {
            outline: none;
            box-shadow: 0 0 0 0.2rem rgba(8, 152, 230, 0.25);
          }
        `;
      case 'danger':
        return `
          background-color: ${COLORS.danger};
          color: ${COLORS.white};
          
          &:hover:not(:disabled) {
            background-color: #c82333;
          }
          
          &:focus {
            outline: none;
            box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
          }
        `;
      default:
        return `
          background-color: ${COLORS.light};
          color: ${COLORS.textBody};
          border: 1px solid ${COLORS.borderDefault};
          
          &:hover:not(:disabled) {
            background-color: #e9ecef;
          }
          
          &:focus {
            outline: none;
            box-shadow: 0 0 0 0.2rem rgba(108, 117, 125, 0.25);
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const ErrorMessage = styled.p`
  color: ${COLORS.danger};
  font-size: 0.75rem;
  margin: 4px 0 0 0;
`;

export const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
