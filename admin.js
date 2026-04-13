/* ============================================================
   admin.js — Admin moderation panel logic
   ============================================================ */

const STORAGE_KEY = 'commentBoard_comments';

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
    pending:  '<span class="badge badge-pending">Pending</span>',
    approved: '<span class="badge badge-approved">Approved</span>',
    rejected: '<span class="badge badge-rejected">Rejected</span>',
  }[c.status] || '';

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

  const timestamp = formatDate(c.createdAt);

  return `
    <div class="admin-comment-card status-${c.status}" id="card-${escapeHtml(c.id)}">
      <div class="admin-meta">
        <div class="admin-author-info">
          <div class="admin-author-name">${escapeHtml(c.name)}</div>
          <div class="admin-author-email">${escapeHtml(c.email)}</div>
        </div>
        <div class="admin-right">
          ${statusBadge}
          <div class="admin-date">${timestamp}</div>
        </div>
      </div>
      <div class="admin-body">${escapeHtml(c.message)}</div>
      <div class="admin-actions">
        ${approveBtn}
        ${rejectBtn}
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
  initTabs();
  initBulkActions();
  render();
});
