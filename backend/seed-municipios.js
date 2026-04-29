const { poolPromise, sql } = require('./config/db');

async function seedMunicipios() {
    try {
        console.log("Obteniendo municipios de Colombia...");
        // API URL for Colombia JSON
        const response = await fetch('https://raw.githubusercontent.com/marcovega/colombia-json/master/colombia.min.json');
        const data = await response.json();
        
        let totalCiudades = 0;
        data.forEach(d => totalCiudades += d.ciudades.length);
        console.log(`Se encontraron ${totalCiudades} municipios en ${data.length} departamentos. Guardando en Base de datos...`);
        
        const pool = await poolPromise;

        let added = 0;
        let errors = 0;
        for (let deptoObj of data) {
            let dpto = deptoObj.departamento.toUpperCase().replace(/'/g, "''");
            
            for (let ciudad of deptoObj.ciudades) {
                let muni = ciudad.toUpperCase().replace(/'/g, "''");
                let fullString = `${dpto}-${muni}`;
                
                try {
                    await pool.request()
                        .input('nombre', sql.VarChar, fullString)
                        .query(`
                            IF NOT EXISTS(SELECT 1 FROM municipios WHERE nombre = @nombre)
                            BEGIN
                                INSERT INTO municipios (nombre) VALUES (@nombre)
                            END
                        `);
                    added++;
                } catch(e) {
                    console.error("Error con:", fullString, e.message);
                    errors++;
                }
            }
        }
        
        console.log(`Seeding completado. Entradas procesadas: ${added}. Errores: ${errors}`);
        process.exit(0);

    } catch (err) {
        console.error("Error general:", err);
        process.exit(1);
    }
}

seedMunicipios();

