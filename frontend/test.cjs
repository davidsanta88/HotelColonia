const { execSync } = require('child_process');
const fs = require('fs');
try {
  execSync('npm run build', { encoding: 'utf-8' });
  console.log("Build passed!");
} catch (e) {
  fs.writeFileSync('build-error.txt', (e.stdout || '') + '\n' + (e.stderr || ''), 'utf-8');
}
