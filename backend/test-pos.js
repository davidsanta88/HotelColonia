const { poolPromise, sql } = require('./config/db');

async function test() {
    try {
        const pool = await poolPromise;
        console.log('Testing SQL for POS endpoints...\n');

        // 1. Test /productos
        console.log('--- Testing /productos ---');
        const resProd = await pool.request().query('SELECT * FROM productos');
        console.log(`Success: Found ${resProd.recordset.length} productos`);
        console.log('Sample data:', JSON.stringify(resProd.recordset[0], null, 2));

        // 2. Test /medios-pago
        console.log('\n--- Testing /medios-pago ---');
        const resMP = await pool.request().query('SELECT * FROM medios_pago ORDER BY nombre ASC');
        console.log(`Success: Found ${resMP.recordset.length} medios de pago`);

        // 3. Test /registros/activos
        console.log('\n--- Testing /registros/activos ---');
        const resReg = await pool.request().query(`
            SELECT r.id, h.numero as numero_habitacion, c.nombre as nombre_cliente 
            FROM registros r
            JOIN habitaciones h ON r.habitacion_id = h.id
            JOIN clientes c ON r.cliente_id = c.id
            WHERE r.estado = 'activa'
            ORDER BY h.numero ASC
        `);
        console.log(`Success: Found ${resReg.recordset.length} registros activos`);
        if (resReg.recordset.length > 0) {
            console.log('Sample data:', JSON.stringify(resReg.recordset[0], null, 2));
        }

        console.log('\nAll SQL checks passed.');
        process.exit(0);
    } catch (err) {
        console.error('\nSQL Error found:', err.message);
        console.error(err);
        process.exit(1);
    }
}

test();
