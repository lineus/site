# Using Hapi's Default Cache 
<!-- Synopsis Start -->
It took me longer than it should have to cobble together a working example of Hapi's
default in-memory cache. This is a step by step guide to go from 0 to caching
in as little time as possible. 
<!-- Synopsis End -->

## Prerequisites
   1. basic understanding of bash commands
   1. basic knowledge of javascript/nodejs/npm
   1. a working installation of nodejs

## Let's Just Get Something Working To Start:
```bash
examples>: mkdir hapiCacheTest
examples>: cd hapiCacheTest 
hapiCacheTest>: npm init -y
hapiCacheTest>: npm install @hapi/hapi
hapiCacheTest>: npm install --save-dev nodemon eslint
hapiCacheTest>: cat index.js 

const hapi = require('@hapi/hapi');

init()

async function init() {
  const server = new hapi.Server({
    host: 'localhost',
    port: 3456
  });

  server.route({
    method: 'GET',
    path: '/add/{a}/{b}',
    handler: (req, h) => {
      const {a, b} = req.params;
      const sum = Number(a) + Number(b);
      return h.response({ sum });
    }
  });

  await server.start();
}

hapiCacheTest>: nodemon -w ./index.js ./index.js
[nodemon] 2.0.4
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): index.js
[nodemon] watching extensions: js,mjs,json
[nodemon] starting `node ./index.js`

```

This is just a very basic Hapi configuration with a single route that returns the sum of two integers presented to the route handler in the form of request parameters (req.params).
The overarching theme of this example is taken in part from the hapi server-side caching example [here](https://hapi.dev/tutorials/caching/?lang=en_US#-server-side-caching). I'm using nodemon to auto restart the process anytime I save edits to the file in my code editor.

## Test Server Route Using Curl:

```
hapiCacheTest>: curl 'http://localhost:3456/add/3/1' && echo
{"sum":4}
hapiCacheTest>: 

```
Success! We have a simple hapi server up and running! Curl is used throughout this post for the sake of simplicity.

## Refactoring, Faux-async-ary, & Metrics
Our route currently only returns the sum of the a and b parameters. Lets factor out the add functionality and make the newly refactored function take a full second to run by awaiting a promise that resolves after 1000 milliseconds. We'll also add a delta field to the http response so that we can track our api call's duration.

```bash
hapiCacheTest>: cat index.js 

const hapi = require('@hapi/hapi');
const { performance } = require('perf_hooks');

init()

async function init() {
  const server = new hapi.Server({
    host: 'localhost',
    port: 3456
  });

  server.route({
    method: 'GET',
    path: '/add/{a}/{b}',
    handler: (req, h) => {
      const start = performance.now();
      const {a, b} = req.params;
      return add(a, b)
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
hapiCacheTest>: nodemon -w ./index.js ./index.js
[nodemon] 2.0.4
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): index.js
[nodemon] watching extensions: js,mjs,json
[nodemon] starting `node ./index.js`
```
## Test Again (several times consecutively)
```bash
hapiCacheTest>: i=0; \
  while [ $i -lt 3 ]; do \
    let i=$((i+1)); \
    curl 'http://localhost:3456/add/3/1'; \
    echo ; \
  done
{"sum":4,"delta":1001.3164609670639}
{"sum":4,"delta":1001.9132560491562}
{"sum":4,"delta":1001.4086539745331}
hapiCacheTest>: 

```
You can see that our calls to the new add function take just over 1 second **each** to resolve. By approximating, or in this case exagerating, the length of time that might pass in a call to an external api, we will be able to see if our future responses are being cached the way we expect them to be or not.

## Gimmie Your Cache!
Next we'll take advantage of hapi's built-in memory cache to store the result of each unique pair of addends. This will allow us to only call the psuedo-expensive add function at most, once per every 10 seconds per pair of addends. 

*the thing to note in the example below, the part that tripped me up on the Hapi docs, is that in order to use the default cache, you **do not** provied the cache name in the options to `server.cache(...)`*

```bash
hapiCacheTest>: cat index.js 

const hapi = require('@hapi/hapi');
const { performance } = require('perf_hooks');

init()

async function init() {
  const server = new hapi.Server({
    host: 'localhost',
    port: 3456
  });

  const sumCache = server.cache({
    expiresIn: 10 * 1000,
    segment: 'sums',
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

hapiCacheTest>: nodemon -w ./index.js ./index.js
[nodemon] 2.0.4
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): index.js
[nodemon] watching extensions: js,mjs,json
[nodemon] starting `node ./index.js`
```

## Tests with Cache
```bash
hapiCacheTest>: i=0; \
  while [ $i -lt 3 ]; do \
    let i=$((i+1)); \
    curl 'http://localhost:3456/add/3/1'; \
    echo ; \
  done
{"sum":4,"delta":1003.5052109956741}
{"sum":4,"delta":0.04381299018859863}
{"sum":4,"delta":0.0415189266204834}
hapiCacheTest>: 
```

You can see that the first call to the add-faux-api call takes the expected 1 second to complete, but the subsequent calls are served instantly from the cache. We can further demonstrate the expires setting by adding a fourth call to the api after the cache has expired:

```bash
hapiCacheTest>: i=0; \
  while [ $i -lt 4 ]; do \
    let i=$((i+1)); \
    if [ $i -eq 4 ]; then \
      sleep 10; \
    fi; \
    curl 'http://localhost:3456/add/3/1'; \
    echo ; \
  done
{"sum":4,"delta":1002.0322639942169}
{"sum":4,"delta":0.061856985092163086}
{"sum":4,"delta":0.055364012718200684}
{"sum":4,"delta":1001.4537309408188}
hapiCacheTest>: 
```

## Conclusion

I hope this posts makes it a little bit easier to get started using hapi's cache system. I'll write a follow up post on the reason I was exploring hapi's cache in the first place and hopefully I'll be able to use it to store images that I want to cache in my app.

<!-- Tags: hapi,caching,http,api -->
<!-- Published: 1594327622230 -->
<!-- Updated: 1594342148369 -->
<!-- Status: PUB -->
