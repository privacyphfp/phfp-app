'use client';

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ARROW_COLOR, CourseBox } from './CoursePathNode';
import { BOX_WIDTH, buildEdges, computeDefaultPositions, resolveFixedEdgeOverrides } from '@/lib/courseLayout';

const FOUNDATIONAL_KEY = '__foundational__';

// Renders the Core Healing Path and Arhatic Yoga Path on a canvas at their
// final (hand-placed, now static) positions, plus the Foundational Courses
// box. Arrows are still measured from the real rendered DOM boxes rather
// than hardcoded, so they stay correctly attached even though box heights
// vary with content (badges, "Requires: ..." text, etc).
export default function CoursePathDiagram({
  foundational,
  healingPath,
  arhaticPath,
  branchesByAnchor,
  prereqIdsOf,
  courseById,
  crossLink,
  codeVisibleIds,
}) {
  const outerRef = useRef(null);
  const containerRef = useRef(null);
  const foundationalBoxRef = useRef(null);
  const boxRefs = useRef({});

  const canvasCourses = useMemo(() => {
    const list = [...healingPath, ...arhaticPath];
    for (const branches of Object.values(branchesByAnchor)) list.push(...branches);
    return list;
  }, [healingPath, arhaticPath, branchesByAnchor]);

  const positions = useMemo(
    () => computeDefaultPositions(healingPath, arhaticPath, branchesByAnchor),
    [healingPath, arhaticPath, branchesByAnchor]
  );

  const edgeOverrides = useMemo(() => resolveFixedEdgeOverrides(courseById), [courseById]);

  const autoEdges = useMemo(() => {
    const list = buildEdges(healingPath, arhaticPath, branchesByAnchor, crossLink);
    if (healingPath[0] && foundational.length) list.unshift({ from: healingPath[0].id, to: FOUNDATIONAL_KEY });
    return list;
  }, [healingPath, arhaticPath, branchesByAnchor, crossLink, foundational.length]);

  const [paths, setPaths] = useState([]);
  const [outerPaths, setOuterPaths] = useState([]);

  const recomputePaths = useCallback(() => {
    const container = containerRef.current;
    const outer = outerRef.current;
    if (!container || !outer) return;

    const c = container.getBoundingClientRect();
    const oc = outer.getBoundingClientRect();

    const rectOf = (id, origin) => {
      const el = id === FOUNDATIONAL_KEY ? foundationalBoxRef.current : boxRefs.current[id];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left - origin.left, top: r.top - origin.top, right: r.right - origin.left, bottom: r.bottom - origin.top };
    };

    const next = [];
    const nextOuter = [];

    for (const edge of autoEdges) {
      // The Foundational connector crosses out of the canvas's own
      // horizontally-scrollable region, so it's measured against the
      // outer wrapper instead — otherwise its arrowhead gets clipped by
      // the canvas's overflow-x-auto.
      const isOuterEdge = edge.from === FOUNDATIONAL_KEY || edge.to === FOUNDATIONAL_KEY;
      const origin = isOuterEdge ? oc : c;

      const fRect = rectOf(edge.from, origin);
      const tRect = rectOf(edge.to, origin);
      if (!fRect || !tRect) continue;

      const override = edgeOverrides[`${edge.from}|${edge.to}`] ?? {};
      // The Foundational connector's target is the synthetic key, not a
      // real course, so it can't go through the code-keyed override table.
      // Pin its start at the same height as the BPH -> Spiritual Business
      // Management branch arrow (49px below BPH's top) instead of centering
      // on the (much taller) Foundational box, which otherwise pulls it
      // down toward that box's vertical center.
      const isFoundationalEdge = edge.to === FOUNDATIONAL_KEY;
      const p1 = isFoundationalEdge
        ? { x: fRect.left, y: fRect.top + 49 }
        : (override.start ?? attachPoint(fRect, override.end ?? centerOf(tRect)));
      const p2 = override.end ?? attachPoint(tRect, p1);

      const entry = { key: `${edge.from}|${edge.to}`, points: elbowPoints(p1, p2) };
      (isOuterEdge ? nextOuter : next).push(entry);
    }

    setPaths(next);
    setOuterPaths(nextOuter);
  }, [autoEdges, edgeOverrides]);

  useLayoutEffect(() => {
    recomputePaths();
    const ro = new ResizeObserver(recomputePaths);
    if (containerRef.current) ro.observe(containerRef.current);
    if (outerRef.current) ro.observe(outerRef.current);
    window.addEventListener('resize', recomputePaths);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recomputePaths);
    };
  }, [recomputePaths]);

  const canvasHeight = Math.max(320, ...canvasCourses.map((c) => (positions[c.id]?.y ?? 0) + 170));
  const canvasWidth = Math.max(900, ...canvasCourses.map((c) => (positions[c.id]?.x ?? 0) + BOX_WIDTH + 40));

  return (
    <div ref={outerRef} className="relative grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
      <section>
        <div className="rounded-full bg-brand-indigo px-4 py-1.5 text-center text-sm font-semibold text-white">
          Foundational Courses
        </div>
        <p className="mt-2 text-center text-xs text-brand-ink/50">Build your spiritual foundation</p>
        <div
          ref={foundationalBoxRef}
          className="mt-4 rounded-2xl border-2 border-dashed border-brand-indigo/40 bg-brand-indigo/5 p-4"
        >
          <div className="flex flex-col gap-3">
            {foundational.map((c) => (
              <CourseBox key={c.id} course={c} />
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-8">
          <div className="rounded-full bg-brand-blue px-4 py-1.5 text-center text-sm font-semibold text-white">
            Core Healing Path
          </div>
          <div className="rounded-full bg-brand-flame px-4 py-1.5 text-center text-sm font-semibold text-white">
            Arhatic Yoga Path
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div ref={containerRef} className="relative" style={{ width: canvasWidth, height: canvasHeight, minWidth: '100%' }}>
            {canvasCourses.map((course) => {
              const pos = positions[course.id] ?? { x: 0, y: 0 };
              const isRoot = course.id === healingPath[0]?.id || course.id === arhaticPath[0]?.id;
              const isChainMember = healingPath.some((c) => c.id === course.id) || arhaticPath.some((c) => c.id === course.id);
              const prereqIds = prereqIdsOf[course.id] ?? [];
              const showPrereqs = isChainMember ? prereqIds.length > 1 : prereqIds.length > 0;
              const prereqNames = showPrereqs ? prereqIds.map((id) => courseById[id]?.name).filter(Boolean) : [];

              return (
                <div
                  key={course.id}
                  ref={(el) => {
                    boxRefs.current[course.id] = el;
                  }}
                  className="absolute"
                  style={{ left: pos.x, top: pos.y, width: BOX_WIDTH }}
                >
                  <CourseBox
                    course={course}
                    prereqNames={prereqNames}
                    badge={isRoot ? 'Start here' : undefined}
                    showCode={codeVisibleIds?.has(course.id)}
                  />
                </div>
              );
            })}

            <ArrowLayer paths={paths} />
          </div>
        </div>
      </section>

      <ArrowLayer paths={outerPaths} />
    </div>
  );
}

function ArrowLayer({ paths }) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full overflow-visible ${ARROW_COLOR}`}
      style={{ zIndex: 5 }}
      aria-hidden="true"
    >
      {paths.map((p) => (
        <path key={p.key} d={buildArrowPolygon(p.points, 3, 15, 9.5)} fill="currentColor" />
      ))}
    </svg>
  );
}

// ============================================================
// GEOMETRY HELPERS
// ============================================================

function centerOf(rect) {
  return { x: (rect.left + rect.right) / 2, y: (rect.top + rect.bottom) / 2 };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Finds the side of `rect` that faces `other`, attaching at the height (or
// width) nearest `other` — clamped to the box's own bounds — rather than
// always the box's center, so a tall box like Foundational Courses doesn't
// force an unnecessary bend when a straight line would reach it.
function attachPoint(rect, other) {
  const center = centerOf(rect);
  const dx = other.x - center.x;
  const dy = other.y - center.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return { x: dx >= 0 ? rect.right : rect.left, y: clamp(other.y, rect.top, rect.bottom) };
  }
  return { x: clamp(other.x, rect.left, rect.right), y: dy >= 0 ? rect.bottom : rect.top };
}

// A smart elbow: straight if the two points are already aligned on the
// dominant axis, otherwise one 90-degree bend.
function elbowPoints(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    if (Math.abs(dy) < 6) return [p1, p2];
    const turnX = (p1.x + p2.x) / 2;
    return [p1, { x: turnX, y: p1.y }, { x: turnX, y: p2.y }, p2];
  }
  if (Math.abs(dx) < 6) return [p1, p2];
  const turnY = (p1.y + p2.y) / 2;
  return [p1, { x: p1.x, y: turnY }, { x: p2.x, y: turnY }, p2];
}

// Offsets an axis-aligned polyline sideways by `dist` (side = +1/-1). Every
// segment is purely horizontal or vertical, so each corner's offset is just
// the sum of its two neighboring segments' perpendicular offsets — no
// line-intersection math needed.
function offsetPolyline(points, dist, side) {
  const perpOf = (a, b) => {
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return { x: (-(b.y - a.y) / len) * dist * side, y: ((b.x - a.x) / len) * dist * side };
  };

  if (points.length === 2) {
    const perp = perpOf(points[0], points[1]);
    return points.map((p) => ({ x: p.x + perp.x, y: p.y + perp.y }));
  }

  const out = [];
  for (let i = 0; i < points.length; i++) {
    const before = i > 0 ? perpOf(points[i - 1], points[i]) : null;
    const after = i < points.length - 1 ? perpOf(points[i], points[i + 1]) : null;
    const perp = before && after ? { x: before.x + after.x, y: before.y + after.y } : (before ?? after);
    out.push({ x: points[i].x + perp.x, y: points[i].y + perp.y });
  }
  return out;
}

// Builds one filled polygon covering the whole arrow — a constant-width
// shaft that flares into a triangular head and tapers to a point at the
// very end, so the line and the arrowhead read as a single design instead
// of a stroked line with a marker stuck on top of it.
function buildArrowPolygon(points, shaftWidth, headLength, headWidth) {
  const segments = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    segments.push({ a, b, len, dir: { x: (b.x - a.x) / len, y: (b.y - a.y) / len } });
  }

  const totalLen = segments.reduce((sum, seg) => sum + seg.len, 0);
  const headLen = Math.min(headLength, totalLen * 0.8);

  let remaining = headLen;
  let headStart = points[0];
  let headStartIndex = 0;
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    if (seg.len >= remaining) {
      headStart = { x: seg.b.x - seg.dir.x * remaining, y: seg.b.y - seg.dir.y * remaining };
      headStartIndex = i;
      break;
    }
    remaining -= seg.len;
  }

  const shaftPolyline = [...points.slice(0, headStartIndex + 1), headStart];
  const left = offsetPolyline(shaftPolyline, shaftWidth / 2, 1);
  const right = offsetPolyline(shaftPolyline, shaftWidth / 2, -1);

  const tip = points[points.length - 1];
  const tipDir = segments[segments.length - 1].dir;
  const perp = { x: -tipDir.y, y: tipDir.x };
  const headBaseLeft = { x: headStart.x + (perp.x * headWidth) / 2, y: headStart.y + (perp.y * headWidth) / 2 };
  const headBaseRight = { x: headStart.x - (perp.x * headWidth) / 2, y: headStart.y - (perp.y * headWidth) / 2 };

  const outline = [...left, headBaseLeft, tip, headBaseRight, ...right.slice().reverse()];
  return `M${outline[0].x},${outline[0].y} ` + outline.slice(1).map((p) => `L${p.x},${p.y}`).join(' ') + ' Z';
}
