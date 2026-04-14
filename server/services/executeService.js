const db = require('../db/connection');
const batchService = require('./batchService');
const procedures = require('../db/procedures');

async function executeBatchStop(batchId) {
  try {
    await batchService.updateBatchStatus(batchId, '执行中');
    await procedures.executeBatchStop(batchId);
    await batchService.updateBatchStatus(batchId, '已完成');

    await db.query(
      `INSERT INTO Execution_Log (BatchID, ExecutionType, Status, Message, SuccessCount, FailCount)
       VALUES (@p0, N'Stop', N'Success', N'执行成功', 0, 0)`,
      [{ value: batchId }]
    );

    return { success: true, message: '执行成功' };
  } catch (error) {
    await batchService.updateBatchStatus(batchId, '取消');

    await db.query(
      `INSERT INTO Execution_Log (BatchID, ExecutionType, Status, Message, SuccessCount, FailCount)
       VALUES (@p0, N'Stop', N'Failed', @p1, 0, 0)`,
      [{ value: batchId }, { value: error.message }]
    );

    throw error;
  }
}

async function executeBatchAdd(batchId) {
  try {
    await batchService.updateBatchStatus(batchId, '执行中');
    await procedures.executeBatchAdd(batchId);
    await batchService.updateBatchStatus(batchId, '已完成');

    await db.query(
      `INSERT INTO Execution_Log (BatchID, ExecutionType, Status, Message, SuccessCount, FailCount)
       VALUES (@p0, N'Add', N'Success', N'执行成功', 0, 0)`,
      [{ value: batchId }]
    );

    return { success: true, message: '执行成功' };
  } catch (error) {
    await batchService.updateBatchStatus(batchId, '取消');

    await db.query(
      `INSERT INTO Execution_Log (BatchID, ExecutionType, Status, Message, SuccessCount, FailCount)
       VALUES (@p0, N'Add', N'Failed', @p1, 0, 0)`,
      [{ value: batchId }, { value: error.message }]
    );

    throw error;
  }
}

async function getExecutionLogs(batchId, executionType) {
  let sql = 'SELECT * FROM Execution_Log WHERE 1=1';
  const params = [];

  if (batchId) {
    sql += ' AND BatchID = @p0';
    params.push({ value: batchId });
  }
  if (executionType) {
    sql += ` AND ExecutionType = @p${params.length}`;
    params.push({ value: executionType });
  }

  sql += ' ORDER BY ExecuteTime DESC';

  return await db.query(sql, params);
}

module.exports = {
  executeBatchStop,
  executeBatchAdd,
  getExecutionLogs
};