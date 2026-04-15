const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./utils/config');

const app = express();
const PORT = 3000;

function getLogDir() {
  return config.getLogsPath();
}

function writeLog(msg) {
  const timestamp = new Date().toISOString();
  const logMsg = `${timestamp} - ${msg}\n`;
  const logDir = getLogDir();
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logFile = path.join(logDir, 'server.log');
    fs.appendFileSync(logFile, logMsg);
  } catch (e) {
    console.error('Failed to write log:', e.message);
  }
  console.log(msg);
}

writeLog('=== Server starting ===');
writeLog('Config path: ' + config.getConfigPath());
writeLog('Logs path: ' + config.getLogsPath());

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
