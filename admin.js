/* ============================================================
   admin.js — Admin moderation panel logic
   ============================================================ */

const STORAGE_KEY = 'commentBoard_comments';
const TRUSTED_KEY = 'commentBoard_trustedUsers';
const ADMIN_PASSWORD = 'UNstaff2024!'; // Change this to your desired password
const SESSION_KEY = 'admin_session';

// ── Helpers ──────────────────────────────────────────────────

function getComments() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveComments(comments) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
}

function getTrustedUsers() {
  try {
    return JSON.parse(localStorage.getItem(TRUSTED_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTrustedUsers(users) {
  localStorage.setItem(TRUSTED_KEY, JSON.stringify(users));
}

function isTrustedUser(email) {
  if (!email) return false;
  return getTrustedUsers().includes(email.toLowerCase().trim());
}

function addTrustedUser(email) {
  const users = getTrustedUsers();
  const normalized = email.toLowerCase().trim();
  if (!users.includes(normalized)) {
    users.push(normalized);
    saveTrustedUsers(users);
  }
}

function removeTrustedUser(email) {
  const users = getTrustedUsers().filter(u => u !== email.toLowerCase().trim());
  saveTrustedUsers(users);
}

// ── Login / Session Management ────────────────────────────────

function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

function login() {
  sessionStorage.setItem(SESSION_KEY, 'true');
  document.getElementById('login-overlay').style.display = 'none';
  render();
  renderTrustedUsers();
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  location.reload();
}

function checkPassword() {
  const input = document.getElementById('admin-password');
  const error = document.getElementById('login-error');
  
  console.log('Entered:', input.value);
  console.log('Expected:', ADMIN_PASSWORD);
  console.log('Match:', input.value === ADMIN_PASSWORD);
  
  if (input.value === ADMIN_PASSWORD) {
    login();
  } else {
    error.style.display = 'block';
    input.value = '';
    input.focus();
  }
}

function initLogin() {
  // Check if already logged in
  if (isLoggedIn()) {
    document.getElementById('login-overlay').style.display = 'none';
    return;
  }
  
  // Handle Enter key on password field
  document.getElementById('admin-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkPassword();
  });
}

function togglePasswordVisibility() {
  const passwordInput = document.getElementById('admin-password');
  const toggleBtn = document.querySelector('.toggle-password');
  
  console.log('Toggle clicked. Current type:', passwordInput.type);
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleBtn.textContent = '🙈';
    toggleBtn.title = 'Hide password';
    console.log('Changed to text');
  } else {
    passwordInput.type = 'password';
    toggleBtn.textContent = '👁';
    toggleBtn.title = 'Show password';
    console.log('Changed to password');
  }
}
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── State ─────────────────────────────────────────────────────

let activeTab = 'pending';

// ── Toast ─────────────────────────────────────────────────────

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// ── Counts ────────────────────────────────────────────────────

function getCounts(comments) {
  return {
    pending:  comments.filter(c => c.status === 'pending').length,
    approved: comments.filter(c => c.status === 'approved').length,
    rejected: comments.filter(c => c.status === 'rejected').length,
    all:      comments.length,
  };
}

function updateStats(comments) {
  const counts = getCounts(comments);

  document.getElementById('stat-pending').textContent  = counts.pending;
  document.getElementById('stat-approved').textContent = counts.approved;
  document.getElementById('stat-rejected').textContent = counts.rejected;

  document.getElementById('tab-count-pending').textContent  = counts.pending;
  document.getElementById('tab-count-approved').textContent = counts.approved;
  document.getElementById('tab-count-rejected').textContent = counts.rejected;
  document.getElementById('tab-count-all').textContent      = counts.all;
}

// ── Trusted Users Management ─────────────────────────────────

function renderTrustedUsers() {
  const container = document.getElementById('trusted-users-list');
  const users = getTrustedUsers();
  
  if (users.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:.9rem;">No trusted users yet.</p>';
    return;
  }
  
  container.innerHTML = users.map(email => `
    <div class="trusted-user-item">
      <span>${escapeHtml(email)}</span>
      <button class="btn btn-ghost" onclick="removeTrustedUserAndRender('${escapeHtml(email)}')" style="font-size:.75rem;padding:.3rem .6rem;">Remove</button>
    </div>
  `).join('');
}

function removeTrustedUserAndRender(email) {
  removeTrustedUser(email);
  renderTrustedUsers();
  showToast('Trusted user removed.', 'info');
}

function initTrustedUsersForm() {
  const form = document.getElementById('add-trusted-form');
  const input = document.getElementById('trusted-email');
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = input.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email.', 'error');
      return;
    }
    addTrustedUser(email);
    input.value = '';
    renderTrustedUsers();
    showToast('Trusted user added! Their future posts will be auto-approved.', 'success');
  });
}

