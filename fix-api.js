const fs = require('fs');
const path = require('path');

function processDirectory(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.js') || fullPath.endsWith('.jsx'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // 1. Fix unawaited verifyAdminToken
      const authRegex1 = /if\s*\(\s*!verifyAdminToken\(\s*request\s*\)\s*\)\s*\{/g;
      if (authRegex1.test(content)) {
        content = content.replace(authRegex1, 'if (!(await verifyAdminToken(request))) {');
        changed = true;
      }
      
      const authRegex2 = /if\s*\(\s*!adminToken\s*\|\|\s*!verifyAdminToken\(\s*request\s*\)\s*\)\s*\{/g;
      if (authRegex2.test(content)) {
        content = content.replace(authRegex2, 'if (!adminToken || !(await verifyAdminToken(request))) {');
        changed = true;
      }
      
      const authRegex3 = /if\s*\(\s*!verifyAdminToken\(\s*cookieStore\.get\('adminToken'\)\?\.value\s*\)\s*\)\s*\{/g;
      if (authRegex3.test(content)) {
        content = content.replace(authRegex3, "if (!(await verifyAdminToken(cookieStore.get('adminToken')?.value))) {");
        changed = true;
      }

      // 2. Fix NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY -> NEXT_PUBLIC_SUPABASE_ANON_KEY
      const keyRegex = /process\.env\.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/g;
      if (keyRegex.test(content)) {
        content = content.replace(keyRegex, 'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed:', fullPath);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'app', 'api'));
console.log('Done!');
