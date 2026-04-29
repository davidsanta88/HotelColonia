const { poolPromise, sql } = require('./config/db');

async function test() {
    const pool = await poolPromise;
    
    const cols = await pool.request().query(
        "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='productos' ORDER BY ORDINAL_POSITION"
    );
    console.log('Columnas:', cols.recordset.map(function(c) { return c.COLUMN_NAME; }).join(', '));

    const prods = await pool.request().query('SELECT TOP 3 id, nombre, activo FROM productos');
    console.log('Productos:', JSON.stringify(prods.recordset));
    process.exit(0);
}

test().catch(function(e) { console.error('ERROR:', e.message); process.exit(1); });

