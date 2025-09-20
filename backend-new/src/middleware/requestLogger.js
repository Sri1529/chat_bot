const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

module.exports = { requestLogger };
