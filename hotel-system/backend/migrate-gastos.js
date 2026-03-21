const { poolPromise } = require('./config/db');

async function migrateGastos() {
    try {
        const pool = await poolPromise;
        console.log('Conectado a la base de datos.');

        // Crear tabla categorias_gastos
        const createCategoriasTable = `
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='categorias_gastos' and xtype='U')
            BEGIN
                CREATE TABLE categorias_gastos (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    nombre VARCHAR(50) NOT NULL UNIQUE,
                    descripcion VARCHAR(255),
                    activo BIT DEFAULT 1,
                    UsuarioCreacion VARCHAR(50) DEFAULT 'Sistema Migracion',
                    FechaCreacion DATETIME DEFAULT GETDATE(),
                    UsuarioModificacion VARCHAR(50),
                    FechaModificacion DATETIME
                );
                
                -- Insertar por defecto
                INSERT INTO categorias_gastos (nombre, descripcion)
                VALUES 
                    ('Servicios Públicos', 'Agua, Luz, Gas, Internet y Telefonía'),
                    ('Nómina y Turnos', 'Pago de salarios a empleados y turnos a destajo'),
                    ('Insumos de Aseo', 'Compra de implementos e insumos de limpieza y aseo'),
                    ('Mantenimiento', 'Reparaciones locativas, equipos o herramientas'),
                    ('Varios', 'Otros gastos menores u operativos que no apliquen a otras categorías');

                PRINT 'Tabla categorias_gastos creada y datos por defecto insertados.';
            END
            ELSE
            BEGIN
                PRINT 'La tabla categorias_gastos ya existe.';
            END
        `;

        // Crear tabla gastos
        const createGastosTable = `
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='gastos' and xtype='U')
            BEGIN
                CREATE TABLE gastos (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    concepto VARCHAR(100) NOT NULL,
                    categoria_id INT,
                    monto DECIMAL(10,2) NOT NULL,
                    fecha_gasto DATETIME DEFAULT GETDATE(),
                    notas VARCHAR(MAX),
                    UsuarioCreacion VARCHAR(50),
                    FechaCreacion DATETIME DEFAULT GETDATE(),
                    UsuarioModificacion VARCHAR(50),
                    FechaModificacion DATETIME,
                    CONSTRAINT FK_CategoriaGasto FOREIGN KEY (categoria_id) REFERENCES categorias_gastos(id)
                );
                
                PRINT 'Tabla gastos creada.';
            END
            ELSE
            BEGIN
                PRINT 'La tabla gastos ya existe.';
            END
        `;

        await pool.request().query(createCategoriasTable);
        await pool.request().query(createGastosTable);
        
        console.log('Migración de gastos completada exitosamente.');

    } catch (err) {
        console.error('Error durante la migración de gastos:', err);
    } finally {
        process.exit(0);
    }
}

migrateGastos();
