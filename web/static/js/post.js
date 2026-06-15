let currentUser = null;

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

  if (loading) loading.setAttribute('hidden', '');
  if (detail) detail.setAttribute('hidden', '');
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

function renderPost(post) {
  const loading = document.getElementById('post-loading');
  const error = document.getElementById('post-error');
  const detail = document.getElementById('post-detail');
  const deleteBtn = document.getElementById('post-delete');

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
      deleteBtn.onclick = () => handleDelete(post.id);
    } else {
      deleteBtn.setAttribute('hidden', '');
    }
  }

  if (detail) detail.removeAttribute('hidden');
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
  } catch {
    currentUser = null;
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
  } catch {
    showError('Impossible de charger la publication.');
  }
}

async function handleDelete(postId) {
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

document.addEventListener('DOMContentLoaded', async () => {
  await updateNavbar();
  await loadPost();
});
