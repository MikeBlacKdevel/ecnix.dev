const { execSync } =require('child_process');

// Get git hash with fallback
const getGitHash = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'no-git-info';
  }
};

let commitJson = {
  hash: JSON.stringify(getGitHash()),
  version: JSON.stringify(process.env.npm_package_version),
};

console.log(`
★═══════════════════════════════════════★
             ECNIX
         ⚡️  Bienvenido  ⚡️
★═══════════════════════════════════════★
`);
console.log('📍 Etiqueta de versión actual:', `v${commitJson.version}`);
console.log('📍 Versión de confirmación actual:', commitJson.hash);
console.log('Espere hasta que la URL aparezca aquí');
console.log('★══════════════ ═════════════════════════★');
