// Generators for hand-drawn shapes. Deterministic (seeded) so server and client render identically.

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Smooth closed path through points (Catmull-Rom → cubic Bézier). */
function closedCurve(pts: Array<[number, number]>) {
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + "Z";
}

/** Organic blob inside a 200×200 box. `wobble` 0..1 controls irregularity. */
export function blobPath(seed: number, wobble = 0.28, points = 7) {
  const r = rng(seed);
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2 + r() * 0.35;
    const rad = 82 * (1 - wobble / 2 + r() * wobble);
    pts.push([100 + Math.cos(a) * rad, 100 + Math.sin(a) * rad]);
  }
  return closedCurve(pts);
}

/** Loose hand-drawn ellipse that overshoots its start (like circling a word). */
export function scribbleCircle(seed: number, w = 200, h = 80) {
  const r = rng(seed);
  const cx = w / 2;
  const cy = h / 2;
  const steps = 48;
  let d = "";
  for (let i = 0; i <= steps + 6; i++) {
    const t = (i / steps) * Math.PI * 2 - 0.4;
    const jitter = 1 + (r() - 0.5) * 0.06;
    const x = cx + Math.cos(t) * (w / 2 - 6) * jitter * (1 + i / (steps * 12));
    const y = cy + Math.sin(t) * (h / 2 - 6) * jitter;
    d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}
