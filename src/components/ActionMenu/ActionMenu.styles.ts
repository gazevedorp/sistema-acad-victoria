// ActionMenu.styles.ts

import styled from "styled-components";

export const Container = styled.div`
  position: relative; /* Importante para que o Popup seja posicionado relativo a este container */
  display: inline-block;
`;

export const MenuButton = styled.div`
  display: flex;
  cursor: pointer;
  font-size: 1rem;
`;

export const Popup = styled.div`
  position: absolute;
  top: 100%;
  right: 1rem;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  z-index: 999999; /* bem alto */
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0;
  min-width: 140px;
`;


export const MenuItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;

  &:hover {
    background: #f5f5f5;
  }
`;

export const MenuItemDelete = styled(MenuItem)`
  color: red;

  &:hover {
    background: #ffe5e5;
  }
`;
