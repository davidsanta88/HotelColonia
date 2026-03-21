const { poolPromise } = require('./config/db');

async function run() {
    try {
        const pool = await poolPromise;
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            await transaction.request().query(`
                IF COL_LENGTH('municipios', 'codigo_dane') IS NOT NULL
                BEGIN
                    ALTER TABLE municipios DROP COLUMN codigo_dane;
                END
            `);

            await transaction.commit();
            console.log("Migración completada: Eliminada columna codigo_dane.");
            process.exit(0);
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
