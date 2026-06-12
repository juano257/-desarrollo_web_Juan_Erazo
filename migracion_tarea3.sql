USE club_db;

SET @existe_comuna = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'miembro'
      AND COLUMN_NAME = 'comuna'
);

SET @agregar_comuna = IF(
    @existe_comuna = 0,
    'ALTER TABLE miembro ADD COLUMN comuna VARCHAR(120) NOT NULL DEFAULT ''Sin comuna''',
    'SELECT ''La columna comuna ya existe'' AS mensaje'
);

PREPARE stmt FROM @agregar_comuna;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS comentario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    texto VARCHAR(300) NOT NULL,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actividad_id INT NOT NULL,
    INDEX fk_comentario_actividad1_idx (actividad_id ASC),
    CONSTRAINT fk_comentario_actividad1
        FOREIGN KEY (actividad_id)
        REFERENCES actividad (id)
        ON DELETE CASCADE
        ON UPDATE NO ACTION
);
