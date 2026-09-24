import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add Download to lucide-react imports and motion
content = content.replace(
  "import { Search, Hexagon, Moon, Sun } from 'lucide-react';",
  "import { Search, Hexagon, Moon, Sun, Download } from 'lucide-react';\nimport { motion } from 'motion/react';"
);

// 2. Add exportToCSV function
const exportCode = `
  const exportToCSV = () => {
    const headers = ['Number', 'Name', 'Score', 'Rank', 'Tier', 'Pros', 'Cons', 'Critique', 'Prediction', 'Counter Play'];
    const rows = mockTeams.map(t => [
      t.number,
      \`"\${t.name}"\`,
      t.score,
      t.rank,
      t.tier,
      \`"\${t.pros.join(', ')}"\`,
      \`"\${t.cons.join(', ')}"\`,
      \`"\${t.critique}"\`,
      \`"\${t.prediction}"\`,
      \`"\${t.counterPlay}"\`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'teams_scouting.csv';
    link.click();
  };
`;

content = content.replace(
  "const totalTeams = mockTeams.length;",
  exportCode + "\n  const totalTeams = mockTeams.length;"
);

// 3. Replace nav logo with clickable one, and remove SYSTEM ONLINE
content = content.replace(
  /<nav className="flex flex-col lg:flex-row justify-between items-center py-4 border-b border-border-main mb-6 px-6 bg-bg-dark\/90 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300">[\s\S]*?<div className="bg-surface p-3 rounded-lg border border-border-main flex items-center space-x-3 w-auto lg:w-48 transition-colors duration-300">\s*<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"><\/div>\s*<span className="text-sm font-medium">SYSTEM ONLINE<\/span>\s*<\/div>\s*<div className="bg-surface p-3 rounded-lg border border-border-main flex items-center space-x-3 w-full lg:w-64 relative transition-colors duration-300">/,
  `<nav className="flex flex-col lg:flex-row justify-between items-center py-4 border-b border-border-main mb-6 px-6 bg-bg-dark/90 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300">
        <div 
          onClick={() => {
            setIsCompareMode(false);
            setSearchQuery('');
            setFilterTag('All');
            setSortBy('score-desc');
          }}
          className="flex items-center space-x-6 w-full lg:w-auto cursor-pointer group"
        >
          <div className="bg-integra-yellow text-[#111111] border-[3px] border-[#111111] px-2 py-0.5 text-2xl font-montserrat font-black uppercase group-hover:scale-105 transition-transform duration-300">
            #3646
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-text-muted tracking-widest">Pre-PR Scouting Dashboard</span>
            <span className="text-lg font-bold font-montserrat tracking-tight">Integra Scouting</span>
          </div>
        </div>

        <div className="flex space-x-4 mt-4 lg:mt-0 w-full lg:w-auto">
          <button
            onClick={exportToCSV}
            className="p-3 rounded-lg border border-border-main bg-surface hover:bg-surface-hover text-text-muted transition-colors flex items-center justify-center"
            title="Export CSV"
          >
            <Download className="w-5 h-5 text-text-muted hover:text-text-main" />
          </button>

          <button
            onClick={() => setIsCompareMode(!isCompareMode)}
            className={\`px-4 py-2 rounded-lg border transition-colors flex items-center justify-center font-bold text-sm \${isCompareMode ? 'bg-integra-yellow text-[#111111] border-[#111111]' : 'bg-surface hover:bg-surface-hover text-text-muted border-border-main'}\`}
          >
            Compare Teams
          </button>

          <button
            onClick={toggleTheme}
            className="p-3 rounded-lg border border-border-main bg-surface hover:bg-surface-hover text-text-muted transition-colors flex items-center justify-center"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-5 h-5 text-integra-yellow" /> : <Moon className="w-5 h-5 text-gray-700" />}
          </button>

          <div className="bg-surface p-3 rounded-lg border border-border-main flex items-center space-x-3 w-full lg:w-64 relative transition-colors duration-300">`
);

// 4. Update filters text (reduce caps and adjust classes)
content = content.replace(
  /className={`px-4 py-1\.5 rounded-full border text-\[10px\] uppercase transition-colors font-bold \${sortBy === 'score-desc' \? 'bg-integra-yellow text-\[#111111\] border-\[3px\] border-\[#111111\]' : 'border-border-main text-text-muted hover:text-text-main'}`}>[\s\S]*?SCORE: HIGH 🔽/m,
  `className={\`px-4 py-1.5 rounded-full border text-xs transition-colors font-semibold \${sortBy === 'score-desc' ? 'bg-integra-yellow text-[#111111] border-integra-yellow' : 'border-border-main text-text-muted hover:text-text-main'}\`}>
                 Score: High 🔽`
);

