'use strict'

const config = require('config')
const beforeExit = require('before-exit')
const restify = require('restify')

const logger = require('../logger')

const routes = require('./routes')

const server = restify.createServer()

if (config.throttle) {
  logger.info('Local throttle activated', config.throttle)
  server.use(
    restify.plugins.throttle({
      burst: config.throttle.burst,
      rate: config.throttle.rate,
      ip: config.throttle.ip
    })
  )
}

server.use(restify.plugins.queryParser())

function logRequest (req, res, next) {
  logger.verbose('-->', req.url)
  return next()
}

server.use(logRequest)

function start () {
  beforeExit.do(function (signal) {
    logger.error('Shutting down API on signal', signal)
  })

  routes.applyRoutes(server)

  server.listen(config.port, function () {
    logger.info(`API started on port ${config.port}`)
  })
}

module.exports = { start }
