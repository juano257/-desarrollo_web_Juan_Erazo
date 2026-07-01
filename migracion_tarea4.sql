USE club_db;

SET @existe_descripcion = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'actividad'
      AND COLUMN_NAME = 'descripcion'
);

SET @agregar_descripcion = IF(
    @existe_descripcion = 0,
    'ALTER TABLE actividad ADD COLUMN descripcion VARCHAR(500) NOT NULL DEFAULT ''Sin descripcion'' AFTER nombre',
    'SELECT ''La columna descripcion ya existe'' AS mensaje'
);

PREPARE stmt_descripcion FROM @agregar_descripcion;
EXECUTE stmt_descripcion;
DEALLOCATE PREPARE stmt_descripcion;

CREATE TABLE IF NOT EXISTS nota (
    id INT AUTO_INCREMENT PRIMARY KEY,
    actividad_id INT NOT NULL,
    valor TINYINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_nota_valor CHECK (valor BETWEEN 1 AND 7),
    INDEX fk_nota_actividad_idx (actividad_id ASC),
    CONSTRAINT fk_nota_actividad
        FOREIGN KEY (actividad_id)
        REFERENCES actividad (id)
        ON DELETE CASCADE
        ON UPDATE NO ACTION
);
