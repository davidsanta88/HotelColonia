const { poolPromise, sql } = require('./config/db');
const fs = require('fs');

async function checkSchema() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'productos'
            ORDER BY COLUMN_NAME
        `);
        const schema = result.recordset.map(col => `${col.COLUMN_NAME}: ${col.DATA_TYPE}(${col.CHARACTER_MAXIMUM_LENGTH}) - Nullable: ${col.IS_NULLABLE}`).join('\n');
        fs.writeFileSync('productos_full_schema.txt', schema);
        console.log('Schema saved to productos_full_schema.txt');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
