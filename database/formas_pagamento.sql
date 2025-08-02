-- Estrutura da tabela formas_pagamento
-- Este arquivo é apenas para referência da estrutura necessária

CREATE TABLE IF NOT EXISTS formas_pagamento (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao VARCHAR(255),
  ativo_venda BOOLEAN DEFAULT true NOT NULL,
  ativo_mensalidade BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_formas_pagamento_ativo_venda ON formas_pagamento(ativo_venda);
CREATE INDEX IF NOT EXISTS idx_formas_pagamento_ativo_mensalidade ON formas_pagamento(ativo_mensalidade);

-- Trigger para atualizar updated_at automaticamente
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

-- Exemplos de dados iniciais
INSERT INTO formas_pagamento (nome, descricao, ativo_venda, ativo_mensalidade) VALUES
('Dinheiro', 'Pagamento em espécie', true, true),
('PIX', 'Pagamento instantâneo via PIX', true, true),
('Cartão de Débito', 'Pagamento com cartão de débito', true, false),
('Cartão de Crédito', 'Pagamento com cartão de crédito', true, false),
('Boleto', 'Pagamento via boleto bancário', false, true);
