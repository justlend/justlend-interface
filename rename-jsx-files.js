const fs = require('fs');
const path = require('path');

const jsxRegex = /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>/;

function isJSXFile(content) {
  return jsxRegex.test(content);
}

function walk(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file === 'node_modules') continue;
      walk(fullPath);
    } else if (file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (isJSXFile(content)) {
        const newPath = fullPath.replace(/\.js$/, '.jsx');
        fs.renameSync(fullPath, newPath);
        console.log(`✅ Renamed: ${fullPath} → ${newPath}`);
      }
    }
  }
}

walk(path.resolve(__dirname, 'src'));
