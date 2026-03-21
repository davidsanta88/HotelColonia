const { poolPromise } = require('./config/db');

async function run() {
    try {
        const pool = await poolPromise;
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='reserva_huespedes' and xtype='U')
            BEGIN
                CREATE TABLE reserva_huespedes (
                    reserva_id INT NOT NULL,
                    cliente_id INT NOT NULL,
                    PRIMARY KEY (reserva_id, cliente_id),
                    FOREIGN KEY (reserva_id) REFERENCES reservas(id),
                    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
                );
                PRINT 'Tabla reserva_huespedes creada.';
            END
            ELSE
            BEGIN
                PRINT 'Tabla reserva_huespedes ya existia.';
            END
        `);
        console.log("Migracion completa.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
