const { poolPromise, sql } = require('../config/db');

const rolesController = {
    getAllRoles: async (req, res) => {
        try {
            const pool = await poolPromise;
            
            const rolesResult = await pool.request().query('SELECT * FROM roles ORDER BY id ASC');
            const permisosResult = await pool.request().query('SELECT * FROM roles_permisos');

            const roles = rolesResult.recordset.map(r => ({
                ...r,
                permisos: permisosResult.recordset
                    .filter(p => p.rol_id === r.id)
                    .map(p => ({ p: p.pantalla_codigo, v: p.can_view, e: p.can_edit, d: p.can_delete }))
            }));

            res.json(roles);
        } catch (error) {
            console.error('Error getting roles:', error);
            res.status(500).json({ message: 'Error al obtener roles', error: error.message });
        }
    },

    createRole: async (req, res) => {
        try {
            const { nombre, descripcion, permisos } = req.body;
            if (!nombre) return res.status(400).json({ message: 'El nombre es obligatorio' });

            const pool = await poolPromise;
            const requestCheck = pool.request();
            requestCheck.input('nombre', sql.VarChar(50), nombre.trim());
            const check = await requestCheck.query('SELECT id FROM roles WHERE nombre = @nombre');

            if (check.recordset.length > 0) return res.status(400).json({ message: 'Ya existe un rol con ese nombre' });

            const requestInsert = pool.request();
            requestInsert.input('nombre', sql.VarChar(50), nombre.trim());
            requestInsert.input('descripcion', sql.VarChar(255), descripcion || null);

            const result = await requestInsert.query(`
                INSERT INTO roles (nombre, descripcion) OUTPUT inserted.id VALUES (@nombre, @descripcion)
            `);
            const newRoleId = result.recordset[0].id;

            if (permisos && Array.isArray(permisos)) {
                for (const p of permisos) {
                    await pool.request()
                        .input('rol', sql.Int, newRoleId)
                        .input('pantalla', sql.VarChar(50), p.p)
                        .input('v', sql.Bit, p.v ? 1 : 0)
                        .input('e', sql.Bit, p.e ? 1 : 0)
                        .input('d', sql.Bit, p.d ? 1 : 0)
                        .query(`INSERT INTO roles_permisos (rol_id, pantalla_codigo, can_view, can_edit, can_delete) VALUES (@rol, @pantalla, @v, @e, @d)`);
                }
            }

            res.status(201).json({ message: 'Rol creado', id: newRoleId });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error interno', error: error.message });
        }
    },

    updateRole: async (req, res) => {
        try {
            const { id } = req.params;
            const { nombre, descripcion, permisos } = req.body;

            const pool = await poolPromise;

            if (nombre) {
                const requestUpd = pool.request();
                requestUpd.input('id', sql.Int, id);
                requestUpd.input('nombre', sql.VarChar(50), nombre.trim());
                requestUpd.input('descripcion', sql.VarChar(255), descripcion || null);
                await requestUpd.query(`UPDATE roles SET nombre = @nombre, descripcion = @descripcion WHERE id = @id`);
            }

            if (permisos && Array.isArray(permisos)) {
                if (parseInt(id) === 1) {
                    return res.status(403).json({ message: 'El Administrador del sistema debe mantener el 100% de los permisos por seguridad.' });
                }

                const requestId = pool.request();
                requestId.input('rol', sql.Int, id);
                await requestId.query(`DELETE FROM roles_permisos WHERE rol_id = @rol`);

                for (const p of permisos) {
                    await pool.request()
                        .input('rol', sql.Int, id)
                        .input('pantalla', sql.VarChar(50), p.p)
                        .input('v', sql.Bit, p.v ? 1 : 0)
                        .input('e', sql.Bit, p.e ? 1 : 0)
                        .input('d', sql.Bit, p.d ? 1 : 0)
                        .query(`INSERT INTO roles_permisos (rol_id, pantalla_codigo, can_view, can_edit, can_delete) VALUES (@rol, @pantalla, @v, @e, @d)`);
                }
            }

            res.json({ message: 'Rol y permisos actualizados' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error', error: error.message });
        }
    },

    deleteRole: async (req, res) => {
        try {
            const { id } = req.params;
            if (parseInt(id) === 1 || parseInt(id) === 2) {
                return res.status(403).json({ message: 'Los roles nativos originales no pueden eliminarse por restricción de integridad.' });
            }

            const pool = await poolPromise;
            const reqUserCheck = pool.request();
            reqUserCheck.input('rol', sql.Int, id);
            const userCheck = await reqUserCheck.query(`SELECT COUNT(*) as c FROM usuarios WHERE rol_id = @rol`);

            if (userCheck.recordset[0].c > 0) {
                return res.status(400).json({ message: 'Hay empleados asignados a este perfil. Reasígnales otro rol antes de eliminar este.' });
            }

            const delReq = pool.request();
            delReq.input('rol', sql.Int, id);

            await delReq.query(`DELETE FROM roles_permisos WHERE rol_id = @rol`);
            await delReq.query(`DELETE FROM roles WHERE id = @rol`);

            res.json({ message: 'Rol eliminado con éxito' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error interno', error: error.message });
        }
    }
};

module.exports = rolesController;
