const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const { poolPromise, sql } = require('./backend/config/db');

async function addNotasColumn() {
    try {
        const pool = await poolPromise;
        
        console.log('Añadiendo columna notas a solicitudes_reserva...');
        
        await pool.request().query(`
            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID('solicitudes_reserva') 
                AND name = 'notas'
            )
            BEGIN
                ALTER TABLE solicitudes_reserva ADD notas NVARCHAR(MAX);
                PRINT 'Columna notas añadida con éxito.';
            END
            ELSE
            BEGIN
                PRINT 'La columna notas ya existe.';
            END
        `);
        
        process.exit(0);
    } catch (err) {
        console.error('Error al añadir columna:', err);
        process.exit(1);
    }
}

addNotasColumn();