content = content.replace(
  /className={`px-4 py-1\.5 rounded-full border text-\[10px\] uppercase transition-colors font-bold \${sortBy === 'score-asc' \? 'bg-integra-yellow text-\[#111111\] border-\[3px\] border-\[#111111\]' : 'border-border-main text-text-muted hover:text-text-main'}`}>[\s\S]*?SCORE: LOW 🔼/m,
  `className={\`px-4 py-1.5 rounded-full border text-xs transition-colors font-semibold \${sortBy === 'score-asc' ? 'bg-integra-yellow text-[#111111] border-integra-yellow' : 'border-border-main text-text-muted hover:text-text-main'}\`}>
                 Score: Low 🔼`
);

content = content.replace(
  /className={`px-4 py-1\.5 rounded-full border text-\[10px\] uppercase transition-colors font-bold \${filterTag === 'Impact Winner' \? 'bg-integra-yellow text-\[#111111\] border-\[3px\] border-\[#111111\]' : 'border-border-main text-text-muted hover:text-text-main'}`}>[\s\S]*?🏆 Impact Winners/m,
  `className={\`px-4 py-1.5 rounded-full border text-xs transition-colors font-semibold \${filterTag === 'Impact Winner' ? 'bg-integra-yellow text-[#111111] border-integra-yellow' : 'border-border-main text-text-muted hover:text-text-main'}\`}>
                 🏆 Impact Winners`
);

content = content.replace(
  /className={`px-4 py-1\.5 rounded-full border text-\[10px\] uppercase transition-colors font-bold \${filterTag === 'Most Creative' \? 'bg-integra-yellow text-\[#111111\] border-\[3px\] border-\[#111111\]' : 'border-border-main text-text-muted hover:text-text-main'}`}>[\s\S]*?🎨 MOST CREATIVE/m,
  `className={\`px-4 py-1.5 rounded-full border text-xs transition-colors font-semibold \${filterTag === 'Most Creative' ? 'bg-integra-yellow text-[#111111] border-integra-yellow' : 'border-border-main text-text-muted hover:text-text-main'}\`}>
                 🎨 Most Creative`
);

content = content.replace(
  /className={`px-4 py-1\.5 rounded-full border text-\[10px\] uppercase transition-colors font-bold \${filterTag === 'High Threat' \? 'bg-integra-yellow text-\[#111111\] border-\[3px\] border-\[#111111\]' : 'border-border-main text-text-muted hover:text-text-main'}`}>[\s\S]*?⚡ HIGH THREAT/m,
  `className={\`px-4 py-1.5 rounded-full border text-xs transition-colors font-semibold \${filterTag === 'High Threat' ? 'bg-integra-yellow text-[#111111] border-integra-yellow' : 'border-border-main text-text-muted hover:text-text-main'}\`}>
                 ⚡ High Threat`
);

content = content.replace(
  /className={`px-4 py-1\.5 rounded-full border text-\[10px\] uppercase transition-colors font-bold \${filterTag === 'Best Branding' \? 'bg-integra-yellow text-\[#111111\] border-\[3px\] border-\[#111111\]' : 'border-border-main text-text-muted hover:text-text-main'}`}>[\s\S]*?✨ BEST BRANDING/m,
  `className={\`px-4 py-1.5 rounded-full border text-xs transition-colors font-semibold \${filterTag === 'Best Branding' ? 'bg-integra-yellow text-[#111111] border-integra-yellow' : 'border-border-main text-text-muted hover:text-text-main'}\`}>
                 ✨ Best Branding`
);

// 5. Update Grid with motion.div
content = content.replace(
  /<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">[\s\S]*?{filteredAndSortedTeams\.map\(team => \([\s\S]*?<div key={team\.number} onClick={\(\) => setSelectedTeam\(team\)} className="cursor-pointer h-full transition-transform hover:-translate-y-1">[\s\S]*?<TeamCard team={team} \/>[\s\S]*?<\/div>[\s\S]*?\)[\s\S]*?<\/div>/m,
  `<motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {filteredAndSortedTeams.map((team, idx) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (idx % 15) * 0.05, duration: 0.3 }}
                    key={team.number} 
                    onClick={() => setSelectedTeam(team)} 
                    className="cursor-pointer h-full transition-transform hover:-translate-y-1"
                  >
                    <TeamCard team={team} />
                  </motion.div>
                ))}
              </motion.div>`
);

fs.writeFileSync('src/App.tsx', content);
