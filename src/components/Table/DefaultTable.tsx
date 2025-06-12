import { useMemo, useEffect, useState, useRef } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as Styles from "./DefaultTable.styles";
import { MaskPattern, IMaskPatternType } from "../../utils/formatter";
import ActionsMenu from "../ActionMenu/ActionMenu";

export interface TableColumn<T> {
  field: string; // Unique identifier for the column. If not using render, it's typically a keyof T.
  header: string;
  formatter?: IMaskPatternType;
  render?: (rowData: T, rowIndex?: number) => React.ReactNode; // Custom render function for the cell
  width?: number; // Optional width for the column in pixels
  textAlign?: 'left' | 'center' | 'right'; // Optional text alignment
}

export interface DefaultTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  rowsPerPage: number;
  currentPage: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  showActions?: boolean;
  onView?(row: T): void;
  onEdit?(row: T): void;
  onDelete?(row: T): void;
  noDelete?: boolean;
}

function DefaultTable<T extends Record<string, any>>(
  props: DefaultTableProps<T>
) {
  const {
    data,
    columns,
    rowsPerPage,
    currentPage,
    totalRows,
    onPageChange,
    onRowsPerPageChange,
    showActions = false,
    onView,
    onEdit,
    onDelete,
    noDelete = false,
  } = props;

  const [openRowId, setOpenRowId] = useState<string>("");

  const mask = useMemo(() => new MaskPattern(), []);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  const rowRefs = useRef<Record<string | number, HTMLDivElement | null>>({});
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!openRowId) return; // se não há menu aberto, não faz nada

      const container = rowRefs.current[openRowId];
      if (!container) return;

      // se o clique não foi dentro do container do popup daquela linha, fecha
      if (!container.contains(e.target as Node)) {
        setOpenRowId("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openRowId]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const MOBILE_BP = 600;
  const MEDIAL_BP = 800;
  const TABLET_BP = 1080;

  const visibleColumns = useMemo(() => {
    let baseCols =
      windowWidth < MOBILE_BP
        ? columns.slice(0, 1)
        : windowWidth < MEDIAL_BP
        ? columns.slice(0, 2)
        : windowWidth < TABLET_BP
        ? columns.slice(0, 3)
        : columns;

    if (showActions) {
      baseCols = [...baseCols, { field: "__acoes", header: "Ações" }];
    }
    return baseCols;
  }, [columns, showActions, windowWidth]);

  const columnHelper = createColumnHelper<T>();

  const tanstackColumns = useMemo(() => {
    return visibleColumns.map((col: TableColumn<T>) => { // Ensure col is typed correctly
      if (col.field === "__acoes") {
        return columnHelper.display({
          id: "__acoes",
          header: col.header,
          size: col.width || 100, // Default width for actions or use provided
          meta: { textAlign: col.textAlign || "center" },
          cell: (info) => {
            const rowValue = info.row.original;
            return (
              <div
                ref={(node) => {
                  // registra a ref desse item
                  rowRefs.current[rowValue.id] = node;
                }}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActionsMenu
                  rowValue={rowValue}
                  isOpen={openRowId === rowValue.id}
                  onToggle={() =>
                    setOpenRowId(openRowId === rowValue.id ? "" : rowValue.id)
                  }
                  onClose={() => setOpenRowId("")}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  noDelete={noDelete}
                />
              </div>
            );
          },
        });
      }

      const fieldName = String(col.field);

      // If a custom render function is provided for the column
      if (col.render) {
        return columnHelper.display({
          id: fieldName,
          header: col.header,
          size: col.width,
          meta: { textAlign: col.textAlign },
          cell: (info) => col.render!(info.row.original, info.row.index),
        });
      }

      // If no custom render, use accessor for standard data display + formatting
      return columnHelper.accessor((row) => row[col.field as keyof T], { // Assumes col.field is a keyof T if no render
        id: fieldName,
        header: col.header,
        size: col.width,
        meta: { textAlign: col.textAlign },
        cell: (info) => {
          const value = info.getValue();
          if (col.formatter && value != null && value !== "") {
            const maskedValue = mask.applyMask(String(value || ""), col.formatter);
            return <Styles.EllipsisSpan>{maskedValue}</Styles.EllipsisSpan>;
          }
          return (
            <Styles.EllipsisSpan>
              {value != null && value !== "" ? String(value) : "-"}
            </Styles.EllipsisSpan>
          );
        },
      });

    });
  }, [visibleColumns, columnHelper, onView, onEdit, onDelete, mask, openRowId]);

  const table = useReactTable({
    data,
    columns: tanstackColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + data.length, totalRows);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  if (!data.length) {
    return (
      <Styles.TableContainer>
        <Styles.EmptyStateContainer>
          <Styles.EmptyTitle>Nenhum registro encontrado</Styles.EmptyTitle>
          <Styles.EmptySubtitle>
            Insira seus dados agora para começar a gerenciar!
          </Styles.EmptySubtitle>
        </Styles.EmptyStateContainer>
      </Styles.TableContainer>
    );
  }

  return (
    <Styles.TableContainer>
      <table style={{ width: "100%" }}>
        <Styles.TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Styles.Th
                  key={header.id}
                  style={{
                    width: header.column.columnDef.size
                      ? `${header.column.columnDef.size}px`
                      : undefined,
                    textAlign: (header.column.columnDef.meta as any)?.textAlign || 'left',
                  }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </Styles.Th>
              ))}
            </tr>
          ))}
        </Styles.TableHeader>
        <Styles.TableBody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <Styles.Td
                  key={cell.id}
                  style={{
                    width: cell.column.columnDef.size
                      ? `${cell.column.columnDef.size}px`
                      : undefined,
                    textAlign: (cell.column.columnDef.meta as any)?.textAlign || 'left',
                  }}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Styles.Td>
              ))}
            </tr>
          ))}
        </Styles.TableBody>
      </table>

      <Styles.PaginationContainer>
        {windowWidth > MOBILE_BP && (
          <Styles.PageInfo>Resultados por página:</Styles.PageInfo>
        )}
        <Styles.RowsPerPageSelect
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={15}>15</option>
        </Styles.RowsPerPageSelect>
        <Styles.PageInfo>
          {startIndex + 1} – {endIndex} de {totalRows}
        </Styles.PageInfo>
        <Styles.ArrowButton
          onClick={handlePrevPage}
          disabled={currentPage === 1}
        >
          &lt;
        </Styles.ArrowButton>
        <Styles.ArrowButton
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
        >
          &gt;
        </Styles.ArrowButton>
      </Styles.PaginationContainer>
    </Styles.TableContainer>
  );
}

export default DefaultTable;
