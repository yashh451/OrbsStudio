# Orbs Studio

Dotted thought-orb loading indicators for AI & agent UIs.
Six animated states, size-tuned presets, automatic dark/light, **zero dependencies**.

Canvas 2D only — no WebGL, no filters, no build step. Works identically in
Chrome, Safari and Firefox, and renders crisply from 16px to 512px on HiDPI.

---

## Install

Copy `orbs-studio.js` into your project. That's it.

```html
<script src="orbs-studio.js"></script>

<!-- any canvas with data-orb mounts itself automatically -->
<canvas data-orb="searching" data-size="24"></canvas>
```

Or drive it from JavaScript:

```js
const orb = OrbDots.create(canvas, { state: 'searching', size: 64 });
```

## The six states

Each is a distinct mechanic, not a recoloured spinner.

| State | Animation |
|---|---|
| `working` | particles ride tilted orbits around the globe |
| `searching` | a scan meridian sweeps across the dotted sphere |
| `solving` | latitude bands scramble, then click back into place |
| `listening` | a waveform rolls through the rings, pole to pole |
| `composing` | an undulating sash band winds around the surface |
| `shaping` | a dotted outline morphs circle → triangle → square |

## API

```js
const orb = OrbDots.create(canvas, {
  state: 'working',   // any of the six above
  size: 64,           // render resolution in px
  display: undefined, // CSS size in px (defaults to size; set smaller to supersample)
  speed: 1,           // multiplier on the baked speed
  theme: 'auto',      // 'auto' | 'dark' | 'light'
  paused: false,
  config: {}          // optional engine overrides (see below)
});

orb.setState('solving');
orb.setSize(24);
orb.setSpeed(1.5);
orb.setTheme('light');
orb.set({ dotColor: '#64f0d2' });
orb.pause();  orb.play();
orb.toPNG();                  // data URL
orb.destroy();                // removes observers + stops the loop
```

`OrbDots.auto(root?)` mounts every `canvas[data-orb]` under `root`
(runs automatically on DOMContentLoaded).

### Data attributes

```html
<canvas data-orb="solving"
        data-size="20"
        data-display="20"
        data-speed="1.5"
        data-theme-mode="light"></canvas>
```

Auto-mounted canvases get `role="img"` and a state-derived `aria-label`
unless you supply your own.

If you set an inline `width`/`height` style on the canvas yourself, the
library leaves it alone — so `size={64}` with `style={{width:40,height:40}}`
renders at 64px and displays at 40px for extra crispness.

## React

```jsx
import OrbDot from './OrbsStudio.jsx';

export function AgentStatus({ busy }) {
  return (
    <span className="chip">
      <OrbDot state={busy ? 'working' : 'listening'} size={20} />
      Agent {busy ? 'working' : 'listening'}…
    </span>
  );
}
```

All other props (`className`, `style`, `data-*`, `aria-label`) pass to the canvas.
TypeScript definitions ship in `orbs-studio.d.ts`.

## Theming

`theme: 'auto'` (the default) resolves in three layers and updates live:

1. the nearest ancestor with `data-theme="dark|light"`, or a `.dark` / `.light`
   class (the Tailwind / shadcn convention), watched via `MutationObserver`
2. otherwise `prefers-color-scheme`, subscribed for live OS changes
3. defaults to dark

## Config overrides

| Option | Default | Meaning |
|---|---|---|
| `rings` | size-tuned | latitude rings on the globe |
| `density` | size-tuned | dot density around the equator |
| `tilt` | `0.38` | axis tilt in radians (0 = pole-on) |
| `spin` | `0.18` | globe rotation, rad/sec |
| `roll` | `-0.06` | in-plane roll, rad/sec |
| `drift` | `0.25` | organic per-dot wander |
| `shimmer` | `1` | fast micro-jitter |
| `flicker` | `0.45` | per-dot brightness twinkle |
| `dotColor` | theme | dot colour |
| `accent` / `useAccent` | – | tint dots per state |
| `dotScale` | `0.78` | relative dot size |
| `dotPx` | `0` | absolute dot radius in px (0 = automatic) |
| `rsPow` | `0.5` | exponent for dot size vs orb size |
| `glow` | theme | additive glow amount |

Sizes below 28px and 48px automatically switch to coarser ring presets —
a small orb is a **coarser globe, not a shrunken dense one**.

## Performance & accessibility

- Animation pauses automatically when the orb scrolls out of view
  (`IntersectionObserver`), and while `paused` is set.
- `prefers-reduced-motion: reduce` drops shimmer, drift and most flicker.
- Canvases get `role="img"` and a state-derived `aria-label` in the React wrapper.
- Delta time is clamped, so a backgrounded tab or clock change can't corrupt the animation.

## Licence

MIT.

Concept inspired by [thinking-orbs](https://github.com/Jakubantalik/thinking-orbs)
by Jakub Antalik & Alex Brinza. This is an independent implementation.
