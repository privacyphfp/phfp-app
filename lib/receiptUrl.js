// Receipts live in a private storage bucket, so viewing one requires a
// short-lived signed URL generated server-side rather than a public link.
export async function signReceiptUrls(supabase, enrollments) {
  return Promise.all(
    enrollments.map(async (e) => {
      if (!e.receipt_url) return { ...e, receiptSignedUrl: null };
      const { data } = await supabase.storage.from('receipts').createSignedUrl(e.receipt_url, 3600);
      return { ...e, receiptSignedUrl: data?.signedUrl ?? null };
    })
  );
}
