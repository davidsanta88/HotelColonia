const { poolPromise, sql } = require('./config/db');

async function run() {
    try {
        const pool = await poolPromise;
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // 1. Crear tabla estados_habitacion
            await transaction.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='estados_habitacion' and xtype='U')
                BEGIN
                    CREATE TABLE estados_habitacion (
                        id INT IDENTITY(1,1) PRIMARY KEY,
                        nombre VARCHAR(50) NOT NULL UNIQUE
                    );
                END
            `);

            // 2. Insertar valores por defecto si no existen
            await transaction.request().query(`
                IF NOT EXISTS (SELECT * FROM estados_habitacion WHERE nombre = 'disponible')
                BEGIN
                    INSERT INTO estados_habitacion (nombre) VALUES ('disponible'), ('ocupada'), ('mantenimiento');
                END
            `);

            // 3. Añadir columna estado_id a habitaciones si no existe
            await transaction.request().query(`
                IF COL_LENGTH('habitaciones', 'estado_id') IS NULL
                BEGIN
                    ALTER TABLE habitaciones ADD estado_id INT;
                END
            `);

            // 4. Mapear datos existentes (actualizar estado_id basado en estado de texto)
            await transaction.request().query(`
                UPDATE h
                SET h.estado_id = e.id
                FROM habitaciones h
                INNER JOIN estados_habitacion e ON h.estado = e.nombre COLLATE SQL_Latin1_General_CP1_CI_AS
                WHERE h.estado_id IS NULL AND h.estado IS NOT NULL;
            `);

            // 5. Eliminar la columna estado de texto si existe
            await transaction.request().query(`
                IF COL_LENGTH('habitaciones', 'estado') IS NOT NULL
                BEGIN
                    ALTER TABLE habitaciones DROP CONSTRAINT IF EXISTS DF__habitacio__estad__3E52440B; -- The constraint might vary, just dropping the column should work.
                    ALTER TABLE habitaciones DROP COLUMN estado;
                END
            `);

            await transaction.commit();
            console.log("Migración completada: Tabla de estados_habitacion creada y datos migrados.");
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
