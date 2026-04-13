/* ============================================================
   app.js — Public comment board page logic
   ============================================================ */

const STORAGE_KEY = 'commentBoard_comments';
const REACTIONS_KEY = 'commentBoard_reactions';

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

function getReactions() {
  try {
    return JSON.parse(localStorage.getItem(REACTIONS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveReactions(reactions) {
  localStorage.setItem(REACTIONS_KEY, JSON.stringify(reactions));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function getInitials(name) {
  if (!name || name.trim() === '') return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Toast ─────────────────────────────────────────────────────

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// ── Reactions ─────────────────────────────────────────────────

function toggleReaction(commentId, emoji) {
  const reactions = getReactions();
  if (!reactions[commentId]) reactions[commentId] = {};
  
  if (reactions[commentId][emoji]) {
    delete reactions[commentId][emoji];
  } else {
    reactions[commentId][emoji] = true;
  }
  
  saveReactions(reactions);
  renderApprovedComments();
}

function getReactionCount(commentId, emoji) {
  // In a real app, this would come from a server
  // For demo, we generate consistent pseudo-counts based on comment ID
  const hash = commentId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return (hash % 5) + (getReactions()[commentId]?.[emoji] ? 1 : 0);
}

function hasUserReacted(commentId, emoji) {
  return !!getReactions()[commentId]?.[emoji];
}

// ── Render approved comments ──────────────────────────────────

function renderApprovedComments() {
  const list = document.getElementById('approved-comments');
  const countEl = document.getElementById('count-num');
  const comments = getComments().filter(c => c.status === 'approved');

  countEl.textContent = comments.length;

  if (comments.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">&#128172;</div>
        <p>No voices shared yet. Be the first to speak up!</p>
      </div>`;
    return;
  }

  // Newest approved first
  const sorted = [...comments].sort((a, b) => new Date(b.approvedAt || b.createdAt) - new Date(a.approvedAt || a.createdAt));

  list.innerHTML = sorted.map(c => {
    const reactions = ['&#128077;', '&#10084;&#65039;', '&#128079;', '&#129309;']; // 👍 ❤️ 👏 🤝
    const reactionHtml = reactions.map(emoji => {
      const count = getReactionCount(c.id, emoji);
      const active = hasUserReacted(c.id, emoji) ? 'active' : '';
      return `<button class="reaction-btn ${active}" onclick="toggleReaction('${c.id}', '${emoji}')">${emoji} ${count}</button>`;
    }).join('');
    
    return `
    <article class="comment-card">
      <div class="comment-meta">
        <div class="comment-avatar">${escapeHtml(getInitials(c.name || 'Anonymous'))}</div>
        <div>
          <div class="comment-author">${escapeHtml(c.name || 'Anonymous')}</div>
        </div>
        <span class="comment-date">${formatDate(c.approvedAt || c.createdAt)}</span>
      </div>
      <div class="comment-body">${escapeHtml(c.message)}</div>
      <div class="reactions">
        ${reactionHtml}
      </div>
    </article>
  `}).join('');
}

// ── Form handling ─────────────────────────────────────────────

function initForm() {
  const form      = document.getElementById('comment-form');
  const nameEl    = document.getElementById('name');
  const emailEl   = document.getElementById('email');
  const messageEl = document.getElementById('message');
  const charEl    = document.getElementById('char-counter');
  const submitBtn = document.getElementById('submit-btn');
  const successEl = document.getElementById('submit-success');

  // Character counter
  messageEl.addEventListener('input', () => {
    const len = messageEl.value.length;
    charEl.textContent = `${len} / 2000`;
    charEl.classList.toggle('over', len > 2000);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name    = nameEl.value.trim() || 'Anonymous';
    const email   = emailEl.value.trim();
    const message = messageEl.value.trim();

    // Basic validation
    if (!message) {
      showToast('Please share your experience.', 'error');
      messageEl.focus();
      return;
    }

    if (message.length > 2000) {
      showToast('Message exceeds 2,000 characters.', 'error');
      messageEl.focus();
      return;
    }

    // Build comment object
    const comment = {
      id:        generateId(),
      name,
      email: email || null,
      message,
      status:    'pending',
      createdAt: new Date().toISOString(),
    };

    const comments = getComments();
    comments.push(comment);
    saveComments(comments);

    // Reset form
    form.reset();
    charEl.textContent = '0 / 2000';
    submitBtn.disabled = true;
    successEl.style.display = 'flex';

    setTimeout(() => {
      submitBtn.disabled = false;
    }, 3000);
  });
}

// ── Listen for storage changes (cross-tab) ────────────────────

window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) {
    renderApprovedComments();
  }
});

// ── Boot ──────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initForm();
  renderApprovedComments();
});
