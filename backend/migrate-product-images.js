const { poolPromise, sql } = require('./config/db');

async function migrate() {
    try {
        const pool = await poolPromise;
        console.log('Iniciando migración para agregar imagen_url a productos...');

        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                           WHERE TABLE_NAME = 'productos' AND COLUMN_NAME = 'imagen_url')
            BEGIN
                ALTER TABLE productos ADD imagen_url VARCHAR(MAX) NULL;
                PRINT 'Columna imagen_url agregada a productos';
            END
        `);

        console.log('Migración completada con éxito.');
        process.exit(0);
    } catch (err) {
        console.error('Error durante la migración:', err);
        process.exit(1);
    }
}

migrate();
