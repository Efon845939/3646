import fs from 'fs';

let content = fs.readFileSync('src/components/TeamCard.tsx', 'utf-8');

content = content.replace("AVANTAJLAR (PROS)", "Avantajlar (Pros)");
content = content.replace("ZAYIFLIKLAR (CONS)", "Zayıflıklar (Cons)");

content = content.replace(
  'className="flex items-center justify-between w-full py-1 text-xs font-bold text-text-muted hover:text-text-main transition-colors uppercase"',
  'className="flex items-center justify-between w-full py-1 text-xs font-semibold text-text-muted hover:text-text-main transition-colors"'
);

// We can also remove `uppercase` from "text-[10px] flex items-center text-green-500 font-bold uppercase mb-1.5"
content = content.replace(
  'className="text-[10px] flex items-center text-green-500 font-bold uppercase mb-1.5"',
  'className="text-xs flex items-center text-green-500 font-semibold mb-1.5"'
);

content = content.replace(
  'className="text-[10px] flex items-center text-red-500 font-bold uppercase mb-1.5"',
  'className="text-xs flex items-center text-red-500 font-semibold mb-1.5"'
);

fs.writeFileSync('src/components/TeamCard.tsx', content);
