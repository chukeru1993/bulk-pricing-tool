const express = require('express');
const router = express.Router();
const batchService = require('../services/batchService');
const importService = require('../services/importService');
const executeService = require('../services/executeService');
const db = require('../db/connection');
const config = require('../utils/config');
const logger = require('../utils/logger');

const DB_ERROR_CODE = 503;

router.get('/config', (req, res) => {
  try {
    const cfg = config.getConfig();
    res.json({
      server: cfg.server,
      database: cfg.database,
      user: cfg.user,
      port: cfg.port,
      encrypt: cfg.encrypt,
      trustServerCertificate: cfg.trustServerCertificate
    });
  } catch (error) {
    logger.error(`GET /config - ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

router.post('/config', async (req, res) => {
  try {
    const { server, database, user, password, port, encrypt, trustServerCertificate } = req.body;

    logger.info(`POST /config - Updating database config for server: ${server}`);

    const updated = config.updateConfig({
      server,
      database,
      user,
      password,
      port: parseInt(port) || 1433,
      encrypt: encrypt || false,
      trustServerCertificate: trustServerCertificate !== false
    });

    if (!updated) {
      throw new Error('Failed to save config');
    }

    db.resetPool();

    const testResult = await db.testConnection();
    if (!testResult.success) {
      return res.status(DB_ERROR_CODE).json({
        error: 'config_saved_but_connection_failed',
        message: testResult.message
      });
    }

    res.json({ success: true, message: '配置已保存并连接成功' });
  } catch (error) {
    logger.error(`POST /config - ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

router.get('/config/required-fields', (req, res) => {
  try {
    const cfg = config.getConfig();
    res.json({ requiredFields: cfg.requiredFields || ['ProjectCode', 'ProjectName', 'PricingUnit'] });
  } catch (error) {
    logger.error(`GET /config/required-fields - ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

router.post('/config/required-fields', (req, res) => {
  try {
    const { requiredFields } = req.body;
    if (!Array.isArray(requiredFields)) {
      return res.status(400).json({ error: 'requiredFields must be an array' });
    }
    config.updateConfig({ requiredFields });
    res.json({ success: true, requiredFields });
  } catch (error) {
    logger.error(`POST /config/required-fields - ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

router.post('/config/test', async (req, res) => {
  try {
    const { server, database, user, password, port, encrypt, trustServerCertificate } = req.body;

    logger.info(`POST /config/test - Testing connection to: ${server}`);

    const testConfig = {
      server,
      database,
      user,
      password,
      port: parseInt(port) || 1433,
      driver: 'ODBC Driver 17 for SQL Server',
      options: {
        encrypt: encrypt || false,
        trustServerCertificate: trustServerCertificate !== false
      }
    };

    const result = await db.testConnection(testConfig);

    if (result.success) {
      res.json(result);
    } else {
      res.status(DB_ERROR_CODE).json(result);
    }
  } catch (error) {
    logger.error(`POST /config/test - ${error.message}`, { stack: error.stack });
    res.status(DB_ERROR_CODE).json({ success: false, message: error.message });
  }
});

router.get('/batches', async (req, res) => {
  try {
    const batches = await batchService.getAllBatches();
    res.json(batches);
  } catch (error) {
    logger.error(`GET /batches - ${error.message}`, { stack: error.stack });
    if (error.message.includes('Login failed') || error.message.includes('Connection refused')) {
      res.status(DB_ERROR_CODE).json({ error: 'database_connection_failed', message: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

router.post('/batches', async (req, res) => {
  try {
    const { batchName, description, createUser } = req.body;
    logger.info(`POST /batches - Creating batch: ${batchName}`);
    const batch = await batchService.createBatch(batchName, description, createUser || 'Admin');
    res.json(batch);
  } catch (error) {
    logger.error(`POST /batches - ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

router.put('/batches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { batchName, description } = req.body;
    logger.info(`PUT /batches/${id} - Updating batch`);
    await batchService.updateBatch(parseInt(id), batchName, description);
    res.json({ success: true });
  } catch (error) {
    logger.error(`PUT /batches/${req.params.id} - ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

router.delete('/batches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`DELETE /batches/${id} - Deleting batch`);
    await batchService.deleteBatch(parseInt(id));
    res.json({ success: true });
  } catch (error) {
    logger.error(`DELETE /batches/${req.params.id} - ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

router.get('/stop-items/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    const items = await importService.getStopItems(parseInt(batchId));
    res.json(items);
  } catch (error) {
    logger.error(`GET /stop-items/${req.params.batchId} - ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

router.post('/stop-items/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    const { items, importUser } = req.body;
    logger.info(`POST /stop-items/${batchId} - Saving ${items?.length || 0} items`);
    const count = await importService.saveStopItems(parseInt(batchId), items, importUser || 'Admin');
    res.json({ count });
  } catch (error) {
    logger.error(`POST /stop-items/${req.params.batchId} - ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

router.get('/dict/attr', async (req, res) => {
  try {
    const result = await db.queryOnDatabase(
      'SELECT sjxmxx_bmchr, sjxmxx_mcchr FROM [jc].[dbo].[jcjc_tb_sjxmxx]'
    );
    const items = result.map(row => ({
      code: row.sjxmxx_bmchr.trim(),
      name: row.sjxmxx_mcchr.trim()
    }));
    res.json(items);
  } catch (error) {
    logger.error(`GET /dict/attr - ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

router.get('/dict/dept', async (req, res) => {
  try {
    const result = await db.queryOnDatabase(
      'SELECT ksjbxx_bmchr, ksjbxx_mcchr FROM [jc].[dbo].[jcjc_tb_ksjbxx]'
    );
    const items = result.map(row => ({
      code: row.ksjbxx_bmchr.trim(),
      name: row.ksjbxx_mcchr.trim()
    }));
    res.json(items);
  } catch (error) {
    logger.error(`GET /dict/dept - ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

router.get('/dict/unit', async (req, res) => {
  try {
    const result = await db.queryOnDatabase(
      'SELECT fwxmdw_bmchr, fwxmdw_mcchr FROM [jc].[dbo].[jcjc_ta_fwxmdw]'
    );
    const items = result.map(row => ({
      code: row.fwxmdw_bmchr.trim(),
      name: row.fwxmdw_mcchr.trim()
    }));
    res.json(items);
  } catch (error) {
    logger.error(`GET /dict/unit - ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

router.get('/dict/medical', async (req, res) => {
  try {
    const result = await db.queryOnDatabase(
      'SELECT bafylx_bmchr, bafylx_mcchr FROM [jc].[dbo].[jcjc_ta_bafylx]'
    );
    const items = result.map(row => ({
      code: row.bafylx_bmchr.trim(),
      name: row.bafylx_mcchr.trim()
    }));
    res.json(items);
  } catch (error) {
    logger.error(`GET /dict/medical - ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

router.get('/add-items/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    const items = await importService.getAddItems(parseInt(batchId));
    res.json(items);
  } catch (error) {
    logger.error(`GET /add-items/${req.params.batchId} - ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

router.post('/add-items/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    const { items, importUser } = req.body;
    logger.info(`POST /add-items/${batchId} - Saving ${items?.length || 0} items`);
    const count = await importService.saveAddItems(parseInt(batchId), items, importUser || 'Admin');
    res.json({ count });
  } catch (error) {
    logger.error(`POST /add-items/${req.params.batchId} - ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

router.post('/execute/stop/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    logger.info(`POST /execute/stop/${batchId} - Executing batch stop`);
    const result = await executeService.executeBatchStop(parseInt(batchId));
    logger.info(`POST /execute/stop/${batchId} - Success`);
    res.json(result);
  } catch (error) {
    logger.error(`POST /execute/stop/${req.params.batchId} - ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

router.post('/execute/add/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    logger.info(`POST /execute/add/${batchId} - Executing batch add`);
    const result = await executeService.executeBatchAdd(parseInt(batchId));
    logger.info(`POST /execute/add/${batchId} - Success`);
    res.json(result);
  } catch (error) {
    logger.error(`POST /execute/add/${req.params.batchId} - ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const { batchId, type } = req.query;
    const logs = await executeService.getExecutionLogs(batchId ? parseInt(batchId) : null, type);
    res.json(logs);
  } catch (error) {
    logger.error(`GET /logs - ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;