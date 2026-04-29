const { poolPromise } = require('./config/db');

async function run() {
    try {
        const pool = await poolPromise;
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            await transaction.request().query(`
                IF COL_LENGTH('municipios', 'codigo_dane') IS NULL
                BEGIN
                    ALTER TABLE municipios ADD codigo_dane VARCHAR(20);
                END
            `);

            await transaction.request().query(`
                IF COL_LENGTH('municipios', 'visualizar') IS NULL
                BEGIN
                    ALTER TABLE municipios ADD visualizar BIT DEFAULT 1;
                END
            `);

            // Set default value for existing rows
            await transaction.request().query(`
                UPDATE municipios SET visualizar = 1 WHERE visualizar IS NULL;
            `);

            await transaction.commit();
            console.log("Migración de tabla municipios (DANE y visualizar) completada.");
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

