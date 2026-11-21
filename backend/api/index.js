// Vercel serverless entry point. `server.js` exports the Express app and only
// binds a port outside production, so the same file serves both local dev and
// Vercel functions.
module.exports = require('../server');
