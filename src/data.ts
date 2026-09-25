import { FRCPerformanceStats, getEnhancedTeamStats } from './utils/frcStatsData';
import { applyRealStats, computeRadarPercentiles, getRealMetrics, RadarKey } from './utils/realMetrics';

// Radar ratings: each is a percentile (0–100) within this team list, computed from real 2026
// data (see utils/realMetrics.ts). They replace six ratings that were generated at random.
export type TeamStats = Record<RadarKey, number>;

export const STAT_META = {
  win: { label: 'WIN', fullName: 'Win Rate', desc: '2026 official win rate (The Blue Alliance)' },
  opr: { label: 'OPR', fullName: 'Scoring Power', desc: 'Best 2026 event OPR from qualification match scores' },
  rnk: { label: 'RNK', fullName: 'Event Ranking', desc: 'Best qualification rank at a 2026 event' },
  awd: { label: 'AWD', fullName: '2026 Awards', desc: 'Awards won at 2026 events' },
  imp: { label: 'IMP', fullName: 'Impact Legacy', desc: "Impact / Chairman's Award wins across all seasons" },
  exp: { label: 'EXP', fullName: 'Experience', desc: 'Seasons since rookie year' },
} as const satisfies Record<RadarKey, { label: string; fullName: string; desc: string }>;

export function getStatFullName(statKeyOrLabel: string): string {
  const normalized = statKeyOrLabel.trim().toLowerCase();
  if (normalized in STAT_META) {
    return STAT_META[normalized as keyof typeof STAT_META].fullName;
  }
  return statKeyOrLabel;
}

export interface TeamDetails {
  impact?: string;
  community?: string;
  sustainability?: string;
}

export interface Team {
  number: number;
  name: string;
  score: number;
  rank: number;
  tier: 'Elite' | 'Strong' | 'Good' | 'Fair';
  pros: string[];
  cons: string[];
  critique: string;
  prediction: string;
  counterPlay: string;
  tags: string[];
  stats: TeamStats;
  location?: string;
  website?: string;
  tbaUrl?: string;
  firstUrl?: string;
  awards?: string[];
  details?: TeamDetails;
  frcStats?: FRCPerformanceStats;
}

export type { FRCPerformanceStats };
export { getEnhancedTeamStats };

