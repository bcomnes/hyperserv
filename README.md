# pi-video

A simple http-server/recipie book that resembles an express server, except without express.  The goal is to use the small modules to fit together 'good enough' to get most things done.

- directly use the `http` core module.  `https` should be provided by `ngingx` or some other reverse proxy/ssl endpoint.
- http-hash-router provides the routing, but this could be swapped out for pretty myuch any other router.
- stack provides a middleware layer.  By running all of your middlware through stack, you are guarenteed that all middleware responsibilities are coverd, and you don't need to worry about layers eating errors.  Only `stack.compose` is used though, because the defauly error handling is kinda funky. 
- st provides the static file serving although you may consider using nginx for this.  st is a good example of how old middleware really concerned itself with way too much (like routing).
- finalhandler is an extreemly battle tested final middleware layer from express.  It is used for finishing up req/res lifecycles and error handling.

`¯\_(ツ)_/¯`

