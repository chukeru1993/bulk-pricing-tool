document.getElementById('record-search').onclick = loadRecords;

async function loadRecords() {
  const batchId = document.getElementById('record-batch-select').value;
  const type = document.getElementById('record-type-select').value;

  try {
    const logs = await api.getLogs(batchId || null, type || null);
    renderRecordTable(logs);
  } catch (error) {
    showToast('加载记录失败: ' + error.message, 'error');
  }
}

function renderRecordTable(logs) {
  const tbody = document.querySelector('#record-table tbody');
  tbody.innerHTML = '';

  logs.forEach(log => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${log.LogID}</td>
      <td>${log.BatchID}</td>
      <td>${log.ExecutionType === 'Stop' ? '停用' : '新增'}</td>
      <td>${log.ExecuteTime ? new Date(log.ExecuteTime).toLocaleString() : ''}</td>
      <td>${log.Status}</td>
      <td>${log.Message || ''}</td>
      <td>${log.SuccessCount || 0}</td>
      <td>${log.FailCount || 0}</td>
    `;
    tbody.appendChild(row);
  });
}