'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { downloadCsv } from '@/lib/csv';
import { formatInstructorName } from '@/lib/formatInstructor';

const TABS = [
  { key: 'export', label: 'Student & Enrollment Export' },
  { key: 'summary', label: 'Class Summary' },
  { key: 'payments', label: 'Payment & Balance' },
];

export default function ReportsPanel({ courses }) {
  const [tab, setTab] = useState('export');

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-brand-gold/30 pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-brand-blue text-white'
                : 'border border-brand-blue/30 text-brand-ink/70 hover:border-brand-blue hover:text-brand-blue'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'export' && <StudentExportTab />}
        {tab === 'summary' && <ClassSummaryTab courses={courses} />}
        {tab === 'payments' && <PaymentBalanceTab courses={courses} />}
      </div>
    </div>
  );
}

// ============================================================
// Tab 1: flexible student + enrollment column export
// ============================================================

const COLUMN_GROUPS = [
  {
    label: 'Student details',
    columns: [
      ['full_name', 'Full Name', true],
      ['first_name', 'First Name', false],
      ['last_name', 'Last Name', false],
      ['nickname', 'Nickname', false],
      ['birthdate', 'Birthdate', false],
      ['address', 'Address', false],
      ['city', 'City', false],
      ['state_region', 'State / Province / Region', false],
      ['country', 'Country', false],
      ['phone', 'Phone', false],
      ['email', 'Email', false],
      ['fb_link', 'FB Account or Link', false],
      ['religion', 'Religion', false],
      ['profession', 'Career / Profession', false],
      ['company', 'Company / Organization', false],
    ],
  },
  {
    label: 'Course & class',
    columns: [
      ['course_name', 'Course', true],
      ['course_code', 'Course Code', true],
      ['center', 'Center', true],
      ['date_of_course', 'Date of Course', true],
      ['instructor', 'Instructor Name', true],
      ['new_or_review', 'New / Review', true],
      ['referred_by', 'Referred By', false],
      ['status', 'Enrollment Status', false],
    ],
  },
  {
    label: 'Certificate',
    columns: [
      ['certificate_number', 'Certificate #', false],
      ['date_graduated', 'Date Graduated', false],
    ],
  },
  {
    label: 'Payment',
    columns: [
      ['amount_paid', 'Amount Paid', false],
      ['payment_verified', 'Payment Verified', false],
      ['tithe_amount', 'Tithe Amount', false],
    ],
  },
];
const ALL_COLUMNS = COLUMN_GROUPS.flatMap((g) => g.columns);

