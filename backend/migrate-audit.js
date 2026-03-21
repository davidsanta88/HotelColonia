const { poolPromise } = require('./config/db');
const fs = require('fs');
const path = require('path');

async function run() {
    try {
        const pool = await poolPromise;
        const sqlPath = path.join(__dirname, '../database/migrate_audit.sql');
        const sqlQuery = fs.readFileSync(sqlPath, 'utf8');

        // mssql doesn't like GO statements in a single query call
        const statements = sqlQuery.split(/GO\s*$/m);

        for (let statement of statements) {
            if (statement.trim()) {
                await pool.request().query(statement);
            }
        }

        console.log("Migracion de auditoria completa exitosamente.");
        process.exit(0);
    } catch (e) {
        console.error("Error durante la migracion:", e);
        process.exit(1);
    }
}

run();
