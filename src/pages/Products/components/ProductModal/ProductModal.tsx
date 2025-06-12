import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as S from './ProductModal.styles';
import { ProductModalFormData, productModalSchema } from './ProductModal.definitions';
import { Product } from '../../../../types/ProductType'; // Assuming ProductType.ts is in src/types

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Product) => Promise<void>; // Updated to send Product
  product?: Product | null; // Product data for editing
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, product }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ProductModalFormData>({
    resolver: yupResolver(productModalSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (product) {
        // Editing mode: pre-fill form
        setValue('nome', product.nome);
        setValue('valor', product.valor);
        setValue('ativo', product.ativo);
      } else {
        // Creation mode: reset to default or empty values
        reset({
          nome: '',
          valor: undefined, // Or a default value like 0
          ativo: true, // Default to active
        });
      }
    }
  }, [isOpen, product, setValue, reset]);

  const onSubmit: SubmitHandler<ProductModalFormData> = async (data) => {
    // Construct product object, including ID if editing
    const productToSave: Product = {
      id: product?.id || '', // Keep existing ID or handle new ID generation strategy
      nome: data.nome,
      valor: data.valor,
      ativo: data.ativo,
    };
    await onSave(productToSave);
  };

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {

      if (event.key === "Escape") {
        if (isOpen) {
          event.preventDefault();
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <S.ModalOverlay onClick={onClose}>
      <S.ModalContainer onClick={(e) => e.stopPropagation()}>
        <S.ModalHeader>
          <S.ModalTitle>{product ? 'Editar Produto' : 'Criar Novo Produto'}</S.ModalTitle>
          <S.CloseButton onClick={onClose}>&times;</S.CloseButton>
        </S.ModalHeader>
        <S.ModalBody>
          <S.Form onSubmit={handleSubmit(onSubmit)}>
            <S.FormGroup>
              <S.Label htmlFor="nome">Nome</S.Label>
              <S.Input id="nome" {...register('nome')} />
              {errors.nome && <S.ErrorMsg>{errors.nome.message}</S.ErrorMsg>}
            </S.FormGroup>

            <S.FormGroup>
              <S.Label htmlFor="valor">Valor (R$)</S.Label>
              <S.Input id="valor" type="number" step="0.01" {...register('valor')} />
              {errors.valor && <S.ErrorMsg>{errors.valor.message}</S.ErrorMsg>}
            </S.FormGroup>

            <S.FormGroupCheckbox>
              <S.CheckboxInput id="ativo" type="checkbox" {...register('ativo')} />
              <S.Label htmlFor="ativo" style={{ marginBottom: 0 }}>Ativo</S.Label>
              {errors.ativo && <S.ErrorMsg>{errors.ativo.message}</S.ErrorMsg>}
            </S.FormGroupCheckbox>

            <S.SubmitButtonContainer>
              <S.SubmitButton type="submit">
                {product ? 'Salvar Alterações' : 'Criar Produto'}
              </S.SubmitButton>
            </S.SubmitButtonContainer>
          </S.Form>
        </S.ModalBody>
      </S.ModalContainer>
    </S.ModalOverlay>
  );
};

export default ProductModal;
