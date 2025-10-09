import { create } from 'zustand';

type FilterType = 'todos' | 'ativos' | 'bloqueados' | 'encerrados' | 'antigos';

interface StudentsState {
  totalStudents: number;
  activeFilter: FilterType;
  isLoading: boolean;
  
  // Actions
  setTotalStudents: (total: number) => void;
  setActiveFilter: (filter: FilterType) => void;
  setIsLoading: (loading: boolean) => void;
  
  // Helper functions
  getFilterLabel: () => string;
}

export const useStudentsStore = create<StudentsState>((set, get) => ({
  totalStudents: 0,
  activeFilter: 'ativos', // Padrão: Ativos
  isLoading: false,
  
  setTotalStudents: (total: number) => set({ totalStudents: total }),
  setActiveFilter: (filter: FilterType) => set({ activeFilter: filter }),
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  
  getFilterLabel: () => {
    const filter = get().activeFilter;
    switch (filter) {
      case 'todos':
        return 'Alunos (Todos)';
      case 'ativos':
        return 'Alunos Ativos';
      case 'bloqueados':
        return 'Alunos Bloqueados';
      case 'encerrados':
        return 'Alunos Encerrados';
      case 'antigos':
        return 'Alunos Não Matriculados';
      default:
        return 'Alunos';
    }
  }
}));