const Resume = require('../models/Resume');
const Log = require('../models/Log');
const { sanitizeArray, sanitizeText } = require('../utils/sanitize');
const { checkDuplicateResume } = require('../services/duplicateChecker');
const { resumesToCsv } = require('../utils/csvExporter');
const { addLog } = require('../utils/logger');
const { isExportAllowed } = require('./publicResumeController');

function buildResumeQuery(queryParams) {
  const { search, skill, education, experience, location, status, duplicate } = queryParams;
  const query = {};

  if (search) {
    const regex = new RegExp(sanitizeText(search), 'i');
    query.$or = [
      { 'parsedData.name': regex },
      { 'parsedData.emails': regex },
      { 'parsedData.phones': regex },
      { 'parsedData.skills': regex },
      { 'parsedData.location': regex }
    ];
  }

  if (skill) {
    query['parsedData.skills'] = { $regex: sanitizeText(skill), $options: 'i' };
  }

  if (education) {
    query['parsedData.education'] = { $regex: sanitizeText(education), $options: 'i' };
  }

  if (experience) {
    query['parsedData.experience'] = { $regex: sanitizeText(experience), $options: 'i' };
  }

  if (location) {
    query['parsedData.location'] = { $regex: sanitizeText(location), $options: 'i' };
  }

  if (status && ['success', 'failure'].includes(status)) {
    query.parsingStatus = status;
  }

  if (duplicate === 'true') {
    query.duplicateFlag = true;
  } else if (duplicate === 'false') {
    query.duplicateFlag = false;
  }

  return query;
}

function getProjectionForList() {
  return {
    parsedData: 1,
    duplicateFlag: 1,
    duplicateReason: 1,
    parsingStatus: 1,
    parsingError: 1,
    createdAt: 1,
    updatedAt: 1,
    updatedBy: 1
  };
}

function normalizeListInput(value) {
  if (Array.isArray(value)) {
    return sanitizeArray(value);
  }

  if (typeof value === 'string') {
    return sanitizeArray(value.split(/\n|,|;/g));
  }

  return [];
}

async function getAllResumes(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const skip = (page - 1) * limit;

    const sortBy = req.query.sortBy || 'date_desc';
    const sortOptions = {
      date_desc: { createdAt: -1 },
      date_asc: { createdAt: 1 },
      updated_desc: { updatedAt: -1 },
      relevance: { createdAt: -1 }
    };

    const query = buildResumeQuery(req.query);
    const total = await Resume.countDocuments(query);

    let items = [];

    if (sortBy === 'relevance' && req.query.search) {
      const safeSearch = sanitizeText(req.query.search);
      const searchRegex = new RegExp(safeSearch, 'i');

      items = await Resume.aggregate([
        { $match: query },
        {
          $addFields: {
            relevanceScore: {
              $add: [
                {
                  $cond: [
                    {
                      $regexMatch: {
                        input: { $ifNull: ['$parsedData.name', ''] },
                        regex: searchRegex
                      }
                    },
                    6,
                    0
                  ]
                },
                {
                  $cond: [
                    {
                      $gt: [
                        {
                          $size: {
                            $filter: {
                              input: { $ifNull: ['$parsedData.emails', []] },
                              as: 'email',
                              cond: { $regexMatch: { input: '$$email', regex: searchRegex } }
                            }
                          }
                        },
                        0
                      ]
                    },
                    4,
                    0
                  ]
                },
                {
                  $cond: [
                    {
                      $gt: [
                        {
                          $size: {
                            $filter: {
                              input: { $ifNull: ['$parsedData.phones', []] },
                              as: 'phone',
                              cond: { $regexMatch: { input: '$$phone', regex: searchRegex } }
                            }
                          }
                        },
                        0
                      ]
                    },
                    4,
                    0
                  ]
                },
                {
                  $cond: [
                    {
                      $gt: [
                        {
                          $size: {
                            $filter: {
                              input: { $ifNull: ['$parsedData.skills', []] },
                              as: 'skill',
                              cond: { $regexMatch: { input: '$$skill', regex: searchRegex } }
                            }
                          }
                        },
                        0
                      ]
                    },
                    2,
                    0
                  ]
                }
              ]
            }
          }
        },
        { $sort: { relevanceScore: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        { $project: getProjectionForList() }
      ]);
    } else {
      items = await Resume.find(query)
        .sort(sortOptions[sortBy] || sortOptions.date_desc)
        .skip(skip)
        .limit(limit)
        .select('parsedData duplicateFlag duplicateReason parsingStatus parsingError createdAt updatedAt updatedBy')
        .lean();
    }

    return res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    return next(err);
  }
}

async function getResumeByIdAdmin(req, res, next) {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: resume
    });
  } catch (err) {
    return next(err);
  }
}

