import React, { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar/Sidebar";
import * as Styles from "./Dashboard.styles";

const Dashboard: React.FC = () => {
  const [minimized, setMinimized] = useState<boolean>(true);

  const toggleSidebar = () => {
    setMinimized((prev) => !prev);
  };

  return (
    <Styles.DashboardContainer>
      <Sidebar minimized={minimized} onToggle={toggleSidebar} />
      <Styles.MainContent>
        <Outlet />
      </Styles.MainContent>
    </Styles.DashboardContainer>
  );
};

export default Dashboard;
