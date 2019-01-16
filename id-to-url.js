const PORT = require('./port');
module.exports = function idToUrl(blobId) {
  const blobRef = encodeURIComponent(blobId);
  return `http://localhost:${PORT}/${blobRef}`;
}