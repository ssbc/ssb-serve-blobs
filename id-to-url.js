const DEFAULT_PORT = require('./port');

module.exports = function idToUrl(blobId, params) {
  const port = (params && params.port) || DEFAULT_PORT;
  const [pureBlobId, query] = blobId.split('?');
  const blobRef = encodeURIComponent(pureBlobId);
  const paramsStr = query
    ? '?' + query
    : params && params.unbox
    ? `?unbox=${encodeURIComponent(params.unbox.toString('base64'))}.boxs`
    : '';

  return `http://localhost:${port}/get/${blobRef}${paramsStr}`;
};
