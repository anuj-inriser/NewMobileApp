const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = [];
  const entries = fs.readdirSync(dir);
  for (const f of entries) {
    const fp = path.join(dir, f);
    const stat = fs.statSync(fp);
    const skip = ['node_modules', '.git', 'android', 'ios', '.expo'];
    if (stat.isDirectory() && !skip.includes(f)) {
      files.push(...walk(fp));
    } else if (f.endsWith('.js') || f.endsWith('.jsx')) {
      files.push(fp);
    }
  }
  return files;
}

const files = walk('src');
const results = [];

files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  const lines = code.split('\n');
  lines.forEach((l, i) => {
    const trimmed = l.trim();
    if (trimmed.startsWith('useEffect') && !trimmed.startsWith('//')) {
      // Grab next 20 lines to check dep array
      const block = lines.slice(i, i + 20).join('\n');
      const hasDepArray = block.includes('}, [');
      if (!hasDepArray) {
        results.push(`${f}:${i+1} [NO DEP ARRAY] ${trimmed.substring(0, 60)}`);
      }
    }
  });
});

console.log('=== useEffect WITHOUT dep array ===');
results.forEach(r => console.log(r));
console.log('\nTotal:', results.length);
