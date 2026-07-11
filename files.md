## main.js
```javascript
import "./js/utils/helpers.js";
import "./js/utils/toast.js";
import "./js/store/employees.js";
import "./js/store/departments.js";
import "./js/store/users.js";
import "./js/store/backups.js";

import "./js/components/login.js";
import "./js/components/employeeTable.js";
import "./js/components/empoyeeModal.js";
import "./js/components/profilePanel.js";
import "./js/components/documents.js";
import "./js/components/scanModal.js";
import "./js/components/departments.js";
import "./js/components/backup.js";
import "./js/components/settings.js";
import "./js/components/export.js";



const App = {
    currentUser: null,
    searchQuery: '',
    prefs: { darkMode: false, fontSize: 14 },
    savePrefs() { localStorage.setItem('edurecords_prefs', JSON.stringify(App.prefs)); },
    loadPrefs() {
        try { const s = localStorage.getItem('edurecords_prefs'); if (s) App.prefs = { ...App.prefs, ...JSON.parse(s) }; } catch { }
    },
    applyPrefs() {
        document.body.classList.toggle('dark', App.prefs.darkMode);
        document.getElementById('dark-toggle')?.classList.toggle('on', App.prefs.darkMode);
        document.documentElement.style.setProperty('--fs', App.prefs.fontSize + 'px');
        const sizes = [13, 14, 15, 16];
        document.querySelectorAll('.fs-btn').forEach((btn, i) => btn.classList.toggle('active', sizes[i] === App.prefs.fontSize));
    },
};

document.addEventListener('DOMContentLoaded', () => {
    App.loadPrefs();
    App.applyPrefs();
});

function handleLogin() {
    attemptLogin((user) => {
        App.currentUser = user;
        getEl('login-screen').style.display = 'none';
        getEl('app').style.display = 'flex';
        getEl('su-name').textContent = user.name;
        getEl('su-role').textContent = user.role;
        getEl('su-avatar').textContent = getInitials(user.name.split(' ')[0], user.name.split(' ')[1] ?? '');
        App.applyPrefs();
        renderEmployeeTable();
        populateDeptDropdowns();
    });
}

function handleLogout() {
    if (!confirm('Log out?')) return;
    App.currentUser = null;
    getEl('app').style.display = 'none';
    getEl('login-screen').style.display = 'flex';
    getEl('login-user').value = '';
    getEl('login-pass').value = '';
    closeProfilePanel();
}

function navTo(pageName, linkEl) {
    document.querySelectorAll('#sidebar-nav a').forEach(a => a.classList.remove('active'));
    linkEl.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    getEl('page-' + pageName).classList.add('active');
    // Page title from link text, strip any badge text
    const clone = linkEl.cloneNode(true);
    clone.querySelectorAll('.nav-badge,.nav-section-label').forEach(e => e.remove());
    getEl('page-title').textContent = clone.textContent.trim();
    getEl('search-box').style.display = pageName === 'employees' ? 'block' : 'none';
    getEl('search-input').value = '';
    App.searchQuery = '';
    closeProfilePanel();
    if (pageName === 'departments') renderDepartmentPage();
    if (pageName === 'backup') renderBackupPage();
    if (pageName === 'settings') renderSettingsPage();
}

function handleSearch(value) {
    App.searchQuery = value;
    renderEmployeeTable(value);
}
```

## ./js/utils/helpers.js
```javascript
function getInitials(fname, lname) {
    return ((fname?.[0] ?? '') + (lname?.[0] ?? '')).toUpperCase();
}
function getToday() {
    return new Date().toISOString().split('T')[0];
}
function formatFileSize(bytes) {
    if (bytes >= 1_048_576) return (bytes / 1_048_576).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(0) + ' KB';
}
function getYearsOfService(startDate) {
    if (!startDate) return '—';
    const years = new Date().getFullYear() - new Date(startDate).getFullYear();
    return years > 0 ? `${years} year(s)` : 'Less than 1 year';
}
function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'img';
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'doc';
    return 'other';
}
function getStatusBadge(status) {
    const classMap = { 'Active': 'active', 'Inactive': 'inactive', 'On Leave': 'leave' };
    const cls = classMap[status] ?? 'inactive';
    return `<span class="badge ${cls}">${status}</span>`;
}
function getSourceTag(source) {
    if (source === 'scan') return `<span style="font-size:10px;background:#ede9fe;color:#5b21b6;padding:1px 7px;border-radius:99px;font-weight:700;margin-left:5px;">SCANNED</span>`;
    if (source === 'sample') return `<span style="font-size:10px;background:#d1fae5;color:#065f46;padding:1px 7px;border-radius:99px;font-weight:700;margin-left:5px;">SAMPLE</span>`;
    return '';
}
function getAvatarHTML(employee, size = 32, fontSize = 11) {
    if (employee.picture) {
        return `<img src="${employee.picture}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0;" alt=""/>`;
    }
    return `<div class="avatar" style="width:${size}px;height:${size}px;font-size:${fontSize}px;">${getInitials(employee.fname, employee.lname)}</div>`;
}
function setHTML(elementId, html) {
    const el = document.getElementById(elementId);
    if (!el) { console.warn(`setHTML: #${elementId} not found.`); return false; }
    el.innerHTML = html;
    return true;
}
function getEl(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element #${id} not found.`);
    return el;
}
```

## ./js/utils/toast.js
```javascript
let toastTimer = null;
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `t-${type} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}
```

