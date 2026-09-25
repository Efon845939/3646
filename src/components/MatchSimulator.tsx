import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import {
  X,
  Search,
  Swords,
  Trophy,
  Activity,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Clock,
  Award,
  Zap,
  ChevronRight,
  ShieldAlert,
  Volume2,
  VolumeX,
  Gauge,
  BatteryCharging,
  Eye,
  Radio,
  Sliders,
  ShieldCheck,
  Target,
  Users,
  User,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Team, mockTeams, getEnhancedTeamStats } from '../data';
import { motion, AnimatePresence } from 'motion/react';
import { FRCArenaField } from './FRCArenaField';
import {
  MatchPhase,
  RobotSimState,
  FloatingScore,
  FlyingProjectile,
  FieldNote,
  MatchEvent,
  SimSpeedMode,
  SimMode,
  AllianceStrategy,
} from './simulationTypes';
import { frcAudio } from '../utils/frcAudio';
import { getTeamBehaviorProfile } from '../utils/teamArchetypes';
import { epaWinPercent } from '../utils/winProbability';
import { buildDefaultLineup } from '../utils/defaultLineup';
import { driveToward } from '../utils/robotKinematics';

interface MatchSimulatorProps {
  onClose: () => void;
  initialTeamA?: Team | null;
  initialTeamB?: Team | null;
}

const TOTAL_MATCH_SECONDS = 150; // 2m 30s: 15s Auto, 115s Teleop, 20s Endgame
const FIELD_LENGTH_M = 16.54;
const FIELD_WIDTH_M = 8.21;

