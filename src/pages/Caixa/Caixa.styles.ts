import styled from 'styled-components';

const COLORS = {
  primary: '#0898e6',
  primaryDarker: '#0b5ed7',
  textBody: '#212529',
  textMuted: '#6c757d',
  borderDefault: '#dee2e6',
  white: '#fff',
  danger: '#dc3545',
}

export const Container = styled.div`
  width: 100%;
  padding: 24px;
  background-color: #fff;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
`;

export const Title = styled.h1`
  font-size: 32px;
  margin: 0 0 8px 0;
  font-weight: 600;
`;

export const Subtitle = styled.p`
  font-size: 14px;
  color: #888;
  margin: 0;
`;

export const LoaderDiv = styled.div`
  height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const Input = styled.input`
  padding: 0.625rem 0.75rem; // 10px 12px
  font-size: 0.875rem;
  border: 1px solid #cbd5e0; // Tailwind gray-400 border
  border-radius: 6px; // Slightly more rounded
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  width: 100%;
  background-color: #fff;
  color: #2d3748; // Tailwind gray-800

  &:focus {
    border-color: #8431dc;
    outline: none;
    box-shadow: 0 0 0 3px rgba(132, 49, 220, 0.25);
  }

  // Style readOnly inputs like disabled but allow focus/selection
  &[readOnly] {
    background-color: #f7fafc; // Tailwind gray-100
    color: #718096; // Tailwind gray-600
    // cursor: not-allowed; // Optional: remove if selection is desired
    border-color: #e2e8f0; // Tailwind gray-300
    &:focus {
      // Keep focus style distinct
      border-color: #8431dc;
      box-shadow: 0 0 0 3px rgba(132, 49, 220, 0.25);
    }
  }

  // Style number inputs - hide spinners on Chrome/Safari/Edge
  &[type="number"]::-webkit-inner-spin-button,
  &[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

export const CadastrarButton = styled.button`
  color: #fff;
  border: none;
  padding: 12px;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  padding-bottom: 10px;
  align-self: flex-start;
  background: #0d88cb;
  &:hover {
    background: #0898e6;
  }
`;

export const FecharCaixaButton = styled.button`
  background-color: ${COLORS.danger}; // Ou uma cor diferente para fechamento
  color: white;
  padding: 8px 15px; // Ajuste o padding conforme o CadastrarButton
  border: none;
  border-radius: 3px; // Consistente com outros botões
  cursor: pointer;
  font-size: 0.9rem; // Consistente
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.15s ease-in-out;

  &:hover {
    background-color: #c82333; // Tom mais escuro do danger
  }
  &:disabled {
    background-color: #adb5bd;
    cursor: not-allowed;
  }
`;