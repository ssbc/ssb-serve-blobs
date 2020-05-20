var pull = require('pull-stream');
var cat = require('pull-cat');
var toPull = require('stream-to-pull-stream');
var ident = require('pull-identify-filetype');
var mime = require('mime-types');
var URL = require('url');
var http = require('http');
var PORT = require('./port');
const { createUnboxStream } = require('pull-box-stream')

const createUnboxTransform = (queryParam) => {
  const keyBase64 = queryParam.slice(0, 44)
  const keyBytes = Buffer.from(keyBase64, 'base64')
  const nonce = Buffer.alloc(24, 0);
  return createUnboxStream(keyBytes, nonce);
}

function ServeBlobs(sbot) {
  return function(req, res, next) {
    var parsed = URL.parse(req.url, true);

    var hash = decodeURIComponent(parsed.pathname.slice(1));
    waitFor(hash, function(_, has) {
      if (!has) return respond(res, 404, 'File not found');

      // optional name override
      if (parsed.query.name) {
        res.setHeader(
          'Content-Disposition',
          'inline; filename=' + encodeURIComponent(parsed.query.name)
        );
      }

      const haveDecryptionKey = parsed.query.unbox != null;
      const transform = haveDecryptionKey ? createUnboxTransform(parsed.query.unbox) : null;

      // serve
      res.setHeader('Content-Security-Policy', BlobCSP());
      respondSource(res, pull(sbot.blobs.get(hash), transform), false);
    });
  };

  function waitFor(hash, cb) {
    sbot.blobs.has(hash, function(err, has) {
      if (err) return cb(err);
      if (has) {
        cb(null, has);
      } else {
        sbot.blobs.want(hash, cb);
      }
    });
  }
}

function respondSource(res, source, wrap) {
  if (wrap) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    pull(
      cat([
        pull.once('<html><body><script>'),
        source,
        pull.once('</script></body></html>')
      ]),
      toPull.sink(res)
    );
  } else {
    pull(
      source,
      ident(function(type) {
        if (type) res.writeHead(200, { 'Content-Type': mime.lookup(type) });
      }),
      toPull.sink(res)
    );
  }
}

function respond(res, status, message) {
  res.writeHead(status);
  res.end(message);
}

function BlobCSP() {
  return 'default-src none; sandbox';
}

module.exports = function init(sbot, conf) {
  const server = http.createServer(ServeBlobs(sbot)).listen(PORT);

  // Ensure that HTTP server is closed when the SSB server closes.
  sbot.close.hook(function (fn, args) {
    server.close()
    fn.apply(this, args)
  })
};

module.exports.init = module.exports;

