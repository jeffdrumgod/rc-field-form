const fs = require('fs');
const path = require('path');

// Função para verificar se um caminho é uma pasta
function isDirectory(directoryPath) {
  return fs.existsSync(directoryPath) && fs.lstatSync(directoryPath).isDirectory();
}

// Função para adicionar a extensão .js ou index.js aos imports
function fixImportPath(filePath) {
  let fileContent = fs.readFileSync(filePath, 'utf8');
  // Melhorando a expressão regular para capturar mais casos
  const regex = /import\s+(?:\w+\s*,\s*)?\{?.*?\}?\s*from\s+['"](\..*?)['"]/g;

  fileContent = fileContent.replace(regex, (match, importPath) => {
    let fullPath = path.join(path.dirname(filePath), importPath);
    if (isDirectory(fullPath)) {
      // Se for uma pasta, adicionar /index.js
      return match.replace(importPath, importPath + '/index.js');
    } else if (fs.existsSync(fullPath + '.js')) {
      // Se o arquivo existir, adicionar .js
      return match.replace(importPath, importPath + '.js');
    }
    return match;
  });

  fs.writeFileSync(filePath, fileContent);
}

// Função para processar um diretório
function processDirectory(directory) {
  fs.readdirSync(directory, { withFileTypes: true }).forEach(dirent => {
    let fullPath = path.join(directory, dirent.name);
    if (dirent.isDirectory()) {
      // Se for uma pasta, processar recursivamente
      processDirectory(fullPath);
    } else if (dirent.isFile() && path.extname(dirent.name) === '.js') {
      // Se for um arquivo .js, ajustar os imports
      fixImportPath(fullPath);
    }
  });
}

// Processar a partir da CLI
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
