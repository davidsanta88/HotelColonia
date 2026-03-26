const express = require('express');
const path = require('path');
const fs = require('fs');

async function validate() {
    console.log('--- VALIDATING ROUTES ---');
    const routesDir = path.join(__dirname, 'routes');
    const files = fs.readdirSync(routesDir);

    for (const file of files) {
        if (file.endsWith('.js')) {
            console.log(`Checking ${file}...`);
            try {
                const route = require(path.join(routesDir, file));
                console.log(`  OK: ${file}`);
            } catch (err) {
                console.error(`  ERROR in ${file}:`, err.message);
                // console.error(err.stack);
            }
        }
    }
    console.log('--- VALIDATION COMPLETED ---');
    process.exit(0);
}

validate();
