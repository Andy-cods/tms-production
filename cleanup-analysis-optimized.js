/**
 * Script phân tích và liệt kê các file rác trong project (OPTIMIZED)
 * Cải tiến: Performance + Security
 * Chạy: node cleanup-analysis-optimized.js
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const projectRoot = __dirname;

// Danh sách patterns của file rác (giữ nguyên logic)
const trashPatterns = {
  documentation: {
    patterns: [
      /^PROMPT_\d+.*\.md$/i,
      /.*_GUIDE\.md$/i,
      /.*_SUMMARY\.md$/i,
      /.*_COMPLETE\.md$/i,
      /.*_CHECKLIST\.md$/i,
      /.*_IMPLEMENTATION\.md$/i,
      /.*_VERIFICATION\.md$/i,
      /.*_FIXES?.*\.md$/i,
      /.*_SETUP\.md$/i,
      /.*_ANALYSIS\.md$/i,
      /.*_DEPLOYMENT.*\.md$/i,
      /DEPLOY_.*\.md$/i,
      /FIX_.*\.md$/i,
      /CHECK_.*\.md$/i,
      /START_.*\.md$/i,
      /QUICK_.*\.md$/i,
      /^🎉.*\.md$/i,
      /^🚀.*\.md$/i,
      /ALL_PROMPTS.*\.md$/i,
      /CONTINUE_PROMPT.*\.md$/i,
      /NEXT_STEPS.*\.md$/i,
    ],
    description: 'Các file documentation/notes không cần thiết cho production'
  },
  
  backups: {
    patterns: [
      /\.tar\.gz$/i,
      /\.zip$/i,
      /backup-.*\.sql$/i,
      /\.sql\.gz$/i,
      /.*-backup\..*$/i,
      /prisma-only\.tar\.gz$/i,
    ],
    description: 'Các file backup và archive'
  },
  
  scripts: {
    patterns: [
      /^deploy-.*\.(sh|ps1)$/i,
      /^fix-.*\.(sh|ps1)$/i,
      /^check-.*\.(sh|ps1)$/i,
      /^backup-.*\.sh$/i,
      /^restore-.*\.sh$/i,
      /^setup-.*\.sh$/i,
      /^sync-.*\.sh$/i,
      /^upload-.*\.sh$/i,
      /^seed-.*\.sh$/i,
      /^create-.*\.sh$/i,
      /^list-.*\.sh$/i,
      /^debug-.*\.sh$/i,
      /^rollback-.*\.sh$/i,
      /^rebuild-.*\.sh$/i,
      /^verify-.*\.sh$/i,
      /^force-.*\.sh$/i,
      /add-domain\.sh$/i,
      /\.ps1$/i,
      /FIX_PM2.*\.sh$/i,
    ],
    description: 'Các script deploy/fix/check không cần cho production'
  },
  
  testOutputs: {
    patterns: [
      /^typecheck-.*\.txt$/i,
      /^test-output\.txt$/i,
      /^test-results\.json$/i,
    ],
    description: 'Các file output từ test/typecheck'
  },
  
  csvFiles: {
    patterns: [
      /employees.*\.csv$/i,
      /similar-files-report\.csv$/i,
    ],
    description: 'Các file CSV test/sample data'
  },
  
  miscTrash: {
    patterns: [
      /^copy$/i,
      /^tạo$/i,
      /^PrismaClient$/i,
      /^tsc$/i,
      /^ma db seed$/i,
      /^tms-2025@.*$/i,
      /\.txt$/i, // PUSH_TO_GITHUB_COMMANDS.txt, etc
    ],
    description: 'Các file/folder lạ khác'
  },
  
  reportFolders: {
    patterns: [
      /^playwright-report$/i,
    ],
    description: 'Các folder report từ testing'
  }
};

// Files/folders nên GIỮ LẠI (giữ nguyên logic)
const keepPatterns = [
  'README.md',
  'CHANGELOG.md',
  'LICENSE.md',
  'CONTRIBUTING.md',
  'README_DATABASE_SETUP.md',
  'TESTING.md',
  'node_modules',
  '.next',
  '.git',
  'app',
  'components',
  'lib',
  'prisma',
  'public',
  'scripts',
  'types',
  'actions',
  'hooks',
  'styles',
  '__tests__',
  'e2e',
  'docs',
  'logs',
];

// 🔒 SECURITY: Folders nên SKIP ngay (tránh scan không cần thiết)
const skipFolders = new Set([
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  'coverage',
  '.turbo',
  '.cache',
]);

// 🔒 SECURITY: Giới hạn kích thước file để scan (100MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * 🔒 SECURITY: Validate path để tránh path traversal
 */
function isPathSafe(targetPath) {
  const normalized = path.normalize(targetPath);
  return normalized.startsWith(projectRoot) && !normalized.includes('..');
}

/**
 * Kiểm tra nếu file/folder nên giữ lại (giữ nguyên logic)
 */
function shouldKeep(filename) {
  return keepPatterns.some(pattern => {
    if (typeof pattern === 'string') {
      return filename === pattern;
    }
    return pattern.test(filename);
  });
}

/**
 * ⚡ PERFORMANCE: Check nếu nên skip folder
 */
function shouldSkipFolder(folderName) {
  return skipFolders.has(folderName);
}

/**
 * ⚡ PERFORMANCE: Scan directory async (thay vì sync)
 * 🔒 SECURITY: Validate paths, check permissions
 */