// ── Single comment actions ────────────────────────────────────

function approveComment(id) {
  const comments = getComments();
  const idx = comments.findIndex(c => c.id === id);
  if (idx === -1) return;
  comments[idx].status = 'approved';
  comments[idx].approvedAt = new Date().toISOString();
  saveComments(comments);
  showToast('Comment approved.', 'success');
  render();
}

function rejectComment(id) {
  const comments = getComments();
  const idx = comments.findIndex(c => c.id === id);
  if (idx === -1) return;
  comments[idx].status = 'rejected';
  comments[idx].rejectedAt = new Date().toISOString();
  saveComments(comments);
  showToast('Comment rejected.', 'info');
  render();
}

function deleteComment(id) {
  if (!confirm('Permanently delete this comment? This cannot be undone.')) return;
  const comments = getComments().filter(c => c.id !== id);
  saveComments(comments);
  showToast('Comment deleted.', 'info');
  render();
}

function restoreComment(id) {
  const comments = getComments();
  const idx = comments.findIndex(c => c.id === id);
  if (idx === -1) return;
  comments[idx].status = 'pending';
  delete comments[idx].approvedAt;
  delete comments[idx].rejectedAt;
  saveComments(comments);
  showToast('Comment restored to pending.', 'info');
  render();
}

function trustUser(email) {
  if (!email) return;
  addTrustedUser(email);
  renderTrustedUsers();
  showToast(`Added to trusted users: ${email}`, 'success');
}

// ── Bulk actions ──────────────────────────────────────────────

function approveAll() {
  const comments = getComments();
  let count = 0;
  comments.forEach(c => {
    if (c.status === 'pending') {
      c.status = 'approved';
      c.approvedAt = new Date().toISOString();
      count++;
    }
  });
  saveComments(comments);
  showToast(`${count} comment(s) approved.`, 'success');
  render();
}

function rejectAll() {
  const comments = getComments();
  let count = 0;
  comments.forEach(c => {
    if (c.status === 'pending') {
      c.status = 'rejected';
      c.rejectedAt = new Date().toISOString();
      count++;
    }
  });
  saveComments(comments);
  showToast(`${count} comment(s) rejected.`, 'info');
  render();
}

function clearRejected() {
  if (!confirm('Permanently delete all rejected comments?')) return;
  const comments = getComments().filter(c => c.status !== 'rejected');
  saveComments(comments);
  showToast('Rejected comments cleared.', 'info');
  render();
}

// ── Render a single admin card ────────────────────────────────

