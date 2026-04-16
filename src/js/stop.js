let currentStopBatchId = null;

document.getElementById('stop-batch-select').onchange = async (e) => {
  currentStopBatchId = e.target.value ? parseInt(e.target.value) : null;
  if (currentStopBatchId) {
    await loadStopItems();
  } else {
    document.querySelector('#stop-table tbody').innerHTML = '';
  }
};

document.getElementById('stop-import').onclick = () => {
  if (!currentStopBatchId) {
    showToast('请先选择批次', 'error');
    return;
  }
  document.getElementById('stop-file-input').click();
};

document.getElementById('stop-file-input').onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const items = await excelHelper.readStopItems(file);
    renderStopTable(items);
    showToast(`成功导入 ${items.length} 条记录`, 'success');
  } catch (error) {
    showToast('导入失败: ' + error.message, 'error');
  }
  e.target.value = '';
};

document.getElementById('stop-template').onclick = () => {
  excelHelper.downloadStopTemplate();
};

document.getElementById('stop-save').onclick = async () => {
  if (!currentStopBatchId) {
    showToast('请先选择批次', 'error');
    return;
  }

  const items = getStopItemsFromTable();
  if (items.length === 0) {
    showToast('没有可保存的数据', 'error');
    return;
  }

  const invalid = items.find(item => !item.ProjectCode || !item.ProjectName);
  if (invalid) {
    showToast('项目编码和项目名称不能为空', 'error');
    return;
  }

  try {
    await api.saveStopItems(currentStopBatchId, items);
    showToast(`保存成功，共 ${items.length} 条`, 'success');
  } catch (error) {
    showToast('保存失败: ' + error.message, 'error');
  }
};

document.getElementById('stop-execute').onclick = async () => {
  if (!currentStopBatchId) {
    showToast('请先选择批次', 'error');
    return;
  }

  if (!confirm('确定要执行停用操作吗？')) return;

  try {
    await api.executeStop(currentStopBatchId);
    showToast('执行成功', 'success');
    await loadStopItems();
  } catch (error) {
    showToast('执行失败: ' + error.message, 'error');
  }
};

async function loadStopItems() {
  if (!currentStopBatchId) return;

  try {
    const items = await api.getStopItems(currentStopBatchId);
    renderStopTable(items);
  } catch (error) {
    showToast('加载停用项目失败: ' + error.message, 'error');
  }
}

function renderStopTable(items) {
  const tbody = document.querySelector('#stop-table tbody');
  tbody.innerHTML = '';

  items.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" class="editable" value="${item.ProjectCode || ''}"></td>
      <td><input type="text" class="editable" value="${item.ProjectName ?? ''}"></td>
      <td><input type="text" class="editable" value="${item.StopReason ?? ''}"></td>
    `;
    tbody.appendChild(row);
  });
}

function getStopItemsFromTable() {
  const items = [];
  document.querySelectorAll('#stop-table tbody tr').forEach(row => {
    const inputs = row.querySelectorAll('input');
    const projectCode = inputs[0].value.trim();
    if (projectCode) {
      const strOrNull = (v) => v || null;
      items.push({
        ProjectCode: projectCode,
        ProjectName: strOrNull(inputs[1].value.trim()),
        StopReason: strOrNull(inputs[2].value.trim())
      });
    }
  });
  return items;
}