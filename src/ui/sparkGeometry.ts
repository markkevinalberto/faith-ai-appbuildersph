/**
 * Geometry for the small trend lines on the blood pressure and blood sugar cards. Pure (no React), so
 * it is unit-tested. Points sit on a true time axis across the window, and the value axis is scaled
 * to the readings shown (both series for blood pressure) with a little headroom.
 */

export interface SparkPoint {
  t: number;
  v: number;
  /** Second series (diastolic for blood pressure). */
  v2?: number | null;
}

export interface SparkGeometry {
  line: string;
  line2: string | null;
  area: string;
  last: { x: number; y: number };
  last2: { x: number; y: number } | null;
  min: number;
  max: number;
}

const round = (n: number) => Math.round(n * 10) / 10;

export function sparkGeometry(
  points: SparkPoint[],
  width: number,
  height: number,
  window?: { start: number; end: number },
  pad = 6,
): SparkGeometry | null {
  const pts = [...points].filter((p) => Number.isFinite(p.v)).sort((a, b) => a.t - b.t);
  if (pts.length < 2 || width <= pad * 2 || height <= pad * 2) return null;

  const values = pts.flatMap((p) => (p.v2 !== null && p.v2 !== undefined && Number.isFinite(p.v2) ? [p.v, p.v2] : [p.v]));
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (max === min) {
    min -= 1;
    max += 1;
  }
  const head = (max - min) * 0.12;
  const lo = min - head;
  const hi = max + head;

  const t0 = window ? window.start : pts[0].t;
  const t1 = window ? window.end : pts[pts.length - 1].t;
  const span = t1 - t0 || 1;
  const x = (t: number) => round(pad + ((t - t0) / span) * (width - pad * 2));
  const y = (v: number) => round(pad + (1 - (v - lo) / (hi - lo)) * (height - pad * 2));

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.t)} ${y(p.v)}`).join(' ');
  const second = pts.filter((p) => p.v2 !== null && p.v2 !== undefined && Number.isFinite(p.v2));
  const line2 = second.length >= 2 ? second.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.t)} ${y(p.v2 as number)}`).join(' ') : null;
  const first = pts[0];
  const lastP = pts[pts.length - 1];
  const area = `${line} L${x(lastP.t)} ${height} L${x(first.t)} ${height} Z`;
  const lastSecond = second.length ? second[second.length - 1] : null;

  return {
    line,
    line2,
    area,
    last: { x: x(lastP.t), y: y(lastP.v) },
    last2: lastSecond && line2 ? { x: x(lastSecond.t), y: y(lastSecond.v2 as number) } : null,
    min,
    max,
  };
}
