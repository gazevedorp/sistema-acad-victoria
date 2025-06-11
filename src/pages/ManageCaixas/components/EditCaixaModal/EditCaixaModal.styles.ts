import styled from 'styled-components';
import { COLORS } from '../../../../styles/colors'; // Adjust path as necessary

export const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6); // Slightly darker backdrop
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050; // Ensure it's above other content like ToastContainer
`;

export const ModalContent = styled.div`
  background-color: ${COLORS.white};
  padding: 25px; // Slightly more padding
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2); // Enhanced shadow
  width: 90%;
  max-width: 500px; // More constrained width for a form modal
  max-height: 90vh;
  display: flex;
  flex-direction: column;
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px; // More space
  padding-bottom: 15px; // More padding
  border-bottom: 1px solid ${COLORS.borderDefault};

  h2 {
    margin: 0;
    font-size: 1.4rem; // Larger title
    color: ${COLORS.textHeadline}; // Use headline color
  }
`;

export const CloseButton = styled.button`
  background: transparent;
  border: none;
  font-size: 1.75rem; // Larger close button
  font-weight: bold;
  cursor: pointer;
  color: ${COLORS.textMuted};
  padding: 0 5px;

  &:hover {
    color: ${COLORS.textBody};
  }
`;

export const ModalBody = styled.div`
  flex-grow: 1;
  overflow-y: auto; // In case of many form fields
  margin-bottom: 20px;
`;

export const FormControl = styled.div`
  margin-bottom: 15px;

  label {
    display: block;
    margin-bottom: 8px; // Space between label and input
    font-weight: 500;
    font-size: 0.9rem;
    color: ${COLORS.textBody};
  }

  textarea,
  select {
    width: 100%;
    padding: 10px;
    border: 1px solid ${COLORS.borderDefault};
    border-radius: 4px;
    font-size: 1rem;
    background-color: ${COLORS.background}; // Light background for inputs
    color: ${COLORS.textBody};

    &:focus {
      border-color: ${COLORS.primary};
      outline: none;
      box-shadow: 0 0 0 2px ${COLORS.primaryAlpha}; // Focus ring
    }

    &:disabled {
      background-color: ${COLORS.borderDefault}; // Disabled state
      cursor: not-allowed;
    }
  }

  textarea {
    resize: vertical; // Allow vertical resize
    min-height: 80px;
  }
`;

export const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 15px;
  border-top: 1px solid ${COLORS.borderDefault};
`;

interface ButtonProps {
  variant?: 'primary' | 'secondary';
}

export const Button = styled.button<ButtonProps>`
  padding: 10px 20px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

  ${({ variant = 'secondary' }) => `
    background-color: ${variant === 'primary' ? COLORS.primary : COLORS.secondaryBackground};
    color: ${variant === 'primary' ? COLORS.white : COLORS.textBody};
    border: 1px solid ${variant === 'primary' ? COLORS.primary : COLORS.borderDefault};

    &:hover:not(:disabled) {
      background-color: ${variant === 'primary' ? COLORS.primaryHover : COLORS.secondaryBackgroundHover};
      border-color: ${variant === 'primary' ? COLORS.primaryHover : COLORS.borderDefaultHover};
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
