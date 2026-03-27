function csvEscape(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function resumesToCsv(resumes) {
  const header = [
    'id',
    'name',
    'emails',
    'phones',
    'location',
    'skills',
    'education',
    'experience',
    'projects',
    'certifications',
    'duplicateFlag',
    'duplicateReason',
    'parsingStatus',
    'createdAt',
    'updatedAt'
  ];

  const lines = [header.join(',')];

  resumes.forEach((resume) => {
    const p = resume.parsedData || {};
    const row = [
      resume._id,
      p.name || '',
      (p.emails || []).join('; '),
      (p.phones || []).join('; '),
      p.location || '',
      (p.skills || []).join('; '),
      (p.education || []).join('; '),
      (p.experience || []).join('; '),
      (p.projects || []).join('; '),
      (p.certifications || []).join('; '),
      resume.duplicateFlag ? 'Yes' : 'No',
      resume.duplicateReason || '',
      resume.parsingStatus || '',
      resume.createdAt ? new Date(resume.createdAt).toISOString() : '',
      resume.updatedAt ? new Date(resume.updatedAt).toISOString() : ''
    ].map(csvEscape);

    lines.push(row.join(','));
  });

  return lines.join('\n');
}

module.exports = { resumesToCsv };
