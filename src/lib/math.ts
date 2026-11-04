/** Deterministic helpers: every frame can be rendered out of order. */
export const fract = (n: number) => n - Math.floor(n);
export const hash = (seed: number) => fract(Math.sin(seed * 127.1 + 78.233) * 43758.5453);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
export const easeInOut = (t: number) => { const x = clamp01(t); return x * x * (3 - 2 * x); };
