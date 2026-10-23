/**
 * Motion for FAITH: one easing curve with weight to it (fast start, long soft landing), a fade-up as
 * cards arrive, and a spring press. Only opacity and transform animate, on the native driver. When the
 * phone or browser asks for reduced motion, everything appears in place and presses do not scale.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Keyboard, Platform, type StyleProp, type ViewStyle } from 'react-native';

/** cubic-bezier(0.32, 0.72, 0, 1) */
export const EASE = Easing.bezier(0.32, 0.72, 0, 1);
const NATIVE = Platform.OS !== 'web';

let reduced = false;
try {
  AccessibilityInfo.isReduceMotionEnabled?.()
    .then((v) => {
      reduced = v;
    })
    .catch(() => undefined);
  AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => {
    reduced = v;
  });
} catch {
  // Not available in this environment (tests): keep motion on.
}

export const prefersReducedMotion = (): boolean => reduced;

/** Fades content up into place once, when it first mounts. */
export function Reveal({ children, style, delay = 0, distance = 14 }: { children: ReactNode; style?: StyleProp<ViewStyle>; delay?: number; distance?: number }) {
  // One Animated.Value for the component's lifetime (state, not a ref, so render may read it).
  const [progress] = useState(() => new Animated.Value(reduced ? 1 : 0));
  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const anim = Animated.timing(progress, { toValue: 1, duration: 620, delay, easing: EASE, useNativeDriver: NATIVE });
    anim.start();
    return () => anim.stop();
  }, [progress, delay]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
        },
      ]}>
      {children}
    </Animated.View>
  );
}

/** A spring press: scales to `to` while held and settles back on release. */
export function usePressScale(to = 0.98) {
  const [scale] = useState(() => new Animated.Value(1));
  const go = (value: number) => {
    if (reduced) {
      scale.setValue(1);
      return;
    }
    Animated.spring(scale, { toValue: value, stiffness: 420, damping: 32, mass: 1, useNativeDriver: NATIVE }).start();
  };
  return { scale, onPressIn: () => go(to), onPressOut: () => go(1) };
}

/** True while the on-screen keyboard is open (always false on the web). */
export function useKeyboardOpen(enabled = true): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    const show = Keyboard.addListener('keyboardDidShow', () => setOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [enabled]);
  return open;
}
