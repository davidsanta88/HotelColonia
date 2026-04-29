const { poolPromise, sql } = require('./config/db');

async function checkSchema() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'productos'
            ORDER BY COLUMN_NAME
        `);
        console.log('--- SCHEMA START ---');
        result.recordset.forEach(col => {
            console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE}(${col.CHARACTER_MAXIMUM_LENGTH}) - Nullable: ${col.IS_NULLABLE}`);
        });
        console.log('--- SCHEMA END ---');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();

