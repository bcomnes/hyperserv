var minimist = require('minimist')
var http = require('http')
var st = require('st')
var path = require('path')
var HttpHashRouter = require('http-hash-router')
var logger = require('morgan')('dev')
var Stack = require('stack')
// var favicon = require('serve-favicon')
var finalhandler = require('finalhandler')

var argv = minimist(process.argv.slice(2), {
  alias: { p: 'port' },
  default: { port: 8000 }
})

var router = HttpHashRouter()

var staticPath = path.join(__dirname, 'static')
// var iconPath = path.join(staticPath, 'favicon.ico')

router.set('/', function (req, res, opts, cb) {
  res.end('welcome!')
})

router.set('/crash', function (req, res, opts, cb) {
  throw new Error('this was supposed to crash')
})

router.set('/static/*', st({ path: staticPath, url: '/static' }))

var stack = Stack.compose(
  // favicon(iconPath),
  logger,
  (req, res, cb) => router(req, res, {}, cb)
)

function onListening () {
  console.log(`listening on http://localhost:${argv.port}`)
}

function onReq (req, res) {
  var done = finalhandler(req, res, {onerror: onError})
  stack(req, res, done)
}

function onError (err) {
  if (err.statusCode !== 404) console.log(err)
}

var server = http.createServer(onReq)
server.listen(argv.port)
server.on('listening', onListening)

module.exports = server
