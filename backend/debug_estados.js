const { poolPromise } = require('./config/db');
const fs = require('fs');

async function main() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query('SELECT * FROM estados_habitacion');
        
        fs.writeFileSync('estados_debug.json', JSON.stringify(res.recordset, null, 2));
        console.log('Debug info written to estados_debug.json');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
