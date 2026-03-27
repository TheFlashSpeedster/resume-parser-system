const Resume = require('../models/Resume');

async function checkDuplicateResume({ emails = [], phones = [], currentResumeId = null }) {
  const normalizedEmails = emails.map((email) => email.toLowerCase());
  const normalizedPhones = phones.map((phone) => phone.replace(/\s+/g, ''));

  if (!normalizedEmails.length && !normalizedPhones.length) {
    return {
      duplicateFlag: false,
      duplicateReason: '',
      duplicateWith: []
    };
  }

  const conditions = [];
  if (normalizedEmails.length) {
    conditions.push({ 'parsedData.emails': { $in: normalizedEmails } });
  }
  if (normalizedPhones.length) {
    conditions.push({ 'parsedData.phones': { $in: normalizedPhones } });
  }

  const query = { $or: conditions };
  if (currentResumeId) {
    query._id = { $ne: currentResumeId };
  }

  const matches = await Resume.find(query).select('_id parsedData.emails parsedData.phones');

  if (!matches.length) {
    return {
      duplicateFlag: false,
      duplicateReason: '',
      duplicateWith: []
    };
  }

  const reasons = [];

  const emailMatched = matches.some((item) =>
    (item.parsedData.emails || []).some((email) => normalizedEmails.includes(email.toLowerCase()))
  );

  const phoneMatched = matches.some((item) =>
    (item.parsedData.phones || []).some((phone) => normalizedPhones.includes(phone.replace(/\s+/g, '')))
  );

  if (emailMatched) reasons.push('Duplicate email found');
  if (phoneMatched) reasons.push('Duplicate phone found');

  return {
    duplicateFlag: true,
    duplicateReason: reasons.join(' and '),
    duplicateWith: matches.map((match) => match._id)
  };
}

module.exports = {
  checkDuplicateResume
};
