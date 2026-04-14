const fs = require('fs');
const path = require('path');

let configPath;
let isDev = false;

function init(userDataPath, devMode) {
  configPath = path.join(userDataPath, 'config.json');
  isDev = devMode;
}

function getConfigPath() {
  if (configPath) return configPath;
  return path.join(__dirname, '..', '..', 'config.json');
}

function getLogsPath() {
  if (isDev) {
    return path.join(__dirname, '..', '..', 'logs');
  }
  const userDataPath = path.dirname(getConfigPath());
  return path.join(userDataPath, 'logs');
}

const defaultConfig = {
  server: 'localhost',
  database: 'BulkPricingDB',
  user: 'sa',
  password: '',
  port: 1433,
  encrypt: false,
  trustServerCertificate: true
};

function loadConfig() {
  const cfgPath = getConfigPath();
  try {
    if (fs.existsSync(cfgPath)) {
      const data = fs.readFileSync(cfgPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }
  return defaultConfig;
}

function saveConfig(config) {
  const cfgPath = getConfigPath();
  try {
    const dir = path.dirname(cfgPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(cfgPath, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Failed to save config:', error);
    return false;
  }
}

function getConfig() {
  return loadConfig();
}

function updateConfig(newConfig) {
  const current = loadConfig();
  const updated = { ...current, ...newConfig };
  return saveConfig(updated) ? updated : null;
}

module.exports = {
  init,
  getConfig,
  updateConfig,
  loadConfig,
  saveConfig,
  getConfigPath,
  getLogsPath
};