import { useId, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { sparkGeometry, type SparkPoint } from './sparkGeometry';
import { useTheme } from './theme';

/**
 * A small trend line: a soft area under the main series, the line itself, an optional second series
 * (diastolic) and a ringed dot on the latest reading. Read out as one image with `label`.
 */
export function Sparkline({
  points,
  label,
  height = 64,
  window,
  color,
  color2,
}: {
  points: SparkPoint[];
  label: string;
  height?: number;
  window?: { start: number; end: number };
  color?: string;
  color2?: string;
}) {
  const { c } = useTheme();
  const [width, setWidth] = useState(0);
  const gradientId = `spark${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const main = color ?? c.chartLine;
  const second = color2 ?? c.chartSecondary;
  const g = width > 0 ? sparkGeometry(points, width, height, window) : null;
  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));

  return (
    <View onLayout={onLayout} style={{ height, width: '100%' }} accessible accessibilityRole="image" accessibilityLabel={label}>
      {g ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={main} stopOpacity={0.2} />
              <Stop offset="1" stopColor={main} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={g.area} fill={`url(#${gradientId})`} />
          {g.line2 ? <Path d={g.line2} fill="none" stroke={second} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" /> : null}
          <Path d={g.line} fill="none" stroke={main} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          {g.last2 ? <Circle cx={g.last2.x} cy={g.last2.y} r={3.5} fill={second} stroke={c.surface} strokeWidth={2} /> : null}
          <Circle cx={g.last.x} cy={g.last.y} r={4.5} fill={main} stroke={c.surface} strokeWidth={2.5} />
        </Svg>
      ) : null}
    </View>
  );
}
