import React, { useMemo, useCallback } from "react";
import * as Styles from "./Sidebar.styles";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiHome,
  FiPackage,
  FiLogOut,
  FiTable,
  FiFile,
  FiSettings,
  FiShield,
  FiLayout,
} from "react-icons/fi";
import { FaUserFriends } from "react-icons/fa";
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
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const isMobile = useIsMobile();
  const location = useLocation();

  const effectiveMinimized = isMobile ? true : minimized;

  const menuItems = useMemo(() => {
    const items = [];

    // Home - sempre visível se tiver acesso
    if (hasPermission('home', 'visualizar')) {
      items.push({ icon: <FiHome />, text: "Home", route: "/" });
    }

    // Turmas
    if (hasPermission('turmas', 'visualizar')) {
      items.push({ icon: <FiTable />, text: "Turmas", route: "/turmas" });
    }

    // Modalidades
    if (hasPermission('modalidades', 'visualizar')) {
      items.push({ icon: <FiSettings />, text: "Modalidades", route: "/modalidades" });
    }

    // Planos
    if (hasPermission('planos', 'visualizar')) {
      items.push({ icon: <FiFile />, text: "Planos", route: "/planos" });
    }

    // Produtos
    if (hasPermission('produtos', 'visualizar')) {
      items.push({ icon: <FiPackage />, text: "Produtos", route: "/products" });
    }

    // Usuários
    if (hasPermission('usuarios', 'visualizar')) {
      items.push({ icon: <FaUserFriends />, text: "Usuários", route: "/users" });
    }

    // Permissões
    if (hasPermission('permissoes', 'visualizar')) {
      items.push({ icon: <FiShield />, text: "Permissões", route: "/permissoes" });
    }

    // Templates de Fechamento
    if (hasPermission('templates_fechamento', 'visualizar')) {
      items.push({ icon: <FiLayout />, text: "Templates", route: "/templates-fechamento" });
    }

    return items;
  }, [hasPermission]);

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
