// Shared cap for every file a student or staff member uploads/attaches
// anywhere in the app (avatar photo, certificate, payment proof, receipt).
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_UPLOAD_LABEL = '5 MB';

export function exceedsMaxUploadSize(file) {
  return !!file && file.size > MAX_UPLOAD_BYTES;
}
