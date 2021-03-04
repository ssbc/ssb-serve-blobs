# ssb-serve-blobs

Scuttlebot plugin to serve blobs from a local http server on port 26835.

Note also this remark plugin for modifying markdown to link to the server: [remark-images-to-ssb-serve-blobs](https://gitlab.com/staltz/remark-images-to-ssb-serve-blobs)

## usage

Requires ssb-blobs plugin.

```diff
 const createSbot = require('scuttlebot/index')
   .use(require('scuttlebot/plugins/plugins'))
   .use(require('scuttlebot/plugins/master'))
   .use(require('scuttlebot/plugins/gossip'))
   .use(require('scuttlebot/plugins/replicate'))
   .use(require('ssb-friends'))
+  .use(require('ssb-blobs'))
   .use(require('ssb-backlinks'))
   .use(require('ssb-private'))
   .use(require('ssb-about'))
   .use(require('ssb-query'))
+  .use(require('ssb-serve-blobs'))
   .use(require('scuttlebot/plugins/invite'))
   .use(require('scuttlebot/plugins/block'))
   .use(require('scuttlebot/plugins/local'))
```

## Example usage

```js
const Stack = require('secret-stack')
const caps = require('ssb-caps')


const stack = Stack({ caps })
  .use(require('ssb-db'))          // << required
  .use(require('ssb-blobs'))
  .use(require('ssb-serve-blobs')) // needs: blobs

const config = {
   // see ssb-config for other needed config
   serveBlobs: {
      cors: true, // enable cors
      csp: "default-src 'self';", // set the content security policy (default: 'default-src none; sandbox')
      port: 3921 // set the port to serve blobs from (default: 26835)
   }
}
const server = stack(config)
```

## utils

```js
const toUrl = require('ssb-serve-blobs/id-to-url')

const blobId = '&d8kM9RXf5zvvy+AzlQ//JbCF0AEJelTl6m03u3dVVj4=.sha256'
const unboxKey = 'uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek='

console.log(toUrl(blobId));
// http://localhost:26835/%26d8kM9RXf5zvvy%2BAzlQ%2F%2FJbCF0AEJelTl6m03u3dVVj4%3D.sha256

console.log(toUrl(blobId, { unbox: unboxKey }));
// http://localhost:26835/%26d8kM9RXf5zvvy%2BAzlQ%2F%2FJbCF0AEJelTl6m03u3dVVj4%3D.sha256?unbox=uU0nuZNNPgilLlLX2n2r%2BsSE7%2BN6U4DukIj3rOLvzek%3D

console.log(toUrl(blobId, { port: 6000 }));
// http://localhost:6000/%26d8kM9RXf5zvvy%2BAzlQ%2F%2FJbCF0AEJelTl6m03u3dVVj4%3D.sha256
```

```js
const fromUrl = require('ssb-serve-blobs/url-to-id')

console.log(fromUrl('http://localhost:26835/%26Pe5kTo%2FV%2Fw4MToasp1IuyMrMcCkQwDOdyzbyD5fy4ac%3D.sha256'));
// &Pe5kTo/V/w4MToasp1IuyMrMcCkQwDOdyzbyD5fy4ac=.sha256
```


## License

MIT
