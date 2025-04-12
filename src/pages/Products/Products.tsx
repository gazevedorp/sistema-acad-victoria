import React from "react";
import * as Styles from "./Products.styles";

const Products: React.FC = () => {
  return (
    <Styles.Container>
      <Styles.Header>
        <div>
          <Styles.Title>Produtos</Styles.Title>
          <Styles.Subtitle>
            Cadastre e gerencie seus Produtos
          </Styles.Subtitle>
        </div>
      </Styles.Header>
    </Styles.Container>
  );
};

export default Products;
