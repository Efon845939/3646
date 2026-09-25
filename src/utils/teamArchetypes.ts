import { Team } from '../data';
import { getEnhancedTeamStats } from './frcStatsData';
import { epaWinPercent } from './winProbability';
import { getRealMetrics, winRateOf } from './realMetrics';

export interface TeamBehaviorProfile {
  teamNumber: number;
  archetype: string;
  shootingStyle: 'subwoofer' | 'podium' | 'wing_sniper' | 'turret_dynamic';
  cycleRoute: 'trench' | 'centerfield' | 'wall_chute' | 'feeder_shuttle';
  autoNoteCount: number;
  autoPathStyle: 'centerline_rush' | 'wing_clear' | 'podium_snipe' | 'safe_leave';
  defenseTendency: number; // 0 (pure cycling) to 100 (heavy disruptive defense)
  cycleDurationBase: number; // base seconds per cycle
  climbProfile: {
    preferred: 'trap_deep' | 'deep_climb' | 'park';
    successRate: number;
    durationSec: number;
  };
  signatureMove: string;
  tacticalQuote: string;
  specialAbilities: string[];
}

export const KNOWN_TEAM_PROFILES: Record<number, TeamBehaviorProfile> = {
  // 1678 Citrus Circuits
  1678: {
    teamNumber: 1678,
    archetype: 'Rapid-Fire 5-Note Auto & Trap Specialist',
    shootingStyle: 'subwoofer',
    cycleRoute: 'centerfield',
    autoNoteCount: 5,
    autoPathStyle: 'centerline_rush',
    defenseTendency: 15,
    cycleDurationBase: 7.9,
    climbProfile: {
      preferred: 'trap_deep',
      successRate: 0.98,
      durationSec: 5.2,
    },
    signatureMove: 'Subwoofer Double-Tap & Centerline Sweep',
    tacticalQuote: 'Otonomda 5 nota garanti. Yere düşen her notayı 0.4 saniyede intake eder.',
    specialAbilities: ['5-Note Auto Rush', 'Subwoofer High-Cadence', 'Trap & Stage Harmony', 'Rapid Ground Pickup'],
  },

  // 254 The Cheesy Poofs (FRC Legend)
  254: {
    teamNumber: 254,
    archetype: 'Turreted Vision & Shoot-On-The-Fly',
    shootingStyle: 'turret_dynamic',
    cycleRoute: 'trench',
    autoNoteCount: 5,
    autoPathStyle: 'centerline_rush',
    defenseTendency: 10,
    cycleDurationBase: 7.5,
    climbProfile: {
      preferred: 'deep_climb',
      successRate: 0.99,
      durationSec: 3.5,
    },
    signatureMove: 'Shoot-On-The-Fly & Anti-Pin Spin Orbit',
    tacticalQuote: 'Dönel taret sayesinde durmadan şut atar, savunmayı swerve ile baypas eder.',
    specialAbilities: ['Turreted Aim-while-Moving', 'Zero-Overshoot Pathing', 'Pin Evasion Swerve', 'Sub-second AprilTag Lock'],
  },

  // 3646 INTEGRA (Hero Team / Turkey Champion)
  3646: {
    teamNumber: 3646,
    archetype: 'Kraken Swerve Trench Blitz & Counter-Defense',
    shootingStyle: 'podium',
    cycleRoute: 'trench',
    autoNoteCount: 4,
    autoPathStyle: 'centerline_rush',
    defenseTendency: 45,
    cycleDurationBase: 8.6,
    climbProfile: {
      preferred: 'deep_climb',
      successRate: 0.96,
      durationSec: 4.8,
    },
    signatureMove: 'Integra Trench Sprint & Breakthrough Slam',
    tacticalQuote: 'Yüksek torklu swerve ile koridoru deler geçer; rakibin şut açısını bozar.',
    specialAbilities: ['Trench Sprint (5.2 m/s)', 'Aggressive Cycle Disruption', 'High-Torque Ground Intake', 'Climb Lock Guarantee'],
  },

  // 6328 Mechanical Advantage (AdvantageKit creators)
  6328: {
    teamNumber: 6328,
    archetype: 'AdvantageKit Sensor-Fusion & Amp Strategist',
    shootingStyle: 'podium',
    cycleRoute: 'centerfield',
    autoNoteCount: 5,
    autoPathStyle: 'centerline_rush',
    defenseTendency: 20,
    cycleDurationBase: 8.1,
    climbProfile: {
      preferred: 'trap_deep',
      successRate: 0.97,
      durationSec: 4.5,
    },
    signatureMove: 'AdvantageKit Odometry Replay & Amp Multiplier',
    tacticalQuote: 'Her milisaniyelik hareketi loglar, Amp amplifikasyonunu matematiksel olarak maksimize eder.',
    specialAbilities: ['Zero-Drift Odometry', 'Timed Amp Amplification', 'Optimal Trajectory Planner', 'Dynamic Re-Routing'],
  },

  // 118 The Robonauts (NASA)
  118: {
    teamNumber: 118,
    archetype: 'NASA Linkage Arm & Podium Long-Sniper',
    shootingStyle: 'wing_sniper',
    cycleRoute: 'trench',
    autoNoteCount: 4,
    autoPathStyle: 'podium_snipe',
    defenseTendency: 15,
    cycleDurationBase: 8.8,
    climbProfile: {
      preferred: 'deep_climb',
      successRate: 0.98,
      durationSec: 3.8,
    },
    signatureMove: 'Podium Long-Bomb Snipe & Telescoping Harpoon',
    tacticalQuote: 'Sahayı katetmek zorunda kalmadan 5.5 metreden yüksek açılı şutlar gönderir.',
    specialAbilities: ['5.5m Long-Bomb Snipe', 'Gold Telescopic Harpoon', 'NASA Precision Linkage', 'Stable Launch Platform'],
  },

  // 498 The Cobra Commanders
  498: {
    teamNumber: 498,
    archetype: 'Bulldozer Perimeter Defense & Chute Feeder',
    shootingStyle: 'subwoofer',
    cycleRoute: 'wall_chute',
    autoNoteCount: 3,
    autoPathStyle: 'wing_clear',
    defenseTendency: 65,
    cycleDurationBase: 10.2,
    climbProfile: {
      preferred: 'deep_climb',
      successRate: 0.92,
      durationSec: 6.0,
    },
    signatureMove: 'Arizona Perimeter Lockdown & Source Choke',
    tacticalQuote: 'Ağır şasisiyle rakip skorerleri kaynak bölgesinde kilitler ve zaman kaybettirir.',
    specialAbilities: ['Heavy Bumper Lockdown', 'Source Lane Choke', 'Subwoofer Point-Blank', 'Steady Stage Park'],
  },

  // 2096 RoboActive
  2096: {
    teamNumber: 2096,
    archetype: 'High-Cadence Feeder & Source Shuttle',
    shootingStyle: 'subwoofer',
    cycleRoute: 'wall_chute',
    autoNoteCount: 3,
    autoPathStyle: 'wing_clear',
    defenseTendency: 25,
    cycleDurationBase: 9.3,
    climbProfile: {
      preferred: 'deep_climb',
      successRate: 0.94,
      durationSec: 5.5,
    },
    signatureMove: 'Source Direct Feed & Shuttle Sprint',
    tacticalQuote: 'İnsan oyuncudan notayı alıp sahaya sürmede inanılmaz çevik ve dakik.',
    specialAbilities: ['Human Player Direct Feed', 'Quick Shuttle Release', 'Wall-Hug Transit', 'Synchronized Auto Leave'],
  },

  // 4201 The Vitruvian Bots
  4201: {
    teamNumber: 4201,
    archetype: 'Variable Hood Precision & Dynamic Orbit',
    shootingStyle: 'turret_dynamic',
    cycleRoute: 'centerfield',
    autoNoteCount: 4,
    autoPathStyle: 'centerline_rush',
    defenseTendency: 20,
    cycleDurationBase: 8.4,
    climbProfile: {
      preferred: 'trap_deep',
      successRate: 0.95,
      durationSec: 4.9,
    },
    signatureMove: 'Multi-Angle Hood Adjustment & Swerve Orbit',
    tacticalQuote: 'Her mesafeden atış yapabilen servo açılı atıcı kulesiyle savunmayı etkisizleştirir.',
    specialAbilities: ['Variable Hood Pitch', 'Multi-Zone Target Lock', 'Dynamic Distance Compensation', 'Quick Harmony Climb'],
  },

  // 4253 Raid Zero
  4253: {
    teamNumber: 4253,
    archetype: 'Micro-Cycle Sprint & Agile Passing',
    shootingStyle: 'podium',
    cycleRoute: 'centerfield',
    autoNoteCount: 4,
    autoPathStyle: 'wing_clear',
    defenseTendency: 30,
    cycleDurationBase: 8.9,
    climbProfile: {
      preferred: 'deep_climb',
      successRate: 0.93,
      durationSec: 5.4,
    },
    signatureMove: 'Compact Turning Blitz & High-Speed Shuttle',
    tacticalQuote: 'Dar alanlarda hızlı yön değiştirme ve yüksek ivmelenmeyle şut pozisyonu bulur.',
    specialAbilities: ['Compact Turning Blitz', 'Fast Shuttle Pass', 'Wing Ground Sweep', 'Consistent Subwoofer Aim'],
  },

  // 8393 BrainSTEM Robotics
  8393: {
    teamNumber: 8393,
    archetype: 'Adaptive Vision Pursuit & Burst Cycling',
    shootingStyle: 'podium',
    cycleRoute: 'trench',
    autoNoteCount: 4,
    autoPathStyle: 'centerline_rush',
    defenseTendency: 25,
    cycleDurationBase: 8.7,
    climbProfile: {
      preferred: 'deep_climb',
      successRate: 0.95,
      durationSec: 5.0,
    },
    signatureMove: 'Dynamic Note Pursuit & Amplified Burst Fire',
    tacticalQuote: 'Yuvarlanan veya zıplayan notaları anında algılayıp alan akıllı kamera takip sistemi.',
    specialAbilities: ['Vision Dynamic Tracking', 'Burst Fire Timing', 'Floor Intake Zero-Hesitation', 'Center Stage Anchor'],
  },

  // 7563 Mars
  7563: {
    teamNumber: 7563,
    archetype: 'Aggressive Lane Denial & Turkish Muscle',
    shootingStyle: 'subwoofer',
    cycleRoute: 'centerfield',
    autoNoteCount: 3,
    autoPathStyle: 'wing_clear',
    defenseTendency: 60,
    cycleDurationBase: 10.4,
    climbProfile: {
      preferred: 'deep_climb',
      successRate: 0.91,
      durationSec: 6.2,
    },
    signatureMove: 'Midfield Lane Intercept & Aggressive Harass',
    tacticalQuote: 'Rakip skorerin koridorunu kapatıp şut ritmini bozmada uzmanlaşmış agresif defans.',
    specialAbilities: ['Midfield Lane Intercept', 'Heavy Pinning Force', 'Quick Recovery Spin', 'Subwoofer Backup'],
  },

  // 2905 Sultans of Türkiye
  2905: {
    teamNumber: 2905,
    archetype: 'Veteran Strategy & Multi-Zone Stability',
    shootingStyle: 'podium',
    cycleRoute: 'wall_chute',
    autoNoteCount: 3,
    autoPathStyle: 'wing_clear',
    defenseTendency: 35,
    cycleDurationBase: 9.6,
    climbProfile: {
      preferred: 'deep_climb',
      successRate: 0.94,
      durationSec: 5.6,
    },
    signatureMove: 'Sultan Steady Cycle & Field Vision',
    tacticalQuote: 'Paniklemeden, hatasız ve stabil döngü süreleriyle takımına maç boyu düzenli puan getirir.',
    specialAbilities: ['Zero-Fault Cycle Cadence', 'Field Vision Situational Awareness', 'Safe Wing Routing', 'Solid Stage Anchor'],
  },
};

