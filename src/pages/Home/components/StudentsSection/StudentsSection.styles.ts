import styled from "styled-components";
import { COLORS } from "../../../../styles/colors";

export const SectionContainer = styled.div<{ border?: boolean }>`
  background-color: ${COLORS.white};
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: ${(props) => (props.border ? `1px solid ${COLORS.borderDefault}` : "none")};
`;

export const SearchInput = styled.input`
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid ${COLORS.borderDefault};
  border-radius: 6px;
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  width: 100%;
  background-color: ${COLORS.white};
  color: ${COLORS.textBody};

  &:focus {
    border-color: ${COLORS.primaryDarker};
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


export const CadastrarButton = styled.button`
  color: ${COLORS.white};
  border: none;
  padding: 12px;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  padding-bottom: 10px;
  align-self: flex-start;
  background: #0d88cb;
  &:hover {
    background: ${COLORS.primary};
  }
`;


export const LoaderDiv = styled.div`
  height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
`;


export const FilterContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 8px;
  }
`;

export const FilterCard = styled.div<{ active: boolean }>`
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  border: 2px solid ${props => props.active ? '#0d88cb' : '#e2e8f0'};
  background-color: ${props => props.active ? '#0d88cb' : '#fff'};
  color: ${props => props.active ? '#fff' : '#4a5568'};
  
  &:hover {
    border-color: #0d88cb;
    background-color: ${props => props.active ? '#0898e6' : '#f7fafc'};
    color: ${props => props.active ? '#fff' : '#0d88cb'};
  }

  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 12px;
  }
`;
