import React, { useEffect, useState, useCallback } from "react";
import DefaultTable, { TableColumn } from "../../components/Table/DefaultTable";
import { supabase } from "../../lib/supabase";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Loader from "../../components/Loader/Loader";
import * as Styles from "./Users.styles"; // Will be created
import { SistemUser } from "../../types/UserType";
import UserModal from "../../components/UserModal/UserModal"; // Will be created
import { UserModalFormData } from "../../components/UserModal/UserModal.definitions"; // Will be created
import ActionsMenu from "../../components/ActionMenu/ActionMenu";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa"; // FaTrash for potential future use

const Users: React.FC = () => {
  const [users, setUsers] = useState<SistemUser[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<SistemUser | null>(null);
  const [activeRowMenu, setActiveRowMenu] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("usuarios") // Ensure this table name is correct
        .select("*")
        .order("nome", { ascending: true });

      if (error) {
        toast.error("Erro ao buscar usuários.");
        console.error("Fetch users error:", error);
        throw error;
      }
      if (data) {
        setUsers(data as SistemUser[]);
      }
    } catch (err) {
      // Error already toasted
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: SistemUser) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setActiveRowMenu(null); // Close actions menu if modal is closed
  };

  const handleSaveUser = async (formData: UserModalFormData, userId?: string) => {
    setIsLoading(true);
    try {
      if (userId && editingUser) { // Editing existing user
        const { error: updateError } = await supabase
          .from("usuarios")
          .update({
            nome: formData.nome,
            email: formData.email, // Consider implications if this is also the auth email
            telefone: formData.telefone,
            permissao: formData.permissao,
            ativo: formData.ativo,
          })
          .eq("id", userId);

        if (updateError) {
          toast.error(`Erro ao atualizar usuário: ${updateError.message}`);
          throw updateError;
        }
        toast.success("Usuário atualizado com sucesso!");
      } else { // Creating new user
        if (!formData.senha) {
          toast.error("Senha é obrigatória para criar um novo usuário.");
          setIsLoading(false);
          return;
        }
        // 1. Sign up with Supabase Auth
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.senha,
        });

        if (signUpError) {
          toast.error(`Erro ao criar autenticação: ${signUpError.message}`);
          throw signUpError;
        }

        if (authData.user) {
          // 2. Insert into 'usuarios' table
          const { error: insertError } = await supabase
            .from("usuarios")
            .insert([{
              id: authData.user.id, // Use ID from Supabase auth
              nome: formData.nome,
              email: formData.email,
              telefone: formData.telefone,
              permissao: formData.permissao,
              ativo: formData.ativo,
            }]);

          if (insertError) {
            // Potentially delete the auth user if this fails, or handle more gracefully
            toast.error(`Erro ao salvar dados do usuário: ${insertError.message}`);
            throw insertError;
          }
          toast.success("Usuário criado com sucesso!");
        } else {
          toast.error("Não foi possível criar o usuário (auth user não retornado).");
          throw new Error("Auth user not returned after sign up.");
        }
      }
      fetchUsers();
      handleCloseModal();
    } catch (err) {
      console.error("Save user error:", err);
      // Errors are toasted within the try block
    } finally {
      setIsLoading(false);
    }
  };

  // TODO: Implement handleDeleteUser if/when needed

  const getColumns = (
     onEdit: (user: SistemUser) => void,
     // onDelete: (user: SistemUser) => void, // For future delete
     currentActiveRowMenu: string | null,
     onSetActiveRowMenu: (id: string | null) => void
   ): TableColumn<SistemUser>[] => [
     { field: "nome", header: "Nome" },
     { field: "email", header: "Email" },
     { field: "telefone", header: "Telefone" },
     { field: "permissao", header: "Permissão" },
     { field: "ativo", header: "Status", formatter: "status" }, // Assuming 'status' formatter exists
     {
       field: "actions",
       header: "Ações",
       render: (user) => (
         <ActionsMenu<SistemUser>
           rowValue={user}
           isOpen={currentActiveRowMenu === user.id}
           onToggle={() => onSetActiveRowMenu(currentActiveRowMenu === user.id ? null : user.id)}
           onClose={() => onSetActiveRowMenu(null)}
           onEdit={() => {
             onEdit(user);
             onSetActiveRowMenu(null);
           }}
           // Add onDelete prop and handler when delete is implemented
           noDelete={true} // No delete for now
         />
       ),
     },
   ];

  const tableColumns = getColumns(handleOpenEditModal, activeRowMenu, setActiveRowMenu);

  const filteredUsers = users.filter(user =>
     user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRows = filteredUsers.length;
  const paginatedUsers = filteredUsers.slice(
     (currentPage - 1) * rowsPerPage,
     currentPage * rowsPerPage
  );

  return (
    <Styles.Container>
      <Styles.Header>
        <div>
          <Styles.Title>Usuários</Styles.Title>
          <Styles.Subtitle>Cadastre e gerencie os usuários do sistema</Styles.Subtitle>
        </div>
        <Styles.Button onClick={handleOpenCreateModal}>
          <FaPlus style={{ marginRight: '8px' }} />
          Novo Usuário
        </Styles.Button>
      </Styles.Header>

      {isLoading && !isModalOpen ? (
        <Styles.LoaderDiv>
          <Loader color="#000" /> {/* Adjust color as needed */}
        </Styles.LoaderDiv>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ maxWidth: 400 }}>
              <Styles.Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar por nome ou email..."
              />
            </div>
          </div>
          <DefaultTable
            data={paginatedUsers}
            columns={tableColumns}
            rowsPerPage={rowsPerPage}
            currentPage={currentPage}
            totalRows={totalRows}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={setRowsPerPage}
          />
        </>
      )}
      <ToastContainer autoClose={3000} hideProgressBar />

      {isModalOpen && (
         <UserModal
             isOpen={isModalOpen}
             onClose={handleCloseModal}
             onSave={handleSaveUser}
             user={editingUser}
             isEditing={!!editingUser}
         />
      )}
    </Styles.Container>
  );
};

export default Users;
