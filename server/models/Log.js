const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      required: true,
      enum: ['UPLOAD_ATTEMPT', 'UPLOAD_SUCCESS', 'PARSE_FAILURE', 'EDIT', 'DELETE', 'LOGIN', 'LOGOUT']
    },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', default: null },
    message: { type: String, required: true },
    actor: { type: String, default: 'SYSTEM' },
    timestamp: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

logSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Log', logSchema);
