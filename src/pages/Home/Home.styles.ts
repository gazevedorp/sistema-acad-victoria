import styled from "styled-components";

export const COLORS = {
  primary: "#0898e6",
  primaryDarker: "#0b5ed7",
  primaryLightFocus: "rgba(13, 110, 253, 0.25)",
  textBody: "#212529",
  textMuted: "#6c757d",
  textLabel: "#495057",
  borderDefault: "#dee2e6",
  borderFocus: "#86b7fe",
  backgroundDisabled: "#e9ecef",
  backgroundLight: "#f8f9fa",
  danger: "#dc3545",
  success: "#28a745",
  white: "#fff",
};

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

export const CardContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap; // Allow cards to wrap to the next line
  gap: 1.5rem; // Spacing between cards (24px)
  margin-bottom: 2rem; // INCREASED Space below the cards (32px)
`;

export const Card = styled.div`
  background-color: #ffffff; // Clean white background
  border-radius: 8px; // Keep border radius
  border: 1px solid #e5e7eb; // Subtle border (Tailwind gray-200)
  padding: 1.5rem; // Keep padding (24px)
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07),
    0 2px 4px -2px rgba(0, 0, 0, 0.07);
  flex: 1 1 200px; // Grow, shrink, with a base width suggestion
  min-width: 200px; // Prevent cards from becoming too narrow
  display: flex;
  flex-direction: column;
  justify-content: flex-start; // Align content to the top
  align-items: flex-start; // Left-align content within the card
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out; // Smooth transition

  &:hover {
    transform: translateY(-4px); // Subtle lift effect
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08),
      0 4px 6px -4px rgba(0, 0, 0, 0.08);
  }
`;

export const CardNumber = styled.span`
  font-size: 1.8rem; // 32px - Slightly reduced size for balance
  font-weight: 700; // Keep bold
  color: #1f2937; // Tailwind gray-800
  margin-bottom: 0.375rem; // 6px spacing below number
  line-height: 1.2; // Adjust line height for large font
  word-break: break-all; // Break long currency values if needed
`;

export const CardLabel = styled.span`
  font-size: 0.875rem; // 14px - Slightly smaller label
  font-weight: 500; // Keep medium weight
  color: #6b7280; // Tailwind gray-500
  line-height: 1.4; // Improve readability for multi-line labels
  text-align: left; // Ensure text is left-aligned
`;

export const LoaderDiv = styled.div`
  height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

// New styles for sections
export const Section = styled.div`
  margin-top: 2rem; // Add some space above the section
  margin-bottom: 2rem; // Add some space below the section
  padding: 1.5rem; // Add some padding inside the section
  background-color: ${COLORS.white}; // White background for the section
  border-radius: 8px; // Rounded corners
  border: 1px solid ${COLORS.borderDefault}; // Default border
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07),
    0 2px 4px -2px rgba(0, 0, 0, 0.07); // Subtle shadow
`;

export const SectionTitle = styled.h2`
  font-size: 1.75rem; // Larger font size for section titles (e.g., 28px)
  font-weight: 600; // Semi-bold
  color: ${COLORS.textBody}; // Main text color
  margin-bottom: 1rem; // Space below the title (16px)
  border-bottom: 2px solid ${COLORS.primary}; // Accent border below title
  padding-bottom: 0.5rem; // Padding below title text before border
`;

// Styles copied from Clients.styles.ts for Student Management
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

// Styles copied from Caixa.styles.ts for Cashier Operations
export const FecharCaixaButton = styled.button`
  background-color: ${COLORS.danger}; // Ou uma cor diferente para fechamento
  color: white;
  padding: 8px 15px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.9rem;
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
