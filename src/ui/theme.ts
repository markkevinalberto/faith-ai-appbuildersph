/**
 * FAITH AI design tokens. "Soft structuralism": a cool silver ground with a slight indigo bias, white
 * cores set in machined double-bezel shells, very soft ambient shadows, and the indigo-to-blue brand
 * gradient from the mascot artwork as the one bold colour. Type is Plus Jakarta Sans.
 *
 * Sized for older readers: body text 17, no text style below 14 (the tab bar labels are fixed at 12 so
 * five fit a 360px phone). Text colours meet WCAG AA (≥4.5:1) on their intended surfaces,
 * including both ends of the hero gradient; field and button outlines meet 3:1; interactive targets
 * are at least 44–48dp.
 */
import { useMemo } from 'react';
import { StyleSheet, useColorScheme, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { useTextSize } from './textSize';

export interface Palette {
  bg: string;
  surface: string;
  surfaceMuted: string;
  surfaceSunken: string;
  /** Outer shell of a double-bezel card: a faint tray the white core sits in. */
  shell: string;
  /** Hairline ring around shells, floating bars and quiet controls. */
  ring: string;
  /** Inset top highlight on a card's core (the "glass edge"). */
  highlight: string;
  /** Coloured glow under primary buttons. */
  glow: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  onPrimary: string;
  accent: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  demo: string;
  demoSoft: string;
  chartLine: string;
  chartSecondary: string;
  chartBand: string;
  chartGrid: string;
  hero: string;
  /** Two-stop gradient used behind hero cards and the brand mark. */
  heroGradient: [string, string];
  heroText: string;
  heroMuted: string;
}

export const LIGHT: Palette = {
  bg: '#F3F3F8',
  surface: '#FFFFFF',
  surfaceMuted: '#EEEDF7',
  surfaceSunken: '#E5E4F1',
  shell: 'rgba(27,31,59,0.04)',
  ring: 'rgba(27,31,59,0.07)',
  highlight: 'rgba(255,255,255,0.95)',
  glow: 'rgba(91,79,224,0.55)',
  border: '#E3E2EF',
  borderStrong: '#8781B8',
  text: '#1B1F3B',
  textMuted: '#454A6B',
  textSubtle: '#5C6080',
  primary: '#5B4FE0',
  primaryPressed: '#4A3FC4',
  primarySoft: '#ECEAFF',
  onPrimary: '#FFFFFF',
  accent: '#3B82F6',
  success: '#1D7A49',
  successSoft: '#E3F5EA',
  warning: '#8A5300',
  warningSoft: '#FFF1D6',
  danger: '#C0262D',
  dangerSoft: '#FDE8EA',
  info: '#1D4ED8',
  infoSoft: '#E6EEFD',
  demo: '#A8326E',
  demoSoft: '#FCE7F1',
  chartLine: '#5B4FE0',
  chartSecondary: '#3B9EF6',
  chartBand: 'rgba(91,79,224,0.10)',
  chartGrid: '#E8E6F7',
  hero: '#4B40D0',
  heroGradient: ['#5145D6', '#3157D4'],
  heroText: '#FFFFFF',
  heroMuted: '#ECEBFF',
};

export const DARK: Palette = {
  bg: '#0B0C18',
  surface: '#16182E',
  surfaceMuted: '#1E2142',
  surfaceSunken: '#111329',
  shell: 'rgba(255,255,255,0.035)',
  ring: 'rgba(255,255,255,0.08)',
  highlight: 'rgba(255,255,255,0.08)',
  glow: 'rgba(0,0,0,0.55)',
  border: '#272A4C',
  borderStrong: '#6A6EA6',
  text: '#ECEBFF',
  textMuted: '#B9B8DA',
  textSubtle: '#9E9DC4',
  primary: '#A39BFF',
  primaryPressed: '#8B82F5',
  primarySoft: '#2A2760',
  onPrimary: '#130F3A',
  accent: '#7FB2FF',
  success: '#6BD39A',
  successSoft: '#14332A',
  warning: '#F2B54B',
  warningSoft: '#3A2C10',
  danger: '#FF8A8F',
  dangerSoft: '#3D1A20',
  info: '#8DB6F5',
  infoSoft: '#18283F',
  demo: '#F59AC3',
  demoSoft: '#3A1C2C',
  chartLine: '#A39BFF',
  chartSecondary: '#7FB2FF',
  chartBand: 'rgba(163,155,255,0.14)',
  chartGrid: '#25284A',
  hero: '#3B348F',
  heroGradient: ['#4239B8', '#2A52AD'],
  heroText: '#F4F3FF',
  heroMuted: '#DCDAFB',
};

export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 44 } as const;
export const RADIUS = { sm: 12, md: 16, lg: 22, xl: 28, pill: 999 } as const;
/** Double-bezel geometry: the shell's radius and padding; the core's radius is radius − pad. */
export const BEZEL = { radius: 28, pad: 5 } as const;
export const MIN_TOUCH = 48;

const tabular: TextStyle['fontVariant'] = ['tabular-nums'];

/**
 * Plus Jakarta Sans, one family per weight (Android picks faces by family name, not fontWeight).
 * Loaded at start-up by the root layout; until then, or if loading fails, text uses the system font
 * with the same weights, so nothing ever renders without its emphasis.
 */
export const FONTS = {
  400: 'PlusJakartaSans_400Regular',
  500: 'PlusJakartaSans_500Medium',
  600: 'PlusJakartaSans_600SemiBold',
  700: 'PlusJakartaSans_700Bold',
  800: 'PlusJakartaSans_800ExtraBold',
} as const;

