const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const { poolPromise, sql } = require('./backend/config/db');

async function initTable() {
    try {
        const pool = await poolPromise;
        
        console.log('Verificando tabla solicitudes_reserva...');
        
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='solicitudes_reserva' AND xtype='U')
            CREATE TABLE solicitudes_reserva (
                id INT PRIMARY KEY IDENTITY(1,1),
                nombre NVARCHAR(100),
                celular NVARCHAR(20) NOT NULL,
                correo NVARCHAR(100),
                num_huespedes INT DEFAULT 1,
                fecha_llegada DATE,
                estado NVARCHAR(20) DEFAULT 'PENDIENTE',
                created_at DATETIME DEFAULT GETDATE()
            )
        `);
        
        console.log('Tabla solicitudes_reserva lista.');
        process.exit(0);
    } catch (err) {
        console.error('Error creando tabla:', err);
        process.exit(1);
    }
}

initTable();
