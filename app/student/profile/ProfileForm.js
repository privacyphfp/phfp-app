'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { COUNTRIES } from '@/lib/countries';
import SignaturePad from '@/components/SignaturePad';
import SuccessModal from '@/components/SuccessModal';
import { NDA_PARAGRAPHS } from '@/lib/ndaText';
import { exceedsMaxUploadSize, MAX_UPLOAD_LABEL } from '@/lib/fileUpload';

// A leaner, plain-language replacement for the old "Data Protection and
// Privacy" consent text, still signed the same way (SignaturePad). Signing
// this (required for any save) is what covers optional/sensitive uses too
// — e.g. religion data — rather than a separate signature per field, so
// declining to fill in an optional field never blocks basic use of the app.
const PRIVACY_NOTICE_PARAGRAPHS = [
  `The Pranic Healing Foundation of the Philippines (PHFP) collects only the personal data needed to run your student account and your course enrollments, in line with the Data Privacy Act of 2012 (RA 10173).`,
  `Required — First Name, Last Name, Email, Phone, City, Province/Region, and Country are needed to create your account, process enrollments, and reach you about the courses you sign up for.`,
  `Optional — Profile Photo, Nickname, Date of Birth, Address, Social Media Account, Profession, and Company/Organization support administrative and community functions (e.g. attendance, ID verification, networking). You can use the app without providing these.`,
  `Your profile photo is private — visible only to you and to authorized PHFP staff/admins. It is never made public or used for promotional purposes.`,
  `Sensitive — Religion / spiritual or philosophical affiliation is only collected and used if you choose to share it. Filling it in and signing below is your consent to that specific use.`,
  `Your data is accessible only to authorized PHFP staff and instructors administering your courses. We do not sell, rent, lease, or share it with third parties outside PHFP without your consent, except where required by law.`,
  `You may access, correct, or request deletion of your data, and withdraw any consent you've given — for communications or religion data — at any time by emailing pranichealingphilippines@yahoo.com. Withdrawing consent will not affect your ability to use your basic student account.`,
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

  // Sensitive — consent for this is covered by the General Privacy Notice
  // acknowledgment below, not a separate checkbox (see PRIVACY_NOTICE_PARAGRAPHS).
  const [religion, setReligion] = useState(profile?.religion ?? '');

  // Optional opt-in consents
  const [updatesViaText, setUpdatesViaText] = useState(!!profile?.updates_via_text);
  const [updatesViaEmail, setUpdatesViaEmail] = useState(!!profile?.updates_via_email);
  const [updatesViaSocial, setUpdatesViaSocial] = useState(!!profile?.updates_via_social);

  // Required acknowledgments — signed, like the NDA, rather than just
  // checked off. Reuses the profiles.privacy_signature/privacy_agreed_at
  // columns from the original consent form.
  const [privacySignature, setPrivacySignature] = useState(profile?.privacy_signature ?? null);
  const [privacyDirty, setPrivacyDirty] = useState(false);
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

    if (!privacySignature) {
      setError('Please sign the Data Privacy Consent below before saving.');
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
          // Consenting to the Privacy Notice below (required for any save)
          // covers consent for religion data too, if the field is filled in.
          religion_consent_agreed_at: religion.trim() ? (profile?.religion_consent_agreed_at ?? now) : null,
          updates_via_text: updatesViaText,
          updates_via_email: updatesViaEmail,
          updates_via_social: updatesViaSocial,
          privacy_signature: privacySignature,
          privacy_agreed_at: privacySignature ? (privacyDirty ? now : profile?.privacy_agreed_at) : null,
          privacy_notice_agreed_at: privacySignature ? (profile?.privacy_notice_agreed_at ?? now) : null,
          nda_signature: ndaSignature,
          nda_agreed_at: ndaSignature ? (ndaDirty ? now : profile?.nda_agreed_at) : null,
        })
        .eq('id', profile.id);

      if (error) {
        setError(error.message);
        return;
      }

      setPrivacyDirty(false);
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
        {/* Profile photo                                       */}
        {/* -------------------------------------------------- */}
        <div className="flex items-center gap-4">
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

        {/* -------------------------------------------------- */}
        {/* Personal information                                */}
        {/* -------------------------------------------------- */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-brand-blue-dark">Personal Information</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Name */}
            <div>
              <RequiredLabel>First Name</RequiredLabel>
              <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <RequiredLabel>Last Name</RequiredLabel>
              <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nickname</label>
              <input value={nickname} onChange={(e) => setNickname(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Date of Birth</label>
              <input
                type="date"
                value={birthdate ?? ''}
                onChange={(e) => setBirthdate(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Contact */}
            <div>
              <label className={labelClass}>Email</label>
              <input value={profile?.email ?? ''} disabled className={`${inputClass} opacity-60`} />
            </div>
            <div>
              <RequiredLabel>Phone</RequiredLabel>
              <input required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Social Media Account</label>
              <input value={fbLink} onChange={(e) => setFbLink(e.target.value)} className={inputClass} />
            </div>

            {/* Location — kept together */}
            <div className="sm:col-span-2">
              <label className={labelClass}>Address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
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
            <div className="sm:col-span-2">
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

            {/* Work */}
            <div>
              <label className={labelClass}>Career / Profession</label>
              <input value={profession} onChange={(e) => setProfession(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Company / Organization</label>
              <input value={company} onChange={(e) => setCompany(e.target.value)} className={inputClass} />
            </div>

            {/* Religion */}
            <div className="sm:col-span-2">
              <label className={labelClass}>Religion / Spiritual or Philosophical Affiliation</label>
              <input value={religion} onChange={(e) => setReligion(e.target.value)} className={inputClass} />
            </div>
          </div>
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
        {/* Data Privacy Consent (required signature)            */}
        {/* -------------------------------------------------- */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-blue-dark">
            Data Privacy Consent <span className="text-red-600">*</span>
          </h2>
          <div className="max-h-56 space-y-3 overflow-y-auto rounded-lg border border-brand-gold/40 bg-brand-amber/5 p-4 text-sm leading-relaxed text-brand-ink/80">
            {PRIVACY_NOTICE_PARAGRAPHS.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <SignaturePad
            value={profile?.privacy_signature ?? null}
            signedAt={profile?.privacy_agreed_at}
            onChange={(dataUrl) => {
              setPrivacySignature(dataUrl);
              setPrivacyDirty(true);
            }}
          />
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
