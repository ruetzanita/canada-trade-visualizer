const fs = require('fs');

const routePath = './app/api/country-metrics/route.ts';
let content = fs.readFileSync(routePath, 'utf8');

content = content.replace(
  /countryMap\[cName\]\.currentTotal \+= row\.total_export_value_cad;/g,
  `countryMap[cName].currentTotal += Number(row.total_export_value_cad);`
);

content = content.replace(
  /countryMap\[cName\]\.prevTotal \+= row\.total_export_value_cad;/g,
  `countryMap[cName].prevTotal += Number(row.total_export_value_cad);`
);

content = content.replace(
  /countryMap\[cName\]\.ytdPrevTotal \+= row\.total_export_value_cad;/g,
  `countryMap[cName].ytdPrevTotal += Number(row.total_export_value_cad);`
);

fs.writeFileSync(routePath, content);
console.log("Fixed number errors");
