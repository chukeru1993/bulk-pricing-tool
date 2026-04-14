let currentAddBatchId = null;

document.getElementById('add-batch-select').onchange = async (e) => {
  currentAddBatchId = e.target.value ? parseInt(e.target.value) : null;
  if (currentAddBatchId) {
    await loadAddItems();
  }
};

document.getElementById('add-import').onclick = () => {
  document.getElementById('add-file-input').click();
};

document.getElementById('add-file-input').onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const items = await excelHelper.readAddItems(file);
    renderAddTable(items);
    showToast(`成功导入 ${items.length} 条记录`, 'success');
  } catch (error) {
    showToast('导入失败: ' + error.message, 'error');
  }
  e.target.value = '';
};

document.getElementById('add-template').onclick = () => {
  excelHelper.downloadAddTemplate();
};

document.getElementById('add-save').onclick = async () => {
  if (!currentAddBatchId) {
    showToast('请先选择批次', 'error');
    return;
  }

  const items = getAddItemsFromTable();
  if (items.length === 0) {
    showToast('没有可保存的数据', 'error');
    return;
  }

  try {
    await api.saveAddItems(currentAddBatchId, items);
    showToast(`保存成功，共 ${items.length} 条`, 'success');
  } catch (error) {
    showToast('保存失败: ' + error.message, 'error');
  }
};

document.getElementById('add-execute').onclick = async () => {
  if (!currentAddBatchId) {
    showToast('请先选择批次', 'error');
    return;
  }

  if (!confirm('确定要执行新增操作吗？')) return;

  try {
    await api.executeAdd(currentAddBatchId);
    showToast('执行成功', 'success');
    await loadAddItems();
  } catch (error) {
    showToast('执行失败: ' + error.message, 'error');
  }
};

async function loadAddItems() {
  if (!currentAddBatchId) return;

  try {
    const items = await api.getAddItems(currentAddBatchId);
    renderAddTable(items);
  } catch (error) {
    showToast('加载新增项目失败: ' + error.message, 'error');
  }
}

function renderAddTable(items) {
  const tbody = document.querySelector('#add-table tbody');
  tbody.innerHTML = '';

  items.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" class="editable" value="${item.ProjectCode || ''}"></td>
      <td><input type="text" class="editable" value="${item.ProjectName || ''}"></td>
      <td><input type="text" class="editable" value="${item.ExecuteDept || ''}"></td>
      <td><input type="text" class="editable" value="${item.OutpatientAttr || ''}"></td>
      <td><input type="text" class="editable" value="${item.InpatientAttr || ''}"></td>
      <td><input type="text" class="editable" value="${item.ProvincePrice || ''}"></td>
      <td><input type="text" class="editable" value="${item.CityPrice || ''}"></td>
      <td><input type="text" class="editable" value="${item.CountyPrice || ''}"></td>
      <td><input type="text" class="editable" value="${item.Price || ''}"></td>
      <td><input type="text" class="editable" value="${item.PricingUnit || ''}"></td>
      <td><input type="text" class="editable" value="${item.Spec || ''}"></td>
      <td><input type="text" class="editable" value="${item.Model || ''}"></td>
    `;
    tbody.appendChild(row);
  });
}

function getAddItemsFromTable() {
  const items = [];
  document.querySelectorAll('#add-table tbody tr').forEach(row => {
    const inputs = row.querySelectorAll('input');
    const projectCode = inputs[0].value.trim();
    if (projectCode) {
      items.push({
        ProjectCode: projectCode,
        ProjectName: inputs[1].value.trim(),
        ExecuteDept: inputs[2].value.trim(),
        OutpatientAttr: inputs[3].value.trim(),
        InpatientAttr: inputs[4].value.trim(),
        ProvincePrice: parseFloat(inputs[5].value) || 0,
        CityPrice: parseFloat(inputs[6].value) || 0,
        CountyPrice: parseFloat(inputs[7].value) || 0,
        Price: parseFloat(inputs[8].value) || 0,
        PricingUnit: inputs[9].value.trim(),
        Spec: inputs[10].value.trim(),
        Model: inputs[11].value.trim()
      });
    }
  });
  return items;
}