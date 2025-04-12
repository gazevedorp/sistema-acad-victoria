import React from "react";
import * as Styles from "./Users.styles";

const Users: React.FC = () => {
  return (
    <Styles.Container>
      <Styles.Header>
        <div>
          <Styles.Title>Usuários</Styles.Title>
          <Styles.Subtitle>
            Cadastre e gerencie os Usuários do seu Sistema
          </Styles.Subtitle>
        </div>
      </Styles.Header>
    </Styles.Container>
  );
};

export default Users;
