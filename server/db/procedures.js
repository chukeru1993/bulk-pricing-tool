const db = require('./connection');

async function executeBatchStop(batchId) {
  return await db.query(
    `EXEC sp_ExecuteBatchStop @batch_id = @p0`,
    [{ value: batchId }]
  );
}

async function executeBatchAdd(batchId) {
  return await db.query(
    `EXEC sp_ExecuteBatchAdd @batch_id = @p0`,
    [{ value: batchId }]
  );
}

module.exports = {
  executeBatchStop,
  executeBatchAdd
};