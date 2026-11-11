// A path is a list of waypoints (in pixels). Enemies track a distance along it.
export class Path {
  constructor(points) {
    if (points.length < 2) throw new Error('Path needs at least 2 points');
    this.points = points;
    this.segments = [];
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      const len = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
      this.segments.push({ from: points[i - 1], to: points[i], start: total, len });
      total += len;
    }
    this.length = total;
  }

  /** Position at `distance` pixels from the start (clamped to the path). */
  positionAt(distance) {
    const d = Math.max(0, Math.min(distance, this.length));
    const seg = this.segments.find((s) => d <= s.start + s.len) ?? this.segments.at(-1);
    const t = seg.len === 0 ? 0 : (d - seg.start) / seg.len;
    return { x: seg.from.x + (seg.to.x - seg.from.x) * t, y: seg.from.y + (seg.to.y - seg.from.y) * t };
  }

  /** Grid tiles (col,row) that the path passes through, given a tile size. */
  tiles(tileSize) {
    const set = new Set();
    for (const s of this.segments) {
      const steps = Math.max(1, Math.ceil(s.len / (tileSize / 4)));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = s.from.x + (s.to.x - s.from.x) * t;
        const y = s.from.y + (s.to.y - s.from.y) * t;
        set.add(`${Math.floor(x / tileSize)},${Math.floor(y / tileSize)}`);
      }
    }
    return set;
  }
}
