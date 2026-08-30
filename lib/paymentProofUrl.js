// Payment proofs (bank transfer / credit card slips students upload when
// enrolling) live in a private storage bucket, so viewing one requires a
// short-lived signed URL generated server-side rather than a public link.
export async function signPaymentProofUrls(supabase, enrollments) {
  return Promise.all(
    enrollments.map(async (e) => {
      if (!e.payment_proof_url) return { ...e, paymentProofSignedUrl: null };
      const { data } = await supabase.storage.from('payment_proofs').createSignedUrl(e.payment_proof_url, 3600);
      return { ...e, paymentProofSignedUrl: data?.signedUrl ?? null };
    })
  );
}
