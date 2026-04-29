const { poolPromise } = require('./config/db');

async function migrateCategorias() {
    try {
        const pool = await poolPromise;
        console.log('Conectado a la base de datos.');

        // Crear tabla categorias_productos si no existe
        const createTableQuery = `
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='categorias_productos' and xtype='U')
            BEGIN
                CREATE TABLE categorias_productos (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    nombre VARCHAR(50) NOT NULL UNIQUE,
                    descripcion VARCHAR(255),
                    activo BIT DEFAULT 1
                );
                
                -- Insertar categorías por defecto
                INSERT INTO categorias_productos (nombre, descripcion)
                VALUES 
                    ('bebidas', 'Refrescos, aguas, cervezas y licores'),
                    ('snacks', 'Papas, galletas, chocolates y dulces'),
                    ('aseo', 'Artículos de aseo personal'),
                    ('otros', 'Otros productos y souvenirs');

                PRINT 'Tabla categorias_productos creada y datos por defecto insertados.';
            END
            ELSE
            BEGIN
                PRINT 'La tabla categorias_productos ya existe.';
            END
        `;

        await pool.request().query(createTableQuery);
        console.log('Migración completada exitosamente.');

    } catch (err) {
        console.error('Error durante la migración de categorias:', err);
    } finally {
        process.exit(0);
    }
}

migrateCategorias();

