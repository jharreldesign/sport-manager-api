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

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure the decoded payload contains the user's _id
    if (!decoded.payload || !decoded.payload._id) {
      return res.status(401).json({ error: 'Invalid token payload.' });
    }

    // Attach the user data to the request object
    req.user = decoded.payload;

    // Log the decoded payload for debugging
    console.log('Decoded Payload:', decoded.payload);

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token.' });
  }
}

module.exports = verifyToken;


// const jwt = require('jsonwebtoken');

// function verifyToken(req, res, next) {
//   try {
//     const token = req.headers.authorization.split(' ')[1];
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
//     req.user = decoded.payload;
    
//     next();
//   } catch (err) {
//     res.status(401).json({ err: 'Invalid token.' });
//   }
// }

// module.exports = verifyToken;
