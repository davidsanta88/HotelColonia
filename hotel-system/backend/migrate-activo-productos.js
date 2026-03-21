const { poolPromise } = require('./config/db');

async function migrate() {
    try {
        const pool = await poolPromise;

        // Verificar si la columna ya existe
        const check = await pool.request().query(`
            SELECT COUNT(*) as cnt 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'productos' AND COLUMN_NAME = 'activo'
        `);

        if (check.recordset[0].cnt > 0) {
            console.log('✅ La columna "activo" ya existe en la tabla productos.');
            process.exit(0);
        }

        await pool.request().query(`
            ALTER TABLE productos ADD activo BIT NOT NULL DEFAULT 1
        `);

        console.log('✅ Columna "activo" agregada correctamente. Todos los productos existentes quedan como activos.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error en migración:', err.message);
        process.exit(1);
    }
}

migrate();