## ./js/store/employees.js"
```javascript
let _employees = [
    {
        id: 1, fname: 'Maria', lname: 'Santos', email: 'm.santos@college.edu.ph', contact: '09171234567', address: '123 Rizal St, Manila', position: 'Dean', dept: 'College of Arts', status: 'Active', start_date: '2018-06-01', picture: null, docs: [
            { id: 1, name: 'Employment Contract.pdf', type: 'pdf', size: '1.2 MB', date: '2018-06-01', source: 'upload' },
            { id: 2, name: 'Personal Data Sheet (CS Form 212).pdf', type: 'pdf', size: '890 KB', date: '2018-06-01', source: 'upload' },
            { id: 3, name: 'SCANNED - CSC Eligibility.pdf', type: 'scan', size: '1.8 MB', date: '2024-01-10', source: 'scan' },
        ]
    },
    {
        id: 2, fname: 'Jose', lname: 'Reyes', email: 'j.reyes@college.edu.ph', contact: '09281234567', address: '456 Mabini Ave, Quezon City', position: 'Professor II', dept: 'College of Engineering', status: 'Active', start_date: '2015-08-15', picture: null, docs: [
            { id: 1, name: 'Employment Contract.pdf', type: 'pdf', size: '1.1 MB', date: '2015-08-15', source: 'upload' },
            { id: 2, name: 'Board Certificate.pdf', type: 'pdf', size: '750 KB', date: '2015-08-15', source: 'upload' },
        ]
    },
    {
        id: 3, fname: 'Ana', lname: 'Cruz', email: 'a.cruz@college.edu.ph', contact: '09391234567', address: '789 Bonifacio Rd, Makati City', position: 'Administrative Officer', dept: 'Administration', status: 'On Leave', start_date: '2020-01-10', picture: null, docs: [
            { id: 1, name: 'Employment Contract.pdf', type: 'pdf', size: '1.0 MB', date: '2020-01-10', source: 'upload' },
            { id: 2, name: 'Leave Application Form.pdf', type: 'pdf', size: '300 KB', date: '2024-03-01', source: 'upload' },
        ]
    },
    {
        id: 4, fname: 'Pedro', lname: 'Bautista', email: 'p.bautista@college.edu.ph', contact: '09501234567', address: '321 Luna St, Pasig City', position: 'University Registrar', dept: 'Administration', status: 'Active', start_date: '2019-03-22', picture: null, docs: [
            { id: 1, name: 'Employment Contract.pdf', type: 'pdf', size: '1.2 MB', date: '2019-03-22', source: 'upload' },
            { id: 2, name: 'Appointment Paper.pdf', type: 'pdf', size: '600 KB', date: '2019-03-22', source: 'upload' },
        ]
    },
    {
        id: 5, fname: 'Liza', lname: 'Villanueva', email: 'l.villanueva@college.edu.ph', contact: '09611234567', address: '654 Del Pilar, Mandaluyong', position: 'Chief Librarian', dept: 'Library Services', status: 'Active', start_date: '2017-07-05', picture: null, docs: [
            { id: 1, name: 'Employment Contract.pdf', type: 'pdf', size: '900 KB', date: '2017-07-05', source: 'upload' },
        ]
    },
    { id: 6, fname: 'Ramon', lname: 'Dela Cruz', email: 'r.delacruz@college.edu.ph', contact: '09721234567', address: '88 Gen. Luna St, Cebu City', position: 'Professor I', dept: 'College of Nursing', status: 'Active', start_date: '2021-06-14', picture: null, docs: [] },
    { id: 7, fname: 'Carla', lname: 'Mendoza', email: 'c.mendoza@college.edu.ph', contact: '09831234567', address: '11 Colon St, Cebu City', position: 'Assistant Professor', dept: 'College of Education', status: 'Inactive', start_date: '2016-11-01', picture: null, docs: [] },
];
let _nextEmpId = 8;
let _nextDocId = 100;
const SAMPLE_DOC_NAMES = ['Personal Data Sheet (CS Form 212)', 'Employment Contract', 'Appointment Paper', 'Service Record', 'Certificate of Eligibility (CSC)', 'NBI Clearance', 'Transcript of Records', 'Oath of Office', 'Medical Certificate'];
function getAllEmployees() { return _employees; }
function getEmployeeById(id) { return _employees.find(e => e.id === id) ?? null; }
function addEmployee(data) {
    const e = { id: _nextEmpId++, ...data, docs: [] };
    _employees.push(e);
    return e;
}
function updateEmployee(id, data) {
    const idx = _employees.findIndex(e => e.id === id);
    if (idx === -1) throw new Error(`Employee #${id} not found.`);
    _employees[idx] = { ..._employees[idx], ...data };
    return _employees[idx];
}
function deleteEmployee(id) { _employees = _employees.filter(e => e.id !== id); }
function addDocument(employeeId, docData) {
    const emp = getEmployeeById(employeeId);
    if (!emp) throw new Error(`Employee #${employeeId} not found.`);
    const doc = { id: _nextDocId++, ...docData };
    emp.docs.push(doc);
    return doc;
}
function deleteDocument(employeeId, docId) {
    const emp = getEmployeeById(employeeId);
    if (!emp) throw new Error(`Employee #${employeeId} not found.`);
    emp.docs = emp.docs.filter(d => d.id !== docId);
}
function addSampleDocuments(employeeId) {
    const emp = getEmployeeById(employeeId);
    if (!emp) throw new Error(`Employee #${employeeId} not found.`);
    const existing = new Set(emp.docs.map(d => d.name));
    let added = 0;
    SAMPLE_DOC_NAMES.forEach(name => {
        const filename = `${name}.pdf`;
        if (!existing.has(filename)) {
            emp.docs.push({ id: _nextDocId++, name: filename, type: 'pdf', size: '—', date: getToday(), source: 'sample' });
            added++;
        }
    });
    return added;
}
function replaceAll(employeesArray) {
    _employees = employeesArray;
    _nextEmpId = Math.max(...employeesArray.map(e => e.id), 0) + 1;
}
```

## "./js/store/departments.js"
```javascript
let _departments = [
    { id: 1, name: 'Administration', description: 'Administrative and support services' },
    { id: 2, name: 'College of Arts', description: 'Humanities and social sciences' },
    { id: 3, name: 'College of Education', description: 'Teacher training and education' },
    { id: 4, name: 'College of Engineering', description: 'Technical and engineering programs' },
    { id: 5, name: 'College of Nursing', description: 'Nursing and health sciences' },
    { id: 6, name: 'Library Services', description: 'Library and information management' },
];
let _nextDeptId = 7;
function getAllDepartments() { return _departments; }
function getDepartmentById(id) { return _departments.find(d => d.id === id) ?? null; }
function addDepartment(data) {
    const dept = { id: _nextDeptId++, ...data };
    _departments.push(dept);
    return dept;
}
function updateDepartment(id, data) {
    const idx = _departments.findIndex(d => d.id === id);
    if (idx === -1) throw new Error(`Department #${id} not found.`);
    _departments[idx] = { ..._departments[idx], ...data };
    return _departments[idx];
}
function deleteDepartment(id) { _departments = _departments.filter(d => d.id !== id); }
function replaceDepts(arr) { _departments = arr; _nextDeptId = Math.max(...arr.map(d => d.id), 0) + 1; }
```

## "./js/store/users.js"
```javascript
let _users = [
    { id: 1, name: 'Admin', username: 'admin', password: 'admin123', role: 'HR Administrator' },
    { id: 2, name: 'HR Staff', username: 'hrstaff', password: 'staff123', role: 'HR Staff' },
];
let _nextUserId = 3;
function getAllUsers() { return _users.map(({ password: _, ...u }) => u); }
function findByCredentials(u, p) { return _users.find(x => x.username === u && x.password === p) ?? null; }
function addUser(data) {
    if (_users.some(u => u.username === data.username)) throw new Error('Username already exists.');
    const user = { id: _nextUserId++, ...data };
    _users.push(user);
    return { id: user.id, name: user.name, username: user.username, role: user.role };
}
function deleteUser(id) {
    if (id === 1) throw new Error('Cannot delete the main admin account.');
    _users = _users.filter(u => u.id !== id);
}
```

## "./js/store/backups.js"
```javascript
let _backups = [];
let _nextBkId = 1;
function getAllBackups() { return _backups; }
function getBackupById(id) { return _backups.find(b => b.id === id) ?? null; }
function addBackup(name, data) {
    const json = JSON.stringify(data, null, 2);
    const size = (json.length / 1024).toFixed(1) + ' KB';
    const backup = { id: _nextBkId++, name, size, date: getToday(), data: json };
    _backups.unshift(backup);
    return backup;
}
function deleteBackup(id) { _backups = _backups.filter(b => b.id !== id); }
```

## "./js/components/login.js";

```javascript
function attemptLogin(onSuccess) {
    const username = getEl('login-user').value.trim();
    const password = getEl('login-pass').value;
    const errEl = getEl('login-err');
    const user = findByCredentials(username, password);
    if (!user) {
        errEl.textContent = 'Incorrect username or password.';
        getEl('login-pass').value = '';
        setTimeout(() => { errEl.textContent = ''; }, 3000);
        return;
    }
    errEl.textContent = '';
    onSuccess(user);
}
```

## "./js/components/employeeTable.js";
```javascript
function renderEmployeeTable(searchQuery = '') {
    const deptFilter = getEl('filter-dept').value;
    const statusFilter = getEl('filter-status').value;
    const q = searchQuery.toLowerCase();
    const filtered = getAllEmployees().filter(emp => {
        const matchesSearch = !q || [emp.fname, emp.lname, emp.email, emp.position, emp.dept]
            .some(field => (field ?? '').toLowerCase().includes(q));
        const matchesDept = !deptFilter || emp.dept === deptFilter;
        const matchesStatus = !statusFilter || emp.status === statusFilter;
        return matchesSearch && matchesDept && matchesStatus;
    });
    const emptyEl = getEl('emp-empty');
    const tbody = getEl('emp-tbody');
    emptyEl.style.display = filtered.length ? 'none' : 'block';
    tbody.innerHTML = filtered.map((emp, i) => buildEmployeeRow(emp, i + 1)).join('');
    // Update badge
    const badge = document.getElementById('emp-count-badge');
    if (badge) badge.textContent = getAllEmployees().length;
}
function buildEmployeeRow(emp, rowNumber) {
    return `
    <tr>
      <td style="color:var(--text-3);font-size:12px;font-family:'DM Mono',monospace;">${String(rowNumber).padStart(2, '0')}</td>
      <td style="cursor:pointer;" onclick="openProfilePanel(${emp.id})">
        <div style="display:flex;align-items:center;gap:10px;">
          ${getAvatarHTML(emp, 34, 12)}
          <div>
            <div style="font-weight:700;color:var(--blue-900);letter-spacing:-.2px;">${emp.fname} ${emp.lname}</div>
            <div style="font-size:11px;color:var(--text-3);">${emp.email}</div>
          </div>
        </div>
      </td>
      <td style="color:var(--text-2);font-size:12.5px;">${emp.contact || '—'}</td>
      <td style="font-weight:500;">${emp.position}</td>
      <td style="color:var(--text-2);">${emp.dept || '—'}</td>
      <td>${getStatusBadge(emp.status)}</td>
    </tr>`;
}
function populateDeptDropdowns() {
    const depts = getAllDepartments();
    const opts = depts.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
    const filterEl = document.getElementById('filter-dept');
    if (filterEl) {
        const cur = filterEl.value;
        filterEl.innerHTML = '<option value="">All Departments</option>' + opts;
        filterEl.value = cur;
    }
    const modalEl = document.getElementById('f-dept');
    if (modalEl) modalEl.innerHTML = opts;
}
```

## "./js/components/empoyeeModal.js";
```javascript
let _editingEmpId = null;
let _tempPhoto = null;
function openEmployeeModal(empId = null) {
    _editingEmpId = empId;
    _tempPhoto = null;
    getEl('emp-modal-title').textContent = empId ? 'Edit Employee' : 'Add Employee';
    getEl('pic-input').value = '';
    populateDeptDropdowns();
    if (empId) { _prefillForm(getEmployeeById(empId)); } else { _clearForm(); }
    getEl('emp-overlay').classList.add('open');
}
function closeEmployeeModal() {
    getEl('emp-overlay').classList.remove('open');
    _editingEmpId = null; _tempPhoto = null;
}
function previewPhoto(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        _tempPhoto = e.target.result;
        getEl('pic-preview').outerHTML = `<img id="pic-preview" src="${_tempPhoto}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2.5px solid var(--blue-500);" alt=""/>`;
    };
    reader.readAsDataURL(file);
}
function saveEmployee() {
    const fname = getEl('f-fname').value.trim(), lname = getEl('f-lname').value.trim(),
        email = getEl('f-email').value.trim(), position = getEl('f-position').value.trim();
    if (!fname || !lname || !email || !position) { showToast('Please fill in all required fields (*).', 'error'); return; }
    const data = {
        fname, lname, email, position,
        contact: getEl('f-contact').value.trim(), address: getEl('f-address').value.trim(),
        dept: getEl('f-dept').value, status: getEl('f-status').value,
        start_date: getEl('f-start').value,
        picture: _tempPhoto ?? (getEmployeeById(_editingEmpId)?.picture ?? null),
    };
    if (_editingEmpId) { updateEmployee(_editingEmpId, data); showToast('Employee updated.', 'success'); }
    else { addEmployee(data); showToast('Employee added.', 'success'); }
    closeEmployeeModal();
    renderEmployeeTable(App.searchQuery);
    populateDeptDropdowns();
}
function _prefillForm(emp) {
    getEl('f-fname').value = emp.fname; getEl('f-lname').value = emp.lname;
    getEl('f-email').value = emp.email; getEl('f-contact').value = emp.contact ?? '';
    getEl('f-address').value = emp.address ?? ''; getEl('f-position').value = emp.position;
    getEl('f-status').value = emp.status; getEl('f-start').value = emp.start_date ?? '';
    setTimeout(() => { const el = document.getElementById('f-dept'); if (el) el.value = emp.dept ?? ''; }, 0);
    const prevEl = getEl('pic-preview');
    if (emp.picture) prevEl.outerHTML = `<img id="pic-preview" src="${emp.picture}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2.5px solid var(--blue-500);" alt=""/>`;
    else prevEl.outerHTML = `<div id="pic-preview" class="pic-ini">${getInitials(emp.fname, emp.lname)}</div>`;
}
function _clearForm() {
    ['f-fname', 'f-lname', 'f-email', 'f-contact', 'f-address', 'f-position', 'f-start']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const statusEl = document.getElementById('f-status'); if (statusEl) statusEl.value = 'Active';
    const prevEl = document.getElementById('pic-preview');
    if (prevEl) prevEl.outerHTML = `<div id="pic-preview" class="pic-ini">?</div>`;
}
```

## "./js/components/profilePanel.js";
```javascript
let _panelEmpId = null;
function openProfilePanel(empId) {
    const emp = getEmployeeById(empId);
    if (!emp) return;
    _panelEmpId = empId;
    _renderPanelHeader(emp);
    _activateTab('info');
    renderTabInfo(emp);
    getEl('panel').classList.add('open');
    getEl('panel-backdrop').classList.add('open');
}
function closeProfilePanel() {
    getEl('panel').classList.remove('open');
    getEl('panel-backdrop').classList.remove('open');
    _panelEmpId = null;
}
function switchTab(tabName, buttonEl) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    buttonEl.classList.add('active');
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    getEl('tab-' + tabName).classList.add('active');
    if (_panelEmpId === null) return;
    const emp = getEmployeeById(_panelEmpId);
    if (!emp) return;
    if (tabName === 'info') renderTabInfo(emp);
    if (tabName === 'employment') renderTabEmployment(emp);
    if (tabName === 'docs') renderTabDocs(emp);
}
function refreshPanelHeader() {
    if (_panelEmpId === null) return;
    const emp = getEmployeeById(_panelEmpId);
    if (emp) _renderPanelHeader(emp);
}
function renderTabInfo(emp) {
    setHTML('tab-info', `
    <div class="info-section">
      <h4>Personal Information</h4>
      <div class="info-row"><span class="ir-label">Full Name</span><span class="ir-val">${emp.fname} ${emp.lname}</span></div>
      <div class="info-row"><span class="ir-label">Email</span><span class="ir-val">${emp.email}</span></div>
      <div class="info-row"><span class="ir-label">Contact</span><span class="ir-val">${emp.contact || '—'}</span></div>
      <div class="info-row"><span class="ir-label">Address</span><span class="ir-val">${emp.address || '—'}</span></div>
    </div>`);
}
function renderTabEmployment(emp) {
    setHTML('tab-employment', `
    <div class="info-section">
      <h4>Employment Details</h4>
      <div class="info-row"><span class="ir-label">Employee ID</span><span class="ir-val" style="font-family:'DM Mono',monospace;">EMP-${String(emp.id).padStart(5, '0')}</span></div>
      <div class="info-row"><span class="ir-label">Position</span><span class="ir-val">${emp.position}</span></div>
      <div class="info-row"><span class="ir-label">Department</span><span class="ir-val">${emp.dept || '—'}</span></div>
      <div class="info-row"><span class="ir-label">Status</span><span class="ir-val">${getStatusBadge(emp.status)}</span></div>
      <div class="info-row"><span class="ir-label">Start Date</span><span class="ir-val">${emp.start_date || '—'}</span></div>
      <div class="info-row"><span class="ir-label">Years of Service</span><span class="ir-val">${getYearsOfService(emp.start_date)}</span></div>
    </div>`);
}
function _renderPanelHeader(emp) {
    const pic = emp.picture
        ? `<img src="${emp.picture}" class="ph-avatar-lg" alt=""/>`
        : `<div class="ph-ini-lg">${getInitials(emp.fname, emp.lname)}</div>`;
    setHTML('panel-header', `
    <button class="ph-close" onclick="closeProfilePanel()">×</button>
    ${pic}
    <h2>${emp.fname} ${emp.lname}</h2>
    <div class="ph-pos">${emp.position} &middot; ${emp.dept || 'No Department'}</div>
    <div class="ph-badges">
      <span class="ph-badge">${emp.status}</span>
      <span class="ph-badge">EMP-${String(emp.id).padStart(5, '0')}</span>
      ${emp.start_date ? `<span class="ph-badge">Since ${emp.start_date}</span>` : ''}
    </div>
    <div class="ph-actions">
      <button class="phbtn phbtn-edit" onclick="openEmployeeModal(${emp.id});closeProfilePanel()">Edit</button>
      <button class="phbtn phbtn-del"  onclick="handleDeleteEmployee(${emp.id})">Delete</button>
    </div>`);
}
function _activateTab(name) {
    document.querySelectorAll('.tab-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
    document.querySelectorAll('.tab-pane').forEach((p, i) => p.classList.toggle('active', i === 0));
}
function handleDeleteEmployee(empId) {
    if (!confirm('Delete this employee? This cannot be undone.')) return;
    deleteEmployee(empId);
    closeProfilePanel();
    renderEmployeeTable(App.searchQuery);
    showToast('Employee deleted.', 'success');
}
```

## "./js/components/documents.js";
```javascript
const DOC_ICONS = {
    pdf: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c8253c" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    img: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9373" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    doc: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2e6fff" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/></svg>`,
    scan: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/><circle cx="12" cy="12" r="1"/></svg>`,
    other: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>`,
};
const DOC_BG_CLASS = { pdf: 'di-pdf', img: 'di-img', doc: 'di-doc', scan: 'di-scan', other: 'di-other' };
function renderTabDocs(emp) {
    const docsHTML = emp.docs.length
        ? emp.docs.map(doc => _buildDocRow(doc, emp)).join('')
        : '<div class="empty" style="padding:20px 0">No documents on file.</div>';
    setHTML('tab-docs', `
    <div class="file-toolbar">
      <label class="fab fab-upload" for="doc-upload">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Upload
      </label>
      <input type="file" id="doc-upload" style="display:none" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onchange="handleDocUpload(this, ${emp.id})"/>
      <button class="fab fab-scan" onclick="openScanModal(${emp.id})">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/></svg>
        Scan
      </button>
      <button class="fab fab-sample" onclick="handleAddSampleDocs(${emp.id})">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Sample Files
      </button>
    </div>
    <p style="font-size:12px;color:var(--text-3);margin-bottom:12px;">${emp.docs.length} document(s)</p>
    <div class="doc-list">${docsHTML}</div>`);
}
function handleDocUpload(input, empId) {
    const file = input.files[0];
    if (!file) return;
    addDocument(empId, { name: file.name, type: getFileType(file.name), size: formatFileSize(file.size), date: getToday(), source: 'upload' });
    showToast(`"${file.name}" added.`, 'success');
    input.value = '';
    const emp = getEmployeeById(empId);
    renderTabDocs(emp); refreshPanelHeader();
}
function handleAddSampleDocs(empId) {
    const added = addSampleDocuments(empId);
    showToast(added ? `${added} sample file(s) added.` : 'All sample files already exist.', added ? 'success' : 'info');
    const emp = getEmployeeById(empId);
    renderTabDocs(emp); refreshPanelHeader();
}
function handleDeleteDoc(empId, docId) {
    if (!confirm('Remove this document?')) return;
    deleteDocument(empId, docId);
    showToast('Document removed.', 'success');
    const emp = getEmployeeById(empId);
    renderTabDocs(emp); refreshPanelHeader();
}
function handlePrintDoc(docName, empName) {
    getEl('print-area').innerHTML = `
    <style>@page{size:A4;margin:20mm;}body{font-family:'DM Sans',Arial;font-size:11pt;}
    h2{color:#062b6e;border-bottom:3px solid #062b6e;padding-bottom:8px;margin-bottom:16px;}</style>
    <h2>College HR Office — Document Print</h2>
    <p><strong>Document:</strong> ${docName}</p>
    <p><strong>Employee:</strong> ${empName}</p>
    <p><strong>Printed:</strong> ${new Date().toLocaleString('en-PH')}</p>`;
    window.print();
}
function _buildDocRow(doc, emp) {
    const icon = DOC_ICONS[doc.type] ?? DOC_ICONS.other;
    const bgClass = DOC_BG_CLASS[doc.type] ?? 'di-other';
    const safeName = doc.name.replace(/'/g, "\\'");
    const safeEmp = `${emp.fname} ${emp.lname}`.replace(/'/g, "\\'");
    return `
    <div class="doc-item">
      <div class="doc-icon ${bgClass}">${icon}</div>
      <div class="doc-info">
        <div class="doc-name">${doc.name}${getSourceTag(doc.source)}</div>
        <div class="doc-meta">${doc.size} &middot; ${doc.date}</div>
      </div>
      <div class="doc-acts">
        <button class="dbtn dbtn-print" onclick="handlePrintDoc('${safeName}','${safeEmp}')">Print</button>
        <button class="dbtn dbtn-del"   onclick="handleDeleteDoc(${emp.id}, ${doc.id})">Remove</button>
      </div>
    </div>`;
}
```

## "./js/components/scanModal.js";
```javascript
const MOCK_SCANNERS = [
    { id: 'epson-l3210', name: 'EPSON L3210 Series', connection: 'USB', status: 'Ready' },
    { id: 'epson-et2720', name: 'EPSON ET-2720 Series', connection: 'Wi-Fi', status: 'Ready' },
];
let _scanEmpId = null, _selectedScanner = null, _detectedScanners = [];
function openScanModal(empId) {
    _scanEmpId = empId; _selectedScanner = null;
    getEl('scan-prog').style.display = 'none'; getEl('scan-btn').disabled = false;
    getEl('scan-fill').style.width = '0%'; getEl('scan-status').textContent = '';
    getEl('scan-overlay').classList.add('open');
    setHTML('scan-dev-list', '<div class="empty" style="padding:10px 0;font-size:12px;">Detecting scanners…</div>');
    setTimeout(() => { _detectedScanners = MOCK_SCANNERS; _renderDeviceList(); }, 900);
}
function closeScanModal() { getEl('scan-overlay').classList.remove('open'); _scanEmpId = null; }
function handleSelectScanner(el, index) {
    document.querySelectorAll('.scan-dev-row').forEach(row => {
        row.classList.remove('sel');
        const chk = row.querySelector('.scan-checkmark'); if (chk) chk.remove();
    });
    el.classList.add('sel');
    el.insertAdjacentHTML('beforeend', `<svg class="scan-checkmark" style="margin-left:auto" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9373" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`);
    _selectedScanner = _detectedScanners[index];
}
function handleStartScan() {
    if (!_selectedScanner) { showToast('Please select a scanner first.', 'error'); return; }
    getEl('scan-prog').style.display = 'block'; getEl('scan-btn').disabled = true;
    _runSimulatedScan(_selectedScanner, getEl('sc-format').value, getEl('sc-doctype').value);
}
function _renderDeviceList() {
    if (!_detectedScanners.length) { setHTML('scan-dev-list', `<div style="padding:12px 14px;background:#fce8eb;border-radius:9px;font-size:12px;color:var(--error);border:1px solid #f8c1c9;">No scanner detected. Connect your EPSON device and ensure drivers are installed.</div>`); return; }
    setHTML('scan-dev-list', _detectedScanners.map((device, i) => `
    <div class="scan-dev-row ${i === 0 ? 'sel' : ''}" onclick="handleSelectScanner(this, ${i})">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--blue-700)" stroke-width="1.5"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/><circle cx="12" cy="12" r="1"/></svg>
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--text-1)">${device.name}</div>
        <div style="font-size:11px;color:var(--text-3)">${device.connection} &middot; ${device.status}</div>
      </div>
      ${i === 0 ? `<svg class="scan-checkmark" style="margin-left:auto" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9373" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
    </div>`).join(''));
    _selectedScanner = _detectedScanners[0];
}
function _setProgress(percent, message) {
    getEl('scan-fill').style.width = percent + '%'; getEl('scan-status').textContent = message;
}
function _runSimulatedScan(device, format, docType) {
    const steps = [[10, 'Initializing scanner…'], [30, `Connecting to ${device.name}…`], [55, 'Scanning document…'], [80, 'Processing image…'], [95, 'Saving file…'], [100, 'Scan complete!']];
    let step = 0;
    const interval = setInterval(() => {
        if (step >= steps.length) { clearInterval(interval); _onScanComplete(device, format, docType); return; }
        const [p, m] = steps[step]; _setProgress(p, m); step++;
    }, 600);
}
function _onScanComplete(device, format, docType) {
    const ext = format.toLowerCase();
    const time = new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }).replace(':', '-');
    const filename = `SCANNED - ${docType} ${time}.${ext}`;
    const size = (Math.random() * 2 + 0.5).toFixed(1) + ' MB';
    addDocument(_scanEmpId, { name: filename, type: 'scan', size, date: getToday(), source: 'scan' });
    closeScanModal();
    showToast(`Document scanned via ${device.name}.`, 'success');
    const emp = getEmployeeById(_scanEmpId);
    if (emp) { renderTabDocs(emp); refreshPanelHeader(); }
}
```

## "./js/components/departments.js";
```javascript
let _editingDeptId = null;
function renderDepartmentPage() {
    const depts = getAllDepartments(), emps = getAllEmployees();
    if (!depts.length) { setHTML('dept-grid', '<div class="empty">No departments yet.</div>'); return; }
    setHTML('dept-grid', depts.map(dept => {
        const count = emps.filter(e => e.dept === dept.name).length;
        return `
      <div class="dept-card">
        <div class="dept-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <h4>${dept.name}</h4>
        <div class="dsub">${dept.description || 'No description'}</div>
        <div class="dcount">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          ${count} employee(s)
        </div>
        <div style="display:flex;gap:7px;">
          <button class="btn btn-sm btn-edit" onclick="openDeptModal(${dept.id})">Edit</button>
          <button class="btn btn-sm btn-del"  onclick="handleDeleteDept(${dept.id})">Delete</button>
        </div>
      </div>`;
    }).join(''));
}
function openDeptModal(deptId = null) {
    _editingDeptId = deptId;
    getEl('dept-modal-title').textContent = deptId ? 'Edit Department' : 'Add Department';
    if (deptId) { const d = getDepartmentById(deptId); getEl('d-name').value = d.name; getEl('d-desc').value = d.description ?? ''; }
    else { getEl('d-name').value = ''; getEl('d-desc').value = ''; }
    getEl('dept-overlay').classList.add('open');
}
function closeDeptModal() { getEl('dept-overlay').classList.remove('open'); }
function saveDept() {
    const name = getEl('d-name').value.trim();
    if (!name) { showToast('Department name is required.', 'error'); return; }
    const data = { name, description: getEl('d-desc').value.trim() };
    if (_editingDeptId) { updateDepartment(_editingDeptId, data); showToast('Department updated.', 'success'); }
    else { addDepartment(data); showToast('Department added.', 'success'); }
    closeDeptModal(); renderDepartmentPage(); populateDeptDropdowns();
}
function handleDeleteDept(deptId) {
    const dept = getDepartmentById(deptId);
    const inUse = getAllEmployees().some(e => e.dept === dept?.name);
    if (inUse) { showToast('Cannot delete: department still has employees.', 'error'); return; }
    if (!confirm(`Delete department "${dept?.name}"?`)) return;
    deleteDepartment(deptId); renderDepartmentPage(); populateDeptDropdowns();
    showToast('Department deleted.', 'success');
}
```

## "./js/components/backup.js";
```javascript
function renderBackupPage() {
    const backups = getAllBackups();
    setHTML('bk-list', backups.length
        ? backups.map(b => `
        <div class="bk-item">
          <div>
            <div class="bk-name">${b.name}</div>
            <div class="bk-meta">${b.size} &middot; ${b.date}</div>
          </div>
          <div class="bk-acts">
            <button class="btn btn-sm btn-edit" onclick="handleDownloadBackup(${b.id})">Download</button>
            <button class="btn btn-sm btn-del"  onclick="handleDeleteBackup(${b.id})">Delete</button>
          </div>
        </div>`).join('')
        : '<p style="font-size:12px;color:var(--text-3);text-align:center;padding:16px 0;">No backups yet.</p>');
}
function handleCreateBackup() {
    const today = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    addBackup(`EduRecords_Backup_${today}.json`, { version: '1.0.0', createdAt: new Date().toISOString(), employees: getAllEmployees(), departments: getAllDepartments() });
    renderBackupPage(); showToast('Backup created.', 'success');
}
function handleDownloadBackup(backupId) {
    const backup = getBackupById(backupId);
    if (!backup) { showToast('Backup not found.', 'error'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([backup.data], { type: 'application/json' }));
    a.download = backup.name; a.click();
    showToast('Backup downloaded.', 'success');
}
function handleDeleteBackup(backupId) {
    if (!confirm('Delete this backup?')) return;
    deleteBackup(backupId); renderBackupPage(); showToast('Backup deleted.', 'success');
}
function handleRestoreBackup(input) {
    const file = input.files[0];
    if (!file) return;
    if (!confirm('Restore from backup? ALL current records will be replaced.')) { input.value = ''; return; }
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            replaceAll(data.employees ?? []);
            if (data.departments) replaceDepts(data.departments);
            renderEmployeeTable(App.searchQuery); populateDeptDropdowns();
            showToast('Data restored successfully.', 'success');
        } catch { showToast('Invalid backup file.', 'error'); }
        input.value = '';
    };
    reader.readAsText(file);
}
```

## "./js/components/settings.js";
```javascript
function renderSettingsPage() { renderUserTable(); refreshStats(); }
function handleToggleDark() {
    App.prefs.darkMode = !App.prefs.darkMode;
    document.body.classList.toggle('dark', App.prefs.darkMode);
    getEl('dark-toggle').classList.toggle('on', App.prefs.darkMode);
    App.savePrefs();
}
function handleSetFont(size, btnEl) {
    App.prefs.fontSize = size;
    document.documentElement.style.setProperty('--fs', size + 'px');
    document.querySelectorAll('.fs-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
    App.savePrefs();
    showToast(`Font size set to ${size}px.`, 'info');
}
function renderUserTable() {
    setHTML('user-table', `
    <tr><th>Name</th><th>Username</th><th>Role</th><th></th></tr>
    ${getAllUsers().map(u => `
      <tr>
        <td>${u.name}</td>
        <td><code style="background:var(--bg-base);padding:2px 8px;border-radius:6px;font-size:12px;font-family:'DM Mono',monospace;">${u.username}</code></td>
        <td><span class="badge active" style="font-size:10px;">${u.role}</span></td>
        <td>${u.id !== 1
            ? `<button class="btn btn-sm btn-del" onclick="handleDeleteUser(${u.id})">Remove</button>`
            : `<span style="font-size:11px;color:var(--text-3);">Protected</span>`}</td>
      </tr>`).join('')}`);
}
function openAddUserModal() {
    ['u-name', 'u-user', 'u-pass'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const roleEl = document.getElementById('u-role'); if (roleEl) roleEl.value = 'HR Administrator';
    getEl('user-overlay').classList.add('open');
}
function closeAddUserModal() { getEl('user-overlay').classList.remove('open'); }
function handleSaveUser() {
    const name = getEl('u-name').value.trim(), username = getEl('u-user').value.trim().toLowerCase(), password = getEl('u-pass').value, role = getEl('u-role').value;
    if (!name || !username || !password) { showToast('All fields are required.', 'error'); return; }
    if (password.length < 4) { showToast('Password must be at least 4 characters.', 'error'); return; }
    try { addUser({ name, username, password, role }); closeAddUserModal(); renderUserTable(); showToast(`User "${username}" created.`, 'success'); }
    catch (err) { showToast(err.message, 'error'); }
}
function handleDeleteUser(userId) {
    if (!confirm('Remove this user account?')) return;
    try { deleteUser(userId); renderUserTable(); showToast('User removed.', 'success'); }
    catch (err) { showToast(err.message, 'error'); }
}
function refreshStats() {
    const el = document.getElementById('db-stats');
    if (el) el.textContent = `${getAllEmployees().length} employees · ${getAllDepartments().length} departments · ${getAllBackups().length} backup(s)`;
}
```

## "./js/components/export.js";
```javascript
function exportToCSV() {
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Contact', 'Address', 'Position', 'Department', 'Status', 'Start Date'];
    const rows = getAllEmployees().map(e => [e.id, e.fname, e.lname, e.email, e.contact, e.address, e.position, e.dept, e.status, e.start_date]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `EduRecords_${getToday()}.csv`; a.click();
    showToast('CSV exported.', 'success');
}
function exportToPDF() {
    const rows = getAllEmployees().map(e =>
        `<tr><td>${e.fname} ${e.lname}</td><td>${e.email}</td><td>${e.position}</td><td>${e.dept ?? '—'}</td><td>${e.status}</td><td>${e.start_date ?? '—'}</td></tr>`
    ).join('');
    getEl('print-area').innerHTML = `
    <style>
      @page{size:A4;margin:18mm;}
      body{font-family:'DM Sans',Arial;font-size:10pt;}
      h2{color:#062b6e;border-bottom:3px solid #062b6e;padding-bottom:8px;margin-bottom:14px;letter-spacing:-.5px;}
      table{width:100%;border-collapse:collapse;}
      th{background:#062b6e;color:#fff;padding:8px 10px;text-align:left;font-size:9pt;}
      td{padding:7px 10px;border-bottom:1px solid #e2e8f0;}
      tr:nth-child(even) td{background:#f8fafc;}
    </style>
    <h2>EduRecords — Employee Report</h2>
    <p style="color:#4b5875;font-size:9pt;">Generated: ${new Date().toLocaleString('en-PH')} · ${getAllEmployees().length} employee(s)</p>
    <table style="margin-top:14px">
      <thead><tr><th>Name</th><th>Email</th><th>Position</th><th>Department</th><th>Status</th><th>Start Date</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
    window.print();
}
```
