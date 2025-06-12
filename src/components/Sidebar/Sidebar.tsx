import React, { useMemo, useCallback } from "react";
import * as Styles from "./Sidebar.styles";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiHome,
  FiPackage,
  // FiUsers,
  // FiBarChart2,
  FiLogOut,
  FiTable,
  FiFile,
  FiArchive,
} from "react-icons/fi";
import { FaUserFriends } from 'react-icons/fa';
import { useAuthStore } from "../../store/authStore";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
};

interface SidebarProps {
  minimized: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ minimized, onToggle }) => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const isMobile = useIsMobile();
  const location = useLocation();

  const effectiveMinimized = isMobile ? true : minimized;

  const menuItems = useMemo(() => [
    { icon: <FiHome />, text: "Home", route: "/" },
    { icon: <FiTable />, text: "Turmas", route: "/turmas" },
    { icon: <FiFile />, text: "Planos", route: "/planos" },
    { icon: <FiPackage />, text: "Produtos", route: "/products" },
    { icon: <FaUserFriends />, text: "Usuários", route: "/users" }, // Added Users link
    { icon: <FiArchive />, text: "Caixas", route: "/caixas" }, // Added new menu item
    // { icon: <FiBarChart2 />, text: "Relatorios", route: "/relatorios" },
  ], []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
    }
  }, [logout, navigate]);

  return (
    <Styles.SidebarContainer minimized={effectiveMinimized}>
      <Styles.SidebarHeader
        minimized={effectiveMinimized}
        onClick={!isMobile ? onToggle : undefined}
      >
        {effectiveMinimized ? (
          <Styles.Logo minimized src="/logo.png" alt="Logo" />
        ) : (
          <Styles.Logo src="/logo.png" alt="Logo" />
        )}
      </Styles.SidebarHeader>

      <Styles.MenuList>
        {menuItems.map((item, index) => (
          <Styles.SidebarMenuItem
            key={index}
            minimized={effectiveMinimized}
            onClick={() => navigate(item.route)}
            active={item.route === location.pathname}
          >
            <Styles.IconWrapper minimized={effectiveMinimized}>
              {item.icon}
            </Styles.IconWrapper>
            {!effectiveMinimized && (
              <Styles.MenuText>{item.text}</Styles.MenuText>
            )}
          </Styles.SidebarMenuItem>
        ))}
      </Styles.MenuList>

      <Styles.SidebarMenuItem
        minimized={effectiveMinimized}
        onClick={() => {
            if (window.confirm("Tem certeza que deseja sair?")) {
                handleLogout();
            }
        }}
      >
        <Styles.IconWrapper minimized={effectiveMinimized}>
          <FiLogOut />
        </Styles.IconWrapper>
        {!effectiveMinimized && <Styles.MenuText>Sair</Styles.MenuText>}
      </Styles.SidebarMenuItem>
    </Styles.SidebarContainer>
  );
};

export default Sidebar;