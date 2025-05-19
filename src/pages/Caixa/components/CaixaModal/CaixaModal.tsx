import React, { useState, useEffect } from "react"; // Adicionado useCallback
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Styles from "./CaixaModal.styles";
import Loader from "../../../../components/Loader/Loader"; // Ajuste o caminho
import { supabase } from "../../../../lib/supabase"; // Ajuste o caminho
import { toast } from 'react-toastify'; // Adicionado para feedback de erro na busca de mensalidade

import {
  CaixaModalFormData,
  caixaModalSchema,
  TipoMovimentacaoCaixa,
  AlunoParaSelect,
  ProdutoParaSelect,
  FormaPagamentoParaSelect,
} from "./CaixaModal.definitions";

interface CaixaModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<CaixaModalFormData>) => Promise<void | { error?: any }>;
  alunosList: AlunoParaSelect[];
  produtosList: ProdutoParaSelect[];
  formasPagamentoList: FormaPagamentoParaSelect[];
}

// Nova função para buscar o valor da mensalidade
async function fetchValorMensalidade(alunoId: string): Promise<number | undefined> {
  if (!alunoId) return undefined;
  try {
    const { data, error } = await supabase
      .from('matriculas') // Sua tabela de matrículas
      .select('valor_final_cobrado') // O campo que guarda o valor líquido da mensalidade
      .eq('id_aluno', alunoId)
      .eq('ativo_atual', true) // Busca a matrícula ativa
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar valor da mensalidade:", error.message);
      toast.error("Não foi possível buscar o valor da mensalidade do aluno.");
      return undefined;
    }
    return data?.valor_final_cobrado;
  } catch (err) {
    console.error("Exceção ao buscar valor da mensalidade:", err);
    toast.error("Erro inesperado ao buscar valor da mensalidade.");
    return undefined;
  }
}


