import React from 'react';
import { Team } from '../data';
import {
  RobotSimState,
  FloatingScore,
  FlyingProjectile,
  FieldNote,
  MatchPhase,
} from './simulationTypes';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Zap, Shield, Compass } from 'lucide-react';

interface FRCArenaFieldProps {
  teamA: Team;
  teamB: Team;
  blueRobot: RobotSimState;
  redRobot: RobotSimState;
  phase: MatchPhase;
  floatingScores: FloatingScore[];
  flyingProjectiles: FlyingProjectile[];
  fieldNotes: FieldNote[];
  cameraMode: 'full' | 'blue' | 'red';
}

export function FRCArenaField({
  teamA,
  teamB,
  blueRobot,
  redRobot,
  phase,
  floatingScores,
  flyingProjectiles,
  fieldNotes,
  cameraMode,
}: FRCArenaFieldProps) {
  return (
    <div className="relative w-full aspect-[2.15/1] min-h-[300px] sm:min-h-[380px] md:min-h-[440px] bg-[#0d1117] rounded-2xl border-2 border-border-main overflow-hidden select-none shadow-2xl transition-all duration-300">
      {/* Real FRC Carpet Grid & Regulation Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:40px_40px] opacity-25"></div>

      {/* Alliance Driver Stations Wall */}
      {/* Blue Station (Left) */}
      <div className="absolute left-0 top-0 bottom-0 w-3 bg-blue-600/70 border-r-2 border-blue-400 flex flex-col justify-around py-4 z-10 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
        {[1, 2, 3].map((ds) => (
          <div key={ds} className="w-1.5 h-6 bg-blue-300/80 rounded-r-xs mx-auto" title={`Blue DS ${ds}`}></div>
        ))}
      </div>
      {/* Red Station (Right) */}
      <div className="absolute right-0 top-0 bottom-0 w-3 bg-red-600/70 border-l-2 border-red-400 flex flex-col justify-around py-4 z-10 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
        {[1, 2, 3].map((ds) => (
          <div key={ds} className="w-1.5 h-6 bg-red-300/80 rounded-l-xs mx-auto" title={`Red DS ${ds}`}></div>
        ))}
      </div>

      {/* Blue Alliance Starting Line & Auto Boundary (White & Blue Gaffer Tape) */}
      <div className="absolute left-[24%] top-0 bottom-0 w-[2px] bg-blue-500/30 border-r border-dashed border-blue-400/70 pointer-events-none">
        <span className="absolute top-2 left-1.5 text-[8px] font-mono font-bold text-blue-400/70 uppercase rotate-90 origin-left">
          BLUE AUTO LINE (5.8m)
        </span>
      </div>

      {/* Red Alliance Starting Line & Auto Boundary */}
      <div className="absolute right-[24%] top-0 bottom-0 w-[2px] bg-red-500/30 border-l border-dashed border-red-400/70 pointer-events-none">
        <span className="absolute top-2 right-1.5 text-[8px] font-mono font-bold text-red-400/70 uppercase -rotate-90 origin-right">
          RED AUTO LINE (5.8m)
        </span>
      </div>

      {/* Field Centerline Tape */}
      <div className="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-white/30 border-r border-dashed border-white/60 pointer-events-none">
        <div className="absolute top-1 left-1/2 -translate-x-1/2 px-1 py-0.5 bg-black/60 rounded text-[7px] font-mono text-zinc-400 uppercase">
          Centerline (8.27m)
        </div>
      </div>

      {/* BLUE SPEAKER / HIGH GOAL (Top Left) */}
      <div className="absolute left-4 top-3 w-24 sm:w-32 h-14 sm:h-16 bg-blue-950/80 border-2 border-blue-500/60 rounded-br-2xl p-2 flex flex-col justify-between shadow-[0_0_20px_rgba(37,99,235,0.25)] z-10 backdrop-blur-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-blue-300 font-montserrat">
              Blue Speaker
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
          </div>
          {/* AprilTag #7 */}
          <div className="w-3.5 h-3.5 bg-black border border-white flex items-center justify-center text-[6px] font-bold text-white" title="AprilTag #7">
            7
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] sm:text-xs font-mono font-black text-blue-300">
            {blueRobot.scoreBreakdown.autoNotes + blueRobot.scoreBreakdown.teleopSpeaker} pts
          </span>
          <span className="text-[8px] font-bold text-blue-400/80 uppercase">Subwoofer</span>
        </div>
      </div>

      {/* BLUE AMP STATION (Top Wall at 27%) */}
      <div className="absolute left-[26%] top-1 w-16 sm:w-20 h-7 bg-blue-950/70 border border-blue-500/40 rounded-b-md p-1 flex items-center justify-between z-10">
        <span className="text-[8px] font-bold text-blue-400 uppercase">Amp</span>
        <span className="text-[9px] font-mono font-bold text-blue-300">{blueRobot.notesAmped}</span>
      </div>

      {/* BLUE SOURCE / HUMAN PLAYER INTAKE (Bottom Left) */}
      <div className="absolute left-4 bottom-3 w-24 sm:w-28 h-10 bg-blue-950/60 border border-blue-500/40 rounded-tr-xl p-1.5 flex items-center justify-between z-10">
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase text-blue-400">Source Intake</span>
          <span className="text-[7px] text-blue-300/70 font-mono">Chute Ready</span>
        </div>
        <div className="w-2.5 h-2.5 rounded-full border border-blue-400/80 bg-blue-500/40 animate-pulse"></div>
      </div>

      {/* RED SPEAKER / HIGH GOAL (Top Right) */}
      <div className="absolute right-4 top-3 w-24 sm:w-32 h-14 sm:h-16 bg-red-950/80 border-2 border-red-500/60 rounded-bl-2xl p-2 flex flex-col justify-between shadow-[0_0_20px_rgba(239,68,68,0.25)] z-10 backdrop-blur-xs text-right">
        <div className="flex items-center justify-between flex-row-reverse">
          <div className="flex items-center gap-1 flex-row-reverse">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-red-300 font-montserrat">
              Red Speaker
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
          </div>
          {/* AprilTag #4 */}
          <div className="w-3.5 h-3.5 bg-black border border-white flex items-center justify-center text-[6px] font-bold text-white" title="AprilTag #4">
            4
          </div>
        </div>
        <div className="flex items-baseline justify-between flex-row-reverse">
          <span className="text-[11px] sm:text-xs font-mono font-black text-red-300">
            {redRobot.scoreBreakdown.autoNotes + redRobot.scoreBreakdown.teleopSpeaker} pts
          </span>
          <span className="text-[8px] font-bold text-red-400/80 uppercase">Subwoofer</span>
        </div>
      </div>

      {/* RED AMP STATION (Top Wall at 73%) */}
      <div className="absolute right-[26%] top-1 w-16 sm:w-20 h-7 bg-red-950/70 border border-red-500/40 rounded-b-md p-1 flex items-center justify-between z-10">
        <span className="text-[8px] font-bold text-red-400 uppercase">Amp</span>
        <span className="text-[9px] font-mono font-bold text-red-300">{redRobot.notesAmped}</span>
      </div>

      {/* RED SOURCE / HUMAN PLAYER INTAKE (Bottom Right) */}
      <div className="absolute right-4 bottom-3 w-24 sm:w-28 h-10 bg-red-950/60 border border-red-500/40 rounded-tl-xl p-1.5 flex items-center justify-between z-10">
        <div className="flex flex-col text-left">
          <span className="text-[8px] font-black uppercase text-red-400">Source Intake</span>
          <span className="text-[7px] text-red-300/70 font-mono">Chute Ready</span>
        </div>
        <div className="w-2.5 h-2.5 rounded-full border border-red-400/80 bg-red-500/40 animate-pulse"></div>
      </div>

      {/* CENTER STAGE & ENDGAME CLIMB RIGGING (Truss Structure) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 sm:w-40 h-32 sm:h-40 rounded-2xl border-2 border-zinc-600/80 bg-zinc-950/85 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-none z-10 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
        {/* Core Truss Pyramid / Trap */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 border-2 border-integra-yellow/80 rotate-45 flex items-center justify-center bg-zinc-900 shadow-[0_0_20px_rgba(254,222,0,0.2)]">
          <div className="w-3 h-3 bg-integra-yellow rounded-full animate-ping opacity-75"></div>
          {/* 3 Stage Chains Lines */}
          <div className="absolute inset-x-0 top-1/2 h-0.5 bg-zinc-400/80"></div>
          <div className="absolute inset-y-0 left-1/2 w-0.5 bg-zinc-400/80"></div>
        </div>

        <span className="mt-2 text-[9px] sm:text-[10px] font-black uppercase font-montserrat tracking-widest text-zinc-300">
          Center Stage
        </span>

        {/* Live Climb Badges */}
        <div className="flex gap-2 mt-1">
          <span
            className={`text-[8px] font-black px-2 py-0.5 rounded transition-all ${
              blueRobot.climbed
                ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.8)] animate-pulse'
                : 'bg-zinc-900 border border-zinc-700 text-zinc-500'
            }`}
          >
            {blueRobot.climbed ? 'BLUE CLIMBED (+12)' : 'BLUE READY'}
          </span>
          <span
            className={`text-[8px] font-black px-2 py-0.5 rounded transition-all ${
              redRobot.climbed
                ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse'
                : 'bg-zinc-900 border border-zinc-700 text-zinc-500'
            }`}
          >
            {redRobot.climbed ? 'RED CLIMBED (+12)' : 'RED READY'}
          </span>
        </div>
      </div>

      {/* ACTIVE FIELD NOTES (Game Pieces on Floor) */}
      {fieldNotes.map((note) => {
        if (!note.active) return null;
        return (
          <div
            key={note.id}
            className="absolute z-10 pointer-events-none -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${note.x}%`, top: `${note.y}%` }}
          >
            {/* Note Ring (FRC Torus) */}
            <div className="relative w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-3 border-amber-500 bg-amber-400/70 shadow-[0_0_8px_rgba(245,158,11,0.8)] flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-[#0d1117] rounded-full"></div>
            </div>
          </div>
        );
      })}

      {/* FLYING NOTE PROJECTILES IN AIR (3D Parabolic Arc Trajectory) */}
      {flyingProjectiles.map((proj) => {
        const scale = 1 + proj.arcZ * 0.7; // note appears larger at peak altitude
        const shadowOffset = proj.arcZ * 18; // shadow drops to floor
        return (
          <React.Fragment key={proj.id}>
            {/* Floor Shadow */}
            <div
              className="absolute z-15 pointer-events-none rounded-full bg-black/50 blur-[2px] -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${proj.currentX}%`,
                top: `${proj.currentY + shadowOffset}%`,
                width: '12px',
                height: '7px',
              }}
            />
            {/* Flying Ring */}
            <div
              className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${proj.currentX}%`,
                top: `${proj.currentY}%`,
                transform: `scale(${scale}) rotate(${proj.progress * 360}deg)`,
              }}
            >
              <div
                className={`w-4 h-4 rounded-full border-3 border-amber-400 bg-orange-500 shadow-[0_0_15px_#f59e0b] flex items-center justify-center ${
                  proj.alliance === 'blue' ? 'shadow-blue-400' : 'shadow-red-400'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-200"></div>
              </div>
            </div>
          </React.Fragment>
        );
      })}

      {/* LIMELIGHT VISION TARGETING CONE (Blue) */}
      {blueRobot.limelightLocked && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-15">
          <defs>
            <linearGradient id="blueVisionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(34, 197, 94, 0.4)" />
              <stop offset="100%" stopColor="rgba(34, 197, 94, 0.0)" />
            </linearGradient>
          </defs>
          <line
            x1={`${blueRobot.x}%`}
            y1={`${blueRobot.y}%`}
            x2="10%"
            y2="18%"
            stroke="#22c55e"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            className="animate-pulse"
          />
        </svg>
      )}

      {/* LIMELIGHT VISION TARGETING CONE (Red) */}
      {redRobot.limelightLocked && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-15">
          <line
            x1={`${redRobot.x}%`}
            y1={`${redRobot.y}%`}
            x2="90%"
            y2="18%"
            stroke="#22c55e"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            className="animate-pulse"
          />
        </svg>
      )}

      {/* BLUE ROBOT (Chassis with Swerve Pods, Bumpers, Mechanism) */}
      <div
        className="absolute z-20 pointer-events-none transition-transform duration-75"
        style={{
          left: `${blueRobot.x}%`,
          top: `${blueRobot.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className="relative w-12 h-12 sm:w-14 sm:h-14"
          style={{ transform: `rotate(${blueRobot.heading}deg)` }}
        >
          {/* Swerve Drive Wheel Pods (4 corners with wheel angle orientation) */}
          {blueRobot.swervePodAngles.map((angle, idx) => {
            const positions = [
              'top-0 left-0 -translate-x-1 -translate-y-1',
              'top-0 right-0 translate-x-1 -translate-y-1',
              'bottom-0 left-0 -translate-x-1 translate-y-1',
              'bottom-0 right-0 translate-x-1 translate-y-1',
            ];
            return (
              <div
                key={idx}
                className={`absolute ${positions[idx]} w-2.5 h-3.5 bg-zinc-950 border border-zinc-400 rounded-xs shadow-xs`}
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <div className="w-1 h-full bg-zinc-600 mx-auto"></div>
              </div>
            );
          })}

          {/* Intake Mechanism Bar (Front) */}
          <div
            className={`absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full border transition-all duration-150 flex items-center justify-center ${
              blueRobot.intakeState === 'intaking'
                ? 'bg-amber-400 border-amber-200 shadow-[0_0_8px_#f59e0b]'
                : 'bg-zinc-800 border-blue-400'
            }`}
          >
            {blueRobot.intakeState === 'intaking' && (
              <div className="w-full h-0.5 bg-amber-600 animate-ping"></div>
            )}
          </div>

          {/* Bumper Perimeter (Blue Alliance #3646) */}
          <div className="w-full h-full bg-zinc-900 rounded-md border-4 border-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.5)] flex flex-col items-center justify-center relative overflow-hidden">
            {/* Real Team Number On Bumper */}
            <span className="font-montserrat font-black text-[10px] sm:text-[11px] text-white tracking-tighter leading-none select-none">
              #{teamA.number}
            </span>

            {/* Held Note in Hopper / Indexer */}
            {blueRobot.hasPiece && (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 bg-orange-500 animate-pulse mt-0.5 shadow-[0_0_8px_#f59e0b]"></div>
            )}

            {/* Shooter Flywheel LED status */}
            <div
              className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${
                blueRobot.shooterRpm > 3000 ? 'bg-green-400 animate-ping' : 'bg-zinc-600'
              }`}
            />
          </div>
        </div>

        {/* Dynamic Action & Speed Tag above robot */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-blue-950/90 border border-blue-500/50 text-[8px] font-bold text-blue-200 tracking-wide pointer-events-none shadow-md flex items-center gap-1">
          <span>{blueRobot.action}</span>
          <span className="font-mono text-blue-400">({blueRobot.speedMps.toFixed(1)} m/s)</span>
        </div>
      </div>

      {/* RED ROBOT (Chassis with Swerve Pods, Bumpers, Mechanism) */}
      <div
        className="absolute z-20 pointer-events-none transition-transform duration-75"
        style={{
          left: `${redRobot.x}%`,
          top: `${redRobot.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className="relative w-12 h-12 sm:w-14 sm:h-14"
          style={{ transform: `rotate(${redRobot.heading}deg)` }}
        >
          {/* Swerve Drive Wheel Pods */}
          {redRobot.swervePodAngles.map((angle, idx) => {
            const positions = [
              'top-0 left-0 -translate-x-1 -translate-y-1',
              'top-0 right-0 translate-x-1 -translate-y-1',
              'bottom-0 left-0 -translate-x-1 translate-y-1',
              'bottom-0 right-0 translate-x-1 translate-y-1',
            ];
            return (
              <div
                key={idx}
                className={`absolute ${positions[idx]} w-2.5 h-3.5 bg-zinc-950 border border-zinc-400 rounded-xs shadow-xs`}
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <div className="w-1 h-full bg-zinc-600 mx-auto"></div>
              </div>
            );
          })}

          {/* Intake Mechanism Bar (Front) */}
          <div
            className={`absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full border transition-all duration-150 flex items-center justify-center ${
              redRobot.intakeState === 'intaking'
                ? 'bg-amber-400 border-amber-200 shadow-[0_0_8px_#f59e0b]'
                : 'bg-zinc-800 border-red-400'
            }`}
          >
            {redRobot.intakeState === 'intaking' && (
              <div className="w-full h-0.5 bg-amber-600 animate-ping"></div>
            )}
          </div>

          {/* Bumper Perimeter (Red Alliance #1678) */}
          <div className="w-full h-full bg-zinc-900 rounded-md border-4 border-red-600 shadow-[0_0_20px_rgba(239,68,68,0.5)] flex flex-col items-center justify-center relative overflow-hidden">
            {/* Real Team Number On Bumper */}
            <span className="font-montserrat font-black text-[10px] sm:text-[11px] text-white tracking-tighter leading-none select-none">
              #{teamB.number}
            </span>

            {/* Held Note in Hopper / Indexer */}
            {redRobot.hasPiece && (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 bg-orange-500 animate-pulse mt-0.5 shadow-[0_0_8px_#f59e0b]"></div>
            )}

            {/* Shooter Flywheel LED status */}
            <div
              className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${
                redRobot.shooterRpm > 3000 ? 'bg-green-400 animate-ping' : 'bg-zinc-600'
              }`}
            />
          </div>
        </div>

        {/* Dynamic Action & Speed Tag above robot */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-red-950/90 border border-red-500/50 text-[8px] font-bold text-red-200 tracking-wide pointer-events-none shadow-md flex items-center gap-1">
          <span>{redRobot.action}</span>
          <span className="font-mono text-red-400">({redRobot.speedMps.toFixed(1)} m/s)</span>
        </div>
      </div>

      {/* FLOATING POINT SCORE GAINS */}
      <AnimatePresence>
        {floatingScores.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 1, y: 0, scale: 0.9 }}
            animate={{ opacity: 0, y: -50, scale: 1.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className={`absolute z-35 pointer-events-none font-montserrat font-black text-xs sm:text-sm px-2.5 py-1 rounded-lg shadow-2xl border ${
              item.alliance === 'blue'
                ? 'bg-blue-600 text-white border-blue-200 shadow-[0_0_20px_rgba(37,99,235,0.9)]'
                : 'bg-red-600 text-white border-red-200 shadow-[0_0_20px_rgba(239,68,68,0.9)]'
            }`}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {item.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Field Watermark & Dimensions scale */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[9px] font-mono font-bold text-zinc-500 pointer-events-none uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded-full">
        <span>FRC Official Regulation Field (16.54m × 8.21m)</span>
        <span>•</span>
        <span className="text-zinc-400">{phase.toUpperCase()} PHASE</span>
      </div>
    </div>
  );
}
