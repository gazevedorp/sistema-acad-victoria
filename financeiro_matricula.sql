-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the financeiro_matricula table
CREATE TABLE financeiro_matricula (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_matricula UUID NOT NULL,
    id_caixa UUID,
    id_aluno UUID NOT NULL,
    vencimento DATE NOT NULL,
    valor_total NUMERIC NOT NULL,
    pago BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT fk_matricula
        FOREIGN KEY(id_matricula)
        REFERENCES matriculas(id),
    CONSTRAINT fk_caixa
        FOREIGN KEY(id_caixa)
        REFERENCES caixas(id),
    CONSTRAINT fk_aluno
        FOREIGN KEY(id_aluno)
        REFERENCES alunos(id)
);

-- Create the trigger to update updated_at on row updates
CREATE TRIGGER trigger_update_financeiro_matricula_updated_at
BEFORE UPDATE ON financeiro_matricula
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Note:
-- Make sure the referenced tables (matriculas, caixas, alunos) and their primary keys (id)
-- exist before running this script.
-- The caixas(id) foreign key is nullable as per the requirements.
-- The uuid-ossp extension is used for uuid_generate_v4(). If you have another way
-- to generate UUIDs (e.g., pgcrypto's gen_random_uuid()), you can adjust accordingly.
-- For example, with pgcrypto:
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- And change DEFAULT uuid_generate_v4() to DEFAULT gen_random_uuid().
-- This script assumes that the user running it has the necessary permissions
-- to create extensions, tables, functions, and triggers.
