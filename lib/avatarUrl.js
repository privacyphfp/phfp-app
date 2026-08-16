// Avatars live in a private storage bucket, so displaying one requires a
// short-lived signed URL generated server-side rather than a public link.
export async function signAvatarUrl(supabase, avatarPath) {
  if (!avatarPath) return null;
  const { data } = await supabase.storage.from('avatars').createSignedUrl(avatarPath, 3600);
  return data?.signedUrl ?? null;
}
