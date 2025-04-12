import styled from "styled-components";

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100dvh;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  overflow: hidden;
`;

export const ModalContainer = styled.div`
  background-color: #fff;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow: auto;
  border-radius: 8px;
  overflow: scroll;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #eee;
`;

export const ModalTitle = styled.h2`
  margin: 0;
  font-weight: 600;
  font-size: 18px;
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #888;
  &:hover {
    color: #333;
  }
`;

export const ModalBody = styled.div`
  padding: 16px 24px;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Label = styled.label`
  font-size: 14px;
  margin-bottom: 4px;
  font-weight: bold;
`;

export const LabelRequired = styled.span`
  font-weight: 200;
  color: #888;
`;

export const Input = styled.input`
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  &:disabled,
  &[readonly] {
    background-color: #f9f9f9;
    color: #666;
    cursor: not-allowed;
  }
`;

export const DisplayField = styled.div`
  padding: 8px 0;
  font-size: 14px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const WhatsAppIcon = styled.span`
  color: #25d366;
  font-size: 1.2rem;
  cursor: pointer;
  &:hover {
    filter: brightness(1.1);
  }
`;

export const SubmitButton = styled.button`
  align-self: flex-end;
  color: #fff;
  width: 140px;
  font-size: 14px;
  margin-bottom: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  background: #0D88CB;
  &:hover {
    background: #0898e6;
  }
`;

export const ErrorMsg = styled.span`
  color: red;
  font-size: 12px;
  margin-top: 4px;
`;

/**
 * Container extra no rodapé para exibir botões lado a lado
 * (apenas modo VIEW, com WhatsApp e Ligação).
 */
export const FooterButtonsContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
  margin-bottom: 6px;
`;

/**
 * Botão com fundo branco, borda verde, ícone verde para WhatsApp
 */
export const WhatsAppButton = styled.button`
  background: #fff;
  border: 2px solid #25d366;
  color: #25d366;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #f0fff5;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #bbf7d0;
  }
`;

/**
 * Botão com fundo branco, borda azul, ícone azul para ligações
 */
export const CallButton = styled.button`
  background: #fff;
  border: 2px solid #007bff;
  color: #007bff;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #f0f8ff;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #cce5ff;
  }
`;
