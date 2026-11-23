'use strict';

const { loadConfig, secretValues } = require('./config');
const { createLogger, describeError } = require('./logger');
const { createApp } = require('./app');

const SHUTDOWN_TIMEOUT_MS = 8000;

// Entry point: reads the environment, builds the app and listens. All behaviour lives in app.js.
// Nothing here may throw on a missing variable: the bot boots with an empty environment and
// reports what is missing through /health and its startup logs.
const config = loadConfig();
const logger = createLogger({ secrets: secretValues(config) });
const app = createApp({ config, logger });
const { host, port } = config.server;

// Node's default is to crash on an unhandled rejection; a failed send must never take the bot down
process.on('unhandledRejection', (reason) => {
  logger.error('process.unhandled_rejection', describeError(reason));
});

const server = app.listen(port, host, () => {
  logger.info('server.listening', { host, port });
});

server.on('error', (err) => {
  logger.error('server.failed', describeError(err));
  process.exit(1);
});

// Docker stops the container with SIGTERM and node is PID 1, so the signal has to be handled here
let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info('server.shutting_down', { signal });
  setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();
  server.close(() => {
    app.locals.idle().then(() => process.exit(0));
  });
}
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
