function getSkillIcon(skillName) {
  const s = String(skillName).toLowerCase();
  const map = {
    'html': 'devicon-html5-plain',
    'css': 'devicon-css3-plain',
    'javascript': 'devicon-javascript-plain',
    'js': 'devicon-javascript-plain',
    'react': 'devicon-react-original',
    'node': 'devicon-nodejs-plain',
    'python': 'devicon-python-plain',
    'java': 'devicon-java-plain',
    'c++': 'devicon-cplusplus-plain',
    'c#': 'devicon-csharp-plain',
    'php': 'devicon-php-plain',
    'sql': 'devicon-mysql-plain',
    'mongo': 'devicon-mongodb-plain',
    'git': 'devicon-git-plain',
    'docker': 'devicon-docker-plain',
    'aws': 'devicon-amazonwebservices-original',
    'linux': 'devicon-linux-plain',
    'typescript': 'devicon-typescript-plain',
    'ruby': 'devicon-ruby-plain',
    'go': 'devicon-go-original',
    'rust': 'devicon-rust-plain',
    'vue': 'devicon-vuejs-plain',
    'angular': 'devicon-angularjs-plain',
    'spring': 'devicon-spring-plain',
    'django': 'devicon-django-plain',
    'flask': 'devicon-flask-original',
    'kubernetes': 'devicon-kubernetes-plain'
  };

  for (let key in map) {
    if (s.includes(key)) return `<i class="${map[key]} colored"></i>`;
  }
  return `<i class='bx bx-check-circle'></i>`;
}

function renderPillList(container, items, isSkill = false) {
  container.innerHTML = '';
  if (!items || !items.length) {
    container.innerHTML = '<div class="empty">No data extracted.</div>';
    return;
  }

  items.forEach((item) => {
    const span = document.createElement('span');
    span.className = 'pill';
    if (isSkill) {
      span.innerHTML = `${getSkillIcon(item)} <span>${item}</span>`;
    } else {
      span.innerHTML = `<i class='bx bx-radio-circle-marked'></i> <span>${item}</span>`;
    }
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

    renderPillList(qs('#skillsWrap'), parsed.skills || [], true);
    renderPillList(qs('#educationWrap'), parsed.education || [], false);
    renderPillList(qs('#experienceWrap'), parsed.experience || [], false);
    renderPillList(qs('#projectsWrap'), parsed.projects || [], false);
    renderPillList(qs('#certificationsWrap'), parsed.certifications || [], false);
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
