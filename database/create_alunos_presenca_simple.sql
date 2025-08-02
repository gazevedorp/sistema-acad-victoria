-- Script SQL simples para criação da tabela alunos_presenca

CREATE TABLE IF NOT EXISTS public.alunos_presenca (
    codigo BIGSERIAL PRIMARY KEY,
    codigo_aluno UUID NOT NULL,
    data TEXT NOT NULL,
    hora_entrada TEXT NOT NULL,
    descricao TEXT
);

-- Inserir alguns dados de exemplo
-- Substitua os UUIDs pelos IDs reais dos alunos no seu sistema
INSERT INTO public.alunos_presenca (codigo_aluno, data, hora_entrada, descricao) VALUES
('550e8400-e29b-41d4-a716-446655440001', '2025-08-01', '08:00', 'Presente - Aula de Natação'),
('550e8400-e29b-41d4-a716-446655440001', '2025-08-02', '08:15', 'Presente - Aula de Natação'),
('550e8400-e29b-41d4-a716-446655440002', '2025-08-01', '14:00', 'Presente - Aula de Musculação'),
('550e8400-e29b-41d4-a716-446655440002', '2025-08-02', '14:30', 'Atrasado - Aula de Musculação');
