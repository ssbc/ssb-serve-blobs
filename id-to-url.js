const PORT = require('./port');

module.exports = function idToUrl(blobId, params) {
  const blobRef = encodeURIComponent(blobId);
  const paramsStr = (params && params.unbox)
    ? `?unbox=${encodeURIComponent(params.unbox.toString('base64'))}`
    : '';

  return `http://localhost:${PORT}/${blobRef}${paramsStr}`;
}
