import fs from 'fs';

let content = fs.readFileSync('src/components/TeamModal.tsx', 'utf-8');

// Update imports
content = content.replace(
  "import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';",
  "import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, Tooltip, XAxis } from 'recharts';"
);

// Add trendData memo
content = content.replace(
  "const radarData = [",
  `const trendData = React.useMemo(() => {
    const base = team.score;
    return [
      { match: 'M1', score: Math.max(0, base - 8) },
      { match: 'M2', score: Math.max(0, base - 3) },
      { match: 'M3', score: base },
      { match: 'Proj 1', score: Math.min(100, base + 4) },
      { match: 'Proj 2', score: Math.min(100, base + 7) },
    ];
  }, [team.score]);

  const radarData = [`
);

// Add chart
const newPredictiveBlock = `
                  <div className="bg-purple-500/10 border border-purple-500/30 p-3 rounded-lg mt-2">
                    <div className="text-[10px] text-purple-400 font-bold uppercase mb-1 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" /> Predictive Analysis
                    </div>
                    <p className="text-sm text-purple-400 font-medium mb-3">
                      Based on their current score of {team.score}, {
                         team.score >= 95 ? "they are projected to maintain a top-tier aggressive scoring pace in upcoming matches." :
                         team.score >= 85 ? "they show stable metrics indicating reliable supportive or secondary scoring potential." :
                         "they are likely to encounter resistance against high-tier teams; expect defensive or opportunistic play."
                       } {team.prediction}
                    </p>
                    <div className="h-[100px] w-full mt-2 opacity-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <XAxis dataKey="match" hide />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#111111', border: '1px solid #374151', fontSize: '12px' }}
                            itemStyle={{ color: '#A855F7' }}
                            labelStyle={{ color: '#A1A1AA', fontWeight: 'bold' }}
                          />
                          <Line type="monotone" dataKey="score" stroke="#A855F7" strokeWidth={2} dot={{ r: 3, fill: '#A855F7' }} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
`;

// Target the old predictive block and replace it
content = content.replace(
  /<div className="bg-purple-500\/10 border border-purple-500\/30 p-3 rounded-lg mt-2">[\s\S]*?<\/p>\s*<\/div>/,
  newPredictiveBlock.trim()
);

fs.writeFileSync('src/components/TeamModal.tsx', content);
