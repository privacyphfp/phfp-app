import { formatCourseDateRange } from '@/lib/dateRange';

// Sent to the student right after they enroll — confirms it was
// received (not that payment is verified, that's a separate step staff
// does). The GUIDELINES section below is a placeholder — add whatever
// pre-class instructions, what-to-bring, venue details, etc. belong here
// once you have them; it's plain HTML so anything works (a list, a link
// to a PDF, an embedded map, whatever).
export function enrollmentConfirmationEmail({ studentName, courseName, startDate, endDate, location, isOnline, isReview }) {
  const dateRange = formatCourseDateRange(startDate, endDate);
  const where = isOnline ? 'Online' : location || 'To be confirmed';

  const subject = `Enrollment received — ${courseName}`;

  const html = `
    <p>Hi ${studentName || 'there'},</p>
    <p>We've received your enrollment for <strong>${courseName}</strong>${isReview ? ' (Review)' : ''}.</p>
    <p>
      📅 ${dateRange}<br/>
      📍 ${where}
    </p>
    <p>Our team will verify your payment shortly — you'll see it reflected on your dashboard once confirmed.</p>

    <!-- GUIDELINES PLACEHOLDER — replace this paragraph with what to
         bring, what to expect, venue directions, etc. -->
    <p><em>Guidelines and what to prepare before class will be added here.</em></p>

    <p>See you there!<br/>PHFP</p>
  `;

  return { subject, html };
}
