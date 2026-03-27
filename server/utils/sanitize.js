const validator = require('validator');

function sanitizeText(input) {
  if (input === null || input === undefined) return '';
  return validator.escape(String(input).trim());
}

function sanitizeArray(input) {
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeText(item)).filter(Boolean);
  }

  if (typeof input === 'string') {
    return input
      .split('\n')
      .map((line) => sanitizeText(line))
      .filter(Boolean);
  }

  return [];
}

module.exports = {
  sanitizeText,
  sanitizeArray
};
