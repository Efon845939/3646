const fs = require('fs');

const text = `1	1678Citrus Circuits	97	Elite
2	498The Cobra Commanders	96	Elite
3	2096RoboActive2018 Finalist	95	Elite
4	4253Raid Zero	95	Elite
5	6328Mechanical Advantage	95	Elite
6	8393The Giant Diencephalic BrainSTEM Robotics Team2026 Finalist	95	Elite
7	118Robonauts2023 Finalist	94	Elite
8	3061Huskie Robotics	93	Elite
9	6024R Factor2021 Finalist	93	Elite
10	7563SESI SENAI MEGAZORD	93	Elite
11	3646INTEGRA BAHCESEHIR2019, 2017 Finalist	92	Elite
12	316LUNATECS	91	Elite
13	2718Team OKC e'possums (Σ 1/n! x 10³)	91	Elite
14	3990Tech for Kids2024 Finalist	91	Elite
15	6989KAISER	91	Elite
16	7525Pioneers	91	Elite
17	1511Rolling Thunder2022 Finalist	90	Elite
18	1156Under Control2021 Finalist	90	Elite
19	3008Team Magma	90	Elite
20	64294th Dimension2024, 2022 Finalist	90	Elite
21	1884Griffins	89	Strong
22	3354PrepaTec - TecDroid	89	Strong
23	422The Mech Tech Dragons	88	Strong
24	1880Warriors of East Harlem2026 Finalist	88	Strong
25	2905Sultans of Turkiye	88	Strong
26	3604Goon Squad	88	Strong
27	4201The Vitruvian Bots	88	Strong
28	6647PrepaTec - VOLTEC	88	Strong
29	9545Caracal Robotics2026 Finalist	88	Strong
30	461Westside Boiler Invasion	87	Strong
31	4499The Highlanders	87	Strong
32	9692Sigma	87	Strong
33	3937Breakaway	86	Strong
34	4256Cyborg Cats	86	Strong
35	6352LAUNCH TEAMImpact Winner	86	Strong
36	10002BotBuilders	86	Strong
37	359Hawaiian Kids2026 Finalist2011 HoF	85	Strong
38	1671Buchanan Bird Brains	85	Strong
39	4403PrepaTec - ROULT - Peñoles	85	Strong
40	10131Royal Turtles	85	Strong
41	3792Army Ants	84	Strong
42	5577Kinematic Wolves	84	Strong
43	9277Sparkans2026 Finalist	84	Strong
44	589Falkon Robotics	83	Strong
45	2399The Fighting Unicorns	83	Strong
46	8020CyberpunK	82	Strong
47	195CyberKnights	82	Strong
48	2704Roaring Robotics	82	Strong
49	4188Columbus Space Program	82	Strong
50	6865Manitoulin Metal2023 Finalist	82	Strong
51	772Sabre Bytes Robotics	81	Strong
52	2826Wave Robotics	81	Strong
53	4674RoboJacks	81	Strong
54	5653Iron Mosquitos	81	Strong
55	245Adambots	80	Strong
56	4191IMC	80	Strong
57	4561TerrorBytes	80	Strong
58	7287Esquimalt Atom Smashers	80	Strong
59	386Team Voltage	79	Good
60	1477Texas Torque	79	Good
61	6988ACI35	79	Good
62	7451AvengerRobotics	79	Good
63	1987Broncobots	78	Good
64	4125Confidential	78	Good
65	5557BB-R8ERS	78	Good
66	1902Exploding Bacon2019 HoF	76	Good
67	3620Average Joes	76	Good
68	4905Andromeda One	76	Good
69	8575The Due Westerners	76	Good
70	3544Spartiates	75	Good
71	4450Olympia Robotics Federation	75	Good
72	1108Panther Robotics	74	Good
73	1710The Ravonics Revolution	72	Good
74	3284Camdenton LASER 32842023, 2021 Finalist	72	Good
75	4122Ossining OBOTS	72	Good
76	6940Violet Z	72	Good
77	3630Stampede	71	Good
78	2199Robo-Lions	68	Fair
79	1403Team 1403 Cougar Robotics	67	Fair
80	9067The Goonies	63	Fair
81	7028Binary Battalion	61	Fair
82	3880Tiki Techs	58	Fair
83	9449Yellowjackets	55	Fair`;

const lines = text.split('\n');
const teams = lines.map(line => {
  const parts = line.split('\t');
  const rank = parseInt(parts[0]);
  let nameStr = parts[1];
  const score = parseInt(parts[2]);
  const tier = parts[3];
  
  const numMatch = nameStr.match(/^(\d+)/);
  const number = numMatch ? parseInt(numMatch[1]) : 0;
  
  nameStr = nameStr.replace(/^\d+/, '');
  let tags = [];
  if (nameStr.includes('Impact Winner')) {
    tags.push('Impact Winner');
    nameStr = nameStr.replace('Impact Winner', '');
  }
  const yearMatch = nameStr.match(/(\d{4}(?:, \d{4})* Finalist)/);
  if (yearMatch) {
    tags.push(yearMatch[1]);
    nameStr = nameStr.replace(yearMatch[1], '');
  }
  const hofMatch = nameStr.match(/(\d{4} HoF)/);
  if (hofMatch) {
    tags.push(hofMatch[1]);
    nameStr = nameStr.replace(hofMatch[1], '');
  }
  
  return {
    number,
    name: nameStr.trim(),
    score,
    rank,
    tier,
    tags,
    pros: ["Generic Pro 1", "Generic Pro 2"],
    cons: ["Generic Con 1"],
    critique: "A solid team with room to grow.",
    prediction: "Will perform adequately.",
    counterPlay: "Standard strategy applies.",
    stats: {
      out: Math.floor(Math.random() * 40) + 50,
      sus: Math.floor(Math.random() * 40) + 50,
      tec: Math.floor(Math.random() * 40) + 50,
      pip: Math.floor(Math.random() * 40) + 50,
      med: Math.floor(Math.random() * 40) + 50,
      dat: Math.floor(Math.random() * 40) + 50,
    }
  };
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
  details?: {
    impact?: string;
    community?: string;
    sustainability?: string;
  };
}

export const mockTeams: Team[] = ${JSON.stringify(teams, null, 2)};
`);
