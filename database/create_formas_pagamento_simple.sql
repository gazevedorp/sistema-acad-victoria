-- Script simples para criar tabela formas_pagamento no Supabase
-- Versão simplificada sem RLS

-- Criar tabela
CREATE TABLE formas_pagamento (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao VARCHAR(255),
  ativo_venda BOOLEAN DEFAULT true NOT NULL,
  ativo_mensalidade BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Trigger para updated_at
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

-- Inserir PIX e Dinheiro
INSERT INTO formas_pagamento (nome, descricao, ativo_venda, ativo_mensalidade) VALUES
('PIX', 'Pagamento instantâneo via PIX', true, true),
('Dinheiro', 'Pagamento em espécie', true, true);

-- Verificar
SELECT * FROM formas_pagamento;
