var http = require('http')
var HttpHashRouter = require('@bret/http-hash-router')
var morgan = require('morgan')
var Stack = require('stack')
var finalhandler = require('finalhandler')

function Hyperserv (opts) {
  if (!(this instanceof Hyperserv)) return new Hyperserv(opts)
  if (!opts) opts = {}
  var self = this

  this.sendTraces = (opts.sendTraces === undefined) ? true : !!opts.sendTraces
  this.router = HttpHashRouter()
  this.onReq = onReq
  this.httpServer = http.createServer(this.onReq)
  this.finalhandler = finalhandler

  this._logDetails = (opts.logDetails === undefined) ? true : !!opts.logDetails
  this._logTraces = (opts.logTraces === undefined) ? true : !!opts.logTraces
  this._layers = opts.layers || [ this.logger ]
  this._stack = Stack.compose.apply(null, this._layers)

  if (this._logDetails) this.httpServer.on('listening', logDetails)
  if (this._logTraces) this.httpServer.on('error', this.errorHandler)

  function onReq (req, res) {
    var done = self.finalhandler(req, res, {
      onerror: self.errorHandler,
      env: self.sendTraces ? 'development' : 'production'
    })

    self._stack(req, res, routeReq)

    function routeReq (err) {
      if (err) return done(err)
      try {
        self.router(req, res, {}, done)
      } catch (err) {
        done(err)
      }
    }
  }

  function logDetails () {
    console.log(`listening on http://localhost:${self.httpServer.address().port}`)
    if (self._serveStatic) {
      console.log('serving static from ' +
        `${self._staticPath} at ${self._staticMount}`)
    }
  }
}

Hyperserv.prototype.composeStack = function (newLayers) {
  this._layers = newLayers
  this._stack = Stack.compose.apply(null, this._layers)
}

Hyperserv.prototype.errorHandler = function (err) {
  if (err.statusCode !== 404) console.log(err)
}

Hyperserv.prototype.logger = morgan('dev')

module.exports = Hyperserv
