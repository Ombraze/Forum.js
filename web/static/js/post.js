let currentUser = null;
let currentPostId = null;
let currentPost = null;
let allCategories = [];
let editingCommentId = null;

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

function renderReactionButtons(type, id, reactions) {
  const r = reactions ?? { likes: 0, dislikes: 0, userReaction: null };
  const userValue = Number(r.userReaction);
  return `
    <div class="reactions" data-reactions-for="${type}-${id}">
      <button type="button" class="reaction-btn${userValue === 1 ? ' reaction-btn--active' : ''}" data-react="${type}" data-id="${id}" data-value="1">
        J'aime <span>${r.likes}</span>
      </button>
      <button type="button" class="reaction-btn reaction-btn--down${userValue === -1 ? ' reaction-btn--active' : ''}" data-react="${type}" data-id="${id}" data-value="-1">
        Je n'aime pas <span>${r.dislikes}</span>
      </button>
    </div>`;
}

function showPostView() {
  document.getElementById('post-view')?.removeAttribute('hidden');
  document.getElementById('post-edit')?.setAttribute('hidden', '');
}

function showPostEdit() {
  document.getElementById('post-view')?.setAttribute('hidden', '');
  document.getElementById('post-edit')?.removeAttribute('hidden');
}

function showEditPostError(message) {
  const el = document.getElementById('edit-post-error');
  if (!el) return;
  if (message) {
    el.textContent = message;
    el.removeAttribute('hidden');
  } else {
    el.setAttribute('hidden', '');
  }
}

function renderEditCategoryCheckboxes(selectedIds = []) {
  const container = document.getElementById('edit-post-categories');
  if (!container) return;

  const selected = new Set(selectedIds.map(Number));
  container.innerHTML = allCategories
    .map(
      (c) => `
      <label class="forum-checkbox">
        <input type="checkbox" name="category" value="${c.id}"${selected.has(c.id) ? ' checked' : ''}>
        ${escapeHtml(c.name)}
      </label>`,
    )
    .join('');
}

async function loadAllCategories() {
  const res = await fetch('/api/categories');
  if (!res.ok) throw new Error('categories');
  const data = await res.json();
  allCategories = data.categories;
}

function openPostEdit() {
  if (!currentPost) return;

  const form = document.getElementById('edit-post-form');
  if (!form) return;

  form.title.value = currentPost.title;
  form.content.value = currentPost.content;
  form.newCategories.value = '';
  renderEditCategoryCheckboxes(currentPost.categoryIds ?? []);
  showEditPostError('');
  showPostEdit();
}

function renderCommentItem(c) {
  if (editingCommentId === c.id) {
    return `
      <li class="card comment">
        <p class="comment__meta">par ${escapeHtml(c.author)} — ${formatDate(c.createdAt)}</p>
        <form class="comment__edit-form" data-save-comment="${c.id}">
          <textarea name="content" required>${escapeHtml(c.content)}</textarea>
          <div class="comment__edit-actions">
            <button type="submit" class="btn btn--sm">Enregistrer</button>
            <button type="button" class="btn btn--ghost btn--sm" data-cancel-comment="${c.id}">Annuler</button>
          </div>
        </form>
      </li>`;
  }

  const ownerActions = currentUser?.id === c.userId
    ? `<div class="comment__actions">
        <button type="button" class="btn btn--ghost btn--sm" data-edit-comment="${c.id}">Modifier</button>
        <button type="button" class="btn btn--ghost btn--sm forum-post__delete" data-delete-comment="${c.id}">Supprimer</button>
      </div>`
    : '';

  return `
    <li class="card comment">
      <div class="comment__header">
        <p class="comment__meta">par ${escapeHtml(c.author)} — ${formatDate(c.createdAt)}</p>
        ${ownerActions}
      </div>
      <p class="comment__content">${escapeHtml(c.content)}</p>
      ${renderReactionButtons('comment', c.id, c.reactions)}
    </li>`;
}

function updateReactionAuthHint() {
  const hint = document.getElementById('reaction-login-hint');
  if (hint) hint.hidden = !!currentUser;
}

