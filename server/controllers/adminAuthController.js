const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const { sanitizeText } = require('../utils/sanitize');
const { addLog } = require('../utils/logger');

async function login(req, res, next) {
  try {
    const username = sanitizeText(req.body.username).toLowerCase();
    const password = String(req.body.password || '');

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.'
      });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    req.session.adminId = String(admin._id);
    req.session.adminUsername = admin.username;

    await addLog({
      actionType: 'LOGIN',
      message: `Admin logged in: ${admin.username}`,
      actor: admin.username
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        username: admin.username
      }
    });
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    const actor = req.session?.adminUsername || 'admin';

    req.session.destroy(async (err) => {
      if (err) {
        return next(err);
      }

      await addLog({
        actionType: 'LOGOUT',
        message: `Admin logged out: ${actor}`,
        actor
      });

      res.clearCookie('resume_parser_sid');
      return res.status(200).json({
        success: true,
        message: 'Logout successful.'
      });
    });
  } catch (err) {
    return next(err);
  }
}

function sessionStatus(req, res) {
  const isAuthenticated = Boolean(req.session && req.session.adminId);

  return res.status(200).json({
    success: true,
    data: {
      isAuthenticated,
      username: isAuthenticated ? req.session.adminUsername : null
    }
  });
}

module.exports = {
  login,
  logout,
  sessionStatus
};
