const http = require('http');
const pull = require('pull-stream');
const pullFile = require('pull-file');
const ssbServer = require('scuttle-testbot');
const tape = require('tape');
const {createBoxStream} = require('pull-box-stream');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs')

const toUrl = require('../id-to-url');
const port = 10000 + Math.floor(Math.random() * 9000);

const server = ssbServer
  .use(require('ssb-blobs'))
  .use(require('../')) // ssb-serve-blobs
  .call(null, {
    temp: true,
    serveBlobs: {port},
  });

tape('blobs are accessible', (t) => {
  const original = fs.readFileSync(path.join(__dirname, 'tiny.bmp'));

  t.plan(3);
  pull(
    pullFile(path.join(__dirname, 'tiny.bmp'), { bufferSize: 40 }),
    server.blobs.add((err, val) => {
      t.error(err, 'file added to blob-store');
      http
        .get(toUrl(val, {port}), (res) => {
          t.equal(res.headers['content-type'], 'image/bmp', 'response has Content-Type header')

          const data = [];
          res
            .on('data', (chunk) => data.push(chunk))
            .on('end', () =>
              // Ensure that the blob matches this file's contents exactly.
              t.deepEqual(
                Buffer.concat(data),
                original,
                'blob upload matches original file',
              ),
            );
        })
        .on('error', t.error)
        .end();
    }),
  );
});

const encrypt = async (input) => {
  const key = crypto.createHash('sha256').update(input).digest();
  const nonce = Buffer.alloc(24, 0);

  return new Promise((resolve, reject) => {
    pull(
      pull.values([input]),
      createBoxStream(key, nonce),
      pull.collect((err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            key,
            data,
          });
        }
      }),
    );
  });
};

tape('encrypted blobs are accessible', async (t) => {
  t.plan(3);
  const original = fs.readFileSync(path.join(__dirname, 'tiny.bmp'));
  const {key, data} = await encrypt(original);

  pull(
    pull.values(data),
    server.blobs.add((err, id) => {
      t.error(err, 'encrypted file added to blob-store');

      const url = toUrl(id, {unbox: key, port});
      http
        .get(url, (res) => {
          // t.equal(res.headers['content-type'], 'image/bmp', 'response has Content-Type header')
          // NOTE this currently doesn't work
          t.skip('Content-Type not yet working on encrypted blobs')

          const data = [];
          res
            .on('data', (chunk) => data.push(chunk))
            .on('end', () =>
              // Ensure that the blob matches this file's contents exactly.
              t.deepEqual(
                original,
                Buffer.concat(data),
                'blob upload matches original file',
              ),
            );
        })
        .on('error', t.error)
        .end();
    }),
  );
});

tape('encrypted blobs are accessible (2)', async (t) => {
  t.plan(2);
  const original = 'hello world';
  const {key, data} = await encrypt(original);

  pull(
    pull.values(data),
    server.blobs.add((err, id) => {
      t.error(err, 'encrypted file added to blob-store');

      const x = id + '?unbox=' + key.toString('base64') + '.boxs';
      const url = toUrl(x, {port});
      http
        .get(url, (res) => {
          const data = [];
          res
            .on('data', (chunk) => data.push(chunk))
            .on('end', () =>
              // Ensure that the blob matches this file's contents exactly.
              t.equals(
                data.join(''),
                original,
                'blob upload matches original file',
              ),
            );
        })
        .on('error', t.error)
        .end();
    }),
  );
});

tape('server exits', (t) => {
  server.close(t.end);
});