function updatePostReactions(reactions) {
  const container = document.getElementById('post-reactions');
  if (container && currentPostId) {
    container.innerHTML = renderReactionButtons('post', currentPostId, reactions);
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
  list.innerHTML = comments.map((c) => renderCommentItem(c)).join('');
}

function renderPost(post) {
  const loading = document.getElementById('post-loading');
  const error = document.getElementById('post-error');
  const detail = document.getElementById('post-detail');
  const ownerActions = document.getElementById('post-owner-actions');

  currentPost = post;
  currentPostId = post.id;
  editingCommentId = null;

  if (loading) loading.setAttribute('hidden', '');
  if (error) error.setAttribute('hidden', '');

  document.getElementById('post-title').textContent = post.title;
  document.getElementById('post-meta').textContent =
    `par ${post.author} — ${formatDate(post.createdAt)}`;
  document.getElementById('post-content').textContent = post.content;
  document.title = `${post.title} — Forum.js`;

  renderBadges(post.categories);

  if (ownerActions) {
    if (currentUser?.id === post.userId) {
      ownerActions.removeAttribute('hidden');
    } else {
      ownerActions.setAttribute('hidden', '');
    }
  }

  if (detail) detail.removeAttribute('hidden');
  showPostView();
  updatePostReactions(post.reactions ?? { likes: 0, dislikes: 0, userReaction: null });
  updateReactionAuthHint();
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
      updateReactionAuthHint();
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
    updateReactionAuthHint();
  } catch {
    currentUser = null;
    updateCommentForm();
    updateReactionAuthHint();
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

async function handleReaction(type, id, value) {
  if (!currentUser) {
    const hint = document.getElementById('reaction-login-hint');
    if (hint) hint.removeAttribute('hidden');
    return;
  }

  const url = type === 'post'
    ? `/api/posts/${id}/reactions`
    : `/api/comments/${id}/reactions`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      alert('Erreur serveur — redémarrez npm run dev puis réessayez.');
      return;
    }

    if (!res.ok) {
      alert(data.error || 'Impossible d\'enregistrer la réaction.');
      return;
    }

    if (type === 'post') {
      updatePostReactions(data.reactions);
    } else {
      await loadComments();
    }
  } catch {
    alert('Impossible de contacter le serveur.');
  }
}

async function handleUpdatePost(e) {
  e.preventDefault();
  showEditPostError('');

  const form = e.target;
  const categoryIds = [...form.querySelectorAll('input[name="category"]:checked')].map(
    (input) => Number(input.value),
  );
  const categoryNames = (form.newCategories?.value ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

  try {
    const res = await fetch(`/api/posts/${currentPostId}`, {
      method: 'PUT',
      credentials: 'include',
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
      showEditPostError(data.error || 'Erreur lors de la modification');
      return;
    }

    await loadPost();
  } catch {
    showEditPostError('Impossible de contacter le serveur.');
  }
}

async function handleUpdateComment(e, commentId) {
  e.preventDefault();
  const content = e.target.content.value.trim();
  if (!content) return;

  try {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Impossible de modifier le commentaire.');
      return;
    }

    editingCommentId = null;
    await loadComments();
  } catch {
    alert('Impossible de contacter le serveur.');
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
  try {
    await loadAllCategories();
  } catch {
    /* catégories optionnelles pour l'édition */
  }
  await loadPost();

  document.getElementById('comment-form')?.addEventListener('submit', handleCreateComment);
  document.getElementById('edit-post-form')?.addEventListener('submit', handleUpdatePost);
  document.getElementById('post-edit-btn')?.addEventListener('click', openPostEdit);
  document.getElementById('post-delete')?.addEventListener('click', () => {
    if (currentPostId) handleDeletePost(currentPostId);
  });
  document.getElementById('edit-post-cancel')?.addEventListener('click', () => {
    showEditPostError('');
    showPostView();
  });

  document.addEventListener('click', (e) => {
    const reactBtn = e.target.closest('[data-react]');
    if (reactBtn) {
      e.preventDefault();
      handleReaction(
        reactBtn.dataset.react,
        Number(reactBtn.dataset.id),
        Number(reactBtn.dataset.value),
      );
      return;
    }

    const editCommentBtn = e.target.closest('[data-edit-comment]');
    if (editCommentBtn) {
      editingCommentId = Number(editCommentBtn.dataset.editComment);
      loadComments();
      return;
    }

    const cancelCommentBtn = e.target.closest('[data-cancel-comment]');
    if (cancelCommentBtn) {
      editingCommentId = null;
      loadComments();
      return;
    }

    const deleteCommentBtn = e.target.closest('[data-delete-comment]');
    if (deleteCommentBtn) {
      handleDeleteComment(Number(deleteCommentBtn.dataset.deleteComment));
    }
  });

  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-save-comment]');
    if (form) {
      handleUpdateComment(e, Number(form.dataset.saveComment));
    }
  });
});
