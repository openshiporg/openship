const fs = require('fs').promises;
const https = require('https');
const path = require('path');

let successCount = 0;
let failureCount = 0;
let failedFiles = [];

function removeTypeImports(content) {
  let result = content;
  
  // Remove type-only imports
  result = result.replace(/import\s+type\s*{[^}]*}\s*from\s*['"][^'"]*['"]\s*;?\s*\n?/g, '');
  
  // Handle mixed imports - remove type keywords and type-only imports
  result = result.replace(/import\s*{([^}]*)}\s*from\s*['"][^'"]*['"]\s*;?/g, (match, importList) => {
    // Split the imports by comma and clean up whitespace
    const imports = importList.split(',').map(i => i.trim());
    
    // Filter out type imports and remove 'type' keyword from remaining imports
    const cleanedImports = imports
      .filter(i => !i.startsWith('type '))
      .map(i => i.replace(/^type\s+/, ''))
      .filter(i => i); // Remove empty strings
    
    // If no imports remain, return empty string
    if (cleanedImports.length === 0) return '';
    
    // Reconstruct the import statement
    return `import { ${cleanedImports.join(', ')} } from ${match.split('from')[1]}`;
  });
  
  return result;
}

async function convertTsToJs(tsContent) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'transform.tools',
      path: '/api/typescript-to-javascript',
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:134.0) Gecko/20100101 Firefox/134.0',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Content-Type': 'plain/text',
        'Sec-GPC': '1',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Priority': 'u=0',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'Referer': 'https://transform.tools/typescript-to-javascript'
      }
    };

    const req = https.request(options, (res) => {
      console.log('Response status:', res.statusCode);
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          console.error('API Error:', data);
          reject(new Error(`API returned status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.write(tsContent);
    req.end();
  });
}

async function processFile(filePath) {
  try {
    // Skip if it's not a TypeScript file
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
      return;
    }

    console.log(`\nProcessing ${filePath}...`);
    
    // Read the TypeScript file
    const tsContent = await fs.readFile(filePath, 'utf8');
    
    // Remove type imports
    const cleanedContent = removeTypeImports(tsContent);
    
    try {
      // Convert to JavaScript
      const jsContent = await convertTsToJs(cleanedContent);
      
      if (jsContent) {
        // Create the new JavaScript file path
        const jsPath = filePath.replace(/\.tsx?$/, '.js');
        
        // Write the JavaScript file
        await fs.writeFile(jsPath, jsContent);
        console.log(`✓ Successfully converted ${filePath} to ${jsPath}`);
        successCount++;
        
        // Delete the TypeScript file
        await fs.unlink(filePath);
        console.log(`Deleted original TypeScript file: ${filePath}`);
      }
    } catch (apiError) {
      console.error(`⚠️  API conversion failed for ${filePath}: ${apiError.message}`);
      console.log(`Original file kept: ${filePath}`);
      failureCount++;
      failedFiles.push(filePath);
    }
    
    // Add a delay between files to avoid rate limiting
    console.log('Waiting 2 seconds before next file...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    failureCount++;
    failedFiles.push(filePath);
  }
}

async function processDirectory(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and .git directories
        if (entry.name !== 'node_modules' && entry.name !== '.git') {
          await processDirectory(fullPath);
        }
      } else {
        await processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error);
  }
}

// Start processing from the current directory
const currentDir = __dirname;
console.log(`Starting conversion in ${currentDir}`);
console.log('This may take a while depending on the number of files...\n');

processDirectory(currentDir).then(() => {
  console.log('\nConversion process completed!');
  console.log('----------------------------------------');
  console.log(`Total successful conversions: ${successCount}`);
  console.log(`Total failed conversions: ${failureCount}`);
  if (failedFiles.length > 0) {
    console.log('\nFailed files:');
    failedFiles.forEach(file => console.log(`- ${file}`));
  }
  console.log('----------------------------------------');
}).catch(error => {
  console.error('Error during conversion process:', error);
}); 