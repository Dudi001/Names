const API_BASE_URL = '/api/v1';

function applyTheme() {
  const toggle = document.getElementById('themeToggle');
  const isDark = localStorage.getItem('theme') === 'dark'
    || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);

  document.documentElement.classList.toggle('dark', isDark);
  if (toggle) {
    toggle.checked = isDark;
    toggle.addEventListener('change', () => {
      document.documentElement.classList.toggle('dark', toggle.checked);
      localStorage.setItem('theme', toggle.checked ? 'dark' : 'light');
    });
  }
}

function showMessage(message, type = 'error') {
  const element = document.getElementById('formMessage');
  element.textContent = message;
  element.className = `rounded-lg px-3 py-2 text-center text-sm ${type === 'error'
    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'}`;
}

async function request(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || 'Не удалось выполнить запрос. Попробуйте ещё раз.');
  }
  return data;
}

async function login(username, password) {
  const formData = new URLSearchParams({ username, password });
  const token = await request(`${API_BASE_URL}/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  });
  localStorage.setItem('access_token', token.access_token);
}

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  const form = document.getElementById('registrationForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const password = data.get('password');

    if (password !== data.get('password_confirmation')) {
      showMessage('Пароли не совпадают.');
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Создаём аккаунт…';

    try {
      await request(`${API_BASE_URL}/user/registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: data.get('username').trim(),
          password_hash: password,
          first_name: data.get('first_name').trim(),
          last_name: data.get('last_name').trim() || null,
          email: data.get('email').trim(),
        }),
      });
      await login(data.get('username').trim(), password);
      window.location.replace('index.html');
    } catch (error) {
      showMessage(error.message);
      submitButton.disabled = false;
      submitButton.textContent = 'Зарегистрироваться';
    }
  });
});
