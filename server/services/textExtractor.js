const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

async function extractTextFromFile(filePath, originalFilename) {
  const ext = path.extname(originalFilename || filePath).toLowerCase();

  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const result = await pdfParse(buffer);
    const text = (result.text || '').trim();

    if (!text) {
      const error = new Error('Empty or unreadable PDF content.');
      error.statusCode = 422;
      error.clientMessage = 'The uploaded PDF appears empty or unreadable.';
      throw error;
    }

    return text;
  }

  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    const text = (result.value || '').trim();

    if (!text) {
      const error = new Error('Empty or unreadable DOCX content.');
      error.statusCode = 422;
      error.clientMessage = 'The uploaded DOCX appears empty or unreadable.';
      throw error;
    }

    return text;
  }

  if (ext === '.doc') {
    const error = new Error('DOC extraction is unreliable with current stack.');
    error.statusCode = 422;
    error.clientMessage =
      'DOC format is currently not reliably parseable in this version. Please upload PDF or DOCX.';
    throw error;
  }

  const error = new Error('Unsupported file extension for extraction.');
  error.statusCode = 400;
  error.clientMessage = 'Unsupported file format. Please upload PDF, DOCX, or DOC.';
  throw error;
}

module.exports = {
  extractTextFromFile
};
