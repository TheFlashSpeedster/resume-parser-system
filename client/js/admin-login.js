document.addEventListener('DOMContentLoaded', async () => {
  try {
    const session = await apiRequest('/api/admin/session');
    if (session.data?.isAuthenticated) {
      window.location.href = '/admin-dashboard';
      return;
    }
  } catch (err) {
    // Ignore: login page can still load
  }

  const form = qs('#adminLoginForm');
  const btn = qs('#loginBtn');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = qs('#username').value.trim();
    const password = qs('#password').value;

    if (!username || !password) {
      showToast('Please enter username and password.', 'error');
      return;
    }

    try {
      setButtonLoading(btn, true, 'Signing in...');

      await apiRequest('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      showToast('Login successful.', 'success');
      setTimeout(() => {
        window.location.href = '/admin-dashboard';
      }, 500);
    } catch (err) {
      showToast(err.message || 'Invalid credentials.', 'error');
    } finally {
      setButtonLoading(btn, false);
    }
  });
});
