import styled from "styled-components";

/**
 * Container principal da tabela.
 */
export const TableContainer = styled.div`
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: visible;
  width: 100%;
  margin-top: 16px;
  background-color: #fff;
`;

/**
 * Cabeçalho da tabela.
 */
export const TableHeader = styled.thead`
  background-color: #f5f5f5;
`;

/**
 * Célula de cabeçalho.
 */
export const Th = styled.th`
  text-align: left;
  padding: 16px;
  font-weight: 500;
  font-size: 14px;
  color: #333;
`;

/**
 * Corpo da tabela.
 */
export const TableBody = styled.tbody`
  tr {
    border-bottom: 1px solid #eee;
  }
`;

/**
 * Célula de corpo de tabela padrão.
 * Apenas define paddings, fonte, etc.
 */
export const Td = styled.td`
  padding: 16px;
  font-size: 12px;
  color: #555;
`;

/**
 * Usado em <EmptyStateContainer> quando não há registros.
 */
export const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 0;
  text-align: center;
`;

export const EmptyTitle = styled.h2`
  font-size: 20px;
  margin-bottom: 8px;
  color: #444;
`;

export const EmptySubtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
  max-width: 400px;
`;

/**
 * Área de paginação.
 */
export const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 16px;
  gap: 16px;
  font-size: 14px;
`;

export const RowsPerPageSelect = styled.select`
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  cursor: pointer;
  font-size: 12px;
`;

export const PageInfo = styled.span`
  font-size: 12px;
  color: #666;
`;

export const ArrowButton = styled.button`
  background: none;
  border: none;
  color: #3634a3;
  font-weight: bold;
  cursor: pointer;
  font-size: 16px;

  &:disabled {
    color: #aaa;
    cursor: not-allowed;
  }
`;

export const EllipsisSpan = styled.span`
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;

  @media (max-width: 480px) {
    max-width: 180px;
  }

  @media (max-width: 415px) {
    max-width: 160px;
  }

  @media (max-width: 390px) {
    max-width: 140px;
  }

  @media (max-width: 375px) {
    max-width: 100px;
  }

  @media (max-width: 360px) {
    max-width: 80px;
  }
`;