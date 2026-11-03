/**
 * The blood pressure or blood sugar card: the latest reading in large type, where it sits against the
 * target, a plain-words trend ("Going up", "Steady", "Going down") and a 14-day trend line, with one
 * big button to log a new reading. Tapping the top part opens the full trend and history.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { listTargets } from '@/db/repo/profiles';
import { latestReadings, listReadings } from '@/db/repo/vitals';
import { linearTrend, mean } from '@/domain/stats';
import { relativeFromNow } from '@/domain/time';
import { useProfile } from '@/state/AppState';
import { useNow, useQuery } from '@/state/hooks';
import { Button } from '@/ui/Button';
import { Pill } from '@/ui/Feedback';
import { Card } from '@/ui/Layout';
import { usePressScale } from '@/ui/motion';
import type { SparkPoint } from '@/ui/sparkGeometry';
import { Sparkline } from '@/ui/Sparkline';
import { AppText } from '@/ui/Text';
import { RADIUS, SPACE, toneColors, useTheme } from '@/ui/theme';
import { TREND_THRESHOLD, VITAL_META, assessReading, displayUnit, formatDisplay, positionPill, readingDisplay, toDisplay, trendWords } from '@/ui/vitals';

const DAY = 86_400_000;
/** The trend line and the trend words cover this many days. */
export const MARKER_WINDOW_DAYS = 14;

export type Marker = 'blood_pressure' | 'glucose';

export function MarkerCard({ type, compact = false }: { type: Marker; compact?: boolean }) {
  const profile = useProfile();
  const { c } = useTheme();
  const now = useNow(60_000);
  const press = usePressScale(0.985);
  const meta = VITAL_META[type];
  const tone = toneColors(c, meta.tone);

  const q = useQuery(
    async (d) => ({
      readings: await listReadings(d, profile.id, { type, fromIso: new Date(Date.now() - MARKER_WINDOW_DAYS * DAY).toISOString(), order: 'asc' }),
      latest: (await latestReadings(d, profile.id)).find((r) => r.type === type) ?? null,
      targets: await listTargets(d, profile.id),
    }),
    [profile.id, type],
  );

  const readings = q.data?.readings ?? [];
  const latest = q.data?.latest ?? null;
  const unit = displayUnit(type, profile);
  const disp = latest ? readingDisplay(latest, profile) : null;
  const assessed = latest && q.data ? assessReading(latest, q.data.targets, profile.emergencyNumber) : null;
  const pill = assessed ? positionPill(assessed.position, assessed.target) : null;

  const points: SparkPoint[] = readings.map((r) =>
    type === 'blood_pressure'
      ? { t: Date.parse(r.measuredAt), v: r.systolic as number, v2: r.diastolic as number }
      : { t: Date.parse(r.measuredAt), v: toDisplay('glucose', r.valueCanonical as number, profile) },
  );
  const week = readings.filter((r) => now.getTime() - Date.parse(r.measuredAt) <= 7 * DAY);
  const average = !week.length
    ? null
    : type === 'blood_pressure'
      ? `${Math.round(mean(week.map((r) => r.systolic as number)) as number)}/${Math.round(mean(week.map((r) => r.diastolic as number)) as number)}`
      : formatDisplay('glucose', mean(week.map((r) => toDisplay('glucose', r.valueCanonical as number, profile))) as number, profile);
  const trend = linearTrend(
    readings.map((r) => ({ t: Date.parse(r.measuredAt), v: type === 'blood_pressure' ? (r.systolic as number) : (r.valueCanonical as number) })),
    { stableThreshold: TREND_THRESHOLD[type] },
  );
  const words = trendWords(trend.direction);
  const window = { start: now.getTime() - MARKER_WINDOW_DAYS * DAY, end: now.getTime() };
  const name = meta.label.toLowerCase();
  const sparkLabel = `${meta.label}, last ${MARKER_WINDOW_DAYS} days: ${readings.length} reading${readings.length === 1 ? '' : 's'}${words ? `, ${words.label.toLowerCase()}` : ''}.`;

  return (
    <Card style={{ gap: SPACE.lg }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${meta.label}: ${disp && latest ? `${disp.value} ${disp.unit}, ${relativeFromNow(latest.measuredAt, now)}` : 'no readings yet'}${pill ? `, ${pill.label}` : ''}${words ? `, ${words.label}` : ''}. Opens trends and history`}
        onPress={() => router.push({ pathname: '/vitals/[type]', params: { type } })}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}>
        <Animated.View style={{ gap: SPACE.md, transform: [{ scale: press.scale }] }}>
          <View style={styles.head}>
            <View style={[styles.icon, { backgroundColor: tone.bg }]}>
              <Ionicons name={meta.icon} size={22} color={tone.fg} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="heading">{meta.label}</AppText>
              <AppText variant="caption" tone="muted">
                {latest ? `Last reading ${relativeFromNow(latest.measuredAt, now)}` : 'No readings yet'}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={c.textSubtle} />
          </View>

          {disp ? (
            <View style={styles.valueRow}>
              <View style={styles.value}>
                <AppText variant="metric">{disp.value}</AppText>
                <AppText variant="label" tone="muted">
                  {disp.unit}
                </AppText>
              </View>
              {words ? (
                <View style={[styles.trend, { backgroundColor: c.surfaceMuted }]}>
                  <Ionicons name={words.icon} size={17} color={c.textMuted} />
                  <AppText variant="label" tone="muted">
                    {words.label}
                  </AppText>
                </View>
              ) : null}
            </View>
          ) : null}
          {pill ? <Pill label={pill.label} tone={pill.tone} /> : null}

          {points.length >= 2 ? (
            <View style={{ gap: SPACE.xs }}>
              <Sparkline points={points} window={window} height={compact ? 52 : 72} label={sparkLabel} />
              <View style={styles.legend}>
                <AppText variant="caption" tone="subtle">
                  Last {MARKER_WINDOW_DAYS} days
                </AppText>
                {type === 'blood_pressure' ? (
                  <View style={styles.keys}>
                    <View style={[styles.key, { backgroundColor: c.chartLine }]} />
                    <AppText variant="caption" tone="subtle">
                      Top
                    </AppText>
                    <View style={[styles.key, { backgroundColor: c.chartSecondary, marginLeft: SPACE.sm }]} />
                    <AppText variant="caption" tone="subtle">
                      Bottom
                    </AppText>
                  </View>
                ) : null}
              </View>
            </View>
          ) : (
            <AppText variant="caption" tone="subtle">
              {latest ? 'Your trend line appears after two readings.' : `Log your first ${name} reading to start your trend.`}
            </AppText>
          )}
          {!compact && average ? (
            <AppText variant="caption" tone="muted">
              7-day average {average} {unit} · {week.length} reading{week.length === 1 ? '' : 's'}
            </AppText>
          ) : null}
        </Animated.View>
      </Pressable>
      <Button title={`Log ${name}`} icon="add" size="lg" fullWidth onPress={() => router.push({ pathname: '/vitals/new', params: { type } })} />
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md },
  icon: { width: 46, height: 46, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  valueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: SPACE.sm },
  value: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACE.md, paddingVertical: 6, borderRadius: RADIUS.pill },
  legend: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: SPACE.sm },
  keys: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  key: { width: 14, height: 4, borderRadius: 2 },
});
