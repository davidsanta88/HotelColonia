const { poolPromise, sql } = require('./config/db');

async function run() {
    try {
        const pool = await poolPromise;
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // 1. Crear tabla tipos_habitacion
            await transaction.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tipos_habitacion' and xtype='U')
                BEGIN
                    CREATE TABLE tipos_habitacion (
                        id INT IDENTITY(1,1) PRIMARY KEY,
                        nombre VARCHAR(50) NOT NULL UNIQUE
                    );
                END
            `);

            // 2. Insertar valores por defecto si no existen
            await transaction.request().query(`
                IF NOT EXISTS (SELECT * FROM tipos_habitacion WHERE nombre = 'Simple')
                BEGIN
                    INSERT INTO tipos_habitacion (nombre) VALUES ('Simple'), ('Doble'), ('Suite');
                END
            `);

            // 3. Añadir columna tipo_id a habitaciones si no existe
            await transaction.request().query(`
                IF COL_LENGTH('habitaciones', 'tipo_id') IS NULL
                BEGIN
                    ALTER TABLE habitaciones ADD tipo_id INT;
                END
            `);

            // 4. Mapear datos existentes (actualizar tipo_id basado en tipo de texto)
            await transaction.request().query(`
                UPDATE h
                SET h.tipo_id = t.id
                FROM habitaciones h
                INNER JOIN tipos_habitacion t ON h.tipo = t.nombre COLLATE SQL_Latin1_General_CP1_CI_AS
                WHERE h.tipo_id IS NULL AND h.tipo IS NOT NULL;
            `);

            // 5. Eliminar la columna tipo de texto si existe
            await transaction.request().query(`
                IF COL_LENGTH('habitaciones', 'tipo') IS NOT NULL
                BEGIN
                    ALTER TABLE habitaciones DROP COLUMN tipo;
                END
            `);

            // 6. Agregar FK constraints si no existe (opcional para no enredar con nombres randomizados, pero buena practica)
            // No agregaremos constrain estricto para no tener problemas de naming, pero lo controlamos por controlador.

            await transaction.commit();
            console.log("Migración completada: Tabla de tipos_habitacion creada y datos migrados.");
            process.exit(0);
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (e) {
        console.error("Error en migracion:", e);
        process.exit(1);
    }
}
run();