// Procedural generator for any team not in the explicit dictionary
export function getTeamBehaviorProfile(team: Team): TeamBehaviorProfile {
  if (KNOWN_TEAM_PROFILES[team.number]) {
    return KNOWN_TEAM_PROFILES[team.number];
  }

  const power = team.stats?.opr ?? 50; // real best-event OPR percentile
  const score = team.score ?? 70;
  const isHighTech = power >= 80 || score >= 90;
  const isDefenseTagged = team.tags?.includes('High Threat') || (team.cons?.some((c) => c.toLowerCase().includes('defense')));

  let shootingStyle: TeamBehaviorProfile['shootingStyle'] = 'subwoofer';
  if (power >= 88) shootingStyle = 'turret_dynamic';
  else if (power >= 75) shootingStyle = 'podium';
  else if (team.tags?.includes('Most Creative')) shootingStyle = 'wing_sniper';

  let cycleRoute: TeamBehaviorProfile['cycleRoute'] = 'centerfield';
  if (power >= 85) cycleRoute = 'trench';
  else if (isDefenseTagged) cycleRoute = 'centerfield';
  else cycleRoute = 'wall_chute';

  const autoNoteCount = power >= 90 ? 4 : power >= 70 ? 3 : 2;
  const autoPathStyle = power >= 85 ? 'centerline_rush' : power >= 65 ? 'wing_clear' : 'safe_leave';

  const defenseTendency = isDefenseTagged ? 55 : power > 85 ? 18 : 35;
  const cycleDurationBase = Math.max(7.8, 14.2 - (power / 100) * 5.0 - (score / 100) * 1.5);

  const climbType: 'trap_deep' | 'deep_climb' | 'park' =
    score >= 94 ? 'trap_deep' : score >= 75 ? 'deep_climb' : 'park';

  return {
    teamNumber: team.number,
    archetype: isHighTech
      ? `High-Precision ${shootingStyle === 'turret_dynamic' ? 'Turreted' : 'Swerve'} Scorer`
      : isDefenseTagged
      ? 'Physical Perimeter Disruptor & Feeder'
      : 'Steady Cadence Alliance Contributor',
    shootingStyle,
    cycleRoute,
    autoNoteCount,
    autoPathStyle,
    defenseTendency,
    cycleDurationBase: Number(cycleDurationBase.toFixed(1)),
    climbProfile: {
      preferred: climbType,
      successRate: Math.min(0.98, Math.max(0.75, (score / 100) * 0.95)),
      durationSec: Number((6.5 - (power / 100) * 2.5).toFixed(1)),
    },
    signatureMove: `${team.name} Signature ${shootingStyle === 'subwoofer' ? 'Subwoofer Strike' : 'Podium Release'}`,
    tacticalQuote: `${team.name} (#${team.number}) sahada ${shootingStyle} stili ve ${cycleDurationBase.toFixed(1)}s döngü ortalamasıyla mücadele ediyor.`,
    specialAbilities: [
      `${autoNoteCount}-Note Auto`,
      `${shootingStyle.toUpperCase()} Shooting`,
      `${climbType.replace('_', ' ').toUpperCase()}`,
      `${cycleRoute.toUpperCase()} Transit`,
    ],
  };
}

