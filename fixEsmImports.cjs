const fs = require('fs');
const path = require('path');

// Function to verify that a path is a folder
function isDirectory(directoryPath) {
  return fs.existsSync(directoryPath) && fs.lstatSync(directoryPath).isDirectory();
}

// Function to add the .js or index.js extension to the imports
function fixImportPath(filePath) {
  let fileContent = fs.readFileSync(filePath, 'utf8');
  const regex = /import\s+(?:(?:\w+\s+from\s+)?['"])(\..*?)(?=['"])/g;

  fileContent = fileContent.replace(regex, (match, importPath) => {
    let fullPath = path.join(path.dirname(filePath), importPath);
    if (isDirectory(fullPath)) {
      // If it is a folder, add /index.js
      return match.replace(importPath, importPath + '/index.js');
    } else if (fs.existsSync(fullPath + '.js')) {
      // If the file exists, add .js
      return match.replace(importPath, importPath + '.js');
    }
    return match;
  });

  fs.writeFileSync(filePath, fileContent);
}

// Function to process a directory
function processDirectory(directory) {
  fs.readdirSync(directory).forEach(file => {
    let fullPath = path.join(directory, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      // If it is a folder, process recursively
      processDirectory(fullPath);
    } else if (path.extname(file) === '.js') {
      // If it is a .js file, adjust the imports
      fixImportPath(fullPath);
    }
  });
}

// Process from click
const args = process.argv.slice(2);

if (args.length !== 1) {
  console.error('Usage: node script.js <path-to-directory-or-file>');
  process.exit(1);
}

const targetPath = args[0];

if (!fs.existsSync(targetPath)) {
  console.error('The specified path does not exist.');
  process.exit(1);
}

if (isDirectory(targetPath)) {
  processDirectory(targetPath);
} else if (path.extname(targetPath) === '.js') {
  fixImportPath(targetPath);
} else {
  console.error('The path is not a JavaScript file or directory.');
  process.exit(1);
}

console.log('Import paths fixed.');
