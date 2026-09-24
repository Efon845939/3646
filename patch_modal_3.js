import fs from 'fs';

let content = fs.readFileSync('src/components/TeamModal.tsx', 'utf-8');

const newTacticBlock = `
                <div>
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
                </div>
`;

content = content.replace(/<div>\s*<div className="text-\[10px\] text-text-muted font-bold uppercase mb-1">Recommended Tactic<\/div>\s*<p className="text-sm text-text-main leading-relaxed">\s*\{team\.number === 3646 \? "Maintain consistent high performance and lead alliance strategies\." : team\.counterPlay\}\s*<\/p>\s*<\/div>/, newTacticBlock);

fs.writeFileSync('src/components/TeamModal.tsx', content);
