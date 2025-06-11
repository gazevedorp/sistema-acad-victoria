import styled from "styled-components";
import { COLORS } from "../../../../styles/colors"; // Assuming COLORS is used by these styles

// Container for the section
export const SectionContainer = styled.div<{ border?: boolean }>`
  background-color: ${COLORS.white};
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: ${(props) => (props.border ? `1px solid ${COLORS.borderDefault}` : "none")};
  /* If this section needs a top border or other specific layout, add here */
`;

// Input style (copied from Home.styles.ts)
export const Input = styled.input`
  padding: 0.625rem 0.75rem; // 10px 12px
  font-size: 0.875rem;
  border: 1px solid ${COLORS.borderDefault}; // Adjusted to use COLORS
  border-radius: 6px; // Slightly more rounded
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  width: 100%;
  background-color: ${COLORS.white};
  color: ${COLORS.textBody}; // Adjusted to use COLORS

  &:focus {
    border-color: ${COLORS.primaryDarker}; // Adjusted to use COLORS (example, pick appropriate focus color)
    outline: none;
    box-shadow: 0 0 0 3px ${COLORS.primaryLightFocus}; // Adjusted to use COLORS
  }

  &[readOnly] {
    background-color: ${COLORS.backgroundDisabled}; // Adjusted to use COLORS
    color: ${COLORS.textMuted}; // Adjusted to use COLORS
    border-color: ${COLORS.borderDefault}; // Adjusted to use COLORS
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

// CadastrarButton style (copied from Home.styles.ts)
export const CadastrarButton = styled.button`
  color: ${COLORS.white};
  border: none;
  padding: 12px;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  padding-bottom: 10px; /* Note: This specific padding might be better handled by adjusting height or line-height */
  align-self: flex-start;
  background: #0d88cb; /* Consider making this a COLORS.primary or similar */
  &:hover {
    background: ${COLORS.primary}; /* Match with COLORS.primary */
  }
`;

// LoaderDiv style (copied from Home.styles.ts)
export const LoaderDiv = styled.div`
  height: 160px; // Or a more dynamic height based on content
  display: flex;
  justify-content: center;
  align-items: center;
`;
