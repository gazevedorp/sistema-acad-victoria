import React from "react";
import * as Styles from "./Relatorios.styles";

const Relatorios: React.FC = () => {
  return (
    <Styles.Container>
      <Styles.Header>
        <div>
          <Styles.Title>Relatórios</Styles.Title>
          <Styles.Subtitle>
            Visualize Relatórios do seu Sistema
          </Styles.Subtitle>
        </div>
      </Styles.Header>
    </Styles.Container>
  );
};

export default Relatorios;
