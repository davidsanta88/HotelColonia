const mssql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: { encrypt: false, trustServerCertificate: true }
};

async function test() {
    try {
        const pool = await mssql.connect(config);
        const resultRegistro = await pool.request()
            .input('id', mssql.Int, 1)
            .query(`
                SELECT r.*, 
                       h.numero as numero_habitacion, 
                       c.nombre as nombre_cliente,
                       c.documento as documento_cliente,
                       mp.nombre as medio_pago_nombre
                FROM registros r
                JOIN habitaciones h ON r.habitacion_id = h.id
                JOIN clientes c ON r.cliente_id = c.id
                LEFT JOIN medios_pago mp ON r.medio_pago_id = mp.id
                WHERE r.id = @id
            `);
        console.log("Registro:", resultRegistro.recordset);
        
        const resultHuespedes = await pool.request()
            .input('registro_id', mssql.Int, 1)
            .query(`
                SELECT c.id, c.nombre, c.documento, c.tipo_documento, c.telefono, c.email
                FROM registros_huespedes rh
                JOIN clientes c ON rh.cliente_id = c.id
                WHERE rh.registro_id = @registro_id
            `);
        console.log("Huespedes:", resultHuespedes.recordset);
        process.exit(0);
    } catch (e) {
        console.error("ERROR:", e.message);
        process.exit(1);
    }
}
test();
