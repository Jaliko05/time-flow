-- ============================================================
-- ROLLBACK: Nueva Estructura de Proyectos
-- Fecha: 2025-12-23
-- Descripción: Revertir los cambios de add_new_structure.sql
-- ============================================================

BEGIN;

-- ============================================================
-- ELIMINAR TABLAS EN ORDEN INVERSO (por dependencias)
-- ============================================================

-- 1. Eliminar process_activities (depende de processes)
DROP TABLE IF EXISTS process_activities;

-- 2. Eliminar process_assignments (depende de processes)
DROP TABLE IF EXISTS process_assignments;

-- 3. Eliminar processes (depende de requirements, incidents, activities)
DROP TABLE IF EXISTS processes;

-- 4. Eliminar incidents (depende de projects)
DROP TABLE IF EXISTS incidents;

-- 5. Eliminar requirements (depende de projects)
DROP TABLE IF EXISTS requirements;

-- 6. Eliminar project_areas (depende de projects y areas)
DROP TABLE IF EXISTS project_areas;

-- ============================================================
-- REVERTIR CAMBIOS EN TABLA activities
-- ============================================================

-- Eliminar columnas agregadas
ALTER TABLE activities 
    DROP FOREIGN KEY IF EXISTS fk_activities_parent,
    DROP FOREIGN KEY IF EXISTS fk_activities_process,
    DROP INDEX IF EXISTS idx_activities_parent,
    DROP INDEX IF EXISTS idx_activities_process,
    DROP COLUMN IF EXISTS process_id,
    DROP COLUMN IF EXISTS parent_activity_id;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
SELECT 
    'Rollback completado correctamente' AS mensaje,
    COUNT(*) AS tablas_eliminadas
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN (
    'project_areas', 
    'requirements', 
    'incidents', 
    'processes', 
    'process_assignments', 
    'process_activities'
);

COMMIT;
