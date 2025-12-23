-- ============================================================
-- MIGRACION: Nueva Estructura de Proyectos
-- Fecha: 2025-12-23
-- Descripción: Agregar soporte para:
--   1. Proyectos multi-área
--   2. Requerimientos e Incidentes
--   3. Procesos y ProcessActivities
--   4. Sub-actividades jerárquicas
-- ============================================================

BEGIN;

-- ============================================================
-- 1. TABLA: project_areas (Proyectos multi-área)
-- ============================================================
CREATE TABLE IF NOT EXISTS project_areas (
    project_id BIGINT UNSIGNED NOT NULL,
    area_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, area_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE,
    INDEX idx_project_areas_project (project_id),
    INDEX idx_project_areas_area (area_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrar datos existentes: asignar proyectos a su área actual
INSERT INTO project_areas (project_id, area_id, created_at)
SELECT id, area_id, NOW()
FROM projects
WHERE area_id IS NOT NULL
ON DUPLICATE KEY UPDATE created_at = VALUES(created_at);

-- ============================================================
-- 2. TABLA: requirements (Requerimientos)
-- ============================================================
CREATE TABLE IF NOT EXISTS requirements (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX idx_requirements_project (project_id),
    INDEX idx_requirements_status (status),
    INDEX idx_requirements_priority (priority),
    INDEX idx_requirements_created_by (created_by),
    INDEX idx_requirements_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. TABLA: incidents (Incidentes)
-- ============================================================
CREATE TABLE IF NOT EXISTS incidents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    reported_by BIGINT UNSIGNED NOT NULL,
    resolved_by BIGINT UNSIGNED NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_incidents_project (project_id),
    INDEX idx_incidents_severity (severity),
    INDEX idx_incidents_status (status),
    INDEX idx_incidents_reported_by (reported_by),
    INDEX idx_incidents_resolved_by (resolved_by),
    INDEX idx_incidents_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. TABLA: processes (Procesos)
-- ============================================================
CREATE TABLE IF NOT EXISTS processes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    
    -- Un proceso puede pertenecer a uno de estos (solo uno debe estar lleno)
    requirement_id BIGINT UNSIGNED NULL,
    incident_id BIGINT UNSIGNED NULL,
    activity_id BIGINT UNSIGNED NULL,
    
    -- Estimaciones
    estimated_hours DECIMAL(10,2) DEFAULT 0.00,
    used_hours DECIMAL(10,2) DEFAULT 0.00,
    
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (requirement_id) REFERENCES requirements(id) ON DELETE CASCADE,
    FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX idx_processes_requirement (requirement_id),
    INDEX idx_processes_incident (incident_id),
    INDEX idx_processes_activity (activity_id),
    INDEX idx_processes_status (status),
    INDEX idx_processes_created_by (created_by),
    INDEX idx_processes_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. TABLA: process_assignments (Usuarios asignados a procesos)
-- ============================================================
CREATE TABLE IF NOT EXISTS process_assignments (
    process_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (process_id, user_id),
    FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_process_assignments_process (process_id),
    INDEX idx_process_assignments_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. TABLA: process_activities (Actividades de procesos)
-- ============================================================
CREATE TABLE IF NOT EXISTS process_activities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    process_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    
    -- Orden y dependencias
    `order` INT DEFAULT 0,
    depends_on_id BIGINT UNSIGNED NULL, -- Dependencia de otra actividad
    
    -- Asignación
    assigned_user_id BIGINT UNSIGNED NOT NULL,
    
    -- Estimaciones
    estimated_hours DECIMAL(10,2) DEFAULT 0.00,
    used_hours DECIMAL(10,2) DEFAULT 0.00,
    
    -- Fechas
    start_date TIMESTAMP NULL,
    end_date TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_id) REFERENCES process_activities(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX idx_process_activities_process (process_id),
    INDEX idx_process_activities_order (`order`),
    INDEX idx_process_activities_depends_on (depends_on_id),
    INDEX idx_process_activities_assigned_user (assigned_user_id),
    INDEX idx_process_activities_status (status),
    INDEX idx_process_activities_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. MODIFICAR TABLA: activities (Agregar soporte para sub-actividades)
-- ============================================================
ALTER TABLE activities 
    ADD COLUMN parent_activity_id BIGINT UNSIGNED NULL AFTER calendar_event_id,
    ADD COLUMN process_id BIGINT UNSIGNED NULL AFTER parent_activity_id,
    ADD INDEX idx_activities_parent (parent_activity_id),
    ADD INDEX idx_activities_process (process_id);

-- Agregar foreign keys para activities (si no existen)
-- Nota: MySQL no permite agregar FK si ya existe, por eso usamos procedimiento
DELIMITER //
CREATE PROCEDURE add_activity_fks()
BEGIN
    -- Verificar si la FK parent_activity_id no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.TABLE_CONSTRAINTS 
        WHERE CONSTRAINT_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'activities' 
        AND CONSTRAINT_NAME = 'fk_activities_parent'
    ) THEN
        ALTER TABLE activities 
        ADD CONSTRAINT fk_activities_parent 
        FOREIGN KEY (parent_activity_id) REFERENCES activities(id) ON DELETE CASCADE;
    END IF;
    
    -- Verificar si la FK process_id no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.TABLE_CONSTRAINTS 
        WHERE CONSTRAINT_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'activities' 
        AND CONSTRAINT_NAME = 'fk_activities_process'
    ) THEN
        ALTER TABLE activities 
        ADD CONSTRAINT fk_activities_process 
        FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE SET NULL;
    END IF;
END//
DELIMITER ;

CALL add_activity_fks();
DROP PROCEDURE add_activity_fks;

-- ============================================================
-- 8. ÍNDICES COMPUESTOS ADICIONALES (Optimización de queries)
-- ============================================================

-- Índice compuesto para buscar proyectos por área
CREATE INDEX idx_project_areas_composite ON project_areas(area_id, project_id);

-- Índice compuesto para procesos por estado y tipo
CREATE INDEX idx_processes_status_req ON processes(status, requirement_id);
CREATE INDEX idx_processes_status_inc ON processes(status, incident_id);

-- Índice compuesto para actividades de proceso por estado y usuario
CREATE INDEX idx_process_activities_status_user ON process_activities(status, assigned_user_id);

-- ============================================================
-- VERIFICACIÓN: Mostrar todas las tablas nuevas
-- ============================================================
SELECT 
    'Tablas creadas correctamente:' AS mensaje,
    COUNT(*) AS total_tablas_nuevas
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

-- ============================================================
-- NOTAS IMPORTANTES:
-- ============================================================
-- 1. El campo area_id en projects se mantiene por compatibilidad
--    pero ahora se usa la relación many-to-many en project_areas
-- 
-- 2. Las actividades existentes no se ven afectadas 
--    (parent_activity_id = NULL para actividades principales)
-- 
-- 3. Para rollback, ejecutar: backend/migrations/rollback_new_structure.sql
-- ============================================================
