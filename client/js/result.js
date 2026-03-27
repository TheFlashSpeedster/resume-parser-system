function renderPillList(container, items) {
  container.innerHTML = '';
  if (!items || !items.length) {
    container.innerHTML = '<div class="empty">No data extracted.</div>';
    return;
  }

  items.forEach((item) => {
    const span = document.createElement('span');
    span.className = 'pill';
    span.textContent = item;
    container.appendChild(span);
  });
}

function renderConfidence(scores) {
  const wrap = qs('#confidenceWrap');
  wrap.innerHTML = '';

  const keys = ['name', 'email', 'phone', 'skills', 'education', 'experience'];
  keys.forEach((key) => {
    const score = Math.round((scores?.[key] || 0) * 100);

    const box = document.createElement('div');
    box.className = 'kv-item';
    box.innerHTML = `<div class="key">${key.toUpperCase()}</div><div class="value">${score}%</div>`;
    wrap.appendChild(box);
  });
}

async function loadResumeResult() {
  const id = getQueryParam('id') || localStorage.getItem('lastResumeId');
  if (!id) {
    qs('#resultState').innerHTML = '<div class="empty">No resume selected. Please upload one first.</div>';
    return;
  }

  try {
    const payload = await apiRequest(`/api/resumes/${encodeURIComponent(id)}`);
    const resume = payload.data;
    const parsed = resume.parsedData || {};

    qs('#resultState').style.display = 'none';
    qs('#resultContent').style.display = 'block';

    qs('#candidateName').textContent = parsed.name || '-';
    qs('#candidateEmails').textContent = (parsed.emails || []).join(', ') || '-';
    qs('#candidatePhones').textContent = (parsed.phones || []).join(', ') || '-';
    qs('#candidateLocation').textContent = parsed.location || '-';

    const parsingStatus = qs('#parsingStatus');
    parsingStatus.textContent = resume.parsingStatus;
    parsingStatus.className = `badge ${resume.parsingStatus === 'success' ? 'success' : 'danger'}`;

    const duplicateTag = qs('#duplicateStatus');
    duplicateTag.textContent = resume.duplicateFlag ? 'Duplicate Flagged' : 'No Duplicate';
    duplicateTag.className = `badge ${resume.duplicateFlag ? 'warn' : 'success'}`;

    qs('#duplicateReason').textContent = resume.duplicateReason || 'Not applicable';

    renderPillList(qs('#skillsWrap'), parsed.skills || []);
    renderPillList(qs('#educationWrap'), parsed.education || []);
    renderPillList(qs('#experienceWrap'), parsed.experience || []);
    renderPillList(qs('#projectsWrap'), parsed.projects || []);
    renderPillList(qs('#certificationsWrap'), parsed.certifications || []);
    renderConfidence(parsed.confidenceScores || {});

    qs('#rawTextContent').textContent = resume.rawText || 'No extracted raw text available.';

    qs('#downloadJsonBtn').onclick = () => {
      window.open(`/api/resumes/${encodeURIComponent(id)}/export/json`, '_blank');
    };
  } catch (err) {
    qs('#resultState').innerHTML = `<div class="empty">${err.message || 'Unable to fetch parsed result.'}</div>`;
    showToast(err.message || 'Unable to fetch parsed result.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  qs('#toggleRawBtn').addEventListener('click', () => {
    const content = qs('#rawTextContent');
    content.style.display = content.style.display === 'block' ? 'none' : 'block';
  });

  loadResumeResult();
});
