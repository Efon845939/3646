import fs from 'fs';

let content = fs.readFileSync('src/components/TeamModal.tsx', 'utf-8');

// We will replace the "AI Predictive Analysis" and "Strategic Counter-Play" blocks with a single comprehensive AI Analysis block.

const newAiBlock = `
            <div className="bg-surface-hover rounded-xl border border-border-main p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-main mb-4 flex items-center border-b border-border-main pb-2">
                <TrendingUp className="w-4 h-4 mr-2 text-blue-500" />
                AI Tactical & Relationship Analysis
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] text-text-muted font-bold uppercase mb-2">Integra Relationship Status</div>
                  {team.number === 3646 ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-integra-yellow text-[#111111] text-xs font-black uppercase">
                      IntegrA (Our Team)
                    </span>
                  ) : team.score >= 95 ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-red-500/20 text-red-500 border border-red-500/30 text-xs font-bold uppercase tracking-wide">
                      <ShieldAlert className="w-3 h-3 mr-1.5" />
                      Rival (İzlenecek Rakip)
                    </span>
                  ) : team.score >= 85 ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold uppercase tracking-wide">
                      <Trophy className="w-3 h-3 mr-1.5" />
                      Ally (Dost / Müttefik)
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-gray-500/20 text-gray-400 border border-gray-500/30 text-xs font-bold uppercase tracking-wide">
                      Neutral (Önemsiz)
                    </span>
                  )}
                </div>
                
                <div>
                  <div className="text-[10px] text-text-muted font-bold uppercase mb-1">Strengths & Weaknesses Synthesis</div>
                  <p className="text-sm text-text-main leading-relaxed">
                    By leveraging their advantages in <span className="text-green-400">{team.pros[0]?.toLowerCase()}</span>, they can dictate the pace of the match. However, their vulnerability regarding <span className="text-red-400">{team.cons[0]?.toLowerCase()}</span> provides a clear opening. {team.prediction}
                  </p>
                </div>

                <div>
                  <div className="text-[10px] text-text-muted font-bold uppercase mb-1">Recommended Tactic</div>
                  <p className="text-sm text-text-main leading-relaxed">
                    {team.number === 3646 ? "Maintain consistent high performance and lead alliance strategies." : team.counterPlay}
                  </p>
                </div>
              </div>
            </div>
`;

// Remove the old Predictive Analysis and Strategic Counter play
content = content.replace(/<div className="bg-surface-hover rounded-xl border border-border-main p-5">\s*<h3 className="text-xs font-bold uppercase tracking-wider text-text-main mb-4 flex items-center border-b border-border-main pb-2">\s*<TrendingUp className="w-4 h-4 mr-2 text-blue-500" \/>\s*AI Predictive Analysis\s*<\/h3>\s*<p className="text-sm text-text-muted leading-relaxed">\s*\{team\.prediction\}\s*<\/p>\s*<\/div>/, newAiBlock);

content = content.replace(/<div className="bg-surface-hover rounded-xl border border-border-main p-5">\s*<h3 className="text-xs font-bold uppercase tracking-wider text-text-main mb-4 flex items-center border-b border-border-main pb-2">\s*<AlertTriangle className="w-4 h-4 mr-2 text-orange-500" \/>\s*Strategic Counter-Play\s*<\/h3>\s*<p className="text-sm text-text-muted leading-relaxed">\s*\{team\.counterPlay\}\s*<\/p>\s*<\/div>/, "");

fs.writeFileSync('src/components/TeamModal.tsx', content);
