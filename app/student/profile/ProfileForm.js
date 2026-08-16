'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { COUNTRIES } from '@/lib/countries';
import SignaturePad from '@/components/SignaturePad';

const NDA_PARAGRAPHS = [
  `To preserve these sacred teachings in their purest form, and to prevent the incorrect practice and harm to persons incorrectly/inadequately instructed, I promise with no mental reservation that I will not infringe on the copyright of the intellectual property, work and material from the MCKS Course I am attending by transmitting, teaching, recording, copying or reproducing in any form or means, whether in part or as a whole, the techniques and teachings there under without prior written consent from the copyright and trade name owner.`,
  `Nothing contained in the courses and teachings shall be construed as granting or implying any transfer of proprietary rights to me of the teachings and techniques, or any patents or other intellectual property protecting or relating to the techniques and teachings.`,
  `I hereby certify that I am of sound mind and in good physical and mental health so as to permit me to undertake this course.`,
  `I waive any rights to sue the Institute for Inner Studies Limited and the Pranic Healing Foundation of the Philippines, or any of the instructors for any physical, emotional or psychological problems that may result from the training or which I believe may have been caused by the training.`,
  `This Agreement shall be binding upon, inure to the benefit of, and be enforceable by the Institute for Inner Studies, its successors, and assigns; and the undersigned, my successors and assigns.`,
];

