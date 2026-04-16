const fs = require('fs');
const path = require('path');

const isPackaged = process.env.BULK_PRICING_IS_PACKAGED === 'true';
const userDataPath = process.env.BULK_PRICING_USER_DATA || null;
const appPath = process.env.BULK_PRICING_APP_PATH || path.join(__dirname, '..', '..');

function getUserDataDir() {
  if (userDataPath) return userDataPath;
  return appPath;
}

function getConfigPath() {
  if (isPackaged && userDataPath) {
    return path.join(userDataPath, 'config.json');
  }
  return path.join(appPath, 'config.json');
}

function getLogsPath() {
  if (isPackaged && userDataPath) {
    return path.join(userDataPath, 'logs');
  }
  return path.join(appPath, 'logs');
}

const defaultConfig = {
  server: 'localhost',
  database: 'BulkPricingDB',
  user: 'sa',
  password: '',
  port: 1433,
  encrypt: false,
  trustServerCertificate: true,
  requiredFields: ['ProjectCode', 'ProjectName', 'PricingUnit']
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
  getConfig,
  updateConfig,
  loadConfig,
  saveConfig,
  getConfigPath,
  getLogsPath,
  getUserDataDir
};
