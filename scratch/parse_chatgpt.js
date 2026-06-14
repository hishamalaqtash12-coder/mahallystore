const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\dafc1c1f-b35f-42e5-84a2-ea738fefb605\\.system_generated\\steps\\7\\content.md';
const content = fs.readFileSync(filePath, 'utf8');

console.log('File size:', content.length);

// Let's find script tags
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(content)) !== null) {
  count++;
  const scriptContent = match[1];
  console.log(`Script ${count} size:`, scriptContent.length);
  if (scriptContent.includes('client-bootstrap') || scriptContent.includes('props') || scriptContent.includes('state') || scriptContent.includes('WooCommerce')) {
    console.log(`Script ${count} matches keywords`);
  }
}

// Let's search for "WooCommerce" or other words in the raw content
const keywords = ['WooCommerce', 'performance', 'database', 'get', 'post', 'GraphQL', 'rest', 'wp-graphql', 'coCart', 'dokan'];
for (const word of keywords) {
  const index = content.toLowerCase().indexOf(word.toLowerCase());
  console.log(`Keyword "${word}" index:`, index);
  if (index !== -1) {
    console.log(`Snippet around "${word}":`, content.substring(Math.max(0, index - 200), Math.min(content.length, index + 200)));
  }
}
