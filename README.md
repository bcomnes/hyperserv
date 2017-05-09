# hyperserv

A hypermodular http server that glues together [http](https://nodejs.org/api/http.html), [stack](http://github.com/creationix/stack) and [@bret/http-hash-router](https://github.com/bcomnes/http-hash-router).

```
npm i hyperserv
```

[![Build Status](https://travis-ci.org/bcomnes/hyperserv.svg?branch=master)](https://travis-ci.org/bcomnes/hyperserv)
[![Dependency Status](https://david-dm.org/bcomnes/hyperserv.svg)](https://david-dm.org/bcomnes/hyperserv)

## Why?

Express is a reliable and widely understood web-framework, but the dream of node.js was framework free network applications.  [http-framework](https://github.com/Raynos/http-framework) and [substack-flavored-webapp](https://github.com/substack/substack-flavored-webapp) are excellent counterpoints to frameworks like express and hapi but come along with a pile of boilerplate. hyperserv aims to glue together the basics of any web server by providing a routing layer and a middleware layer to offer up a quick way to write small webservers the hypermodular way (or, more specifically, one hypermodular way)!

How you launch and configure your webservers seems to be a deeply personal ceremony. hyperserv leaves this up to you and just puts together the webserver for you.

## Usage

```js
var minimist = require('minimist')
var morgan = require('morgan')
var Hyperserv = require('hyperserv')
var app = new Hyperserv()
var argv = minimist(process.argv.slice(2), {
  alias: { p: 'port' },
  default: { port: 8000 }
})
var ecstatic = require('ecstatic')
var path = require('path')

process.title = 'hyperserv'

// Reconfigure the middlewre stack sitting in front of the routes.
app.composeStack([
  morgan('dev')
])

var staticPath = path.join(__dirname, 'static')
console.log(staticPath)
app.router.set('/static', ecstatic({
  root: staticPath,
  baseDir: 'static',
  handleError: false
}))

// Set up routes
app.router.set('/', function (req, res, opts, cb) {
  res.end('hi')
})

// Set up routes
app.router.set('/:name', function (req, res, opts, cb) {
  res.end('hello ' + opts.params.name)
})

// Routes can fly fast and loose.  It don't matter
app.router.set('/crash', function (req, res, opts, cb) {
  throw new Error('This route crashed intentionally')
})

function expressMiddleware (req, res, next) {
  res.write(JSON.stringify(req.opts) + '\n')
  res.end('this is an express/connect style middleware layer')
}

app.router.set('/:name/express', expressMiddleware)

app.httpServer.listen(argv.port)
```

## API

#### Routes vs Layers No More!

Hyperserv now supports connect style routes out of the box.  The `opts` object that holds params and app level vars are now extended into the `req.opts` object by default, when the route doesn't accept an `opts` argument.

#### `var app = new Hyperserv([options])`

Returns a new hyperserv `app` object. It sets up an httpServer that has a middleware handler and router.

Default options:

```js
{
  layers: [ require('morgan')('dev') ],
  sendTraces: true,
  logTraces: true,
  logDetails: true
}
```

- `layers`: Provide an array of middleware functions (`function layer (req, res, cb) {}`) that get stuck in front of the final routing layer.  You can reconfigure this layer at any point with `server.composeStack`.
- `sendTraces`: Specify if stack traces are sent in the `res` if the `req` runs into any kind of error.  Defaults to `false`
- `logTraces`: Attach the default error handler to the `error` event emitted from the server whenever it encounters an error.

```js
function errorHandler (err) {
  if (err.statusCode !== 404) console.log(err)
}
```

- `logDetails`: Attach the default server start log message to the server to fire when it starts listening.

#### `app.httpServer`

This is an instance of `http.createServer`.  It isn't started yet, so set up your event handlers, and turn it on with `app.httpServer.listen(port)`

#### `app.router`

This is the `@bret/http-hash-router` router object that has simply been attached to the `http` server instance.  Read all about it here:

- [bcomnes/http-hash-router](https://github.com/bcomnes/http-hash-router)
- [Matt-Esch/http-hash](https://github.com/Matt-Esch/http-hash)

#### `app.router.set(pattern, routeHandler)`

This sets a route and a route handler.  Remember, routeHandlers expect the following signature `function route (req, res, opts, cb) {}`.  You can compose middleware stack's to plop inside of route handlers using [`stack.compose`](https://github.com/creationix/stack/blob/master/stack.js#L36).

See [bcomnes/http-hash-router#example](https://github.com/bcomnes/http-hash-router#example)

#### `app.composeStack([ layers ])`

This lets you pass an array of middleware layers (`function layer (req, res, cb) {}`) to stick in front of the `http-hash-router` layer.  You can do body parsing, cookie parsing, sessions, and auth stuff here.  Calling `composeStack` tosses the existing middleware stack out in favor of the one you pass in here.

#### `app.errorHandler`

This is the default error handler that gets passed to the server's `error` event when `logTraces` is set to true when creating a `server`.  It is an instance method that you can reassign if you want.

```js
function errorHandler (err) {
  if (err.statusCode !== 404) console.log(err)
}
```

If you want to use it as is with the server, use the `logTraces` option.  It is exported only for convince and access and should not be normally used directly.

#### `app.logDetails`

This is the default logging function that runs when the server starts listening.  Use the `logDetails` options to turn it on or off.  It is an instance method that you can reassign if you want.

#### `Hyperserv.makeRoute(layer)` (Depreciated)

Pass in a connect style middleware layer and get back a `http-hash-router` route handler.  The returned route handler mixes in any options it receives on its `opts` argument to `req.opts`.

```js
function makeRoute (layer) {
  return (req, res, opts, cb) => {
    req.opts = extend(req.opts, opts)
    layer(req, res, cb)
  }
}
```