export function MatchSimulator({
  onClose,
  initialTeamA,
  initialTeamB,
}: MatchSimulatorProps) {
  // Mode: 1v1 duel or 3v3 playoff alliance
  const [simMode, setSimMode] = useState<SimMode>('3v3');

  // Six distinct robots, resolved once on mount (see buildDefaultLineup).
  const [defaultLineup] = useState(() => buildDefaultLineup(initialTeamA, initialTeamB));

  // Blue Alliance Teams (Captain, 1st Pick, 2nd Pick)
  const [blueCaptain, setBlueCaptain] = useState<Team>(defaultLineup.blueCaptain);
  const [bluePick1, setBluePick1] = useState<Team>(defaultLineup.bluePick1);
  const [bluePick2, setBluePick2] = useState<Team>(defaultLineup.bluePick2);

  // Red Alliance Teams (Captain, 1st Pick, 2nd Pick)
  const [redCaptain, setRedCaptain] = useState<Team>(defaultLineup.redCaptain);
  const [redPick1, setRedPick1] = useState<Team>(defaultLineup.redPick1);
  const [redPick2, setRedPick2] = useState<Team>(defaultLineup.redPick2);

  // Strategic Playbooks per Alliance
  const [blueStrategy, setBlueStrategy] = useState<AllianceStrategy>('triple_offense');
  const [redStrategy, setRedStrategy] = useState<AllianceStrategy>('triple_offense');

  // Primary active robots displayed on the 2D field canvas
  const primaryBlueTeam = blueCaptain;
  const primaryRedTeam = redCaptain;

  // Match progression
  const [phase, setPhase] = useState<MatchPhase>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speedMode, setSpeedMode] = useState<SimSpeedMode>(2.5);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [cameraMode, setCameraMode] = useState<'full' | 'blue' | 'red'>('full');

  // Amp Amplification Timers (10-second windows where speaker shots are worth 5 pts)
  const [blueAmpNotes, setBlueAmpNotes] = useState(0);
  const [blueAmplifiedRemaining, setBlueAmplifiedRemaining] = useState(0);
  const [redAmpNotes, setRedAmpNotes] = useState(0);
  const [redAmplifiedRemaining, setRedAmplifiedRemaining] = useState(0);

  // Ground pieces & Projectiles
  const [fieldNotes, setFieldNotes] = useState<FieldNote[]>(() => createInitialFieldNotes());
  const [flyingProjectiles, setFlyingProjectiles] = useState<FlyingProjectile[]>([]);

  // Primary Robots telemetry
  const [blueRobot, setBlueRobot] = useState<RobotSimState>(() =>
    createInitialRobotState(primaryBlueTeam, 'blue', 'captain')
  );
  const [redRobot, setRedRobot] = useState<RobotSimState>(() =>
    createInitialRobotState(primaryRedTeam, 'red', 'captain')
  );

  // Alliance Aggregate Scores (in 3v3 mode, includes Pick 1 & Pick 2 contributions)
  const [blueAllianceScore, setBlueAllianceScore] = useState({
    autoLeave: 0,
    autoNotes: 0,
    teleopSpeaker: 0,
    teleopAmplified: 0,
    teleopAmp: 0,
    endgame: 0,
    total: 0,
  });

  const [redAllianceScore, setRedAllianceScore] = useState({
    autoLeave: 0,
    autoNotes: 0,
    teleopSpeaker: 0,
    teleopAmplified: 0,
    teleopAmp: 0,
    endgame: 0,
    total: 0,
  });

  // Feed & FX
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);

  // Animation Loop Refs
  const rafRef = useRef<number | null>(null);
  // Timestamp of the last simulated frame. The tick effect below re-subscribes on every state
  // change, so the frame clock must live outside it or each frame's delta is mis-measured.
  const lastFrameTimeRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const feedEndRef = useRef<HTMLDivElement | null>(null);

  // Sync Audio manager
  useEffect(() => {
    frcAudio.enabled = audioEnabled;
  }, [audioEnabled]);

  // Statbotics Pre-Match Alliance Predictions
  const predictions = useMemo(() => {
    const bCapStats = blueCaptain.frcStats ?? getEnhancedTeamStats(blueCaptain);
    const bP1Stats = bluePick1.frcStats ?? getEnhancedTeamStats(bluePick1);
    const bP2Stats = bluePick2.frcStats ?? getEnhancedTeamStats(bluePick2);

    const rCapStats = redCaptain.frcStats ?? getEnhancedTeamStats(redCaptain);
    const rP1Stats = redPick1.frcStats ?? getEnhancedTeamStats(redPick1);
    const rP2Stats = redPick2.frcStats ?? getEnhancedTeamStats(redPick2);

    const blueTotalEPA =
      simMode === '3v3'
        ? Math.round((bCapStats.epa.total + bP1Stats.epa.total + bP2Stats.epa.total) * 10) / 10
        : bCapStats.epa.total;

    const redTotalEPA =
      simMode === '3v3'
        ? Math.round((rCapStats.epa.total + rP1Stats.epa.total + rP2Stats.epa.total) * 10) / 10
        : rCapStats.epa.total;

    const blueAutoEPA =
      simMode === '3v3'
        ? Math.round((bCapStats.epa.auto + bP1Stats.epa.auto + bP2Stats.epa.auto) * 10) / 10
        : bCapStats.epa.auto;

    const redAutoEPA =
      simMode === '3v3'
        ? Math.round((rCapStats.epa.auto + rP1Stats.epa.auto + rP2Stats.epa.auto) * 10) / 10
        : rCapStats.epa.auto;

    const blueEndgameEPA =
      simMode === '3v3'
        ? Math.round((bCapStats.epa.endgame + bP1Stats.epa.endgame + bP2Stats.epa.endgame) * 10) / 10
        : bCapStats.epa.endgame;

    const redEndgameEPA =
      simMode === '3v3'
        ? Math.round((rCapStats.epa.endgame + rP1Stats.epa.endgame + rP2Stats.epa.endgame) * 10) / 10
        : rCapStats.epa.endgame;

    const winProb = epaWinPercent(blueTotalEPA, redTotalEPA);

    return {
      blueTotalEPA,
      redTotalEPA,
      blueAutoEPA,
      redAutoEPA,
      blueEndgameEPA,
      redEndgameEPA,
      blueWinProb: winProb,
      redWinProb: 100 - winProb,
      expectedBlueScore: Math.round(blueTotalEPA * 1.05 + 8),
      expectedRedScore: Math.round(redTotalEPA * 1.05 + 8),
    };
  }, [blueCaptain, bluePick1, bluePick2, redCaptain, redPick1, redPick2, simMode]);

  // Reset match to initial state
  const resetMatch = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsRunning(false);
    setPhase('idle');
    setElapsedSeconds(0);
    setBlueAmpNotes(0);
    setBlueAmplifiedRemaining(0);
    setRedAmpNotes(0);
    setRedAmplifiedRemaining(0);
    setFieldNotes(createInitialFieldNotes());
    setFlyingProjectiles([]);
    setBlueRobot(createInitialRobotState(blueCaptain, 'blue', 'captain'));
    setRedRobot(createInitialRobotState(redCaptain, 'red', 'captain'));
    setBlueAllianceScore({
      autoLeave: 0,
      autoNotes: 0,
      teleopSpeaker: 0,
      teleopAmplified: 0,
      teleopAmp: 0,
      endgame: 0,
      total: 0,
    });
    setRedAllianceScore({
      autoLeave: 0,
      autoNotes: 0,
      teleopSpeaker: 0,
      teleopAmplified: 0,
      teleopAmp: 0,
      endgame: 0,
      total: 0,
    });
    setEvents([]);
    setFloatingScores([]);
    lastTimeRef.current = null;
  };

  useEffect(() => {
    resetMatch();
  }, [
    blueCaptain.number,
    bluePick1.number,
    bluePick2.number,
    redCaptain.number,
    redPick1.number,
    redPick2.number,
    simMode,
  ]);

  const formatTime = (seconds: number) => {
    const remaining = Math.max(0, TOTAL_MATCH_SECONDS - seconds);
    const mins = Math.floor(remaining / 60);
    const secs = Math.floor(remaining % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const triggerScore = (
    alliance: 'blue' | 'red',
    points: number,
    label: string,
    fieldX: number,
    fieldY: number,
    currentSecs: number,
    currentPhase: 'AUTO' | 'TELEOP' | 'ENDGAME',
    type: MatchEvent['type'] = 'score',
    teamNumber?: number
  ) => {
    const activeTeamNum =
      teamNumber || (alliance === 'blue' ? blueCaptain.number : redCaptain.number);

    setFloatingScores((prev) => [
      ...prev.slice(-8),
      {
        id: `float-${Date.now()}-${Math.random()}`,
        x: fieldX,
        y: fieldY,
        text: `+${points} ${label}`,
        alliance,
      },
    ]);

    setEvents((prev) => [
      ...prev,
      {
        id: `ev-${Date.now()}-${Math.random()}`,
        matchSecond: Math.floor(currentSecs),
        timeStr: formatTime(currentSecs),
        phase: currentPhase,
        alliance,
        teamNumber: activeTeamNum,
        description: `[#${activeTeamNum}] +${points} pts (${label})`,
        points,
        type,
      },
    ]);

    if (points > 0) {
      if (currentPhase === 'AUTO') frcAudio.playScoreHigh();
      else if (label.includes('Amp')) frcAudio.playScoreLow();
      else frcAudio.playScoreHigh();
    }
  };

  // Launch projectile ring
  const launchProjectile = (
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    alliance: 'blue' | 'red',
    points: number,
    label: string
  ) => {
    frcAudio.playShoot();
    setFlyingProjectiles((prev) => [
      ...prev,
      {
        id: `proj-${Date.now()}-${Math.random()}`,
        startX,
        startY,
        targetX,
        targetY,
        currentX: startX,
        currentY: startY,
        arcZ: 0,
        progress: 0,
        alliance,
        points,
        label,
      },
    ]);
  };

  // Everything the frame loop reads, refreshed after every render. The loop itself is started
  // once per run (it depends only on isRunning), so it never skips frames by being torn down
  // and re-subscribed whenever state changes, which used to happen on every single frame.
  const latestRef = useRef({
    speedMode,
    blueStrategy,
    redStrategy,
    simMode,
    blueCaptain,
    redCaptain,
    blueAmplified: blueAmplifiedRemaining > 0,
    redAmplified: redAmplifiedRemaining > 0,
    updateRobotStep: (..._args: Parameters<typeof updateRobotStep>) => {},
    simulateAllianceWingBots: (..._args: Parameters<typeof simulateAllianceWingBots>) => {},
  });
  useLayoutEffect(() => {
    latestRef.current = {
      speedMode,
      blueStrategy,
      redStrategy,
      simMode,
      blueCaptain,
      redCaptain,
      blueAmplified: blueAmplifiedRemaining > 0,
      redAmplified: redAmplifiedRemaining > 0,
      updateRobotStep,
      simulateAllianceWingBots,
    };
  });

  // Main simulation tick
  useEffect(() => {
    if (!isRunning) {
      lastFrameTimeRef.current = null; // paused time must not count as one huge frame
      return;
    }

    // The loop owns match time and phase while running; it starts from the current state.
    let elapsed = elapsedSeconds;
    let currentPhase = phase;

    const loop = (time: number) => {
      const L = latestRef.current;
      const prevTime = lastFrameTimeRef.current ?? time;
      lastFrameTimeRef.current = time;
      // Clamp to 0–100 ms so a background tab or a slow frame cannot teleport robots.
      const realDeltaMs = Math.min(100, Math.max(0, time - prevTime));

      const simDeltaSec = (realDeltaMs / 1000) * L.speedMode;
      const nextElapsed = elapsed + simDeltaSec;

      if (nextElapsed >= TOTAL_MATCH_SECONDS) {
        setElapsedSeconds(TOTAL_MATCH_SECONDS);
        setPhase('completed');
        setIsRunning(false);
        frcAudio.playBuzzer();
        return;
      }

      elapsed = nextElapsed;
      setElapsedSeconds(nextElapsed);

      // Match Phase Progression
      const nextPhase = nextElapsed <= 15 ? 'auto' : nextElapsed <= 130 ? 'teleop' : 'endgame';
      if (nextPhase !== currentPhase) {
        currentPhase = nextPhase;
        setPhase(nextPhase);
        if (nextPhase === 'auto') frcAudio.playCharge();
        else if (nextPhase === 'teleop') frcAudio.playWhistle();
        else frcAudio.playBuzzer();
      }

      // Update Amplification timers
      setBlueAmplifiedRemaining((prev) => (prev > 0 ? Math.max(0, prev - simDeltaSec) : prev));
      setRedAmplifiedRemaining((prev) => (prev > 0 ? Math.max(0, prev - simDeltaSec) : prev));

      // Update Flying Projectiles
      setFlyingProjectiles((prev) => {
        const remaining: FlyingProjectile[] = [];
        prev.forEach((p) => {
          const nextProg = p.progress + simDeltaSec * 2.2;
          if (nextProg >= 1) {
            triggerScore(
              p.alliance,
              p.points,
              p.label,
              p.targetX,
              p.targetY,
              nextElapsed,
              nextElapsed <= 15 ? 'AUTO' : nextElapsed <= 130 ? 'TELEOP' : 'ENDGAME',
              'score'
            );
          } else {
            const curX = p.startX + (p.targetX - p.startX) * nextProg;
            const curY = p.startY + (p.targetY - p.startY) * nextProg;
            const arcZ = Math.sin(nextProg * Math.PI);
            remaining.push({
              ...p,
              progress: nextProg,
              currentX: curX,
              currentY: curY,
              arcZ,
            });
          }
        });
        return remaining;
      });

      // Update Robot Physical Kinematics & Mechanics
      L.updateRobotStep('blue', L.blueCaptain, L.blueStrategy, L.redStrategy, nextElapsed, simDeltaSec, L.blueAmplified);
      L.updateRobotStep('red', L.redCaptain, L.redStrategy, L.blueStrategy, nextElapsed, simDeltaSec, L.redAmplified);

      // Alliance Wing Bots Simulation (in 3v3 mode, simulates Pick 1 and Pick 2 cycle score events)
      if (L.simMode === '3v3') {
        L.simulateAllianceWingBots(simDeltaSec, nextElapsed);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // Deliberately only isRunning: the loop reads everything else through latestRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // Update a single robot's cycle, navigation, intake, and scoring
  const updateRobotStep = (
    alliance: 'blue' | 'red',
    team: Team,
    myStrat: AllianceStrategy,
    oppStrat: AllianceStrategy,
    sec: number,
    deltaSec: number,
    isAmplified: boolean
  ) => {
    const isBlue = alliance === 'blue';
    const profile = getTeamBehaviorProfile(team);
    const stats = team.frcStats ?? getEnhancedTeamStats(team);

    // Defense factor: if opponent is playing lockdown defense, cycle time increases by 25%
    const defensePenalty = oppStrat === 'lockdown_defense' ? 1.25 : 1.0;
    const stratSpeedBonus = myStrat === 'triple_offense' ? 1.1 : 1.0;

    const baseCycleSec = (stats.cycles.avgCycleTimeSec || profile.cycleDurationBase) * defensePenalty;
    const cyclePhaseProgress = (sec / Math.max(4.5, baseCycleSec / stratSpeedBonus)) % 1;

    const isAuto = sec <= 15;
    const isEndgame = sec > 130;

    const setRobot = isBlue ? setBlueRobot : setRedRobot;
    const speakerX = isBlue ? 10 : 90;
    const speakerY = 18;
    const ampX = isBlue ? 26 : 74;
    const ampY = 8;
    const sourceX = isBlue ? 8 : 92;
    const sourceY = 90;

    setRobot((curr) => {
      const next = { ...curr };

      if (isAuto) {
        // Auto Leave points (at T+3s)
        if (sec >= 3 && next.scoreBreakdown.autoLeave === 0) {
          next.scoreBreakdown.autoLeave = 2;
          triggerScore(
            alliance,
            2,
            'Auto Leave',
            isBlue ? 28 : 72,
            50,
            sec,
            'AUTO',
            'auto_leave',
            team.number
          );
        }

        // Auto Note Scoring cadence
        const autoCycleCadence = 3.2;
        const autoShotIndex = Math.floor(sec / autoCycleCadence);
        if (
          autoShotIndex > 0 &&
          autoShotIndex <= profile.autoNoteCount &&
          next.notesScored < autoShotIndex
        ) {
          next.notesScored += 1;
          const autoPoints = 5; // Official FRC Auto Note value
          next.scoreBreakdown.autoNotes += autoPoints;
          launchProjectile(curr.x, curr.y, speakerX, speakerY, alliance, autoPoints, 'Auto Speaker (5pts)');
        }

        // Auto Swerve pathing: alternate between a centerline note and the subwoofer. The robot
        // drives toward each waypoint (see driveToward) rather than being placed on it.
        const t = (sec % autoCycleCadence) / autoCycleCadence;
        const noteLane = (autoShotIndex % 3) - 1; // spread successive notes along the centerline
        let target: { x: number; y: number };
        if (t < 0.45) {
          target = { x: isBlue ? 44 : 56, y: 50 + noteLane * 18 };
          next.action = 'Centerline Sweep';
          next.intakeState = 'intaking';
        } else {
          target = { x: isBlue ? 18 : 82, y: 24 };
          next.action = 'Auto Align & Shoot';
          next.intakeState = 'shooting';
          next.limelightLocked = true;
        }

        next.shooterRpm = 5500;
        next.batteryVoltage = 12.1;
        return Object.assign(next, driveToward(curr, target.x, target.y, 4.8, deltaSec));
      }

      if (isEndgame) {
        // Endgame Climb Sequence: drive to the stage, then latch once there.
        Object.assign(next, driveToward(curr, isBlue ? 45 : 55, 50, 4.0, deltaSec));
        next.action = next.speedMps > 0 ? 'Driving to Stage' : 'Stage Latching';

        if (sec >= 142 && !next.climbed) {
          const success = Math.random() < stats.cycles.climbSuccessPct / 100;
          if (success) {
            next.climbed = true;
            const climbPts = stats.cycles.climbType === 'Trap & Deep' ? 12 : 10;
            next.scoreBreakdown.endgame = climbPts;
            triggerScore(
              alliance,
              climbPts,
              `${stats.cycles.climbType} (+${climbPts})`,
              next.x,
              next.y,
              sec,
              'ENDGAME',
              'climb',
              team.number
            );
            frcAudio.playClimbSuccess();
          }
        }
        return next;
      }

      // Teleoperated Cycling: pick a waypoint for the current part of the cycle and drive to it.
      const pickupSpot = { x: isBlue ? 26 : 74, y: 74 };
      const shootingSpot = { x: isBlue ? 22 : 78, y: 28 };
      const inPickupLeg = cyclePhaseProgress < 0.4;
      const waypoint = inPickupLeg ? pickupSpot : shootingSpot;
      Object.assign(next, driveToward(curr, waypoint.x, waypoint.y, inPickupLeg ? 5.2 : 4.5, deltaSec));

      if (inPickupLeg) {
        next.action = 'Source Transit';
        next.intakeState = 'intaking';
        next.limelightLocked = false;
      } else if (cyclePhaseProgress < 0.75) {
        next.action = 'Shooting Line Run';
        next.intakeState = 'indexing';
        next.limelightLocked = true;
      } else if (cyclePhaseProgress >= 0.95 && curr.action !== 'Scored') {
        // Fire Note
        const scoreInAmp = myStrat === 'amplification_rush' && Math.random() < 0.4;

        if (scoreInAmp) {
          next.notesAmped += 1;
          next.scoreBreakdown.teleopAmp += 1;
          launchProjectile(curr.x, curr.y, ampX, ampY, alliance, 1, 'Amp Note (1pt)');

          // Check if Amp Amplification is triggered
          if (isBlue) {
            setBlueAmpNotes((prev) => {
              if (prev + 1 >= 2) {
                setBlueAmplifiedRemaining(10);
                frcAudio.playWhistle();
                return 0;
              }
              return prev + 1;
            });
          } else {
            setRedAmpNotes((prev) => {
              if (prev + 1 >= 2) {
                setRedAmplifiedRemaining(10);
                frcAudio.playWhistle();
                return 0;
              }
              return prev + 1;
            });
          }
        } else {
          // Speaker Shot
          next.notesScored += 1;
          const pts = isAmplified ? 5 : 2;
          next.scoreBreakdown.teleopSpeaker += pts;
          launchProjectile(
            curr.x,
            curr.y,
            speakerX,
            speakerY,
            alliance,
            pts,
            isAmplified ? 'AMPLIFIED Speaker (5pts)' : 'Speaker (2pts)'
          );
        }

        next.action = 'Scored';
      }

      next.shooterRpm = 5800;
      next.batteryVoltage = Math.max(11.2, 12.5 - Math.random() * 0.8);
      return next;
    });
  };

  // Simulate Pick 1 & Pick 2 background cycles in 3v3 mode
  const simulateAllianceWingBots = (deltaSec: number, sec: number) => {
    if (sec <= 15) return; // Auto handled separately

    // Blue Wing bots
    if (Math.random() < deltaSec * 0.18) {
      const isBlueAmp = blueAmplifiedRemaining > 0;
      const pts = isBlueAmp ? 5 : 2;
      const wingBot = Math.random() < 0.5 ? bluePick1 : bluePick2;
      setBlueAllianceScore((prev) => ({
        ...prev,
        teleopSpeaker: prev.teleopSpeaker + pts,
        total: prev.total + pts,
      }));
      triggerScore(
        'blue',
        pts,
        isBlueAmp ? 'Amplified Speaker' : 'Speaker Cycle',
        18,
        35,
        sec,
        sec > 130 ? 'ENDGAME' : 'TELEOP',
        'score',
        wingBot.number
      );
    }

    // Red Wing bots
    if (Math.random() < deltaSec * 0.18) {
      const isRedAmp = redAmplifiedRemaining > 0;
      const pts = isRedAmp ? 5 : 2;
      const wingBot = Math.random() < 0.5 ? redPick1 : redPick2;
      setRedAllianceScore((prev) => ({
        ...prev,
        teleopSpeaker: prev.teleopSpeaker + pts,
        total: prev.total + pts,
      }));
      triggerScore(
        'red',
        pts,
        isRedAmp ? 'Amplified Speaker' : 'Speaker Cycle',
        82,
        35,
        sec,
        sec > 130 ? 'ENDGAME' : 'TELEOP',
        'score',
        wingBot.number
      );
    }
  };

  // Total Scores
  const blueTotal =
    blueRobot.scoreBreakdown.autoLeave +
    blueRobot.scoreBreakdown.autoNotes +
    blueRobot.scoreBreakdown.teleopSpeaker +
    blueRobot.scoreBreakdown.teleopAmp +
    blueRobot.scoreBreakdown.endgame +
    (simMode === '3v3' ? blueAllianceScore.teleopSpeaker : 0);

  const redTotal =
    redRobot.scoreBreakdown.autoLeave +
    redRobot.scoreBreakdown.autoNotes +
    redRobot.scoreBreakdown.teleopSpeaker +
    redRobot.scoreBreakdown.teleopAmp +
    redRobot.scoreBreakdown.endgame +
    (simMode === '3v3' ? redAllianceScore.teleopSpeaker : 0);

  const winner =
    phase === 'completed'
      ? blueTotal > redTotal
        ? 'blue'
        : redTotal > blueTotal
        ? 'red'
        : 'tie'
      : null;

  // Auto-scroll play-by-play ticker
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  return (
    <div className="w-full flex flex-col space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-border-main gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 text-accent rounded-xl border border-integra-yellow/40">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black font-montserrat uppercase tracking-tight text-text-main">
                FRC Match Simulation Arena
              </h2>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-zinc-800 text-integra-yellow border border-border-main">
                2024/2025 Rules Engine
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Kinematics, AprilTag vision targeting, auto routines, and alliance synergy simulation.
            </p>
          </div>
        </div>

        {/* Controls: Mode Switcher & Exit */}
        <div className="flex items-center gap-2.5">
          {/* Mode Selector */}
          <div className="inline-flex rounded-lg bg-surface p-0.5 border border-border-main text-xs font-bold uppercase">
            <button
              type="button"
              onClick={() => {
                setSimMode('3v3');
                resetMatch();
              }}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                simMode === '3v3'
                  ? 'bg-integra-yellow text-[#111111] font-black'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>3v3 Alliance Playoff</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSimMode('1v1');
                resetMatch();
              }}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                simMode === '1v1'
                  ? 'bg-integra-yellow text-[#111111] font-black'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>1v1 Robot Duel</span>
            </button>
          </div>

          <button
            onClick={onClose}
            aria-keyshortcuts="Escape"
            className="px-3.5 py-1.5 rounded-lg bg-surface hover:bg-surface-hover text-text-muted hover:text-text-main border border-border-main text-xs font-bold uppercase flex items-center gap-1.5 transition-colors"
            title="Exit Simulator (Esc)"
          >
            <span>Dashboard</span>
            <kbd className="text-xs font-mono px-1 py-0.2 rounded bg-bg-dark border border-border-main text-text-muted">
              Esc
            </kbd>
          </button>
        </div>
      </div>

      {/* Alliance Roster & Playbook Setup (when idle or paused) */}
      {phase === 'idle' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 sm:p-5 bg-surface border border-border-main rounded-2xl shadow-xl">
          {/* Blue Alliance Roster */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-blue-500/30">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="font-montserrat font-black text-blue-400 text-sm uppercase">
                  Blue Alliance ({simMode === '3v3' ? '3 Teams' : '1 Team'})
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-blue-300">
                EPA: {predictions.blueTotalEPA} pts
              </span>
            </div>

            {/* Blue Captain */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase text-text-muted">Alliance Captain (Primary Robot)</span>
              <TeamSelectDropdown
                selected={blueCaptain}
                onSelect={(t) => setBlueCaptain(t)}
                alliance="blue"
              />
            </div>

            {/* Blue Picks (if 3v3) */}
            {simMode === '3v3' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase text-text-muted">1st Pick (Shooter/Cycle)</span>
                  <TeamSelectDropdown
                    selected={bluePick1}
                    onSelect={(t) => setBluePick1(t)}
                    alliance="blue"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase text-text-muted">2nd Pick (Defense/Support)</span>
                  <TeamSelectDropdown
                    selected={bluePick2}
                    onSelect={(t) => setBluePick2(t)}
                    alliance="blue"
                  />
                </div>
              </div>
            )}

            {/* Blue Alliance Strategy */}
            <div className="pt-2 border-t border-border-main/60">
              <span className="text-xs font-bold uppercase text-text-muted block mb-1.5">
                Alliance Strategy Playbook
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'triple_offense' as AllianceStrategy, label: 'Triple Offense', desc: '+15% Cycle Cadence' },
                  { id: 'lockdown_defense' as AllianceStrategy, label: 'Lockdown Defense', desc: 'Slows Enemy by 30%' },
                  { id: 'amplification_rush' as AllianceStrategy, label: 'Amp Rush', desc: 'Prioritizes 5pt Speaker' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setBlueStrategy(s.id)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      blueStrategy === s.id
                        ? 'bg-blue-950/70 border-blue-400 text-blue-200 ring-1 ring-blue-400'
                        : 'bg-bg-dark border-border-main text-text-muted hover:text-text-main'
                    }`}
                  >
                    <span className="font-bold text-sm block">{s.label}</span>
                    <span className="text-xs text-text-muted block">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Red Alliance Roster */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-red-500/30">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="font-montserrat font-black text-red-400 text-sm uppercase">
                  Red Alliance ({simMode === '3v3' ? '3 Teams' : '1 Team'})
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-red-300">
                EPA: {predictions.redTotalEPA} pts
              </span>
            </div>

            {/* Red Captain */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase text-text-muted">Alliance Captain (Primary Robot)</span>
              <TeamSelectDropdown
                selected={redCaptain}
                onSelect={(t) => setRedCaptain(t)}
                alliance="red"
              />
            </div>

            {/* Red Picks (if 3v3) */}
            {simMode === '3v3' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase text-text-muted">1st Pick (Shooter/Cycle)</span>
                  <TeamSelectDropdown
                    selected={redPick1}
                    onSelect={(t) => setRedPick1(t)}
                    alliance="red"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase text-text-muted">2nd Pick (Defense/Support)</span>
                  <TeamSelectDropdown
                    selected={redPick2}
                    onSelect={(t) => setRedPick2(t)}
                    alliance="red"
                  />
                </div>
              </div>
            )}

            {/* Red Alliance Strategy */}
            <div className="pt-2 border-t border-border-main/60">
              <span className="text-xs font-bold uppercase text-text-muted block mb-1.5">
                Alliance Strategy Playbook
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'triple_offense' as AllianceStrategy, label: 'Triple Offense', desc: '+15% Cycle Cadence' },
                  { id: 'lockdown_defense' as AllianceStrategy, label: 'Lockdown Defense', desc: 'Slows Enemy by 30%' },
                  { id: 'amplification_rush' as AllianceStrategy, label: 'Amp Rush', desc: 'Prioritizes 5pt Speaker' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setRedStrategy(s.id)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      redStrategy === s.id
                        ? 'bg-red-950/70 border-red-400 text-red-200 ring-1 ring-red-400'
                        : 'bg-bg-dark border-border-main text-text-muted hover:text-text-main'
                    }`}
                  >
                    <span className="font-bold text-sm block">{s.label}</span>
                    <span className="text-xs text-text-muted block">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statbotics Win Probability Prediction Bar */}
      <div className="p-4 bg-bg-dark rounded-xl border border-border-main shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs mb-2 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-400 font-mono">
              Blue Win: {predictions.blueWinProb}%
            </span>
            <span className="text-text-muted text-sm">
              (Expected: ~{predictions.expectedBlueScore} pts)
            </span>
          </div>
          <span className="text-xs uppercase font-bold text-text-muted tracking-wider">
            Statbotics Pre-Match Probability Model
          </span>
          <div className="flex items-center gap-2">
            <span className="text-text-muted text-sm">
              (Expected: ~{predictions.expectedRedScore} pts)
            </span>
            <span className="font-bold text-red-400 font-mono">
              Red Win: {predictions.redWinProb}%
            </span>
          </div>
        </div>

        <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${predictions.blueWinProb}%` }}
          />
          <div
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${predictions.redWinProb}%` }}
          />
        </div>
      </div>

      {/* Official FRC Live Broadcast Scoreboard */}
      <div className="bg-[#0b0f17] border-2 border-border-main rounded-2xl p-4 sm:p-5 shadow-2xl overflow-hidden">
        <div className="grid grid-cols-3 items-center">
          {/* Blue Alliance Score */}
          <div className="flex flex-col items-start border-l-4 border-blue-500 pl-3 sm:pl-4">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-blue-400 uppercase font-montserrat">
                Blue Alliance
              </span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                #{blueCaptain.number} {simMode === '3v3' ? `+ #${bluePick1.number} + #${bluePick2.number}` : ''}
              </span>
            </div>
            <div className="text-3xl sm:text-5xl font-black font-montserrat text-blue-500 tracking-tight leading-none mt-1">
              {blueTotal}
            </div>

            {/* Amplification Banner */}
            {blueAmplifiedRemaining > 0 && (
              <div className="mt-2 px-2 py-0.5 rounded bg-amber-500/30 border border-amber-400 text-amber-300 text-xs font-bold uppercase animate-pulse flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>Amplified (5pts) • {blueAmplifiedRemaining.toFixed(1)}s</span>
              </div>
            )}
          </div>

          {/* Center Clock & Period */}
          <div className="flex flex-col items-center justify-center text-center">
            <div
              className={`px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase mb-1.5 shadow-sm ${
                phase === 'auto'
                  ? 'bg-integra-yellow text-[#111111]'
                  : phase === 'teleop'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : phase === 'endgame'
                  ? 'bg-red-500 text-white animate-pulse'
                  : phase === 'completed'
                  ? 'bg-zinc-800 text-white'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {phase === 'idle'
                ? 'MATCH STANDBY'
                : phase === 'auto'
                ? 'AUTONOMOUS (15s)'
                : phase === 'teleop'
                ? 'TELEOPERATED'
                : phase === 'endgame'
                ? 'ENDGAME CLIMB!'
                : 'MATCH COMPLETED'}
            </div>
            <div className="text-2xl sm:text-4xl font-mono font-black text-white tracking-wider flex items-center gap-1.5">
              <Clock className="w-5 h-5 text-zinc-400 hidden sm:inline" />
              {formatTime(elapsedSeconds)}
            </div>
            <div className="text-xs text-zinc-400 font-mono uppercase tracking-wider mt-0.5">
              Official 2:30 FRC Clock
            </div>
          </div>

          {/* Red Alliance Score */}
          <div className="flex flex-col items-end border-r-4 border-red-500 pr-3 sm:pr-4 text-right">
            <div className="flex items-center gap-2 flex-row-reverse">
              <span className="text-xs sm:text-sm font-black text-red-400 uppercase font-montserrat">
                Red Alliance
              </span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-mono">
                #{redCaptain.number} {simMode === '3v3' ? `+ #${redPick1.number} + #${redPick2.number}` : ''}
              </span>
            </div>
            <div className="text-3xl sm:text-5xl font-black font-montserrat text-red-500 tracking-tight leading-none mt-1">
              {redTotal}
            </div>

            {/* Amplification Banner */}
            {redAmplifiedRemaining > 0 && (
              <div className="mt-2 px-2 py-0.5 rounded bg-amber-500/30 border border-amber-400 text-amber-300 text-xs font-bold uppercase animate-pulse flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>Amplified (5pts) • {redAmplifiedRemaining.toFixed(1)}s</span>
              </div>
            )}
          </div>
        </div>

        {/* Scrubbable Match Progress Bar */}
        <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-400">0:00</span>
          <div className="flex-1 relative h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[10%] bg-amber-500/30 border-r border-amber-400/50" />
            <div className="absolute right-0 top-0 bottom-0 w-[13.3%] bg-red-500/30 border-l border-red-400/50" />
            <div
              className="h-full bg-integra-yellow transition-all duration-75"
              style={{ width: `${(elapsedSeconds / TOTAL_MATCH_SECONDS) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono text-zinc-400">2:30</span>
        </div>
      </div>

      {/* Match Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-3.5 bg-surface border border-border-main rounded-xl gap-3">
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              onClick={() => {
                if (phase === 'completed') resetMatch();
                setIsRunning(true);
              }}
              className="px-4 py-2 bg-integra-yellow text-[#111111] hover:bg-yellow-400 rounded-lg font-black text-xs uppercase flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{phase === 'idle' ? 'Start Match' : 'Resume'}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsRunning(false)}
              className="px-4 py-2 bg-zinc-800 text-white hover:bg-zinc-700 rounded-lg font-bold text-xs uppercase flex items-center gap-1.5 transition-colors"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={resetMatch}
            className="p-2 rounded-lg bg-surface-hover text-text-muted hover:text-text-main border border-border-main transition-colors"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 rounded-lg border transition-colors ${
              audioEnabled
                ? 'bg-surface text-accent border-border-main'
                : 'bg-surface text-text-muted border-border-main'
            }`}
            title={audioEnabled ? 'Mute FRC Audio' : 'Unmute FRC Audio'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Speed Multiplier Options */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold uppercase text-text-muted mr-1">Speed:</span>
          {([1, 2.5, 5] as SimSpeedMode[]).map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => setSpeedMode(spd)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors ${
                speedMode === spd
                  ? 'bg-integra-yellow text-[#111111]'
                  : 'bg-bg-dark text-text-muted hover:text-text-main border border-border-main'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* 2D ARENA & REAL-TIME EVENT LOG */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-text-muted">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-accent" />
              FRC Competition Field (Swerve & Vision Kinematics)
            </span>
            <span className="font-mono text-xs">16.54m × 8.21m Regulation</span>
          </div>

          {/* Arena Component */}
          <FRCArenaField
            teamA={blueCaptain}
            teamB={redCaptain}
            blueRobot={blueRobot}
            redRobot={redRobot}
            phase={phase}
            floatingScores={floatingScores}
            flyingProjectiles={flyingProjectiles}
            fieldNotes={fieldNotes}
            cameraMode={cameraMode}
          />
        </div>

        {/* Play-by-Play Event Feed */}
        <div className="xl:col-span-1 bg-[#0c1017] border border-border-main rounded-xl p-4 flex flex-col h-[460px] shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-integra-yellow" />
              Official Match Feed
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
              {events.length} Events
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
            {events.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-center p-4">
                <Play className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-xs font-medium">Click "Start Match" to launch the simulation.</p>
              </div>
            ) : (
              events.map((ev) => (
                <div
                  key={ev.id}
                  className={`p-2 rounded-lg border text-sm leading-snug flex items-start gap-2 ${
                    ev.alliance === 'blue'
                      ? 'bg-blue-950/40 border-blue-500/30 text-blue-200'
                      : 'bg-red-950/40 border-red-500/30 text-red-200'
                  }`}
                >
                  <span className="font-mono text-xs px-1 py-0.5 rounded bg-black/60 text-zinc-400 shrink-0">
                    {ev.timeStr}
                  </span>
                  <span className="flex-1 font-medium">{ev.description}</span>
                </div>
              ))
            )}
            <div ref={feedEndRef} />
          </div>
        </div>
      </div>

      {/* FINAL MATCH BOX SCORE & RESULTS */}
      <AnimatePresence>
        {phase === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-6 bg-surface border-2 border-integra-yellow/50 rounded-2xl shadow-2xl space-y-5"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border-main pb-4 gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Official Match Report
                </span>
                <h3 className="text-2xl font-black font-montserrat uppercase text-text-main mt-0.5">
                  {winner === 'blue'
                    ? `Blue Alliance Victory (${blueTotal} - ${redTotal})`
                    : winner === 'red'
                    ? `Red Alliance Victory (${redTotal} - ${blueTotal})`
                    : `Match Tie (${blueTotal} - ${redTotal})`}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={resetMatch}
                  className="px-4 py-2 bg-integra-yellow text-[#111111] font-black text-xs uppercase tracking-wider rounded-lg hover:bg-yellow-400 transition-colors"
                >
                  Simulate Again
                </button>
              </div>
            </div>

            {/* Score Breakdown Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Blue Alliance Breakdown */}
              <div className="p-4 bg-bg-dark rounded-xl border border-blue-500/40 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-blue-500/20">
                  <span className="font-montserrat font-black text-blue-400 text-sm uppercase">
                    Blue Alliance Scorecard
                  </span>
                  <span className="text-2xl font-mono font-black text-blue-400">{blueTotal} pts</span>
                </div>
                <div className="space-y-1.5 text-xs text-text-muted">
                  <div className="flex justify-between">
                    <span>Autonomous Points:</span>
                    <span className="font-mono font-bold text-text-main">
                      {blueRobot.scoreBreakdown.autoLeave + blueRobot.scoreBreakdown.autoNotes} pts
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Teleoperated Speaker & Amp:</span>
                    <span className="font-mono font-bold text-text-main">
                      {blueRobot.scoreBreakdown.teleopSpeaker +
                        blueRobot.scoreBreakdown.teleopAmp +
                        (simMode === '3v3' ? blueAllianceScore.teleopSpeaker : 0)}{' '}
                      pts
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Endgame Stage Climbs:</span>
                    <span className="font-mono font-bold text-text-main">
                      {blueRobot.scoreBreakdown.endgame} pts
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border-main text-text-main font-bold">
                    <span>Ranking Points (RP):</span>
                    <span className="font-mono text-accent">
                      {winner === 'blue' ? '2' : winner === 'tie' ? '1' : '0'} Win RP +{' '}
                      {blueTotal >= 50 ? '1 Melody RP' : '0 RP'} +{' '}
                      {blueRobot.climbed ? '1 Ensemble RP' : '0 RP'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Red Alliance Breakdown */}
              <div className="p-4 bg-bg-dark rounded-xl border border-red-500/40 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-red-500/20">
                  <span className="font-montserrat font-black text-red-400 text-sm uppercase">
                    Red Alliance Scorecard
                  </span>
                  <span className="text-2xl font-mono font-black text-red-400">{redTotal} pts</span>
                </div>
                <div className="space-y-1.5 text-xs text-text-muted">
                  <div className="flex justify-between">
                    <span>Autonomous Points:</span>
                    <span className="font-mono font-bold text-text-main">
                      {redRobot.scoreBreakdown.autoLeave + redRobot.scoreBreakdown.autoNotes} pts
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Teleoperated Speaker & Amp:</span>
                    <span className="font-mono font-bold text-text-main">
                      {redRobot.scoreBreakdown.teleopSpeaker +
                        redRobot.scoreBreakdown.teleopAmp +
                        (simMode === '3v3' ? redAllianceScore.teleopSpeaker : 0)}{' '}
                      pts
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Endgame Stage Climbs:</span>
                    <span className="font-mono font-bold text-text-main">
                      {redRobot.scoreBreakdown.endgame} pts
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border-main text-text-main font-bold">
                    <span>Ranking Points (RP):</span>
                    <span className="font-mono text-accent">
                      {winner === 'red' ? '2' : winner === 'tie' ? '1' : '0'} Win RP +{' '}
                      {redTotal >= 50 ? '1 Melody RP' : '0 RP'} +{' '}
                      {redRobot.climbed ? '1 Ensemble RP' : '0 RP'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple Dropdown to select any team from the 83 mockTeams
function TeamSelectDropdown({
  selected,
  onSelect,
  alliance,
}: {
  selected: Team;
  onSelect: (t: Team) => void;
  alliance: 'blue' | 'red';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return mockTeams.slice(0, 15);
    const q = search.toLowerCase();
    return mockTeams
      .filter((t) => t.number.toString().includes(q) || t.name.toLowerCase().includes(q))
      .slice(0, 15);
  }, [search]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2 rounded-lg bg-bg-dark border text-xs text-left transition-colors ${
          alliance === 'blue'
            ? 'border-blue-500/40 hover:border-blue-400'
            : 'border-red-500/40 hover:border-red-400'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <span
            className={`font-black font-mono px-1.5 py-0.2 rounded text-sm ${
              alliance === 'blue' ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'
            }`}
          >
            #{selected.number}
          </span>
          <span className="font-semibold text-text-main truncate">{selected.name}</span>
        </div>
        <span className="text-xs font-mono text-text-muted">{selected.score} pts</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border-main rounded-lg shadow-2xl p-2 z-50 space-y-1.5">
          <input
            type="text"
            placeholder="Search # or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg-dark border border-border-main rounded px-2 py-1 text-xs text-text-main outline-none focus:border-integra-yellow"
            autoFocus
          />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filtered.map((t) => (
              <button
                key={t.number}
                type="button"
                onClick={() => {
                  onSelect(t);
                  setIsOpen(false);
                  setSearch('');
                }}
                className="w-full flex items-center justify-between p-1.5 rounded hover:bg-surface-hover text-xs text-left transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono font-bold text-accent">#{t.number}</span>
                  <span className="text-text-main truncate">{t.name}</span>
                </div>
                <span className="text-xs text-text-muted font-mono">{t.score} pts</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function createInitialFieldNotes(): FieldNote[] {
  const notes: FieldNote[] = [];
  const centerYs = [18, 34, 50, 66, 82];
  centerYs.forEach((y, idx) => {
    notes.push({
      id: `center-${idx}`,
      x: 50,
      y,
      active: true,
      type: 'centerline',
    });
  });

  const blueYs = [30, 50, 70];
  blueYs.forEach((y, idx) => {
    notes.push({
      id: `blue-wing-${idx}`,
      x: 22,
      y,
      active: true,
      type: 'wing_blue',
    });
  });

  const redYs = [30, 50, 70];
  redYs.forEach((y, idx) => {
    notes.push({
      id: `red-wing-${idx}`,
      x: 78,
      y,
      active: true,
      type: 'wing_red',
    });
  });

  return notes;
}

function createInitialRobotState(
  team: Team,
  alliance: 'blue' | 'red',
  role: 'captain' | 'pick1' | 'pick2'
): RobotSimState {
  const isBlue = alliance === 'blue';
  return {
    teamNumber: team.number,
    teamName: team.name,
    alliance,
    role,
    x: isBlue ? 12 : 88,
    y: 50,
    realX: isBlue ? 2.0 : 14.54,
    realY: 4.1,
    vx: 0,
    vy: 0,
    speedMps: 0,
    heading: isBlue ? 0 : 180,
    swervePodAngles: [0, 0, 0, 0],
    action: 'Autonomous Ready',
    hasPiece: true,
    intakeState: 'idle',
    shooterRpm: 0,
    batteryVoltage: 12.6,
    limelightLocked: false,
    notesScored: 0,
    notesAmped: 0,
    currentCycleTimeS: 0,
    avgCycleTimeS: 0,
    scoreBreakdown: {
      autoLeave: 0,
      autoNotes: 0,
      teleopSpeaker: 0,
      teleopAmp: 0,
      endgame: 0,
      total: 0,
    },
    climbed: false,
    climbType: 'none',
  };
}
