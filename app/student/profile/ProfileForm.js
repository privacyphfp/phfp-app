'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { COUNTRIES } from '@/lib/countries';
import SignaturePad from '@/components/SignaturePad';
import SuccessModal from '@/components/SuccessModal';
import { NDA_PARAGRAPHS } from '@/lib/ndaText';
import { exceedsMaxUploadSize, MAX_UPLOAD_LABEL } from '@/lib/fileUpload';

// Replaces the old single "Data Protection and Privacy" signed document
// with a plain-language notice the student checks off, paired with
// separate, purpose-specific consent checkboxes further down the form —
// so declining an optional one never blocks basic use of the app.
const PRIVACY_NOTICE_PARAGRAPHS = [
  `The Pranic Healing Foundation of the Philippines (PHFP) collects only the personal data needed to run your student account and your course enrollments, in line with the Data Privacy Act of 2012 (RA 10173).`,
  `Required — First Name, Last Name, Email, Phone, City, Province/Region, and Country are needed to create your account, process enrollments, and reach you about the courses you sign up for.`,
  `Optional — Profile Photo, Nickname, Date of Birth, Address, Social Media Account, Profession, and Company/Organization support administrative and community functions (e.g. attendance, ID verification, networking). You can use the app without providing these.`,
  `Sensitive, with your specific consent — Religion / spiritual or philosophical affiliation is only collected and used if you choose to share it and separately consent below.`,
  `Your data is accessible only to authorized PHFP staff and instructors administering your courses. We do not sell, rent, lease, or share it with third parties outside PHFP without your consent, except where required by law.`,
  `You may access, correct, or request deletion of your data, and withdraw any consent you've given — for communications, photo/video use, or religion data — at any time by emailing pranichealingphilippines@yahoo.com. Withdrawing consent will not affect your ability to use your basic student account.`,
  `We keep your data for as long as your account is active and as needed for legitimate record-keeping, such as certificates and course history.`,
];

const inputClass =
  'mt-1 w-full rounded-lg border border-brand-blue/20 px-3 py-2 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900';
const labelClass = 'block text-sm font-medium text-brand-ink/80';

function RequiredLabel({ children }) {
  return (
    <label className={labelClass}>
      {children} <span className="text-red-600">*</span>
    </label>
  );
}

function OptionalLabel({ children }) {
  return (
    <label className={labelClass}>
      {children} <span className="text-brand-ink/40">(optional)</span>
    </label>
  );
}

