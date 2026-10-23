import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { HeroGradient } from './Brand';
import type { IconName } from './Button';
import { Illustration, illustrationWidth, type IllustrationName } from './Illustration';
import { Reveal, useKeyboardOpen, usePressScale } from './motion';
import { useTabBarInset } from './tabInset';
import { AppText } from './Text';
import { useTextSize } from './textSize';
import { BEZEL, RADIUS, SPACE, cardShadow, coreHighlight, toneColors, useTheme, type Tone } from './theme';

/** Style keys that place a card in its parent; everything else styles the card's core. */
const PLACEMENT_KEYS = new Set([
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'marginVertical',
  'marginStart',
  'marginEnd',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignSelf',
  'width',
  'minWidth',
  'maxWidth',
  'position',
  'top',
  'left',
  'right',
  'bottom',
  'zIndex',
]);

function splitPlacement(style: StyleProp<ViewStyle>): [ViewStyle, ViewStyle] {
  const flat = (StyleSheet.flatten(style) ?? {}) as Record<string, unknown>;
  const placement: Record<string, unknown> = {};
  const core: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(flat)) (PLACEMENT_KEYS.has(k) ? placement : core)[k] = v;
  return [placement as ViewStyle, core as ViewStyle];
}

export interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  refreshControl?: React.ReactElement<RefreshControlProps>;
  contentStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
  keyboard?: boolean;
}

/** Page container: safe area, scroll, consistent gutters and max readable width. */
export function Screen({ children, scroll = true, edges = ['top'], refreshControl, contentStyle, footer, keyboard }: ScreenProps) {
  const { c } = useTheme();
  // On tab screens, keep the last card clear of the floating tab bar (it hides with the keyboard).
  const tabInset = useTabBarInset();
  const keyboardOpen = useKeyboardOpen(tabInset > 0);
  const extra = keyboardOpen ? 0 : tabInset;
  const ownBottom = (StyleSheet.flatten(contentStyle)?.paddingBottom as number | undefined) ?? SPACE.huge;
  const bottom = footer ? null : { paddingBottom: ownBottom + extra };
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, contentStyle, bottom]}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}>
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.fill, contentStyle, bottom]}>
      <View style={[styles.inner, styles.fill]}>{children}</View>
    </View>
  );
  const foot = footer ? <View style={{ paddingBottom: extra }}>{footer}</View> : null;
  return (
    <SafeAreaView edges={edges} style={[styles.fill, { backgroundColor: c.bg }]}>
      {keyboard ? (
        <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {body}
          {foot}
        </KeyboardAvoidingView>
      ) : (
        <>
          {body}
          {foot}
        </>
      )}
    </SafeAreaView>
  );
}

export function FormFooter({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  return (
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: c.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }}>
      <View style={[styles.footer]}>{children}</View>
    </SafeAreaView>
  );
}

export function PageHeader({ eyebrow, title, subtitle, right }: { eyebrow?: string; title: string; subtitle?: string; right?: ReactNode }) {
  const { c } = useTheme();
  return (
    <Reveal style={styles.header} distance={10}>
      <View style={styles.fill}>
        {eyebrow ? (
          <View style={[styles.eyebrow, { backgroundColor: c.primarySoft }]}>
            <AppText variant="eyebrow" tone="primary">
              {eyebrow}
            </AppText>
          </View>
        ) : null}
        <AppText variant="display" accessibilityRole="header">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="body" tone="muted" style={{ marginTop: SPACE.xs }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ? <View style={{ marginLeft: SPACE.md }}>{right}</View> : null}
    </Reveal>
  );
}

export interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  tone?: 'default' | 'muted' | 'hero' | Tone;
  padded?: boolean;
  /** Fade up into place on first mount (default). Off when a parent already animates it. */
  reveal?: boolean;
}

/**
 * The main surface. Default and hero cards are "double-bezel": a white (or gradient) core set in a
 * faint tray with a hairline ring and a soft ambient shadow, corners concentric. Tinted cards
 * (muted, success, warning…) are callouts and stay flat. Tappable cards press with a spring.
 * Placement styles (margins, flex, width) go on the outside; everything else styles the core.
 */
