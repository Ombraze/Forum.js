let currentUser = null;
let currentPostId = null;

function getPostIdFromUrl() {
  const match = location.pathname.match(/^\/posts\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showError(message) {
  const loading = document.getElementById('post-loading');
  const error = document.getElementById('post-error');
  const detail = document.getElementById('post-detail');
  const comments = document.getElementById('comments-section');

  if (loading) loading.setAttribute('hidden', '');
  if (detail) detail.setAttribute('hidden', '');
  if (comments) comments.setAttribute('hidden', '');
  if (error) {
    error.textContent = message;
    error.removeAttribute('hidden');
  }
}

function renderBadges(names) {
  const container = document.getElementById('post-badges');
  if (!container) return;

  container.innerHTML = (names ?? [])
    .map((name) => `<span class="forum-badge">${escapeHtml(name)}</span>`)
    .join('');
}

function updateCommentForm() {
  const form = document.getElementById('comment-form');
  const hint = document.getElementById('comment-login-hint');
  if (!form || !hint) return;

  if (currentUser) {
    form.removeAttribute('hidden');
    hint.setAttribute('hidden', '');
  } else {
    form.setAttribute('hidden', '');
    hint.removeAttribute('hidden');
  }
}

function renderComments(comments) {
  const section = document.getElementById('comments-section');
  const list = document.getElementById('comments-list');
  const empty = document.getElementById('comments-empty');
  if (!section || !list) return;

  section.removeAttribute('hidden');

  if (!comments.length) {
    list.innerHTML = '';
    empty?.removeAttribute('hidden');
    return;
  }

  empty?.setAttribute('hidden', '');
  list.innerHTML = comments
    .map(
      (c) => `
      <li class="card comment">
        <div class="comment__header">
          <p class="comment__meta">par ${escapeHtml(c.author)} — ${formatDate(c.createdAt)}</p>
          ${
            currentUser?.id === c.userId
              ? `<button type="button" class="btn btn--ghost btn--sm forum-post__delete" data-delete-comment="${c.id}">Supprimer</button>`
              : ''
          }
        </div>
        <p class="comment__content">${escapeHtml(c.content)}</p>
      </li>`,
    )
    .join('');
}

function renderPost(post) {
  const loading = document.getElementById('post-loading');
  const error = document.getElementById('post-error');
  const detail = document.getElementById('post-detail');
  const deleteBtn = document.getElementById('post-delete');

  currentPostId = post.id;

  if (loading) loading.setAttribute('hidden', '');
  if (error) error.setAttribute('hidden', '');

  document.getElementById('post-title').textContent = post.title;
  document.getElementById('post-meta').textContent =
    `par ${post.author} — ${formatDate(post.createdAt)}`;
  document.getElementById('post-content').textContent = post.content;
  document.title = `${post.title} — Forum.js`;

  renderBadges(post.categories);

  if (deleteBtn) {
    if (currentUser?.id === post.userId) {
      deleteBtn.removeAttribute('hidden');
      deleteBtn.onclick = () => handleDeletePost(post.id);
    } else {
      deleteBtn.setAttribute('hidden', '');
    }
  }

  if (detail) detail.removeAttribute('hidden');
  updateCommentForm();
}

async function updateNavbar() {
  const actions = document.getElementById('navbar-actions');
  if (!actions) return;

  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) {
      currentUser = null;
      actions.innerHTML = `
        <a href="/login" class="btn btn--primary">Connexion</a>
        <a href="/register" class="btn btn--ghost">S'inscrire</a>
      `;
      updateCommentForm();
      return;
    }

    const { user } = await res.json();
    currentUser = user;
    actions.innerHTML = `
      <span class="forum-user">${escapeHtml(user.username)}</span>
      <button type="button" id="logout-btn" class="btn btn--ghost">Déconnexion</button>
    `;
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      location.href = '/';
    });
    updateCommentForm();
  } catch {
    currentUser = null;
    updateCommentForm();
  }
}

async function loadPost() {
  const postId = getPostIdFromUrl();
  if (!postId) {
    showError('Publication introuvable.');
    return;
  }

  try {
    const res = await fetch(`/api/posts/${postId}`);
    const data = await res.json();

    if (!res.ok) {
      showError(data.error || 'Publication introuvable.');
      return;
    }

    renderPost(data.post);
    await loadComments();
  } catch {
    showError('Impossible de charger la publication.');
  }
}

async function loadComments() {
  if (!currentPostId) return;

  try {
    const res = await fetch(`/api/posts/${currentPostId}/comments`);
    if (!res.ok) throw new Error('fetch failed');
    const { comments } = await res.json();
    renderComments(comments);
  } catch {
    const section = document.getElementById('comments-section');
    if (section) {
      section.removeAttribute('hidden');
      section.innerHTML = '<p class="text-muted">Impossible de charger les commentaires.</p>';
    }
  }
}

function showCommentError(message) {
  const el = document.getElementById('comment-error');
  if (!el) return;
  if (message) {
    el.textContent = message;
    el.removeAttribute('hidden');
  } else {
    el.setAttribute('hidden', '');
  }
}

async function handleCreateComment(e) {
  e.preventDefault();
  showCommentError('');

  const form = e.target;
  const content = form.content.value.trim();
  if (!content) {
    showCommentError('Le commentaire ne peut pas être vide.');
    return;
  }

  try {
    const res = await fetch(`/api/posts/${currentPostId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    const data = await res.json();
    if (!res.ok) {
      showCommentError(data.error || 'Erreur lors de l\'ajout du commentaire');
      return;
    }

    form.reset();
    await loadComments();
  } catch {
    showCommentError('Impossible de contacter le serveur.');
  }
}

async function handleDeletePost(postId) {
  if (!confirm('Supprimer cette publication ?')) return;

  try {
    const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Impossible de supprimer la publication.');
      return;
    }
    location.href = '/app';
  } catch {
    alert('Impossible de contacter le serveur.');
  }
}

async function handleDeleteComment(commentId) {
  if (!confirm('Supprimer ce commentaire ?')) return;

  try {
    const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Impossible de supprimer le commentaire.');
      return;
    }
    await loadComments();
  } catch {
    alert('Impossible de contacter le serveur.');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await updateNavbar();
  await loadPost();

  document.getElementById('comment-form')?.addEventListener('submit', handleCreateComment);

  document.getElementById('comments-list')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-delete-comment]');
    if (btn) handleDeleteComment(Number(btn.dataset.deleteComment));
  });
});
