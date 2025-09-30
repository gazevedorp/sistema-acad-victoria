
import styled from 'styled-components';
import { COLORS } from '../../../../styles/colors';

export const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

export const ModalContent = styled.div`
  background-color: ${COLORS.white};
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 80%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid ${COLORS.borderDefault};
  padding-bottom: 10px;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: ${COLORS.textBody};
  }
`;

export const ModalBody = styled.div`

  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

export const ControlsContainer = styled.div`
  display: flex;
  margin-bottom: 15px;
  gap: 10px;
  align-items: center;
`;

export const Input = styled.input`
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid ${COLORS.borderDefault};
  border-radius: 4px;

  flex-grow: 1;
`;

export const Select = styled.select`
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid ${COLORS.borderDefault};
  border-radius: 4px;
  background-color: ${COLORS.white};
`;

export const LoaderDiv = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
`;

export const CloseButton = styled.button`
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${COLORS.textMuted};

  &:hover {
    color: ${COLORS.textBody};
  }
`;
