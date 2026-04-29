const { poolPromise, sql } = require('./config/db');

async function migrate() {
    try {
        const pool = await poolPromise;
        console.log('Iniciando migración de Gastos e Ingresos...');

        // 1. Agregar columna tipo a categorias_gastos si no existe
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns 
                           WHERE object_id = OBJECT_ID('categorias_gastos') 
                           AND name = 'tipo')
            BEGIN
                ALTER TABLE categorias_gastos ADD tipo VARCHAR(20) DEFAULT 'Gasto';
            END
        `);
        console.log('Columna "tipo" verificada/agregada a categorias_gastos');

        // 2. Agregar columna tipo a gastos si no existe
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns 
                           WHERE object_id = OBJECT_ID('gastos') 
                           AND name = 'tipo')
            BEGIN
                ALTER TABLE gastos ADD tipo VARCHAR(20) DEFAULT 'Gasto';
            END
        `);
        console.log('Columna "tipo" verificada/agregada a gastos');

        // 3. Asegurar que los registros existentes tengan 'Gasto'
        await pool.request().query("UPDATE categorias_gastos SET tipo = 'Gasto' WHERE tipo IS NULL");
        await pool.request().query("UPDATE gastos SET tipo = 'Gasto' WHERE tipo IS NULL");
        console.log('Registros existentes normalizados como "Gasto"');

        // 4. Crear una categoría de ejemplo para ingresos
        const checkIngreso = await pool.request().query("SELECT id FROM categorias_gastos WHERE nombre = 'Otros Ingresos' AND tipo = 'Ingreso'");
        if (checkIngreso.recordset.length === 0) {
            await pool.request().query("INSERT INTO categorias_gastos (nombre, descripcion, tipo, UsuarioCreacion) VALUES ('Servicios Adicionales (Lavandería, etc)', 'Ingresos por servicios extras del hotel', 'Ingreso', 'Sistema')");
            console.log('Categoría base de ingresos creada.');
        }

        console.log('Migración completada exitosamente.');
        process.exit(0);
    } catch (err) {
        console.error('Error en migración:', err);
        process.exit(1);
    }
}

migrate();

