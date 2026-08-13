-- Run in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Optional cleanup: the drag-and-drop course-path editor has been removed
-- from the app (the final layout is now baked into lib/courseLayout.js),
-- so these two tables are no longer read or written by anything.
drop table if exists course_layout_edges;
drop table if exists course_layout_positions;
