'use strict'

const { noop } = require('lodash')
const { port } = require('config')
const beforeExit = require('before-exit')
const restify = require('restify')

const logger = require('../logger')

const db = require('../db')
const routes = require('./routes')
const events = require('./events')
const queries = require('./db-queries')

const server = restify.createServer({ socketio: true })

server.use(restify.plugins.queryParser())

// log any received request
function logRequest (req, res, next) {
  logger.verbose('-->', req.url)
  return next()
}

server.use(logRequest)

// stop the web server and detach the events API and DB listeners
const stop = () => events.detach().catch(noop)

// start the web server and initialize the events API and DB listeners
function start () {
  beforeExit.do(function (signal) {
    logger.error('Shutting down API on signal', signal)

    return stop()
  })

  routes.applyRoutes(server, '/v1')

  // eslint-disable-next-line max-params
  server.on('restifyError', function (req, res, err, callback) {
    logger.warn('<--', err.name, err.message)
    logger.debug('Could not send successfull response', err.stack)
    return callback()
  })

  return db.init()
    .then(queries.setDb)
    .then(function () {
      server.listen(port, function () {
        logger.info(`API started on port ${port}`)

        events.attach(server)
          .then(function () {
            logger.info('Events interfase is up')
          })
          .catch(function (err) {
            logger.error('Could not start events interface', err.message)

            // Should not continue if unable to start the events interface
            return stop()
              .then(function () {
                process.exit(1)
              })
          })
      })
    })
}

module.exports = { start }
