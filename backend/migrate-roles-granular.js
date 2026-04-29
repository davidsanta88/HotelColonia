require('dotenv').config();
const { poolPromise, sql } = require('./config/db');

async function migrate() {
    try {
        const pool = await poolPromise;
        console.log('Iniciando migración granular de permisos...');

        // 1. Añadir columnas si no existen
        const alterTableQuery = `
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'can_view' AND Object_ID = Object_ID(N'roles_permisos'))
            BEGIN
                ALTER TABLE roles_permisos ADD can_view BIT DEFAULT 1;
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'can_edit' AND Object_ID = Object_ID(N'roles_permisos'))
            BEGIN
                ALTER TABLE roles_permisos ADD can_edit BIT DEFAULT 0;
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'can_delete' AND Object_ID = Object_ID(N'roles_permisos'))
            BEGIN
                ALTER TABLE roles_permisos ADD can_delete BIT DEFAULT 0;
            END
        `;
        await pool.request().query(alterTableQuery);
        console.log('Columnas can_view, can_edit, can_delete procesadas.');

        // 2. Asegurarse de que los registros existentes tengan can_view = 1
        await pool.request().query('UPDATE roles_permisos SET can_view = 1 WHERE can_view IS NULL');

        console.log('Migración de base de datos completada satisfactoriamente.');
        process.exit(0);
    } catch (err) {
        console.error('Error en la migración:', err.message);
        process.exit(1);
    }
}

migrate();

