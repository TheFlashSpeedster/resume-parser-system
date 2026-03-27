const path = require('path');
const Resume = require('../models/Resume');
const { extractTextFromFile } = require('../services/textExtractor');
const { parseResume } = require('../services/resumeParser');
const { checkDuplicateResume } = require('../services/duplicateChecker');
const { addLog } = require('../utils/logger');

function isExportAllowed(parsedData = {}) {
  return Boolean(parsedData.name || (parsedData.emails || []).length || (parsedData.phones || []).length);
}

async function uploadResume(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume file.'
      });
    }

    const fileMetadata = {
      originalFilename: req.file.originalname,
      storedFilename: req.file.filename,
      fileType: path.extname(req.file.originalname).toLowerCase(),
      fileSize: req.file.size,
      filePath: req.file.path
    };

    await addLog({
      actionType: 'UPLOAD_ATTEMPT',
      message: `Upload attempt for file ${req.file.originalname}`,
      actor: 'USER'
    });

    try {
      const rawText = await extractTextFromFile(req.file.path, req.file.originalname);
      const { cleanText, parsedData } = parseResume(rawText);
      const duplicate = await checkDuplicateResume({
        emails: parsedData.emails,
        phones: parsedData.phones
      });

      const resumeDoc = await Resume.create({
        fileMetadata,
        rawText: cleanText,
        parsedData,
        duplicateFlag: duplicate.duplicateFlag,
        duplicateReason: duplicate.duplicateReason,
        duplicateWith: duplicate.duplicateWith,
        parsingStatus: 'success'
      });

      await addLog({
        actionType: 'UPLOAD_SUCCESS',
        resumeId: resumeDoc._id,
        message: `Resume parsed successfully for ${req.file.originalname}`,
        actor: 'USER'
      });

      return res.status(201).json({
        success: true,
        message: 'Resume uploaded and parsed successfully.',
        data: {
          resumeId: resumeDoc._id,
          parsedData: resumeDoc.parsedData,
          duplicateFlag: resumeDoc.duplicateFlag,
          duplicateReason: resumeDoc.duplicateReason,
          parsingStatus: resumeDoc.parsingStatus,
          createdAt: resumeDoc.createdAt
        }
      });
    } catch (parseErr) {
      const failedDoc = await Resume.create({
        fileMetadata,
        rawText: '',
        parsedData: {
          name: '',
          emails: [],
          phones: [],
          location: '',
          skills: [],
          education: [],
          experience: [],
          projects: [],
          certifications: [],
          confidenceScores: {
            name: 0,
            email: 0,
            phone: 0,
            skills: 0,
            education: 0,
            experience: 0
          }
        },
        parsingStatus: 'failure',
        parsingError: parseErr.clientMessage || parseErr.message
      });

      await addLog({
        actionType: 'PARSE_FAILURE',
        resumeId: failedDoc._id,
        message: parseErr.clientMessage || parseErr.message,
        actor: 'SYSTEM'
      });

      return res.status(parseErr.statusCode || 422).json({
        success: false,
        message: parseErr.clientMessage || 'Resume parsing failed.',
        data: {
          resumeId: failedDoc._id,
          parsingStatus: 'failure'
        }
      });
    }
  } catch (err) {
    return next(err);
  }
}

async function getResumeById(req, res, next) {
  try {
    const resume = await Resume.findById(req.params.id).select('-fileMetadata.filePath');

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

async function exportResumeJson(req, res, next) {
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

module.exports = {
  uploadResume,
  getResumeById,
  exportResumeJson,
  isExportAllowed
};
