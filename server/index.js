const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

const appPath = process.env.BULK_PRICING_APP_PATH || path.join(__dirname, '..', '..');

function getLogDir() {
  return path.join(appPath, 'logs');
}

function writeLog(msg) {
  const timestamp = new Date().toISOString();
  const logMsg = `${timestamp} - ${msg}\n`;
  const logDir = getLogDir();
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logFile = path.join(logDir, 'server.log');
  fs.appendFileSync(logFile, logMsg);
  console.log(msg);
}

writeLog('=== Server starting ===');
writeLog('App path: ' + appPath);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'src')));

app.use((req, res, next) => {
  writeLog(`${req.method} ${req.url}`);
  next();
});

const apiRouter = require('./routes/api');
app.use('/api', apiRouter);

let server;
try {
  server = app.listen(PORT, '0.0.0.0', () => {
    writeLog(`Server running on port ${PORT}`);
    writeLog(`Log path: ${getLogDir()}`);
  });
} catch (err) {
  writeLog(`FATAL: Failed to start server: ${err.message}`);
  console.error(err);
}

process.on('uncaughtException', (err) => {
  writeLog(`FATAL: Uncaught Exception: ${err.message}`);
  console.error(err);
});

process.on('unhandledRejection', (reason, promise) => {
  writeLog(`FATAL: Unhandled Rejection: ${reason}`);
});

module.exports = server;