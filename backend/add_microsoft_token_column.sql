-- Agregar columna microsoft_access_token a la tabla users si no existe
ALTER TABLE users ADD COLUMN IF NOT EXISTS microsoft_access_token TEXT;

-- Verificar que la columna se creó
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'microsoft_access_token';
