const API_BASE_URL = '/api/v1';

function setupTheme() {
  const toggle = document.getElementById('themeToggle');
  const isDark = localStorage.getItem('theme') === 'dark'
    || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
  toggle.checked = isDark;
  toggle.addEventListener('change', () => {
    document.documentElement.classList.toggle('dark', toggle.checked);
    localStorage.setItem('theme', toggle.checked ? 'dark' : 'light');
  });
}

async function authorizedRequest(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.detail || 'Не удалось загрузить профиль.');
    error.status = response.status;
    throw error;
  }
  return data;
}

function logout() {
  localStorage.removeItem('access_token');
  window.location.replace('index.html');
}

document.addEventListener('DOMContentLoaded', async () => {
  setupTheme();
  document.getElementById('logoutButton').addEventListener('click', logout);

  if (!localStorage.getItem('access_token')) {
    window.location.replace('login.html');
    return;
  }

  try {
    const [profile, stats] = await Promise.all([
      authorizedRequest('/user/me'),
      authorizedRequest('/flashcards/stats'),
    ]);
    document.getElementById('profileName').textContent = profile.first_name || profile.username;
    document.getElementById('profileEmail').textContent = profile.email;
    document.getElementById('profileInitial').textContent = (profile.first_name || profile.username || '?').charAt(0).toUpperCase();
    document.getElementById('totalCards').textContent = stats.total;
    document.getElementById('learnedCards').textContent = stats.learned;
    document.getElementById('dueCards').textContent = stats.due_today;
  } catch (error) {
    if (error.status === 401) {
      logout();
      return;
    }
    const message = document.getElementById('profileMessage');
    message.textContent = error.message;
    message.className = 'mt-6 rounded-lg bg-red-100 px-3 py-2 text-center text-sm text-red-800 dark:bg-red-900 dark:text-red-100';
  }
});
