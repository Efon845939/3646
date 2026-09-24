import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Imports
content = content.replace("import { TeamModal } from './components/TeamModal';", "import { TeamModal } from './components/TeamModal';\nimport { TeamCompare } from './components/TeamCompare';");

// States
content = content.replace("const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);", "const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);\n  const [isCompareMode, setIsCompareMode] = useState(false);\n  const [compareTeams, setCompareTeams] = useState<Team[]>([]);");

// Navigation bar
content = content.replace(/<div className="flex space-x-4 mt-4 lg:mt-0 w-full lg:w-auto">/, `<div className="flex space-x-4 mt-4 lg:mt-0 w-full lg:w-auto">
          <button
            onClick={() => setIsCompareMode(!isCompareMode)}
            className={\`px-4 py-2 rounded-lg border transition-colors flex items-center justify-center font-bold text-sm uppercase \${isCompareMode ? 'bg-integra-yellow text-[#111111] border-[#111111]' : 'bg-surface hover:bg-surface-hover text-text-muted border-border-main'}\`}
          >
            Compare Teams
          </button>
`);

// Main content
content = content.replace(/<main className="max-w-\[1200px\] mx-auto px-6 py-2">[\s\S]*?<\/main>/, `<main className="max-w-[1200px] mx-auto px-6 py-2">
        {isCompareMode ? (
          <TeamCompare 
            teams={compareTeams} 
            onAddTeam={(t) => setCompareTeams([...compareTeams, t])}
            onRemoveTeam={(t) => setCompareTeams(compareTeams.filter(ct => ct.number !== t.number))}
            onClose={() => setIsCompareMode(false)}
          />
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-surface p-4 rounded-xl border border-border-main relative overflow-hidden transition-colors duration-300">
                <div className="text-text-muted text-[10px] uppercase font-bold tracking-tighter">Total Teams</div>
                <div className="text-3xl font-montserrat font-bold mt-1">{totalTeams}</div>
                <div className="absolute -right-2 -bottom-2 opacity-5 text-4xl"><Hexagon size={64} /></div>
              </div>
              <div className="bg-surface p-4 rounded-xl border border-border-main border-l-4 border-l-integra-yellow transition-colors duration-300">
                <div className="text-text-muted text-[10px] uppercase font-bold tracking-tighter">Integra Rank</div>
                <div className="text-3xl font-montserrat font-bold mt-1">#11</div>
              </div>
              <div className="bg-surface p-4 rounded-xl border border-border-main transition-colors duration-300">
                <div className="text-text-muted text-[10px] uppercase font-bold tracking-tighter">Highest Score</div>
                <div className="text-3xl font-montserrat font-bold mt-1 text-integra-yellow">{highestScore}</div>
              </div>
              <div className="bg-surface p-4 rounded-xl border border-border-main transition-colors duration-300">
                <div className="text-text-muted text-[10px] uppercase font-bold tracking-tighter">Average Score</div>
                <div className="text-3xl font-montserrat font-bold mt-1">{averageScore}</div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 py-2 mb-6">
              <button 
                 onClick={() => setSortBy('score-desc')} 
                 className={\`px-4 py-1.5 rounded-full border text-[10px] uppercase transition-colors font-bold \${sortBy === 'score-desc' ? 'bg-integra-yellow text-[#111111] border-[3px] border-[#111111]' : 'border-border-main text-text-muted hover:text-text-main'}\`}>
                 SCORE: HIGH 🔽
              </button>
              <button 
                 onClick={() => setSortBy('score-asc')} 
                 className={\`px-4 py-1.5 rounded-full border text-[10px] uppercase transition-colors font-bold \${sortBy === 'score-asc' ? 'bg-integra-yellow text-[#111111] border-[3px] border-[#111111]' : 'border-border-main text-text-muted hover:text-text-main'}\`}>
                 SCORE: LOW 🔼
              </button>
              <button 
                 onClick={() => setFilterTag(filterTag === 'Impact Winner' ? 'All' : 'Impact Winner')} 
                 className={\`px-4 py-1.5 rounded-full border text-[10px] uppercase transition-colors font-bold \${filterTag === 'Impact Winner' ? 'bg-integra-yellow text-[#111111] border-[3px] border-[#111111]' : 'border-border-main text-text-muted hover:text-text-main'}\`}>
                 🏆 Impact Winners
              </button>
              <button 
                 onClick={() => setFilterTag(filterTag === 'Most Creative' ? 'All' : 'Most Creative')} 
                 className={\`px-4 py-1.5 rounded-full border text-[10px] uppercase transition-colors font-bold \${filterTag === 'Most Creative' ? 'bg-integra-yellow text-[#111111] border-[3px] border-[#111111]' : 'border-border-main text-text-muted hover:text-text-main'}\`}>
                 🎨 MOST CREATIVE
              </button>
              <button 
                 onClick={() => setFilterTag(filterTag === 'High Threat' ? 'All' : 'High Threat')} 
                 className={\`px-4 py-1.5 rounded-full border text-[10px] uppercase transition-colors font-bold \${filterTag === 'High Threat' ? 'bg-integra-yellow text-[#111111] border-[3px] border-[#111111]' : 'border-border-main text-text-muted hover:text-text-main'}\`}>
                 ⚡ HIGH THREAT
              </button>
              <button 
                 onClick={() => setFilterTag(filterTag === 'Best Branding' ? 'All' : 'Best Branding')} 
                 className={\`px-4 py-1.5 rounded-full border text-[10px] uppercase transition-colors font-bold \${filterTag === 'Best Branding' ? 'bg-integra-yellow text-[#111111] border-[3px] border-[#111111]' : 'border-border-main text-text-muted hover:text-text-main'}\`}>
                 ✨ BEST BRANDING
              </button>
              {filterTag !== 'All' && (
                 <button onClick={() => setFilterTag('All')} className="text-xs text-text-muted hover:text-text-main underline ml-2">Clear Filter</button>
              )}
            </div>

            {/* Grid */}
            {filteredAndSortedTeams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAndSortedTeams.map(team => (
                  <div key={team.number} onClick={() => setSelectedTeam(team)} className="cursor-pointer h-full transition-transform hover:-translate-y-1">
                    <TeamCard team={team} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-surface rounded-xl border border-border-main transition-colors duration-300">
                <Hexagon className="w-12 h-12 text-border-main mx-auto mb-4" />
                <h3 className="text-xl font-montserrat font-bold text-text-muted">No teams found</h3>
                <p className="text-text-muted mt-2">Try adjusting your filters or search query.</p>
              </div>
            )}
          </>
        )}
      </main>`);

fs.writeFileSync('src/App.tsx', content);
