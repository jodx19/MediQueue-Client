const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src');

const replacements = {
  'mq-teal-400': 'mq-t400',
  'mq-teal-300': 'mq-t400',
  'mq-teal-500': 'mq-teal',
  'mq-teal-600': 'mq-t600',
  'mq-navy-900': 'mq-navy',
  'mq-navy-800': 'mq-800',
  'mq-navy-700': 'mq-700',
  'mq-900': 'mq-navy',
  'mq-850': 'mq-800',
  'mq-slate-400': 'mq-s400',
  'mq-slate-500': 'mq-s400',
  'mq-650': 'mq-600',
  'mq-500': 'mq-s400'
};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.html') || file.endsWith('.scss') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(dir);
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  for (const [oldClass, newClass] of Object.entries(replacements)) {
    // Replace with word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${oldClass}\\b`, 'g');
    newContent = newContent.replace(regex, newClass);
  }
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedCount++;
    console.log(`Updated ${file}`);
  }
});

console.log(`\nFinished replacing colors. Changed ${changedCount} files.`);
