import fs from 'fs';

let content = fs.readFileSync('src/components/TeamModal.tsx', 'utf-8');

// Replace "CORE STRENGTHS (PROS)" with "Core Strengths (Pros)"
content = content.replace("CORE STRENGTHS (PROS)", "Core Strengths (Pros)");

// Replace "VULNERABILITIES (CONS)" with "Vulnerabilities (Cons)"
content = content.replace("VULNERABILITIES (CONS)", "Vulnerabilities (Cons)");

content = content.replace(
    /<div className="fixed inset-0 z-\[100\] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">/,
    `<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">`
);

fs.writeFileSync('src/components/TeamModal.tsx', content);
