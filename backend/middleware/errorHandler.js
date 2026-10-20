export const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err.message);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token.' });
  }
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Resource already exists.' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced resource not found.' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
};
