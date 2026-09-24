import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Add topScore to TeamCard usage
content = content.replace(
  /<TeamCard team={team} \/>/g,
  `<TeamCard team={team} topScore={highestScore} />`
);

fs.writeFileSync('src/App.tsx', content);
