// Certificates live in a private storage bucket, so viewing one requires a
// short-lived signed URL generated server-side rather than a public link.
export async function signCertificateUrls(supabase, certificates) {
  return Promise.all(
    certificates.map(async (c) => {
      if (!c.file_url) return { ...c, signedUrl: null };
      const { data } = await supabase.storage.from('certificates').createSignedUrl(c.file_url, 3600);
      return { ...c, signedUrl: data?.signedUrl ?? null };
    })
  );
}
