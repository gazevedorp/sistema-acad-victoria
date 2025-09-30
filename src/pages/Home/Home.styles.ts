import styled from "styled-components";
import { COLORS } from "../../styles/colors";

export { COLORS };

export const Container = styled.div`
  width: 100%;
  padding: 24px;
  background-color: ${COLORS.white};
`;

export const TopContentContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 24px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

export const SummaryArea = styled.div`
  flex: 3;
`;

export const CashierActionsArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  
  & > div {
    height: 100%;
  }
`;
