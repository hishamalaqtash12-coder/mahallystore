const fs = require('fs');

const script9 = fs.readFileSync('scratch/script_9.js', 'utf8');

// Strip the javascript prefix and suffix to get the pure JSON string
let jsonStr = script9.trim();
const prefix = 'window.__reactRouterContext.streamController.enqueue("';
const suffix = '");';

if (jsonStr.startsWith(prefix)) {
  jsonStr = jsonStr.substring(prefix.length);
}
if (jsonStr.endsWith(suffix)) {
  jsonStr = jsonStr.substring(0, jsonStr.length - suffix.length);
}

// In the JS stream controller call, the string inside enqueue() is a JSON-encoded string itself, so quotes and backslashes are escaped.
// Let's decode it.
// We can use JSON.parse('"' + jsonStr + '"') or similar.
let decodedStr;
try {
  // Let's parse it as a JS string by creating a quick dynamic function or using JSON.parse on the escaped string.
  decodedStr = JSON.parse(`"${jsonStr}"`);
} catch (e) {
  console.log('Error decoding string:', e.message);
  // Fallback: try to replace escaped quotes and newlines
  decodedStr = jsonStr
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\\\/g, '\\')
    .replace(/\\t/g, '\t');
}

// Now we have the decoded JSON array string. Let's parse it!
try {
  const data = JSON.parse(decodedStr);
  console.log('Successfully parsed JSON data! Array length:', data.length);
  
  // Let's dump all string elements of the array that are longer than 50 characters, or contain markdown/chat indicators
  const chatMessages = [];
  for (const item of data) {
    if (typeof item === 'string') {
      if (item.length > 50 && (item.includes('\n') || item.includes('?') || item.includes('code') || item.includes('WooCommerce') || item.includes('#'))) {
        chatMessages.push(item);
      }
    }
  }
  
  console.log(`Found ${chatMessages.length} potential chat messages.`);
  fs.writeFileSync('scratch/chat_history.md', chatMessages.join('\n\n=======================================================\n\n'));
  console.log('Saved chat history to scratch/chat_history.md');
} catch (e) {
  console.log('Error parsing decoded JSON:', e.message);
  // Let's write the decoded string to a file to examine
  fs.writeFileSync('scratch/decoded_str.txt', decodedStr);
}