function buildCommentCard(c) {
  const statusBadge = {
    pending:  '<span class="badge badge-pending">Pending Review</span>',
    approved: '<span class="badge badge-approved">Approved</span>',
    rejected: '<span class="badge badge-rejected">Rejected</span>',
  }[c.status] || '';

  const trusted = c.email && isTrustedUser(c.email);
  const trustedBadge = trusted ? '<span class="badge badge-trusted">&#11088; Trusted</span>' : '';

  const approveBtn = c.status !== 'approved'
    ? `<button class="btn btn-success" onclick="approveComment('${c.id}')" style="font-size:.82rem;padding:.45rem .9rem">&#10003; Approve</button>`
    : '';

  const rejectBtn = c.status !== 'rejected'
    ? `<button class="btn btn-danger" onclick="rejectComment('${c.id}')" style="font-size:.82rem;padding:.45rem .9rem">&#10005; Reject</button>`
    : '';

  const restoreBtn = (c.status === 'approved' || c.status === 'rejected')
    ? `<button class="btn btn-ghost" onclick="restoreComment('${c.id}')" style="font-size:.82rem;padding:.45rem .9rem">&#8635; Restore to Pending</button>`
    : '';

  const deleteBtn = `<button class="btn btn-ghost" onclick="deleteComment('${c.id}')" style="font-size:.82rem;padding:.45rem .9rem;color:var(--danger);border-color:var(--danger-bg)">&#128465; Delete</button>`;

  const trustBtn = (c.email && !trusted)
    ? `<button class="btn btn-primary" onclick="trustUser('${escapeHtml(c.email)}')" style="font-size:.82rem;padding:.45rem .9rem">&#11088; Trust This User</button>`
    : '';

  const timestamp = formatDate(c.createdAt);

  return `
    <div class="admin-comment-card status-${c.status}" id="card-${escapeHtml(c.id)}">
      <div class="admin-meta">
        <div class="admin-author-info">
          <div class="admin-author-name">${escapeHtml(c.name || 'Anonymous')}</div>
          <div class="admin-author-email">${escapeHtml(c.email || 'No email provided')}</div>
        </div>
        <div class="admin-right">
          ${statusBadge}
          ${trustedBadge}
          <div class="admin-date">${timestamp}</div>
        </div>
      </div>
      <div class="admin-body">${escapeHtml(c.message)}</div>
      <div class="admin-actions">
        ${approveBtn}
        ${rejectBtn}
        ${trustBtn}
        ${restoreBtn}
        ${deleteBtn}
      </div>
    </div>
  `;
}

// ── Main render ───────────────────────────────────────────────

function render() {
  const comments = getComments();
  updateStats(comments);

  const filtered = activeTab === 'all'
    ? [...comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    : comments
        .filter(c => c.status === activeTab)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const container = document.getElementById('admin-comment-list');

  // Bulk bar visibility
  const bulkBar = document.getElementById('bulk-bar');
  const heading  = document.getElementById('bulk-heading');
  const approveAllBtn = document.getElementById('approve-all-btn');
  const rejectAllBtn  = document.getElementById('reject-all-btn');
  const clearRejectedBtn = document.getElementById('clear-rejected-btn');

  const isPending  = activeTab === 'pending';
  const isRejected = activeTab === 'rejected';

  approveAllBtn.style.display   = isPending ? '' : 'none';
  rejectAllBtn.style.display    = isPending ? '' : 'none';
  clearRejectedBtn.style.display = isRejected ? '' : 'none';

  const tabLabels = {
    pending:  'Pending Comments',
    approved: 'Approved Comments',
    rejected: 'Rejected Comments',
    all:      'All Comments',
  };
  heading.textContent = tabLabels[activeTab];

  if (filtered.length === 0) {
    const emptyMessages = {
      pending:  'No comments awaiting moderation.',
      approved: 'No approved comments yet.',
      rejected: 'No rejected comments.',
      all:      'No comments have been submitted yet.',
    };
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">&#128172;</div>
        <p>${emptyMessages[activeTab]}</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(buildCommentCard).join('');
}

// ── Tab switching ─────────────────────────────────────────────

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeTab = btn.dataset.tab;
      render();
    });
  });
}

// ── Bulk action buttons ───────────────────────────────────────

function initBulkActions() {
  document.getElementById('approve-all-btn').addEventListener('click', approveAll);
  document.getElementById('reject-all-btn').addEventListener('click', rejectAll);
  document.getElementById('clear-rejected-btn').addEventListener('click', clearRejected);
}

// ── Listen for localStorage changes (cross-tab) ──────────────

window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) render();
});

// ── Boot ──────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  
  if (isLoggedIn()) {
    initTabs();
    initBulkActions();
    initTrustedUsersForm();
    render();
    renderTrustedUsers();
  }
});
