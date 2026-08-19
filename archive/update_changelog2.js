const fs = require('fs');
const changelogPath = './changelog.md';
let content = fs.readFileSync(changelogPath, 'utf8');

const newEntry = `- Refined \`/api/country-metrics/route.ts\` to support the distinct 33 EUD countries by properly mapping their qualitative context from "Rest of EU" and "EFTA" keys.
- Updated the API to group IPD countries (Argentina, Bolivia, Colombia, Ecuador, Paraguay, Uruguay, and Venezuela) into a single "Rest of South America" aggregated payload.`;

content = content.replace("### Changed\n", "### Changed\n" + newEntry + "\n");
fs.writeFileSync(changelogPath, content);
