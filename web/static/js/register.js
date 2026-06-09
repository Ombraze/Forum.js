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
  document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username.value,
          email: form.email.value,
          password: form.password.value,
          password_confirm: form.password_confirm.value,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showMessage(data.error || 'Erreur lors de l\'inscription', 'error');
        return;
      }

      location.href = '/login?registered=1';
    } catch {
      showMessage('Impossible de contacter le serveur.', 'error');
    }
  });
});
