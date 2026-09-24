import { Team } from '../data';

export type MatchPhase = 'idle' | 'auto' | 'teleop' | 'endgame' | 'completed';
export type SimMode = '1v1' | '3v3';
export type AllianceStrategy = 'triple_offense' | 'lockdown_defense' | 'amplification_rush';

export interface FloatingScore {
  id: string;
  x: number; // percentage on field (0-100)
  y: number; // percentage on field (0-100)
  text: string;
  alliance: 'blue' | 'red';
  color?: string;
}

export interface FlyingProjectile {
  id: string;
  startX: number; // %
  startY: number; // %
  targetX: number; // %
  targetY: number; // %
  currentX: number;
  currentY: number;
  arcZ: number; // 0 to 1 peak height
  progress: number; // 0 to 1
  alliance: 'blue' | 'red';
  points: number;
  label: string;
}

export interface FieldNote {
  id: string;
  x: number; // % on field
  y: number; // % on field
  active: boolean;
  type: 'centerline' | 'wing_blue' | 'wing_red' | 'source_blue' | 'source_red';
}

export interface MatchEvent {
  id: string;
  matchSecond: number;
  timeStr: string;
  phase: 'AUTO' | 'TELEOP' | 'ENDGAME';
  alliance: 'blue' | 'red';
  teamNumber: number;
  description: string;
  points: number;
  type: 'score' | 'intake' | 'climb' | 'auto_leave' | 'foul' | 'defense' | 'amp_boost';
}

export interface RobotSimState {
  teamNumber: number;
  teamName: string;
  alliance: 'blue' | 'red';
  role: 'captain' | 'pick1' | 'pick2';
  
  // Physical coordinates on standard 16.54m x 8.21m FRC field
  x: number; // % of field (0 - 100)
  y: number; // % of field (0 - 100)
  realX: number; // meters (0 - 16.54m)
  realY: number; // meters (0 - 8.21m)
  vx: number; // m/s
  vy: number; // m/s
  speedMps: number; // current speed in m/s
  heading: number; // degrees (0 - 360)
  swervePodAngles: [number, number, number, number];
  
  // Telemetry & Mechanisms
  action: string;
  hasPiece: boolean;
  intakeState: 'idle' | 'intaking' | 'indexing' | 'shooting';
  shooterRpm: number;
  batteryVoltage: number;
  limelightLocked: boolean;
  
  // Performance
  notesScored: number;
  notesAmped: number;
  currentCycleTimeS: number;
  avgCycleTimeS: number;
  
  scoreBreakdown: {
    autoLeave: number;
    autoNotes: number;
    teleopSpeaker: number;
    teleopAmp: number;
    endgame: number;
    total: number;
  };
  climbed: boolean;
  climbType: 'none' | 'park' | 'deep_climb' | 'trap';
}

export interface AllianceSimState {
  teams: Team[];
  strategy: AllianceStrategy;
  robots: RobotSimState[];
  scoreBreakdown: {
    autoLeave: number;
    autoNotes: number;
    teleopSpeaker: number;
    teleopAmplified: number;
    teleopAmp: number;
    endgame: number;
    penalties: number;
    total: number;
  };
  ampNotesCount: number; // 0 to 2
  isAmplified: boolean;
  amplifiedTimeRemainingSec: number;
  rankingPoints: {
    win: boolean;
    tie: boolean;
    melody: boolean;
    ensemble: boolean;
    totalRP: number;
  };
}

export type SimSpeedMode = 1 | 2.5 | 5;
