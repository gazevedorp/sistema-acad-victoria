import React, { useEffect, useMemo, useCallback } from "react";
import * as Styles from "./Sidebar.styles";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUser,
  FiPackage,
  FiBarChart2,
  FiLogOut,
  FiTable,
  FiFile,
  FiBox,
  FiList,
  FiCreditCard,
  FiShield,
  FiSettings,
  FiArchive,
} from "react-icons/fi";
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
    { icon: <FiHome />, text: "Home [F1]", route: "/" },
    // { icon: <FiBox />, text: "Caixa [F3]", route: "/caixa" },
    // { icon: <FiTable />, text: "Turmas [F4]", route: "/turmas" },
    { icon: <FiFile />, text: "Planos [F5]", route: "/planos" },
    // { icon: <FiPackage />, text: "Produtos [F6]", route: "/products" },
    // { icon: <FiList />, text: "Modalidades [F7]", route: "/modalidades" },
    // { icon: <FiUser />, text: "Usuários [F8]", route: "/users" },
    // { icon: <FiBarChart2 />, text: "Relatórios [F9]", route: "/relatorios" },
    // { icon: <FiCreditCard />, text: "Formas Pagamento [F10]", route: "/formas-pagamento" },
    // { icon: <FiShield />, text: "Permissões [F11]", route: "/permissoes" },
    // { icon: <FiArchive />, text: "Gerenciar Caixas", route: "/manage-caixas" },
    // { icon: <FiSettings />, text: "Templates Fechamento", route: "/fechamento-template" },
  ], []);

  const keyRouteMap = useMemo(() => {
    const map: { [key: string]: string } = {};
    menuItems.forEach(item => {
      const match = item.text.match(/\[(F\d+)\]/);
      if (match && match[1]) {
        map[match[1]] = item.route;
      }
    });
    return map;
  }, [menuItems]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
    }
  }, [logout, navigate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const route = keyRouteMap[event.key];

      if (route) {
        event.preventDefault();
        navigate(route);
      } else if (event.key === 'F12') {
        event.preventDefault();
        if (window.confirm("Tem certeza que deseja sair?")) {
          handleLogout();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate, keyRouteMap, handleLogout]);

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
        {!effectiveMinimized && <Styles.MenuText>Sair [F12]</Styles.MenuText>}
      </Styles.SidebarMenuItem>
    </Styles.SidebarContainer>
  );
};

export default Sidebar;