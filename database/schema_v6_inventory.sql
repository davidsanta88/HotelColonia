-- Migración V6: Inventario y Tienda
USE PruebaIA;
GO

-- 1. Actualizar tabla de productos
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('productos') AND name = 'stock_minimo')
BEGIN
    ALTER TABLE productos ADD stock_minimo INT DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('productos') AND name = 'descripcion')
BEGIN
    ALTER TABLE productos ADD descripcion VARCHAR(255);
END
GO

-- 2. Tabla de movimientos de inventario
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='inventario_movimientos' and xtype='U')
BEGIN
    CREATE TABLE inventario_movimientos (
        id INT IDENTITY(1,1) PRIMARY KEY,
        producto_id INT NOT NULL,
        tipo VARCHAR(20) NOT NULL, -- 'entrada', 'salida'
        cantidad INT NOT NULL,
        fecha DATETIME DEFAULT GETDATE(),
        motivo VARCHAR(255), -- 'compra', 'venta', 'ajuste', 'consumo_habitacion'
        usuario_id INT,
        FOREIGN KEY (producto_id) REFERENCES productos(id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
END
GO

-- 3. Tabla de consumos por habitación (para ligar ventas a habitaciones)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='consumos_habitacion' and xtype='U')
BEGIN
    CREATE TABLE consumos_habitacion (
        id INT IDENTITY(1,1) PRIMARY KEY,
        registro_id INT NOT NULL, -- ID del registro/reserva activa
        producto_id INT NOT NULL,
        cantidad INT NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        fecha DATETIME DEFAULT GETDATE(),
        pagado BIT DEFAULT 0, -- 0: pendiente de pago (se suma al checkout), 1: pagado ya
        usuario_id INT,
        FOREIGN KEY (registro_id) REFERENCES registros(id),
        FOREIGN KEY (producto_id) REFERENCES productos(id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
END
GO

-- 4. Actualizar tabla de ventas (para incluir medio de pago y registro_id si aplica)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ventas') AND name = 'medio_pago_id')
BEGIN
    ALTER TABLE ventas ADD medio_pago_id INT;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ventas') AND name = 'registro_id')
BEGIN
    ALTER TABLE ventas ADD registro_id INT NULL; -- Si la venta se carga a una habitación
END
GO

-- Agregar FK para medio_pago en ventas si existe la tabla medios_pago
IF EXISTS (SELECT * FROM sysobjects WHERE name='medios_pago' and xtype='U')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_ventas_medios_pago')
    BEGIN
        ALTER TABLE ventas ADD CONSTRAINT FK_ventas_medios_pago FOREIGN KEY (medio_pago_id) REFERENCES medios_pago(id);
    END
END
GO
