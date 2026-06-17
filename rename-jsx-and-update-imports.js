const fs = require('fs');
const path = require('path');

const jsxRegex = /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>/;
const importRegex = /(from\s+['"])(.*?)(\.js)(['"])/g;

const renamedFiles = [];

function isJSX(content) {
  return jsxRegex.test(content);
}

function walkAndRename(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file === 'node_modules') continue;
      walkAndRename(fullPath);
    } else if (file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (isJSX(content)) {
        const newPath = fullPath.replace(/\.js$/, '.jsx');
        fs.renameSync(fullPath, newPath);
        renamedFiles.push({
          oldPath: fullPath,
          newPath,
          relative: './' + path.relative(path.resolve('src'), fullPath).replace(/\\/g, '/')
        });
      }
    }
  }
}

function walkAndReplaceImports(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file === 'node_modules') continue;
      walkAndReplaceImports(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      let updated = false;

      renamedFiles.forEach(({ relative }) => {
        const regex = new RegExp(`(from\\s+['"])(${relative.replace(/\./g, '\\.')})(\\.js)(['"])`, 'g');
        content = content.replace(regex, `$1$2.jsx$4`);
        updated = true;
      });

      if (updated) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`🔧 Updated imports in: ${fullPath}`);
      }
    }
  }
}

// Step 1: Rename .js with JSX to .jsx
walkAndRename(path.resolve(__dirname, 'src'));

// Step 2: Update all import paths pointing to those files
walkAndReplaceImports(path.resolve(__dirname, 'src'));
