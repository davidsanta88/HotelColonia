-- Migración: Control de Auditoría
-- Agrega columnas de auditoría a todas las tablas del sistema

USE PruebaIA;
GO

-- Procedimiento auxiliar para agregar columnas de auditoría
CREATE OR ALTER PROCEDURE #AddAuditColumns 
    @TableName NVARCHAR(128)
AS
BEGIN
    DECLARE @SQL NVARCHAR(MAX);
    
    SET @SQL = N'
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(''' + @TableName + ''') AND name = ''UsuarioCreacion'')
    BEGIN
        ALTER TABLE ' + @TableName + ' ADD UsuarioCreacion NVARCHAR(100);
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(''' + @TableName + ''') AND name = ''FechaCreacion'')
    BEGIN
        ALTER TABLE ' + @TableName + ' ADD FechaCreacion DATETIME DEFAULT GETDATE();
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(''' + @TableName + ''') AND name = ''UsuarioModificacion'')
    BEGIN
        ALTER TABLE ' + @TableName + ' ADD UsuarioModificacion NVARCHAR(100);
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(''' + @TableName + ''') AND name = ''FechaModificacion'')
    BEGIN
        ALTER TABLE ' + @TableName + ' ADD FechaModificacion DATETIME;
    END';
    
    EXEC sp_executesql @SQL;
END;
GO

-- Aplicar a todas las tablas conocidas
EXEC #AddAuditColumns 'roles';
EXEC #AddAuditColumns 'usuarios';
EXEC #AddAuditColumns 'tipos_habitacion';
EXEC #AddAuditColumns 'estados_habitacion';
EXEC #AddAuditColumns 'habitaciones';
EXEC #AddAuditColumns 'municipios';
EXEC #AddAuditColumns 'clientes';
EXEC #AddAuditColumns 'registros';
EXEC #AddAuditColumns 'registros_huespedes';
EXEC #AddAuditColumns 'productos';
EXEC #AddAuditColumns 'ventas';
EXEC #AddAuditColumns 'detalle_ventas';
EXEC #AddAuditColumns 'inventario_movimientos';
EXEC #AddAuditColumns 'consumos_habitacion';
EXEC #AddAuditColumns 'medios_pago';
EXEC #AddAuditColumns 'habitaciones_fotos';
GO

-- Limpiar procedimiento temporal
DROP PROCEDURE #AddAuditColumns;
GO
