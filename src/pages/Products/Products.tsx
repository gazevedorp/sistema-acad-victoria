import React, { useEffect, useState } from "react";
import DefaultTable, { TableColumn } from "../../components/Table/DefaultTable";
import { supabase } from "../../lib/supabase.ts";
import { toast, ToastContainer } from "react-toastify";
import Loader from "../../components/Loader/Loader.tsx";
import * as Styles from "./Products.styles.ts";
import { Product } from "../../types/ProductType.ts";

const columns: TableColumn<Product>[] = [
  { field: "nome", header: "Nome" },
  { field: "valor", header: "Valor", formatter: "money" },
  { field: "ativo", header: "Status", formatter: "status" },
];

const Produtos: React.FC = () => {
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [onLoading, setLoading] = useState<boolean>(false);

  const [inputSearch, setInputSearch] = useState<string>("");

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .order("nome", { ascending: true });
      if (error) {
        toast.error("Erro ao buscar produtos.");
        throw error;
      }
      if (data) {
        setProdutos(data as Product[]);
      }
    } catch (err) {
      console.error("Erro ao buscar produtos:", err);
    } finally {
      setLoading(false);
    }
  };

  const adjustString = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const totalRows = produtos.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
  const currentData = produtos.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  return (
    <Styles.Container>
      <Styles.Header>
        <div>
          <Styles.Title>Produtos</Styles.Title>
          <Styles.Subtitle>Cadastre e gerencie os Produtos</Styles.Subtitle>
        </div>
      </Styles.Header>

      {onLoading ? (
        <Styles.LoaderDiv>
          <Loader color="#000" />
        </Styles.LoaderDiv>
      ) : (
        <>
          <div style={{ maxWidth: 400 }}>
            <Styles.Input
              value={inputSearch}
              onChange={(e) => setInputSearch(e.target.value)}
              placeholder="Pesquisar Produto"
            />
          </div>
          <DefaultTable
            data={currentData.filter((item) =>
              adjustString(item.nome)?.includes(adjustString(inputSearch))
            )}
            columns={columns}
            rowsPerPage={rowsPerPage}
            currentPage={currentPage}
            totalRows={totalRows}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </>
      )}
      <ToastContainer />
    </Styles.Container>
  );
};

export default Produtos;
