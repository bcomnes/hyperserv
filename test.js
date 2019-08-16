var test = require('tape')
var request = require('request')
var Hyperserv = require('./index')
var assign = Object.assign
var port = 8976
var url = `http://localhost:${port}`

var defaults = {
  serveStatic: false,
  logDetails: false
}

test('is function', function (t) {
  t.equal(typeof Hyperserv, 'function')
  t.end()
})

test('can set and request urls urls', function (t) {
  var app = Hyperserv(defaults)

  app.router.set('/foo', function foo (req, res, opts, cb) {
    res.end('foo')
  })

  app.router.set('/bar', function bar (req, res, opts, cb) {
    res.end('bar')
  })

  app.httpServer.listen(port)

  request(`${url}/foo`, function onResp (err, resp, body) {
    t.error(err, 'error free response')

    t.equal(resp.statusCode, 200, '200 status code to /foo')
    t.equal(resp.body, 'foo', '/foo body === "foo"')

    request(`${url}/bar`, function onResp (err, resp, body) {
      t.error(err, 'error free response')

      t.equal(resp.statusCode, 200, '200 status code to /bar')
      t.equal(resp.body, 'bar', '/bar body === "bar"')

      app.httpServer.close()
      t.end()
    })
  })
})

test('set routes after the server started', function (t) {
  var app = Hyperserv(defaults)
  app.httpServer.listen(port)

  request(`${url}/foo`, function onResp (err, resp, body) {
    t.error(err, 'error free response')
    t.equal(resp.statusCode, 404, '404 status code to /foo')

    app.router.set('/foo', function foo (req, res, opts, cb) {
      res.end('foo')
    })

    request(`${url}/foo`, function onResp (err, resp, body) {
      t.error(err, 'error free response')

      t.equal(resp.statusCode, 200, '200 status code to /foo')
      t.equal(resp.body, 'foo', '/foo body === "foo"')
      app.httpServer.close()
      t.end()
    })
  })
})

test('create custom middleware stacks', function (t) {
  function testLayer (req, res, next) {
    t.ok(req, 'middleware got req object')
    t.ok(res, 'middleware got res object')
    t.equal(typeof next, 'function', 'next is a function')
    t.pass('middleware layer ran fine')
    next()
  }

  var newLayerRun = false
  function newLayer (req, res, next) {
    newLayerRun = !newLayerRun
    next()
  }

  var app = Hyperserv(assign({}, defaults, { layers: [testLayer] }))
  app.router.set('/foo', function foo (req, res, opts, cb) {
    res.end('foo')
  })
  app.httpServer.listen(port)

  request(`${url}/foo`, function onResp (err, resp, body) {
    t.error(err, 'error free response')
    t.equal(resp.statusCode, 200, '200 status code to /foo')
    t.equal(resp.body, 'foo', '/foo body === "foo"')

    t.doesNotThrow(app.composeStack.bind(app, [newLayer]), 'new middleware stack created')
    t.notOk(newLayerRun, 'middleware doesnt run right away after composition')
    request(`${url}/foo`, function onResp (err, resp, body) {
      t.error(err, 'error free response')
      t.equal(resp.statusCode, 200, '200 status code to /foo')
      t.equal(resp.body, 'foo', '/foo body === "foo"')

      t.ok(newLayerRun, 'middleware ran')
      app.httpServer.close()
      t.end()
    })
  })
})
