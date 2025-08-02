import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { supabase } from "../../../../lib/supabase";
import { CategoriaPermissaoFormData, MODULOS_SISTEMA, TIPOS_PERMISSAO } from "../../../../types/PermissaoTypes";
import { PermissaoModalProps } from "./PermissaoModal.definitions";
import {
  ModalOverlay,
  ModalContainer,
  ModalHeader,
  ModalTitle,
  CloseButton,
  ModalBody,
  FormGroup,
  Label,
  Select,
  CheckboxContainer,
  Checkbox,
  CheckboxLabel,
  ModalFooter,
  FooterButtonGroup,
  Button,
  ErrorMessage,
  LoadingSpinner,
} from "./PermissaoModal.styles";

const PermissaoModal: React.FC<PermissaoModalProps> = ({
  permissao,
  onClose,
  onSaveSuccess,
}) => {
  const [formData, setFormData] = useState<CategoriaPermissaoFormData>({
    categoria_usuario: "recepcao",
    modulo: "",
    permissao: "visualizar",
    ativo: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!permissao;

  useEffect(() => {
    if (isEditMode && permissao) {
      setFormData({
        categoria_usuario: permissao.categoria_usuario,
        modulo: permissao.modulo,
        permissao: permissao.permissao,
        ativo: permissao.ativo,
      });
    }
  }, [isEditMode, permissao]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.categoria_usuario) {
      newErrors.categoria_usuario = "Selecione uma categoria";
    }

    if (!formData.modulo) {
      newErrors.modulo = "Selecione um módulo";
    }

    if (!formData.permissao) {
      newErrors.permissao = "Selecione uma permissão";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isEditMode && permissao) {
        const { error } = await supabase
          .from('categoria_permissoes')
          .update({
            categoria_usuario: formData.categoria_usuario,
            modulo: formData.modulo,
            permissao: formData.permissao,
            ativo: formData.ativo,
            updated_at: new Date().toISOString(),
          })
          .eq('id', permissao.id);

        if (error) {
          console.error('Erro ao atualizar permissão:', error);
          toast.error('Erro ao atualizar permissão');
          return;
        }

        toast.success('Permissão atualizada com sucesso!');
      } else {
        // Verificar se já existe esta combinação específica
        const { data: existingPermission, error: checkError } = await supabase
          .from('categoria_permissoes')
          .select('id')
          .eq('categoria_usuario', formData.categoria_usuario)
          .eq('modulo', formData.modulo)
          .eq('permissao', formData.permissao)
          .eq('ativo', true)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Erro ao verificar permissão existente:', checkError);
          toast.error('Erro ao verificar permissão existente');
          return;
        }

        if (existingPermission) {
          toast.error('Esta permissão já existe para esta categoria');
          return;
        }

        const { error } = await supabase
          .from('categoria_permissoes')
          .insert([{
            categoria_usuario: formData.categoria_usuario,
            modulo: formData.modulo,
            permissao: formData.permissao,
            ativo: formData.ativo,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);

        if (error) {
          console.error('Erro ao criar permissão:', error);
          toast.error('Erro ao criar permissão');
          return;
        }

        toast.success('Permissão criada com sucesso!');
      }

      onSaveSuccess();
    } catch (err) {
      console.error('Erro ao salvar permissão:', err);
      toast.error('Erro ao salvar permissão');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || !permissao) return;

    if (!window.confirm('Tem certeza que deseja excluir esta permissão?')) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('categoria_permissoes')
        .update({ ativo: false, updated_at: new Date().toISOString() })
        .eq('id', permissao.id);

      if (error) {
        console.error('Erro ao excluir permissão:', error);
        toast.error('Erro ao excluir permissão');
        return;
      }

      toast.success('Permissão excluída com sucesso!');
      onSaveSuccess();
    } catch (err) {
      console.error('Erro ao excluir permissão:', err);
      toast.error('Erro ao excluir permissão');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleInputChange = (field: keyof CategoriaPermissaoFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer>
        <ModalHeader>
          <ModalTitle>
            {isEditMode ? 'Editar Permissão' : 'Nova Permissão'}
          </ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <ModalBody>
            <FormGroup>
              <Label htmlFor="categoria_usuario">Categoria de Usuário *</Label>
              <Select
                id="categoria_usuario"
                value={formData.categoria_usuario}
                onChange={(e) => handleInputChange('categoria_usuario', e.target.value as 'admin' | 'recepcao')}
              >
                <option value="recepcao">Recepção</option>
                <option value="admin">Admin</option>
              </Select>
              {errors.categoria_usuario && <ErrorMessage>{errors.categoria_usuario}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="modulo">Módulo *</Label>
              <Select
                id="modulo"
                value={formData.modulo}
                onChange={(e) => handleInputChange('modulo', e.target.value)}
              >
                <option value="">Selecione um módulo</option>
                {MODULOS_SISTEMA.map((modulo) => (
                  <option key={modulo.nome} value={modulo.nome}>
                    {modulo.label}
                  </option>
                ))}
              </Select>
              {errors.modulo && <ErrorMessage>{errors.modulo}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="permissao">Tipo de Permissão *</Label>
              <Select
                id="permissao"
                value={formData.permissao}
                onChange={(e) => handleInputChange('permissao', e.target.value as 'visualizar' | 'criar' | 'editar' | 'excluir')}
              >
                {TIPOS_PERMISSAO.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </Select>
              {errors.permissao && <ErrorMessage>{errors.permissao}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <CheckboxContainer>
                <Checkbox
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => handleInputChange('ativo', e.target.checked)}
                />
                <CheckboxLabel htmlFor="ativo">Ativo</CheckboxLabel>
              </CheckboxContainer>
            </FormGroup>
          </ModalBody>

          <ModalFooter>
            <div>
              {isEditMode && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner /> : 'Excluir'}
                </Button>
              )}
            </div>
            <FooterButtonGroup>
              <Button type="button" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? <LoadingSpinner /> : isEditMode ? 'Atualizar' : 'Criar'}
              </Button>
            </FooterButtonGroup>
          </ModalFooter>
        </form>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default PermissaoModal;