let fontsReady = false;
let faceCache: TypeScale | null = null;

/** Called once by the root layout when the fonts have loaded. */
export function setFontsReady(ready: boolean): void {
  if (fontsReady === ready) return;
  fontsReady = ready;
  faceCache = null;
}

/** The style for a weight: the matching Plus Jakarta Sans family once loaded, else the system weight. */
export function typeface(weight: TextStyle['fontWeight'] = '400'): TextStyle {
  if (!fontsReady) return { fontWeight: weight };
  const w = weight === 'bold' ? 700 : weight === 'normal' || weight == null ? 400 : Number(weight);
  const key = w >= 800 ? 800 : w >= 700 ? 700 : w >= 600 ? 600 : w >= 500 ? 500 : 400;
  return { fontFamily: FONTS[key], fontWeight: undefined };
}

/**
 * Type scale at the "Standard" text size. Sentence case for everything people read; only the short
 * eyebrow pill above a page title is uppercase and tracked, as a label rather than text.
 */
export const TYPE = {
  display: { fontSize: 32, lineHeight: 39, fontWeight: '800', letterSpacing: -0.9 },
  title: { fontSize: 24, lineHeight: 31, fontWeight: '700', letterSpacing: -0.5 },
  heading: { fontSize: 19, lineHeight: 26, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 17, lineHeight: 26, fontWeight: '400' },
  bodyStrong: { fontSize: 17, lineHeight: 26, fontWeight: '600' },
  label: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  overline: { fontSize: 14, lineHeight: 20, fontWeight: '700', letterSpacing: 0.1 },
  eyebrow: { fontSize: 14, lineHeight: 18, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  metric: { fontSize: 36, lineHeight: 42, fontWeight: '800', letterSpacing: -1.2, fontVariant: tabular },
  metricSmall: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.5, fontVariant: tabular },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof TYPE;
export type TypeScale = typeof TYPE;

const round = (n: number) => Math.round(n * 2) / 2;

/** TYPE with each weight resolved to its typeface (see `typeface`). */
function withFaces(): TypeScale {
  if (!fontsReady) return TYPE;
  if (faceCache) return faceCache;
  const out = {} as Record<TypeVariant, TextStyle>;
  for (const key of Object.keys(TYPE) as TypeVariant[]) {
    const t: TextStyle = TYPE[key];
    out[key] = { ...t, ...typeface(t.fontWeight) };
  }
  faceCache = out as TypeScale;
  return faceCache;
}

/** Multiplies font sizes and line heights; everything else (weight, tracking) is unchanged. */
export function scaleType(scale: number): TypeScale {
  const base = withFaces();
  if (scale === 1) return base;
  const out = {} as Record<TypeVariant, TextStyle>;
  for (const key of Object.keys(base) as TypeVariant[]) {
    const t: TextStyle = base[key];
    out[key] = { ...t, fontSize: round((t.fontSize ?? 16) * scale), lineHeight: round((t.lineHeight ?? 24) * scale) };
  }
  return out as TypeScale;
}

/** The type scale at the user's chosen text size (Settings → Text size). */
export function useType(): TypeScale {
  const { scale } = useTextSize();
  return useMemo(() => scaleType(scale), [scale]);
}

/** Scales an explicit fontSize/lineHeight passed in a style override, or returns null if there is none. */
export function scaleTextOverride(style: StyleProp<TextStyle>, scale: number): TextStyle | null {
  if (scale === 1 || !style) return null;
  const flat = StyleSheet.flatten(style);
  if (!flat || (flat.fontSize === undefined && flat.lineHeight === undefined)) return null;
  return {
    ...(flat.fontSize !== undefined ? { fontSize: round(flat.fontSize * scale) } : null),
    ...(flat.lineHeight !== undefined ? { lineHeight: round(flat.lineHeight * scale) } : null),
  };
}

export function useTheme(): { c: Palette; dark: boolean } {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  return { c: dark ? DARK : LIGHT, dark };
}

/**
 * A very soft, wide ambient shadow (two layers: a 1px contact shadow and a long diffused falloff).
 * Uses the cross-platform `boxShadow` style (New Architecture on Android, CSS on the web).
 */
export function cardShadow(dark: boolean): ViewStyle {
  return {
    boxShadow: dark
      ? '0px 1px 1px rgba(0,0,0,0.35), 0px 24px 48px -24px rgba(0,0,0,0.7)'
      : '0px 1px 2px rgba(27,31,59,0.04), 0px 22px 44px -22px rgba(59,47,160,0.20)',
  };
}

/** The inset top highlight on a card's core. */
export function coreHighlight(c: Palette): ViewStyle {
  return { boxShadow: `inset 0px 1px 0px ${c.highlight}` };
}

export type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'demo' | 'neutral';

export function toneColors(c: Palette, tone: Tone): { fg: string; bg: string } {
  switch (tone) {
    case 'primary':
      return { fg: c.primary, bg: c.primarySoft };
    case 'success':
      return { fg: c.success, bg: c.successSoft };
    case 'warning':
      return { fg: c.warning, bg: c.warningSoft };
    case 'danger':
      return { fg: c.danger, bg: c.dangerSoft };
    case 'info':
      return { fg: c.info, bg: c.infoSoft };
    case 'demo':
      return { fg: c.demo, bg: c.demoSoft };
    default:
      return { fg: c.textMuted, bg: c.surfaceMuted };
  }
}
