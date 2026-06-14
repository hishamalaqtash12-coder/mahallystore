const fs = require('fs');
const filePath = 'C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\dafc1c1f-b35f-42e5-84a2-ea738fefb605\\.system_generated\\steps\\7\\content.md';
const content = fs.readFileSync(filePath, 'utf8');

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(content)) !== null) {
  count++;
  const scriptContent = match[1];
  if (count === 4) {
    // Write the big script tag contents to a temp file so we can analyze it
    fs.writeFileSync('scratch/script_4.js', scriptContent);
    console.log('Wrote script 4 to scratch/script_4.js');
  }
  if (count === 9) {
    fs.writeFileSync('scratch/script_9.js', scriptContent);
    console.log('Wrote script 9 to scratch/script_9.js');
  }
}

// Let's write a quick JS script to try and parse the JSON if they are JSON, or search for message text
// Let's write a script to search for text strings that look like questions/answers in script_4.js
const script4Content = fs.readFileSync('scratch/script_4.js', 'utf8');
// Let's see if it's JSON
try {
  // Try to find if there is a JSON inside. Sometimes it starts with window.__ssr_data = ... or similar, or it is just JSON
  const jsonMatch = script4Content.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    const jsonStr = jsonMatch[1];
    fs.writeFileSync('scratch/script_4_json.json', jsonStr);
    console.log('Wrote potential JSON block from script 4');
  }
} catch (e) {
  console.log('Error parsing json from script 4:', e.message);
}
