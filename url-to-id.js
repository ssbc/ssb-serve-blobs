const PORT = require('./port');
module.exports = function urlToId(url) {
  const blobRef = url.split(`http://localhost:${PORT}/`)[1];
  return decodeURIComponent(blobRef);
}