import React from "react";
import * as Styles from "./SummarySection.styles";
import Loader from "../../../../components/Loader/Loader";

interface SummarySectionProps {
  totalEntradasCaixaAberto: number;
  totalSaidasCaixaAberto: number;
  onSummaryLoading: boolean;
  totalStudents: number;
  filterLabel: string;
}

const SummarySection: React.FC<SummarySectionProps> = ({
  totalEntradasCaixaAberto,
  totalSaidasCaixaAberto,
  onSummaryLoading,
  totalStudents,
  filterLabel,
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
            <Styles.CardNumber>{totalStudents}</Styles.CardNumber>
            <Styles.CardLabel>
              {filterLabel}
            </Styles.CardLabel>
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
