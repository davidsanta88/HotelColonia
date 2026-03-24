const { poolPromise } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Por favor, provea email y contraseña' });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('email', email)
            .query('SELECT * FROM usuarios WHERE email = @email');

        const user = result.recordset[0];

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const passwordIsValid = bcrypt.compareSync(password, user.password);

        if (!passwordIsValid) {
            return res.status(401).json({ message: 'Contraseña inválida' });
        }

        const permisosResult = await pool.request()
            .input('rol_id', user.rol_id)
            .query('SELECT pantalla_codigo as p, can_view as v, can_edit as e, can_delete as d FROM roles_permisos WHERE rol_id = @rol_id');
        const permisos = permisosResult.recordset;

        const token = jwt.sign(
            { id: user.id, rol_id: user.rol_id, nombre: user.nombre, permisos },
            process.env.JWT_SECRET,
            { expiresIn: 86400 } // 24 horas
        );

        res.status(200).json({
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol_id: user.rol_id,
            permisos: permisos,
            accessToken: token
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const userId = req.userId;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', userId)
            .query('SELECT id, nombre, email, rol_id FROM usuarios WHERE id = @id');
        
        const user = result.recordset[0];
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        const permisosResult = await pool.request()
            .input('rol_id', user.rol_id)
            .query('SELECT pantalla_codigo as p, can_view as v, can_edit as e, can_delete as d FROM roles_permisos WHERE rol_id = @rol_id');
        const permisos = permisosResult.recordset;

        res.json({
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol_id: user.rol_id,
            permisos
        });
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
