const { poolPromise, sql } = require('./config/db');

async function migrate() {
    try {
        const pool = await poolPromise;
        console.log('Iniciando migración para agregar tipo_inventario a productos...');

        // 1. Agregar columna tipo_inventario si no existe
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                           WHERE TABLE_NAME = 'productos' AND COLUMN_NAME = 'tipo_inventario')
            BEGIN
                ALTER TABLE productos ADD tipo_inventario VARCHAR(50) DEFAULT 'venta';
                PRINT 'Columna tipo_inventario agregada a productos';
            END
        `);

        // 2. Asegurarse que los productos existentes tengan 'venta'
        await pool.request().query(`
            UPDATE productos SET tipo_inventario = 'venta' WHERE tipo_inventario IS NULL;
        `);

        console.log('Migración completada con éxito.');
        process.exit(0);
    } catch (err) {
        console.error('Error durante la migración:', err);
        process.exit(1);
    }
}

migrate();

