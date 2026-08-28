// Shared CSV building + browser download, used by every export button in
// the app (reports, roster export) so the escaping rules stay consistent.
function csvEscape(value) {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// `columns` is optional — pass an empty array (or omit rows meant to be a
// header) when the caller wants to prepend its own metadata/header rows
// directly into `rows` instead (e.g. a "Student: ..." line before the table).
export function toCsv(columns, rows) {
  const lines = columns.length ? [columns.map(csvEscape).join(',')] : [];
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(','));
  }
  return lines.join('\r\n');
}

export function downloadCsv(fileName, columns, rows) {
  const blob = new Blob([toCsv(columns, rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
