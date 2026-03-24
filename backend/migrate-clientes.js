const { poolPromise } = require('./config/db');

async function run() {
    try {
        const pool = await poolPromise;
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // 1. Create municipios table
            await transaction.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='municipios' and xtype='U')
                BEGIN
                    CREATE TABLE municipios (
                        id INT IDENTITY(1,1) PRIMARY KEY,
                        nombre VARCHAR(100) NOT NULL UNIQUE
                    );
                    PRINT 'Tabla municipios creada.';
                    
                    -- Insert default values
                    INSERT INTO municipios (nombre) VALUES ('ANTIOQUIA-MEDELLIN'), ('ANTIOQUIA-FREDONIA'), ('BOGOTÁ-BOGOTÁ');
                END
            `);

            // 2. Add columns to clientes table if they don't exist
            await transaction.request().query(`
                IF COL_LENGTH('clientes', 'tipo_documento') IS NULL
                BEGIN
                    ALTER TABLE clientes ADD tipo_documento VARCHAR(20) DEFAULT 'CC';
                END
            `);

            await transaction.request().query(`
                IF COL_LENGTH('clientes', 'municipio_origen_id') IS NULL
                BEGIN
                    ALTER TABLE clientes ADD municipio_origen_id INT;
                    ALTER TABLE clientes ADD CONSTRAINT FK_Cliente_Municipio FOREIGN KEY (municipio_origen_id) REFERENCES municipios(id);
                END
            `);

            await transaction.commit();
            console.log("Migracion de clientes y municipios completa.");
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
