const { poolPromise } = require('./config/db');
const fs = require('fs');

async function main() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query('SELECT * FROM roles_permisos WHERE rol_id != 1');
        fs.writeFileSync('permisos_debug.json', JSON.stringify(res.recordset, null, 2));
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
main();

