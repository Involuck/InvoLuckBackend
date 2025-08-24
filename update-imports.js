/**
 * Script to update all imports in TypeScript files to use .js extension
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories to process
const directories = [
  'src/config',
  'src/controllers',
  'src/middlewares',
  'src/models',
  'src/routes',
  'src/services',
  'src/utils',
  'src/validators'
];

// Function to update imports in a file
function updateImportsInFile(filePath) {
  if (!filePath.endsWith('.ts') || filePath.endsWith('.d.ts')) {
    return;
  }

  console.log(`Processing ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace relative imports without extension
  const importRegex = /from\s+['"]([\.\/]+[^'"]+)['"]/g;
  
  content = content.replace(importRegex, (match, importPath) => {
    // Skip if already has extension or is a package
    if (importPath.includes('.js') || !importPath.startsWith('.')) {
      return match;
    }
    
    return `from '${importPath}.js'`;
  });
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
}

// Process all directories
directories.forEach(dir => {
  const dirPath = path.resolve(__dirname, dir);
  
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory ${dirPath} does not exist, skipping`);
    return;
  }
  
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    
    if (fs.statSync(filePath).isFile()) {
      updateImportsInFile(filePath);
    }
  });
});

console.log('Import updates completed');