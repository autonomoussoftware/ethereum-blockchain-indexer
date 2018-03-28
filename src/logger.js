const winston = require('winston')
const winstonChildLogger = require('winston-child-logger')
const SentryTransport = require('winston-sentry-transport')
const PapertrailTransport = require('winston-papertrail').Papertrail
const config = require('config')

const logger = winstonChildLogger(new winston.Logger())

logger.levelLength = 7
logger.padLevels = true

logger.filters.push((_, message, meta) => {
  if (!message && meta instanceof Error) { return meta.stack || meta.message }

  return message
})

if (config.logger.console) {
  logger.add(winston.transports.Console, config.logger.console)
}

if (config.logger.sentry && config.logger.sentry.dns) {
  logger.add(SentryTransport, config.logger.sentry)
}

if (config.logger.papertrail && config.logger.papertrail.host) {
  logger.add(PapertrailTransport, config.logger.papertrail)
}

module.exports = logger
