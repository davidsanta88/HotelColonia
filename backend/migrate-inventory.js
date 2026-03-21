const { poolPromise } = require('./config/db');
const fs = require('fs');
const path = require('path');

async function migrate() {
    try {
        const pool = await poolPromise;
        const sqlPath = path.join(__dirname, '../database/schema_v6_inventory.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Split by GO if necessary, but mssql can handle multiple statements if not using GO
        // We'll split by GO to be safe
        const statements = sqlContent.split(/\bGO\b/i);

        console.log("Starting Inventory Migration...");

        for (let statement of statements) {
            if (statement.trim()) {
                await pool.request().query(statement);
            }
        }

        console.log("✅ Inventory Migration completed successfully");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    }
}

migrate();
