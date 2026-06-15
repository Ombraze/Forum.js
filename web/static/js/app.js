let categories = [];
let activeCategory = null;
let activeUserFilter = null;
let currentUser = null;

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

function renderCategoryBadges(names) {
  if (!names?.length) return '';
  return `<div class="forum-badges">${names
    .map((name) => `<span class="forum-badge">${escapeHtml(name)}</span>`)
    .join('')}</div>`;
}

function getEmptyMessage() {
  if (activeUserFilter === 'mine') {
    return activeCategory
      ? 'Vous n\'avez aucune publication dans cette catégorie.'
      : 'Vous n\'avez pas encore publié.';
  }
  if (activeUserFilter === 'liked') {
    return activeCategory
      ? 'Vous n\'avez liké aucune publication dans cette catégorie.'
      : 'Vous n\'avez liké aucune publication.';
  }
  return activeCategory
    ? 'Aucune publication dans cette catégorie.'
    : 'Aucune publication pour le moment.';
}

function renderPosts(posts) {
  const container = document.getElementById('posts-list');
  const empty = document.getElementById('posts-empty');
  if (!container) return;

  container.innerHTML = '';

  if (!posts.length) {
    empty.textContent = getEmptyMessage();
    empty.removeAttribute('hidden');
    return;
  }

  empty.setAttribute('hidden', '');
  container.innerHTML = posts
    .map(
      (p) => `
      <li class="card forum-post">
        <div class="forum-post__header">
          ${renderCategoryBadges(p.categories)}
          ${
            currentUser?.id === p.userId
              ? `<button type="button" class="btn btn--ghost btn--sm forum-post__delete" data-delete-post="${p.id}" aria-label="Supprimer la publication">Supprimer</button>`
              : ''
          }
        </div>
        <h2>
          <a href="/posts/${p.id}">${escapeHtml(p.title)}</a>
        </h2>
        <p class="forum-post__meta">
          par ${escapeHtml(p.author)} — ${formatDate(p.createdAt)}
        </p>
      </li>`,
    )
    .join('');
}

function renderUserFilters() {
  const container = document.getElementById('user-filters');
  if (!container) return;

  if (!currentUser) {
    activeUserFilter = null;
    container.setAttribute('hidden', '');
    container.innerHTML = '';
    return;
  }

  container.removeAttribute('hidden');
  const buttons = [
    {
      value: '',
      label: 'Toutes les publications',
      active: activeUserFilter === null,
    },
    {
      value: 'mine',
      label: 'Mes publications',
      active: activeUserFilter === 'mine',
    },
    {
      value: 'liked',
      label: 'Posts likés',
      active: activeUserFilter === 'liked',
    },
  ];

  container.innerHTML = buttons
    .map(
      ({ value, label, active }) => `
      <button type="button" class="forum-filter${active ? ' forum-filter--active' : ''}" data-user-filter="${value}">
        ${escapeHtml(label)}
      </button>`,
    )
    .join('');

  container.querySelectorAll('[data-user-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.userFilter;
      activeUserFilter = value || null;
      renderUserFilters();
      loadPosts();
    });
  });
}

function renderFilters() {
  const container = document.getElementById('category-filters');
  if (!container) return;

  const buttons = [
    `<button type="button" class="forum-filter${activeCategory === null ? ' forum-filter--active' : ''}" data-category="">Toutes</button>`,
    ...categories.map(
      (c) => `
      <button type="button" class="forum-filter${activeCategory === c.id ? ' forum-filter--active' : ''}" data-category="${c.id}">
        ${escapeHtml(c.name)}
      </button>`,
    ),
  ];

  container.innerHTML = buttons.join('');
  container.querySelectorAll('.forum-filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.category;
      activeCategory = value ? Number(value) : null;
      renderFilters();
      loadPosts();
    });
  });
}

function renderCategoryCheckboxes() {
  const container = document.getElementById('post-categories');
  if (!container) return;

  container.innerHTML = categories
    .map(
      (c) => `
      <label class="forum-checkbox">
        <input type="checkbox" name="category" value="${c.id}">
        ${escapeHtml(c.name)}
      </label>`,
    )
    .join('');
}

function showCreateForm(show) {
  const section = document.getElementById('create-post');
  if (section) section.hidden = !show;
}

function showNavbarLoggedOut() {
  const actions = document.getElementById('navbar-actions');
  if (!actions) return;

  actions.innerHTML = `
    <a href="/login" class="btn btn--primary">Connexion</a>
    <a href="/register" class="btn btn--ghost">S'inscrire</a>
  `;
}

async function updateNavbar() {
  const actions = document.getElementById('navbar-actions');
  if (!actions) return;

  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) {
      currentUser = null;
      showCreateForm(false);
      showNavbarLoggedOut();
      renderUserFilters();
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
    showCreateForm(true);
    renderUserFilters();
  } catch {
    currentUser = null;
    showCreateForm(false);
    showNavbarLoggedOut();
    renderUserFilters();
  }
}

async function loadCategories() {
  const res = await fetch('/api/categories');
  if (!res.ok) throw new Error('categories');
  const data = await res.json();
  categories = data.categories;
  renderFilters();
  renderCategoryCheckboxes();
}

async function loadPosts() {
  const empty = document.getElementById('posts-empty');
  try {
    const params = new URLSearchParams();
    if (activeCategory) params.set('category', String(activeCategory));
    if (activeUserFilter === 'mine') params.set('mine', '1');
    if (activeUserFilter === 'liked') params.set('liked', '1');

    const query = params.toString();
    const url = query ? `/api/posts?${query}` : '/api/posts';
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('fetch failed');
    const { posts } = await res.json();
    renderPosts(posts);
  } catch {
    if (empty) {
      empty.textContent = 'Impossible de charger les publications.';
      empty.removeAttribute('hidden');
    }
  }
}

function showCreateError(message) {
  const el = document.getElementById('create-post-error');
  if (!el) return;
  if (message) {
    el.textContent = message;
    el.removeAttribute('hidden');
  } else {
    el.setAttribute('hidden', '');
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
    await loadPosts();
  } catch {
    alert('Impossible de contacter le serveur.');
  }
}

async function handleCreatePost(e) {
  e.preventDefault();
  showCreateError('');

  const form = e.target;
  const categoryIds = [...form.querySelectorAll('input[name="category"]:checked')].map(
    (input) => Number(input.value),
  );
  const categoryNames = (form.newCategories?.value ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title.value,
        content: form.content.value,
        categoryIds,
        categoryNames,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      showCreateError(data.error || 'Erreur lors de la publication');
      return;
    }

    form.reset();
    await loadCategories();
    await loadPosts();
  } catch {
    showCreateError('Impossible de contacter le serveur.');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await updateNavbar();
  try {
    await loadCategories();
    await loadPosts();
  } catch {
    const empty = document.getElementById('posts-empty');
    if (empty) {
      empty.textContent = 'Impossible de charger le forum.';
      empty.removeAttribute('hidden');
    }
  }

  document.getElementById('create-post-form')?.addEventListener('submit', handleCreatePost);

  document.getElementById('posts-list')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-delete-post]');
    if (btn) handleDeletePost(Number(btn.dataset.deletePost));
  });
});
