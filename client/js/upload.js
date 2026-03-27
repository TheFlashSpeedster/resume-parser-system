document.addEventListener('DOMContentLoaded', () => {
  const form = qs('#uploadForm');
  const fileInput = qs('#resumeFile');
  const submitBtn = qs('#uploadBtn');
  const progressBar = qs('#progressBar');
  const statusText = qs('#uploadStatus');

  function resetProgress() {
    progressBar.style.width = '0%';
    statusText.textContent = '';
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const file = fileInput.files[0];
    if (!file) {
      showToast('Please choose a resume file first.', 'error');
      return;
    }

    const allowedExtensions = ['pdf', 'docx', 'doc'];
    const extension = (file.name.split('.').pop() || '').toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      showToast('Unsupported format. Use PDF, DOCX, or DOC.', 'error');
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      showToast('File too large. Maximum size is 5MB.', 'error');
      return;
    }

    setButtonLoading(submitBtn, true, 'Uploading...');
    statusText.innerHTML = '<span class="loader"></span> Uploading and parsing...';

    const formData = new FormData();
    formData.append('resume', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/resumes/upload');

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        progressBar.style.width = `${percent}%`;
      }
    });

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) return;

      setButtonLoading(submitBtn, false);

      let payload = { success: false, message: 'Unexpected response.' };
      try {
        payload = JSON.parse(xhr.responseText || '{}');
      } catch (err) {
        payload = { success: false, message: 'Invalid server response.' };
      }

      if (xhr.status >= 200 && xhr.status < 300 && payload.success) {
        const resumeId = payload.data.resumeId;
        localStorage.setItem('lastResumeId', resumeId);
        showToast('Resume parsed successfully.', 'success');
        statusText.textContent = 'Parsing completed. Redirecting to result page...';
        setTimeout(() => {
          window.location.href = `/result?id=${encodeURIComponent(resumeId)}`;
        }, 600);
      } else {
        progressBar.style.width = '0%';
        statusText.textContent = payload.message || 'Failed to upload or parse resume.';
        showToast(payload.message || 'Failed to parse resume.', 'error');
      }
    };

    xhr.onerror = () => {
      setButtonLoading(submitBtn, false);
      resetProgress();
      statusText.textContent = 'Network error while uploading.';
      showToast('Network error while uploading.', 'error');
    };

    xhr.send(formData);
  });

  resetProgress();
});
