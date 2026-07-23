/** Schematic metro neighborhoods for admin activity heatmap (mock / preview). */

export type MetroNeighborhood = {
  id: string;
  name: string;
  /** SVG path in viewBox 0 0 400 320 */
  path: string;
  /** Label anchor */
  labelX: number;
  labelY: number;
};

export const METRO_NAME = 'Local metro';

export const METRO_NEIGHBORHOODS: MetroNeighborhood[] = [
  {
    id: 'harbor',
    name: 'Harbor Point',
    path: 'M20 40 L140 28 L155 110 L35 125 Z',
    labelX: 85,
    labelY: 75,
  },
  {
    id: 'lakefront',
    name: 'Lakefront',
    path: 'M140 28 L260 20 L275 105 L155 110 Z',
    labelX: 205,
    labelY: 65,
  },
  {
    id: 'riverside',
    name: 'Riverside',
    path: 'M260 20 L380 35 L365 120 L275 105 Z',
    labelX: 320,
    labelY: 70,
  },
  {
    id: 'midtown',
    name: 'Midtown',
    path: 'M35 125 L155 110 L170 195 L50 210 Z',
    labelX: 100,
    labelY: 160,
  },
  {
    id: 'university',
    name: 'University District',
    path: 'M155 110 L275 105 L290 190 L170 195 Z',
    labelX: 220,
    labelY: 150,
  },
  {
    id: 'oak-hills',
    name: 'Oak Hills',
    path: 'M275 105 L365 120 L380 200 L290 190 Z',
    labelX: 325,
    labelY: 155,
  },
  {
    id: 'southside',
    name: 'Southside',
    path: 'M50 210 L170 195 L185 290 L40 300 Z',
    labelX: 110,
    labelY: 250,
  },
  {
    id: 'industrial',
    name: 'Industrial Corridor',
    path: 'M170 195 L290 190 L310 285 L185 290 Z',
    labelX: 235,
    labelY: 240,
  },
];

export type NeighborhoodStats = {
  id: string;
  name: string;
  sessionCount: number;
  hours: number;
  underReview: number;
};

/** Heat color from brand greens → cream for low. Text colors chosen for AA on fill. */
export function heatFill(intensity: number): string {
  const t = Math.max(0, Math.min(1, intensity));
  if (t <= 0) return '#f0eded';
  if (t < 0.25) return '#dcefe0';
  if (t < 0.5) return '#7fb089';
  if (t < 0.75) return '#3d8f5c';
  return '#007536';
}

export function heatText(intensity: number): string {
  // Dark on cream/pale; white only on darker greens (≥ ~4.5:1)
  return intensity >= 0.5 ? '#ffffff' : '#1c1b1b';
}
