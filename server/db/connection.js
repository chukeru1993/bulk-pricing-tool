const mssql = require('mssql');
const config = require('../utils/config');

let pool = null;

function getDbConfig() {
  const cfg = config.loadConfig();
  return {
    server: cfg.server,
    database: cfg.database,
    user: cfg.user,
    password: cfg.password,
    port: cfg.port || 1433,
    driver: 'ODBC Driver 17 for SQL Server',
    options: {
      encrypt: cfg.encrypt || false,
      trustServerCertificate: cfg.trustServerCertificate || true
    }
  };
}

async function getConnection() {
  const dbConfig = getDbConfig();
  if (!pool) {
    pool = await mssql.connect(dbConfig);
  }
  return pool;
}

async function query(sql, params = []) {
  const pool = await getConnection();
  const request = pool.request();
  params.forEach((param, index) => {
    request.input(`p${index}`, param.value);
  });
  const result = await request.query(sql);
  return result.recordset;
}

async function execute(procedureName, params = []) {
  const pool = await getConnection();
  const request = pool.request();
  params.forEach(param => {
    request.input(param.name, param.value);
  });
  const result = await request.execute(procedureName);
  return result.recordset;
}

async function testConnection(dbConfig = null) {
  const testConfig = dbConfig || getDbConfig();
  try {
    const testPool = await mssql.connect(testConfig);
    await testPool.close();
    return { success: true, message: '连接成功' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

function close() {
  if (pool) {
    pool.close();
    pool = null;
  }
}

function resetPool() {
  close();
}

module.exports = {
  getConnection,
  query,
  execute,
  testConnection,
  close,
  resetPool,
  getDbConfig
};