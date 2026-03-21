const { poolPromise } = require('./config/db');
const fs = require('fs');

async function main() {
    try {
        const pool = await poolPromise;
        const resHab = await pool.request().query('SELECT TOP 1 * FROM habitaciones');
        const resCli = await pool.request().query('SELECT TOP 1 * FROM clientes');
        
        const output = {
            habitaciones: resHab.recordset[0] || 'EMPTY',
            clientes: resCli.recordset[0] || 'EMPTY'
        };
        
        fs.writeFileSync('schema_debug.json', JSON.stringify(output, null, 2));
        console.log('Debug info written to schema_debug.json');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
