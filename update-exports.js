/**
 * Script to update export patterns in TypeScript files
 * This ensures consistency between named exports and default exports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories to process
const directories = [
  'src/config',
  'src/middlewares',
  'src/utils'
];

// Function to update exports in a file
function updateExportsInFile(filePath) {
  if (!filePath.endsWith('.ts') || filePath.endsWith('.d.ts')) {
    return;
  }

  console.log(`Processing ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find export const declarations that are also exported as default
  const namedExportRegex = /export\s+const\s+(\w+)/g;
  const defaultExportRegex = /export\s+default\s+(\w+)/;
  
  let match;
  const namedExports = [];
  
  // Collect all named exports
  while ((match = namedExportRegex.exec(content)) !== null) {
    namedExports.push(match[1]);
  }
  
  // Find default export
  const defaultMatch = defaultExportRegex.exec(content);
  if (defaultMatch) {
    const defaultExport = defaultMatch[1];
    
    // Check if the default export is also a named export
    if (namedExports.includes(defaultExport)) {
      console.log(`Found conflict: ${defaultExport} is both named and default export`);
      
      // Replace the named export with a regular const
      content = content.replace(
        new RegExp(`export\\s+const\\s+${defaultExport}\\s*=`, 'g'),
        `const ${defaultExport} =`
      );
      
      // Make sure it's included in the named exports list
      if (!content.includes(`export { ${defaultExport}`)) {
        // Add to existing export statement or create a new one
        if (content.includes('export {')) {
          content = content.replace(/export\s*{([^}]*)}/g, (match, exports) => {
            return `export {${exports}, ${defaultExport}}`;
          });
        } else {
          // Add before the default export
          content = content.replace(
            `export default ${defaultExport}`,
            `export { ${defaultExport} };\nexport default ${defaultExport}`
          );
        }
      }
    }
  }
  
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
      updateExportsInFile(filePath);
    }
  });
});

console.log('Export updates completed');
