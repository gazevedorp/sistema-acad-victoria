import React from "react";
import * as Styles from "./Turmas.styles";

const Turmas: React.FC = () => {
  return (
    <Styles.Container>
      <Styles.Header>
        <div>
          <Styles.Title>Turmas</Styles.Title>
          <Styles.Subtitle>
            Cadastre e gerencie as Turmas de Alunos
          </Styles.Subtitle>
        </div>
      </Styles.Header>
    </Styles.Container>
  );
};

export default Turmas;
