/**
 * Script phân tích và liệt kê các file rác trong project
 * Chạy: node cleanup-analysis.js
 */

const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;

// Danh sách patterns của file rác
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

// Files/folders nên GIỮ LẠI
const keepPatterns = [
  'README.md',
  'CHANGELOG.md',
  'LICENSE.md',
  'CONTRIBUTING.md',
  'README_DATABASE_SETUP.md', // Có thể giữ nếu cần
  'TESTING.md', // Có thể giữ nếu cần
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

function shouldKeep(filename) {
  return keepPatterns.some(pattern => {
    if (typeof pattern === 'string') {
      return filename === pattern;
    }
    return pattern.test(filename);
  });
}

function analyzeDirectory(dir = projectRoot) {
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

  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      // Skip nếu nên giữ lại
      if (shouldKeep(item)) continue;
      
      const fullPath = path.join(dir, item);
      const relativePath = path.relative(projectRoot, fullPath);
      
      try {
        const stats = fs.statSync(fullPath);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        // Kiểm tra từng category
        for (const [category, config] of Object.entries(trashPatterns)) {
          for (const pattern of config.patterns) {
            if (pattern.test(item)) {
              results[category].push({
                path: relativePath,
                size: sizeInMB,
                isDirectory: stats.isDirectory()
              });
              totalSize += stats.size;
              break;
            }
          }
        }
      } catch (err) {
        // Skip files we can't access
      }
    }
  } catch (err) {
    console.error('Error reading directory:', err.message);
  }

  return { results, totalSize };
}

// Main analysis
console.log('🔍 Đang phân tích project...\n');

const { results, totalSize } = analyzeDirectory();

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
console.log('=' .repeat(80));

// Tạo file JSON để sử dụng cho cleanup script
const outputPath = path.join(projectRoot, 'trash-files-list.json');
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`\n✅ Danh sách chi tiết đã được lưu vào: trash-files-list.json`);

console.log('\n💡 GỢI Ý:');
console.log('   1. Xem lại danh sách trong trash-files-list.json');
console.log('   2. Chạy: node cleanup-execute.js --dry-run để xem preview');
console.log('   3. Chạy: node cleanup-execute.js để xóa file rác');

