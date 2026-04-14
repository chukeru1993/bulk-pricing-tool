const db = require('../db/connection');

async function getAllBatches() {
  return await db.query('SELECT * FROM Batch ORDER BY CreateTime DESC');
}

async function createBatch(batchName, description, createUser) {
  const result = await db.query(
    'INSERT INTO Batch (BatchName, Description, CreateUser) OUTPUT INSERTED.* VALUES (@p0, @p1, @p2)',
    [
      { value: batchName },
      { value: description || '' },
      { value: createUser }
    ]
  );
  return result[0];
}

async function updateBatch(batchId, batchName, description) {
  await db.query(
    'UPDATE Batch SET BatchName = @p0, Description = @p1, UpdateTime = GETDATE() WHERE BatchID = @p2',
    [
      { value: batchName },
      { value: description || '' },
      { value: batchId }
    ]
  );
}

async function deleteBatch(batchId) {
  await db.query('DELETE FROM Batch WHERE BatchID = @p0', [{ value: batchId }]);
}

async function updateBatchStatus(batchId, status) {
  await db.query(
    'UPDATE Batch SET Status = @p0, UpdateTime = GETDATE() WHERE BatchID = @p1',
    [{ value: status }, { value: batchId }]
  );
}

module.exports = {
  getAllBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  updateBatchStatus
};