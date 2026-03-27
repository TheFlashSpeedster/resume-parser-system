const state = {
  page: 1,
  limit: 10
};

function buildQuery() {
  const search = qs('#searchInput').value.trim();
  const skill = qs('#skillFilter').value.trim();
  const education = qs('#educationFilter').value.trim();
  const experience = qs('#experienceFilter').value.trim();
  const location = qs('#locationFilter').value.trim();
  const duplicate = qs('#duplicateFilter').value;
  const status = qs('#statusFilter').value;
  const sortBy = qs('#sortByFilter').value;

  const params = new URLSearchParams();
  params.set('page', String(state.page));
  params.set('limit', String(state.limit));

  if (search) params.set('search', search);
  if (skill) params.set('skill', skill);
  if (education) params.set('education', education);
  if (experience) params.set('experience', experience);
  if (location) params.set('location', location);
  if (duplicate) params.set('duplicate', duplicate);
  if (status) params.set('status', status);
  if (sortBy) params.set('sortBy', sortBy);

  return params;
}

async function loadResumes() {
  await requireAdminAuth();

  const tbody = qs('#resumeTableBody');
  const pageInfo = qs('#pageInfo');

  try {
    const params = buildQuery();
    const payload = await apiRequest(`/api/admin/resumes?${params.toString()}`);
    const { items, pagination } = payload.data;

    tbody.innerHTML = '';

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="8">No resumes found.</td></tr>';
    } else {
      items.forEach((item) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${toSafeText(item.parsedData?.name || '-')}</td>
          <td>${toSafeText((item.parsedData?.emails || [])[0] || '-')}</td>
          <td>${toSafeText((item.parsedData?.phones || [])[0] || '-')}</td>
          <td>${toSafeText((item.parsedData?.skills || []).slice(0, 4).join(', ') || '-')}</td>
          <td>${toSafeText(item.parsedData?.location || '-')}</td>
          <td><span class="badge ${item.duplicateFlag ? 'warn' : 'success'}">${item.duplicateFlag ? 'Duplicate' : 'Unique'}</span></td>
          <td>${formatDate(item.createdAt)}</td>
          <td>
            <a class="btn secondary" href="/admin-resume-detail?id=${item._id}">View</a>
          </td>
        `;
        tbody.appendChild(row);
      });
    }

    pageInfo.textContent = `Page ${pagination.page} of ${Math.max(pagination.totalPages, 1)} | Total: ${pagination.total}`;

    qs('#prevPageBtn').disabled = pagination.page <= 1;
    qs('#nextPageBtn').disabled = pagination.page >= pagination.totalPages;
  } catch (err) {
    showToast(err.message || 'Failed to load resumes.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  attachLogout('#logoutBtn');

  qs('#filterForm').addEventListener('submit', (event) => {
    event.preventDefault();
    state.page = 1;
    loadResumes();
  });

  qs('#resetFiltersBtn').addEventListener('click', () => {
    qs('#filterForm').reset();
    state.page = 1;
    loadResumes();
  });

  qs('#prevPageBtn').addEventListener('click', () => {
    if (state.page > 1) {
      state.page -= 1;
      loadResumes();
    }
  });

  qs('#nextPageBtn').addEventListener('click', () => {
    state.page += 1;
    loadResumes();
  });

  qs('#exportCsvBtn').addEventListener('click', () => {
    const params = buildQuery();
    window.open(`/api/admin/export/csv?${params.toString()}`, '_blank');
  });

  qs('#exportJsonBtn').addEventListener('click', () => {
    const params = buildQuery();
    window.open(`/api/admin/export/json?${params.toString()}`, '_blank');
  });

  await loadResumes();
});
