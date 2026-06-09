import { authHeaders, clearToken, getToken } from './auth-storage.js';

let categories = [];
let activeCategory = null;
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

function excerpt(text, max = 200) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
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

function renderPosts(posts) {
  const container = document.getElementById('posts-list');
  const empty = document.getElementById('posts-empty');
  if (!container) return;

  container.innerHTML = '';

  if (!posts.length) {
    empty.textContent = activeCategory
      ? 'Aucun post dans cette catégorie.'
      : 'Aucun post pour le moment.';
    empty.removeAttribute('hidden');
    return;
  }

  empty.setAttribute('hidden', '');
  container.innerHTML = posts
    .map(
      (p) => `
      <li class="card forum-post">
        ${renderCategoryBadges(p.categories)}
        <h2>
          <a href="/posts/${p.id}">${escapeHtml(p.title)}</a>
        </h2>
        <p class="forum-post__meta">
          par ${escapeHtml(p.author)} — ${formatDate(p.createdAt)}
        </p>
        <p class="forum-post__excerpt">${escapeHtml(excerpt(p.content))}</p>
      </li>`,
    )
    .join('');
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

async function updateNavbar() {
  const actions = document.getElementById('navbar-actions');
  if (!actions) return;

  if (!getToken()) {
    currentUser = null;
    showCreateForm(false);
    return;
  }

  try {
    const res = await fetch('/api/auth/me', { headers: authHeaders() });
    if (!res.ok) {
      clearToken();
      currentUser = null;
      showCreateForm(false);
      return;
    }

    const { user } = await res.json();
    currentUser = user;
    actions.innerHTML = `
      <span class="forum-user">${escapeHtml(user.username)}</span>
      <button type="button" id="logout-btn" class="btn btn--ghost">Déconnexion</button>
    `;
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      clearToken();
      location.href = '/';
    });
    showCreateForm(true);
  } catch {
    clearToken();
    currentUser = null;
    showCreateForm(false);
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
    const url = activeCategory
      ? `/api/posts?category=${activeCategory}`
      : '/api/posts';
    const res = await fetch(url);
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

async function handleCreatePost(e) {
  e.preventDefault();
  showCreateError('');

  const form = e.target;
  const categoryIds = [...form.querySelectorAll('input[name="category"]:checked')].map(
    (input) => Number(input.value),
  );

  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        title: form.title.value,
        content: form.content.value,
        categoryIds,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      showCreateError(data.error || 'Erreur lors de la publication');
      return;
    }

    form.reset();
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
});
