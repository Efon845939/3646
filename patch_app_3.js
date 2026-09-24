import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Add import
content = content.replace(
  "import { TeamCompare } from './components/TeamCompare';",
  "import { TeamCompare } from './components/TeamCompare';\nimport { MatchSimulator } from './components/MatchSimulator';"
);

// Add state
content = content.replace(
  "const [isCompareMode, setIsCompareMode] = useState(false);",
  "const [isCompareMode, setIsCompareMode] = useState(false);\n  const [isSimulatorMode, setIsSimulatorMode] = useState(false);"
);

// Add button to nav and update clear logic
content = content.replace(
  "setIsCompareMode(false);",
  "setIsCompareMode(false);\n            setIsSimulatorMode(false);"
);

content = content.replace(
  /<button\s*onClick=\{\(\) => setIsCompareMode\(!isCompareMode\)\}\s*className=\{`px-4 py-2 rounded-lg border transition-colors flex items-center justify-center font-bold text-sm \$\{isCompareMode \? 'bg-integra-yellow text-\[\#111111\] border-\[\#111111\]' : 'bg-surface hover:bg-surface-hover text-text-muted border-border-main'\}`\}\s*>\s*Compare Teams\s*<\/button>/,
  `<button
            onClick={() => { setIsSimulatorMode(!isSimulatorMode); setIsCompareMode(false); }}
            className={\`px-4 py-2 rounded-lg border transition-colors flex items-center justify-center font-semibold text-sm \${isSimulatorMode ? 'bg-text-main text-surface border-text-main' : 'bg-surface hover:bg-surface-hover text-text-muted border-border-main'}\`}
          >
            Match Simulator
          </button>

          <button
            onClick={() => { setIsCompareMode(!isCompareMode); setIsSimulatorMode(false); }}
            className={\`px-4 py-2 rounded-lg border transition-colors flex items-center justify-center font-semibold text-sm \${isCompareMode ? 'bg-integra-yellow text-[#111111] border-[#111111]' : 'bg-surface hover:bg-surface-hover text-text-muted border-border-main'}\`}
          >
            Compare Teams
          </button>`
);

// Update render logic
content = content.replace(
  "{isCompareMode ? (",
  `{isSimulatorMode ? (
          <MatchSimulator onClose={() => setIsSimulatorMode(false)} />
        ) : isCompareMode ? (`
);

fs.writeFileSync('src/App.tsx', content);
