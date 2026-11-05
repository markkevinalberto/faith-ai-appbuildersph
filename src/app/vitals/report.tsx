import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { getSetting, listTargets, setSetting } from '@/db/repo/profiles';
import { listReadings } from '@/db/repo/vitals';
import { emailReport, shareOrPrintReport, type DeliveryResult } from '@/reports/deliver';
import { buildMarkerReport, isValidEmail, markerSentence, reportEmailKey, reportPeriod, type MarkerSummary, type ReportKind } from '@/reports/markerReport';
import { useApp, useProfile } from '@/state/AppState';
import { useAction, useNow, useQuery } from '@/state/hooks';
import { Button, IconButton } from '@/ui/Button';
import { Banner, InlineLoading } from '@/ui/Feedback';
import { SegmentedControl, TextField } from '@/ui/Fields';
import { Card, Screen, Section } from '@/ui/Layout';
import { Sparkline } from '@/ui/Sparkline';
import { AppText } from '@/ui/Text';
import { RADIUS, SPACE, toneColors, useTheme } from '@/ui/theme';
import { VITAL_META } from '@/ui/vitals';

const DONE: Record<DeliveryResult, string> = {
  email: 'Your email app opened with the report attached. Check the address and press Send.',
  'email-summary': 'Your email app opened with the summary. To keep the full report, use “Print or save as PDF” too.',
  share: 'Choose where to send or save the report.',
  print: 'Choose “Save as PDF” in the print window to keep a copy.',
};

export default function Reports() {
  const profile = useProfile();
  const { db, timeZone, locale } = useApp();
  const now = useNow(60_000);
  const run = useAction();
  const [kind, setKind] = useState<ReportKind>('weekly');
  const [offset, setOffset] = useState(0);
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'email' | 'share' | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const period = reportPeriod(kind, offset, now, timeZone, locale);
  const previous = reportPeriod(kind, offset - 1, now, timeZone, locale);

  const q = useQuery(
    async (d) => ({
      readings: await listReadings(d, profile.id, { fromIso: new Date(previous.start).toISOString(), toIso: new Date(period.end).toISOString(), order: 'asc' }),
      targets: await listTargets(d, profile.id),
      savedEmail: await getSetting(d, reportEmailKey(profile.id)),
    }),
    [profile.id, period.start, previous.start, period.end],
  );
  const report = q.data ? buildMarkerReport({ period, previous, readings: q.data.readings, targets: q.data.targets, profile, timeZone, locale, now }) : null;
  const email = emailDraft ?? q.data?.savedEmail ?? '';
  const word = kind === 'weekly' ? 'week' : 'month';

  const send = (how: 'email' | 'share') =>
    run(async () => {
      if (!report) return;
      setDone(null);
      const address = email.trim();
      if (how === 'email' && address && !isValidEmail(address)) {
        setEmailError('That doesn’t look like an email address. Check it, or leave it empty to choose in your email app.');
        return;
      }
      setEmailError(null);
      if (how === 'email' && address !== (q.data?.savedEmail ?? '')) await setSetting(db, reportEmailKey(profile.id), address || null);
      setBusy(how);
      try {
        const result = how === 'email' ? await emailReport(report, address || null) : await shareOrPrintReport(report);
        setDone(DONE[result]);
      } finally {
        setBusy(null);
      }
    });

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: 'Reports' }} />
      <AppText variant="body" tone="muted">
        A summary of your blood pressure and blood sugar for a week or a month, with every reading. Email it to yourself to keep, or bring it to your check-up.
      </AppText>

      <SegmentedControl
        label="Report"
        options={[
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' },
        ]}
        value={kind}
        onChange={(k) => {
          setKind(k);
          setOffset(0);
          setDone(null);
        }}
      />

      <View style={styles.periodRow}>
        <IconButton icon="chevron-back" label={`Previous ${word}`} tone="primary" filled onPress={() => setOffset((o) => o - 1)} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <AppText variant="heading" center>
            {period.label}
          </AppText>
          <AppText variant="caption" tone="subtle" center>
            {offset === 0 ? `This ${word}${period.complete ? '' : ' so far'}` : offset === -1 ? `Last ${word}` : `${-offset} ${word}s ago`}
          </AppText>
        </View>
        <IconButton icon="chevron-forward" label={`Next ${word}`} tone="primary" filled disabled={offset >= 0} onPress={() => setOffset((o) => Math.min(0, o + 1))} />
      </View>

      {!report ? <InlineLoading label="Preparing your report…" /> : null}
      {report ? report.markers.map((m) => <MarkerPreview key={m.type} m={m} kind={kind} window={{ start: period.start, end: Math.min(period.end, now.getTime()) }} />) : null}

      <Section title="Send or keep it" hint="The report is made on this phone. Your own email app sends it; FAITH sends nothing by itself and keeps no copy.">
        <Card style={{ gap: SPACE.lg }}>
          <TextField
            label="Email address (optional)"
            value={email}
            onChangeText={(v) => {
              setEmailDraft(v);
              setEmailError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@example.com"
            error={emailError}
            helper="Saved on this phone for next time."
          />
          <Button title="Email report" icon="mail-outline" size="lg" loading={busy === 'email'} disabled={!report || !!busy} onPress={() => void send('email')} />
          <Button
            title={Platform.OS === 'web' ? 'Print or save as PDF' : 'Save or share PDF'}
            icon={Platform.OS === 'web' ? 'print-outline' : 'share-outline'}
            variant="secondary"
            loading={busy === 'share'}
            disabled={!report || !!busy}
            onPress={() => void send('share')}
          />
          {done ? <Banner tone="success" title="Ready" message={done} /> : null}
        </Card>
      </Section>
    </Screen>
  );
}

