async function requireAdminAuth() {
  try {
    const payload = await apiRequest('/api/admin/session');
    if (!payload.data?.isAuthenticated) {
      window.location.href = '/admin-login';
      return null;
    }

    const userTag = qs('#adminIdentity');
    if (userTag) {
      userTag.textContent = `Logged in as: ${payload.data.username}`;
    }

    return payload.data;
  } catch (err) {
    window.location.href = '/admin-login';
    return null;
  }
}

function attachLogout(buttonSelector = '#logoutBtn') {
  const btn = qs(buttonSelector);
  if (!btn) return;

  btn.addEventListener('click', async () => {
    try {
      await apiRequest('/api/admin/logout', { method: 'POST' });
      showToast('Logged out successfully.', 'success');
      setTimeout(() => {
        window.location.href = '/admin-login';
      }, 500);
    } catch (err) {
      showToast(err.message || 'Logout failed.', 'error');
    }
  });
}