const CaixaModal: React.FC<CaixaModalProps> = ({
  open,
  onClose,
  onSave,
  alunosList,
  produtosList,
  formasPagamentoList,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValorReadOnly, setIsValorReadOnly] = useState(false); // Novo estado

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
    getValues, // Adicionado para ler valores atuais do formulário
  } = useForm<CaixaModalFormData>({
    resolver: yupResolver(caixaModalSchema),
    defaultValues: {
      tipoMovimentacao: TipoMovimentacaoCaixa.PAGAMENTO_MENSALIDADE,
      valor: undefined,
      forma_pagamento_id: "",
      descricao: "",
      cliente_id: undefined,
      produto_id: undefined,
      quantidade: undefined,
    },
  });

  const selectedTipoMovimentacao = watch("tipoMovimentacao");
  const selectedClienteId = watch("cliente_id");
  const selectedProdutoId = watch("produto_id");
  const watchedQuantidade = watch("quantidade");

  useEffect(() => {
    if (open) {
      const defaultTipo = selectedTipoMovimentacao || TipoMovimentacaoCaixa.PAGAMENTO_MENSALIDADE;
      reset({
        tipoMovimentacao: defaultTipo,
        valor: undefined,
        forma_pagamento_id: "",
        descricao: "",
        cliente_id: defaultTipo === TipoMovimentacaoCaixa.PAGAMENTO_MENSALIDADE ? getValues("cliente_id") : undefined,
        produto_id: defaultTipo === TipoMovimentacaoCaixa.VENDA_PRODUTO ? getValues("produto_id") : undefined,
        quantidade: defaultTipo === TipoMovimentacaoCaixa.VENDA_PRODUTO ? getValues("quantidade") : undefined,
      });
      // Define o estado inicial de readOnly para o campo valor
      setIsValorReadOnly(defaultTipo !== TipoMovimentacaoCaixa.SAIDA_CAIXA);
      if (defaultTipo === TipoMovimentacaoCaixa.SAIDA_CAIXA) {
        setValue("valor", undefined); // Limpa o valor para Saída de Caixa
      }
    }
  }, [open, reset, getValues, selectedTipoMovimentacao]); // selectedTipoMovimentacao adicionado para resetar condicionalmente

  // Efeito para buscar valor da mensalidade
  useEffect(() => {
    if (selectedTipoMovimentacao === TipoMovimentacaoCaixa.PAGAMENTO_MENSALIDADE && selectedClienteId) {
      setIsValorReadOnly(true);
      setValue("valor", undefined); // Limpa valor enquanto busca
      fetchValorMensalidade(selectedClienteId).then(valorMensalidade => {
        if (valorMensalidade !== undefined) {
          setValue("valor", valorMensalidade, { shouldValidate: true });
        }
      });
    } else if (selectedTipoMovimentacao !== TipoMovimentacaoCaixa.VENDA_PRODUTO) {
      // Se não for mensalidade nem venda, e não for saída, limpa o valor e torna editável (caso de mudança de tipo)
      // A condição para saída é tratada abaixo
       if(selectedTipoMovimentacao !== TipoMovimentacaoCaixa.SAIDA_CAIXA){
         setValue("valor", undefined);
       }
    }
  }, [selectedTipoMovimentacao, selectedClienteId, setValue]);

  // Efeito para calcular valor da venda de produto
  useEffect(() => {
    if (selectedTipoMovimentacao === TipoMovimentacaoCaixa.VENDA_PRODUTO && selectedProdutoId && watchedQuantidade && watchedQuantidade > 0) {
      setIsValorReadOnly(true);
      const produto = produtosList.find(p => p.id === selectedProdutoId);
      if (produto && typeof produto.valor === 'number') {
        setValue("valor", produto.valor * watchedQuantidade, { shouldValidate: true });
      } else {
        setValue("valor", undefined); // Limpa se o produto não tiver valor
      }
    } else if (selectedTipoMovimentacao === TipoMovimentacaoCaixa.VENDA_PRODUTO) {
        // Se for venda mas algum dado estiver faltando para o cálculo, limpa o valor
        setValue("valor", undefined);
        setIsValorReadOnly(true); // Ainda é calculado, então readonly
    }
  }, [selectedTipoMovimentacao, selectedProdutoId, watchedQuantidade, produtosList, setValue]);

  // Efeito para controlar a editabilidade do campo VALOR
  useEffect(() => {
    if (selectedTipoMovimentacao === TipoMovimentacaoCaixa.SAIDA_CAIXA) {
      setIsValorReadOnly(false);
      // Não limpa o valor aqui, permite que o usuário digite
    } else if (selectedTipoMovimentacao === TipoMovimentacaoCaixa.PAGAMENTO_MENSALIDADE || selectedTipoMovimentacao === TipoMovimentacaoCaixa.VENDA_PRODUTO) {
      setIsValorReadOnly(true);
    }
  }, [selectedTipoMovimentacao]);


  const onSubmit: SubmitHandler<CaixaModalFormData> = async (data) => {
    setIsSubmitting(true);
    const dataToSave: Partial<CaixaModalFormData> = {
      tipoMovimentacao: data.tipoMovimentacao,
      valor: data.valor,
      forma_pagamento_id: data.forma_pagamento_id,
      descricao: data.descricao || undefined,
    };

    if (data.tipoMovimentacao === TipoMovimentacaoCaixa.PAGAMENTO_MENSALIDADE) {
      dataToSave.cliente_id = data.cliente_id;
    } else if (data.tipoMovimentacao === TipoMovimentacaoCaixa.VENDA_PRODUTO) {
      dataToSave.produto_id = data.produto_id;
      // dataToSave.quantidade = data.quantidade; // Opcional salvar quantidade, se sua tabela 'financeiro' tiver
    }
    
    try {
      await onSave(dataToSave);
    } catch (error) {
      console.error("Erro ao salvar movimentação de caixa:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Styles.ModalOverlay>
      <Styles.ModalContainer>
        <Styles.ModalHeader>
          <Styles.ModalTitle>Nova Movimentação de Caixa</Styles.ModalTitle>
          <Styles.CloseButton onClick={onClose}>×</Styles.CloseButton>
        </Styles.ModalHeader>
        <Styles.ModalBody>
          <Styles.Form onSubmit={handleSubmit(onSubmit)}>
            <Styles.FormGroup>
              <Styles.Label htmlFor="tipoMovimentacao">Tipo de Movimentação</Styles.Label>
              <Styles.Select {...register("tipoMovimentacao")} id="tipoMovimentacao">
                <option value={TipoMovimentacaoCaixa.PAGAMENTO_MENSALIDADE}>
                  Pagamento de Mensalidade
                </option>
                <option value={TipoMovimentacaoCaixa.VENDA_PRODUTO}>
                  Venda de Produto
                </option>
                <option value={TipoMovimentacaoCaixa.SAIDA_CAIXA}>
                  Saída de Caixa
                </option>
              </Styles.Select>
              {errors.tipoMovimentacao && <Styles.ErrorMsg>{errors.tipoMovimentacao.message}</Styles.ErrorMsg>}
            </Styles.FormGroup>

            {selectedTipoMovimentacao === TipoMovimentacaoCaixa.PAGAMENTO_MENSALIDADE && (
              <Styles.FormGroup>
                <Styles.Label htmlFor="cliente_id">Aluno</Styles.Label>
                <Styles.Select {...register("cliente_id")} id="cliente_id">
                  <option value="">Selecione o Aluno</option>
                  {alunosList.map((aluno) => (
                    <option key={aluno.id} value={aluno.id}>
                      {aluno.nome}
                    </option>
                  ))}
                </Styles.Select>
                {errors.cliente_id && <Styles.ErrorMsg>{errors.cliente_id.message}</Styles.ErrorMsg>}
              </Styles.FormGroup>
            )}

            {selectedTipoMovimentacao === TipoMovimentacaoCaixa.VENDA_PRODUTO && (
              <>
                <Styles.FormGroup>
                  <Styles.Label htmlFor="produto_id">Produto</Styles.Label>
                  <Styles.Select {...register("produto_id")} id="produto_id">
                    <option value="">Selecione o Produto</option>
                    {produtosList.map((produto) => (
                      <option key={produto.id} value={produto.id}>
                        {produto.nome} {produto.valor ? `- ${Number(produto.valor).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}` : ''}
                      </option>
                    ))}
                  </Styles.Select>
                  {errors.produto_id && <Styles.ErrorMsg>{errors.produto_id.message}</Styles.ErrorMsg>}
                </Styles.FormGroup>
                <Styles.FormGroup>
                  <Styles.Label htmlFor="quantidade">Quantidade</Styles.Label>
                  <Styles.Input type="number" {...register("quantidade")} id="quantidade" min="1" />
                  {errors.quantidade && <Styles.ErrorMsg>{errors.quantidade.message}</Styles.ErrorMsg>}
                </Styles.FormGroup>
              </>
            )}
            
            {selectedTipoMovimentacao === TipoMovimentacaoCaixa.SAIDA_CAIXA && (
                 <Styles.FormGroup>
                    <Styles.Label htmlFor="descricao">Descrição da Saída</Styles.Label>
                    <Styles.Textarea {...register("descricao")} id="descricao" rows={3} />
                    {errors.descricao && <Styles.ErrorMsg>{errors.descricao.message}</Styles.ErrorMsg>}
                </Styles.FormGroup>
            )}

            <Styles.FormGroup>
              <Styles.Label htmlFor="valor">Valor (R$)</Styles.Label>
              <Styles.Input 
                type="number" 
                step="0.01" 
                {...register("valor")} 
                id="valor" 
                readOnly={isValorReadOnly} // Campo readOnly condicionalmente
              />
              {errors.valor && <Styles.ErrorMsg>{errors.valor.message}</Styles.ErrorMsg>}
            </Styles.FormGroup>

            <Styles.FormGroup>
              <Styles.Label htmlFor="forma_pagamento_id">Forma de Pagamento</Styles.Label>
              <Styles.Select {...register("forma_pagamento_id")} id="forma_pagamento_id">
                <option value="">Selecione a Forma</option>
                {formasPagamentoList.map((forma) => (
                  <option key={forma.id} value={forma.id}>
                    {forma.nome}
                  </option>
                ))}
              </Styles.Select>
              {errors.forma_pagamento_id && <Styles.ErrorMsg>{errors.forma_pagamento_id.message}</Styles.ErrorMsg>}
            </Styles.FormGroup>
            
            {(selectedTipoMovimentacao === TipoMovimentacaoCaixa.PAGAMENTO_MENSALIDADE || 
              selectedTipoMovimentacao === TipoMovimentacaoCaixa.VENDA_PRODUTO) && 
              !errors.descricao && // Não mostra se já há erro de descrição obrigatória (saída)
              (
                <Styles.FormGroup>
                    <Styles.Label htmlFor="descricaoOpcional">Descrição (Opcional)</Styles.Label>
                    <Styles.Textarea {...register("descricao")} id="descricaoOpcional" rows={2} />
                    {/* Não mostra erro aqui, pois é opcional e o yup já trata para saída */}
                </Styles.FormGroup>
            )}


            <Styles.SubmitButtonContainer>
              <Styles.SubmitButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader /> : "Registrar Movimentação"}
              </Styles.SubmitButton>
            </Styles.SubmitButtonContainer>
          </Styles.Form>
        </Styles.ModalBody>
      </Styles.ModalContainer>
    </Styles.ModalOverlay>
  );
};

export default CaixaModal;