-- Script para criar tabela usuario_permissoes no Supabase
-- Execute este script no SQL Editor do Supabase

-- Criar a tabela usuario_permissoes
CREATE TABLE usuario_permissoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  permissao TEXT NOT NULL CHECK (permissao IN ('Admin', 'Recepção')),
  ativo BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Garantir que um usuário só pode ter uma permissão ativa por vez
  UNIQUE(usuario_id, ativo) DEFERRABLE INITIALLY DEFERRED
);

-- Criar índices para melhor performance
CREATE INDEX idx_usuario_permissoes_usuario_id ON usuario_permissoes(usuario_id);
CREATE INDEX idx_usuario_permissoes_ativo ON usuario_permissoes(ativo);
CREATE INDEX idx_usuario_permissoes_permissao ON usuario_permissoes(permissao);

-- Habilitar RLS (Row Level Security)
ALTER TABLE usuario_permissoes ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas suas próprias permissões
-- (ajuste conforme necessário para sua lógica de autenticação)
CREATE POLICY "Usuários podem ver suas próprias permissões" ON usuario_permissoes
  FOR SELECT USING (auth.uid() = usuario_id);

-- Política para admins gerenciarem todas as permissões
-- (você pode ajustar esta política conforme sua lógica)
CREATE POLICY "Admins podem gerenciar todas as permissões" ON usuario_permissoes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM usuario_permissoes up
      JOIN usuarios u ON u.id = up.usuario_id
      WHERE up.usuario_id = auth.uid()
        AND up.permissao = 'Admin'
        AND up.ativo = true
    )
  );

-- Trigger para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuario_permissoes_updated_at
    BEFORE UPDATE ON usuario_permissoes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir permissões iniciais (substitua os IDs pelos IDs reais dos seus usuários)
-- Você precisará pegar os IDs dos usuários da tabela usuarios e substituir aqui

-- Exemplo de como inserir (descomente e ajuste os IDs):
/*
INSERT INTO usuario_permissoes (usuario_id, permissao, ativo) VALUES
  ('SUBSTITUA_PELO_ID_DO_USUARIO_ADMIN', 'Admin', true),
  ('SUBSTITUA_PELO_ID_DO_USUARIO_RECEPCAO', 'Recepção', true);
*/

-- Para pegar os IDs dos usuários existentes, use:
-- SELECT id, nome, email FROM usuarios WHERE ativo = true;
