const DEFAULT_PORT = require('./port');

module.exports = function idToUrl(blobId, params) {
  const port = (params && params.port) || DEFAULT_PORT;
  const blobRef = encodeURIComponent(blobId);
  const paramsStr = (params && params.unbox)
    ? `?unbox=${encodeURIComponent(params.unbox.toString('base64'))}`
    : '';

  return `http://localhost:${port}/get/${blobRef}${paramsStr}`;
}
