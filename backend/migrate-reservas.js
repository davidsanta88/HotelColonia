require('dotenv').config();
const sql = require('mssql');
const { poolPromise } = require('./config/db');

async function migrate() {
    try {
        const pool = await poolPromise;
        console.log('Connected to MSSQL...');

        // 1. Tabla: reservas
        const createReservasTable = `
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='reservas' and xtype='U')
            BEGIN
                CREATE TABLE reservas (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    cliente_id INT NOT NULL,
                    numero_personas INT NOT NULL DEFAULT 1,
                    valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
                    valor_abonado DECIMAL(10,2) NOT NULL DEFAULT 0,
                    fecha_entrada DATE NOT NULL,
                    fecha_salida DATE NOT NULL,
                    estado VARCHAR(50) NOT NULL DEFAULT 'Confirmada',
                    usuario_id INT NULL,
                    FechaCreacion DATETIME DEFAULT GETDATE(),
                    CONSTRAINT FK_Reserva_Cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id)
                );
                PRINT 'Tabla reservas creada.';
            END
            ELSE
            BEGIN
                PRINT 'Tabla reservas ya existe.';
            END
        `;
        await pool.request().query(createReservasTable);

        // 2. Tabla: reservas_habitaciones (N:M)
        const createReservasHabitacionesTable = `
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='reservas_habitaciones' and xtype='U')
            BEGIN
                CREATE TABLE reservas_habitaciones (
                    reserva_id INT NOT NULL,
                    habitacion_id INT NOT NULL,
                    precio_acordado DECIMAL(10,2) NOT NULL DEFAULT 0,
                    PRIMARY KEY (reserva_id, habitacion_id),
                    CONSTRAINT FK_ReservaHab_Reserva FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
                    CONSTRAINT FK_ReservaHab_Habitacion FOREIGN KEY (habitacion_id) REFERENCES habitaciones(id)
                );
                PRINT 'Tabla reservas_habitaciones creada.';
            END
            ELSE
            BEGIN
                PRINT 'Tabla reservas_habitaciones ya existe.';
            END
        `;
        await pool.request().query(createReservasHabitacionesTable);

        // 3. Revisar si usuario_id de auditoría está en reservas (en caso de que ya existiera sin ella)
        const alterUsuarioId = `
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'usuario_id' AND Object_ID = Object_ID(N'reservas'))
            BEGIN
                ALTER TABLE reservas ADD usuario_id INT NULL;
            END
        `;
        await pool.request().query(alterUsuarioId);

        console.log('Migración de Módulo de Reservas completada exitosamente.');
        process.exit(0);
    } catch (err) {
        console.error('Error crítico durante la migración de Reservas:', err.message);
        process.exit(1);
    }
}

migrate();

