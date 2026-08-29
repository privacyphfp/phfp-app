// Instructors PHFP already works with who don't have an account in the
// app yet. Picking one of these on the certificate upload form just
// records the name as free text (instructor_name) — the same mechanism
// as choosing "Other" — rather than linking a real profile. Once someone
// signs up and gets appointed Instructor on their profile, new uploads
// can select their real linked account instead; these plain-name entries
// stay available too, since not every certificate submitter will bother
// re-checking, and old records referencing a name here are unaffected.
export const KNOWN_INSTRUCTOR_NAMES = [
  'Atty. Chi Padayao',
  'Atty. Stefh Pormanes',
  'Atty. Chi Padayao & Atty. Stefh Pormanes',
  'Marilou Arquero',
  'Master Faith Sawey',
  'Master Danny Gorgonia',
  'Master Hermie Corcuera',
  'Ma. Czarina Mallari',
  'Judith Alma Acosta',
  'Renu Daryanani',
  'Dr. Peter Quilendrino',
];
