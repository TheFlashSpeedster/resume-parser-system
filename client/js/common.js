function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function showToast(message, type = 'info') {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'success' ? 'success' : ''} ${type === 'error' ? 'error' : ''}`;
  toast.textContent = message;

  stack.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function toSafeText(value) {
  return value === null || value === undefined ? '' : String(value);
}

function arrayToMultiline(value) {
  if (!Array.isArray(value)) return '';
  return value.join('\n');
}

function getQueryParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

function setButtonLoading(button, isLoading, text = 'Please wait...') {
  if (!button) return;
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.disabled = true;
    button.textContent = text;
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
  }
}
