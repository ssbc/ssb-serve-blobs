const http = require('http');
const pull = require('pull-stream');
const ssbServer = require('ssb-server');
const tape = require('tape');
const {createBoxStream} = require('pull-box-stream');
const crypto = require('crypto');

const toUrl = require('./id-to-url');
const port = 10000 + Math.floor(Math.random() * 9000);

const server = ssbServer.use(require('ssb-blobs')).use(require('./'))({
  temp: true,
  serveBlobs: {port},
});

tape('blobs are accessible', (t) => {
  const original = 'hello world';

  t.plan(2);
  pull(
    pull.values([original]),
    server.blobs.add((err, val) => {
      t.error(err);
      http
        .get(toUrl(val, {port}), (res) => {
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
  t.plan(2);
  const original = 'hello world';
  const {key, data} = await encrypt(original);

  pull(
    pull.values(data),
    server.blobs.add((err, id) => {
      t.error(err);

      const url = toUrl(id, {unbox: key, port});
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
