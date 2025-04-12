import styled from "styled-components";

export const SidebarContainer = styled.nav<{ minimized: boolean }>`
  width: ${({ minimized }) => (minimized ? "60px" : "180px")};
  background-color: rgb(0, 0, 0);
  color: white;
  transition: width 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  justify-content: space-between;
  position: relative;
`;

export const SidebarHeader = styled.div<{ minimized: boolean }>`
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  background-color: rgb(0, 0, 0);
  min-height: 60px;
  box-sizing: border-box;
  justify-content: ${({ minimized }) => (minimized ? "center" : "flex-start")};
`;

export const Logo = styled.img<{ minimized?: boolean }>`
  width: ${({ minimized }) => (minimized ? "40px" : "170px")};
  transition: ${({ minimized }) => (minimized ? "" : "all 0.8s")};
  margin-left: ${({ minimized }) => (minimized ? "0px" : "-12px")};
`;

export const MenuList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
`;

export const SidebarMenuItem = styled.li<{
  minimized: boolean;
  active?: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: ${({ minimized }) => (minimized ? "center" : "left")};
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  background-color: ${({ active }) => (active ? "#0d88cb" : "transparent")};

  &:hover {
    background-color: #0898e6;
  }
`;

export const IconWrapper = styled.span<{ minimized: boolean }>`
  font-size: 1.2rem;
  margin-right: ${({ minimized }) => (minimized ? "0px" : "8px")};
  transition: margin-right 0.3s;
`;

export const MenuText = styled.span`
  font-size: 14px;
`;
