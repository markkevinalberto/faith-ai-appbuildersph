import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { usePressScale } from './motion';
import { AppText } from './Text';
import { MIN_TOUCH, RADIUS, SPACE, toneColors, useTheme, type Tone } from './theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export interface ButtonProps {
  title: string;
  onPress: () => void;
  /** `onHero`: outlined white button for use on the purple hero gradient. */
  variant?: 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger' | 'onHero';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  size?: 'md' | 'lg' | 'sm';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  testID?: string;
}

/** Icons that point onward sit after the label, like an arrow at the end of a sentence. */
const TRAILING = /^(arrow-forward|arrow-up|chevron-forward|open|navigate|send|play-forward)/;

/**
 * A pill button. Its icon sits in its own small circle inside the pill ("button in a button"), flush
 * with the pill's inner edge; onward arrows go after the label and nudge forward while pressed. The
 * whole pill springs down slightly under the finger.
 */
export function Button({ title, onPress, variant = 'primary', icon, loading, disabled, size = 'md', fullWidth, style, accessibilityHint, testID }: ButtonProps) {
  const { c, dark } = useTheme();
  const press = usePressScale(0.97);
  const inactive = disabled || loading;
  const palette = {
    primary: { bg: c.primary, pressed: c.primaryPressed, fg: c.onPrimary, border: c.primary, well: dark ? 'rgba(19,15,58,0.16)' : 'rgba(255,255,255,0.2)' },
    secondary: { bg: c.surface, pressed: c.surfaceMuted, fg: c.primary, border: c.borderStrong, well: c.primarySoft },
    soft: { bg: c.primarySoft, pressed: c.surfaceSunken, fg: c.primary, border: c.primarySoft, well: c.surface },
    ghost: { bg: 'transparent', pressed: c.surfaceMuted, fg: c.primary, border: 'transparent', well: c.primarySoft },
    danger: { bg: c.dangerSoft, pressed: c.surfaceSunken, fg: c.danger, border: c.dangerSoft, well: c.surface },
    onHero: { bg: 'rgba(255,255,255,0.12)', pressed: 'rgba(255,255,255,0.24)', fg: c.heroText, border: 'rgba(255,255,255,0.7)', well: 'rgba(255,255,255,0.2)' },
  }[variant];
  // Small buttons stay 44 tall: the browser ignores hitSlop, and older hands need the full target.
  const height = size === 'lg' ? 58 : size === 'sm' ? 44 : MIN_TOUCH + 4;
  const small = size === 'sm';
  const well = small ? 0 : size === 'lg' ? 38 : 34;
  const trailing = !!icon && TRAILING.test(icon);
  const edge = (height - well) / 2;
  const padStart = icon && !small && !trailing ? edge : small ? SPACE.md : SPACE.xl + 2;
  const padEnd = icon && !small && trailing ? edge : small ? SPACE.md : SPACE.xl + 2;
  const nudge = press.scale.interpolate({ inputRange: [0.97, 1], outputRange: [3, 0], extrapolate: 'clamp' });

  const iconNode = icon ? (
    small ? (
      <Ionicons name={icon} size={18} color={palette.fg} />
    ) : (
      <Animated.View
        style={[
          styles.well,
          { width: well, height: well, backgroundColor: palette.well },
          trailing
            ? { transform: [{ translateX: nudge }, { translateY: Animated.multiply(nudge, -0.35) }] }
            : { transform: [{ scale: press.scale.interpolate({ inputRange: [0.97, 1], outputRange: [1.06, 1], extrapolate: 'clamp' }) }] },
        ]}>
        <Ionicons name={icon} size={size === 'lg' ? 20 : 18} color={palette.fg} />
      </Animated.View>
    )
  ) : null;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      hitSlop={small ? 4 : 0}
      style={[fullWidth && { alignSelf: 'stretch' }, style]}>
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.base,
            {
              minHeight: height,
              backgroundColor: pressed ? palette.pressed : palette.bg,
              borderColor: palette.border,
              opacity: inactive ? 0.55 : 1,
              paddingLeft: padStart,
              paddingRight: padEnd,
              transform: [{ scale: press.scale }],
            },
            variant === 'primary' && !inactive && { boxShadow: `0px 12px 22px -12px ${c.glow}` },
          ]}>
          {loading ? (
            <ActivityIndicator color={palette.fg} />
          ) : (
            <View style={[styles.row, { gap: small ? SPACE.xs + 2 : SPACE.md }]}>
              {!trailing ? iconNode : null}
              {/* Wrap rather than cut off: a truncated label hides what the button does. */}
              <AppText variant={small ? 'label' : 'bodyStrong'} style={{ color: palette.fg, textAlign: 'center', flexShrink: 1 }} numberOfLines={2}>
                {title}
              </AppText>
              {trailing ? iconNode : null}
            </View>
          )}
        </Animated.View>
      )}
    </Pressable>
  );
}

export interface IconButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  tone?: Tone;
  size?: number;
  filled?: boolean;
  disabled?: boolean;
}

export function IconButton({ icon, label, onPress, tone = 'neutral', size = 22, filled, disabled }: IconButtonProps) {
  const { c } = useTheme();
  const { fg, bg } = toneColors(c, tone);
  const press = usePressScale(0.92);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      hitSlop={6}>
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.icon,
            { backgroundColor: filled ? bg : pressed ? c.surfaceMuted : 'transparent', opacity: disabled ? 0.4 : 1, transform: [{ scale: press.scale }] },
          ]}>
          <Ionicons name={icon} size={size} color={tone === 'neutral' ? c.text : fg} />
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  well: { borderRadius: RADIUS.pill, alignItems: 'center', justifyContent: 'center' },
  icon: { width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: RADIUS.pill, alignItems: 'center', justifyContent: 'center' },
});
