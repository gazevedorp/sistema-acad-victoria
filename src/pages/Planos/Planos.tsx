import React, { useEffect, useState } from "react";
import DefaultTable, { TableColumn } from "../../components/Table/DefaultTable";
import { supabase } from "../../lib/supabase.ts";
import { Turma } from "../../types/TurmaTypes.ts";
import { toast, ToastContainer } from "react-toastify";
import Loader from "../../components/Loader/Loader.tsx";
import * as Styles from "./Planos.styles";
import { Plano } from "../../types/PlanoTypes.ts";

const columns: TableColumn<Turma>[] = [
  { field: "nome", header: "Nome" },
  { field: "valor_mensal", header: "Valor", formatter: "money" },
  { field: "ativo", header: "Status", formatter: "status" },
];

const Planos: React.FC = () => {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [onLoading, setLoading] = useState<boolean>(false);

  const [inputSearch, setInputSearch] = useState<string>("");

  useEffect(() => {
    fetchPlanos();
  }, []);

  const fetchPlanos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("planos")
        .select("*")
        .order("nome", { ascending: true });
      if (error) {
        toast.error("Erro ao buscar planos.");
        throw error;
      }
      if (data) {
        setPlanos(data as Plano[]);
      }
    } catch (err) {
      console.error("Erro ao buscar planos:", err);
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

  const totalRows = planos.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
  const currentData = planos.slice(startIndex, endIndex);

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
          <Styles.Title>Planos</Styles.Title>
          <Styles.Subtitle>Cadastre e gerencie os Planos</Styles.Subtitle>
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
              placeholder="Pesquisar Plano"
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

export default Planos;
