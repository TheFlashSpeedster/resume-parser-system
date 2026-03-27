let currentResumeId = null;

function fillForm(data) {
  const p = data.parsedData || {};

  qs('#name').value = p.name || '';
  qs('#emails').value = (p.emails || []).join('\n');
  qs('#phones').value = (p.phones || []).join('\n');
  qs('#location').value = p.location || '';
  qs('#skills').value = (p.skills || []).join('\n');
  qs('#education').value = (p.education || []).join('\n');
  qs('#experience').value = (p.experience || []).join('\n');
  qs('#projects').value = (p.projects || []).join('\n');
  qs('#certifications').value = (p.certifications || []).join('\n');

  qs('#statusBadge').textContent = data.parsingStatus;
  qs('#statusBadge').className = `badge ${data.parsingStatus === 'success' ? 'success' : 'danger'}`;

  qs('#duplicateBadge').textContent = data.duplicateFlag ? 'Duplicate' : 'Unique';
  qs('#duplicateBadge').className = `badge ${data.duplicateFlag ? 'warn' : 'success'}`;

  qs('#metaInfo').textContent = `Uploaded: ${formatDate(data.createdAt)} | Updated: ${formatDate(
    data.updatedAt
  )} | Updated By: ${data.updatedBy || '-'} `;

  qs('#rawTextContent').textContent = data.rawText || 'No extracted raw text available.';
}

async function loadDetail() {
  await requireAdminAuth();

  currentResumeId = getQueryParam('id');
  if (!currentResumeId) {
    qs('#detailState').innerHTML = '<div class="empty">Missing resume ID.</div>';
    return;
  }

  try {
    const payload = await apiRequest(`/api/admin/resumes/${encodeURIComponent(currentResumeId)}`);
    qs('#detailState').style.display = 'none';
    qs('#detailContent').style.display = 'grid';
    fillForm(payload.data);
  } catch (err) {
    qs('#detailState').innerHTML = `<div class="empty">${err.message || 'Failed to load resume.'}</div>`;
    showToast(err.message || 'Failed to load resume.', 'error');
  }
}

async function handleSave(event) {
  event.preventDefault();

  const body = {
    name: qs('#name').value,
    emails: qs('#emails').value,
    phones: qs('#phones').value,
    location: qs('#location').value,
    skills: qs('#skills').value,
    education: qs('#education').value,
    experience: qs('#experience').value,
    projects: qs('#projects').value,
    certifications: qs('#certifications').value
  };

  const saveBtn = qs('#saveBtn');

  try {
    setButtonLoading(saveBtn, true, 'Saving...');
    const payload = await apiRequest(`/api/admin/resumes/${encodeURIComponent(currentResumeId)}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });

    showToast('Resume updated successfully.', 'success');
    fillForm(payload.data);
  } catch (err) {
    showToast(err.message || 'Failed to update resume.', 'error');
  } finally {
    setButtonLoading(saveBtn, false);
  }
}

async function handleDelete() {
  if (!currentResumeId) return;

  const confirmed = window.confirm('Are you sure you want to delete this resume record?');
  if (!confirmed) return;

  try {
    await apiRequest(`/api/admin/resumes/${encodeURIComponent(currentResumeId)}`, {
      method: 'DELETE'
    });

    showToast('Resume deleted successfully.', 'success');
    setTimeout(() => {
      window.location.href = '/admin-resumes';
    }, 500);
  } catch (err) {
    showToast(err.message || 'Delete failed.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  attachLogout('#logoutBtn');
  qs('#editForm').addEventListener('submit', handleSave);
  qs('#deleteBtn').addEventListener('click', handleDelete);
  qs('#toggleRawBtn').addEventListener('click', () => {
    const content = qs('#rawTextContent');
    content.style.display = content.style.display === 'block' ? 'none' : 'block';
  });
  qs('#exportJsonBtn').addEventListener('click', () => {
    if (!currentResumeId) return;
    window.open(`/api/admin/resumes/${encodeURIComponent(currentResumeId)}/export/json`, '_blank');
  });
  loadDetail();
});