function StudentExportTab() {
  const [checked, setChecked] = useState(() => Object.fromEntries(ALL_COLUMNS.map(([key, , def]) => [key, def])));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(null);

  function toggle(key) {
    setChecked((c) => ({ ...c, [key]: !c[key] }));
  }
  function setAll(value) {
    setChecked(Object.fromEntries(ALL_COLUMNS.map(([key]) => [key, value])));
  }

  async function runExport() {
    setLoading(true);
    setError(null);
    setCount(null);

    try {
      const supabase = createClient();

      const [{ data: enrollments, error: enrollError }, { data: certificates, error: certError }] = await Promise.all([
        supabase
          .from('enrollments')
          .select(
            `id, status, enrollment_type, referred_by, tithe_amount, amount_paid, payment_verified, student_id,
             profiles ( full_name, first_name, last_name, nickname, birthdate, address, city, state_region, country, phone, email, fb_link, religion, profession, company ),
             course_offerings ( start_date, price, course_id, instructor_id, instructor_name, courses ( code, name ), regions ( name ) )`
          ),
        supabase.from('certificates').select('student_id, course_id, certificate_number, issued_date, verified'),
      ]);
      if (enrollError) {
        setError(enrollError.message);
        return;
      }
      if (certError) {
        setError(certError.message);
        return;
      }

      const certByKey = new Map();
      for (const c of certificates ?? []) {
        const key = `${c.student_id}|${c.course_id}`;
        const existing = certByKey.get(key);
        if (!existing || (c.verified && !existing.verified)) certByKey.set(key, c);
      }

      const instructorIds = [
        ...new Set((enrollments ?? []).map((e) => e.course_offerings?.instructor_id).filter(Boolean)),
      ];
      const { data: instructorProfiles } = instructorIds.length
        ? await supabase.from('profiles').select('id, full_name, first_name, last_name').in('id', instructorIds)
        : { data: [] };
      const instructorById = Object.fromEntries((instructorProfiles ?? []).map((p) => [p.id, p]));

      function instructorLabel(o) {
        if (o?.instructor_id) {
          const p = instructorById[o.instructor_id];
          return p ? formatInstructorName(p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ')) : '';
        }
        return formatInstructorName(o?.instructor_name) || '';
      }

      const rows = (enrollments ?? []).map((e) => {
        const p = e.profiles ?? {};
        const o = e.course_offerings ?? {};
        const cert = certByKey.get(`${e.student_id}|${o.course_id}`);
        return {
          full_name: p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' '),
          first_name: p.first_name,
          last_name: p.last_name,
          nickname: p.nickname,
          birthdate: p.birthdate,
          address: p.address,
          city: p.city,
          state_region: p.state_region,
          country: p.country,
          phone: p.phone,
          email: p.email,
          fb_link: p.fb_link,
          religion: p.religion,
          profession: p.profession,
          company: p.company,
          course_name: o.courses?.name,
          course_code: o.courses?.code,
          center: o.regions?.name,
          date_of_course: o.start_date,
          instructor: instructorLabel(o),
          new_or_review: e.enrollment_type === 'review' ? 'Review' : 'New',
          referred_by: e.referred_by,
          status: e.status,
          certificate_number: cert?.certificate_number,
          date_graduated: cert?.issued_date,
          amount_paid: e.amount_paid,
          payment_verified: e.payment_verified ? 'Yes' : 'No',
          tithe_amount: e.tithe_amount,
        };
      });

      const activeColumns = ALL_COLUMNS.filter(([key]) => checked[key]);
      if (!activeColumns.length) {
        setError('Select at least one column first.');
        return;
      }
      const header = activeColumns.map(([, label]) => label);
      const csvRows = rows.map((row) => activeColumns.map(([key]) => row[key]));
      downloadCsv(`phfp-student-export-${new Date().toISOString().slice(0, 10)}`, header, csvRows);
      setCount(rows.length);
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-brand-ink/60">Pick the columns to include, then export every enrollment as CSV.</p>
        <div className="flex gap-2 text-xs">
          <button type="button" onClick={() => setAll(true)} className="text-brand-blue hover:underline">
            Select all
          </button>
          <span className="text-brand-ink/30">·</span>
          <button type="button" onClick={() => setAll(false)} className="text-brand-blue hover:underline">
            Clear
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COLUMN_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold tracking-wide text-brand-ink/40 uppercase">{group.label}</p>
            <div className="mt-2 space-y-1.5">
              {group.columns.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-brand-ink/80">
                  <input type="checkbox" checked={!!checked[key]} onChange={() => toggle(key)} className="accent-brand-blue" />
                  {label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={runExport}
          disabled={loading}
          className="rounded-full bg-brand-blue px-5 py-2 text-sm font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark disabled:opacity-50"
        >
          {loading ? 'Exporting…' : 'Export CSV'}
        </button>
        {count != null && <span className="ml-3 text-sm text-brand-ink/50">Exported {count} rows.</span>}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}

// ============================================================
// Tab 2: classes conducted + new/review totals per course, for a date range
// ============================================================

function DateRangeInputs({ from, to, setFrom, setTo }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-sm text-brand-ink/70">
        From
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="mt-1 block rounded-lg border border-brand-blue/20 px-3 py-1.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900"
        />
      </label>
      <label className="text-sm text-brand-ink/70">
        To
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="mt-1 block rounded-lg border border-brand-blue/20 px-3 py-1.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900"
        />
      </label>
    </div>
  );
}

function ClassSummaryTab() {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(today);
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function run() {
    setLoading(true);
    setError(null);
    setRows(null);

    try {
      const supabase = createClient();
      const { data: offerings, error: offerError } = await supabase
        .from('course_offerings')
        .select('id, start_date, course_id, courses ( code, name )')
        .gte('start_date', from)
        .lte('start_date', to);
      if (offerError) {
        setError(offerError.message);
        return;
      }

      const offeringIds = (offerings ?? []).map((o) => o.id);
      const { data: enrollments, error: enrollError } = offeringIds.length
        ? await supabase.from('enrollments').select('course_offering_id, enrollment_type').in('course_offering_id', offeringIds)
        : { data: [] };
      if (enrollError) {
        setError(enrollError.message);
        return;
      }

      const offeringToCourse = Object.fromEntries((offerings ?? []).map((o) => [o.id, o.course_id]));
      const byCourse = new Map();
      for (const o of offerings ?? []) {
        const key = o.course_id;
        if (!byCourse.has(key)) byCourse.set(key, { course: o.courses, classes: 0, newCount: 0, reviewCount: 0 });
        byCourse.get(key).classes += 1;
      }
      for (const e of enrollments ?? []) {
        const courseId = offeringToCourse[e.course_offering_id];
        const entry = byCourse.get(courseId);
        if (!entry) continue;
        if (e.enrollment_type === 'review') entry.reviewCount += 1;
        else entry.newCount += 1;
      }

      setRows(
        [...byCourse.values()].sort((a, b) => (a.course?.code || '').localeCompare(b.course?.code || ''))
      );
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    if (!rows) return;
    const header = ['Course', 'Course Code', 'Classes Conducted', 'New', 'Review', 'Total Enrollments'];
    const csvRows = rows.map((r) => [
      r.course?.name,
      r.course?.code,
      r.classes,
      r.newCount,
      r.reviewCount,
      r.newCount + r.reviewCount,
    ]);
    downloadCsv(`phfp-class-summary-${from}-to-${to}`, header, csvRows);
  }

  return (
    <div>
      <p className="text-sm text-brand-ink/60">
        Classes conducted per course, and how many were new vs. review enrollments, within a date range.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <DateRangeInputs from={from} to={to} setFrom={setFrom} setTo={setTo} />
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="rounded-full bg-brand-blue px-5 py-2 text-sm font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark disabled:opacity-50"
        >
          {loading ? 'Running…' : 'Run Report'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {rows && (
        <div className="mt-6">
          <div className="overflow-x-auto rounded-xl border border-brand-blue/15">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-blue/5 text-xs font-semibold tracking-wide text-brand-ink/50 uppercase">
                <tr>
                  <th className="px-3 py-2">Course</th>
                  <th className="px-3 py-2">Classes Conducted</th>
                  <th className="px-3 py-2">New</th>
                  <th className="px-3 py-2">Review</th>
                  <th className="px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.course?.code} className="border-t border-brand-blue/10">
                    <td className="px-3 py-2 font-medium text-brand-ink">{r.course?.name || r.course?.code}</td>
                    <td className="px-3 py-2">{r.classes}</td>
                    <td className="px-3 py-2">{r.newCount}</td>
                    <td className="px-3 py-2">{r.reviewCount}</td>
                    <td className="px-3 py-2">{r.newCount + r.reviewCount}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-brand-ink/50">
                      No classes in this range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={exportCsv} className="mt-3 text-sm text-brand-blue hover:underline">
            Export CSV →
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Tab 3: per-student payment status + balance/tithe for one course
// ============================================================

function PaymentBalanceTab({ courses }) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function run() {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    setRows(null);

    try {
      const supabase = createClient();
      const { data: offerings, error: offerError } = await supabase
        .from('course_offerings')
        .select('id, start_date, price')
        .eq('course_id', courseId);
      if (offerError) {
        setError(offerError.message);
        return;
      }

      const offeringById = Object.fromEntries((offerings ?? []).map((o) => [o.id, o]));
      const offeringIds = Object.keys(offeringById);

      const { data: enrollments, error: enrollError } = offeringIds.length
        ? await supabase
            .from('enrollments')
            .select(
              'course_offering_id, enrollment_type, amount_paid, payment_verified, tithe_amount, profiles ( full_name, first_name, last_name )'
            )
            .in('course_offering_id', offeringIds)
        : { data: [] };
      if (enrollError) {
        setError(enrollError.message);
        return;
      }

      setRows(
        (enrollments ?? []).map((e) => {
          const o = offeringById[e.course_offering_id];
          const price = o?.price ?? 0;
          const paid = e.amount_paid ?? 0;
          return {
            name: e.profiles?.full_name || [e.profiles?.first_name, e.profiles?.last_name].filter(Boolean).join(' '),
            date: o?.start_date,
            type: e.enrollment_type === 'review' ? 'Review' : 'New',
            amountPaid: e.amount_paid,
            price: e.enrollment_type === 'review' ? null : price,
            balance: e.enrollment_type === 'review' ? null : Math.max(price - paid, 0),
            tithe: e.enrollment_type === 'review' ? e.tithe_amount : null,
            verified: e.payment_verified,
          };
        })
      );
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    if (!rows) return;
    const course = courses.find((c) => c.id === courseId);
    const header = ['Student', 'Course Code', 'Class Date', 'Type', 'Amount Paid', 'Price', 'Balance', 'Tithe Amount', 'Payment Verified'];
    const csvRows = rows.map((r) => [
      r.name,
      course?.code,
      r.date,
      r.type,
      r.amountPaid,
      r.price,
      r.balance,
      r.tithe,
      r.verified ? 'Yes' : 'No',
    ]);
    downloadCsv(`phfp-payments-${course?.code || courseId}`, header, csvRows);
  }

  return (
    <div>
      <p className="text-sm text-brand-ink/60">
        Pick a course to see every student&apos;s payment status — amount paid, remaining balance for New
        enrollments, and self-valued tithe for Review enrollments.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <label className="text-sm text-brand-ink/70">
          Course
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="mt-1 block rounded-lg border border-brand-blue/20 px-3 py-1.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={run}
          disabled={loading || !courseId}
          className="rounded-full bg-brand-blue px-5 py-2 text-sm font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark disabled:opacity-50"
        >
          {loading ? 'Running…' : 'Run Report'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {rows && (
        <div className="mt-6">
          <div className="overflow-x-auto rounded-xl border border-brand-blue/15">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-blue/5 text-xs font-semibold tracking-wide text-brand-ink/50 uppercase">
                <tr>
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Amount Paid</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Balance</th>
                  <th className="px-3 py-2">Tithe</th>
                  <th className="px-3 py-2">Verified</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-brand-blue/10">
                    <td className="px-3 py-2 font-medium text-brand-ink">{r.name}</td>
                    <td className="px-3 py-2">{r.date}</td>
                    <td className="px-3 py-2">{r.type}</td>
                    <td className="px-3 py-2">{r.amountPaid != null ? `₱${r.amountPaid}` : '—'}</td>
                    <td className="px-3 py-2">{r.price != null ? `₱${r.price}` : '—'}</td>
                    <td className="px-3 py-2">
                      {r.balance != null ? (
                        <span className={r.balance > 0 ? 'text-brand-flame' : 'text-brand-blue'}>₱{r.balance}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-2">{r.tithe != null ? `₱${r.tithe}` : '—'}</td>
                    <td className="px-3 py-2">{r.verified ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={8} className="px-3 py-4 text-center text-brand-ink/50">
                      No enrollments for this course yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={exportCsv} className="mt-3 text-sm text-brand-blue hover:underline">
            Export CSV →
          </button>
        </div>
      )}
    </div>
  );
}
