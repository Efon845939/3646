// Field geometry: positions are stored as percentages of the 16.54 m × 8.21 m carpet.
export const FIELD_LENGTH_M = 16.54;
export const FIELD_WIDTH_M = 8.21;

const MAX_ACCEL_MPS2 = 7; // typical FRC swerve on carpet
const MAX_TURN_DEG_PER_SEC = 360;
const ARRIVED_M = 0.02;

export interface DriveState {
  x: number; // % of field length
  y: number; // % of field width
  speedMps: number;
  heading: number; // degrees, 0 = facing +x, clockwise positive (screen coordinates)
}

export interface DriveResult extends DriveState {
  realX: number;
  realY: number;
  vx: number;
  vy: number;
  swervePodAngles: [number, number, number, number];
}

const normalizeAngle = (deg: number) => ((((deg + 180) % 360) + 360) % 360) - 180;

/**
 * Moves a robot one simulation step toward a target instead of jumping there.
 * Speed follows a trapezoidal profile: it ramps up at MAX_ACCEL, never exceeds maxSpeedMps,
 * and brakes early enough (v² = 2·a·d) to stop on the target without overshooting.
 * Swerve can translate in any direction, but the chassis also turns toward its travel
 * direction at a limited rate so the motion reads naturally on screen.
 */
export function driveToward(
  state: DriveState,
  targetX: number,
  targetY: number,
  maxSpeedMps: number,
  deltaSec: number
): DriveResult {
  const dt = Math.max(0, deltaSec);
  const dxM = ((targetX - state.x) / 100) * FIELD_LENGTH_M;
  const dyM = ((targetY - state.y) / 100) * FIELD_WIDTH_M;
  const dist = Math.hypot(dxM, dyM);

  if (dist < ARRIVED_M || dt === 0) {
    return {
      ...state,
      x: dist < ARRIVED_M ? targetX : state.x,
      y: dist < ARRIVED_M ? targetY : state.y,
      speedMps: dist < ARRIVED_M ? 0 : state.speedMps,
      realX: ((dist < ARRIVED_M ? targetX : state.x) / 100) * FIELD_LENGTH_M,
      realY: ((dist < ARRIVED_M ? targetY : state.y) / 100) * FIELD_WIDTH_M,
      vx: 0,
      vy: 0,
      swervePodAngles: [0, 0, 0, 0],
    };
  }

  const speed = Math.min(maxSpeedMps, state.speedMps + MAX_ACCEL_MPS2 * dt, Math.sqrt(2 * MAX_ACCEL_MPS2 * dist));
  const step = Math.min(dist, speed * dt);
  const ux = dxM / dist;
  const uy = dyM / dist;
  const x = state.x + ((ux * step) / FIELD_LENGTH_M) * 100;
  const y = state.y + ((uy * step) / FIELD_WIDTH_M) * 100;

  const travelDeg = (Math.atan2(uy, ux) * 180) / Math.PI;
  const turn = normalizeAngle(travelDeg - state.heading);
  const maxTurn = MAX_TURN_DEG_PER_SEC * dt;
  const heading = normalizeAngle(state.heading + Math.max(-maxTurn, Math.min(maxTurn, turn)));
  // All four modules point along the travel direction, expressed relative to the chassis.
  const podAngle = Math.round(normalizeAngle(travelDeg - heading));

  return {
    x,
    y,
    heading,
    speedMps: speed,
    realX: (x / 100) * FIELD_LENGTH_M,
    realY: (y / 100) * FIELD_WIDTH_M,
    vx: ux * speed,
    vy: uy * speed,
    swervePodAngles: [podAngle, podAngle, podAngle, podAngle],
  };
}
