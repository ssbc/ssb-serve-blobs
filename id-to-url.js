const DEFAULT_PORT = require('./port');

const base = `http://localhost:${DEFAULT_PORT}`

module.exports = function idToUrl(blobId, params) {
  const url = new URL(base)

  const [pureBlobId, query] = blobId.split('?');

  if (params?.hostname) url.hostname = params.hostname;
  if (params?.port) url.port = params.port;

  url.pathname = `/get/${encodeURIComponent(pureBlobId)}`;

  const unbox = extractKey(query) || (params && params.unbox && toString(params.unbox));
  if (unbox) url.searchParams.set('unbox', unbox + '.boxs');

  return url.href
};

function extractKey (query) {
  if (!query) return

  return (
    query.startsWith('unbox=') &&
    query
      .replace('unbox=', '')
      .replace('.boxs', '')
  )
}

function toString (key) {
  if (typeof key === 'string') return key
  if (Buffer.isBuffer) return key.toString('base64')

  throw new Error('cannot coerce toString, unknown type: ' + typeof key)
}
