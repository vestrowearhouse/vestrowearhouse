const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const adminFiles = walk(path.join(__dirname, 'app', 'admin'));
adminFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  const regex = /className="([^"]*)max-w-[4567]xl([^"]*)"/g;
  if (regex.test(content)) {
    content = content.replace(regex, (match, p1, p2) => {
       // Filter out existing width constraints
       let classes = match.substring(11, match.length - 1).split(' ');
       
       // Don't apply to Modals (which usually have fixed, absolute, or max-h-[90vh] etc)
       if (classes.includes('fixed') || classes.includes('absolute')) return match;
       
       classes = classes.filter(c => !c.startsWith('max-w-') && c !== 'mx-auto' && c !== 'w-full');
       classes.push('w-full', 'max-w-7xl', 'mx-auto');
       
       return `className="${classes.join(' ').trim()}"`;
    });
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Fixed layout:', file);
  }
});

const apiFiles = walk(path.join(__dirname, 'app', 'api'));
apiFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  // Replace: const decoded = token ? verifyAdminToken(request) : null;
  const regex1 = /token \? verifyAdminToken\(request\) : null/g;
  if (regex1.test(content)) {
    content = content.replace(regex1, 'token ? await verifyAdminToken(request) : null');
    changed = true;
  }
  
  // Replace: = verifyAdminToken(request)
  const regex2 = /= verifyAdminToken\(request\)/g;
  if (regex2.test(content)) {
    content = content.replace(regex2, '= await verifyAdminToken(request)');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Fixed API await:', file);
  }
});