async function updateResumeById(req, res, next) {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found.'
      });
    }

    const updates = req.body || {};
    const currentParsed = resume.parsedData || {};

    const updatedParsedData = {
      ...currentParsed,
      name: updates.name !== undefined ? sanitizeText(updates.name) : currentParsed.name,
      emails: updates.emails !== undefined ? normalizeListInput(updates.emails).map((v) => v.toLowerCase()) : currentParsed.emails,
      phones: updates.phones !== undefined ? normalizeListInput(updates.phones) : currentParsed.phones,
      location: updates.location !== undefined ? sanitizeText(updates.location) : currentParsed.location,
      skills: updates.skills !== undefined ? normalizeListInput(updates.skills) : currentParsed.skills,
      education: updates.education !== undefined ? normalizeListInput(updates.education) : currentParsed.education,
      experience: updates.experience !== undefined ? normalizeListInput(updates.experience) : currentParsed.experience,
      projects: updates.projects !== undefined ? normalizeListInput(updates.projects) : currentParsed.projects,
      certifications:
        updates.certifications !== undefined
          ? normalizeListInput(updates.certifications)
          : currentParsed.certifications,
      confidenceScores: currentParsed.confidenceScores || {
        name: 0,
        email: 0,
        phone: 0,
        skills: 0,
        education: 0,
        experience: 0
      }
    };

    const duplicate = await checkDuplicateResume({
      emails: updatedParsedData.emails,
      phones: updatedParsedData.phones,
      currentResumeId: resume._id
    });

    resume.parsedData = updatedParsedData;
    resume.duplicateFlag = duplicate.duplicateFlag;
    resume.duplicateReason = duplicate.duplicateReason;
    resume.duplicateWith = duplicate.duplicateWith;
    resume.updatedBy = req.session.adminUsername || 'admin';

    await resume.save();

    await addLog({
      actionType: 'EDIT',
      resumeId: resume._id,
      message: `Resume updated by ${req.session.adminUsername || 'admin'}`,
      actor: req.session.adminUsername || 'admin'
    });

    return res.status(200).json({
      success: true,
      message: 'Resume updated successfully.',
      data: resume
    });
  } catch (err) {
    return next(err);
  }
}

async function deleteResumeById(req, res, next) {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found.'
      });
    }

    await Resume.deleteOne({ _id: resume._id });

    await addLog({
      actionType: 'DELETE',
      resumeId: resume._id,
      message: `Resume deleted by ${req.session.adminUsername || 'admin'}`,
      actor: req.session.adminUsername || 'admin'
    });

    return res.status(200).json({
      success: true,
      message: 'Resume deleted successfully.'
    });
  } catch (err) {
    return next(err);
  }
}

async function exportAllResumesCsv(req, res, next) {
  try {
    const query = buildResumeQuery(req.query);
    const resumes = await Resume.find(query).sort({ createdAt: -1 }).lean();
    const exportable = resumes.filter((resume) => isExportAllowed(resume.parsedData));

    const csvData = resumesToCsv(exportable);
    const filename = `resumes-export-${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return res.status(200).send(csvData);
  } catch (err) {
    return next(err);
  }
}

async function exportAllResumesJson(req, res, next) {
  try {
    const query = buildResumeQuery(req.query);
    const resumes = await Resume.find(query).sort({ createdAt: -1 }).lean();
    const exportable = resumes.filter((resume) => isExportAllowed(resume.parsedData));

    const filename = `resumes-export-${Date.now()}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return res.status(200).send(JSON.stringify(exportable, null, 2));
  } catch (err) {
    return next(err);
  }
}

async function exportSingleResumeJsonAdmin(req, res, next) {
  try {
    const resume = await Resume.findById(req.params.id).lean();

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found.'
      });
    }

    if (!isExportAllowed(resume.parsedData)) {
      return res.status(400).json({
        success: false,
        message: 'Resume cannot be exported because key fields are missing (name/email/phone).'
      });
    }

    const filename = `resume-${resume._id}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return res.status(200).send(JSON.stringify(resume, null, 2));
  } catch (err) {
    return next(err);
  }
}

async function getLogs(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.actionType) {
      query.actionType = sanitizeText(req.query.actionType);
    }

    const [items, total] = await Promise.all([
      Log.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
      Log.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getAllResumes,
  getResumeByIdAdmin,
  updateResumeById,
  deleteResumeById,
  exportAllResumesCsv,
  exportAllResumesJson,
  exportSingleResumeJsonAdmin,
  getLogs
};
