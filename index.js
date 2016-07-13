var http = require('http')
var st = require('st')
var path = require('path')
var HttpHashRouter = require('http-hash-router')
var logger = require('morgan')('dev')
var Stack = require('stack')
var finalhandler = require('finalhandler')
var extend = require('xtend')
var fs = require('fs')

var STATIC_PATH = path.join(process.cwd(), 'static')

function createHyperserv (opts) {
  var defaults = {
    layers: [ logger ],
    serveStatic: true,
    staticPath: STATIC_PATH,
    sendTraces: true,
    staticMount: undefined,
    logTraces: true,
    logDetails: true
  }

  opts = extend(defaults, opts)

  // Check if a static folder is available by default
  if (opts.serveStatic) {
    // mount static serving at the same folder basename
    if (!opts.staticMount) opts.staticMount = `/${path.basename(opts.staticPath)}`
    try {
      fs.statSync(STATIC_PATH)
    } catch (e) {
      // Turn of static serving if the folder does not exist
      opts.serveStatic = false
    }
  }

  var router = HttpHashRouter()
  function routerLayer (req, res, cb) { return router(req, res, {}, cb) }
  opts.layers.push(routerLayer)
  var stack = Stack.compose.apply(null, opts.layers)
  var server = http.createServer(onReq)

  if (opts.serveStatic) {
    var staticLayer = st({
      path: opts.staticPath,
      url: opts.staticMount,
      passthrough: true
    })
    router.set(
      opts.staticMount + '/*',
      makeRoute(staticLayer)
    )
  }

  function onReq (req, res) {
    var done = finalhandler(req, res, {
      onerror: onError,
      env: opts.sendTraces ? 'development' : 'production'
    })
    stack(req, res, done)
  }

  function onError (err) {
    server.emit('error', err)
  }

  function composeStack (newLayers) {
    opts = extend(opts, {layers: newLayers})
    opts.layers.push(routerLayer)
    stack = Stack.compose.apply(null, opts.layers)
  }

  function serveStatic () {
    return {
      status: opts.serveStatic,
      path: opts.staticPath,
      mount: opts.staticMount
    }
  }

  server.composeStack = composeStack
  server.router = router
  server.serveStatic = serveStatic

  if (opts.logDetails) server.on('listening', logDetails)
  if (opts.logTraces) server.on('error', errorHandler)

  return server
}

function makeRoute (layer) {
  return (req, res, opts, cb) => {
    req.opts = extend(req.opts, opts)
    layer(req, res, cb)
  }
}

function logDetails () {
  console.log(`listening on http://localhost:${this.address().port}`)
  var serveStatic = this.serveStatic()
  if (serveStatic.status) {
    console.log('serving static from ' +
      `${serveStatic.path} at ${serveStatic.mount}`)
  }
}

function errorHandler (err) {
  if (err.statusCode !== 404) console.log(err)
}

module.exports = createHyperserv
module.exports.makeRoute = makeRoute
module.exports.errorHandler = errorHandler
module.exports.logDetails = logDetails
