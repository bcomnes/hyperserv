var minimist = require('minimist')
var http = require('http')
var st = require('st')
var path = require('path')
var HttpHashRouter = require('http-hash-router')
var logger = require('morgan')('dev')
var stack = require('stack')

var argv = minimist(process.argv.slice(2), {
  alias: { p: 'port' },
  default: { port: 8000 }
})

var router = HttpHashRouter()

var staticPath = path.join(__dirname, 'static')

router.set('/', function (req, res, opts, cb) {
  res.end('welcome!')
})

stack.errorHandler = onError

var handler = stack(
  logger,
  stack.mount('/static', st({ path: staticPath, url: '/static', passthrough: true })),
  (req, res, cb) => router(req, res, {}, cb)
)

var server = http.createServer(handler)

server.listen(argv.port)
server.on('listening', onListening)

function onListening () {
  console.log(`Server started on port http://localhost:${argv.port}`)
  console.log(server.address())
}

function onError (req, res, err) {
  console.log(err)
  if (err) {
    // use your own custom error serialization.
    res.statusCode = err.statusCode || 500
    res.end(err.message)
  }
}
