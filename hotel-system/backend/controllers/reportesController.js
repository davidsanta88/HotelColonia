const { poolPromise, sql } = require('../config/db');

exports.getReporteVentas = async (req, res) => {
    try {
        const { inicio, fin } = req.query; // format: YYYY-MM-DD
        const pool = await poolPromise;
        const result = await pool.request()
            .input('inicio', sql.VarChar, inicio || '2000-01-01')
            .input('fin', sql.VarChar, fin || '2099-12-31')
            .query(`
                SELECT 
                    CAST(fecha AS DATE) as fecha,
                    SUM(total) as gran_total,
                    COUNT(id) as num_ventas
                FROM ventas
                WHERE fecha >= @inicio AND fecha <= @fin + ' 23:59:59'
                GROUP BY CAST(fecha AS DATE)
                ORDER BY fecha ASC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProductosMasVendidos = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT TOP 10
                    p.nombre,
                    SUM(cantidad) as total_vendido,
                    SUM(subtotal) as total_recaudado
                FROM (
                    SELECT producto_id, cantidad, subtotal FROM detalle_ventas
                    UNION ALL
                    SELECT producto_id, cantidad, total as subtotal FROM consumos_habitacion
                ) as unified_sales
                JOIN productos p ON unified_sales.producto_id = p.id
                GROUP BY p.id, p.nombre
                ORDER BY total_vendido DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getResumenGeneral = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                (SELECT COUNT(*) FROM habitaciones WHERE estado_nombre = 'Disponible') as hab_disponibles,
                (SELECT COUNT(*) FROM registros WHERE estado = 'activa') as hab_ocupadas,
                (SELECT COUNT(*) FROM productos WHERE stock <= stock_minimo) as alertas_stock,
                (SELECT SUM(total) FROM ventas WHERE CAST(fecha AS DATE) = CAST(GETDATE() AS DATE)) as ventas_hoy
        `);
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