export default function ProfileForm({ profile, avatarSignedUrl }) {
  const router = useRouter();

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(avatarSignedUrl ?? null);

  // Required tier
  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [lastName, setLastName] = useState(profile?.last_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [stateRegion, setStateRegion] = useState(profile?.state_region ?? '');
  const [country, setCountry] = useState(profile?.country ?? '');

  // Optional tier
  const [nickname, setNickname] = useState(profile?.nickname ?? '');
  const [birthdate, setBirthdate] = useState(profile?.birthdate ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
  const [fbLink, setFbLink] = useState(profile?.fb_link ?? '');
  const [profession, setProfession] = useState(profile?.profession ?? '');
  const [company, setCompany] = useState(profile?.company ?? '');

  // Sensitive, with specific consent
  const [religion, setReligion] = useState(profile?.religion ?? '');
  const [religionConsent, setReligionConsent] = useState(!!profile?.religion_consent_agreed_at);

  // Optional opt-in consents
  const [updatesViaText, setUpdatesViaText] = useState(!!profile?.updates_via_text);
  const [updatesViaEmail, setUpdatesViaEmail] = useState(!!profile?.updates_via_email);
  const [updatesViaSocial, setUpdatesViaSocial] = useState(!!profile?.updates_via_social);
  const [photoConsent, setPhotoConsent] = useState(!!profile?.photo_consent_agreed_at);

  // Required acknowledgments
  const [privacyNoticeAgreed, setPrivacyNoticeAgreed] = useState(!!profile?.privacy_notice_agreed_at);
  const [ndaSignature, setNdaSignature] = useState(profile?.nda_signature ?? null);
  const [ndaDirty, setNdaDirty] = useState(false);

  const [error, setError] = useState(null);
  const [showSaved, setShowSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!ndaSignature) {
      setError('Please sign the Confidentiality and Non-Disclosure Agreement below before saving.');
      return;
    }

    if (!privacyNoticeAgreed) {
      setError('Please confirm you have read the PHFP Privacy Notice before saving.');
      return;
    }

    if (religion.trim() && !religionConsent) {
      setError('Please consent to processing your religion/spiritual affiliation, or leave that field blank.');
      return;
    }

    if (exceedsMaxUploadSize(avatarFile)) {
      setError(`Profile photo must be ${MAX_UPLOAD_LABEL} or smaller.`);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const fullName = `${firstName} ${lastName}`.trim() || profile?.full_name || '';

      let avatarPath = profile?.avatar_url ?? null;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        avatarPath = `${profile.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(avatarPath, avatarFile, { upsert: true });
        if (uploadError) {
          setError(uploadError.message);
          return;
        }
      }

      const now = new Date().toISOString();

      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarPath,
          full_name: fullName,
          first_name: firstName || null,
          last_name: lastName || null,
          phone: phone || null,
          city: city || null,
          state_region: stateRegion || null,
          country: country || null,
          nickname: nickname || null,
          birthdate: birthdate || null,
          address: address || null,
          fb_link: fbLink || null,
          profession: profession || null,
          company: company || null,
          religion: religion || null,
          religion_consent_agreed_at: religion.trim() ? (religionConsent ? (profile?.religion_consent_agreed_at ?? now) : null) : null,
          updates_via_text: updatesViaText,
          updates_via_email: updatesViaEmail,
          updates_via_social: updatesViaSocial,
          photo_consent_agreed_at: photoConsent ? (profile?.photo_consent_agreed_at ?? now) : null,
          privacy_notice_agreed_at: profile?.privacy_notice_agreed_at ?? now,
          nda_signature: ndaSignature,
          nda_agreed_at: ndaSignature ? (ndaDirty ? now : profile?.nda_agreed_at) : null,
        })
        .eq('id', profile.id);

      if (error) {
        setError(error.message);
        return;
      }

      setNdaDirty(false);
      setShowSaved(true);
      router.refresh();
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-8 rounded-2xl border border-brand-gold/40 bg-white/70 p-6 shadow-sm dark:bg-white/5"
      >
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-xs text-brand-ink/50">
          Fields marked <span className="text-red-600">*</span> are required — everything else is optional and
          won&apos;t stop you from using the app or enrolling in courses.
        </p>

        {/* -------------------------------------------------- */}
        {/* Personal information (required)                     */}
        {/* -------------------------------------------------- */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-brand-blue-dark">Personal Information</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <RequiredLabel>First Name</RequiredLabel>
              <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <RequiredLabel>Last Name</RequiredLabel>
              <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input value={profile?.email ?? ''} disabled className={`${inputClass} opacity-60`} />
            </div>
            <div>
              <RequiredLabel>Phone</RequiredLabel>
              <input required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </div>

            <div>
              <RequiredLabel>City</RequiredLabel>
              <input required value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
            </div>
            <div>
              <RequiredLabel>Province / Region</RequiredLabel>
              <input
                required
                value={stateRegion}
                onChange={(e) => setStateRegion(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <RequiredLabel>Country</RequiredLabel>
              <select required value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass}>
                <option value="">Select a country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- */}
        {/* Additional information (optional)                   */}
        {/* -------------------------------------------------- */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-brand-blue-dark">Additional Information</h2>
          <p className="text-xs text-brand-ink/50">
            Supports PHFP/community functions like attendance and networking — not required to use the app.
          </p>

          <div>
            <OptionalLabel>Profile Photo</OptionalLabel>
            <div className="mt-2 flex items-center gap-4">
              {avatarPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreviewUrl}
                  alt="Profile photo"
                  className="h-20 w-20 rounded-full border border-brand-blue/20 object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-brand-blue/30 bg-brand-blue/5 text-xs text-brand-ink/40">
                  No photo
                </div>
              )}
              <div>
                <label
                  htmlFor="avatar-file"
                  className="cursor-pointer rounded-full border border-brand-blue/30 bg-brand-blue/5 px-3 py-1.5 text-xs font-medium text-brand-blue transition-colors hover:border-brand-blue hover:bg-brand-blue/10"
                >
                  Choose Photo to Upload
                </label>
                <p className="mt-1.5 text-xs text-brand-ink/50">
                  {avatarFile ? avatarFile.name : 'No file chosen'} · Max {MAX_UPLOAD_LABEL}
                </p>
                <input
                  id="avatar-file"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setAvatarFile(file);
                    if (file) setAvatarPreviewUrl(URL.createObjectURL(file));
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <OptionalLabel>Nickname</OptionalLabel>
              <input value={nickname} onChange={(e) => setNickname(e.target.value)} className={inputClass} />
            </div>
            <div>
              <OptionalLabel>Date of Birth</OptionalLabel>
              <input
                type="date"
                value={birthdate ?? ''}
                onChange={(e) => setBirthdate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <OptionalLabel>Address</OptionalLabel>
              <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
            </div>

            <div>
              <OptionalLabel>Social Media Account</OptionalLabel>
              <input value={fbLink} onChange={(e) => setFbLink(e.target.value)} className={inputClass} />
            </div>
            <div>
              <OptionalLabel>Career / Profession</OptionalLabel>
              <input value={profession} onChange={(e) => setProfession(e.target.value)} className={inputClass} />
            </div>

            <div className="sm:col-span-2">
              <OptionalLabel>Company / Organization</OptionalLabel>
              <input value={company} onChange={(e) => setCompany(e.target.value)} className={inputClass} />
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- */}
        {/* Sensitive information (optional + specific consent) */}
        {/* -------------------------------------------------- */}
        <section className="space-y-2 rounded-xl border border-brand-flame/20 bg-brand-amber/5 p-4">
          <h2 className="text-lg font-semibold text-brand-blue-dark">Sensitive Information</h2>
          <div>
            <OptionalLabel>Religion / Spiritual or Philosophical Affiliation</OptionalLabel>
            <input value={religion} onChange={(e) => setReligion(e.target.value)} className={inputClass} />
          </div>
          <label className="flex items-start gap-2 pt-1 text-sm text-brand-ink/80">
            <input
              type="checkbox"
              checked={religionConsent}
              onChange={(e) => setReligionConsent(e.target.checked)}
              className="mt-0.5 accent-brand-blue"
            />
            <span>
              I consent to the processing of my religion/spiritual affiliation for the purposes explained in the
              Privacy Notice below. <span className="text-brand-ink/40">(optional — only needed if you fill this in)</span>
            </span>
          </label>
        </section>

        {/* -------------------------------------------------- */}
        {/* Communications (optional)                           */}
        {/* -------------------------------------------------- */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-brand-blue-dark">Communications</h2>
          <p className="text-xs text-brand-ink/50">
            Optional — choose how, if at all, you&apos;d like to receive PHFP updates and announcements.
          </p>
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm text-brand-ink/80">
              <input
                type="checkbox"
                checked={updatesViaText}
                onChange={(e) => setUpdatesViaText(e.target.checked)}
                className="accent-brand-blue"
              />
              Text
            </label>
            <label className="flex items-center gap-2 text-sm text-brand-ink/80">
              <input
                type="checkbox"
                checked={updatesViaEmail}
                onChange={(e) => setUpdatesViaEmail(e.target.checked)}
                className="accent-brand-blue"
              />
              Email
            </label>
            <label className="flex items-center gap-2 text-sm text-brand-ink/80">
              <input
                type="checkbox"
                checked={updatesViaSocial}
                onChange={(e) => setUpdatesViaSocial(e.target.checked)}
                className="accent-brand-blue"
              />
              Social Media
            </label>
          </div>
        </section>

        {/* -------------------------------------------------- */}
        {/* Photos / Publicity (optional)                       */}
        {/* -------------------------------------------------- */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-brand-blue-dark">Photos / Publicity</h2>
          <label className="flex items-start gap-2 text-sm text-brand-ink/80">
            <input
              type="checkbox"
              checked={photoConsent}
              onChange={(e) => setPhotoConsent(e.target.checked)}
              className="mt-0.5 accent-brand-blue"
            />
            <span>
              I consent to PHFP using my photographs/videos for public promotional or educational materials.{' '}
              <span className="text-brand-ink/40">(optional)</span>
            </span>
          </label>
        </section>

        {/* -------------------------------------------------- */}
        {/* Privacy notice (required acknowledgment)             */}
        {/* -------------------------------------------------- */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-blue-dark">
            General Privacy Notice <span className="text-red-600">*</span>
          </h2>
          <div className="max-h-56 space-y-3 overflow-y-auto rounded-lg border border-brand-gold/40 bg-brand-amber/5 p-4 text-sm leading-relaxed text-brand-ink/80">
            {PRIVACY_NOTICE_PARAGRAPHS.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <label className="flex items-start gap-2 text-sm text-brand-ink/80">
            <input
              type="checkbox"
              checked={privacyNoticeAgreed}
              onChange={(e) => setPrivacyNoticeAgreed(e.target.checked)}
              className="mt-0.5 accent-brand-blue"
            />
            <span>
              I have read the PHFP Privacy Notice. <span className="text-red-600">*</span>
            </span>
          </label>
        </section>

        {/* -------------------------------------------------- */}
        {/* NDA                                                 */}
        {/* -------------------------------------------------- */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-blue-dark">
            Confidentiality and Non-Disclosure Agreement <span className="text-red-600">*</span>
          </h2>
          <div className="max-h-56 space-y-3 overflow-y-auto rounded-lg border border-brand-gold/40 bg-brand-amber/5 p-4 text-sm leading-relaxed text-brand-ink/80">
            {NDA_PARAGRAPHS.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <SignaturePad
            value={profile?.nda_signature ?? null}
            signedAt={profile?.nda_agreed_at}
            onChange={(dataUrl) => {
              setNdaSignature(dataUrl);
              setNdaDirty(true);
            }}
          />
        </section>

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-brand-blue px-5 py-2 font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save Profile'}
        </button>
      </form>

      <SuccessModal
        open={showSaved}
        title="Profile saved"
        message="Your changes have been saved."
        onClose={() => setShowSaved(false)}
      />
    </>
  );
}
