'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { downloadCsv } from '@/lib/csv';
import { formatInstructorName } from '@/lib/formatInstructor';

const TABS = [
  { key: 'export', label: 'Student & Enrollment Export' },
  { key: 'summary', label: 'Class Summary' },
  { key: 'payments', label: 'Payment & Balance' },
  { key: 'studentBalance', label: 'Student Balance' },
];

const PREVIEW_LIMIT = 20;

// "August 29" for a single day, "August 29-30" spanning one month,
// "August 29 - September 1" across months, with the year only added
// when the range crosses one.
function formatCourseDateRange(start, end) {
  if (!start) return '';
  const s = new Date(`${start}T00:00:00`);
  if (!end || end === start) {
    return s.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }
  const e = new Date(`${end}T00:00:00`);
  const sameYear = s.getFullYear() === e.getFullYear();
  const sameMonth = sameYear && s.getMonth() === e.getMonth();
  if (sameMonth) {
    return `${s.toLocaleDateString('en-US', { month: 'long' })} ${s.getDate()}-${e.getDate()}`;
  }
  const opts = sameYear ? { month: 'long', day: 'numeric' } : { month: 'long', day: 'numeric', year: 'numeric' };
  return `${s.toLocaleDateString('en-US', opts)} - ${e.toLocaleDateString('en-US', opts)}`;
}

function periodLabel(dateStr, groupBy) {
  const d = new Date(`${dateStr}T00:00:00`);
  return groupBy === 'yearly' ? String(d.getFullYear()) : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Sortable key so periods land in chronological order, not alphabetical
// ("August" would otherwise sort before "July").
function periodSortKey(dateStr, groupBy) {
  return groupBy === 'yearly' ? dateStr.slice(0, 4) : dateStr.slice(0, 7);
}

function instructorLabelFor(offering, instructorById) {
  if (offering?.instructor_id) {
    const p = instructorById[offering.instructor_id];
    return p ? formatInstructorName(p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ')) : '';
  }
  return formatInstructorName(offering?.instructor_name) || '';
}

async function fetchInstructorById(supabase, offerings) {
  const instructorIds = [...new Set((offerings ?? []).map((o) => o.instructor_id).filter(Boolean))];
  const { data } = instructorIds.length
    ? await supabase.from('profiles').select('id, full_name, first_name, last_name').in('id', instructorIds)
    : { data: [] };
  return Object.fromEntries((data ?? []).map((p) => [p.id, p]));
}

export default function ReportsPanel({ courses, students }) {
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
        {tab === 'summary' && <ClassSummaryTab />}
        {tab === 'payments' && <PaymentBalanceTab courses={courses} />}
        {tab === 'studentBalance' && <StudentBalanceTab students={students} />}
      </div>
    </div>
  );
}

// ============================================================
// Shared bits
// ============================================================

function DateRangeInputs({ from, to, setFrom, setTo, label = true }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-sm text-brand-ink/70">
        {label && 'From'}
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="mt-1 block rounded-lg border border-brand-blue/20 px-3 py-1.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900"
        />
      </label>
      <label className="text-sm text-brand-ink/70">
        {label && 'To'}
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="mt-1 block rounded-lg border border-brand-blue/20 px-3 py-1.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900"
        />
      </label>
      {(from || to) && <span className="pb-2 text-xs text-brand-ink/40">Leave blank for no date limit</span>}
    </div>
  );
}

