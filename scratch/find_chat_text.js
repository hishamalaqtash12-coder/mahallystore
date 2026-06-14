const fs = require('fs');

const script4 = fs.readFileSync('scratch/script_4.js', 'utf8');

// Let's look for "role" followed by "user" or "assistant" or "system"
// And let's find text around it.
// In ChatGPT share data, the data might be serialized in a JSON-like format or Next.js state.
// Let's search for "parts" or "author" or "message"

// Let's write a regex that matches strings that contain sentences.
// Let's search for JSON keys that could be messages.
// Or let's see if we can find any long text strings in script4.
// Let's extract all strings in script4 of length > 50 characters.

const stringRegex = /"([^"\\]|\\.)*"/g;
let match;
const longStrings = [];
while ((match = stringRegex.exec(script4)) !== null) {
  const str = match[0];
  if (str.length > 200) {
    longStrings.push(str);
  }
}

console.log(`Found ${longStrings.length} strings longer than 200 chars.`);
fs.writeFileSync('scratch/long_strings.txt', longStrings.join('\n\n---\n\n'));
console.log('Saved long strings to scratch/long_strings.txt');
