// Final course-path layout, hand-placed by an admin using a (since removed)
// drag-and-drop editor and baked in here as the permanent static layout.
// Positions and arrow overrides are keyed by course code rather than id so
// they stay readable and portable across environments.
export const BOX_WIDTH = 176;

const FINAL_POSITIONS_BY_CODE = {
  BPH: { x: 221, y: 22 },
  APH: { x: 222, y: 157 },
  PSY: { x: 218, y: 294 },
  PCH: { x: 217, y: 438 },
  AOHS: { x: 762, y: 21 },
  AYP: { x: 763, y: 226 },
  AY1: { x: 766, y: 444 },
  AY2: { x: 765, y: 545 },
  HC: { x: 887, y: 649 },
  SBM: { x: 491, y: 17 },
  PFS: { x: 493, y: 158 },
  PSD: { x: 9, y: 155 },
  KRIYA: { x: 560, y: 375 },
};

// Arrow endpoints an admin manually placed away from their default
// box-edge attachment (e.g. so a branch arrow doesn't cut through a
// neighboring box). Missing start/end means "keep auto-attaching to the
// box's edge".
const FIXED_EDGE_OVERRIDES_BY_CODE = [
  { from: 'BPH', to: 'APH', start: { x: 306, y: 127 } },
  { from: 'APH', to: 'PSY', start: { x: 306, y: 244 }, end: { x: 307, y: 294 } },
  { from: 'APH', to: 'PSD', end: { x: 185, y: 201 } },
  { from: 'APH', to: 'PFS', start: { x: 398, y: 200 }, end: { x: 493, y: 200 } },
  { from: 'BPH', to: 'SBM', end: { x: 491, y: 71 } },
  { from: 'PSY', to: 'AYP', end: { x: 763, y: 336 } },
  { from: 'AY2', to: 'HC', start: { x: 916, y: 611 } },
];

export function computeDefaultPositions(healingPath, arhaticPath, branchesByAnchor) {
  const positions = {};
  const allCourses = [...healingPath, ...arhaticPath, ...Object.values(branchesByAnchor).flat()];
  for (const course of allCourses) {
    positions[course.id] = FINAL_POSITIONS_BY_CODE[course.code] ?? { x: 0, y: 0 };
  }
  return positions;
}

export function buildEdges(healingPath, arhaticPath, branchesByAnchor, crossLink) {
  const edges = [];
  for (let i = 0; i < healingPath.length - 1; i++) {
    edges.push({ from: healingPath[i].id, to: healingPath[i + 1].id });
  }
  for (let i = 0; i < arhaticPath.length - 1; i++) {
    edges.push({ from: arhaticPath[i].id, to: arhaticPath[i + 1].id });
  }
  for (const [anchorId, branches] of Object.entries(branchesByAnchor)) {
    for (const b of branches) edges.push({ from: anchorId, to: b.id });
  }
  if (crossLink) edges.push(crossLink);
  return edges;
}

// Resolves the code-keyed overrides above against the real course ids for
// this environment, returning a map keyed the same way as the edge list
// (`${fromId}|${toId}`).
export function resolveFixedEdgeOverrides(courseById) {
  const codeToId = {};
  for (const c of Object.values(courseById)) codeToId[c.code] = c.id;

  const overrides = {};
  for (const o of FIXED_EDGE_OVERRIDES_BY_CODE) {
    const from = codeToId[o.from];
    const to = codeToId[o.to];
    if (!from || !to) continue;
    overrides[`${from}|${to}`] = { start: o.start, end: o.end };
  }
  return overrides;
}
