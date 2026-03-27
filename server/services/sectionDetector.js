const sectionPatterns = {
  skills: [/^skills?\b/i, /^technical skills\b/i, /^key skills\b/i],
  education: [/^education\b/i, /^academic\b/i, /^qualification(s)?\b/i],
  experience: [/^experience\b/i, /^work experience\b/i, /^employment\b/i, /^professional experience\b/i],
  projects: [/^projects?\b/i, /^academic projects?\b/i],
  certifications: [
    /^certifications?\b/i,
    /^certificates?\b/i,
    /^licenses?\b/i,
    /^achievements?\b/i,
    /^credentials?\b/i,
    /^courses?\b/i,
    /^professional certifications?\b/i
  ],
  personal: [/^personal details?\b/i, /^contact\b/i]
};

function normalizeLine(line) {
  return line.replace(/[|:_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectHeading(line) {
  const normalized = normalizeLine(line);

  if (!normalized || normalized.length > 55) {
    return null;
  }

  for (const [section, patterns] of Object.entries(sectionPatterns)) {
    if (patterns.some((pattern) => pattern.test(normalized))) {
      return section;
    }
  }

  return null;
}

function detectSections(text) {
  const sections = {
    personal: [],
    skills: [],
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    other: []
  };

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let current = 'personal';

  for (const line of lines) {
    const heading = detectHeading(line);

    if (heading) {
      current = heading;
      continue;
    }

    sections[current].push(line);
  }

  return Object.fromEntries(
    Object.entries(sections).map(([key, value]) => [key, value.join('\n').trim()])
  );
}

module.exports = {
  detectSections
};
