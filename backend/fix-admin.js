const bcrypt = require('bcryptjs');
const { poolPromise } = require('./config/db');

async function fixAdmin() {
    try {
        const pool = await poolPromise;
        const hash = bcrypt.hashSync('admin123', 10);
        
        await pool.request()
            .input('email', 'admin@hotel.com')
            .input('pass', hash)
            .query(`
                IF EXISTS(SELECT 1 FROM usuarios WHERE email = @email)
                BEGIN
                    UPDATE usuarios SET password = @pass WHERE email = @email
                END
                ELSE
                BEGIN
                    DECLARE @rol_id INT;
                    SELECT @rol_id = id FROM roles WHERE nombre = 'Administrador';
                    INSERT INTO usuarios (nombre, email, password, rol_id) VALUES ('Administrador del Sistema', @email, @pass, @rol_id);
                END
            `);
        
        console.log("Usuario admin creado/actualizado con éxito. Ya puedes ingresar con admin@hotel.com / admin123");
        process.exit(0);
    } catch (err) {
        console.error("Error al actualizar admin:", err);
        process.exit(1);
    }
}

fixAdmin();

