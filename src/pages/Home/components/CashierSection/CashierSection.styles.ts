import styled from "styled-components";
import { COLORS } from "../../../../styles/colors";

// Container for the section
export const SectionContainer = styled.div<{ border?: boolean }>`
  background-color: ${COLORS.white};
  // padding-bottom: 1.5rem; /* Removed to avoid conflict with Home.tsx layout */
  // margin-bottom: 1.5rem; /* Removed to avoid conflict with Home.tsx layout */
  // border-bottom: ${(props) =>
    props.border
      ? `1px solid ${COLORS.borderDefault}`
      : "none"}; /* Removed to avoid conflict with Home.tsx layout */
  /* Styles for internal layout can remain or be added here if necessary,
     e.g., padding for content within this container if not handled by child elements.
     For now, ensuring it fits well within CashierActionsArea. */
  display: flex; /* Added to help manage internal layout, e.g., if ActionButtonsContainer needs specific alignment */
  flex-direction: column; /* Ensure children stack vertically */
  height: 100%; /* Attempt to fill CashierActionsArea, might need adjustment based on content */
  justify-content: center; /* Center buttons if they don't fill height, adjust as needed */
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
  background-color: ${COLORS.success}; // Using COLORS.primary as COLORS.info is not defined
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center; /* Center text if no icon */
  gap: 5px;
  transition: background-color 0.15s ease-in-out;

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

// ActionButtonsContainer style
export const ActionButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

// HistoryButton style
export const HistoryButton = styled.button`
  background-color: ${COLORS.primary}; // Using COLORS.primary as COLORS.info is not defined
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center; /* Center text if no icon */
  gap: 5px;
  transition: background-color 0.15s ease-in-out;

  &:hover {
    background-color: ${COLORS.primaryDarker}; // Using COLORS.primaryDarker as COLORS.infoDarker is not defined
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
