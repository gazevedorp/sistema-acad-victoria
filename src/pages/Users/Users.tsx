import React, { useEffect, useState } from "react";
import DefaultTable, { TableColumn } from "../../components/Table/DefaultTable";
import { supabase } from "../../lib/supabase.ts";
import { toast, ToastContainer } from "react-toastify";
import Loader from "../../components/Loader/Loader.tsx";
import * as Styles from "./Users.styles.ts";
import { SistemUser } from "../../types/UserType.ts";

const columns: TableColumn<SistemUser>[] = [
  { field: "nome", header: "Nome" },
  { field: "email", header: "Email" },
  { field: "tipo", header: "Permissão" },
  { field: "ativo", header: "Ativo", formatter: "status" },
];

const Users: React.FC = () => {
  const [users, setUsers] = useState<SistemUser[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [onLoading, setLoading] = useState<boolean>(false);

  const [inputSearch, setInputSearch] = useState<string>("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .order("nome", { ascending: true });
      if (error) {
        toast.error("Erro ao buscar usuários.");
        throw error;
      }
      if (data) {
        setUsers(data as SistemUser[]);
      }
    } catch (err) {
      console.error("Erro ao buscar usuários:", err);
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

  const totalRows = users.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
  const currentData = users.slice(startIndex, endIndex);

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
          <Styles.Title>Usuários</Styles.Title>
          <Styles.Subtitle>
            Cadastre e gerencie os Usuários do sistema
          </Styles.Subtitle>
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
              placeholder="Pesquisar Usuário"
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

export default Users;
