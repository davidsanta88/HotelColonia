const { poolPromise } = require('./config/db');
const fs = require('fs');

async function main() {
    try {
        const pool = await poolPromise;
        const resCat = await pool.request().query('SELECT TOP 1 * FROM categorias_gastos');
        const resGas = await pool.request().query('SELECT TOP 1 * FROM gastos');
        
        fs.writeFileSync('gastos_debug.json', JSON.stringify({
            categorias_gastos: resCat.recordset[0] || 'EMPTY',
            gastos: resGas.recordset[0] || 'EMPTY'
        }, null, 2));
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
main();
