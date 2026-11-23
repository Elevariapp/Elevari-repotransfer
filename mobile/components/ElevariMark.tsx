import { useId } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

interface ElevariMarkProps {
  size?: number;
  /** Symbol only, without the terracotta plate: for brand backgrounds such as the scene. */
  plain?: boolean;
}

/** Elevari Horizon: elevation arc, horizon line and amber dot. Same shapes as the web ElevariMark. */
export function ElevariMark({ size = 32, plain = false }: ElevariMarkProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const plate = `elevari-plate-${uid}`;
  const glow = `elevari-glow-${uid}`;

  return (
    <Svg
      width={size}
      height={size}
      viewBox={plain ? '133 113 270 270' : '0 0 512 512'}
      aria-hidden
    >
      <Defs>
        <LinearGradient id={plate} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#C2410C" />
          <Stop offset="1" stopColor="#9A340E" />
        </LinearGradient>
        <RadialGradient id={glow}>
          <Stop offset="0" stopColor="#F59E0B" stopOpacity={0.55} />
          <Stop offset="1" stopColor="#F59E0B" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {plain ? null : <Rect width={512} height={512} rx={120} fill={`url(#${plate})`} />}
      <Circle cx={364} cy={168} r={44} fill={`url(#${glow})`} />
      <Path
        d="M168 344C168 232 212 152 256 152C300 152 344 232 344 344"
        stroke="#EA9A2E"
        strokeWidth={30}
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M190 272H322" stroke="#EA9A2E" strokeWidth={30} strokeLinecap="round" />
      <Path d="M200 208H312" stroke="#FEF3C7" strokeWidth={26} strokeLinecap="round" opacity={0.9} />
      <Circle cx={364} cy={168} r={20} fill="#F59E0B" />
    </Svg>
  );
}
