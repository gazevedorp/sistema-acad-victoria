import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import { ModalidadeFormData } from "../../../../types/ModalidadeTypes";
import { ModalidadeModalProps, ModalMode } from "./ModalidadeModal.definitions";
import * as Styles from "./ModalidadeModal.styles";
import { FiX } from "react-icons/fi";

const ModalidadeModal: React.FC<ModalidadeModalProps> = ({
  open,
  mode,
  onClose,
  initialData,
  modalidadeIdToEdit,
  onSaveComplete,
}) => {
  const [formData, setFormData] = useState<ModalidadeFormData>({
    nome: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          nome: initialData.nome || "",
        });
      } else {
        setFormData({
          nome: "",
        });
      }
    }
  }, [open, initialData]);

  const handleClose = () => {
    setFormData({
      nome: "",
    });
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validação básica
      if (!formData.nome.trim()) {
        onSaveComplete(new Error("Nome é obrigatório"), formData, mode);
        return;
      }

      if (mode === ModalMode.CREATE) {
        const { error } = await supabase
          .from("modalidades")
          .insert([formData])
          .select();

        if (error) {
          onSaveComplete(error, formData, mode);
        } else {
          onSaveComplete(null, formData, mode);
          handleClose();
        }
      } else if (mode === ModalMode.EDIT && modalidadeIdToEdit) {
        const { error } = await supabase
          .from("modalidades")
          .update(formData)
          .eq("id", modalidadeIdToEdit)
          .select();

        if (error) {
          onSaveComplete(error, formData, mode);
        } else {
          onSaveComplete(null, formData, mode);
          handleClose();
        }
      }
    } catch (error) {
      onSaveComplete(error, formData, mode);
    } finally {
      setIsLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case ModalMode.CREATE:
        return "Nova Modalidade";
      case ModalMode.EDIT:
        return "Editar Modalidade";
      case ModalMode.VIEW:
        return "Visualizar Modalidade";
      default:
        return "Modalidade";
    }
  };

  if (!open) return null;

  return (
    <Styles.ModalOverlay onClick={handleClose}>
      <Styles.ModalContainer onClick={(e) => e.stopPropagation()}>
        <Styles.ModalHeader>
          <Styles.ModalTitle>{getModalTitle()}</Styles.ModalTitle>
          <Styles.CloseButton type="button" onClick={handleClose}>
            <FiX />
          </Styles.CloseButton>
        </Styles.ModalHeader>

        <Styles.ModalBody>
          <Styles.Form onSubmit={handleSubmit}>
            <Styles.FormGroup>
              <Styles.Label htmlFor="nome">Nome da Modalidade *</Styles.Label>
              <Styles.Input
                id="nome"
                type="text"
                value={formData.nome}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    nome: e.target.value,
                  }))
                }
                placeholder="Digite o nome da modalidade"
                disabled={mode === ModalMode.VIEW || isLoading}
                required
              />
            </Styles.FormGroup>

            {mode !== ModalMode.VIEW && (
              <Styles.SubmitButtonContainer>
                <Styles.SubmitButton type="submit" disabled={isLoading}>
                  {isLoading
                    ? "Salvando..."
                    : mode === ModalMode.CREATE
                    ? "Cadastrar"
                    : "Salvar"}
                </Styles.SubmitButton>
              </Styles.SubmitButtonContainer>
            )}
          </Styles.Form>
        </Styles.ModalBody>
      </Styles.ModalContainer>
    </Styles.ModalOverlay>
  );
};

export default ModalidadeModal;
