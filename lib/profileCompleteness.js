// Every field a student must fill in before they're allowed to enroll in a
// course, matching the fields on the profile intake form. `email` isn't
// listed — it comes from auth and always exists.
export const REQUIRED_PROFILE_FIELDS = [
  'first_name',
  'last_name',
  'nickname',
  'birthdate',
  'address',
  'city',
  'state_region',
  'country',
  'phone',
  'fb_link',
  'religion',
  'profession',
  'company',
  'avatar_url',
];

export function missingProfileFields(profile) {
  const missing = REQUIRED_PROFILE_FIELDS.filter((field) => !profile?.[field]);
  if (!profile?.nda_signature) missing.push('nda_signature');
  if (!profile?.privacy_signature) missing.push('privacy_signature');
  return missing;
}

export function isProfileComplete(profile) {
  return missingProfileFields(profile).length === 0;
}
