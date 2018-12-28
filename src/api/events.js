'use strict'

const { events: { maxAddresses } } = require('config')
const { isAddress, isHexStrict } = require('web3-utils')
const { isArray, negate, noop, overEvery, some } = require('lodash')
const { toLower } = require('lodash')
const SocketIoServer = require('socket.io')

const logger = require('../logger')

const { attachToDb, detachFromDb } = require('./listener')

// join each address room to receive transactions
function subscribeToTransactions (socket, addresses, ack) {
  if (!isArray(addresses)) {
    logger.warn('Subscription rejected: invalid subscription')
    ack('invalid subscription')
    return
  }
  if (addresses.length > maxAddresses) {
    logger.warn('Subscription rejected: too many addresses')
    ack('too many addresses')
    return
  }
  if (some(addresses, negate(overEvery([isHexStrict, isAddress])))) {
    logger.warn('Subscription rejected: invalid addresses')
    ack('invalid addresses')
    return
  }

  logger.verbose('-->> subscribe txs', addresses)

  socket.join(addresses.map(toLower), function (err) {
    if (err) {
      logger.warn('Could not complete subscription', err.message)
      ack('error on subscription')
      return
    }

    logger.verbose('Subscription to txs processed', addresses)

    ack()
  })
}

// create a Socket.IO server and attach it to an HTTP server
function attach (httpServer) {
  const io = new SocketIoServer(httpServer)

  const v1 = io.of('v1')

  v1.use(function (_, next) {
    next(new Error('Deprecated'))
  })

  const v2 = io.of('v2')

  v2.on('connection', function (socket) {
    logger.verbose('New connection', socket.id)

    socket.on('subscribe', function (addresses = [], ack = noop) {
      subscribeToTransactions(socket, addresses, ack)
    })

    socket.on('disconnect', function (reason) {
      logger.verbose('Connection closed', reason)
    })
  })

  return attachToDb(v2)
}

// detach everything before shutting down
const detach = detachFromDb

module.exports = { attach, detach }