export type FRCCoreArchetype =
  | 'Defender'
  | 'Cycle-focused'
  | 'All-rounder'
  | 'Long-range Sniper'
  | 'Feeder / Shuttle';

export interface DerivedArchetypeInfo {
  coreArchetype: FRCCoreArchetype;
  detailedArchetype: string;
  badgeColor: string;
  borderColor: string;
  bgLightColor: string;
  description: string;
  keyStrengths: string[];
  vulnerabilities: string[];
  scoutingHighlights: string[];
}

export function deriveCoreArchetype(team: Team, profile?: TeamBehaviorProfile): DerivedArchetypeInfo {
  const p = profile || getTeamBehaviorProfile(team);
  // Classification thresholds stay on the behaviour profile; the numbers quoted in the text
  // come from scouted stats so they match the rest of the team profile.
  const scouted = (team.frcStats ?? getEnhancedTeamStats(team)).cycles;
  const power = team.stats?.opr ?? 50; // real best-event OPR percentile
  const winPct = team.stats?.win ?? 50;
  const expPct = team.stats?.exp ?? 50;
  const score = team.score ?? 70;

  const isHighThreat = team.tags?.includes('High Threat');
  const consString = (team.cons || []).join(' ').toLowerCase();
  const prosString = (team.pros || []).join(' ').toLowerCase();

  // 1. Defender Archetype Check
  if (
    p.defenseTendency >= 45 ||
    isHighThreat ||
    consString.includes('defense') ||
    prosString.includes('pinning') ||
    prosString.includes('defense') ||
    team.counterPlay?.toLowerCase().includes('pinning')
  ) {
    return {
      coreArchetype: 'Defender',
      detailedArchetype: p.archetype.includes('Disrupt') ? p.archetype : 'Physical Perimeter Disruptor & Lane Choker',
      badgeColor: 'text-rose-400',
      borderColor: 'border-rose-500/40',
      bgLightColor: 'bg-rose-500/15',
      description:
        'Sert swerve temasları, orta saha koridor tıkayışı ve rakip skorerlerin ritmini bozmaya odaklı fiziksel savunmacı.',
      keyStrengths: [
        'Orta saha koridor kapatma (Midfield Choke)',
        'Sert pinleme & temaslı sürüş momentumu',
        'Subwoofer şut açısı gölgeleme',
      ],
      vulnerabilities: [
        'Korumalı alanlarda faul (Tech Foul) riski',
        'Düşük tekil teleop şut hacmi',
        'Çevik swerve kaçışlarına karşı pozisyon kaybı',
      ],
      scoutingHighlights: [
        `Savunma Eğilimi: %${p.defenseTendency}`,
        `Skor Gücü (OPR) Yüzdeliği: %${power}`,
        `Karakteristik Hamle: ${p.signatureMove}`,
      ],
    };
  }

  // 2. Cycle-focused Archetype Check
  if (
    (power >= 80 && p.cycleDurationBase <= 8.6 && p.defenseTendency <= 25) ||
    team.tags?.includes('Top Seed') ||
    score >= 93
  ) {
    return {
      coreArchetype: 'Cycle-focused',
      detailedArchetype: p.archetype.includes('Rush') ? p.archetype : 'High-Cadence Rapid Cycle Finisher',
      badgeColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/40',
      bgLightColor: 'bg-cyan-500/15',
      description:
        'Sahanın iki ucu arasında saniyeler içinde nota taşıyıp seri şut atan, durmaksızın skor üreten çevrim makinesi.',
      keyStrengths: [
        `Yüksek çevrim hızı (~${scouted.avgCycleTimeSec}s döngü)`,
        `${p.autoNoteCount}+ Nota otonom kapasitesi`,
        'Sıfır tereddütlü zemin intake mekanizması',
      ],
      vulnerabilities: [
        'Temaslı savunma altında çevrim süresi 2 katına çıkabilir',
        'Besleme koridoru tıkandığında rotası kilitlenebilir',
        'Zorlu açılardan veya subwoofer dışından şut verimi düşebilir',
      ],
      scoutingHighlights: [
        `Temel Çevrim Süresi: ${scouted.avgCycleTimeSec}s`,
        `Otonom Nota Hedefi: ${p.autoNoteCount} Nota`,
        `Şut Stili: ${p.shootingStyle.toUpperCase()}`,
      ],
    };
  }

  // 3. Long-range Sniper Archetype Check
  if (
    p.shootingStyle === 'wing_sniper' ||
    p.shootingStyle === 'podium' ||
    p.shootingStyle === 'turret_dynamic' ||
    team.tags?.includes('Most Creative')
  ) {
    return {
      coreArchetype: 'Long-range Sniper',
      detailedArchetype: p.archetype.includes('Turret') ? p.archetype : 'AprilTag Precision Long-Range Sniper',
      badgeColor: 'text-purple-400',
      borderColor: 'border-purple-500/40',
      bgLightColor: 'bg-purple-500/15',
      description:
        'Podium veya Wing bölgesinden AprilTag görüş kilidiyle uzaktan yüksek kavisli şutlar atarak kalabalık savunmayı baypas eder.',
      keyStrengths: [
        'Subwoofer kalabalığına girmeden uzaktan skor',
        'AprilTag ile milisaniyelik vizyon hedeflemesi',
        'Kanat bölgesinden (Wing) seri amplifikasyon desteği',
      ],
      vulnerabilities: [
        'Görüş hattı (Line of Sight) kesildiğinde nişan gecikmesi',
        'Batarya voltaj düşüşünde (voltage sag) şut mesafesi kısalması',
        'Dönen volan (flywheel) toparlanma süresi',
      ],
      scoutingHighlights: [
        `Atış Bölgesi: ${p.shootingStyle.toUpperCase()}`,
        `Skor Gücü (OPR) Yüzdeliği: %${power}`,
        `İmza Tekniği: ${p.signatureMove}`,
      ],
    };
  }

  // 4. Feeder / Shuttle Archetype Check
  if (
    p.cycleRoute === 'wall_chute' ||
    p.cycleRoute === 'feeder_shuttle' ||
    (power < 74 && score >= 65)
  ) {
    return {
      coreArchetype: 'Feeder / Shuttle',
      detailedArchetype: 'Rapid Wing Feeder & Transit Shuttle',
      badgeColor: 'text-amber-400',
      borderColor: 'border-amber-500/40',
      bgLightColor: 'bg-amber-500/15',
      description:
        'İttifakın ana skorerini besleyen, insan oyuncudan veya orta sahadan hızla notaları ileri fırlatan lojistik robotu.',
      keyStrengths: [
        'Kısa mesafeli zemin pasları & hızlı besleme',
        'Düşük arıza ve yüksek güvenilirlik',
        'İttifak skorerinin zaman kazanmasını sağlama',
      ],
      vulnerabilities: [
        'Tek başına yüksek skor üretememe',
        'Pas attığı partnerin şut kaçırması durumunda efor kaybı',
        'Orta sahada paslarının kapılabilmesi',
      ],
      scoutingHighlights: [
        `Geçiş Koridoru: ${p.cycleRoute.toUpperCase()}`,
        `Genel Güvenilirlik: ${score}/100`,
        `Tırmanış Başarısı: %${scouted.climbSuccessPct}`,
      ],
    };
  }

  // 5. Default: All-rounder Archetype
  return {
    coreArchetype: 'All-rounder',
    detailedArchetype: 'Tactical Multi-Role All-Rounder & Dynamic Anchor',
    badgeColor: 'text-accent',
    borderColor: 'border-integra-yellow/40',
    bgLightColor: 'bg-integra-yellow/15',
    description:
      'Hem otonomda hem teleopta yüksek skor üretebilen, gerektiğinde akıllı savunmaya geçip maç sonunda güvenle tırmanan dengeli takım.',
    keyStrengths: [
      'Otonom, teleop ve tırmanışta dengeli yüksek skor',
      'Maçın gidişatına göre rol değiştirebilme (Skor / Savunma)',
      'Yüksek analitik ve scouting stratejisi desteği',
    ],
    vulnerabilities: [
      'Aynı anda hem ana skorerliği hem savunmayı üstlenirse efor bölünmesi',
      'Aşırı agresif savunmacılara karşı yıpranma',
    ],
    scoutingHighlights: [
      `Yüzdelikler: OPR %${power} • Galibiyet %${winPct} • Deneyim %${expPct}`,
      `Otonom: ${p.autoNoteCount} Nota`,
      `Tırmanış Tipi: ${p.climbProfile.preferred.toUpperCase()}`,
    ],
  };
}

