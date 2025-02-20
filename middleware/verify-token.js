const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  try {
    // Check if the authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided.' });
    }

    // Extract the token from the header
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Malformed token.' });
    }

    // Verify the token and decode the payload
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error(err); // Log the error for debugging
        // Check for expired token
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token has expired.' });
        }
        return res.status(401).json({ error: 'Invalid token.' });
      }

      // Ensure the decoded payload contains the user's _id and role
      if (!decoded._id || !decoded.role) {
        return res.status(401).json({ error: 'Invalid token payload.' });
      }

      // Attach the user data to the request object (including role)
      req.user = decoded;

      // Log the decoded payload for debugging (only in development environment)
      if (process.env.NODE_ENV === 'development') {
        console.log('Decoded Payload:', decoded);
      }

      next();
    });
  } catch (err) {
    console.error(err);  // Log the error for debugging
    res.status(401).json({ error: 'Invalid token.' });
  }
}

module.exports = verifyToken;
