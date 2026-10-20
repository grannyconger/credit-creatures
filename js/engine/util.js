// Small math helpers shared by engine modules.

export function money(x) {
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

export function clamp(x, lo, hi) {
  return Math.min(hi, Math.max(lo, x));
}

// Piecewise-linear lookup. points = [[x, y], ...] sorted by x.
export function curve(points, x) {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    if (x <= x1) {
      const [x0, y0] = points[i - 1];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return points[points.length - 1][1];
}

export function pct(x) {
  return Math.round(x * 100) + "%";
}

export function dollars(x) {
  const v = money(x);
  const [whole, cents] = Math.abs(v).toFixed(2).split(".");
  const s = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (Number.isInteger(v) ? "" : "." + cents);
  return (v < 0 ? "-$" : "$") + s;
}
