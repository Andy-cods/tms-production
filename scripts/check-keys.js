const fs = require('fs');
const path = require('path');

// Recursively find all TSX/JSX files
function findTsxFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .next, dist directories
      if (!['node_modules', '.next', 'dist'].includes(item)) {
        findTsxFiles(fullPath, files);
      }
    } else if (item.endsWith('.tsx') || item.endsWith('.jsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

const files = findTsxFiles('.');

let issuesFound = 0;

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Simple regex to detect .map without key prop nearby
    if (line.match(/\.map\s*\(/)) {
      const nextLines = lines.slice(index, index + 5).join('\n');
      if (!nextLines.match(/key\s*=/)) {
        console.log(`⚠️  Possible missing key: ${file}:${index + 1}`);
        console.log(`   ${line.trim()}`);
        issuesFound++;
      }
    }
  });
});

if (issuesFound === 0) {
  console.log('✅ No obvious key issues found!');
} else {
  console.log(`\n❌ Found ${issuesFound} potential key issues`);
  process.exit(1);
}
