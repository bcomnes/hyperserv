#!/usr/bin/env node

var minimist = require('minimist')
var logger = require('morgan')('dev')
var server = require('./')()
var argv = minimist(process.argv.slice(2), {
  alias: { p: 'port' },
  default: { port: 8000 }
})

process.title = 'hyperserv'

// Set up routes
server.router.set('/', function (req, res, opts, cb) {
  res.end('hi')
})

// Set up routes
server.router.set('/:name', function (req, res, opts, cb) {
  console.log(opts)
  res.end('hello ' + opts.params.name)
})

// Routes can fly fast and loose.  It don't matter
server.router.set('/crash', function (req, res, opts, cb) {
  throw new Error('This route crashed intentionally')
})

// Reconfigure the middlewre stack in front of the routes.
server.composeStack([
  logger
])

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
