import styled from "styled-components";
import { COLORS } from "../../../../styles/colors";

// Container for the section
export const SectionContainer = styled.div<{ border?: boolean }>`
  background-color: ${COLORS.white};
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem; // Standard margin, can be adjusted if it's the last section
  border-bottom: ${(props) => (props.border ? `1px solid ${COLORS.borderDefault}` : "none")};
`;

// Input style (can be shared from a global/common styles file if identical to StudentsSection)
export const Input = styled.input`
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid ${COLORS.borderDefault};
  border-radius: 6px;
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  width: 100%;
  background-color: ${COLORS.white};
  color: ${COLORS.textBody};

  &:focus {
    border-color: ${COLORS.primaryDarker}; // Example focus color
    outline: none;
    box-shadow: 0 0 0 3px ${COLORS.primaryLightFocus};
  }

  &[readOnly] {
    background-color: ${COLORS.backgroundDisabled};
    color: ${COLORS.textMuted};
    border-color: ${COLORS.borderDefault};
    &:focus {
      border-color: ${COLORS.primaryDarker};
      box-shadow: 0 0 0 3px ${COLORS.primaryLightFocus};
    }
  }

  &[type="number"]::-webkit-inner-spin-button,
  &[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

// CadastrarButton style (can be shared)
export const CadastrarButton = styled.button`
  color: ${COLORS.white};
  border: none;
  padding: 12px; // Consider consistent padding/sizing for buttons
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  align-self: flex-start; // This might vary based on layout
  background: #0d88cb; // Consider COLORS.primary or a specific button color
  &:hover {
    background: ${COLORS.primary};
  }
  &:disabled {
    background-color: ${COLORS.backgroundDisabled}; // Standard disabled style
    color: ${COLORS.textMuted};
    cursor: not-allowed;
  }
`;

// FecharCaixaButton style (specific to Cashier section)
export const FecharCaixaButton = styled.button`
  background-color: ${COLORS.danger};
  color: white;
  padding: 10px 15px; // Adjusted padding for consistency
  border: none;
  border-radius: 4px; // Consistent border-radius
  cursor: pointer;
  font-size: 0.9rem; // Consistent font size
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.15s ease-in-out;

  &:hover {
    background-color: #c82333; // Darker shade of danger
  }
  &:disabled {
    background-color: ${COLORS.backgroundDisabled};
    color: ${COLORS.textMuted};
    cursor: not-allowed;
  }
`;

// LoaderDiv style (can be shared)
export const LoaderDiv = styled.div`
  height: 160px; // Or make it more flexible, e.g., min-height
  display: flex;
  justify-content: center;
  align-items: center;
`;
