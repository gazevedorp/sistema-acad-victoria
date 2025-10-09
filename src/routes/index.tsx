import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../layouts/Dashboard";
import Home from "../pages/Home/Home";
import { useAuthStore } from "../store/authStore";
import Login from "../pages/Login/Login";
import Products from "../pages/Products/Products";
// import Caixa from "../pages/Caixa/Caixa";
// import FormasPagamento from "../pages/FormasPagamento/FormasPagamento";
// import Permissoes from "../pages/Permissoes/Permissoes";
// import ManageCaixas from "../pages/ManageCaixas/ManageCaixas";
// import FechamentoCaixaTemplatePage from "../pages/FechamentoCaixaTemplate/FechamentoCaixaTemplate";
// import Turmas from "../pages/Turmas/Turmas";
// import Relatorios from "../pages/Relatorios/Relatorios";
import Plans from "../pages/Planos/Planos";
// import Modalidades from "../pages/Modalidades/Modalidades";
// import Users from "../pages/Users/Users";

const AppRoutes: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" /> : <Login />}
        />
        <Route
          path="/"
          element={
            isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
          }
        >
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          {/* <Route path="turmas" element={<Turmas />} />
          <Route path="relatorios" element={<Relatorios />} /> */}
          <Route path="planos" element={<Plans />} />
          {/* <Route path="modalidades" element={<Modalidades />} />
          <Route path="users" element={<Users />} />
          <Route path="caixa" element={<Caixa />} />
          <Route path="formas-pagamento" element={<FormasPagamento />} />
          <Route path="permissoes" element={<Permissoes />} />
          <Route path="manage-caixas" element={<ManageCaixas />} />
          <Route path="fechamento-template" element={<FechamentoCaixaTemplatePage />} /> */}
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
