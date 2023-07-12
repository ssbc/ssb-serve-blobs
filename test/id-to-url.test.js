const test = require('tape');
const toUrl = require('../id-to-url');


test('id-to-url', t => {

  const blobId = '&bt/HJeVcY6OZb4Nb21yMSDKH2ZW+otEe535CCCPfXug=.sha256';
  const unbox = 'uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=';
  const blobIdWithQuery = `${blobId}?unbox=${unbox}`;

  t.equal(
    toUrl(blobId),
    'http://localhost:26835/get/%26bt%2FHJeVcY6OZb4Nb21yMSDKH2ZW%2BotEe535CCCPfXug%3D.sha256',
    'basic'
  )

  t.equal(
    toUrl(blobId, { port: 1234 }),
    'http://localhost:1234/get/%26bt%2FHJeVcY6OZb4Nb21yMSDKH2ZW%2BotEe535CCCPfXug%3D.sha256',
    'params.port'
  )

  t.equal(
    toUrl(blobId, { hostname: 'blobs.com' }),
    'http://blobs.com:26835/get/%26bt%2FHJeVcY6OZb4Nb21yMSDKH2ZW%2BotEe535CCCPfXug%3D.sha256',
    'params.hostname'
  )

  t.equal(
    toUrl(blobId, { unbox }),
    'http://localhost:26835/get/%26bt%2FHJeVcY6OZb4Nb21yMSDKH2ZW%2BotEe535CCCPfXug%3D.sha256?unbox=uU0nuZNNPgilLlLX2n2r%2BsSE7%2BN6U4DukIj3rOLvzek%3D.boxs',
    'params.unbox'
  )

  t.equal(
    toUrl(blobIdWithQuery),
    'http://localhost:26835/get/%26bt%2FHJeVcY6OZb4Nb21yMSDKH2ZW%2BotEe535CCCPfXug%3D.sha256?unbox=uU0nuZNNPgilLlLX2n2r%2BsSE7%2BN6U4DukIj3rOLvzek%3D.boxs',
    'id with unbox query'
  )

  t.end()
})
