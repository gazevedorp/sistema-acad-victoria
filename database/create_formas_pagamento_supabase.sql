-- Script para criar tabela formas_pagamento no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Criar a tabela formas_pagamento
CREATE TABLE IF NOT EXISTS formas_pagamento (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao VARCHAR(255),
  ativo_venda BOOLEAN DEFAULT true NOT NULL,
  ativo_mensalidade BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_formas_pagamento_nome ON formas_pagamento(nome);
CREATE INDEX IF NOT EXISTS idx_formas_pagamento_ativo_venda ON formas_pagamento(ativo_venda);
CREATE INDEX IF NOT EXISTS idx_formas_pagamento_ativo_mensalidade ON formas_pagamento(ativo_mensalidade);

-- 3. Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_formas_pagamento_updated_at 
    BEFORE UPDATE ON formas_pagamento 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Inserir dados iniciais (PIX e Dinheiro)
INSERT INTO formas_pagamento (nome, descricao, ativo_venda, ativo_mensalidade) VALUES
('PIX', 'Pagamento instantâneo via PIX', true, true),
('Dinheiro', 'Pagamento em espécie', true, true)
ON CONFLICT (nome) DO NOTHING;

-- 5. Configurar Row Level Security (RLS) - opcional mas recomendado
ALTER TABLE formas_pagamento ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários autenticados
CREATE POLICY "Allow read access for authenticated users" ON formas_pagamento
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir inserção para usuários autenticados
CREATE POLICY "Allow insert for authenticated users" ON formas_pagamento
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir atualização para usuários autenticados
CREATE POLICY "Allow update for authenticated users" ON formas_pagamento
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para permitir exclusão para usuários autenticados (opcional)
CREATE POLICY "Allow delete for authenticated users" ON formas_pagamento
    FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Verificar se os dados foram inseridos corretamente
SELECT id, nome, descricao, ativo_venda, ativo_mensalidade, created_at 
FROM formas_pagamento 
ORDER BY nome;
