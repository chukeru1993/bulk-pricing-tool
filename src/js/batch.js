let currentBatchId = null;
let editingBatchId = null;

async function loadBatches() {
  try {
    const batches = await api.getBatches();
    const tbody = document.querySelector('#batch-table tbody');
    tbody.innerHTML = '';

    batches.forEach(batch => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${batch.BatchID}</td>
        <td>${batch.BatchName}</td>
        <td>${batch.Description || ''}</td>
        <td>${batch.Status}</td>
        <td>${batch.CreateUser || ''}</td>
        <td>${batch.CreateTime ? new Date(batch.CreateTime).toLocaleString() : ''}</td>
      `;
      row.dataset.batchId = batch.BatchID;
      row.onclick = () => selectBatch(row, batch.BatchID);
      tbody.appendChild(row);
    });

    updateBatchSelects(batches);
  } catch (error) {
    showToast('加载批次失败: ' + error.message, 'error');
  }
}

function selectBatch(row, batchId) {
  document.querySelectorAll('#batch-table tbody tr').forEach(r => r.classList.remove('selected'));
  row.classList.add('selected');
  currentBatchId = batchId;
}

function updateBatchSelects(batches) {
  ['stop-batch-select', 'add-batch-select', 'record-batch-select'].forEach(selectId => {
    const select = document.getElementById(selectId);
    const oldValue = select.value;
    select.innerHTML = '<option value="">请选择批次</option>';
    batches.forEach(batch => {
      const option = document.createElement('option');
      option.value = batch.BatchID;
      option.textContent = `${batch.BatchID} - ${batch.BatchName}`;
      select.appendChild(option);
    });
    if (oldValue) select.value = oldValue;
  });
}

function showBatchDialog(title, batchName = '', description = '', batchId = null) {
  editingBatchId = batchId;
  document.getElementById('batch-dialog-title').textContent = title;
  document.getElementById('batch-name-input').value = batchName;
  document.getElementById('batch-desc-input').value = description;
  document.getElementById('batch-dialog').classList.add('show');
}

function hideBatchDialog() {
  document.getElementById('batch-dialog').classList.remove('show');
  editingBatchId = null;
}

async function handleBatchDialogOk() {
  const batchName = document.getElementById('batch-name-input').value.trim();
  const description = document.getElementById('batch-desc-input').value.trim();

  if (!batchName) {
    showToast('请输入批次名称', 'error');
    return;
  }

  try {
    if (editingBatchId) {
      await api.updateBatch(editingBatchId, { batchName, description });
      showToast('更新成功', 'success');
    } else {
      await api.createBatch({ batchName, description });
      showToast('创建成功', 'success');
    }
    hideBatchDialog();
    loadBatches();
  } catch (error) {
    showToast('操作失败: ' + error.message, 'error');
  }
}

async function handleBatchDelete() {
  if (!currentBatchId) {
    showToast('请选择要删除的批次', 'error');
    return;
  }

  if (!confirm('确定要删除选中的批次吗？')) return;

  try {
    await api.deleteBatch(currentBatchId);
    showToast('删除成功', 'success');
    loadBatches();
    currentBatchId = null;
  } catch (error) {
    showToast('删除失败: ' + error.message, 'error');
  }
}

document.getElementById('batch-new').onclick = () => showBatchDialog('新建批次');
document.getElementById('batch-edit').onclick = () => {
  if (!currentBatchId) {
    showToast('请选择要编辑的批次', 'error');
    return;
  }
  const row = document.querySelector(`tr[data-batch-id="${currentBatchId}"]`);
  const cells = row.querySelectorAll('td');
  showBatchDialog('编辑批次', cells[1].textContent, cells[2].textContent, currentBatchId);
};
document.getElementById('batch-delete').onclick = handleBatchDelete;
document.getElementById('batch-refresh').onclick = loadBatches;
document.getElementById('batch-dialog-ok').onclick = handleBatchDialogOk;
document.getElementById('batch-dialog-cancel').onclick = hideBatchDialog;