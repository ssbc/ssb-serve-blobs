const http = require('http');
const urlParse = require('url-parse');
const pull = require('pull-stream');
const FileType = require('file-type');
const {createUnboxStream} = require('pull-box-stream');
const BlobsHttp = require('multiblob-http');
const DEFAULT_PORT = require('./port');

const zeros = Buffer.alloc(24, 0);
const FAKE_HOST = 'http://makeurlparseright.com';

function ServeBlobs(sbot, config) {
  const corsEnabled =
    config && config.serveBlobs && typeof config.serveBlobs.cors === 'boolean'
      ? config.serveBlobs.cors
      : false;
  const csp = config && config.serveBlobs && typeof config.serveBlobs.csp === 'string'
    ? config.serveBlobs.csp
    : 'default-src none; sandbox'

  const handler = BlobsHttp(sbot.blobs, /* prefix */ '', {
    size: false,
    cors: corsEnabled,
    csp,
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

  function ensureHasBlob(hash, cb) {
    //check if we don't already have this, tell blobs we want it, if necessary.
    sbot.blobs.has(hash, function (err, has) {
      if (has) {
        cb(null, true);
      } else {
        sbot.blobs.want(hash, function (err, has) {
          cb(err, has);
        });
      }
    });
  }

  function getBlobHead(hash, cb) {
    pull(
      sbot.blobs.getSlice({hash, start: 0, end: 4100}),
      pull.take(1),
      pull.collect((err, [buf]) => {
        if (err) cb(err);
        else cb(null, buf);
      }),
    );
  }

  function getContentType(buf, cb) {
    FileType.fromBuffer(buf).then(
      (result) => {
        if (result && result.mime) cb(null, result.mime);
        else cb(null, null);
      },
      (err) => {
        cb(err);
      },
    );
  }

  function setContentTypeOnReqURL(contentType, req) {
    const u = urlParse(FAKE_HOST + req.url, true);
    u.set('query', {...u.query, contentType});
    req.url = u.toString().replace(FAKE_HOST, '');
  }

  return function (req, res, next) {
    if (!(req.method === 'GET' || req.method === 'HEAD')) return next();

    const hash = decodeURIComponent(
      urlParse(FAKE_HOST + req.url, true).pathname.substr('/get/'.length),
    );

    ensureHasBlob(hash, (err, has) => {
      if (err || !has) return handler(req, res, next);
      getBlobHead(hash, (err, buf) => {
        if (err || !buf) return handler(req, res, next);
        getContentType(buf, (err, contentType) => {
          if (err || !contentType) return handler(req, res, next);
          setContentTypeOnReqURL(contentType, req);
          handler(req, res, next);
        });
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
