import styled from 'styled-components';

// Re-using COLORS from CaixaModal.styles.ts for consistency
// In a real scenario, these would likely be in a global theme file
export const COLORS = {
  primary: '#0898e6',
  primaryDarker: '#0b5ed7',
  primaryLightFocus: 'rgba(13, 110, 253, 0.25)',
  textBody: '#212529',
  textMuted: '#6c757d',
  textLabel: '#495057',
  borderDefault: '#dee2e6',
  borderFocus: '#86b7fe',
  backgroundDisabled: '#e9ecef',
  backgroundLight: '#f8f9fa',
  danger: '#dc3545',
  white: '#fff',
  success: '#198754', // Added for active status or success messages
};

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh; // Changed from 100dvh for broader compatibility, test if 100dvh is specifically needed
  background-color: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 16px;
  /* overflow-y: hidden; // Consider if this is needed, might hide scrollbars on modal itself if content overflows */
`;

export const ModalContainer = styled.div`
  background-color: ${COLORS.white};
  width: 480px; // Slightly smaller than CaixaModal
  max-width: 95%;
  border-radius: 6px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  max-height: 90vh; // Changed from 90dvh
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
  font-size: 1.15rem; // Slightly smaller
  color: ${COLORS.textBody};
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.6rem;
  font-weight: bold;
  line-height: 1;
  color: ${COLORS.textMuted};
  cursor: pointer;
  padding: 4px;
  opacity: 0.8;
  &:hover {
    opacity: 1;
    color: ${COLORS.textBody};
  }
`;

export const ModalBody = styled.div`
  padding: 20px 24px;
  overflow-y: auto;
  flex-grow: 1;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background-color: #ced4da; border-radius: 3px; }
  &::-webkit-scrollbar-track { background-color: ${COLORS.backgroundLight}; }
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px; // Added gap between form groups
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px; // Reduced margin
`;

export const FormGroupCheckbox = styled(FormGroup)`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

export const Label = styled.label`
  font-size: 0.8rem;
  color: ${COLORS.textLabel};
  font-weight: 500;
  display: block;
  margin-bottom: 2px;
`;

const baseInputStyles = `
  padding: 8px 12px;
  font-size: 0.875rem;
  line-height: 1.4;
  color: \${COLORS.textBody};
  background-color: \${COLORS.white};
  background-clip: padding-box;
  border: 1px solid #ced4da;
  border-radius: 3px;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  width: 100%;
  box-sizing: border-box;

  &:focus {
    color: \${COLORS.textBody};
    background-color: \${COLORS.white};
    border-color: \${COLORS.borderFocus};
    outline: 0;
    box-shadow: 0 0 0 0.2rem \${COLORS.primaryLightFocus};
  }

  &::placeholder { color: \${COLORS.textMuted}; opacity: 1; }
  &:disabled, &[readonly] { background-color: \${COLORS.backgroundDisabled}; opacity: 0.7; cursor: not-allowed; }
`;

export const Input = styled.input`
  ${baseInputStyles}
`;

// Specific style for checkbox for better alignment and size control if needed
export const CheckboxInput = styled.input.attrs({ type: 'checkbox' })`
  width: 1rem; // Example size
  height: 1rem; // Example size
  cursor: pointer;
  margin-right: 0.25rem; // Spacing between checkbox and label

  &:focus {
    outline: 0;
    box-shadow: 0 0 0 0.2rem ${COLORS.primaryLightFocus};
  }
`;


export const SubmitButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 16px; // Adjusted margin
`;

export const SubmitButton = styled.button`
  background-color: ${COLORS.primary};
  color: ${COLORS.white};
  font-size: 0.9rem;
  font-weight: 500;
  padding: 9px 20px;
  border: 1px solid transparent;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  min-width: 140px; // Slightly smaller
  text-align: center;

  &:hover { background-color: ${COLORS.primaryDarker}; }
  &:focus { outline: 0; box-shadow: 0 0 0 0.2rem ${COLORS.primaryLightFocus}; }
  &:disabled { background-color: ${COLORS.textMuted}; border-color: ${COLORS.textMuted}; cursor: not-allowed; opacity: 0.65; }
`;

export const ErrorMsg = styled.span`
  color: ${COLORS.danger};
  font-size: 0.75rem;
  margin-top: 2px; // Added small margin for spacing
`;

// Added Select and Textarea based on UserModal.tsx requirements, ensuring they use baseInputStyles
export const Select = styled.select`
  ${baseInputStyles}
`;

export const Textarea = styled.textarea`
  ${baseInputStyles}
  min-height: 80px; // Example starting height
`;
