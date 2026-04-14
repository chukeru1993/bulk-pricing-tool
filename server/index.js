const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const apiRouter = require('./routes/api');

const app = express();
const PORT = 3000;

function getLogDir() {
  const config = require('./utils/config');
  return config.getLogsPath();
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

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'src')));

app.use((req, res, next) => {
  writeLog(`${req.method} ${req.url}`);
  next();
});

app.use('/api', apiRouter);

let server;
try {
  server = app.listen(PORT, '0.0.0.0', () => {
    writeLog(`Server running on port ${PORT}`);
    writeLog(`Log path: ${getLogDir()}`);
    writeLog(`Config path: ${require('./utils/config').getConfigPath()}`);
  });
} catch (err) {
  writeLog(`FATAL: Failed to start server: ${err.message}`);
}

process.on('uncaughtException', (err) => {
  writeLog(`FATAL: Uncaught Exception: ${err.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
  writeLog(`FATAL: Unhandled Rejection: ${reason}`);
});

module.exports = server;