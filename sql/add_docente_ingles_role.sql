-- Agrega el valor 'docente_ingles' al enum user_role
-- Ejecutado: 2026-02-21
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'docente_ingles';

-- NOTA: Para asignar este rol a un usuario, usa:
-- UPDATE profiles SET role = 'docente_ingles' WHERE email = 'correo@ejemplo.com';
