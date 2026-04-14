const db = require('../db/connection');

async function saveStopItems(batchId, items, importUser) {
  const pool = await db.getConnection();
  const transaction = pool.transaction();

  try {
    await transaction.begin();

    const deleteRequest = transaction.request();
    deleteRequest.input('p0', batchId);
    await deleteRequest.query('DELETE FROM Batch_Stop_Items WHERE BatchID = @p0');

    for (const item of items) {
      const req = transaction.request();
      req.input('p0', batchId);
      req.input('p1', item.ProjectCode);
      req.input('p2', item.ProjectName || '');
      req.input('p3', item.StopReason || '');
      req.input('p4', importUser);
      await req.query(
        `INSERT INTO Batch_Stop_Items (BatchID, ProjectCode, ProjectName, StopReason, ImportTime, ImportUser)
         VALUES (@p0, @p1, @p2, @p3, GETDATE(), @p4)`
      );
    }

    await transaction.commit();
    return items.length;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function getStopItems(batchId) {
  return await db.query(
    'SELECT ItemID, ProjectCode, ProjectName, StopReason FROM Batch_Stop_Items WHERE BatchID = @p0',
    [{ value: batchId }]
  );
}

async function saveAddItems(batchId, items, importUser) {
  const pool = await db.getConnection();
  const transaction = pool.transaction();

  try {
    await transaction.begin();

    const deleteRequest = transaction.request();
    deleteRequest.input('p0', batchId);
    await deleteRequest.query('DELETE FROM Batch_Add_Items WHERE BatchID = @p0');

    for (const item of items) {
      const req = transaction.request();
      req.input('p0', batchId);
      req.input('p1', item.ProjectCode);
      req.input('p2', item.ProjectName || '');
      req.input('p3', item.ExecuteDept || '');
      req.input('p4', item.OutpatientAttr || '');
      req.input('p5', item.InpatientAttr || '');
      req.input('p6', item.ProvincePrice || 0);
      req.input('p7', item.CityPrice || 0);
      req.input('p8', item.CountyPrice || 0);
      req.input('p9', item.Price || 0);
      req.input('p10', item.PricingUnit || '');
      req.input('p11', item.Spec || '');
      req.input('p12', item.Model || '');
      req.input('p13', importUser);
      await req.query(
        `INSERT INTO Batch_Add_Items (BatchID, ProjectCode, ProjectName, ExecuteDept, OutpatientAttr, InpatientAttr,
         ProvincePrice, CityPrice, CountyPrice, Price, PricingUnit, Spec, Model, ImportTime, ImportUser)
         VALUES (@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9, @p10, @p11, @p12, GETDATE(), @p13)`
      );
    }

    await transaction.commit();
    return items.length;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function getAddItems(batchId) {
  return await db.query(
    `SELECT ItemID, ProjectCode, ProjectName, ExecuteDept, OutpatientAttr, InpatientAttr,
     ProvincePrice, CityPrice, CountyPrice, Price, PricingUnit, Spec, Model
     FROM Batch_Add_Items WHERE BatchID = @p0`,
    [{ value: batchId }]
  );
}

module.exports = {
  saveStopItems,
  getStopItems,
  saveAddItems,
  getAddItems
};