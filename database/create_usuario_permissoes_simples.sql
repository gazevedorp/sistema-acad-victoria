-- Script para criar tabela de PERMISSÕES por CATEGORIA de usuário
-- Execute no SQL Editor do Supabase

-- Criar tabela de permissões específicas por categoria
CREATE TABLE categoria_permissoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria_usuario TEXT NOT NULL CHECK (categoria_usuario IN ('admin', 'recepcao')),
  modulo TEXT NOT NULL, -- Nome do módulo/funcionalidade
  permissao TEXT NOT NULL, -- Tipo de permissão (visualizar, criar, editar, excluir)
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  -- Garantir que não há duplicatas
  UNIQUE(categoria_usuario, modulo, permissao)
);

-- Criar índices
CREATE INDEX ON categoria_permissoes(categoria_usuario);
CREATE INDEX ON categoria_permissoes(modulo);
CREATE INDEX ON categoria_permissoes(ativo);

-- Inserir permissões padrão para admin (acesso total)
INSERT INTO categoria_permissoes (categoria_usuario, modulo, permissao) VALUES
-- Dashboard/Home
('admin', 'home', 'visualizar'),
('admin', 'home', 'criar'),
('admin', 'home', 'editar'),
('admin', 'home', 'excluir'),

-- Clientes
('admin', 'clientes', 'visualizar'),
('admin', 'clientes', 'criar'),
('admin', 'clientes', 'editar'),
('admin', 'clientes', 'excluir'),

-- Planos
('admin', 'planos', 'visualizar'),
('admin', 'planos', 'criar'),
('admin', 'planos', 'editar'),
('admin', 'planos', 'excluir'),

-- Modalidades
('admin', 'modalidades', 'visualizar'),
('admin', 'modalidades', 'criar'),
('admin', 'modalidades', 'editar'),
('admin', 'modalidades', 'excluir'),

-- Turmas
('admin', 'turmas', 'visualizar'),
('admin', 'turmas', 'criar'),
('admin', 'turmas', 'editar'),
('admin', 'turmas', 'excluir'),

-- Produtos
('admin', 'produtos', 'visualizar'),
('admin', 'produtos', 'criar'),
('admin', 'produtos', 'editar'),
('admin', 'produtos', 'excluir'),

-- Usuários
('admin', 'usuarios', 'visualizar'),
('admin', 'usuarios', 'criar'),
('admin', 'usuarios', 'editar'),
('admin', 'usuarios', 'excluir'),

-- Caixa
('admin', 'caixa', 'visualizar'),
('admin', 'caixa', 'criar'),
('admin', 'caixa', 'editar'),
('admin', 'caixa', 'excluir'),

-- Relatórios
('admin', 'relatorios', 'visualizar'),
('admin', 'relatorios', 'criar'),
('admin', 'relatorios', 'editar'),
('admin', 'relatorios', 'excluir'),

-- Permissões (só admin pode gerenciar)
('admin', 'permissoes', 'visualizar'),
('admin', 'permissoes', 'criar'),
('admin', 'permissoes', 'editar'),
('admin', 'permissoes', 'excluir');

-- Inserir permissões para recepcao (acesso limitado)
INSERT INTO categoria_permissoes (categoria_usuario, modulo, permissao) VALUES
-- Dashboard/Home
('recepcao', 'home', 'visualizar'),

-- Clientes (pode gerenciar clientes)
('recepcao', 'clientes', 'visualizar'),
('recepcao', 'clientes', 'criar'),
('recepcao', 'clientes', 'editar'),

-- Planos (só visualizar)
('recepcao', 'planos', 'visualizar'),

-- Modalidades (só visualizar)
('recepcao', 'modalidades', 'visualizar'),

-- Turmas (só visualizar)
('recepcao', 'turmas', 'visualizar'),

-- Produtos (só visualizar)
('recepcao', 'produtos', 'visualizar'),

-- Caixa (pode operar)
('recepcao', 'caixa', 'visualizar'),
('recepcao', 'caixa', 'criar'),
('recepcao', 'caixa', 'editar'),

-- Relatórios (só visualizar básicos)
('recepcao', 'relatorios', 'visualizar');
