import { listEmployees } from '../api/employees.js';
import { ApiError } from '../api/client.js';
import { getEl, getToday, escapeHtml } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';

export function initExport() {
  getEl('export-csv-btn').addEventListener('click', () => {
    exportToCSV().catch((err) => {
      showToast(err instanceof ApiError ? err.message : 'Export failed.', 'error');
    });
  });
  getEl('export-html-btn')?.addEventListener('click', () => {
    exportToHTML().catch((err) => {
      showToast(err instanceof ApiError ? err.message : 'Export failed.', 'error');
    });
  });
  getEl('export-pdf-btn').addEventListener('click', () => {
    exportToPrint().catch((err) => {
      showToast(err instanceof ApiError ? err.message : 'Export failed.', 'error');
    });
  });
}

async function exportToCSV() {
  const { employees } = await listEmployees({ all: true });
  const headers = [
    'Employee No',
    'First Name',
    'Last Name',
    'Email',
    'Contact',
    'Address',
    'Position',
    'Department',
    'Status',
    'Start Date',
  ];
  const rows = employees.map((e) => [
    e.employeeNo,
    e.firstName,
    e.lastName,
    e.email,
    e.contactNumber,
    e.address,
    e.assignment?.positionName,
    e.assignment?.departmentName,
    e.assignment?.employmentStatusName,
    e.assignment?.startDate,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `NSC-ERMS_${getToday()}.csv`;
  a.click();
  showToast('CSV exported.', 'success');
}

function buildReportHtml(employees) {
  const rows = employees
    .map(
      (e) =>
        `<tr><td>${escapeHtml(e.firstName)} ${escapeHtml(e.lastName)}</td><td>${escapeHtml(e.email)}</td><td>${escapeHtml(e.assignment?.positionName ?? '—')}</td><td>${escapeHtml(e.assignment?.departmentName ?? '—')}</td><td>${escapeHtml(e.assignment?.employmentStatusName ?? '—')}</td><td>${escapeHtml(e.assignment?.startDate ? String(e.assignment.startDate).slice(0, 10) : '—')}</td></tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>NSC-ERMS Employee Report ${getToday()}</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: Arial, sans-serif; font-size: 10pt; color: #1a1a1a; margin: 24px; }
  h1 { color: #062b6e; border-bottom: 3px solid #062b6e; padding-bottom: 8px; font-size: 18pt; }
  .meta { color: #4b5875; font-size: 9pt; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; margin-top: 14px; }
  th { background: #062b6e; color: #fff; padding: 8px 10px; text-align: left; font-size: 9pt; }
  td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) td { background: #f8fafc; }
  .hint { margin-top: 24px; font-size: 9pt; color: #64748b; }
</style>
</head>
<body>
<h1>NSC-ERMS — Employee Report</h1>
<p class="meta">Generated: ${new Date().toLocaleString('en-PH')} · ${employees.length} employee(s)</p>
<table>
  <thead><tr><th>Name</th><th>Email</th><th>Position</th><th>Department</th><th>Status</th><th>Start Date</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<p class="hint">To save as PDF: press Ctrl+P (or Cmd+P) and choose &ldquo;Save as PDF&rdquo; or &ldquo;Microsoft Print to PDF&rdquo;.</p>
</body>
</html>`;
}

async function exportToHTML() {
  const { employees } = await listEmployees({ all: true });
  const html = buildReportHtml(employees);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  a.download = `NSC-ERMS_${getToday()}.html`;
  a.click();
  showToast('HTML report downloaded. Open it and print to PDF if needed.', 'success');
}

async function exportToPrint() {
  const { employees } = await listEmployees({ all: true });
  getEl('print-area').innerHTML = buildReportHtml(employees);
  window.print();
}
