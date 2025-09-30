import React, { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Styles from "./Home.styles";
import { TopContentContainer, SummaryArea, CashierActionsArea } from "./Home.styles";
import { supabase } from "../../lib/supabase";
import { useHomeSummary } from "./hooks/useHomeSummary";
import SummarySection from "./components/SummarySection/SummarySection";
import StudentsSection from "./components/StudentsSection/StudentsSection";
import CashierSection from "./components/CashierSection/CashierSection";
import { useStudentsStore } from "../../store/studentsStore";

const Home: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { totalStudents, getFilterLabel } = useStudentsStore();
  const {
    onSummaryLoading,
    totalEntradasCaixaAberto,
    totalSaidasCaixaAberto,
    handleActiveCaixaUpdate,
    handleRequestSummaryRefresh,
  } = useHomeSummary(currentUser);

  useEffect(() => {
    const loadInitialUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    loadInitialUser();
  }, []);


  return (
    <Styles.Container>
      <TopContentContainer>
        <SummaryArea>
          <SummarySection
            totalEntradasCaixaAberto={totalEntradasCaixaAberto}
            totalSaidasCaixaAberto={totalSaidasCaixaAberto}
            onSummaryLoading={onSummaryLoading}
            totalStudents={totalStudents}
            filterLabel={getFilterLabel()}
          />
        </SummaryArea>
        <CashierActionsArea>
          <CashierSection
            currentUser={currentUser}
            onActiveCaixaUpdate={handleActiveCaixaUpdate}
            onRequestSummaryRefresh={handleRequestSummaryRefresh}
          />
        </CashierActionsArea>
      </TopContentContainer>

      <StudentsSection />

      <ToastContainer autoClose={3000} hideProgressBar/>
    </Styles.Container>
  );
};
export default Home;
