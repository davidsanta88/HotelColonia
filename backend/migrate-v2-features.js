const { poolPromise, sql } = require('./config/db');

async function run() {
    try {
        const pool = await poolPromise;
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // 1. Crear tabla estados_habitacion
            await transaction.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='estados_habitacion' and xtype='U')
                BEGIN
                    CREATE TABLE estados_habitacion (
                        id INT IDENTITY(1,1) PRIMARY KEY,
                        nombre VARCHAR(50) NOT NULL UNIQUE
                    );
                END
            `);

            // 2. Insertar valores por defecto si no existen
            await transaction.request().query(`
                IF NOT EXISTS (SELECT * FROM estados_habitacion WHERE nombre = 'disponible')
                BEGIN
                    INSERT INTO estados_habitacion (nombre) VALUES ('disponible'), ('ocupada'), ('mantenimiento');
                END
            `);

            // 3. Añadir columna estado_id a habitaciones si no existe
            await transaction.request().query(`
                IF COL_LENGTH('habitaciones', 'estado_id') IS NULL
                BEGIN
                    ALTER TABLE habitaciones ADD estado_id INT;
                END
            `);

            // 4. Mapear datos existentes (actualizar estado_id basado en estado de texto)
            await transaction.request().query(`
                IF COL_LENGTH('habitaciones', 'estado') IS NOT NULL
                BEGIN
                    UPDATE h
                    SET h.estado_id = e.id
                    FROM habitaciones h
                    INNER JOIN estados_habitacion e ON h.estado = e.nombre COLLATE SQL_Latin1_General_CP1_CI_AS
                    WHERE h.estado_id IS NULL AND h.estado IS NOT NULL;
                END
            `);

            // 5. Eliminar la columna estado de texto si existe utilizando script dinámico para el constraint
            await transaction.request().query(`
                IF COL_LENGTH('habitaciones', 'estado') IS NOT NULL
                BEGIN
                    DECLARE @ConstraintName nvarchar(200)
                    SELECT @ConstraintName = Name 
                    FROM SYS.DEFAULT_CONSTRAINTS 
                    WHERE PARENT_OBJECT_ID = OBJECT_ID('habitaciones') 
                      AND PARENT_COLUMN_ID = (SELECT column_id FROM sys.columns WHERE NAME = N'estado' AND object_id = OBJECT_ID(N'habitaciones'))
                    
                    IF @ConstraintName IS NOT NULL
                       EXEC('ALTER TABLE habitaciones DROP CONSTRAINT ' + @ConstraintName)
                       
                    ALTER TABLE habitaciones DROP COLUMN estado;
                END
            `);

            // 6. Añadir columnas de precios por persona (1 a 6) a habitaciones
            await transaction.request().query(`
                IF COL_LENGTH('habitaciones', 'precio_1') IS NULL
                BEGIN
                    ALTER TABLE habitaciones ADD 
                        precio_1 DECIMAL(10,2),
                        precio_2 DECIMAL(10,2),
                        precio_3 DECIMAL(10,2),
                        precio_4 DECIMAL(10,2),
                        precio_5 DECIMAL(10,2),
                        precio_6 DECIMAL(10,2);
                        
                    -- Migrar dato antiguo precio_noche a precio_1 y 2 asumiendo la tarifa base
                    IF COL_LENGTH('habitaciones', 'precio_noche') IS NOT NULL
                    BEGIN
                        EXEC('UPDATE habitaciones SET precio_1 = precio_noche, precio_2 = precio_noche * 1.5;');
                    END
                END
            `);

            // 7. Eliminar la columna de precio_noche antigua
            await transaction.request().query(`
                IF COL_LENGTH('habitaciones', 'precio_noche') IS NOT NULL
                BEGIN
                    ALTER TABLE habitaciones DROP COLUMN precio_noche;
                END
            `);

            await transaction.commit();
            console.log("Migración completada: estados de habitación dinámicos y precios por cantidad de personas configurados.");
            process.exit(0);
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (e) {
        console.error("Error en migracion:", e);
        process.exit(1);
    }
}
run();
