const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const distance = (a, b, aspect) => Math.hypot((a.x - b.x) * aspect, a.y - b.y);

// Keep the cursor stable and require a release before another pinch can fire.
export class HandInput {
  reset() {
    this.x = this.y = null;
    this.at = null;
    this.closed = false;
    this.armed = false;
  }

  constructor() { this.reset(); }

  update(points, now, aspect = 1) {
    const palm = points?.[0], thumb = points?.[4], tip = points?.[8], knuckle = points?.[9];
    if (![palm, thumb, tip, knuckle].every(p => p && Number.isFinite(p.x) && Number.isFinite(p.y))) {
      this.reset();
      return null;
    }
    const size = distance(palm, knuckle, aspect);
    if (size < 0.025) { this.reset(); return null; }
    if (this.at !== null && now - this.at > 240) this.reset();
    const dt = this.at === null ? 0 : (now - this.at) / 1000;
    const u = clamp((0.88 - tip.x) / 0.76, 0, 1);
    const v = clamp((tip.y - 0.12) / 0.76, 0, 1);
    const a = this.x === null ? 1 : 1 - Math.exp(-Math.max(dt, 0) / 0.065);
    this.x = this.x === null ? u : this.x + a * (u - this.x);
    this.y = this.y === null ? v : this.y + a * (v - this.y);
    this.at = now;
    const ratio = distance(thumb, tip, aspect) / size;
    let drop = false;
    if (ratio > 0.46) {
      this.closed = false;
      this.armed = true;
    } else if (ratio < 0.29 && !this.closed) {
      this.closed = true;
      drop = this.armed;
      this.armed = false;
    }
    return { u: this.x, v: this.y, closed: this.closed, drop, dt };
  }
}
