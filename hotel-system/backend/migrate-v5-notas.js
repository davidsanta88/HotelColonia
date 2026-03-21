const { poolPromise } = require('./config/db');

async function migrate() {
    try {
        const pool = await poolPromise;
        
        console.log("Checking if 'notas' column exists in 'registros' table...");
        const columnCheck = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'registros' AND COLUMN_NAME = 'notas'
        `);

        if (columnCheck.recordset.length === 0) {
            console.log("Adding 'notas' column to 'registros' table...");
            await pool.request().query(`
                ALTER TABLE registros
                ADD notas NVARCHAR(MAX) NULL
            `);
            console.log("✅ 'notas' column added successfully.");
        } else {
            console.log("⚠️ 'notas' column already exists. Skipping.");
        }

        console.log("Checking if 'valor_pagado' column exists in 'registros' table...");
        const dropCheck = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'registros' AND COLUMN_NAME = 'valor_pagado'
        `);

        if (dropCheck.recordset.length > 0) {
            console.log("Dropping 'valor_pagado' column from 'registros' table...");
            await pool.request().query(`
                ALTER TABLE registros
                DROP COLUMN valor_pagado
            `);
            console.log("✅ 'valor_pagado' column dropped successfully.");
        } else {
            console.log("⚠️ 'valor_pagado' column does not exist. Skipping.");
        }

        console.log("Migration v5 (Notas) completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    }
}
migrate();
