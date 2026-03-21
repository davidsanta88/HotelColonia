const { poolPromise, sql } = require('./config/db');

async function run() {
    try {
        const pool = await poolPromise;
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // 1. Crear tabla habitaciones_fotos
            await transaction.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='habitaciones_fotos' and xtype='U')
                BEGIN
                    CREATE TABLE habitaciones_fotos (
                        id INT IDENTITY(1,1) PRIMARY KEY,
                        habitacion_id INT NOT NULL,
                        url VARCHAR(MAX) NOT NULL,
                        created_at DATETIME DEFAULT GETDATE(),
                        FOREIGN KEY (habitacion_id) REFERENCES habitaciones(id) ON DELETE CASCADE
                    );
                END
            `);

            await transaction.commit();
            console.log("Migración completada: Tabla 'habitaciones_fotos' creada satisfactoriamente.");
            process.exit(0);
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (e) {
        console.error("Error en migracion de fotos:", e);
        process.exit(1);
    }
}
run();
