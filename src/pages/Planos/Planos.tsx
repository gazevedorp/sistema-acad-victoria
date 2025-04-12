import React from "react";
import * as Styles from "./Planos.styles";

const Plans: React.FC = () => {
  return (
    <Styles.Container>
      <Styles.Header>
        <div>
          <Styles.Title>Planos</Styles.Title>
          <Styles.Subtitle>
            Cadastre e gerencie seus Planos
          </Styles.Subtitle>
        </div>
      </Styles.Header>
    </Styles.Container>
  );
};

export default Plans;
