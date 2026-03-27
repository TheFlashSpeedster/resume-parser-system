function requireAdminAuth(req, res, next) {
  if (!req.session || !req.session.adminId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Admin login required.'
    });
  }

  return next();
}

module.exports = { requireAdminAuth };
