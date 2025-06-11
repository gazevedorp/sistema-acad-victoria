import styled from "styled-components";
import { COLORS } from "../../styles/colors";

export { COLORS }; // Re-export COLORS if it's intended to be used by other components directly from Home.styles

export const Container = styled.div`
  width: 100%;
  padding: 24px;
  background-color: #fff; /* Or COLORS.white if preferred */
`;

// Styles below are assumed to be unused by Home.tsx directly
// as section-specific components now handle their own layout and styling.

// export const Header = styled.div`
//   display: flex;
//   justify-content: space-between;
//   align-items: flex-start;
//   margin-bottom: 24px;

//   @media (max-width: 768px) {
//     flex-direction: column;
//     align-items: flex-start;
//     gap: 16px;
//   }
// `;

// export const Title = styled.h1`
//   font-size: 32px;
//   margin: 0 0 8px 0;
//   font-weight: 600;
// `;

// export const Subtitle = styled.p`
//   font-size: 14px;
//   color: #888; /* Consider COLORS.textMuted or similar */
//   margin: 0;
// `;

// CardContainer, Card, CardNumber, CardLabel were moved to SummarySection.styles.ts

// LoaderDiv was moved to individual section style files where needed.
// export const LoaderDiv = styled.div`
//   height: 160px;
//   display: flex;
//   justify-content: center;
//   align-items: center;
// `;

// Section and SectionTitle were used by Home.tsx to wrap sections,
// but child components now manage their own root styled component (e.g., SectionContainer).
// export const Section = styled.div<{ border?: boolean }>`
//   background-color: ${COLORS.white};
//   padding-bottom: 1.5rem;
//   margin-bottom: 1.5rem;
//   border-bottom: ${props => props.border ? `1px solid ${COLORS.borderDefault}` : "none"};
// `;

// export const SectionTitle = styled.h2`
//   font-size: 1.75rem;
//   font-weight: 600;
//   color: ${COLORS.textBody};
//   margin-bottom: 1rem;
//   border-bottom: 2px solid ${COLORS.primary};
//   padding-bottom: 0.5rem;
// `;

// Input, CadastrarButton, FecharCaixaButton were moved to specific section style files.
