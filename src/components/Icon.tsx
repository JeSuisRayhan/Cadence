import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

type Shape =
  | { readonly d: string }
  | { readonly circle: readonly [cx: number, cy: number, r: number] }
  | { readonly rect: readonly [x: number, y: number, w: number, h: number, rx: number] };

interface IconDef {
  readonly shapes: readonly Shape[];
  /** icône pleine plutôt que tracée */
  readonly filled?: boolean;
}

const d = (path: string): Shape => ({ d: path });
const circle = (cx: number, cy: number, r: number): Shape => ({ circle: [cx, cy, r] });
const rect = (x: number, y: number, w: number, h: number, rx: number): Shape => ({ rect: [x, y, w, h, rx] });

const ICONS = {
  dumbbell: { shapes: [d('M6.5 8v8M3.5 10v4M17.5 8v8M20.5 10v4M6.5 12h11')] },
  clock: { shapes: [circle(12, 12, 8.5), d('M12 7.5V12l3 2')] },
  flame: { shapes: [d('M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3.5 2.2-4.6.2 1.4 1 2.2 1.8 2.6C11 8.2 11.5 5.5 12 3z')] },
  bell: { shapes: [d('M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z'), d('M10 20.5a2 2 0 0 0 4 0')] },
  calendar: { shapes: [rect(4, 5.5, 16, 14, 2.5), d('M4 10h16M9 3.5v4M15 3.5v4')] },
  sliders: { shapes: [d('M4 7h10M18 7h2M4 17h2M10 17h10'), circle(16, 7, 2), circle(8, 17, 2)] },
  home: { shapes: [d('M4 11l8-6.5 8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z')] },
  play: { shapes: [d('M8 5.5v13l11-6.5z')], filled: true },
  pause: { shapes: [d('M7 5h3.5v14H7zM13.5 5H17v14h-3.5z')], filled: true },
  next: { shapes: [d('M6 6l9 6-9 6zM17 6h2v12h-2z')], filled: true },
  check: { shapes: [d('M5 12.5l4.5 4.5L19 7.5')] },
  close: { shapes: [d('M6 6l12 12M18 6L6 18')] },
  moon: { shapes: [d('M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z')] },
  back: { shapes: [d('M15 5l-7 7 7 7')] },
  chevron: { shapes: [d('M9 5l7 7-7 7')] },
  plus: { shapes: [d('M6 12h12M12 6v12')] },
  minus: { shapes: [d('M6 12h12')] },
  sparkle: {
    shapes: [d('M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z')],
  },
  folder: { shapes: [d('M4 8a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z')] },
  upload: { shapes: [d('M12 15V4M7.5 8.5L12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4')] },
  youtube: { shapes: [rect(3.5, 6, 17, 12, 3.5), d('M10.5 9.5v5l4.2-2.5z')] },
  music: { shapes: [d('M9 18V6l10-2v12'), circle(7, 18, 2.5), circle(17, 16, 2.5)] },
  video: { shapes: [rect(4, 5, 16, 14, 2.5), d('M10 9.5v5l4.5-2.5z')] },
  refresh: { shapes: [d('M20 12a8 8 0 0 1-13.7 5.6M4 12a8 8 0 0 1 13.7-5.6M18 3v4h-4M6 21v-4h4')] },
  fail: { shapes: [circle(12, 12, 8.5), d('M9 9l6 6M15 9l-6 6')] },
  external: { shapes: [d('M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4')] },
  trash: { shapes: [d('M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12M10 11v5M14 11v5')] },
  info: { shapes: [circle(12, 12, 8.5), d('M12 11v5M12 7.8v.4')] },
} as const satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** Icônes du système visuel (grille de 24, trait arrondi). Décoratives : le libellé est porté par le parent. */
export function Icon({ name, size = 24, color = colors.text, strokeWidth = 1.8 }: IconProps) {
  const def: IconDef = ICONS[name];
  const filled = def.filled === true;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {def.shapes.map((shape, i) => {
        const paint = filled
          ? { fill: color }
          : { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
        if ('d' in shape) return <Path key={i} d={shape.d} {...paint} />;
        if ('circle' in shape) return <Circle key={i} cx={shape.circle[0]} cy={shape.circle[1]} r={shape.circle[2]} {...paint} />;
        const [x, y, w, h, rx] = shape.rect;
        return <Rect key={i} x={x} y={y} width={w} height={h} rx={rx} {...paint} />;
      })}
    </Svg>
  );
}
