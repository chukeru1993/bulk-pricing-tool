const db = require('../db/connection');
const mssql = require('mssql');

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
      req.input('p2', mssql.NVarChar, item.ProjectName || null);
      req.input('p3', mssql.NVarChar, item.StopReason || null);
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
      req.input('p2', mssql.NVarChar, item.ProjectName || null);
      req.input('p3', mssql.NVarChar, item.ExecuteDept || null);
      req.input('p4', mssql.NVarChar, item.OutpatientAttr || null);
      req.input('p5', mssql.NVarChar, item.InpatientAttr || null);
      req.input('p5a', mssql.NVarChar, item.MedicalCategory || null);
      req.input('p5b', mssql.NVarChar, item.MedicalSubCategory || null);
      req.input('p6', mssql.Decimal(18, 4), item.ProvincePrice || null);
      req.input('p7', mssql.Decimal(18, 4), item.CityPrice || null);
      req.input('p8', mssql.Decimal(18, 4), item.CountyPrice || null);
      req.input('p9', mssql.Decimal(18, 4), item.Price || null);
      req.input('p10', mssql.NVarChar, item.PricingUnit || null);
      req.input('p11', mssql.NVarChar, item.Spec || null);
      req.input('p12', mssql.NVarChar, item.Model || null);
      req.input('p13', importUser);
      await req.query(
        `INSERT INTO Batch_Add_Items (BatchID, ProjectCode, ProjectName, ExecuteDept, OutpatientAttr, InpatientAttr,
         MedicalCategory, MedicalSubCategory,
         ProvincePrice, CityPrice, CountyPrice, Price, PricingUnit, Spec, Model, ImportTime, ImportUser)
         VALUES (@p0, @p1, @p2, @p3, @p4, @p5, @p5a, @p5b, @p6, @p7, @p8, @p9, @p10, @p11, @p12, GETDATE(), @p13)`
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
     MedicalCategory, MedicalSubCategory,
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