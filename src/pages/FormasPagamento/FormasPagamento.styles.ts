// src/pages/FormasPagamento/FormasPagamento.styles.ts
import styled from "styled-components";
import { COLORS } from "../../styles/colors";

export const Container = styled.div`
  padding: 20px;
  background-color: ${COLORS.white};
  min-height: 100vh;
`;

export const Header = styled.div`
  margin-bottom: 20px;
`;

export const Title = styled.h1`
  color: ${COLORS.textBody};
  font-size: 24px;
  font-weight: 600;
  margin: 0;
`;

export const ActionsSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
`;

export const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 500px;
`;

export const SearchInput = styled.input`
  flex: 1;
  padding: 10px 15px;
  border: 1px solid ${COLORS.borderDefault};
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${COLORS.primary};
  }

  &::placeholder {
    color: ${COLORS.textMuted};
  }
`;

export const CadastrarButton = styled.button`
  background-color: ${COLORS.primary};
  color: ${COLORS.white};
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;

  &:hover {
    background-color: ${COLORS.primaryDarker};
  }

  &:disabled {
    background-color: ${COLORS.backgroundDisabled};
    cursor: not-allowed;
  }
`;

export const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: ${COLORS.textMuted};
  font-size: 16px;
`;

export const StatusBadge = styled.span<{ ativo: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => props.ativo ? '#d4edda' : '#f8d7da'};
  color: ${props => props.ativo ? '#155724' : '#721c24'};
`;
