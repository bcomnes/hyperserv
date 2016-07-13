# hyperserv

A hypermodular http server that glues together [http](https://nodejs.org/api/http.html), [stack](http://github.com/creationix/stack) and [http-hash-router](https://github.com/Matt-Esch/http-hash-router).

```
npm i hyperserv
```

[![Build Status](https://travis-ci.org/bcomnes/hyperserv.svg?branch=master)](https://travis-ci.org/bcomnes/hyperserv)
[![Dependency Status](https://david-dm.org/bcomnes/hyperserv.svg)](https://david-dm.org/bcomnes/hyperserv)

## Why?

Express is a reliable and widely understood web-framework, but the dream of the node.js 90s was framework free network applicaitons.  [http-framework](https://github.com/Raynos/http-framework) and [substack-flavored-webapp](https://github.com/substack/substack-flavored-webapp) are excellent counterpoints to frameworks like express and hapi but come along with a pile of boilerplate.  hyperserv aims to glue together the basics of any webserver by providing a routing layer, a middlware layer and a static file server to offer up a quick way to write small webservers the hypermodular way (or, more specifically, one hypermodular way)!

How you launch and configure your webservers seems to be a deeply personal ceremony.  hyperserv leaves this up to you and just puts together the webserver for you.


## Usage

```js
var minimist = require('minimist')
var server = require('./')()
var router = server.router
var logger = require('morgan')('dev')
var argv = minimist(process.argv.slice(2), {
  alias: { p: 'port' },
  default: { port: 8000 }
})

// Reconfigure the middleware stack in front of the routes if you want.
server.composeStack([
  logger
])

// Set up routes
router.set('/', function (req, res, opts, cb) {
  res.end('hello world')
})

router.set('/:name', function (req, res, opts, cb) {
  res.end('hello ' + opts.params.name)
})

// Routes can fly fast and loose.  It don't matter...
// The server will still keep running
router.set('/crash', function (req, res, opts, cb) {
  throw new Error('This route crashed intentionally')
})

router.set('/api', {
  GET: function (req, res, opts, cb) {
    res.end('some payload')
  },
  POST: function (req, res, opts, cb) {
    res.end('some other payload')
  }
})

server.listen(argv.port)
server.on('listening', onListening)
server.on('error', onError)

function onListening () {
  console.log(`listening on http://localhost:${argv.port}`)
  var serveStatic = server.serveStatic()
  if (serveStatic.status) {
    console.log('serving static from ' +
      `${serveStatic.path} at ${serveStatic.mount}`)
  }
}

function onError (err) {
  if (err.statusCode !== 404) console.log(err)
}
```

## API

#### Routes vs Layers

- `layer`: Layers are what `stack` expects to get.  They conform to the `connect`/`express` style middleware with the following signature: `function layer (req, res, cb) {}`
- `route`: Routes are what `http-hash-router` expect to receive as route handlers.  They have an additional `opts` argument because taping notes to `req` and `res` objects gets out of hand quickly.  They expect the following signature: `function route (req, res, opts, cb) {}`.

You can convert `layers` to `routes` by passing the through `hyperserv.makeRoute(layer)`.

#### `var server = hyperserv([options])`

Returns a new http server that has a middleware handler, router, and possibly a static file server turned on.  This is simply an instance of `http.createServer` with a few methods and objects tied on.

Default options:

```js
{
  layers: [ require('morgan')('dev') ],
  serveStatic: true,
  staticPath: path.join(process.cwd(), 'static'),
  staticMount: `/${path.basename(opts.staticPath)}`,
  hideTrace: true
}
```

- `layers`: Provide an array of middleware functions (`function layer (req, res, cb) {}`) that get stuck in front of the final routing layer.  You can reconfigure this layer at any point with `server.composeStack`.
- `serveStatic`: Enable the static file server route provided by [`st`](http://npmjs.com/st). Defaults to `true`.  Short circuits to `false` if it can't stat the folder it tries to serve out of.
- `staticPath`: Specify the path to serve static files from.  Defaults to `path.join(process.cwd(), 'static')` e.g. a folder named `static` in the directory you are starting your process in.
- `staticMount`: Specify the router mount point to use.  Defaults to `/${path.basename(opts.staticPath)}`.
- `hideTrace`: Specify if stack traces are sent in the `res` if the `req` runs into any kind of error.  Defaults to `false`

#### `server.router`

This is the `http-hash-router` router object that has simply been attached to the `http` server instance.  Read all about it here:

- [Matt-Esch/http-hash](https://github.com/Matt-Esch/http-hash-router)
- [Matt-Esch/http-hash](https://github.com/Matt-Esch/http-hash)

#### `server.router.set(pattern, routeHandler)`

This sets a route and a route handler.  Remember, routeHandlers expect the following signature `function route (req, res, opts, cb) {}`.  You can compose middleware stack's to plop inside of route handlers using [`stack.compose`](https://github.com/creationix/stack/blob/master/stack.js#L36).

See [http-hash-router#example](https://github.com/Matt-Esch/http-hash-router#example)

#### `server.composeStack([ layers ])`

This lets you pass an array of middleware layers (`function layer (req, res, cb) {}`) to stick in front of the `http-hash-router` layer.  You can do body parsing, cookie parsing, sessions, and auth stuff here.  Calling `composeStack` tosses the existing middleware stack in favor of the one you pass in.

#### `server.serveStatic()`

This function returns an object containing the status of the static file server.

```js
{
  status: bool,
  path: opts.staticPath,
  mount: opts.staticMount
}
```

#### `hyperserv.makeRoute(layer)`

Pass in a connect style middleware layer and get back a `http-hash-router` route handler.  The returned route handler mixes in any options it receives on its `opts` argument to `req.opts`.

```js
function makeRoute (layer) {
  return (req, res, opts, cb) => {
    req.opts = extend(req.opts, opts)
    layer(req, res, cb)
  }
}
```

`¯\_(ツ)_/¯`

