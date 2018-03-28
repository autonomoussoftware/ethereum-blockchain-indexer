const { apiPort } = require('config')
const restify = require('restify')
const debug = require('debug')('eis.api')
const logger = require('./logger.js')

const routes = require('./routes')
const server = restify.createServer()

server.use(restify.plugins.queryParser())

function logRequest (req, res, next) {
  debug('-->', req.url)
  return next()
}

server.use(logRequest)

function start () {
  routes.applyRoutes(server)

  server.listen(apiPort, function () {
    logger.info(`API started on port ${apiPort}`)
  })
}

module.exports = {
  start
}
