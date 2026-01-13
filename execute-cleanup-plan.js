/**
 * Execute Cleanup Plan A: Replace old file and delete trash files
 */

const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;

async function main() {
  console.log('🚀 EXECUTING CLEANUP PLAN A\n');
  console.log('=' .repeat(80));
  
  // Step 1: Backup old file
  console.log('📦 Step 1: Backup old cleanup-analysis.js...');
  try {
    const oldFile = path.join(projectRoot, 'cleanup-analysis.js');
    const backupFile = path.join(projectRoot, 'cleanup-analysis-old.js');
    
    if (fs.existsSync(oldFile)) {
      fs.copyFileSync(oldFile, backupFile);
      console.log('✅ Backed up to: cleanup-analysis-old.js\n');
    } else {
      console.log('⚠️  cleanup-analysis.js not found, skip backup\n');
    }
  } catch (err) {
    console.error('❌ Error backing up:', err.message);
    process.exit(1);
  }
  
  // Step 2: Replace with optimized version
  console.log('🔄 Step 2: Replace with optimized version...');
  try {
    const optimizedFile = path.join(projectRoot, 'cleanup-analysis-optimized.js');
    const targetFile = path.join(projectRoot, 'cleanup-analysis.js');
    
    if (fs.existsSync(optimizedFile)) {
      fs.copyFileSync(optimizedFile, targetFile);
      console.log('✅ Replaced cleanup-analysis.js with optimized version\n');
    } else {
      console.error('❌ cleanup-analysis-optimized.js not found!');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Error replacing:', err.message);
    process.exit(1);
  }
  
  // Step 3: Load trash list
  console.log('📋 Step 3: Loading trash files list...');
  const trashListPath = path.join(projectRoot, 'trash-files-list.json');
  
  if (!fs.existsSync(trashListPath)) {
    console.error('❌ trash-files-list.json not found!');
    console.log('💡 Run: node cleanup-analysis.js first');
    process.exit(1);
  }
  
  const trashList = JSON.parse(fs.readFileSync(trashListPath, 'utf8'));
  console.log('✅ Loaded trash files list\n');
  
  // Step 4: Delete trash files
  console.log('🗑️  Step 4: Deleting trash files...');
  console.log('=' .repeat(80));
  
  let deletedCount = 0;
  let failedCount = 0;
  let totalSize = 0;
  
  for (const [category, files] of Object.entries(trashList)) {
    if (files.length === 0) continue;
    
    console.log(`\n📁 ${category}: ${files.length} file(s)`);
    
    for (const file of files) {
      const fullPath = path.join(projectRoot, file.path);
      
      try {
        if (!fs.existsSync(fullPath)) {
          console.log(`  ⚠️  Not found: ${file.path}`);
          continue;
        }
        
        const stats = fs.statSync(fullPath);
        totalSize += stats.size;
        
        if (stats.isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
          console.log(`  🗂️  Deleted folder: ${file.path}`);
        } else {
          fs.unlinkSync(fullPath);
          console.log(`  🗑️  Deleted file: ${file.path}`);
        }
        
        deletedCount++;
      } catch (err) {
        console.log(`  ❌ Failed: ${file.path} (${err.message})`);
        failedCount++;
      }
    }
  }
  
  // Summary
  console.log('\n' + '=' .repeat(80));
  console.log('📊 CLEANUP SUMMARY');
  console.log('=' .repeat(80));
  console.log(`✅ Deleted: ${deletedCount} files/folders`);
  console.log(`❌ Failed: ${failedCount} files/folders`);
  console.log(`💾 Freed: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log('=' .repeat(80));
  
  console.log('\n✅ PLAN A COMPLETED SUCCESSFULLY!\n');
  console.log('📝 Changes made:');
  console.log('  1. ✅ Backed up: cleanup-analysis-old.js');
  console.log('  2. ✅ Replaced: cleanup-analysis.js (with optimized version)');
  console.log(`  3. ✅ Deleted: ${deletedCount} trash files (${(totalSize / (1024 * 1024)).toFixed(2)} MB)\n`);
  
  console.log('🚀 Ready to commit and push to GitHub!');
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});

