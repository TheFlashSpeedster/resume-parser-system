function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: 'Route not found'
  });
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const clientMessage = err.clientMessage || 'Something went wrong. Please try again.';

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  return res.status(statusCode).json({
    success: false,
    message: clientMessage,
    ...(process.env.NODE_ENV !== 'production' ? { debug: err.message } : {})
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