async function analyzeDirectory(dir = projectRoot) {
  const results = {
    documentation: [],
    backups: [],
    scripts: [],
    testOutputs: [],
    csvFiles: [],
    miscTrash: [],
    reportFolders: [],
  };
  
  let totalSize = 0;
  let scannedFiles = 0;
  let skippedFiles = 0;

  try {
    // 🔒 SECURITY: Validate path
    if (!isPathSafe(dir)) {
      console.error('⚠️  Path không an toàn:', dir);
      return { results, totalSize, scannedFiles, skippedFiles };
    }

    const items = await fs.readdir(dir);
    
    // ⚡ PERFORMANCE: Process files concurrently (batch of 10)
    const batchSize = 10;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (item) => {
        // Skip nếu nên giữ lại (giữ nguyên logic)
        if (shouldKeep(item)) return;
        
        // ⚡ PERFORMANCE: Skip folders lớn
        if (shouldSkipFolder(item)) {
          skippedFiles++;
          return;
        }
        
        const fullPath = path.join(dir, item);
        const relativePath = path.relative(projectRoot, fullPath);
        
        try {
          // 🔒 SECURITY: Check if we have permission to access
          await fs.access(fullPath, fsSync.constants.R_OK);
          
          const stats = await fs.stat(fullPath);
          
          // 🔒 SECURITY: Skip files quá lớn
          if (!stats.isDirectory() && stats.size > MAX_FILE_SIZE) {
            console.warn(`⚠️  File quá lớn, bỏ qua: ${relativePath} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
            skippedFiles++;
            return;
          }
          
          const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
          scannedFiles++;
          
          // ⚡ PERFORMANCE: Progress indicator mỗi 50 files
          if (scannedFiles % 50 === 0) {
            process.stdout.write(`\r🔍 Đã scan: ${scannedFiles} files...`);
          }
          
          // Kiểm tra từng category (giữ nguyên logic)
          for (const [category, config] of Object.entries(trashPatterns)) {
            for (const pattern of config.patterns) {
              if (pattern.test(item)) {
                results[category].push({
                  path: relativePath,
                  size: sizeInMB,
                  isDirectory: stats.isDirectory()
                });
                totalSize += stats.size;
                break; // Chỉ match 1 category
              }
            }
          }
        } catch (err) {
          // ⚡ PERFORMANCE: Skip files không access được (permissions)
          if (err.code === 'EACCES') {
            skippedFiles++;
          }
          // Không log errors để tránh spam console
        }
      }));
    }
    
    // Clear progress line
    process.stdout.write('\r');
    
  } catch (err) {
    console.error('❌ Lỗi khi đọc directory:', err.message);
  }

  return { results, totalSize, scannedFiles, skippedFiles };
}

/**
 * 🔒 SECURITY: Safe write file (backup nếu file đã tồn tại)
 */
async function safeWriteFile(filePath, content) {
  // 🔒 SECURITY: Validate path
  if (!isPathSafe(filePath)) {
    throw new Error('Path không an toàn');
  }

  // Backup file cũ nếu tồn tại
  try {
    await fs.access(filePath);
    const backupPath = `${filePath}.backup`;
    await fs.copyFile(filePath, backupPath);
    console.log(`📦 Đã backup file cũ: ${path.basename(backupPath)}`);
  } catch (err) {
    // File không tồn tại, OK
  }

  // Write file mới
  await fs.writeFile(filePath, content, 'utf8');
}

/**
 * Main analysis
 */
async function main() {
  console.log('🔍 Đang phân tích project...\n');
  
  const startTime = Date.now();
  const { results, totalSize, scannedFiles, skippedFiles } = await analyzeDirectory();
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('=' .repeat(80));
  console.log('📊 KẾT QUẢ PHÂN TÍCH FILE RÁC');
  console.log('=' .repeat(80));

  let totalFiles = 0;

  for (const [category, config] of Object.entries(trashPatterns)) {
    const files = results[category];
    if (files.length > 0) {
      totalFiles += files.length;
      console.log(`\n📁 ${config.description}`);
      console.log(`   Số lượng: ${files.length} file(s)`);
      console.log('   ' + '-'.repeat(76));
      
      // Hiển thị tối đa 10 files đầu tiên
      const displayFiles = files.slice(0, 10);
      for (const file of displayFiles) {
        const icon = file.isDirectory ? '📂' : '📄';
        console.log(`   ${icon} ${file.path} (${file.size} MB)`);
      }
      
      if (files.length > 10) {
        console.log(`   ... và ${files.length - 10} file(s) khác`);
      }
    }
  }

  console.log('\n' + '=' .repeat(80));
  console.log(`📊 TỔNG KẾT:`);
  console.log(`   - Tổng số file rác: ${totalFiles} file(s)`);
  console.log(`   - Tổng dung lượng: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   - Files đã scan: ${scannedFiles}`);
  console.log(`   - Files bỏ qua: ${skippedFiles}`);
  console.log(`   - Thời gian: ${duration}s`);
  console.log('=' .repeat(80));

  // 🔒 SECURITY: Safe write với backup
  const outputPath = path.join(projectRoot, 'trash-files-list.json');
  try {
    await safeWriteFile(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n✅ Danh sách chi tiết đã được lưu vào: trash-files-list.json`);
  } catch (err) {
    console.error(`❌ Lỗi khi lưu file: ${err.message}`);
    process.exit(1);
  }

  console.log('\n💡 GỢI Ý:');
  console.log('   1. Xem lại danh sách trong trash-files-list.json');
  console.log('   2. Chạy: node cleanup-execute.js --dry-run để xem preview');
  console.log('   3. Chạy: node cleanup-execute.js để xóa file rác');
  
  // ⚡ PERFORMANCE: Show performance stats
  console.log('\n⚡ PERFORMANCE:');
  console.log(`   - Tốc độ scan: ${(scannedFiles / parseFloat(duration)).toFixed(0)} files/s`);
  console.log(`   - Memory usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
}

// Run with error handling
main().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});

