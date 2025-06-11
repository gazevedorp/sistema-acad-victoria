import styled from 'styled-components';
import { COLORS } from '../../styles/colors';

export { COLORS }; // Re-export for use in Planos.tsx if needed

export const PageContainer = styled.div`
  width: 100%;
  padding: 24px;
  background-color: ${COLORS.backgroundLight};
  min-height: 100vh;
`;

export const HeaderContainer = styled.div`
  padding: 12px 20px;
  background-color: ${COLORS.white};
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

export const Title = styled.h1`
  font-size: 1.75rem;
  margin: 0;
  font-weight: 600;
  color: ${COLORS.textBody};
`;

export const Subtitle = styled.p`
  font-size: 0.9rem;
  color: ${COLORS.textMuted};
  margin: 4px 0 0 0;
`;

export const AddButton = styled.button`
  background-color: ${COLORS.primary};
  color: ${COLORS.white};
  font-size: 0.9rem;
  font-weight: 500;
  padding: 10px 18px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: ${COLORS.primaryDarker};
  }

  &:disabled {
    background-color: ${COLORS.backgroundDisabled};
    color: ${COLORS.textMuted};
    cursor: not-allowed;
  }
`;

export const SearchInputContainer = styled.div`
  margin-bottom: 20px;
  background-color: ${COLORS.white};
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.03);
`;

export const SearchInput = styled.input`
  padding: 10px 14px;
  font-size: 0.9rem;
  border: 1px solid ${COLORS.borderDefault};
  border-radius: 6px;
  width: 100%;
  max-width: 400px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    border-color: ${COLORS.primary};
    box-shadow: 0 0 0 0.2rem ${COLORS.primaryLightFocus};
    outline: none;
  }
`;

export const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  min-height: 200px;
`;

export const ErrorContainer = styled.div`
  text-align: center;
  padding: 40px;
  color: ${COLORS.danger};
  font-size: 1rem;
  background-color: ${COLORS.white};
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.03);
`;

export const ActionButton = styled.button<{variant?: 'primary' | 'secondary' | 'danger'}>`
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: ${({variant}) =>
    variant === 'danger' ? COLORS.danger :
    (variant === 'secondary' ? COLORS.textMuted : COLORS.primary)
  };

  &:hover {
    opacity: 0.7;
    color: ${({variant}) =>
      variant === 'danger' ? COLORS.danger :
      (variant === 'secondary' ? COLORS.textMuted : COLORS.primaryDarker)
    };
  }
`;
