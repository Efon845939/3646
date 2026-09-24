// Statbotics-style logistic model shared by the simulator, picklist and matchup intel:
// P(win) = 1 / (1 + 10^((theirEPA - ourEPA) / 26)).
// An EPA lead equal to the scale (26 pts) is roughly a 91% favourite.
export const EPA_WIN_SCALE = 26;

export function epaWinProbability(ourEPA: number, theirEPA: number): number {
  return 1 / (1 + Math.pow(10, (theirEPA - ourEPA) / EPA_WIN_SCALE));
}

// Whole-percent form clamped to 4–96%: no pre-match model should claim certainty.
export function epaWinPercent(ourEPA: number, theirEPA: number): number {
  return Math.min(96, Math.max(4, Math.round(epaWinProbability(ourEPA, theirEPA) * 100)));
}
