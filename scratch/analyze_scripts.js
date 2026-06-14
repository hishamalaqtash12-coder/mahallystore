const fs = require('fs');

const script4 = fs.readFileSync('scratch/script_4.js', 'utf8');
const script9 = fs.readFileSync('scratch/script_9.js', 'utf8');

function findOccurrences(text, filename) {
  console.log(`Analyzing ${filename}...`);
  let index = -1;
  while ((index = text.toLowerCase().indexOf('woocommerce', index + 1)) !== -1) {
    console.log(`Found "woocommerce" at index ${index} in ${filename}`);
    console.log('CONTEXT:', text.substring(Math.max(0, index - 400), Math.min(text.length, index + 600)));
    console.log('----------------------------------------------------');
  }
}

findOccurrences(script4, 'script_4.js');
findOccurrences(script9, 'script_9.js');
