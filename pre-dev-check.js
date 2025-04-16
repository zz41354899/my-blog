#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');

// 讀取配置文件
const config = JSON.parse(fs.readFileSync('./pre-dev-check.json', 'utf8'));
const chalk = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
};

console.log(chalk.blue(config.promptMessages[0]));

// 計數修復的問題
let fixCount = 0;

// 檢查 Next.js params 問題
function checkParamsUsage() {
  console.log(chalk.cyan('🔍 檢查 Next.js params 使用方式...'));

  const files = glob.sync('src/app/**/**/page.tsx');
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // 檢查常見的錯誤模式
    const hasUseParams = content.includes('use(useParams())');
    const directParamsAccess = content.includes('params.id') && 
                              !content.includes('params = useParams() as {') && 
                              !content.includes('const { id } = ');
    
    if (hasUseParams || directParamsAccess) {
      console.log(chalk.yellow(`⚠️ 在 ${file} 中發現可能的 params 使用錯誤`));
      
      let newContent = content;
      
      // 替換 use(useParams())
      if (hasUseParams) {
        newContent = newContent.replace(
          /const\s+params\s*=\s*use\s*\(\s*useParams\s*\(\s*\)\s*\)\s*;/g,
          'const params = useParams() as { id: string };'
        );
        fixCount++;
      }
      
      // 處理直接使用 params.id 但沒有正確類型斷言的情況
      if (directParamsAccess && !hasUseParams) {
        // 尋找 params 宣告行
        const paramsDeclarationRegex = /const\s+params\s*=\s*useParams\s*\(\s*\)\s*;/g;
        if (paramsDeclarationRegex.test(newContent)) {
          newContent = newContent.replace(
            paramsDeclarationRegex,
            'const params = useParams() as { id: string };'
          );
          fixCount++;
        }
      }
      
      if (newContent !== content) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(chalk.green(`✅ 已修正 ${file} 中的 params 使用問題`));
      }
    }
  });
}

// 檢查 cover_url 與 coverUrl 不一致的問題
function checkCoverUrlMismatch() {
  console.log(chalk.cyan('🔍 檢查 cover_url 字段命名一致性...'));
  
  let patterns = config.autoFix.coverUrlMismatch.checkIn || ['src/**/*.{ts,tsx}'];
  const files = patterns.flatMap(pattern => glob.sync(pattern));
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // 檢查代碼中是否存在屬性不一致的問題，但排除註釋和字符串中的匹配
    const hasInconsistency = (content.includes('coverUrl:') && content.includes('cover_url')) ||
                            (content.includes('coverUrl =') && content.includes('cover_url'));
    
    if (hasInconsistency) {
      console.log(chalk.yellow(`⚠️ 在 ${file} 中發現 coverUrl 與 cover_url 命名不一致`));
      
      // 這裡我們不進行自動修復，因為這可能需要更複雜的分析
      // 只是提醒開發者檢查
    }
    
    // 檢查是否有 undefined 值賦給 cover_url
    const undefinedPattern = /cover_url:.*undefined/g;
    const coverUrlUndefined = undefinedPattern.test(content);
    
    if (coverUrlUndefined) {
      console.log(chalk.yellow(`⚠️ 在 ${file} 中發現 cover_url 可能使用 undefined 而非空字串`));
      
      let newContent = content.replace(
        /cover_url:\s*(\w+)\s*\|\|\s*undefined/g,
        'cover_url: $1 || ""'
      );
      
      if (newContent !== content) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(chalk.green(`✅ 已修正 ${file} 中的 cover_url undefined 問題`));
        fixCount++;
      }
    }
  });
}

