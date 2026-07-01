USE club_db;

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
