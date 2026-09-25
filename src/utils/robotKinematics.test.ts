import { describe, expect, it } from 'vitest';
import { driveToward, DriveState, FIELD_LENGTH_M, FIELD_WIDTH_M } from './robotKinematics';

const distanceM = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(((b.x - a.x) / 100) * FIELD_LENGTH_M, ((b.y - a.y) / 100) * FIELD_WIDTH_M);

describe('driveToward', () => {
  it('never moves further in one step than the speed limit allows', () => {
    let s: DriveState = { x: 10, y: 20, speedMps: 0, heading: 0 };
    for (let i = 0; i < 200; i++) {
      const next = driveToward(s, 80, 70, 4.5, 1 / 60);
      expect(distanceM(s, next)).toBeLessThanOrEqual((4.5 / 60) * 1.0001);
      s = next;
    }
  });

  it('arrives on the target and stops there without overshooting', () => {
    let s: DriveState = { x: 20, y: 30, speedMps: 0, heading: 0 };
    const target = { x: 40, y: 60 };
    let closest = distanceM(s, target);
    for (let i = 0; i < 600; i++) {
      s = driveToward(s, target.x, target.y, 5, 1 / 60);
      const d = distanceM(s, target);
      expect(d).toBeLessThanOrEqual(closest + 1e-9); // distance only ever shrinks
      closest = d;
    }
    expect(s.x).toBe(target.x);
    expect(s.y).toBe(target.y);
    expect(s.speedMps).toBe(0);
  });

  it('ramps speed up instead of jumping to full speed', () => {
    const first = driveToward({ x: 10, y: 50, speedMps: 0, heading: 0 }, 90, 50, 5, 1 / 60);
    expect(first.speedMps).toBeLessThan(0.2);
  });

  it('turns the chassis at a limited rate', () => {
    const next = driveToward({ x: 50, y: 50, speedMps: 0, heading: 0 }, 10, 50, 5, 1 / 60);
    expect(Math.abs(next.heading)).toBeLessThanOrEqual(360 / 60 + 1e-9);
  });

  it('ignores negative or zero time steps', () => {
    const s: DriveState = { x: 30, y: 30, speedMps: 2, heading: 45 };
    const next = driveToward(s, 60, 60, 5, -0.05);
    expect(next.x).toBe(30);
    expect(next.y).toBe(30);
  });
});
