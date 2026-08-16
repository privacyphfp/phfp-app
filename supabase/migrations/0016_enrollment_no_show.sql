-- Run this one on its own, then anything using the new value after.
-- Lets staff distinguish "enrolled but never attended" from a real
-- cancellation when confirming who actually completed a course.
alter type enrollment_status add value if not exists 'no_show';
