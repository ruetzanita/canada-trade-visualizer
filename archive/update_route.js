const fs = require('fs');

const routePath = './app/api/country-metrics/route.ts';
let content = fs.readFileSync(routePath, 'utf8');

// Define constants
const constants = `
const REST_OF_SA = ["Argentina", "Bolivia", "Colombia", "Ecuador", "Paraguay", "Uruguay", "Venezuela"];

const EU_COUNTRIES = [
  "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark", "Estonia", 
  "Finland", "France", "Germany", "Greece", "Hungary", "Ireland", "Italy", "Latvia", 
  "Lithuania", "Luxembourg", "Malta", "Netherlands", "Poland", "Portugal", "Romania", 
  "Slovakia", "Slovenia", "Spain", "Sweden"
];

const EFTA_COUNTRIES = ["Iceland", "Liechtenstein", "Norway", "Switzerland"];
`;

// Inject constants after imports
content = content.replace(/(import fs from 'fs';\n)/, `$1\n${constants}`);

// Update pass 1
const pass1Old = `      const cName = row.country_name;

      if (!countryMap[cName]) {
        countryMap[cName] = {
          country_name: cName,
          country_code: row.country_code,
          currentMonths: [],
          currentTotal: 0,
          prevTotal: 0,
          ytdPrevTotal: 0,
        };
      }`;

const pass1New = `      let cName = row.country_name;
      let cCode = row.country_code;

      if (REST_OF_SA.includes(cName)) {
        cName = "Rest of South America";
        cCode = "ROSA";
      }

      if (!countryMap[cName]) {
        countryMap[cName] = {
          country_name: cName,
          country_code: cCode,
          currentMonths: [],
          currentTotal: 0,
          prevTotal: 0,
          ytdPrevTotal: 0,
        };
      }`;

content = content.replace(pass1Old, pass1New);

// Update pass 2
const pass2Old = `        const cName = row.country_name;
        const rMonthStr = String(row.report_month);
        const rYear = parseInt(rMonthStr.substring(0, 4), 10);
        const rMonth = rMonthStr.substring(4, 6);

        if (rYear === prevYear && countryMap[cName].currentMonths.includes(rMonth)) {
          countryMap[cName].ytdPrevTotal += row.total_export_value_cad;
        }`;

const pass2New = `        let cName = row.country_name;
        if (REST_OF_SA.includes(cName)) {
          cName = "Rest of South America";
        }
        
        const rMonthStr = String(row.report_month);
        const rYear = parseInt(rMonthStr.substring(0, 4), 10);
        const rMonth = rMonthStr.substring(4, 6);

        if (rYear === prevYear && countryMap[cName].currentMonths.includes(rMonth)) {
          countryMap[cName].ytdPrevTotal += row.total_export_value_cad;
        }`;

content = content.replace(pass2Old, pass2New);

// Update context mapping
const contextOld = `      // Context mapping - some DB names might not exactly match the JSON keys but we try direct mapping
      const context = allContext[cName] || null;`;

const contextNew = `      // Context mapping
      let mappedName = cName;
      if (EU_COUNTRIES.includes(cName) && !["France", "Germany", "Italy"].includes(cName)) {
        mappedName = "Rest of EU";
      } else if (EFTA_COUNTRIES.includes(cName)) {
        mappedName = "EFTA";
      }
      
      const context = allContext[mappedName] || allContext[cName] || null;`;

content = content.replace(contextOld, contextNew);

fs.writeFileSync(routePath, content);
console.log("Updated route.ts successfully");
