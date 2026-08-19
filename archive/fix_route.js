const fs = require('fs');

const routePath = './app/api/country-metrics/route.ts';
let content = fs.readFileSync(routePath, 'utf8');

// Fix first pass
content = content.replace(
  /let cName = row\.country_name;\n\s*let cCode = row\.country_code;/,
  `let cName = String(row.country_name);\n      let cCode = String(row.country_code);`
);

// Fix second pass
content = content.replace(
  /let cName = row\.country_name;/,
  `let cName = String(row.country_name);`
);

fs.writeFileSync(routePath, content);
console.log("Fixed TS errors in route.ts");
