import { isDarkAppearance, parseAppearance } from '@/ui/appearance';
import { sparkGeometry } from '@/ui/sparkGeometry';
import { TREND_THRESHOLD, trendWords } from '@/ui/vitals';

const DAY = 86_400_000;

describe('sparkline geometry', () => {
  const points = [
    { t: 0, v: 120, v2: 80 },
    { t: 2 * DAY, v: 140, v2: 90 },
    { t: 4 * DAY, v: 130, v2: 85 },
  ];

  it('needs at least two readings and room to draw', () => {
    expect(sparkGeometry(points.slice(0, 1), 300, 60)).toBeNull();
    expect(sparkGeometry(points, 10, 60)).toBeNull();
  });

  it('places readings on a true time axis inside the padding', () => {
    const g = sparkGeometry(points, 300, 60, { start: 0, end: 4 * DAY }, 6)!;
    expect(g.line.startsWith('M6 ')).toBe(true);
    expect(g.last.x).toBe(294);
    // The middle reading sits halfway along, whatever its value.
    expect(g.line).toContain('L150 ');
  });

  it('scales both blood pressure series together, highest value nearest the top', () => {
    const g = sparkGeometry(points, 300, 60)!;
    expect(g.line2).not.toBeNull();
    expect(g.min).toBe(80);
    expect(g.max).toBe(140);
    const ys = g.line.split(/[ML]/).filter(Boolean).map((s) => Number(s.trim().split(' ')[1]));
    expect(Math.min(...ys)).toBe(ys[1]); // 140 is the top-most point
    expect(g.last2!.y).toBeGreaterThan(g.last.y); // diastolic draws below systolic
  });

  it('copes with identical values and closes the area under the line', () => {
    const g = sparkGeometry([{ t: 0, v: 7 }, { t: DAY, v: 7 }], 200, 50)!;
    expect(Number.isFinite(g.last.y)).toBe(true);
    expect(g.line2).toBeNull();
    expect(g.area.endsWith('Z')).toBe(true);
  });
});

describe('trend words', () => {
  it('uses neutral, plain words and stays quiet without enough data', () => {
    expect(trendWords('rising')?.label).toBe('Going up');
    expect(trendWords('falling')?.label).toBe('Going down');
    expect(trendWords('stable')?.label).toBe('Steady');
    expect(trendWords('insufficient_data')).toBeNull();
  });

  it('has a threshold for every marker', () => {
    expect(TREND_THRESHOLD.blood_pressure).toBe(5);
    expect(TREND_THRESHOLD.glucose).toBe(10);
  });
});

describe('appearance', () => {
  it('is light unless dark is chosen, even when the phone is in dark mode', () => {
    expect(parseAppearance(null)).toBe('light');
    expect(parseAppearance('nonsense')).toBe('light');
    expect(isDarkAppearance('light', 'dark')).toBe(false);
    expect(isDarkAppearance('dark', 'light')).toBe(true);
    expect(isDarkAppearance('system', 'dark')).toBe(true);
    expect(isDarkAppearance('system', 'light')).toBe(false);
  });
});
