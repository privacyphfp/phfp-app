import { requireProfile } from '@/lib/auth';
import { signAvatarUrl } from '@/lib/avatarUrl';
import ProfileForm from './ProfileForm';

export default async function ProfilePage() {
  const { supabase, profile } = await requireProfile(['student', 'volunteer', 'admin']);
  const avatarSignedUrl = await signAvatarUrl(supabase, profile?.avatar_url);

  return (
    <div className="mx-auto w-full max-w-2xl p-8">
      <h1 className="text-2xl font-semibold text-brand-blue-dark">My Profile</h1>
      <p className="mt-1 text-sm text-brand-ink/60">
        Keep your details up to date — this is what PHFP staff will see for your account.
      </p>
      <div className="mt-6">
        <ProfileForm profile={profile} avatarSignedUrl={avatarSignedUrl} />
      </div>
    </div>
  );
}
