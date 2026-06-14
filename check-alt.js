const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next')) results = results.concat(walk(file));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) results.push(file);
  });
  return results;
}
const files = walk('./src');
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/<Image\s/) && !line.includes('Icon') && !line.includes('//')) {
      let block = line;
      let j = i;
      while (!block.includes('/>') && !block.includes('</Image>') && j < lines.length - 1) { j++; block += ' ' + lines[j]; }
      const altMatch = block.match(/alt=\{([^}]+)\}/);
      if (altMatch) {
        const altExpr = altMatch[1].trim();
        const hasOr = altExpr.includes('||');
        const hasNull = altExpr.includes('??');
        const isString = altExpr.startsWith('"') || altExpr.startsWith('`');
        if (!hasOr && !hasNull && !isString) {
          const rel = f.replace(/.*\\src\\/, 'src/');
          console.log(rel + ':' + (i+1) + ' -> alt={' + altExpr + '}');
        }
      }
    }
  }
});