function MarkerPreview({ m, kind, window }: { m: MarkerSummary; kind: ReportKind; window: { start: number; end: number } }) {
  const { c } = useTheme();
  const meta = VITAL_META[m.type];
  const tone = toneColors(c, meta.tone);
  const word = kind === 'weekly' ? 'week' : 'month';
  return (
    <Card style={{ gap: SPACE.md }} accessibilityLabel={markerSentence(m, kind)}>
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: tone.bg }]}>
          <Ionicons name={meta.icon} size={22} color={tone.fg} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="heading">{m.label}</AppText>
          <AppText variant="caption" tone="muted">
            {m.count ? `${m.count} reading${m.count === 1 ? '' : 's'} on ${m.daysLogged} day${m.daysLogged === 1 ? '' : 's'}` : `No readings this ${word}`}
          </AppText>
        </View>
        {m.trend ? (
          <View style={[styles.trend, { backgroundColor: c.surfaceMuted }]}>
            <AppText variant="label" tone="muted">
              {m.trend}
            </AppText>
          </View>
        ) : null}
      </View>
      {m.count >= 2 ? <Sparkline points={m.points} window={window} height={60} label={`${m.label} during this ${word}`} /> : null}
      {m.count ? (
        <View style={styles.tiles}>
          <Tile label="Average" value={m.average ?? '–'} unit={m.unit} sub={m.previousAverage ? `Previous ${word}: ${m.previousAverage}` : `No readings the previous ${word}`} />
          <Tile label="Lowest – highest" value={m.count > 1 ? `${m.lowest}–${m.highest}` : (m.lowest ?? '–')} sub={m.target ? `${m.target.within} of ${m.target.assessed} within target` : 'No target set'} />
        </View>
      ) : null}
      {m.contexts.length > 1 ? (
        <AppText variant="caption" tone="muted">
          {m.contexts.map((x) => `${x.label}: ${x.average}`).join(' · ')}
        </AppText>
      ) : null}
      {m.attention ? (
        <AppText variant="caption" tone="warning">
          {m.attention} reading{m.attention === 1 ? '' : 's'} needed attention. They are marked in the report.
        </AppText>
      ) : null}
    </Card>
  );
}

function Tile({ label, value, unit, sub }: { label: string; value: string; unit?: string; sub: string }) {
  const { c } = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: c.surfaceMuted }]}>
      <AppText variant="caption" tone="subtle">
        {label}
      </AppText>
      <AppText variant="metricSmall">
        {value}
        {unit ? (
          <AppText variant="caption" tone="muted">
            {' '}
            {unit}
          </AppText>
        ) : null}
      </AppText>
      <AppText variant="caption" tone="muted">
        {sub}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  periodRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md },
  icon: { width: 46, height: 46, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  trend: { paddingHorizontal: SPACE.md, paddingVertical: 6, borderRadius: RADIUS.pill },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm },
  tile: { flexGrow: 1, flexBasis: 150, borderRadius: RADIUS.md, padding: SPACE.md, gap: 2 },
});
