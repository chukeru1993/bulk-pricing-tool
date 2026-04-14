const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', '..', 'config.json');

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
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }
  return defaultConfig;
}

function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
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
  saveConfig
};