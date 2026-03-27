const Log = require('../models/Log');

async function addLog({ actionType, resumeId = null, message, actor = 'SYSTEM' }) {
  try {
    await Log.create({ actionType, resumeId, message, actor });
  } catch (err) {
    console.error('Failed to save log:', err.message);
  }
}

module.exports = { addLog };
