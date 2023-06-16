const DEFAULT_PORT = require('./port');

module.exports = function urlToId(url, opts = { port: DEFAULT_PORT }) {
  if (opts.port && typeof opts.port !== 'number')
    throw new Error('port option must be a number');
  const blobRef = url.split(`http://localhost:${opts.port}/get/`)[1];
  return decodeURIComponent(blobRef);
};
