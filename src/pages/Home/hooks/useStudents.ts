import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { fetchStudents, AlunoOld } from "../services/homeServices";
import { useStudentsStore } from "../../../store/studentsStore";

type FilterType = 'todos' | 'ativos' | 'bloqueados' | 'encerrados' | 'pendentes' | 'antigos';

export const useStudents = () => {
  const [students, setStudents] = useState<AlunoOld[]>([]);
  const [studentRowsPerPage, setStudentRowsPerPage] = useState<number>(10);
  const [studentCurrentPage, setStudentCurrentPage] = useState<number>(1);
  const [studentSearchInput, setStudentSearchInput] = useState<string>("");
  

  const { 
    totalStudents, 
    activeFilter, 
    isLoading: isStudentsLoading,
    setTotalStudents, 
    setActiveFilter, 
    setIsLoading: setIsStudentsLoading 
  } = useStudentsStore();

  const loadStudents = useCallback(async (searchQuery: string = "", page: number = 1, pageSize: number = 10, situacao?: string) => {
    setIsStudentsLoading(true);
    try {
      const data = await fetchStudents(searchQuery, page, pageSize, situacao);
      setStudents(data.students);
      setTotalStudents(data.totalStudents);
    } catch (error) {
      toast.error("Erro ao buscar alunos.");
      console.error("Error fetching students:", error);
      setStudents([]);
      setTotalStudents(0);
    } finally {
      setIsStudentsLoading(false);
    }
  }, [setTotalStudents, setIsStudentsLoading]);

  const refreshStudents = useCallback(() => {
    loadStudents(studentSearchInput, studentCurrentPage, studentRowsPerPage, activeFilter);
  }, [loadStudents, studentSearchInput, studentCurrentPage, studentRowsPerPage, activeFilter]);

  const handleStudentPageChange = useCallback((page: number) => {
    setStudentCurrentPage(page);
  }, []);

  const handleStudentRowsPerPageChange = useCallback((rows: number) => {
    setStudentRowsPerPage(rows);
    setStudentCurrentPage(1);
  }, []);

  const handleSearchInputChange = useCallback((value: string) => {
    setStudentSearchInput(value);
    setStudentCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((filter: FilterType) => {
    setActiveFilter(filter);
    setStudentCurrentPage(1);
  }, [setActiveFilter]);

  return {
    students,
    totalStudents,
    studentRowsPerPage,
    studentCurrentPage,
    isStudentsLoading,
    studentSearchInput,
    activeFilter,
    loadStudents,
    refreshStudents,
    handleStudentPageChange,
    handleStudentRowsPerPageChange,
    handleSearchInputChange,
    handleFilterChange,
  };
};