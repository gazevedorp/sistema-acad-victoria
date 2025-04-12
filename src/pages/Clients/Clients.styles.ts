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

export const CadastrarButton = styled.button`
  color: #fff;
  border: none;
  padding: 12px;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  padding-bottom: 10px;
  align-self: flex-start;
  background: #0D88CB;
  &:hover {
    background: #0898e6;
  }
`;

export const ActionIconsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
`;

export const ActionLabel = styled.span`
  margin-right: 8px;
  font-size: 14px;
  color: #666;
`;

export const LoaderDiv = styled.div`
  height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
`;
