-- Optional marketing content for a course's public page: a short tagline
-- for the hero banner, a bullet list of workshop highlights, and an
-- optional student testimonial. All nullable — a course with none of this
-- filled in just renders its existing plain layout.
alter table courses
  add column if not exists tagline text,
  add column if not exists highlights text[],
  add column if not exists testimonial_quote text,
  add column if not exists testimonial_author text;

update courses set
  tagline = 'Explore the World of Subtle Energy',
  description = 'Basic Pranic Healing is your first step into the ancient art and science of energy healing. Using nothing but your hands and focused intention, you''ll learn to work with the human energy body — the aura and chakras — to relieve everyday ailments and support the body''s own natural healing process. No prior experience needed, just an open mind and a willingness to feel energy for yourself.',
  highlights = array[
    'Sense and scan the aura with your own hands',
    'Cleanse and energize the body''s major chakras',
    'Relieve common ailments like headaches, colds, and stress in minutes',
    'Practice the Meditation on Twin Hearts for inner peace and world service',
    'Learn preventive and first-aid healing techniques',
    'Discover simple self-healing and distant healing methods',
    'Build the foundation for every advanced Pranic Healing course'
  ]
where code = 'BPH';
