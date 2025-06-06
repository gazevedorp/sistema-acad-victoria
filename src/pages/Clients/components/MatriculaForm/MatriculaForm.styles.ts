import styled from "styled-components";

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
    success: '#198754',
    white: '#fff',
};

export const ModalContainer = styled.div`
  background-color: ${COLORS.white};
  width: 700px;
  max-width: 95%;
  border-radius: 6px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  max-height: 90dvh;
`;


export const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

export const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${COLORS.textBody};
  margin-top: 10px;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid ${COLORS.borderDefault};
  &:first-of-type {
    margin-top: 0;
  }
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
  flex-grow: 1;
`;

export const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px 16px;
  margin-bottom: 12px;
  align-items: start;
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
  color: ${COLORS.textBody};
  background-color: ${COLORS.white};
  background-clip: padding-box;
  border: 1px solid #ced4da;
  border-radius: 3px;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  width: 100%; 
  box-sizing: border-box;

  &:focus {
    color: ${COLORS.textBody};
    background-color: ${COLORS.white};
    border-color: ${COLORS.borderFocus}; 
    outline: 0;
    box-shadow: 0 0 0 0.2rem ${COLORS.primaryLightFocus};
  }

  &::placeholder { color: ${COLORS.textMuted}; opacity: 1; }
  &:disabled, &[readonly] { background-color: ${COLORS.backgroundDisabled}; opacity: 0.7; cursor: not-allowed; }
`;

export const Input = styled.input`
  ${baseInputStyles}
`;

export const Select = styled.select`
  ${baseInputStyles}
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='${encodeURIComponent(COLORS.textMuted)}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.6rem center;
  background-size: 14px 10px;
  padding-right: 2.2rem; 
`;

export const Textarea = styled.textarea`
  ${baseInputStyles}
  min-height: 70px;
  resize: vertical; 
`;

export const DisplayField = styled.div`
  padding: 8px 0;
  font-size: 0.875rem;
  color: ${COLORS.textBody};
  min-height: 34px;
  display: flex;
  align-items: center;
  word-break: break-word;
  line-height: 1.4;
`;

export const SubmitButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 20px; 
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
  min-width: 150px;
  text-align: center;

  &:hover { background-color: ${COLORS.primaryDarker}; }
  &:focus { outline: 0; box-shadow: 0 0 0 0.2rem ${COLORS.primaryLightFocus}; }
  &:disabled { background-color: ${COLORS.textMuted}; border-color: ${COLORS.textMuted}; cursor: not-allowed; opacity: 0.65; }
`;

export const ErrorMsg = styled.span`
  color: ${COLORS.danger};
  font-size: 0.75rem;
  margin-top: 2px;
`;

export const ActionButtonSmall = styled.button`
  background-color: #6c757d;
  color: white;
  padding: 6px 12px;
  font-size: 0.8rem;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  &:hover {
    background-color: #5a6268;
  }
  &:disabled {
    background-color: #adb5bd;
    cursor: not-allowed;
  }
`;

export const MatriculaItemsList = styled.ul`
  list-style: none;
  padding: 0;
  margin-top: 10px;
  margin-bottom: 15px;
`;

export const MatriculaItemCard = styled.li`
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 10px 15px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;

  div {
    line-height: 1.4;
  }
`;

export const RemoveItemButton = styled.button`
  color: #dc3545;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: bold;
  font-size: 1.1rem;
  padding: 5px;
  margin-left: 10px;

  &:hover {
    color: #c82333;
  }
`;