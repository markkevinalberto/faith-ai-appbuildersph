import type { ClinicianTarget, Profile, VitalReading } from '@/domain/types';
import { buildMarkerReport, isValidEmail, markerSentence, reportEmailBody, reportFileName, reportHtml, reportPeriod } from '@/reports/markerReport';

const TZ = 'Asia/Manila';
const LOCALE = 'en-US';

const profile: Profile = {
  id: 'p1',
  displayName: 'Test <Person>',
  dateOfBirth: null,
  sex: null,
  locale: LOCALE,
  timezone: TZ,
  glucoseUnit: 'mg/dL',
  weightUnit: 'kg',
  temperatureUnit: 'C',
  emergencyNumber: '911',
  isDemo: false,
  reminderPrivacy: false,
  remindersEnabled: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const targets: ClinicianTarget[] = [
  { id: 't1', profileId: 'p1', metric: 'bp_systolic', low: null, high: 130, unit: 'mmHg', setBy: 'Dr. Example', setOn: '2026-09-01', notes: null },
  { id: 't2', profileId: 'p1', metric: 'bp_diastolic', low: null, high: 80, unit: 'mmHg', setBy: 'Dr. Example', setOn: '2026-09-01', notes: null },
  { id: 't3', profileId: 'p1', metric: 'glucose_fasting', low: 80, high: 130, unit: 'mg/dL', setBy: 'Dr. Example', setOn: '2026-09-01', notes: null },
];

let n = 0;
function bp(iso: string, s: number, d: number, notes: string | null = null): VitalReading {
  return { id: `r${n++}`, profileId: 'p1', type: 'blood_pressure', customTypeId: null, value: null, unit: 'mmHg', valueCanonical: null, systolic: s, diastolic: d, pulse: 70, measuredAt: iso, timezone: TZ, utcOffsetMin: 480, context: 'seated_rest', source: 'manual', notes, createdAt: iso };
}
function sugar(iso: string, mg: number, context: string | null): VitalReading {
  return { id: `r${n++}`, profileId: 'p1', type: 'glucose', customTypeId: null, value: mg, unit: 'mg/dL', valueCanonical: mg, systolic: null, diastolic: null, pulse: null, measuredAt: iso, timezone: TZ, utcOffsetMin: 480, context, source: 'manual', notes: null, createdAt: iso };
}

// Thursday 6 November 2026, 10:00 in Manila.
const NOW = new Date('2026-11-06T02:00:00.000Z');

describe('report periods', () => {
  it('uses Monday-to-Sunday weeks in the person’s time zone', () => {
    const w = reportPeriod('weekly', 0, NOW, TZ, LOCALE);
    expect(w.startDate).toBe('2026-11-02');
    expect(w.endDate).toBe('2026-11-08');
    expect(new Date(w.start).toISOString()).toBe('2026-11-01T16:00:00.000Z'); // midnight in Manila
    expect(w.complete).toBe(false);
    const last = reportPeriod('weekly', -1, NOW, TZ, LOCALE);
    expect([last.startDate, last.endDate]).toEqual(['2026-10-26', '2026-11-01']);
    expect(last.complete).toBe(true);
    expect(last.end).toBe(w.start);
  });

  it('uses calendar months, across year ends and leap years', () => {
    expect(reportPeriod('monthly', 0, NOW, TZ, LOCALE)).toMatchObject({ startDate: '2026-11-01', endDate: '2026-11-30', label: 'November 2026' });
    expect(reportPeriod('monthly', -11, NOW, TZ, LOCALE)).toMatchObject({ startDate: '2025-12-01', endDate: '2025-12-31' });
    expect(reportPeriod('monthly', 2, NOW, TZ, LOCALE)).toMatchObject({ startDate: '2027-01-01', endDate: '2027-01-31' });
    expect(reportPeriod('monthly', -33, NOW, TZ, LOCALE)).toMatchObject({ startDate: '2024-02-01', endDate: '2024-02-29' });
  });
});

describe('marker report', () => {
  const period = reportPeriod('weekly', -1, NOW, TZ, LOCALE); // 26 Oct – 1 Nov
  const previous = reportPeriod('weekly', -2, NOW, TZ, LOCALE);
  const readings = [
    bp('2026-10-20T00:00:00.000Z', 140, 90), // previous week
    bp('2026-10-26T00:00:00.000Z', 128, 78),
    bp('2026-10-28T00:00:00.000Z', 136, 84, 'After <a> long walk'),
    bp('2026-10-31T00:00:00.000Z', 118, 76),
    sugar('2026-10-27T23:00:00.000Z', 112, 'fasting'),
    sugar('2026-10-29T23:00:00.000Z', 146, 'fasting'),
    sugar('2026-10-30T05:00:00.000Z', 168, 'after_meal'),
    sugar('2026-11-03T00:00:00.000Z', 300, 'random'), // this week: outside the period
  ];
  const report = buildMarkerReport({ period, previous, readings, targets, profile, timeZone: TZ, locale: LOCALE, now: NOW });
  const [pressure, glucose] = report.markers;

  it('summarises blood pressure against the clinician’s target and the previous week', () => {
    expect(pressure.count).toBe(3);
    expect(pressure.daysLogged).toBe(3);
    expect(pressure.average).toBe('127/79');
    expect(pressure.previousAverage).toBe('140/90');
    expect(pressure.lowest).toBe('118/76');
    expect(pressure.highest).toBe('136/84');
    expect(pressure.target).toMatchObject({ within: 2, above: 1, below: 0, assessed: 3 });
    expect(pressure.target?.source).toContain('clinician');
  });

  it('summarises blood sugar by when it was taken, leaving out other periods', () => {
    expect(glucose.count).toBe(3);
    expect(glucose.average).toBe('142');
    expect(glucose.previousAverage).toBeNull();
    expect(glucose.contexts.map((c) => [c.label, c.count, c.average])).toEqual([
      ['Fasting', 2, '129'],
      ['After meal', 1, '168'],
    ]);
    // Fasting readings use the clinician's target (one is above it); the after-meal reading has no
    // clinician target, so it is compared with the general reference range, and the label says both.
    expect(glucose.target).toMatchObject({ within: 2, above: 1, assessed: 3 });
    expect(glucose.target?.source).toBe('your clinician’s targets and general reference ranges');
  });

  it('writes a plain summary sentence and email body', () => {
    expect(markerSentence(pressure, 'weekly')).toBe(
      'Blood pressure: 3 readings on 3 days. Average 127/79 mmHg (previous week 140/90). Lowest 118/76, highest 136/84. 2 of 3 within your clinician’s target.',
    );
    const body = reportEmailBody(report, true);
    expect(body).toContain('Test <Person> · Oct 26 – Nov 1, 2026');
    expect(body).toContain('attached as a PDF');
    expect(body).toContain('not a medical document');
  });

  it('builds escaped, self-contained HTML with a trend chart and every reading', () => {
    const html = reportHtml(report);
    expect(html).toContain('Test &lt;Person&gt;');
    expect(html).toContain('After &lt;a&gt; long walk');
    expect(html).not.toContain('<a>');
    expect(html.match(/<svg class="chart"/g)?.length).toBe(2);
    expect(html.match(/<tr( class="attention")?><td>/g)?.length).toBe(6);
    // Self-contained: nothing is fetched when it is rendered (the SVG namespace is only an identifier).
    expect(html).not.toMatch(/\s(src|href)=|url\(/);
  });

  it('says so when a marker has no readings', () => {
    const empty = buildMarkerReport({ period, previous, readings: [], targets, profile, timeZone: TZ, locale: LOCALE, now: NOW });
    expect(markerSentence(empty.markers[0], 'weekly')).toBe('Blood pressure: no readings this week.');
    expect(reportHtml(empty)).toContain('No blood pressure readings were recorded this week.');
  });

  it('names the file after the period and checks email addresses', () => {
    expect(reportFileName(report)).toBe('FAITH-weekly-report-2026-10-26-to-2026-11-01.pdf');
    expect(isValidEmail('person@example.com')).toBe(true);
    expect(isValidEmail(' person@example.com ')).toBe(true);
    expect(isValidEmail('person@example')).toBe(false);
    expect(isValidEmail('not an email')).toBe(false);
  });
});
