/*! orb-dots — TypeScript definitions */
export type OrbState =
  | 'working' | 'searching' | 'solving'
  | 'listening' | 'composing' | 'shaping';

export type OrbTheme = 'auto' | 'dark' | 'light';

export interface OrbConfig {
  /** dots per latitude ring band */
  rings?: number;
  /** dot density around the equator */
  density?: number;
  /** axis tilt in radians (0 = pole-on, 0.38 = default globe) */
  tilt?: number;
  /** globe rotation, radians/second */
  spin?: number;
  /** in-plane roll, radians/second */
  roll?: number;
  /** organic wander applied per dot */
  drift?: number;
  /** fast micro-jitter */
  shimmer?: number;
  /** per-dot brightness twinkle, 0..1 */
  flicker?: number;
  dotColor?: string;
  accent?: string;
  useAccent?: boolean;
  /** relative dot size multiplier */
  dotScale?: number;
  /** absolute dot radius in px (0 = automatic) */
  dotPx?: number;
  /** exponent for dot size vs orb size (default 0.5) */
  rsPow?: number;
  glow?: number;
  minAlpha?: number;
  theme?: 'dark' | 'light';
  [key: string]: unknown;
}

export interface OrbOptions {
  state?: OrbState;
  /** render resolution in px */
  size?: number;
  /** CSS display size in px; defaults to `size`. Set smaller than `size` to
   *  supersample (e.g. size 64 displayed at 40) for extra-crisp small orbs. */
  display?: number;
  speed?: number;
  theme?: OrbTheme;
  paused?: boolean;
  config?: OrbConfig;
}

export interface OrbInstance {
  setState(state: OrbState): OrbInstance;
  setSize(px: number, displayPx?: number): OrbInstance;
  setSpeed(multiplier: number): OrbInstance;
  setTheme(theme: OrbTheme): OrbInstance;
  set(config: OrbConfig): OrbInstance;
  pause(): OrbInstance;
  play(): OrbInstance;
  toPNG(): string;
  destroy(): void;
  readonly state: OrbState;
  readonly theme: 'dark' | 'light';
}

declare const OrbDots: {
  create(canvas: HTMLCanvasElement, options?: OrbOptions): OrbInstance;
  auto(root?: ParentNode): OrbInstance[];
  STATES: OrbState[];
  defaults: OrbConfig;
  version: string;
};

export default OrbDots;
