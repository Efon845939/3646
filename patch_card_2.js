import fs from 'fs';

let content = fs.readFileSync('src/components/TeamCard.tsx', 'utf-8');

// Add topScore to props
content = content.replace(
  "interface TeamCardProps {",
  "interface TeamCardProps {\n  topScore?: number;"
);

// Add topScore to destructuring
content = content.replace(
  "export function TeamCard({ team }: TeamCardProps) {",
  "export function TeamCard({ team, topScore = 97 }: TeamCardProps) {"
);

// Add visual heatmap glow to the card container
// Calculate intensity: power of 4 or 5 makes the top teams glow more noticeably while lower teams have minimal glow.
content = content.replace(
  /<div className="bg-surface rounded-2xl border border-border-main p-5 flex flex-col space-y-4 hover:shadow-\[0_0_15px_rgba\(254,222,0,0\.2\)\] transition-shadow duration-300 h-full">/,
  `<div 
      className="bg-surface rounded-2xl border p-5 flex flex-col space-y-4 hover:shadow-[0_0_20px_rgba(254,222,0,0.3)] transition-all duration-300 h-full relative"
      style={{
        borderColor: \`rgba(254, 222, 0, \${Math.pow(team.score / topScore, 6) * 0.4})\`,
        boxShadow: \`0 0 \${Math.pow(team.score / topScore, 6) * 15}px rgba(254, 222, 0, \${Math.pow(team.score / topScore, 6) * 0.15})\`
      }}
    >`
);

fs.writeFileSync('src/components/TeamCard.tsx', content);
