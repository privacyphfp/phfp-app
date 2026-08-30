// Every field a student must fill in before they're allowed to enroll in a
// course. Kept intentionally minimal — just enough to run the account and
// reach the student — per PHFP's required / optional / sensitive-with-
// consent data classification. Everything else on the profile form
// (photo, nickname, address, social link, profession, company, religion)
// is optional and never blocks basic use of the app. `email` isn't listed
// — it comes from auth and always exists.
export const REQUIRED_PROFILE_FIELDS = ['first_name', 'last_name', 'phone', 'city', 'state_region', 'country'];

export function missingProfileFields(profile) {
  const missing = REQUIRED_PROFILE_FIELDS.filter((field) => !profile?.[field]);
  if (!profile?.nda_signature) missing.push('nda_signature');
  if (!profile?.privacy_notice_agreed_at) missing.push('privacy_notice_agreed_at');
  return missing;
}

export function isProfileComplete(profile) {
  return missingProfileFields(profile).length === 0;
}
