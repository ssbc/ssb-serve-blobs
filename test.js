const tape = require('tape')

const ssbServer = require('ssb-server')

const server = ssbServer
  .use(require('ssb-blobs'))
  .use(require('./'))({ temp: true })

tape('server exits', (t) => {
  server.close(t.end)
})
