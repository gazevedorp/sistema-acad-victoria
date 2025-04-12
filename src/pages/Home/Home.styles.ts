import styled from "styled-components";

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

export const Card = styled.div`
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  max-width: 300px;
  width: 100%;
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  margin-right: 24px;

  @media (max-width: 768px) {
    margin-right: 0px;
    margin-top: 24px;
  }
`;

export const CardNumber = styled.span`
  font-size: 36px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
`;

export const CardLabel = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: #666;
`;

export const CardContainer = styled.div`
  display: flex;
  flex-direction: row;
  margin-bottom: 12px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

export const LoaderDiv = styled.div`
  height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
`;
