const { poolPromise, sql } = require('./config/db');

async function migrate() {
    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        console.log("Creating 'medios_pago' table...");
        await transaction.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='medios_pago' and xtype='U')
            BEGIN
                CREATE TABLE medios_pago (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    nombre VARCHAR(100) NOT NULL UNIQUE
                )
            END
        `);

        console.log("Inserting default payment methods...");
        await transaction.request().query(`
            IF NOT EXISTS (SELECT * FROM medios_pago)
            BEGIN
                INSERT INTO medios_pago (nombre) VALUES 
                ('EFECTIVO'),
                ('TRANSFERENCIA BANCOLOMBIA'),
                ('TARJETA DE CREDITO / DEBITO'),
                ('NEQUI'),
                ('DAVIPLATA');
            END
        `);

        console.log("Adding payment and billing columns to 'registros' table...");
        await transaction.request().query(`
            IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'medio_pago_id' AND Object_ID = Object_ID(N'registros'))
            BEGIN
                ALTER TABLE registros ADD medio_pago_id INT NULL;
                ALTER TABLE registros ADD CONSTRAINT FK_Registros_MediosPago FOREIGN KEY (medio_pago_id) REFERENCES medios_pago(id);
            END
            
            IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'valor_cobrado' AND Object_ID = Object_ID(N'registros'))
            BEGIN
                ALTER TABLE registros ADD valor_cobrado DECIMAL(10,2) NULL;
            END

            IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'valor_pagado' AND Object_ID = Object_ID(N'registros'))
            BEGIN
                ALTER TABLE registros ADD valor_pagado DECIMAL(10,2) NULL;
            END
        `);

        await transaction.commit();
        console.log("✅ Database migrated successfully (Payment Methods & Billing Details)");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    }
}
migrate();