export function Card({ children, style, onPress, accessibilityLabel, accessibilityHint, tone = 'default', padded = true, reveal = true }: CardProps) {
  const { c, dark } = useTheme();
  const press = usePressScale(0.985);
  const [placement, coreStyle] = splitPlacement(style);
  const bezel = tone === 'default' || tone === 'hero';
  const bg = tone === 'default' ? c.surface : tone === 'muted' ? c.surfaceMuted : tone === 'hero' ? c.hero : toneColors(c, tone as Tone).bg;
  const core = (
    <View
      style={[
        styles.core,
        { backgroundColor: bg, borderRadius: bezel ? BEZEL.radius - BEZEL.pad : RADIUS.lg },
        bezel && coreHighlight(c),
        padded && { padding: SPACE.lg },
        coreStyle,
        tone === 'hero' && { overflow: 'hidden' },
      ]}>
      {tone === 'hero' ? <HeroGradient /> : null}
      {children}
    </View>
  );
  const body = (
    <Animated.View
      style={[
        styles.grow,
        bezel && [styles.shell, { backgroundColor: c.shell, borderColor: c.ring }, cardShadow(dark)],
        onPress && { transform: [{ scale: press.scale }] },
      ]}>
      {core}
    </Animated.View>
  );
  const content = onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={styles.grow}>
      {body}
    </Pressable>
  ) : (
    body
  );
  return reveal ? <Reveal style={placement}>{content}</Reveal> : <View style={placement}>{content}</View>;
}

/**
 * A card with FAITH large at its top-left, rising above the card's top edge, so she can be big without
 * making the card tall. `header` sits beside her; `children` (buttons, progress) use the full width
 * below. At the larger text sizes she shrinks a little so the text beside her stays readable.
 */
export function MascotCard({
  art,
  height = 150,
  rise = 44,
  tone,
  onPress,
  accessibilityLabel,
  header,
  children,
  style,
}: {
  art: IllustrationName;
  height?: number;
  /** How far she reaches above the card's top edge. */
  rise?: number;
  tone?: CardProps['tone'];
  onPress?: () => void;
  accessibilityLabel?: string;
  header: ReactNode;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { scale } = useTextSize();
  const h = Math.round(height * (scale > 1 ? 0.85 : 1));
  const w = illustrationWidth(art, h);
  return (
    <Reveal style={[{ paddingTop: rise }, style]}>
      <Card tone={tone} reveal={false} onPress={onPress} accessibilityLabel={accessibilityLabel} style={{ overflow: 'visible', gap: SPACE.md }}>
        {/* The core sits BEZEL.pad inside the shell with SPACE.lg padding; she stands SPACE.sm from the shell's edge. */}
        <View style={{ paddingLeft: w, minHeight: h - rise - SPACE.lg, justifyContent: 'center', gap: SPACE.xs }}>{header}</View>
        {children}
      </Card>
      {/* Drawn after the card (and raised on Android) so she sits in front of its edge. */}
      <View pointerEvents="none" style={styles.mascot}>
        <Illustration name={art} height={h} />
      </View>
    </Reveal>
  );
}

export function Section({
  title,
  action,
  children,
  hint,
}: {
  title: string;
  action?: { label: string; onPress: () => void; icon?: IconName };
  children: ReactNode;
  hint?: string;
}) {
  const { c } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <AppText variant="heading" accessibilityRole="header" style={styles.fill}>
          {title}
        </AppText>
        {action ? (
          // Shaped like a button, not bare coloured text, so it is recognisable as something to tap.
          <Pressable
            accessibilityRole="button"
            onPress={action.onPress}
            hitSlop={4}
            style={({ pressed }) => [styles.sectionAction, { backgroundColor: pressed ? c.surfaceSunken : c.primarySoft }]}>
            {action.icon ? <Ionicons name={action.icon} size={18} color={c.primary} /> : null}
            <AppText variant="label" tone="primary">
              {action.label}
            </AppText>
          </Pressable>
        ) : null}
      </View>
      {hint ? (
        <AppText variant="caption" tone="subtle" style={{ marginTop: -SPACE.xs, marginBottom: SPACE.sm }}>
          {hint}
        </AppText>
      ) : null}
      <View style={{ gap: SPACE.md }}>{children}</View>
    </View>
  );
}

