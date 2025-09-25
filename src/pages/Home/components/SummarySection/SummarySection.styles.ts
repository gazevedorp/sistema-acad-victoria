import styled from "styled-components";
import { COLORS } from "../../../../styles/colors";

export { COLORS }; // Re-export COLORS if it's intended to be used by the component directly

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
  height: 160px; // Assuming this is the desired height for the summary loader
  display: flex;
  justify-content: center;
  align-items: center;
`;