function PreviewTable({ header, rows }) {
  const shown = rows.slice(0, PREVIEW_LIMIT);
  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-brand-blue/15">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-blue/5 text-xs font-semibold tracking-wide whitespace-nowrap text-brand-ink/50 uppercase">
            <tr>
              {header.map((h) => (
                <th key={h} className="px-3 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, i) => (
              <tr key={i} className="border-t border-brand-blue/10">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2 whitespace-nowrap text-brand-ink">
                    {cell ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={header.length} className="px-3 py-4 text-center text-brand-ink/50">
                  No rows to show.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {rows.length > PREVIEW_LIMIT && (
        <p className="mt-2 text-xs text-brand-ink/50">
          Showing first {PREVIEW_LIMIT} of {rows.length} rows — export for the full list.
        </p>
      )}
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
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { header, rows }

  function toggle(key) {
    setChecked((c) => ({ ...c, [key]: !c[key] }));
    setResult(null);
  }
  function setAll(value) {
    setChecked(Object.fromEntries(ALL_COLUMNS.map(([key]) => [key, value])));
    setResult(null);
  }

  async function runPreview() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const activeColumns = ALL_COLUMNS.filter(([key]) => checked[key]);
      if (!activeColumns.length) {
        setError('Select at least one column first.');
        return;
      }

      const supabase = createClient();

      let query = supabase
        .from('enrollments')
        .select(
          `id, status, enrollment_type, referred_by, tithe_amount, amount_paid, payment_verified, student_id,
           profiles ( full_name, first_name, last_name, nickname, birthdate, address, city, state_region, country, phone, email, fb_link, religion, profession, company ),
           course_offerings!inner ( start_date, price, course_id, instructor_id, instructor_name, courses ( code, name ), regions ( name ) )`
        );
      if (from) query = query.gte('course_offerings.start_date', from);
      if (to) query = query.lte('course_offerings.start_date', to);

      const [{ data: enrollments, error: enrollError }, { data: certificates, error: certError }] = await Promise.all([
        query,
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

      const header = activeColumns.map(([, label]) => label);
      const csvRows = rows.map((row) => activeColumns.map(([key]) => row[key]));
      setResult({ header, rows: csvRows });
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    if (!result) return;
    const suffix = from || to ? `-${from || 'start'}-to-${to || 'now'}` : '';
    downloadCsv(`phfp-student-export${suffix}`, result.header, result.rows);
  }

  return (
    <div>
      <p className="text-sm text-brand-ink/60">Pick the columns to include, then preview before exporting.</p>

      <div className="mt-4">
        <p className="text-xs font-semibold tracking-wide text-brand-ink/40 uppercase">Date of course (optional)</p>
        <div className="mt-2">
          <DateRangeInputs from={from} to={to} setFrom={(v) => { setFrom(v); setResult(null); }} setTo={(v) => { setTo(v); setResult(null); }} />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-brand-ink/40 uppercase">Columns</p>
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

      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          onClick={runPreview}
          disabled={loading}
          className="rounded-full bg-brand-blue px-5 py-2 text-sm font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Preview'}
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {result && (
        <div className="mt-6">
          <PreviewTable header={result.header} rows={result.rows} />
          <button
            type="button"
            onClick={exportCsv}
            className="mt-3 rounded-full bg-brand-blue px-5 py-2 text-sm font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark"
          >
            Export CSV ({result.rows.length} rows)
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Tab 2: classes conducted + new/review totals per course, for a date range
// ============================================================

function ClassSummaryTab() {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(today);
  const [groupBy, setGroupBy] = useState('monthly');
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
        .select('id, start_date, end_date, course_id, instructor_id, instructor_name, courses ( code, name )')
        .gte('start_date', from)
        .lte('start_date', to);
      if (offerError) {
        setError(offerError.message);
        return;
      }

      const offeringIds = (offerings ?? []).map((o) => o.id);
      const [{ data: enrollments, error: enrollError }, instructorById] = await Promise.all([
        offeringIds.length
          ? supabase.from('enrollments').select('course_offering_id, enrollment_type').in('course_offering_id', offeringIds)
          : Promise.resolve({ data: [] }),
        fetchInstructorById(supabase, offerings),
      ]);
      if (enrollError) {
        setError(enrollError.message);
        return;
      }

      const countsByOffering = new Map();
      for (const e of enrollments ?? []) {
        const entry = countsByOffering.get(e.course_offering_id) ?? { newCount: 0, reviewCount: 0 };
        if (e.enrollment_type === 'review') entry.reviewCount += 1;
        else entry.newCount += 1;
        countsByOffering.set(e.course_offering_id, entry);
      }

      const built = (offerings ?? []).map((o) => {
        const counts = countsByOffering.get(o.id) ?? { newCount: 0, reviewCount: 0 };
        return {
          period: periodLabel(o.start_date, groupBy),
          sortKey: `${periodSortKey(o.start_date, groupBy)}|${o.courses?.code || ''}|${o.start_date}`,
          course: o.courses?.name,
          code: o.courses?.code,
          date: formatCourseDateRange(o.start_date, o.end_date),
          instructor: instructorLabelFor(o, instructorById),
          newCount: counts.newCount,
          reviewCount: counts.reviewCount,
        };
      });

      setRows(built.sort((a, b) => a.sortKey.localeCompare(b.sortKey)));
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    if (!rows) return;
    const header = [groupBy === 'yearly' ? 'Year' : 'Month', 'Course', 'Course Code', 'Date of Course', 'Instructor', 'New', 'Review', 'Total'];
    const csvRows = rows.map((r) => [r.period, r.course, r.code, r.date, r.instructor, r.newCount, r.reviewCount, r.newCount + r.reviewCount]);
    downloadCsv(`phfp-class-summary-${from}-to-${to}`, header, csvRows);
  }

  const previewRows = useMemo(
    () => (rows ?? []).map((r) => [r.period, r.course, r.date, r.instructor, r.newCount, r.reviewCount, r.newCount + r.reviewCount]),
    [rows]
  );

  return (
    <div>
      <p className="text-sm text-brand-ink/60">
        Every class conducted within a date range — its date, instructor, and how many were new vs. review
        enrollments — organized yearly or monthly.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <DateRangeInputs from={from} to={to} setFrom={setFrom} setTo={setTo} />
        <label className="text-sm text-brand-ink/70">
          Organize by
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="mt-1 block rounded-lg border border-brand-blue/20 px-3 py-1.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900"
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </label>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="rounded-full bg-brand-blue px-5 py-2 text-sm font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark disabled:opacity-50"
        >
          {loading ? 'Running…' : 'Preview'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {rows && (
        <div className="mt-6">
          <PreviewTable
            header={[groupBy === 'yearly' ? 'Year' : 'Month', 'Course', 'Date', 'Instructor', 'New', 'Review', 'Total']}
            rows={previewRows}
          />
          <button
            type="button"
            onClick={exportCsv}
            className="mt-3 rounded-full bg-brand-blue px-5 py-2 text-sm font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark"
          >
            Export CSV ({rows.length} rows)
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
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
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
      let offerQuery = supabase.from('course_offerings').select('id, start_date, price').eq('course_id', courseId);
      if (from) offerQuery = offerQuery.gte('start_date', from);
      if (to) offerQuery = offerQuery.lte('start_date', to);
      const { data: offerings, error: offerError } = await offerQuery;
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
    const csvRows = rows.map((r) => [r.name, course?.code, r.date, r.type, r.amountPaid, r.price, r.balance, r.tithe, r.verified ? 'Yes' : 'No']);
    downloadCsv(`phfp-payments-${course?.code || courseId}`, header, csvRows);
  }

  const previewRows = useMemo(
    () =>
      (rows ?? []).map((r) => [
        r.name,
        r.date,
        r.type,
        r.amountPaid != null ? `₱${r.amountPaid}` : null,
        r.price != null ? `₱${r.price}` : null,
        r.balance != null ? `₱${r.balance}` : null,
        r.tithe != null ? `₱${r.tithe}` : null,
        r.verified ? 'Yes' : 'No',
      ]),
    [rows]
  );

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
        <DateRangeInputs from={from} to={to} setFrom={setFrom} setTo={setTo} />
        <button
          type="button"
          onClick={run}
          disabled={loading || !courseId}
          className="rounded-full bg-brand-blue px-5 py-2 text-sm font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark disabled:opacity-50"
        >
          {loading ? 'Running…' : 'Preview'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {rows && (
        <div className="mt-6">
          <PreviewTable
            header={['Student', 'Date', 'Type', 'Amount Paid', 'Price', 'Balance', 'Tithe', 'Verified']}
            rows={previewRows}
          />
          <button
            type="button"
            onClick={exportCsv}
            className="mt-3 rounded-full bg-brand-blue px-5 py-2 text-sm font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark"
          >
            Export CSV ({rows.length} rows)
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Tab 4: one student's accumulated payments/tithes across every course
// ============================================================

function studentLabel(s) {
  return s.full_name || [s.first_name, s.last_name].filter(Boolean).join(' ') || s.email || 'Unnamed';
}

function StudentBalanceTab({ students }) {
  const [query, setQuery] = useState('');
  const [studentId, setStudentId] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rows, setRows] = useState(null);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return students.filter((s) => studentLabel(s).toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q)).slice(0, 8);
  }, [students, query]);

  const selectedStudent = students.find((s) => s.id === studentId);

  async function run() {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    setRows(null);
    setTotals(null);

    try {
      const supabase = createClient();
      let q = supabase
        .from('enrollments')
        .select(
          `enrollment_type, amount_paid, payment_verified, invoice_number, payment_date, tithe_amount,
           course_offerings!inner ( start_date, price, courses ( code, name ) )`
        )
        .eq('student_id', studentId);
      if (from) q = q.gte('course_offerings.start_date', from);
      if (to) q = q.lte('course_offerings.start_date', to);
      const { data: enrollments, error: enrollError } = await q;
      if (enrollError) {
        setError(enrollError.message);
        return;
      }

      let totalPaid = 0;
      let totalBalance = 0;
      let totalTithe = 0;

      const built = (enrollments ?? []).map((e) => {
        const o = e.course_offerings ?? {};
        const price = o.price ?? 0;
        const paid = e.amount_paid ?? 0;
        const isReview = e.enrollment_type === 'review';
        const balance = isReview ? null : Math.max(price - paid, 0);
        totalPaid += paid;
        if (balance != null) totalBalance += balance;
        if (isReview) totalTithe += e.tithe_amount ?? 0;
        return {
          course: o.courses?.name,
          code: o.courses?.code,
          date: o.start_date,
          type: isReview ? 'Review' : 'New',
          invoiceNumber: e.invoice_number,
          datePaid: e.payment_date,
          amountPaid: e.amount_paid,
          total: isReview ? null : price,
          balance,
          tithe: isReview ? e.tithe_amount : null,
          verified: e.payment_verified,
        };
      });

      setRows(built);
      setTotals({ totalPaid, totalBalance, totalTithe });
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    if (!rows) return;
    const header = [
      'Course Code', 'Course', 'Class Date', 'Type', 'Invoice #', 'Date Paid',
      'Amount Paid', 'Total', 'Balance', 'Tithe Amount', 'Payment Verified',
    ];
    const csvRows = [
      ['Student:', studentLabel(selectedStudent)],
      ['Center:', selectedStudent?.regions?.name || 'Not set'],
      [],
      header,
      ...rows.map((r) => [
        r.code, r.course, r.date, r.type, r.invoiceNumber, r.datePaid,
        r.amountPaid, r.total, r.balance, r.tithe, r.verified ? 'Yes' : 'No',
      ]),
      [],
      ['', '', '', '', '', 'TOTALS', totals.totalPaid, '', totals.totalBalance, totals.totalTithe, ''],
    ];
    // header row is already included above, so pass an empty header to downloadCsv
    downloadCsv(`phfp-student-balance-${studentLabel(selectedStudent).replace(/\s+/g, '-')}`, [], csvRows);
  }

  const previewRows = useMemo(
    () =>
      (rows ?? []).map((r) => [
        r.code,
        r.date,
        r.type,
        r.invoiceNumber,
        r.datePaid,
        r.amountPaid != null ? `₱${r.amountPaid}` : null,
        r.total != null ? `₱${r.total}` : null,
        r.balance != null ? `₱${r.balance}` : null,
        r.tithe != null ? `₱${r.tithe}` : null,
        r.verified ? 'Yes' : 'No',
      ]),
    [rows]
  );

  return (
    <div>
      <p className="text-sm text-brand-ink/60">
        Search a student to see every course they&apos;ve paid for or tithed toward, with running totals.
      </p>

      <div className="relative mt-4 max-w-sm">
        <input
          type="text"
          value={selectedStudent ? studentLabel(selectedStudent) : query}
          onChange={(e) => {
            setQuery(e.target.value);
            setStudentId(null);
            setRows(null);
          }}
          placeholder="Search by name or email…"
          className="w-full rounded-lg border border-brand-blue/20 px-3 py-1.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900"
        />
        {!studentId && matches.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-brand-blue/20 bg-white shadow-lg dark:bg-zinc-900">
            {matches.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setStudentId(s.id);
                  setQuery('');
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-brand-blue/5"
              >
                <div className="text-brand-ink">{studentLabel(s)}</div>
                <div className="text-xs text-brand-ink/50">{s.email}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedStudent && (
        <p className="mt-2 text-sm text-brand-ink/60">
          Center: <span className="font-medium text-brand-ink">{selectedStudent.regions?.name || 'Not set'}</span>
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <DateRangeInputs from={from} to={to} setFrom={setFrom} setTo={setTo} />
        <button
          type="button"
          onClick={run}
          disabled={loading || !studentId}
          className="rounded-full bg-brand-blue px-5 py-2 text-sm font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark disabled:opacity-50"
        >
          {loading ? 'Running…' : 'Preview'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {rows && totals && (
        <div className="mt-6">
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-brand-blue/15 bg-brand-blue/5 p-3">
              <div className="text-xs font-medium tracking-wide text-brand-ink/50 uppercase">Total Paid</div>
              <div className="text-xl font-semibold text-brand-blue-dark">₱{totals.totalPaid}</div>
            </div>
            <div className="rounded-xl border border-brand-flame/20 bg-brand-amber/10 p-3">
              <div className="text-xs font-medium tracking-wide text-brand-ink/50 uppercase">Total Balance Owed</div>
              <div className="text-xl font-semibold text-brand-flame">₱{totals.totalBalance}</div>
            </div>
            <div className="rounded-xl border border-brand-blue/15 bg-brand-blue/5 p-3">
              <div className="text-xs font-medium tracking-wide text-brand-ink/50 uppercase">Total Tithe</div>
              <div className="text-xl font-semibold text-brand-blue-dark">₱{totals.totalTithe}</div>
            </div>
          </div>

          <PreviewTable
            header={['Course', 'Date', 'Type', 'Invoice #', 'Date Paid', 'Amount Paid', 'Total', 'Balance', 'Tithe', 'Verified']}
            rows={previewRows}
          />
          <button
            type="button"
            onClick={exportCsv}
            className="mt-3 rounded-full bg-brand-blue px-5 py-2 text-sm font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark"
          >
            Export CSV ({rows.length} rows)
          </button>
        </div>
      )}
    </div>
  );
}
