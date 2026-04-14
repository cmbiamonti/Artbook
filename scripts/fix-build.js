const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing build for Electron...');

const distPath = path.join(__dirname, '../dist');
const indexPath = path.join(distPath, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('❌ dist/index.html not found!');
  process.exit(1);
}

// Leggi index.html
let html = fs.readFileSync(indexPath, 'utf8');

console.log('📝 Original paths in index.html:');
const scriptMatches = html.match(/src="[^"]+"/g) || [];
const linkMatches = html.match(/href="[^"]+"/g) || [];
console.log('  Scripts:', scriptMatches);
console.log('  Links:', linkMatches);

// Fix tutti i path assoluti in relativi
html = html
  .replace(/href="\//g, 'href="./')
  .replace(/src="\//g, 'src="./')
  .replace(/="\/assets\//g, '="./assets/');

// Salva
fs.writeFileSync(indexPath, html);

console.log('✅ Fixed paths:');
const fixedScripts = html.match(/src="[^"]+"/g) || [];
const fixedLinks = html.match(/href="[^"]+"/g) || [];
console.log('  Scripts:', fixedScripts);
console.log('  Links:', fixedLinks);

console.log('✅ Build fixed successfully!');