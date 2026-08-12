// Derives a "course path" diagram (foundational courses, a core healing
// chain, an arhatic yoga chain, and the side-branch courses hanging off
// each) purely from the prerequisite graph, so it stays correct as courses
// are added/edited in admin rather than being hand-authored.
export function buildCoursePath(courses, prereqs) {
  const courseById = Object.fromEntries(courses.map((c) => [c.id, c]));
  const prereqIdsOf = {};
  const dependentsOf = {};
  for (const p of prereqs) {
    (prereqIdsOf[p.course_id] ??= []).push(p.prerequisite_course_id);
    (dependentsOf[p.prerequisite_course_id] ??= []).push(p.course_id);
  }

  const sameSeries = (a, b) => courseById[a]?.series === courseById[b]?.series;

  const depthCache = {};
  function downstreamDepth(id) {
    if (id in depthCache) return depthCache[id];
    depthCache[id] = 0; // guards against cycles
    const children = dependentsOf[id] ?? [];
    depthCache[id] = children.length ? 1 + Math.max(...children.map(downstreamDepth)) : 0;
    return depthCache[id];
  }

  function buildChain(series) {
    const seriesCourses = courses.filter((c) => c.series === series);
    let current = seriesCourses.find(
      (c) => !(prereqIdsOf[c.id] ?? []).some((pid) => sameSeries(pid, c.id))
    );
    if (!current) return [];
    const chain = [current];
    const seen = new Set([current.id]);
    for (;;) {
      const children = (dependentsOf[current.id] ?? [])
        .map((id) => courseById[id])
        .filter((c) => c && c.series === series && !seen.has(c.id));
      if (!children.length) break;
      current = children.reduce((best, c) =>
        downstreamDepth(c.id) > downstreamDepth(best.id) ? c : best
      );
      chain.push(current);
      seen.add(current.id);
    }
    return chain;
  }

  const healingPath = buildChain('healing');
  const arhaticChain = buildChain('arhatic_yoga');
  const chainIds = new Set([...healingPath, ...arhaticChain].map((c) => c.id));

  // Courses required by the arhatic chain's root that aren't already part of
  // another chain (e.g. a spirituality course with no prereqs of its own)
  // act as an alternate "start here" for that path.
  const arhaticRoot = arhaticChain[0];
  const coStarters = arhaticRoot
    ? (prereqIdsOf[arhaticRoot.id] ?? [])
        .map((id) => courseById[id])
        .filter((c) => c && !chainIds.has(c.id) && !(prereqIdsOf[c.id] ?? []).length)
    : [];
  for (const c of coStarters) chainIds.add(c.id);
  const arhaticPath = [...coStarters, ...arhaticChain];

  const branchesByAnchor = {};
  for (const c of courses) {
    if (chainIds.has(c.id)) continue;
    const anchor = (prereqIdsOf[c.id] ?? []).find((id) => chainIds.has(id));
    if (anchor) (branchesByAnchor[anchor] ??= []).push(c);
  }

  const placedIds = new Set(chainIds);
  for (const list of Object.values(branchesByAnchor)) for (const c of list) placedIds.add(c.id);

  const foundational = courses.filter((c) => c.series === 'spirituality' && !placedIds.has(c.id));
  for (const c of foundational) placedIds.add(c.id);

  const other = courses.filter((c) => !placedIds.has(c.id));

  return { foundational, healingPath, arhaticPath, branchesByAnchor, other, prereqIdsOf, courseById };
}
