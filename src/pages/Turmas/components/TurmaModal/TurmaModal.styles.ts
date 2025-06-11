import styled from "styled-components";
import { COLORS } from "../../../../styles/colors"; // Assuming global COLORS

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh; /* Changed from dvh for wider compatibility, though dvh is more precise */
  background-color: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  overflow-y: hidden; /* Ensure overlay itself doesn't scroll */
`;

export const ModalContainer = styled.div`
  background-color: ${COLORS.white};
  width: 700px;
  max-width: 95%;
  border-radius: 6px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  max-height: 90vh; /* Changed from dvh */
`;

export const ModalHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid ${COLORS.borderDefault};
  flex-shrink: 0; /* Prevent header from shrinking */
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
  line-height: 1;
  color: ${COLORS.textMuted};
  cursor: pointer;
  padding: 4px; /* Small padding for easier clicking */
  opacity: 0.8;
  &:hover {
    opacity: 1;
    color: ${COLORS.textBody};
  }
`;

export const ModalBody = styled.div`
  padding: 20px 24px;
  overflow-y: auto; /* Enable scrolling for modal body if content overflows */
  flex-grow: 1; /* Allow body to take available space */

  /* Basic scrollbar styling */
  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-thumb { background-color: ${COLORS.borderDefault}; border-radius: 4px; }
  &::-webkit-scrollbar-track { background-color: ${COLORS.backgroundLight}; }
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px; /* Spacing between form groups/rows */
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px; /* Space between label and input/error */
`;

// Using FormRow from ClientModal for consistency if multiple items per row are needed.
// If not, FormGroup can be used directly for single column layout.
export const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px 16px; /* Vertical and horizontal gap */
  align-items: start; /* Align items to the start of their grid cell */
`;

export const Label = styled.label`
  font-size: 0.875rem; /* Slightly larger for better readability */
  color: ${COLORS.textLabel};
  font-weight: 500;
  display: block;
`;

const baseInputStyles = `
  padding: 10px 12px; /* Slightly taller padding */
  font-size: 0.9rem;
  line-height: 1.5;
  color: ${COLORS.textBody};
  background-color: ${COLORS.white};
  background-clip: padding-box;
  border: 1px solid ${COLORS.borderDefault};
  border-radius: 4px; /* Consistent border radius */
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  width: 100%;
  box-sizing: border-box;

  &:focus {
    color: ${COLORS.textBody};
    background-color: ${COLORS.white};
    border-color: ${COLORS.primaryDarker}; /* Using primaryDarker for focus */
    outline: 0;
    box-shadow: 0 0 0 0.2rem ${COLORS.primaryLightFocus};
  }

  &::placeholder { color: ${COLORS.textMuted}; opacity: 1; }
  &:disabled, &[readOnly] {
    background-color: ${COLORS.backgroundDisabled};
    opacity: 0.7;
    cursor: not-allowed;
    border-color: ${COLORS.borderDefault}; /* Ensure border color on disabled */
  }
`;

export const Input = styled.input`
  ${baseInputStyles}
`;

export const Select = styled.select`
  ${baseInputStyles}
  appearance: none; /* Remove default system appearance */
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='${encodeURIComponent(String(COLORS.textMuted))}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.75rem center; /* Adjust icon position */
  background-size: 16px 12px; /* Adjust icon size */
  padding-right: 2.5rem; /* Make space for the arrow */
`;

export const Textarea = styled.textarea`
  ${baseInputStyles}
  resize: vertical; /* Allow vertical resize, disable horizontal */
  min-height: 80px; /* Default min height */
`;

export const ErrorMsg = styled.span`
  color: ${COLORS.danger};
  font-size: 0.8rem; /* Slightly larger error message */
  margin-top: 2px; /* Small space above error message */
`;

export const SubmitButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end; /* Typically submit is on the right */
  padding-top: 16px; /* Space above buttons */
  border-top: 1px solid ${COLORS.borderDefault}; /* Separator line */
  margin-top: 24px; /* Overall margin for the button area */
  flex-shrink: 0; /* Prevent button container from shrinking */
`;

export const SubmitButton = styled.button`
  background-color: ${COLORS.primary};
  color: ${COLORS.white};
  font-size: 0.95rem;
  font-weight: 500;
  padding: 10px 24px;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  min-width: 120px; /* Min width for the button */
  text-align: center;

  &:hover { background-color: ${COLORS.primaryDarker}; }
  &:focus { outline: 0; box-shadow: 0 0 0 0.2rem ${COLORS.primaryLightFocus}; }
  &:disabled {
    background-color: ${COLORS.backgroundDisabled};
    border-color: ${COLORS.borderDefault};
    color: ${COLORS.textMuted};
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

// Styles for Checkbox
export const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px; /* Space if it's part of a form group or stands alone */
`;

export const CheckboxInput = styled.input.attrs({ type: 'checkbox' })`
  width: 18px; /* Custom size */
  height: 18px;
  cursor: pointer;
  accent-color: ${COLORS.primary}; /* Modern way to color checkboxes */

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const CheckboxLabel = styled.label`
  font-size: 0.9rem;
  color: ${COLORS.textBody};
  cursor: pointer;
  user-select: none; /* Prevent text selection on click */
`;
