const { poolPromise } = require('./config/db');

async function migrate() {
    try {
        const pool = await poolPromise;
        console.log("Renaming 'reservas' to 'registros'...");
        await pool.request().query(`EXEC sp_rename 'reservas', 'registros';`);
        
        console.log("Renaming 'reserva_huespedes' to 'registros_huespedes'...");
        await pool.request().query(`EXEC sp_rename 'reserva_huespedes', 'registros_huespedes';`);
        
        console.log("Renaming 'registros_huespedes.reserva_id' to 'registro_id'...");
        await pool.request().query(`EXEC sp_rename 'registros_huespedes.reserva_id', 'registro_id', 'COLUMN';`);
        
        console.log("✅ Database renamed successfully");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    }
}
migrate();

