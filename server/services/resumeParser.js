const { detectSections } = require('./sectionDetector');

const skillDictionary = [
  'javascript',
  'typescript',
  'node.js',
  'express',
  'react',
  'mongodb',
  'mysql',
  'postgresql',
  'java',
  'python',
  'c',
  'c++',
  'html',
  'css',
  'git',
  'github',
  'docker',
  'kubernetes',
  'aws',
  'azure',
  'rest api',
  'graphql',
  'redis',
  'machine learning',
  'nlp',
  'tensorflow',
  'pandas',
  'numpy',
  'data structures',
  'algorithms',
  'oop',
  'linux',
  'firebase',
  'jwt',
  'socket.io',
  'bootstrap',
  'tailwind',
  'figma',
  'power bi',
  'excel'
];

const degreeKeywords = [
  'b.tech',
  'btech',
  'be',
  'b.e',
  'm.tech',
  'mtech',
  'me',
  'm.e',
  'bachelor',
  'master',
  'phd',
  'ph.d',
  'mba',
  'bca',
  'mca',
  'diploma',
  'intermediate',
  'high school',
  'hsc',
  'ssc'
];

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function preprocessText(text) {
  return (text || '')
    .replace(/\r/g, '\n')
    .replace(/[\t\f\v]/g, ' ')
    .replace(/[•●▪◦]/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractEmails(text) {
  const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  return unique(matches.map((email) => email.toLowerCase()));
}

function extractPhones(text) {
  const phoneCandidates = text.match(/(?:\+?\d[\d\s().-]{8,}\d)/g) || [];

  const normalized = phoneCandidates
    .map((phone) => phone.replace(/[^\d+]/g, ''))
    .map((phone) => {
      if (phone.startsWith('+')) return phone;
      return phone.length >= 10 ? phone : '';
    })
    .filter((phone) => phone.length >= 10);

  return unique(normalized);
}

function extractName(text) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 10);

  const candidate = lines.find((line) => {
    if (line.length < 3 || line.length > 50) return false;
    if (/[@\d]/.test(line)) return false;
    if (/resume|curriculum vitae|cv/i.test(line)) return false;
    const words = line.split(/\s+/).filter(Boolean);
    if (words.length < 2 || words.length > 4) return false;
    return words.every((word) => /^[A-Z][a-zA-Z.'-]*$/.test(word));
  });

  return candidate || '';
}

function extractLocation(sectionPersonal, fullText) {
  const searchText = `${sectionPersonal || ''}\n${fullText.slice(0, 600)}`;

  const locationLine = searchText
    .split('\n')
    .map((line) => line.trim())
    .find((line) => /location|address|city|state/i.test(line));

  if (locationLine) {
    return locationLine.replace(/^(location|address|city|state)\s*[:\-]?\s*/i, '').trim();
  }

  const cityMatch = searchText.match(
    /\b(Bangalore|Bengaluru|Mumbai|Delhi|Pune|Hyderabad|Chennai|Kolkata|Ahmedabad|Noida|Gurgaon|New York|San Francisco|London)\b/i
  );

  return cityMatch ? cityMatch[0] : '';
}

function extractSkills(skillsSection, fullText) {
  const combined = `${skillsSection || ''}\n${fullText}`.toLowerCase();

  const byDictionary = skillDictionary.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${escaped}\\b`, 'i');
    return pattern.test(combined);
  });

  const bySectionLine = (skillsSection || '')
    .split(/\n|,|\||;/)
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item && item.length > 1 && item.length < 35);

  return unique([...byDictionary, ...bySectionLine]).map((skill) =>
    skill
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  );
}

function extractEducation(sectionText, fullText) {
  const lines = (sectionText || fullText)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return unique(
    lines.filter((line) => {
      const lower = line.toLowerCase();
      const hasDegree = degreeKeywords.some((key) => lower.includes(key));
      const hasYear = /(19|20)\d{2}/.test(line);
      return hasDegree || hasYear;
    })
  ).slice(0, 8);
}

function extractExperience(sectionText, fullText) {
  const source = sectionText || fullText;
  const lines = source
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const dateRangeRegex = /((19|20)\d{2})\s*(?:-|to|–)\s*((19|20)\d{2}|present)/i;

  const result = unique(
    lines.filter((line) => {
      return (
        /experience|intern|developer|engineer|analyst|manager|consultant/i.test(line) ||
        /(pvt|ltd|inc|llc|solutions|technologies|company)/i.test(line) ||
        dateRangeRegex.test(line)
      );
    })
  );

  return result.slice(0, 10);
}

function extractProjects(sectionText, fullText) {
  const source = sectionText || fullText;

  const lines = source
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.length > 5)
    .filter((line) => /project|developed|built|implemented|designed/i.test(line));

  return unique(lines).slice(0, 10);
}

function extractCertifications(sectionText, fullText) {
  const lines = fullText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const sectionHeadingRegex =
    /^certifications?|^certificates?|^credentials?|^licenses?|^professional certifications?|^courses?/i;

  const genericHeadingRegex =
    /^(skills?|education|experience|projects?|summary|objective|profile|achievements?)\b/i;

  const certKeywordRegex =
    /certif|certificate|credential|licensed|license|course|training|specialization|issued|issuer|coursera|udemy|nptel|edx|aws certified|azure certified|google cloud|microsoft certified|oracle certified|cisco certified|pmp|scrum|itil/i;

  const fromSection = (sectionText || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => certKeywordRegex.test(line));

  const fromHeadingBlock = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (sectionHeadingRegex.test(lines[i])) {
      for (let j = i + 1; j < lines.length; j += 1) {
        const current = lines[j].trim();
        if (!current) continue;
        if (genericHeadingRegex.test(current)) break;
        if (current.length < 3) continue;
        fromHeadingBlock.push(current);
        if (fromHeadingBlock.length >= 20) break;
      }
    }
  }

  const fromGlobalKeywords = lines.filter((line) => certKeywordRegex.test(line));

  const combined = unique([...fromSection, ...fromHeadingBlock, ...fromGlobalKeywords])
    .filter((line) => line.length > 4)
    .map((line) => line.replace(/^[-:;|]\s*/, '').trim());

  return combined
    .filter((line) => !sectionHeadingRegex.test(line))
    .slice(0, 12);
}

function buildConfidenceScores(parsedData) {
  return {
    name: parsedData.name ? 0.9 : 0.15,
    email: parsedData.emails.length ? Math.min(1, 0.65 + parsedData.emails.length * 0.15) : 0.1,
    phone: parsedData.phones.length ? Math.min(1, 0.65 + parsedData.phones.length * 0.1) : 0.1,
    skills: parsedData.skills.length ? Math.min(1, parsedData.skills.length / 10) : 0.1,
    education: parsedData.education.length ? Math.min(1, parsedData.education.length / 5) : 0.1,
    experience: parsedData.experience.length ? Math.min(1, parsedData.experience.length / 6) : 0.1
  };
}

function parseResume(rawText) {
  const cleanText = preprocessText(rawText);
  const sections = detectSections(cleanText);

  const parsedData = {
    name: extractName(cleanText),
    emails: extractEmails(cleanText),
    phones: extractPhones(cleanText),
    location: extractLocation(sections.personal, cleanText),
    skills: extractSkills(sections.skills, cleanText),
    education: extractEducation(sections.education, cleanText),
    experience: extractExperience(sections.experience, cleanText),
    projects: extractProjects(sections.projects, cleanText),
    certifications: extractCertifications(sections.certifications, cleanText)
  };

  parsedData.confidenceScores = buildConfidenceScores(parsedData);

  return {
    cleanText,
    sections,
    parsedData
  };
}

module.exports = {
  parseResume,
  preprocessText
};
