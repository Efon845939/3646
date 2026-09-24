import fs from 'fs';
let content = fs.readFileSync('src/components/MatchSimulator.tsx', 'utf-8');
content = content.replace(/\\`/g, "`");
content = content.replace(/\\\$/g, "$");
fs.writeFileSync('src/components/MatchSimulator.tsx', content);
