/*!
 * orb-dots/react — React wrapper for the orb-dots canvas engine.
 * Requires orb-dots.js (zero other dependencies).
 * MIT License.
 */
import { useEffect, useRef } from 'react';
import OrbDots from './orbs-studio.js';

/**
 * <OrbDot state="searching" size={24} />
 *
 * Props:
 *   state  'working' | 'searching' | 'solving' | 'listening' | 'composing' | 'shaping'
 *   size   pixel size of the orb (default 64)
 *   speed  multiplier on the baked animation speed (default 1)
 *   theme  'auto' | 'dark' | 'light'  (auto follows data-theme / .dark / OS)
 *   paused freeze on the current frame
 *   config any engine option override (rings, density, tilt, dotColor, glow…)
 *   All other props (className, style, aria-label, data-*) pass to the canvas.
 */
export default function OrbDot({
  state = 'working',
  size = 64,
  display,
  speed = 1,
  theme = 'auto',
  paused = false,
  config,
  style,
  ...rest
}) {
  const ref = useRef(null);
  const orb = useRef(null);
  // An inline config={{...}} literal is a new object every render, which would
  // otherwise rebuild the orb on every parent re-render. Compare by value.
  const configKey = config ? JSON.stringify(config) : '';

  useEffect(() => {
    orb.current = OrbDots.create(ref.current, {
      state, size, display, speed, theme, paused, config
    });
    return () => orb.current && orb.current.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { orb.current && orb.current.setState(state); }, [state]);
  useEffect(() => { orb.current && orb.current.setSize(size, display); }, [size, display]);
  useEffect(() => { orb.current && orb.current.setSpeed(speed); }, [speed]);
  useEffect(() => { orb.current && orb.current.setTheme(theme); }, [theme]);
  useEffect(() => {
    if (!orb.current) return;
    paused ? orb.current.pause() : orb.current.play();
  }, [paused]);
  useEffect(() => {
    if (configKey && orb.current) orb.current.set(JSON.parse(configKey));
  }, [configKey]);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={rest['aria-label'] || `${state}…`}
      style={{ width: display || size, height: display || size, display: 'block', ...style }}
      {...rest}
    />
  );
}