export interface ProactiveMatchupTactic {
  id: string;
  phase: 'Autonomous' | 'Teleop Cycle' | 'Counter-Defense' | 'Endgame';
  title: string;
  summary: string;
  recommendedAction: string;
  impact: 'GAME CHANGER' | 'HIGH VALUE' | 'CRITICAL COUNTER';
}

export interface MatchupTacticsIntel {
  allyArchetype: DerivedArchetypeInfo;
  rivalArchetype: DerivedArchetypeInfo;
  threatLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'MANAGEABLE';
  winProbabilityEstimate: number;
  matchupDeltas: Array<{
    label: string;
    allyVal: string;
    rivalVal: string;
    advantage: 'ally' | 'rival' | 'even';
  }>;
  proactiveTactics: ProactiveMatchupTactic[];
}

export function generateMatchupTactics(ally: Team, rival: Team): MatchupTacticsIntel {
  const allyProfile = getTeamBehaviorProfile(ally);
  const rivalProfile = getTeamBehaviorProfile(rival);

  const allyArchetype = deriveCoreArchetype(ally, allyProfile);
  const rivalArchetype = deriveCoreArchetype(rival, rivalProfile);

  // Threat comes from real scoring power (best-event OPR percentile). The Pre-PR score is an
  // Impact ranking and says nothing about how dangerous a robot is on the field.
  let threatLevel: MatchupTacticsIntel['threatLevel'] = 'MODERATE';
  if (rival.stats.opr >= 90) {
    threatLevel = 'CRITICAL';
  } else if (rival.stats.opr >= 75) {
    threatLevel = 'HIGH';
  } else if (rival.stats.opr <= 30) {
    threatLevel = 'MANAGEABLE';
  }

  // Same rating model the match simulator uses, so both screens agree.
  const allyStats = ally.frcStats ?? getEnhancedTeamStats(ally);
  const rivalStats = rival.frcStats ?? getEnhancedTeamStats(rival);
  const winProbabilityEstimate = epaWinPercent(allyStats.epa.total, rivalStats.epa.total);

  // Head-to-head rows use real 2026 results only.
  const allyReal = getRealMetrics(ally.number);
  const rivalReal = getRealMetrics(rival.number);
  const row = (
    label: string,
    a: number | null | undefined,
    r: number | null | undefined,
    format: (v: number) => string,
    lowerIsBetter = false
  ): MatchupTacticsIntel['matchupDeltas'][number] => {
    const av = a ?? null;
    const rv = r ?? null;
    let advantage: 'ally' | 'rival' | 'even' = 'even';
    if (av !== null && rv !== null && av !== rv) advantage = (av > rv) !== lowerIsBetter ? 'ally' : 'rival';
    return { label, allyVal: av === null ? '—' : format(av), rivalVal: rv === null ? '—' : format(rv), advantage };
  };
  const matchupDeltas: MatchupTacticsIntel['matchupDeltas'] = [
    row('En İyi OPR (2026)', allyReal?.bestOpr, rivalReal?.bestOpr, (v) => v.toFixed(1)),
    row('Galibiyet Oranı (2026)', winRateOf(allyReal?.record ?? null), winRateOf(rivalReal?.record ?? null), (v) => `%${v}`),
    row('En İyi Etkinlik Sırası', allyReal?.bestEventRank, rivalReal?.bestEventRank, (v) => `#${v}`, true),
    row('2026 Ödülleri', allyReal?.awards2026, rivalReal?.awards2026, (v) => String(v)),
    row('Impact Ödülleri (tüm yıllar)', allyReal?.impactWins, rivalReal?.impactWins, (v) => String(v)),
  ];

  // Proactively generate archetype-specific tactics
  const tactics: ProactiveMatchupTactic[] = [];

  // TACTIC 1: AUTONOMOUS
  if (rivalArchetype.coreArchetype === 'Cycle-focused') {
    tactics.push({
      id: 'auto-centerline-contest',
      phase: 'Autonomous',
      title: 'Orta Çizgi Not Açlığı (Centerline Starvation)',
      summary: `Rakip #${rival.number} [${rivalArchetype.coreArchetype}], otonomda ${rivalProfile.autoNoteCount} nota hedefliyor ve orta çizgiye hızla koşuyor.`,
      recommendedAction:
        'İlk 3.8 saniyede orta hatta agresif rota çizin. Rakibin hedeflediği 3. ve 4. notayı doğrudan intake edin veya rakibin erişemeyeceği kör noktalara itin.',
      impact: 'GAME CHANGER',
    });
  } else if (rivalArchetype.coreArchetype === 'Defender') {
    tactics.push({
      id: 'auto-safe-wing-clear',
      phase: 'Autonomous',
      title: 'Güvenli Wing Temizliği & Erken Skor Avantajı',
      summary: `Savunma ağırlıklı rakibe karşı maçın ilk 15 saniyesinde temas yasağını fırsata çevirin.`,
      recommendedAction:
        'Kendi Wing alanınızdaki 3 spike notasını garantiye alın. Rakip savunmaya geçmeden önce +15 ila +20 puanlık tampon oluşturun.',
      impact: 'HIGH VALUE',
    });
  } else {
    tactics.push({
      id: 'auto-subwoofer-precision',
      phase: 'Autonomous',
      title: 'Subwoofer Senkronizasyonu & Hızlı Çıkış (Auto Leave)',
      summary: `Dengeli rakibe karşı otonom skor avantajı ve saha terk bonusunu (2 pt) eksiksiz tamamlayın.`,
      recommendedAction:
        'Preload + 2 Wing notasını 9 saniye içinde subwooferdan atıp, teleop için besleme koridoruna konumlanın.',
      impact: 'HIGH VALUE',
    });
  }

  // TACTIC 2: TELEOP CYCLE & CHOKE
  if (rivalArchetype.coreArchetype === 'Cycle-focused') {
    tactics.push({
      id: 'teleop-lane-choke',
      phase: 'Teleop Cycle',
      title: 'Orta Saha Koridor Daraltması (Midfield Lane Choke)',
      summary: 'Rakibin döngü süresini serbest koridorları kapatarak uzatın.',
      recommendedAction:
        'İttifak partnerinizi rakibin düz hat transit koridoruna yerleştirin. Bumper temaslarıyla yönünü saptırarak Subwoofer yerine zor açılardan şut atmaya zorlayın.',
      impact: 'GAME CHANGER',
    });
  } else if (rivalArchetype.coreArchetype === 'Defender') {
    tactics.push({
      id: 'teleop-trench-bypass',
      phase: 'Teleop Cycle',
      title: 'Trench Baypas & Dönel Swerve Sıyrılması (Orbit Evasion)',
      summary: `Rakibin sert pinleme ve fiziksel temas tuzaklarını swerve dönel manevraları ve Trench tüneliyle baypas edin.`,
      recommendedAction:
        'Dar koridorlarda kafa kafaya çarpışmaktan kaçının. Trench hattından akın ve partnerinize zemin pası (shuttle pass) aktararak savunmayı boşa çıkarın.',
      impact: 'CRITICAL COUNTER',
    });
  } else if (rivalArchetype.coreArchetype === 'Long-range Sniper') {
    tactics.push({
      id: 'teleop-sniper-shadow',
      phase: 'Teleop Cycle',
      title: 'Podium / AprilTag Vizyon Hattı Gölgelemesi',
      summary: `Rakip uzaktan nişan alarak kalabalığa girmiyor; vizyon kamerasının AprilTag hattını kesin.`,
      recommendedAction:
        'Rakip şut çekmek için durduğu anda gövdenizle AprilTag görüş açısını kapatın veya hafif bir tampon temasıyla volan kalibrasyonunu bozun.',
      impact: 'CRITICAL COUNTER',
    });
  } else {
    tactics.push({
      id: 'teleop-amp-coordination',
      phase: 'Teleop Cycle',
      title: 'Amplifikasyon Penceresi Senkronizasyonu',
      summary: `Her 5 notada bir açılan 10 saniyelik 5 puanlık speaker amplifikasyonunu rakibe kaptırmayın.`,
      recommendedAction:
        'Amp puanı hazırken sahada en az 2 adet dolu robot bekletin. Amp butonuna basıldığı an 10 saniye içinde çift şut boşaltarak +10 puan fark açın.',
      impact: 'HIGH VALUE',
    });
  }

  // TACTIC 3: DEFENSE & FOUL DISCIPLINE
  tactics.push({
    id: 'counter-foul-discipline',
    phase: 'Counter-Defense',
    title: 'Korumalı Alan Tuzağı & Temiz Disiplin (Protected Zone Trap)',
    summary: 'Rakip savunmacıları Subwoofer ve Source koruma bölgelerinde faul yapmaya mecbur bırakın.',
    recommendedAction:
      'İntake alırken Source sınırları içinde kalın; şut atarken Subwoofer çemberine girin. Buralarda yapılacak temaslar rakibe sarı kart veya teknik faul (Tech Foul, +5 / +10 pts) kazandırır.',
    impact: 'HIGH VALUE',
  });

  // TACTIC 4: ENDGAME COORDINATION
  if (rivalProfile.climbProfile.preferred === 'trap_deep') {
    tactics.push({
      id: 'endgame-trap-counter',
      phase: 'Endgame',
      title: 'Sahne Trap Kapışması & Erken Tırmanış (25s Warning)',
      summary: `Rakip #${rival.number} trap puanını (+14) hedefliyor; teleop bitimine 25s kala sahneye dönün.`,
      recommendedAction:
        'Rakip tırmanışa hazırlanırken zincir alanını işgal etmesini geciktirin ve kendi çift tırmanışınızı (Stage Harmony) sakin şekilde tamamlayın.',
      impact: 'GAME CHANGER',
    });
  } else {
    tactics.push({
      id: 'endgame-harmony-lock',
      phase: 'Endgame',
      title: 'Stage Harmony & Derin Tırmanış Sigortası',
      summary: 'Son 20 saniyede riske girmeden tırmanışı kilitleyin.',
      recommendedAction:
        'Kafes / zincir yapısına 135. saniyede yanaşın. Partner robotla aynı zincirde çift tırmanış (Stage Harmony) yaparak +16 ila +20 endgame puanı toplayın.',
      impact: 'HIGH VALUE',
    });
  }

  return {
    allyArchetype,
    rivalArchetype,
    threatLevel,
    winProbabilityEstimate,
    matchupDeltas,
    proactiveTactics: tactics,
  };
}
