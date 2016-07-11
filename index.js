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

var routes = HttpHashRouter()

var staticPath = path.join(__dirname, 'static')
routes.set('/static/*', st({ path: staticPath, url: '/static' }))

routes.set('/', function (req, res, opts, cb) {
  res.end('welcome!')
})

function router (req, res, next) {
  return routes(req, res, {}, next)
}

var handler = stack(
  logger,
  router
)

var server = http.createServer(handler)

server.listen(argv.port)
server.on('listening', onListening)

function onListening () {
  console.log(`Server started on port http://localhost:${argv.port}`)
  console.log(server.address())
}
