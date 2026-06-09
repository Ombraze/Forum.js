import { setToken } from './auth-storage.js';

function showMessage(text, type) {
  let el = document.getElementById('auth-message');
  if (!el) {
    el = document.createElement('p');
    el.id = 'auth-message';
    document.querySelector('.subtitle')?.after(el);
  }
  el.className = `auth-message auth-message--${type}`;
  el.textContent = text;
}

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  if (params.get('registered') === '1') {
    showMessage('Compte créé. Vous pouvez vous connecter.', 'success');
  }

  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username.value,
          password: form.password.value,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showMessage(data.error || 'Erreur de connexion', 'error');
        return;
      }

      setToken(data.token);
      location.href = '/app';
    } catch {
      showMessage('Impossible de contacter le serveur.', 'error');
    }
  });
});
