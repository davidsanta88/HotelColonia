const { poolPromise } = require('./config/db');

async function listTables() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
        result.recordset.forEach(row => {
            console.log(row.TABLE_NAME);
        });
    } catch (err) {
        console.error(err);
    }
    process.exit();
}

listTables();
