import React from "react";
import * as Styles from "./Sidebar.styles";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiHome, // Ícone para Home
  FiUser, // Ícone para Alunos (representa um único usuário/estudante)
  FiClipboard, // Ícone para Turmas (representa listas/registros de classe)
  FiDollarSign, // Ícone para Planos (representa preços/financeiro)
  FiPackage, // Ícone para Produtos (representa itens/pacotes)
  FiUsers, // Ícone para Usuários (representa múltiplos usuários - staff/admins)
  FiBarChart2,
  FiLogOut // Ícone para Relatórios (representa gráficos/dados)
} from "react-icons/fi"; // Importando todos os ícones necessários do Feather Icons
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

  const menuItems = [
    { icon: <FiHome />, text: "Home", route: "/" },
    { icon: <FiUser />, text: "Alunos", route: "/clients" }, // "Clientes" mudado para "Alunos", ícone mantido
    { icon: <FiClipboard />, text: "Turmas", route: "/turmas" }, // Adicionado Turmas
    { icon: <FiDollarSign />, text: "Planos", route: "/planos" }, // Adicionado Planos
    { icon: <FiPackage />, text: "Produtos", route: "/products" }, // Adicionado Produtos
    { icon: <FiUsers />, text: "Usuarios", route: "/users" }, // Adicionado Usuários (gerais do sistema)
    { icon: <FiBarChart2 />, text: "Relatorios", route: "/relatorios" }, // Adicionado Relatórios
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
    }
  };

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
        onClick={handleLogout}
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
