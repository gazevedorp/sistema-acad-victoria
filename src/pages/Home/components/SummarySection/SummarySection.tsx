import React from "react";
import * as Styles from "./SummarySection.styles";
import Loader from "../../../../components/Loader/Loader"; // Assuming Loader is in a shared components folder

// --- TYPE DEFINITIONS ---

interface SummarySectionProps {
  clientsActiveSummary: { id: string; ativo: boolean }[]; // Simplified based on usage
  totalEntradasCaixaAberto: number;
  totalSaidasCaixaAberto: number;
  onSummaryLoading: boolean;
}

const SummarySection: React.FC<SummarySectionProps> = ({
  clientsActiveSummary,
  totalEntradasCaixaAberto,
  totalSaidasCaixaAberto,
  onSummaryLoading,
}) => {
  return (
    <>
      {onSummaryLoading ? (
        <Styles.LoaderDiv>
          <Loader color="#000" />
        </Styles.LoaderDiv>
      ) : (
        <Styles.CardContainer>
          <Styles.Card>
            <Styles.CardNumber>{clientsActiveSummary.length}</Styles.CardNumber>
            <Styles.CardLabel>Aluno(s) Ativo(s)</Styles.CardLabel>
          </Styles.Card>
          <Styles.Card>
            <Styles.CardNumber style={{ color: Styles.COLORS.success }}>
              {totalEntradasCaixaAberto.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </Styles.CardNumber>
            <Styles.CardLabel>Entradas (Caixa Aberto)</Styles.CardLabel>
          </Styles.Card>
          <Styles.Card>
            <Styles.CardNumber style={{ color: Styles.COLORS.danger }}>
              {totalSaidasCaixaAberto.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </Styles.CardNumber>
            <Styles.CardLabel>Saídas (Caixa Aberto)</Styles.CardLabel>
          </Styles.Card>
        </Styles.CardContainer>
      )}
    </>
  );
};

export default SummarySection;