// Hand-entered scouting profiles. `stats` (radar) and `frcStats` are derived below.
const RAW_TEAMS: Omit<Team, 'stats' | 'frcStats'>[] = [
  {
    "number": 1678,
    "name": "Citrus Circuits",
    "score": 97,
    "rank": 1,
    "tier": "Elite",
    "tags": [],
    "pros": [
      "100% member participation in outreach",
      "Robust FRC/FTC mentoring",
      "Citrus Service"
    ],
    "cons": [
      "New member training scaling issues"
    ],
    "critique": "A powerhouse in impact with a legacy of wide-reaching sustainability.",
    "prediction": "Expected to maintain high rank due to robust impact scoring and consistent technical floor.",
    "counterPlay": "Capitalize on any early-season technical delays caused by their relocation.",
    "location": "Davis, CA - USA",
    "website": "https://www.citruscircuits.org",
    "tbaUrl": "https://www.thebluealliance.com/team/1678",
    "firstUrl": "https://www.firstinspires.org",
    "details": {
      "impact": "62% of members introduced to FIRST via their programs. $130,000/year raised for STEM in Davis. Citrus Service assisted 300+ unique teams across 22 events.",
      "community": "Created Davis Youth Robotics Schools, expanded to 9 elementary schools. Started Women in STEM Empowerment (WiSE) and Unified Robotics.",
      "sustainability": "RoboCamps & 501(c)(3) fund all outreach. 100% member participation & 30,000+ hours volunteered."
    }
  },
  {
    "number": 498,
    "name": "The Cobra Commanders",
    "score": 96,
    "rank": 2,
    "tier": "Elite",
    "tags": [],
    "pros": [
      "Arizona Robotics League",
      "BotBuddies program",
      "Title I school focus"
    ],
    "cons": [
      "Limited technical opportunities with one robot"
    ],
    "critique": "The backbone of Arizona FRC, keeping the state competitive.",
    "prediction": "A resilient and resourceful team capable of deep playoff runs.",
    "counterPlay": "Outscore them in autonomous.",
    "location": "Glendale, AZ - USA",
    "details": {
      "impact": "Founded Arizona Robotics League, the only free offseason league, providing $2.1M in free match play.",
      "community": "Started BotBuddies at Title I schools. Partner with OCJKids and Cholla Library for underrepresented students.",
      "sustainability": "Automation & Robotics CTE Pathway. Developing 'Cobra Evolution' second robot for more student opportunities."
    }
  },
  {
    "number": 2096,
    "name": "RoboActive",
    "score": 95,
    "rank": 3,
    "tier": "Elite",
    "tags": [
      "2018 Finalist"
    ],
    "pros": [
      "City-wide FIRST integration",
      "Active Lab TikTok",
      "Bedouin community outreach"
    ],
    "cons": [
      "Need better impact measurement tracking"
    ],
    "critique": "Transformed an entire city into a robotics powerhouse.",
    "prediction": "Consistently competitive with a deep talent pool.",
    "counterPlay": "Focus on consistent endgame performance.",
    "location": "Dimona, Israel",
    "details": {
      "impact": "1 in 4 students in Dimona participates in FIRST (244 teams). Active Lab TikTok has 300K+ views.",
      "community": "Expanded FIRST to 3 Bedouin Arab communities. Created STEAM programs for displaced families during war.",
      "sustainability": "Structured 7th-12th grade pathway. Raised $171K for competition fees. Partnerships with Dimona Municipality."
    }
  },
  {
    "number": 4253,
    "name": "Raid Zero",
    "score": 95,
    "rank": 4,
    "tier": "Elite",
    "tags": [],
    "pros": [
      "Pioneering FLL in Taiwan",
      "TechCube facility",
      "RoboCoach AI extension"
    ],
    "cons": [
      "Member burnout from diverse activities"
    ],
    "critique": "A hub of innovation transforming education in Taiwan.",
    "prediction": "A strong regional competitor with massive local influence.",
    "counterPlay": "Capitalize on early match momentum.",
    "location": "Taipei, Taiwan",
    "details": {
      "impact": "Introduced FLL to 1500+ students. TechCube facility hosts FRC research conferences.",
      "community": "Little Engineers Training Program adopted by Taipei DoE. Mentoring across rural Taiwan and internationally (Philippines, Vietnam).",
      "sustainability": "Robotics & CS graduation requirement at school. Raid One (8503) junior team."
    }
  },
  {
    "number": 6328,
    "name": "Mechanical Advantage",
    "score": 95,
    "rank": 5,
    "tier": "Elite",
    "tags": [],
    "pros": [
      "AdvantageScope & AdvantageKit",
      "Open Alliance Leaders",
      "Strong FLL pipeline"
    ],
    "cons": [
      "Need more students taking charge of new initiatives"
    ],
    "critique": "The vanguard of modern FRC software and open source development.",
    "prediction": "Will have unmatched software reliability and autonomous routines.",
    "counterPlay": "Defend heavily against their teleop cycles.",
    "location": "Littleton, MA - USA",
    "details": {
      "impact": "AdvantageScope & AdvantageKit have 22,000+ installs and were added to standard FRC software. 147 FRC/44 FTC teams in Open Alliance.",
      "community": "Advocate for MA state grants. Provide menstrual/hygiene products at events.",
      "sustainability": "100% success rate keeping 8th grade FLL students in FIRST. New Member Program with Kitbot."
    }
  },
  {
    "number": 8393,
    "name": "The Giant Diencephalic BrainSTEM Robotics Team",
    "score": 95,
    "rank": 6,
    "tier": "Elite",
    "tags": [
      "2026 Finalist"
    ],
    "pros": [
      "Robots Without Borders",
      "Adaptive tools for medically fragile",
      "Global FLL focus"
    ],
    "cons": [
      "Risk of dilution due to rapid expansion"
    ],
    "critique": "A small team with a truly global, life-changing mandate.",
    "prediction": "A dark horse with incredibly inspiring outreach.",
    "counterPlay": "Focus on offensive scoring consistency.",
    "location": "Baden, PA - USA",
    "details": {
      "impact": "Reached 7,100+ kids. Built software tools for Cortical Visual Impairment (CVI).",
      "community": "Funded a medical clinic in Haiti, started FIRST Belize, and expanded to Turkiye and Malawi.",
      "sustainability": "Formalizing mentorship pipelines and subsystem accountability. 40+ corporate partners."
    }
  },
  {
    "number": 118,
    "name": "Robonauts",
    "score": 94,
    "rank": 7,
    "tier": "Elite",
    "tags": [
      "2023 Finalist"
    ],
    "pros": [
      "Everybot program",
      "NASA Partnership",
      "Incredible Robot Quality"
    ],
    "cons": [
      "High member time commitment"
    ],
    "critique": "The gold standard of FIRST. Their Everybot initiative has changed the entire program.",
    "prediction": "Always a threat to win the World Championship.",
    "counterPlay": "Flawless execution is required to beat them.",
    "location": "Houston, TX - USA",
    "details": {
      "impact": "Everybot has inspired over 2,700 robots across 25 countries. NASA-JSC Robotics Academy.",
      "community": "ROWS (Robotics Open Working Sessions), engaging 10,000 students. Robonaut-for-a-Day.",
      "sustainability": "Institutional knowledge passed down through handbook. 5:10 meetings and 250+ years of mentor experience."
    }
  },
  {
    "number": 3061,
    "name": "Huskie Robotics",
    "score": 93,
    "rank": 8,
    "tier": "Elite",
    "tags": [],
    "pros": [
      "Extensive FLL pipeline",
      "Advocacy for statewide STEM",
      "HuskyADAPT"
    ],
    "cons": [
      "Subteam isolation due to size"
    ],
    "critique": "A giant in regional STEM pipeline creation.",
    "prediction": "Consistent elite performance fueled by a massive student base.",
    "counterPlay": "Target specific subsystem weaknesses if present.",
    "location": "Naperville, IL - USA",
    "details": {
      "impact": "Introduced 22.3k to FIRST over 3 years. 41 FLL teams retained for 3 years.",
      "community": "HuskyADAPT modifies toys for motor disabilities. Red Chair Videos amplify female voices.",
      "sustainability": "Secured $477k, 5-yr NEF grant. Multi-school outreach recruits 30+ members yearly."
    }
  },
  {
    "number": 6024,
    "name": "R Factor",
    "score": 93,
    "rank": 9,
    "tier": "Elite",
    "tags": [
      "2021 Finalist"
    ],
    "pros": [
      "Pioneering FTC in India",
      "STEM@Grassroots",
      "GirlsMustDrive"
    ],
    "cons": [
      "Geographical dispersion across schools"
    ],
    "critique": "The face of FIRST in India with unparalleled organizational reach.",
    "prediction": "Will drive massive growth of FRC in the region.",
    "counterPlay": "Outpace their cycle times in teleop.",
    "location": "Mumbai, MH - India",
    "details": {
      "impact": "Reached 58k+ people. Hosted 4 official FTC India championships. Donated 450 reusable STEM kits.",
      "community": "Started GirlsMustDrive to empower girls in STEM. Promoted Robotics as Therapy (RAT) and Robotics as Sport (RAS).",
      "sustainability": "Hybrid model for CAD and programming. Leverages corporate partnerships (RTX India)."
    }
  },
  {
    "number": 7563,
    "name": "SESI SENAI MEGAZORD",
    "score": 93,
    "rank": 10,
    "tier": "Elite",
    "tags": [],
    "pros": [
      "Megazord Outreach Plan",
      "Extensive FLL/FTC mentoring",
      "Woodie Flowers Box"
    ],
    "cons": [
      "High demand on limited outreach members"
    ],
    "critique": "Incredible community impact through structured outreach steps.",
    "prediction": "A strong contender for top regional awards.",
    "counterPlay": "Focus on maximizing autonomous consistency against them.",
    "location": "Jundiaí, SP - Brazil",
    "details": {
      "impact": "Reached 1,435 children. 94% of alumni remain in STEM careers. Transformed computer labs in 9 schools.",
      "community": "Created SCI&TECH INSPIRATION WEEK LAW. Created Paper Coding to teach logic without computers.",
      "sustainability": "I WAS HERE philosophy for 4-step impact. Alumni network redistribution to manage high demand."
    }
  },
  {
    "number": 3646,
    "name": "INTEGRA BAHCESEHIR",
    "score": 92,
    "rank": 11,
    "tier": "Elite",
    "tags": [
      "Impact Winner",
      "Einstein Finalist",
      "Division Winner"
    ],
    "pros": [
      "2026 Regional FIRST Impact Award Kazananı",
      "2x Houston Championship Einstein Field Chairman's Finalist (2017, 2019)",
      "Galileo Division Championship Winner (Houston 2019)",
      "NASA Space Apps Challenge Global Host & Liderliği",
      "3.500+ Okulda Uygulanan Ulusal İHA/UAV Müfredatı",
      "Türkiye & Fas FRC/FTC Takımları Kurucu Mentörlüğü"
    ],
    "cons": [
      "Şampiyona sezonlarında yüksek uluslararası lojistik ve seyahat yoğunluğu"
    ],
    "critique": "Bahçeşehir Fen ve Teknoloji Lisesi'nin 2011 çaylak yılından bu yana Türk ve dünya FRC tarihine damga vuran en köklü ve ödüllü takımı; sürdürülebilirlik ve Impact kültürünün uluslararası temsilcisi.",
    "prediction": "2026 Sezonunda kazandığı Regional FIRST Impact Award ile Houston Dünya Şampiyonası'nda kürsü ve division liderliği için en güçlü aday.",
    "counterPlay": "Erken otonom nota üstünlüğü sağlamaya çalışın ve midfield besleme koridorlarında alan baskısı kurun.",
    "location": "Bahçeşehir, Istanbul, Türkiye",
    "website": "https://integra3646.com",
    "tbaUrl": "https://www.thebluealliance.com/team/3646",
    "firstUrl": "https://www.firstinspires.org",
    "awards": [
      "2026 Regional FIRST Impact Award",
      "2025 South Florida Regional Finalist",
      "2025 Marmara Regional Gracious Professionalism Award",
      "2020 Bosphorus Regional Winner",
      "2020 Bosphorus Regional Dean's List Finalist (Boran Ocak)",
      "2019 Houston Championship Galileo Division Winner",
      "2019 Einstein Field Chairman's Award Finalist",
      "2019 Istanbul Regional Chairman's Award",
      "2019 SBPLI Long Island Regional #1 Finalist",
      "2019 Bosphorus Regional Autonomous Award (Ford)",
      "2018 SBPLI Long Island Regional #1 Winner",
      "2018 Roebling Division Finalist",
      "2017 Einstein Field Chairman's Award Finalist",
      "2017 Orange County Regional Chairman's Award",
      "2016 New York City Regional Chairman's Award",
      "2011 Midwest Regional Judges Award (Rookie Year)"
    ],
    "details": {
      "impact": "2026 Regional FIRST Impact Award. 2017 & 2019 Houston Einstein Field Chairman's Finalist. Mezunlarının %100'ü STEAM alanında ilerlemekte ve 5.5M$+ uluslararası burs kazanmıştır. Geliştirilen İHA müfredatı 3.500+ okulda aktiftir.",
      "community": "İstanbul'da NASA Space Apps Challenge resmi ev sahibi. Türkiye genelinde ve uluslararası arenada (Fas'ın ilk FRC takımı dahil) onlarca FRC, FTC ve FLL takımının kurucu mentörlüğü.",
      "sustainability": "Bahçeşehir Fen ve Teknoloji Lisesi amiral gemisi (Rookie: 2011). ISO 22301 İş Sürekliliği standardına uyumlu atölye ve yönetim yapısı, kurumsal küresel sponsorluk ağı ve güçlü mezun mühendis ağı."
    }
  },
  {
    "number": 316,
    "name": "LUNATECS",
    "score": 91,
    "rank": 12,
    "tier": "Elite",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 2718,
    "name": "Team OKC e'possums (Σ 1/n! x 10³)",
    "score": 91,
    "rank": 13,
    "tier": "Elite",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 3990,
    "name": "Tech for Kids",
    "score": 91,
    "rank": 14,
    "tier": "Elite",
    "tags": [
      "2024 Finalist"
    ],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 6989,
    "name": "KAISER",
    "score": 91,
    "rank": 15,
    "tier": "Elite",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 7525,
    "name": "Pioneers",
    "score": 91,
    "rank": 16,
    "tier": "Elite",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 1511,
    "name": "Rolling Thunder",
    "score": 90,
    "rank": 17,
    "tier": "Elite",
    "tags": [
      "2022 Finalist"
    ],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 1156,
    "name": "Under Control",
    "score": 90,
    "rank": 18,
    "tier": "Elite",
    "tags": [
      "2021 Finalist"
    ],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 3008,
    "name": "Team Magma",
    "score": 90,
    "rank": 19,
    "tier": "Elite",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 6429,
    "name": "4th Dimension",
    "score": 90,
    "rank": 20,
    "tier": "Elite",
    "tags": [
      "2024, 2022 Finalist"
    ],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 1884,
    "name": "Griffins",
    "score": 89,
    "rank": 21,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 3354,
    "name": "PrepaTec - TecDroid",
    "score": 89,
    "rank": 22,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 422,
    "name": "The Mech Tech Dragons",
    "score": 88,
    "rank": 23,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 1880,
    "name": "Warriors of East Harlem",
    "score": 88,
    "rank": 24,
    "tier": "Strong",
    "tags": [
      "2026 Finalist"
    ],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 2905,
    "name": "Sultans of Turkiye",
    "score": 88,
    "rank": 25,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 3604,
    "name": "Goon Squad",
    "score": 88,
    "rank": 26,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 4201,
    "name": "The Vitruvian Bots",
    "score": 88,
    "rank": 27,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 6647,
    "name": "PrepaTec - VOLTEC",
    "score": 88,
    "rank": 28,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 9545,
    "name": "Caracal Robotics",
    "score": 88,
    "rank": 29,
    "tier": "Strong",
    "tags": [
      "2026 Finalist"
    ],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 461,
    "name": "Westside Boiler Invasion",
    "score": 87,
    "rank": 30,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 4499,
    "name": "The Highlanders",
    "score": 87,
    "rank": 31,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 9692,
    "name": "Sigma",
    "score": 87,
    "rank": 32,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 3937,
    "name": "Breakaway",
    "score": 86,
    "rank": 33,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 4256,
    "name": "Cyborg Cats",
    "score": 86,
    "rank": 34,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 6352,
    "name": "LAUNCH TEAM",
    "score": 86,
    "rank": 35,
    "tier": "Strong",
    "tags": [
      "Impact Winner"
    ],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 10002,
    "name": "BotBuilders",
    "score": 86,
    "rank": 36,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 359,
    "name": "Hawaiian Kids",
    "score": 85,
    "rank": 37,
    "tier": "Strong",
    "tags": [
      "2026 Finalist",
      "2011 HoF"
    ],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 1671,
    "name": "Buchanan Bird Brains",
    "score": 85,
    "rank": 38,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 4403,
    "name": "PrepaTec - ROULT - Peñoles",
    "score": 85,
    "rank": 39,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 10131,
    "name": "Royal Turtles",
    "score": 85,
    "rank": 40,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 3792,
    "name": "Army Ants",
    "score": 84,
    "rank": 41,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 5577,
    "name": "Kinematic Wolves",
    "score": 84,
    "rank": 42,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 9277,
    "name": "Sparkans",
    "score": 84,
    "rank": 43,
    "tier": "Strong",
    "tags": [
      "2026 Finalist"
    ],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 589,
    "name": "Falkon Robotics",
    "score": 83,
    "rank": 44,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 2399,
    "name": "The Fighting Unicorns",
    "score": 83,
    "rank": 45,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 8020,
    "name": "CyberpunK",
    "score": 82,
    "rank": 46,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 195,
    "name": "CyberKnights",
    "score": 82,
    "rank": 47,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 2704,
    "name": "Roaring Robotics",
    "score": 82,
    "rank": 48,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 4188,
    "name": "Columbus Space Program",
    "score": 82,
    "rank": 49,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 6865,
    "name": "Manitoulin Metal",
    "score": 82,
    "rank": 50,
    "tier": "Strong",
    "tags": [
      "2023 Finalist"
    ],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 772,
    "name": "Sabre Bytes Robotics",
    "score": 81,
    "rank": 51,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 2826,
    "name": "Wave Robotics",
    "score": 81,
    "rank": 52,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 4674,
    "name": "RoboJacks",
    "score": 81,
    "rank": 53,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 5653,
    "name": "Iron Mosquitos",
    "score": 81,
    "rank": 54,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 245,
    "name": "Adambots",
    "score": 80,
    "rank": 55,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 4191,
    "name": "IMC",
    "score": 80,
    "rank": 56,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 4561,
    "name": "TerrorBytes",
    "score": 80,
    "rank": 57,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 7287,
    "name": "Esquimalt Atom Smashers",
    "score": 80,
    "rank": 58,
    "tier": "Strong",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 386,
    "name": "Team Voltage",
    "score": 79,
    "rank": 59,
    "tier": "Good",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 1477,
    "name": "Texas Torque",
    "score": 79,
    "rank": 60,
    "tier": "Good",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 6988,
    "name": "ACI35",
    "score": 79,
    "rank": 61,
    "tier": "Good",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 7451,
    "name": "AvengerRobotics",
    "score": 79,
    "rank": 62,
    "tier": "Good",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 1987,
    "name": "Broncobots",
    "score": 78,
    "rank": 63,
    "tier": "Good",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 4125,
    "name": "Confidential",
    "score": 78,
    "rank": 64,
    "tier": "Good",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 5557,
    "name": "BB-R8ERS",
    "score": 78,
    "rank": 65,
    "tier": "Good",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 1902,
    "name": "Exploding Bacon",
    "score": 76,
    "rank": 66,
    "tier": "Good",
    "tags": [
      "2019 HoF"
    ],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 3620,
    "name": "Average Joes",
    "score": 76,
    "rank": 67,
    "tier": "Good",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 4905,
    "name": "Andromeda One",
    "score": 76,
    "rank": 68,
    "tier": "Good",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 8575,
    "name": "The Due Westerners",
    "score": 76,
    "rank": 69,
    "tier": "Good",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 3544,
    "name": "Spartiates",
    "score": 75,
    "rank": 70,
    "tier": "Good",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 4450,
    "name": "Olympia Robotics Federation",
    "score": 75,
    "rank": 71,
    "tier": "Good",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 1108,
    "name": "Panther Robotics",
    "score": 74,
    "rank": 72,
    "tier": "Good",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 1710,
    "name": "The Ravonics Revolution",
    "score": 72,
    "rank": 73,
    "tier": "Good",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 3284,
    "name": "Camdenton LASER 3284",
    "score": 72,
    "rank": 74,
    "tier": "Good",
    "tags": [
      "2023, 2021 Finalist"
    ],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 4122,
    "name": "Ossining OBOTS",
    "score": 72,
    "rank": 75,
    "tier": "Good",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 6940,
    "name": "Violet Z",
    "score": 72,
    "rank": 76,
    "tier": "Good",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 3630,
    "name": "Stampede",
    "score": 71,
    "rank": 77,
    "tier": "Good",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 2199,
    "name": "Robo-Lions",
    "score": 68,
    "rank": 78,
    "tier": "Fair",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 1403,
    "name": "Team 1403 Cougar Robotics",
    "score": 67,
    "rank": 79,
    "tier": "Fair",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 9067,
    "name": "The Goonies",
    "score": 63,
    "rank": 80,
    "tier": "Fair",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 7028,
    "name": "Binary Battalion",
    "score": 61,
    "rank": 81,
    "tier": "Fair",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 3880,
    "name": "Tiki Techs",
    "score": 58,
    "rank": 82,
    "tier": "Fair",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  },
  {
    "number": 9449,
    "name": "Yellowjackets",
    "score": 55,
    "rank": 83,
    "tier": "Fair",
    "tags": [],
    "pros": [
      "Generic Pro 1",
      "Generic Pro 2"
    ],
    "cons": [
      "Generic Con 1"
    ],
    "critique": "A solid team with room to grow.",
    "prediction": "Will perform adequately.",
    "counterPlay": "Standard strategy applies.",
  }
];

const radarPercentiles = computeRadarPercentiles(RAW_TEAMS.map((t) => t.number));

// Ranks are derived from score so the leaderboard can never show duplicate or missing
// positions. Ties keep the hand-curated order (original rank, then team number).
// Performance stats are resolved once here instead of on every render: real TBA results
// override the modelled record/OPR, and the radar comes from real-data percentiles.
export const mockTeams: Team[] = [...RAW_TEAMS]
  .sort((a, b) => b.score - a.score || a.rank - b.rank || a.number - b.number)
  .map((team, idx) => {
    const real = getRealMetrics(team.number);
    const stats = radarPercentiles.get(team.number)!;
    const ranked: Team = { ...team, rank: idx + 1, stats, location: team.location ?? real?.location ?? undefined };
    return { ...ranked, frcStats: applyRealStats(getEnhancedTeamStats(ranked), real, stats.opr) };
  });
