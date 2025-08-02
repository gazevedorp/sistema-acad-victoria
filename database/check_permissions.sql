-- Script para verificar as permissões no banco
-- Execute no SQL Editor do Supabase

-- Verificar se a tabela categoria_permissoes existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'categoria_permissoes';

-- Verificar as permissões existentes
SELECT categoria_usuario, modulo, permissao, ativo
FROM categoria_permissoes
ORDER BY categoria_usuario, modulo, permissao;

-- Verificar permissões específicas para planos
SELECT * FROM categoria_permissoes 
WHERE modulo = 'planos';

-- Verificar permissões para templates_fechamento
SELECT * FROM categoria_permissoes 
WHERE modulo = 'templates_fechamento';

-- Verificar todas as categorias únicas
SELECT DISTINCT categoria_usuario FROM categoria_permissoes;