export interface ListRowProps {
  icon?: IconName;
  iconTone?: Tone;
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  right?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  chevron?: boolean;
}

export function ListRow({ icon, iconTone = 'primary', title, subtitle, meta, right, onPress, accessibilityLabel, chevron = !!onPress }: ListRowProps) {
  const { c } = useTheme();
  const { fg, bg } = toneColors(c, iconTone);
  const content = (
    <View style={styles.row}>
      {icon ? (
        <View style={[styles.rowIcon, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={20} color={fg} />
        </View>
      ) : null}
      <View style={styles.fill}>
        <AppText variant="bodyStrong" numberOfLines={3}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
        {meta ? (
          <AppText variant="caption" tone="subtle">
            {meta}
          </AppText>
        ) : null}
      </View>
      {right}
      {chevron ? <Ionicons name="chevron-forward" size={18} color={c.textSubtle} /> : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? [title, subtitle, meta].filter(Boolean).join(', ')}
      onPress={onPress}
      android_ripple={{ color: c.surfaceSunken }}
      style={({ pressed }) => [{ borderRadius: RADIUS.md }, pressed && Platform.OS !== 'android' && { backgroundColor: c.surfaceMuted }]}>
      {content}
    </Pressable>
  );
}

export function Divider() {
  const { c } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.border, marginVertical: SPACE.xs }} />;
}

export function Stat({ label, value, unit, caption, tone = 'default' }: { label: string; value: string; unit?: string; caption?: string | null; tone?: 'default' | 'hero' }) {
  const hero = tone === 'hero';
  return (
    <View accessible accessibilityLabel={`${label}: ${value}${unit ? ` ${unit}` : ''}${caption ? `. ${caption}` : ''}`}>
      <AppText variant="overline" tone={hero ? 'heroMuted' : 'subtle'}>
        {label}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
        <AppText variant="metricSmall" tone={hero ? 'hero' : 'default'}>
          {value}
        </AppText>
        {unit ? (
          <AppText variant="caption" tone={hero ? 'heroMuted' : 'muted'}>
            {unit}
          </AppText>
        ) : null}
      </View>
      {caption ? (
        <AppText variant="caption" tone={hero ? 'heroMuted' : 'subtle'} numberOfLines={3}>
          {caption}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: SPACE.lg, paddingBottom: SPACE.huge, paddingTop: SPACE.sm },
  inner: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: SPACE.lg },
  footer: { paddingHorizontal: SPACE.lg, paddingVertical: SPACE.md, gap: SPACE.sm, width: '100%', maxWidth: 720, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: SPACE.lg, paddingBottom: SPACE.sm },
  eyebrow: { alignSelf: 'flex-start', borderRadius: RADIUS.pill, paddingHorizontal: SPACE.md, paddingVertical: 5, marginBottom: SPACE.sm },
  grow: { flexGrow: 1 },
  shell: { borderRadius: BEZEL.radius, padding: BEZEL.pad, borderWidth: StyleSheet.hairlineWidth },
  core: { flexGrow: 1, overflow: 'hidden' },
  mascot: { position: 'absolute', left: SPACE.sm, top: 0, zIndex: 2, elevation: 4 },
  section: { gap: SPACE.sm, marginTop: SPACE.xs },
  sectionHead: { flexDirection: 'row', alignItems: 'center', minHeight: 32, gap: SPACE.sm },
  sectionAction: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACE.md, borderRadius: RADIUS.pill },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md, minHeight: 56, paddingVertical: SPACE.sm },
  rowIcon: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
});
