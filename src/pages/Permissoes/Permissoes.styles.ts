import styled from "styled-components";

export const COLORS = {
  primary: "#0898e6",
  secondary: "#6c757d",
  success: "#28a745",
  danger: "#dc3545",
  warning: "#ffc107",
  info: "#17a2b8",
  light: "#f8f9fa",
  dark: "#343a40",
  white: "#ffffff",
  textPrimary: "#212529",
  textSecondary: "#6c757d",
  textMuted: "#6c757d",
  textBody: "#495057",
  borderDefault: "#dee2e6",
  backgroundLight: "#f8f9fa",
};

export const PageContainer = styled.div`
  padding: 24px;
  background-color: ${COLORS.white};
  min-height: 100vh;
`;

export const HeaderContainer = styled.div`
  margin-bottom: 32px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

export const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: ${COLORS.textPrimary};
  margin: 0 0 8px 0;
`;

export const Subtitle = styled.p`
  font-size: 1rem;
  color: ${COLORS.textMuted};
  margin: 0;
`;

export const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${COLORS.borderDefault};
  border-radius: 6px;
  font-size: 0.875rem;
  color: ${COLORS.textBody};
  background-color: ${COLORS.white};
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

  &:focus {
    outline: none;
    border-color: ${COLORS.primary};
    box-shadow: 0 0 0 0.2rem rgba(8, 152, 230, 0.25);
  }

  &::placeholder {
    color: ${COLORS.textMuted};
  }
`;

export const AddButton = styled.button`
  background-color: ${COLORS.primary};
  color: ${COLORS.white};
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
  display: flex;
  align-items: center;
  white-space: nowrap;

  &:hover {
    background-color: #0678c4;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 0.2rem rgba(8, 152, 230, 0.25);
  }
`;

export const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
`;

export const ErrorContainer = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${COLORS.danger};
  font-size: 1rem;
`;
