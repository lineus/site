# Storing_Images_In_Hapi's_Default_Cache 
<!-- Synopsis Start -->
I am working on an app that involves accessing images from a third party api. I want
to cache these images in memory based on the TTL in the Cache-Control header from the http response that contains the data. 
<!-- Synopsis End -->

This post is a follow-up to 
[Using Hapi's Default Cache]('/articles/using_hapi_default_cache')

## Requirements
   1. The cache needs to be bigger than the 100MB default size
   1. The TTL needs to be set per image
## Using the scaffolding from our previous test
```js
const hapi = require('@hapi/hapi');
const { performance } = require('perf_hooks');

init();

async function init() {
  const server = new hapi.Server({
    host: 'localhost',
    port: 3456
  });

  const sumCache = server.cache({
    expiresIn: 1000 * 60 * 60 * 24 * 30, //30 days
    segment: 'posters_w154',
    generateTimeout: 2000,
    generateFunc: async (id) => {
      return add(id.a, id.b);
    }
  });

  server.route({
    method: 'GET',
    path: '/add/{a}/{b}',
    handler: (req, h) => {
      const start = performance.now();
      const {a, b} = req.params;
      const id = `${a}:${b}`;
      return sumCache.get({id, a, b })
        .then(sum => {
          return h.response({ sum, delta: performance.now() - start });
        });
    }
  });

  await server.start();
}

async function add(a,b) {
  await wait(1000);
  return Number(a) + Number(b);
}

function wait(n) {
  return new Promise((res) => {
    return setTimeout(res, n);
  });
}
```

<!-- Tags: hapi,caching,http,image-->
<!-- Published: -->
<!-- Updated: -->
<!-- Status: WIP -->
