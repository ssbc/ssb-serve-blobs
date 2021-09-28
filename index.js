const http = require('http');
const urlParse = require('url-parse');
const pull = require('pull-stream');
const {createUnboxStream} = require('pull-box-stream');
const BlobsHttp = require('multiblob-http');
const DEFAULT_PORT = require('./port');

const zeros = Buffer.alloc(24, 0);

function ServeBlobs(sbot, config) {
  const corsEnabled =
    config && config.serveBlobs && typeof config.serveBlobs.cors === 'boolean'
      ? config.serveBlobs.cors
      : false;

  const PREFIX = '';

  const handler = BlobsHttp(sbot.blobs, PREFIX, {
    size: false,
    cors: corsEnabled,
    readonly: true,
    transform: function (q) {
      if (q.unbox) {
        const keyBase64 = Buffer.from(q.unbox.replace(/\s/g, '+'), 'base64');
        if (keyBase64.length !== 32)
          return function (read) {
            return function (abort, cb) {
              read(new Error('key must be 32 bytes long'), cb);
            };
          };
        const keyBytes = Buffer.from(keyBase64, 'base64');
        return createUnboxStream(keyBytes, zeros);
      }
      return pull.through();
    },
  });

  return function (req, res, next) {
    if (req.url.substring(0, PREFIX.length) !== PREFIX) return next();
    if (!(req.method === 'GET' || req.method === 'HEAD')) return next();

    const u = urlParse('http://makeurlparseright.com' + req.url, true)
    const hash = decodeURIComponent(
      u.pathname.substring((PREFIX + '/get/').length),
    );
    //check if we don't already have this, tell blobs we want it, if necessary.
    sbot.blobs.has(hash, function (err, has) {
      if (has) handler(req, res, next);
      else
        sbot.blobs.want(hash, function (err, has) {
          handler(req, res, next);
        });
    });
  };
}

module.exports = function init(sbot, config) {
  const port =
    config && config.serveBlobs && typeof config.serveBlobs.port === 'number'
      ? config.serveBlobs.port
      : DEFAULT_PORT;

  const server = http.createServer(ServeBlobs(sbot, config)).listen(port);

  // Ensure that HTTP server is closed when the SSB server closes.
  sbot.close.hook(function (fn, args) {
    server.close();
    fn.apply(this, args);
  });
};

module.exports.init = module.exports;
