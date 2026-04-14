// scripts/clean.js
const fs = require('fs');
const path = require('path');

const dirsToClean = ['dist', 'dist-electron', 'release'];

console.log('🧹 Cleaning build directories...\n');

dirsToClean.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ Removed: ${dir}`);
    } else {
      console.log(`⏭️  Skipped: ${dir} (not found)`);
    }
  } catch (error) {
    console.error(`❌ Error removing ${dir}:`, error.message);
  }
});

console.log('\n✨ Cleanup complete!\n');