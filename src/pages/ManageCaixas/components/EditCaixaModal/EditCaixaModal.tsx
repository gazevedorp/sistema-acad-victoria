// src/pages/ManageCaixas/components/EditCaixaModal/EditCaixaModal.tsx
import React, { useState, useEffect } from 'react';
import * as Styles from './EditCaixaModal.styles';
import { CaixaWithUserEmail } from '../../ManageCaixas.definitions'; // Adjust path

export interface EditCaixaFormData {
  observacoes_abertura?: string | null;
  obs_fechamento?: string | null;
  status?: string; // Added status
}

interface EditCaixaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: EditCaixaFormData) => Promise<void>;
  caixaData: CaixaWithUserEmail | null;
  isSubmitting: boolean;
}

const EditCaixaModal: React.FC<EditCaixaModalProps> = ({ isOpen, onClose, onSave, caixaData, isSubmitting }) => {
  const [formData, setFormData] = useState<EditCaixaFormData>({});

  useEffect(() => {
    if (caixaData) {
      setFormData({
        observacoes_abertura: caixaData.observacoes_abertura || '',
        obs_fechamento: caixaData.obs_fechamento || '',
        status: caixaData.status || undefined, // Populate status
      });
    }
  }, [caixaData]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caixaData) return;
    // Filter out status if it hasn't changed from original, unless it's being set to 'conferido'
    // Or, more simply, only include fields that are meant to be editable.
    // For now, send all fields in formData. The backend or onSave can be smarter.
    await onSave(formData);
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

  if (!isOpen || !caixaData) return null;

  return (
    <Styles.ModalBackdrop onClick={onClose}>
      <Styles.ModalContent onClick={(ev) => ev.stopPropagation()}>
        <Styles.ModalHeader>
          <h2>Editar Caixa: {caixaData.id.substring(0,8)}...</h2>
          <Styles.CloseButton onClick={onClose} disabled={isSubmitting}>&times;</Styles.CloseButton>
        </Styles.ModalHeader>
        <form onSubmit={handleSubmit}>
          <Styles.ModalBody>
            <Styles.FormControl>
              <label htmlFor="observacoes_abertura">Observações Abertura</label>
              <textarea
                id="observacoes_abertura"
                name="observacoes_abertura"
                value={formData.observacoes_abertura || ''}
                onChange={handleChange}
                rows={3}
                disabled={isSubmitting}
              />
            </Styles.FormControl>
            <Styles.FormControl>
              <label htmlFor="obs_fechamento">Observações Fechamento</label>
              <textarea
                id="obs_fechamento"
                name="obs_fechamento"
                value={formData.obs_fechamento || ''}
                onChange={handleChange}
                rows={3}
                disabled={isSubmitting || caixaData.status === 'aberto'} // Can't edit closing notes if caixa is open
              />
            </Styles.FormControl>
            <Styles.FormControl>
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status || ''}
                onChange={handleChange}
                disabled={isSubmitting || caixaData.status === 'aberto'} // Cannot change status of 'aberto' caixa here.
                                                                    // 'fechado' can become 'conferido'.
                                                                    // 'conferido' can revert to 'fechado' (if logic permits).
              >
                {/* Original status is always an option */}
                {caixaData.status === 'aberto' && <option value="aberto">Aberto</option>}
                {caixaData.status === 'fechado' && <option value="fechado">Fechado</option>}
                {caixaData.status === 'conferido' && <option value="conferido">Conferido</option>}

                {/* Allow changing to 'conferido' from 'fechado' */}
                {caixaData.status === 'fechado' && <option value="conferido">Conferido</option>}
                {/* Allow changing from 'conferido' back to 'fechado' (if needed) */}
                {/* This logic might need refinement based on exact state transition rules */}
                {caixaData.status === 'conferido' && formData.status !== 'fechado' && <option value="fechado">Fechado</option>}

              </select>
            </Styles.FormControl>
          </Styles.ModalBody>
          <Styles.ModalFooter>
            <Styles.Button type="button" onClick={onClose} variant="secondary" disabled={isSubmitting}>Cancelar</Styles.Button>
            <Styles.Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Styles.Button>
          </Styles.ModalFooter>
        </form>
      </Styles.ModalContent>
    </Styles.ModalBackdrop>
  );
};
export default EditCaixaModal;
