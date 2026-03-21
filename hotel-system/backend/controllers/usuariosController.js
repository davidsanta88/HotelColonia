const { poolPromise, sql } = require('../config/db');
const bcrypt = require('bcryptjs');

const usuariosController = {
    getAllUsuarios: async (req, res) => {
        try {
            const pool = await poolPromise;
            // No devolvemos el password por seguridad
            const { recordset } = await pool.request().query('SELECT id, nombre, email, rol_id, telefono, FechaCreacion FROM usuarios ORDER BY id DESC');
            res.json(recordset);
        } catch (error) {
            console.error('Error getting usuarios:', error);
            res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
        }
    },

    createUsuario: async (req, res) => {
        try {
            const { nombre, email, password, rol_id, telefono } = req.body;

            if (!nombre || !email || !password || !rol_id) {
                return res.status(400).json({ message: 'Nombre, email, password y rol son requeridos' });
            }

            const pool = await poolPromise;

            // Verificar si el email ya existe
            const checkEmail = await pool.request()
                .input('email', sql.VarChar(100), email.trim())
                .query('SELECT id FROM usuarios WHERE email = @email');

            if (checkEmail.recordset.length > 0) {
                return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
            }

            // Encriptar password
            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(password, salt);

            const query = `
                INSERT INTO usuarios (nombre, email, password, rol_id, telefono) 
                OUTPUT inserted.id, inserted.nombre, inserted.email, inserted.rol_id, inserted.telefono
                VALUES (@nombre, @email, @password, @rol_id, @telefono)
            `;

            const request = pool.request();
            request.input('nombre', sql.VarChar(100), nombre.trim());
            request.input('email', sql.VarChar(100), email.trim());
            request.input('password', sql.VarChar(255), hashedPassword);
            request.input('rol_id', sql.Int, rol_id);
            request.input('telefono', sql.VarChar(20), telefono || null);

            const result = await request.query(query);
            res.status(201).json(result.recordset[0]);
        } catch (error) {
            console.error('Error creating usuario:', error);
            res.status(500).json({ message: 'Error al registrar el usuario', error: error.message });
        }
    },

    updateUsuario: async (req, res) => {
        try {
            const { id } = req.params;
            const { nombre, email, password, rol_id, telefono } = req.body;

            if (!nombre || !email || !rol_id) {
                return res.status(400).json({ message: 'Nombre, email y rol son requeridos' });
            }

            const pool = await poolPromise;

            // Verificar que no se duplique un correo en otro usuario diferente
            const checkEmail = await pool.request()
                .input('email', sql.VarChar(100), email.trim())
                .input('id', sql.Int, id)
                .query('SELECT id FROM usuarios WHERE email = @email AND id != @id');

            if (checkEmail.recordset.length > 0) {
                return res.status(400).json({ message: 'El correo electrónico ya está en uso por otro usuario' });
            }

            let query = '';
            const request = pool.request();
            request.input('id', sql.Int, id);
            request.input('nombre', sql.VarChar(100), nombre.trim());
            request.input('email', sql.VarChar(100), email.trim());
            request.input('rol_id', sql.Int, rol_id);
            request.input('telefono', sql.VarChar(20), telefono || null);

            // Si envió password, actualizarla
            if (password && password.trim() !== '') {
                const salt = bcrypt.genSaltSync(10);
                const hashedPassword = bcrypt.hashSync(password, salt);
                query = `
                    UPDATE usuarios 
                    SET nombre = @nombre, email = @email, rol_id = @rol_id, telefono = @telefono, password = @password 
                    OUTPUT inserted.id, inserted.nombre, inserted.email, inserted.telefono, inserted.rol_id
                    WHERE id = @id
                `;
                request.input('password', sql.VarChar(255), hashedPassword);
            } else {
                query = `
                    UPDATE usuarios 
                    SET nombre = @nombre, email = @email, rol_id = @rol_id, telefono = @telefono 
                    OUTPUT inserted.id, inserted.nombre, inserted.email, inserted.telefono, inserted.rol_id
                    WHERE id = @id
                `;
            }

            const result = await request.query(query);

            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            res.json(result.recordset[0]);
        } catch (error) {
            console.error('Error updating usuario:', error);
            res.status(500).json({ message: 'Error al actualizar el usuario', error: error.message });
        }
    },

    deleteUsuario: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Impedir auto-eliminación
            if (parseInt(id) === req.userId) {
                return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta desde aquí' });
            }

            const pool = await poolPromise;
            const query = `DELETE FROM usuarios WHERE id = @id`;
            const request = pool.request();
            request.input('id', sql.Int, id);

            const result = await request.query(query);

            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            res.json({ message: 'Usuario eliminado exitosamente' });
        } catch (error) {
            console.error('Error deleting usuario:', error);
            res.status(500).json({ message: 'Error al eliminar el usuario', error: error.message });
        }
    }
};

module.exports = usuariosController;
