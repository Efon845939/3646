import fs from 'fs';

// Since we know the index, we can just replace the specific teams in the file.
// Read src/data.ts
let content = fs.readFileSync('src/data.ts', 'utf-8');

// Match the JSON part
const jsonMatch = content.match(/export const mockTeams: Team\[\] = (\[[\s\S]*\]);/);
if (jsonMatch) {
  let teams = JSON.parse(jsonMatch[1]);
  
  const updateTeam = (number, data) => {
    const t = teams.find(t => t.number === number);
    if (t) {
      Object.assign(t, data);
    }
  };

  updateTeam(1678, {
    location: "Davis, CA - USA",
    pros: ["100% member participation in outreach", "Robust FRC/FTC mentoring", "Citrus Service"],
    cons: ["New member training scaling issues"],
    critique: "A powerhouse in impact with a legacy of wide-reaching sustainability.",
    prediction: "Expected to maintain high rank due to robust impact scoring and consistent technical floor.",
    counterPlay: "Capitalize on any early-season technical delays caused by their relocation.",
    details: {
      impact: "62% of members introduced to FIRST via their programs. $130,000/year raised for STEM in Davis. Citrus Service assisted 300+ unique teams across 22 events.",
      community: "Created Davis Youth Robotics Schools, expanded to 9 elementary schools. Started Women in STEM Empowerment (WiSE) and Unified Robotics.",
      sustainability: "RoboCamps & 501(c)(3) fund all outreach. 100% member participation & 30,000+ hours volunteered."
    }
  });

  updateTeam(3646, {
    location: "Istanbul, Turkiye",
    pros: ["Strong NGSS-aligned UAV Curriculum", "NASA Space Apps Challenge Host", "Extensive international outreach"],
    cons: ["Reliance on physical presence for outreach"],
    critique: "A model team for international expansion and curriculum development.",
    prediction: "Will continue to be a leading voice in Turkish FIRST expansion.",
    counterPlay: "Standard competitive FRC strategy applies.",
    details: {
      impact: "100% alumni pursue STEAM, securing $5.5M in scholarships. Built UAV curriculum used in 3,561 schools.",
      community: "Hosted NASA Space Apps Challenges. Engaged in rural STEM outreach and international mentoring (Morocco's first FRC team).",
      sustainability: "Created ISO 22301-aligned Business Continuity plan after workshop loss. Solid sponsor network."
    }
  });

  updateTeam(7563, {
    location: "Jundiaí, SP - Brazil",
    pros: ["Megazord Outreach Plan", "Extensive FLL/FTC mentoring", "Woodie Flowers Box"],
    cons: ["High demand on limited outreach members"],
    critique: "Incredible community impact through structured outreach steps.",
    prediction: "A strong contender for top regional awards.",
    counterPlay: "Focus on maximizing autonomous consistency against them.",
    details: {
      impact: "Reached 1,435 children. 94% of alumni remain in STEM careers. Transformed computer labs in 9 schools.",
      community: "Created SCI&TECH INSPIRATION WEEK LAW. Created Paper Coding to teach logic without computers.",
      sustainability: "I WAS HERE philosophy for 4-step impact. Alumni network redistribution to manage high demand."
    }
  });

  updateTeam(6024, {
    location: "Mumbai, MH - India",
    pros: ["Pioneering FTC in India", "STEM@Grassroots", "GirlsMustDrive"],
    cons: ["Geographical dispersion across schools"],
    critique: "The face of FIRST in India with unparalleled organizational reach.",
    prediction: "Will drive massive growth of FRC in the region.",
    counterPlay: "Outpace their cycle times in teleop.",
    details: {
      impact: "Reached 58k+ people. Hosted 4 official FTC India championships. Donated 450 reusable STEM kits.",
      community: "Started GirlsMustDrive to empower girls in STEM. Promoted Robotics as Therapy (RAT) and Robotics as Sport (RAS).",
      sustainability: "Hybrid model for CAD and programming. Leverages corporate partnerships (RTX India)."
    }
  });

  updateTeam(3061, {
    location: "Naperville, IL - USA",
    pros: ["Extensive FLL pipeline", "Advocacy for statewide STEM", "HuskyADAPT"],
    cons: ["Subteam isolation due to size"],
    critique: "A giant in regional STEM pipeline creation.",
    prediction: "Consistent elite performance fueled by a massive student base.",
    counterPlay: "Target specific subsystem weaknesses if present.",
    details: {
      impact: "Introduced 22.3k to FIRST over 3 years. 41 FLL teams retained for 3 years.",
      community: "HuskyADAPT modifies toys for motor disabilities. Red Chair Videos amplify female voices.",
      sustainability: "Secured $477k, 5-yr NEF grant. Multi-school outreach recruits 30+ members yearly."
    }
  });

  updateTeam(118, {
    location: "Houston, TX - USA",
    pros: ["Everybot program", "NASA Partnership", "Incredible Robot Quality"],
    cons: ["High member time commitment"],
    critique: "The gold standard of FIRST. Their Everybot initiative has changed the entire program.",
    prediction: "Always a threat to win the World Championship.",
    counterPlay: "Flawless execution is required to beat them.",
    details: {
      impact: "Everybot has inspired over 2,700 robots across 25 countries. NASA-JSC Robotics Academy.",
      community: "ROWS (Robotics Open Working Sessions), engaging 10,000 students. Robonaut-for-a-Day.",
      sustainability: "Institutional knowledge passed down through handbook. 5:10 meetings and 250+ years of mentor experience."
    }
  });

  updateTeam(8393, {
    location: "Baden, PA - USA",
    pros: ["Robots Without Borders", "Adaptive tools for medically fragile", "Global FLL focus"],
    cons: ["Risk of dilution due to rapid expansion"],
    critique: "A small team with a truly global, life-changing mandate.",
    prediction: "A dark horse with incredibly inspiring outreach.",
    counterPlay: "Focus on offensive scoring consistency.",
    details: {
      impact: "Reached 7,100+ kids. Built software tools for Cortical Visual Impairment (CVI).",
      community: "Funded a medical clinic in Haiti, started FIRST Belize, and expanded to Turkiye and Malawi.",
      sustainability: "Formalizing mentorship pipelines and subsystem accountability. 40+ corporate partners."
    }
  });

  updateTeam(6328, {
    location: "Littleton, MA - USA",
    pros: ["AdvantageScope & AdvantageKit", "Open Alliance Leaders", "Strong FLL pipeline"],
    cons: ["Need more students taking charge of new initiatives"],
    critique: "The vanguard of modern FRC software and open source development.",
    prediction: "Will have unmatched software reliability and autonomous routines.",
    counterPlay: "Defend heavily against their teleop cycles.",
    details: {
      impact: "AdvantageScope & AdvantageKit have 22,000+ installs and were added to standard FRC software. 147 FRC/44 FTC teams in Open Alliance.",
      community: "Advocate for MA state grants. Provide menstrual/hygiene products at events.",
      sustainability: "100% success rate keeping 8th grade FLL students in FIRST. New Member Program with Kitbot."
    }
  });

  updateTeam(4253, {
    location: "Taipei, Taiwan",
    pros: ["Pioneering FLL in Taiwan", "TechCube facility", "RoboCoach AI extension"],
    cons: ["Member burnout from diverse activities"],
    critique: "A hub of innovation transforming education in Taiwan.",
    prediction: "A strong regional competitor with massive local influence.",
    counterPlay: "Capitalize on early match momentum.",
    details: {
      impact: "Introduced FLL to 1500+ students. TechCube facility hosts FRC research conferences.",
      community: "Little Engineers Training Program adopted by Taipei DoE. Mentoring across rural Taiwan and internationally (Philippines, Vietnam).",
      sustainability: "Robotics & CS graduation requirement at school. Raid One (8503) junior team."
    }
  });

  updateTeam(2096, {
    location: "Dimona, Israel",
    pros: ["City-wide FIRST integration", "Active Lab TikTok", "Bedouin community outreach"],
    cons: ["Need better impact measurement tracking"],
    critique: "Transformed an entire city into a robotics powerhouse.",
    prediction: "Consistently competitive with a deep talent pool.",
    counterPlay: "Focus on consistent endgame performance.",
    details: {
      impact: "1 in 4 students in Dimona participates in FIRST (244 teams). Active Lab TikTok has 300K+ views.",
      community: "Expanded FIRST to 3 Bedouin Arab communities. Created STEAM programs for displaced families during war.",
      sustainability: "Structured 7th-12th grade pathway. Raised $171K for competition fees. Partnerships with Dimona Municipality."
    }
  });

  updateTeam(498, {
    location: "Glendale, AZ - USA",
    pros: ["Arizona Robotics League", "BotBuddies program", "Title I school focus"],
    cons: ["Limited technical opportunities with one robot"],
    critique: "The backbone of Arizona FRC, keeping the state competitive.",
    prediction: "A resilient and resourceful team capable of deep playoff runs.",
    counterPlay: "Outscore them in autonomous.",
    details: {
      impact: "Founded Arizona Robotics League, the only free offseason league, providing $2.1M in free match play.",
      community: "Started BotBuddies at Title I schools. Partner with OCJKids and Cholla Library for underrepresented students.",
      sustainability: "Automation & Robotics CTE Pathway. Developing 'Cobra Evolution' second robot for more student opportunities."
    }
  });

  fs.writeFileSync('src/data.ts', `
export interface TeamStats {
  out: number;
  sus: number;
  tec: number;
  pip: number;
  med: number;
  dat: number;
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
  details?: TeamDetails;
}

export const mockTeams: Team[] = ${JSON.stringify(teams, null, 2)};
`);
}