const PRIVACY_PARAGRAPHS = [
  `1. I agree to allow the Pranic Healing Foundation of the Philippines to transmit my personal data provided in the IIS system for Master Choa Kok Sui (MCKS) courses, namely name, address, email address, date of birth, phone number to the Institute for Inner Studies for student record purposes, namely to save them in the respective Instructor's or Organizer's database to create profile about each student;`,
  `2. I further give my consent for the release and use of my personal information, namely my name, address, email address, contact number and the MCKS Courses that I will or had studied from my previous Instructors or respective organizers of my attended or future attendance of MCKS Courses to be transmitted to IIS for its record purposes of each student.`,
  `3. My personal data will not be transmitted to any other third party without my permission.`,
  `4. My consent shall remain in force until I withdraw it. I can withdraw this consent at any time without giving any reasons with effect for the future in writing or by email to pranichealingphilippines@yahoo.com or info@globalpranichealing.com or to the email address of the Instructor or Organizer`,
  `5. I have read and understood the contents of this Consent for Release and Transmission of Personal Data and Information. I further declare that this consent has been given voluntarily and with full knowledge of its significance.`,
  `6. I have read and understood the enclosed Data Protection and Privacy Policy.`,
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

  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [lastName, setLastName] = useState(profile?.last_name ?? '');
  const [nickname, setNickname] = useState(profile?.nickname ?? '');
  const [birthdate, setBirthdate] = useState(profile?.birthdate ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [stateRegion, setStateRegion] = useState(profile?.state_region ?? '');
  const [country, setCountry] = useState(profile?.country ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [fbLink, setFbLink] = useState(profile?.fb_link ?? '');
  const [religion, setReligion] = useState(profile?.religion ?? '');
  const [profession, setProfession] = useState(profile?.profession ?? '');
  const [company, setCompany] = useState(profile?.company ?? '');

  const [updatesViaText, setUpdatesViaText] = useState(!!profile?.updates_via_text);
  const [updatesViaEmail, setUpdatesViaEmail] = useState(!!profile?.updates_via_email);
  const [updatesViaSocial, setUpdatesViaSocial] = useState(!!profile?.updates_via_social);

  const [ndaSignature, setNdaSignature] = useState(profile?.nda_signature ?? null);
  const [ndaDirty, setNdaDirty] = useState(false);
  const [privacySignature, setPrivacySignature] = useState(profile?.privacy_signature ?? null);
  const [privacyDirty, setPrivacyDirty] = useState(false);

  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!ndaSignature || !privacySignature) {
      setError('Please sign both agreements below before saving.');
      return;
    }

    if (!avatarFile && !profile?.avatar_url) {
      setError('Please upload a profile photo.');
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

      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarPath,
          full_name: fullName,
          first_name: firstName || null,
          last_name: lastName || null,
          nickname: nickname || null,
          birthdate: birthdate || null,
          address: address || null,
          city: city || null,
          state_region: stateRegion || null,
          country: country || null,
          phone: phone || null,
          fb_link: fbLink || null,
          religion: religion || null,
          profession: profession || null,
          company: company || null,
          updates_via_text: updatesViaText,
          updates_via_email: updatesViaEmail,
          updates_via_social: updatesViaSocial,
          nda_signature: ndaSignature,
          nda_agreed_at: ndaSignature ? (ndaDirty ? new Date().toISOString() : profile?.nda_agreed_at) : null,
          privacy_signature: privacySignature,
          privacy_agreed_at: privacySignature
            ? (privacyDirty ? new Date().toISOString() : profile?.privacy_agreed_at)
            : null,
        })
        .eq('id', profile.id);

      if (error) {
        setError(error.message);
        return;
      }

      setNdaDirty(false);
      setPrivacyDirty(false);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 rounded-2xl border border-brand-gold/40 bg-white/70 p-6 shadow-sm dark:bg-white/5"
    >
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-brand-blue">Profile saved.</p>}
      <p className="text-xs text-brand-ink/50">
        Fields marked <span className="text-red-600">*</span> are required before you can enroll in a course.
      </p>

      <p className="text-sm italic text-brand-ink/60">
        Any data you share with us will remain confidential and accessible only to authorized employees, as
        governed by appropriate Data Sharing Agreements of current laws. They will not be sold, rented, or
        leased, offered, published, transferred or shared with any third-party.
      </p>

      {/* -------------------------------------------------- */}
      {/* Personal information                                */}
      {/* -------------------------------------------------- */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-brand-blue-dark">Personal Information</h2>

        <div>
          <RequiredLabel>Profile Photo</RequiredLabel>
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
            <RequiredLabel>First Name</RequiredLabel>
            <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <RequiredLabel>Last Name</RequiredLabel>
            <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
          </div>

          <div>
            <RequiredLabel>Nickname</RequiredLabel>
            <input required value={nickname} onChange={(e) => setNickname(e.target.value)} className={inputClass} />
          </div>
          <div>
            <RequiredLabel>Date of Birth</RequiredLabel>
            <input
              required
              type="date"
              value={birthdate ?? ''}
              onChange={(e) => setBirthdate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <RequiredLabel>Address</RequiredLabel>
            <input required value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
          </div>

          <div>
            <RequiredLabel>City</RequiredLabel>
            <input required value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
          </div>
          <div>
            <RequiredLabel>State / Province / Region</RequiredLabel>
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
          <div>
            <RequiredLabel>Phone</RequiredLabel>
            <input required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input value={profile?.email ?? ''} disabled className={`${inputClass} opacity-60`} />
          </div>
          <div>
            <RequiredLabel>FB Account or Link</RequiredLabel>
            <input required value={fbLink} onChange={(e) => setFbLink(e.target.value)} className={inputClass} />
          </div>

          <div>
            <RequiredLabel>Religion</RequiredLabel>
            <input required value={religion} onChange={(e) => setReligion(e.target.value)} className={inputClass} />
          </div>
          <div>
            <RequiredLabel>Career / Profession</RequiredLabel>
            <input required value={profession} onChange={(e) => setProfession(e.target.value)} className={inputClass} />
          </div>

          <div className="sm:col-span-2">
            <RequiredLabel>Company / Organization</RequiredLabel>
            <input required value={company} onChange={(e) => setCompany(e.target.value)} className={inputClass} />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* Communication preferences                           */}
      {/* -------------------------------------------------- */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-brand-blue-dark">How would you like to receive updates?</h2>
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

      {/* -------------------------------------------------- */}
      {/* Data protection and privacy                         */}
      {/* -------------------------------------------------- */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-blue-dark">
          Data Protection and Privacy <span className="text-red-600">*</span>
        </h2>
        <div className="max-h-56 space-y-3 overflow-y-auto rounded-lg border border-brand-gold/40 bg-brand-amber/5 p-4 text-sm leading-relaxed text-brand-ink/80">
          {PRIVACY_PARAGRAPHS.map((p, i) => (
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

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-brand-blue px-5 py-2 font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Save Profile'}
      </button>
    </form>
  );
}
