// src/pages/FormasPagamento/components/FormaPagamentoModal/FormaPagamentoModal.styles.ts
import styled from "styled-components";
import { COLORS } from "../../../../styles/colors";

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

export const ModalContent = styled.div`
  background-color: ${COLORS.white};
  border-radius: 8px;
  padding: 24px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

export const ModalTitle = styled.h2`
  color: ${COLORS.textBody};
  font-size: 20px;
  font-weight: 600;
  margin: 0;
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: ${COLORS.textMuted};
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${COLORS.textBody};
  }
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Label = styled.label`
  color: ${COLORS.textLabel};
  font-size: 14px;
  font-weight: 500;
`;

export const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid ${COLORS.borderDefault};
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${COLORS.primary};
    box-shadow: 0 0 0 2px ${COLORS.primaryLightFocus};
  }

  &:disabled {
    background-color: ${COLORS.backgroundDisabled};
    cursor: not-allowed;
  }
`;

export const TextArea = styled.textarea`
  padding: 10px 12px;
  border: 1px solid ${COLORS.borderDefault};
  border-radius: 4px;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${COLORS.primary};
    box-shadow: 0 0 0 2px ${COLORS.primaryLightFocus};
  }

  &:disabled {
    background-color: ${COLORS.backgroundDisabled};
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
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
  }
`;

export const CheckboxLabel = styled.label`
  color: ${COLORS.textBody};
  font-size: 14px;
  cursor: pointer;

  &:has(input:disabled) {
    cursor: not-allowed;
    color: ${COLORS.textMuted};
  }
`;

export const ErrorMessage = styled.span`
  color: ${COLORS.danger};
  font-size: 12px;
  margin-top: 4px;
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

export const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 100px;
  justify-content: center;

  ${props => props.variant === 'primary' ? `
    background-color: ${COLORS.primary};
    color: ${COLORS.white};
    border: 1px solid ${COLORS.primary};

    &:hover:not(:disabled) {
      background-color: ${COLORS.primaryDarker};
    }
  ` : `
    background-color: ${COLORS.white};
    color: ${COLORS.textBody};
    border: 1px solid ${COLORS.borderDefault};

    &:hover:not(:disabled) {
      background-color: ${COLORS.backgroundLight};
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
