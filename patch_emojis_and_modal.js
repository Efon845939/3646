import fs from 'fs';

// App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf-8');
appContent = appContent.replace("Score: High 🔽", "Score: High");
appContent = appContent.replace("Score: Low 🔼", "Score: Low");
appContent = appContent.replace("🏆 Impact Winners", "Impact Winners");
appContent = appContent.replace("🎨 Most Creative", "Most Creative");
appContent = appContent.replace("⚡ High Threat", "High Threat");
appContent = appContent.replace("✨ Best Branding", "Best Branding");
fs.writeFileSync('src/App.tsx', appContent);

// TeamCard.tsx
let cardContent = fs.readFileSync('src/components/TeamCard.tsx', 'utf-8');
cardContent = cardContent.replace('<span className="mr-2 text-xs">▲</span>', '');
cardContent = cardContent.replace('<span className="mr-2 text-xs">▼</span>', '');
// Add lucide-react imports if we want to replace with icons, or just leave text. Let's just remove the symbols to be safe.
fs.writeFileSync('src/components/TeamCard.tsx', cardContent);

// TeamModal.tsx
let modalContent = fs.readFileSync('src/components/TeamModal.tsx', 'utf-8');
modalContent = modalContent.replace('<span className="mr-2 text-sm">▲</span>', '');
modalContent = modalContent.replace('<span className="mr-2 text-sm">▼</span>', '');

const newTacticBlock = `
                <div>
                  <div className="text-[10px] text-text-muted font-bold uppercase mb-1">Strategic Insight</div>
                  
                  <div className="bg-purple-500/10 border border-purple-500/30 p-3 rounded-lg mt-2">
                    <div className="text-[10px] text-purple-400 font-bold uppercase mb-1 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" /> Predictive Analysis
                    </div>
                    <p className="text-sm text-purple-400 font-medium">
                      Based on their current score of {team.score}, {
                         team.score >= 95 ? "they are projected to maintain a top-tier aggressive scoring pace in upcoming matches." :
                         team.score >= 85 ? "they show stable metrics indicating reliable supportive or secondary scoring potential." :
                         "they are likely to encounter resistance against high-tier teams; expect defensive or opportunistic play."
                       } {team.prediction}
                    </p>
                  </div>

                  {team.number === 3646 ? (
                    <div className="bg-integra-yellow/10 border border-integra-yellow/30 p-3 rounded-lg mt-2">
                      <p className="text-sm text-integra-yellow font-medium">
                        Maintain consistent high performance and lead alliance strategies.
                      </p>
                    </div>
                  ) : team.score >= 95 ? (
                    <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg mt-2">
                      <div className="text-[10px] text-red-500 font-bold uppercase mb-1 flex items-center">
                        <ShieldAlert className="w-3 h-3 mr-1" /> Counter-Play Tactic
                      </div>
                      <p className="text-sm text-red-400 font-medium">
                        {team.counterPlay}
                      </p>
                    </div>
                  ) : team.score >= 85 ? (
                    <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg mt-2">
                      <div className="text-[10px] text-blue-400 font-bold uppercase mb-1 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" /> Synergy Advice
                      </div>
                      <p className="text-sm text-blue-400 font-medium">
                        Align our strategies with their strengths. {team.counterPlay.replace('Counter', 'Coordinate').replace('Defend', 'Support')}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-500/10 border border-gray-500/30 p-3 rounded-lg mt-2">
                      <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Recommendation</div>
                      <p className="text-sm text-gray-400 font-medium">
                        Standard approach. Minimize resource expenditure on specialized tactics.
                      </p>
                    </div>
                  )}
                </div>
`;

// Replace the old Strategic Insight block
const targetStrRegex = /<div>\s*<div className="text-\[10px\] text-text-muted font-bold uppercase mb-1">Strategic Insight<\/div>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}/;

const targetPart = `<div>
                  <div className="text-[10px] text-text-muted font-bold uppercase mb-1">Strategic Insight</div>
                  {team.number === 3646 ? (
                    <div className="bg-integra-yellow/10 border border-integra-yellow/30 p-3 rounded-lg mt-2">
                      <p className="text-sm text-integra-yellow font-medium">
                        Maintain consistent high performance and lead alliance strategies.
                      </p>
                    </div>
                  ) : team.score >= 95 ? (
                    <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg mt-2">
                      <div className="text-[10px] text-red-500 font-bold uppercase mb-1 flex items-center">
                        <ShieldAlert className="w-3 h-3 mr-1" /> Counter-Play Tactic
                      </div>
                      <p className="text-sm text-red-400 font-medium">
                        {team.counterPlay}
                      </p>
                    </div>
                  ) : team.score >= 85 ? (
                    <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg mt-2">
                      <div className="text-[10px] text-blue-400 font-bold uppercase mb-1 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" /> Synergy Advice
                      </div>
                      <p className="text-sm text-blue-400 font-medium">
                        Align our strategies with their strengths. {team.counterPlay.replace('Counter', 'Coordinate').replace('Defend', 'Support')}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-500/10 border border-gray-500/30 p-3 rounded-lg mt-2">
                      <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Recommendation</div>
                      <p className="text-sm text-gray-400 font-medium">
                        Standard approach. Minimize resource expenditure on specialized tactics.
                      </p>
                    </div>
                  )}
                </div>`;

modalContent = modalContent.replace(targetPart, newTacticBlock);

// Remove prediction from Strengths & Weaknesses Synthesis since we moved it to Predictive Analysis
modalContent = modalContent.replace(
  "provides a clear opening. {team.prediction}",
  "provides a clear opening."
);

fs.writeFileSync('src/components/TeamModal.tsx', modalContent);
