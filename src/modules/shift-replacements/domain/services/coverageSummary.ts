export interface Interval {
  start: Date;
  end: Date;
}

export interface CoverageSummary {
  requiredMinutes: number;
  coveredMinutes: number;
  fullyCovered: boolean;
  gaps: Interval[];
}

// Calcula cuánto de la ventana [windowStart, windowEnd] queda cubierto por los
// intervalos dados (recortados a la ventana, fusionando solapamientos) y qué
// huecos quedan. El coordinador puede aprobar aun con huecos: esto es informativo.
export function summarizeCoverage(
  windowStart: Date,
  windowEnd: Date,
  intervals: Interval[],
): CoverageSummary {
  const winStart = windowStart.getTime();
  const winEnd = windowEnd.getTime();
  const requiredMinutes = Math.max(0, (winEnd - winStart) / 60000);

  // Recortar a la ventana y descartar vacíos.
  const clipped = intervals
    .map((i) => ({
      start: Math.max(winStart, i.start.getTime()),
      end: Math.min(winEnd, i.end.getTime()),
    }))
    .filter((i) => i.end > i.start)
    .sort((a, b) => a.start - b.start);

  // Fusionar solapamientos.
  const merged: { start: number; end: number }[] = [];
  for (const i of clipped) {
    const last = merged[merged.length - 1];
    if (last && i.start <= last.end) {
      last.end = Math.max(last.end, i.end);
    } else {
      merged.push({ ...i });
    }
  }

  const coveredMinutes = merged.reduce(
    (acc, i) => acc + (i.end - i.start) / 60000,
    0,
  );

  // Huecos = ventana menos lo cubierto.
  const gaps: Interval[] = [];
  let cursor = winStart;
  for (const i of merged) {
    if (i.start > cursor) {
      gaps.push({ start: new Date(cursor), end: new Date(i.start) });
    }
    cursor = Math.max(cursor, i.end);
  }
  if (cursor < winEnd) {
    gaps.push({ start: new Date(cursor), end: new Date(winEnd) });
  }

  return {
    requiredMinutes,
    coveredMinutes,
    fullyCovered: gaps.length === 0 && requiredMinutes > 0,
    gaps,
  };
}
