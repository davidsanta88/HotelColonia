-- Crear base de datos
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'PruebaIA')
BEGIN
    CREATE DATABASE PruebaIA;
END
GO

USE PruebaIA;
GO

-- Crear tabla de roles
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='roles' and xtype='U')
BEGIN
    CREATE TABLE roles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL UNIQUE
    );
END
GO

-- Crear tabla de usuarios
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='usuarios' and xtype='U')
BEGIN
    CREATE TABLE usuarios (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        rol_id INT NOT NULL,
        fecha_creacion DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (rol_id) REFERENCES roles(id)
    );
END
GO

-- Crear tabla de tipos de habitacion
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tipos_habitacion' and xtype='U')
BEGIN
    CREATE TABLE tipos_habitacion (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL UNIQUE
    );
END
GO

-- Crear tabla de estados de habitacion
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='estados_habitacion' and xtype='U')
BEGIN
    CREATE TABLE estados_habitacion (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL UNIQUE
    );
END
GO

-- Crear tabla de habitaciones
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='habitaciones' and xtype='U')
BEGIN
    CREATE TABLE habitaciones (
        id INT IDENTITY(1,1) PRIMARY KEY,
        numero INT NOT NULL UNIQUE,
        tipo_id INT,
        estado_id INT,
        precio_1 DECIMAL(10,2),
        precio_2 DECIMAL(10,2),
        precio_3 DECIMAL(10,2),
        precio_4 DECIMAL(10,2),
        precio_5 DECIMAL(10,2),
        precio_6 DECIMAL(10,2),
        descripcion TEXT,
        FOREIGN KEY (tipo_id) REFERENCES tipos_habitacion(id),
        FOREIGN KEY (estado_id) REFERENCES estados_habitacion(id)
    );
END
GO

-- Crear tabla de municipios
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='municipios' and xtype='U')
BEGIN
    CREATE TABLE municipios (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        codigo_dane VARCHAR(20),
        visualizar BIT DEFAULT 1
    );
END
GO

-- Crear tabla de clientes
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='clientes' and xtype='U')
BEGIN
    CREATE TABLE clientes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        documento VARCHAR(50) NOT NULL UNIQUE,
        tipo_documento VARCHAR(20) DEFAULT 'CC',
        telefono VARCHAR(20),
        email VARCHAR(100),
        municipio_origen_id INT,
        FOREIGN KEY (municipio_origen_id) REFERENCES municipios(id)
    );
END
GO

-- Crear tabla de reservas
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='reservas' and xtype='U')
BEGIN
    CREATE TABLE reservas (
        id INT IDENTITY(1,1) PRIMARY KEY,
        habitacion_id INT NOT NULL,
        cliente_id INT NOT NULL,
        fecha_ingreso DATE NOT NULL,
        fecha_salida DATE NOT NULL,
        estado VARCHAR(50) DEFAULT 'pendiente', -- pendiente, activa, completada, cancelada
        total DECIMAL(10,2),
        fecha_creacion DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (habitacion_id) REFERENCES habitaciones(id),
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    );
END
GO

-- Crear tabla de reserva_huespedes
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='reserva_huespedes' and xtype='U')
BEGIN
    CREATE TABLE reserva_huespedes (
        reserva_id INT NOT NULL,
        cliente_id INT NOT NULL,
        PRIMARY KEY (reserva_id, cliente_id),
        FOREIGN KEY (reserva_id) REFERENCES reservas(id),
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    );
END
GO

-- Crear tabla de productos (Tienda)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='productos' and xtype='U')
BEGIN
    CREATE TABLE productos (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        categoria VARCHAR(50) NOT NULL, -- bebidas, snacks, aseo
        precio DECIMAL(10,2) NOT NULL,
        stock INT DEFAULT 0
    );
END
GO

-- Crear tabla de ventas
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ventas' and xtype='U')
BEGIN
    CREATE TABLE ventas (
        id INT IDENTITY(1,1) PRIMARY KEY,
        empleado_id INT NOT NULL,
        fecha DATETIME DEFAULT GETDATE(),
        total DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (empleado_id) REFERENCES usuarios(id)
    );
END
GO

-- Crear tabla de detalle de ventas
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='detalle_ventas' and xtype='U')
BEGIN
    CREATE TABLE detalle_ventas (
        id INT IDENTITY(1,1) PRIMARY KEY,
        venta_id INT NOT NULL,
        producto_id INT NOT NULL,
        cantidad INT NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (venta_id) REFERENCES ventas(id),
        FOREIGN KEY (producto_id) REFERENCES productos(id)
    );
END
GO

-- Datos iniciales
IF NOT EXISTS (SELECT * FROM roles WHERE nombre = 'Administrador')
BEGIN
    INSERT INTO roles (nombre) VALUES ('Administrador');
END
IF NOT EXISTS (SELECT * FROM roles WHERE nombre = 'Empleado')
BEGIN
    INSERT INTO roles (nombre) VALUES ('Empleado');
END
GO

-- Insertar usuario admin por defecto (password es 'admin123' hasheado con bcrypt)
-- El hash $2a$10$wE/qM0A.hCof1f/LInuXo.eP/b3x2A9Qo.hB/0D0B6kPZfQc6d48q corresponde a 'admin123'
IF NOT EXISTS (SELECT * FROM usuarios WHERE email = 'admin@hotel.com')
BEGIN
    DECLARE @admin_role_id INT;
    SELECT @admin_role_id = id FROM roles WHERE nombre = 'Administrador';
    
    INSERT INTO usuarios (nombre, email, password, rol_id)
    VALUES ('Administrador del Sistema', 'admin@hotel.com', '$2a$10$wE/qM0A.hCof1f/LInuXo.eP/b3x2A9Qo.hB/0D0B6kPZfQc6d48q', @admin_role_id);
END
GO
