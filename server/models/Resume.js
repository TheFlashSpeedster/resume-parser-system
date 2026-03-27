const mongoose = require('mongoose');

const fileMetadataSchema = new mongoose.Schema(
  {
    originalFilename: { type: String, required: true },
    storedFilename: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    filePath: { type: String, required: true }
  },
  { _id: false }
);

const parsedDataSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    emails: { type: [String], default: [] },
    phones: { type: [String], default: [] },
    location: { type: String, default: '' },
    skills: { type: [String], default: [] },
    education: { type: [String], default: [] },
    experience: { type: [String], default: [] },
    projects: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    confidenceScores: {
      name: { type: Number, default: 0 },
      email: { type: Number, default: 0 },
      phone: { type: Number, default: 0 },
      skills: { type: Number, default: 0 },
      education: { type: Number, default: 0 },
      experience: { type: Number, default: 0 }
    }
  },
  { _id: false }
);

const resumeSchema = new mongoose.Schema(
  {
    fileMetadata: { type: fileMetadataSchema, required: true },
    rawText: { type: String, default: '' },
    parsedData: { type: parsedDataSchema, default: () => ({}) },
    duplicateFlag: { type: Boolean, default: false },
    duplicateReason: { type: String, default: '' },
    duplicateWith: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    parsingStatus: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success'
    },
    parsingError: { type: String, default: '' },
    updatedBy: { type: String, default: '' }
  },
  { timestamps: true }
);

resumeSchema.index({ 'parsedData.emails': 1 });
resumeSchema.index({ 'parsedData.phones': 1 });
resumeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Resume', resumeSchema);