// 檢查 slug 是否使用了安全的 slugify 函數
function checkSlugSafety() {
  console.log(chalk.cyan('🔍 檢查 slug 生成安全性...'));
  
  const files = glob.sync('src/app/admin/posts/**/*.tsx');
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // 檢查文件是否包含更新或創建文章的代碼，但沒有使用 slugify
    const hasSlugAssignment = content.includes('slug:') && content.includes('data.slug');
    const hasSlugify = content.includes('slugify(') || content.includes('generateSlug(');
    
    if (hasSlugAssignment && !hasSlugify) {
      console.log(chalk.yellow(`⚠️ 在 ${file} 中發現可能的不安全 slug 使用`));
      
      // 檢查是否已有 slugify 函數定義
      const hasSlugifyFunction = content.includes('function slugify(') || 
                                content.includes('const slugify =');
      
      let newContent = content;
      
      // 如果沒有 slugify 函數定義，添加一個
      if (!hasSlugifyFunction) {
        const slugifyFunction = `
// Slug 清洗函數，確保 URL 安全
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\\w\\s-]/g, '') // 移除非字母數字字符
    .replace(/\\s+/g, '-')      // 將空格替換為連字符
    .replace(/-+/g, '-')       // 移除連續連字符
    .replace(/^-+/, '')        // 刪除開頭的連字符
    .replace(/-+$/, '');       // 刪除結尾的連字符
}
`;
        
        // 找到 function 或 export 開頭的行，在其之前插入 slugify 函數
        const functionRegex = /^(function|export)/m;
        const match = functionRegex.exec(newContent);
        
        if (match) {
          const position = match.index;
          newContent = newContent.slice(0, position) + slugifyFunction + newContent.slice(position);
        } else {
          // 如果找不到恰當的位置，就在文件頂部添加（在導入語句之後）
          const importEndIndex = newContent.lastIndexOf("import ");
          const importEndLineIndex = newContent.indexOf(";", importEndIndex) + 1;
          
          if (importEndLineIndex > 0) {
            newContent = newContent.slice(0, importEndLineIndex) + "\n" + slugifyFunction + newContent.slice(importEndLineIndex);
          } else {
            newContent = slugifyFunction + newContent;
          }
        }
        
        fixCount++;
      }
      
      // 替換不安全的 slug 賦值
      newContent = newContent.replace(
        /slug:\s*data\.slug/g,
        'slug: slugify(data.slug)'
      );
      
      if (newContent !== content) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(chalk.green(`✅ 已修正 ${file} 中的 slug 安全性問題`));
        fixCount++;
      }
    }
  });
}

// 檢查 ESLint 錯誤，並修復可自動修復的問題
function checkAndFixLintErrors() {
  console.log(chalk.cyan('🔍 檢查 ESLint 錯誤...'));
  
  try {
    // 使用 ESLint 的 --fix 選項自動修復問題
    const output = execSync('npx eslint --fix "src/**/*.{ts,tsx}"', { encoding: 'utf8', stdio: 'pipe' });
    
    // 檢查是否有剩餘的錯誤
    try {
      const lintCheckOutput = execSync('npx eslint "src/**/*.{ts,tsx}"', { encoding: 'utf8', stdio: 'pipe' });
      console.log(chalk.green('✅ ESLint 檢查完成，沒有發現錯誤'));
    } catch (lintError) {
      // 如果執行過程中出錯，說明還有未修復的錯誤
      console.log(chalk.yellow('⚠️ 已自動修復部分 ESLint 錯誤，但仍有錯誤需要手動處理'));
      console.log(lintError.stdout);
    }
    
    fixCount++;
  } catch (error) {
    console.log(chalk.red('❌ ESLint 執行失敗'));
    // 這裡我們不輸出完整的錯誤，因為可能很冗長
    console.log(chalk.red('請確保已安裝 ESLint 及其依賴項'));
  }
}

// 執行所有檢查
function runAllChecks() {
  checkParamsUsage();
  checkCoverUrlMismatch();
  checkSlugSafety();
  
  try {
    checkAndFixLintErrors();
  } catch (e) {
    console.log(chalk.yellow('⚠️ ESLint 檢查跳過，可能尚未設置 ESLint'));
  }
  
  console.log(chalk.green(config.promptMessages[2].replace('{fixCount}', fixCount)));
  console.log(chalk.blue('🛠️ Dev 啟動前檢查已完成'));
}

// 開始執行檢查
runAllChecks(); 