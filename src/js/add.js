let currentAddBatchId = null;
let addDirty = false;
let dictCache = { attr: [], dept: [], unit: [], medical: [] };

function markAddDirty() {
  addDirty = true;
}

function clearAddDirty() {
  addDirty = false;
}

async function loadAllDicts() {
  const loaders = [
    { key: 'attr', fn: () => api.getAttrDict() },
    { key: 'dept', fn: () => api.getDeptDict() },
    { key: 'unit', fn: () => api.getUnitDict() },
    { key: 'medical', fn: () => api.getMedicalDict() }
  ];
  for (const { key, fn } of loaders) {
    if (dictCache[key].length === 0) {
      try {
        dictCache[key] = await fn();
      } catch (e) {
        console.error(`加载字典[${key}]失败:`, e);
      }
    }
  }
}

function buildSelectOptions(dictKey, selectedCode) {
  const items = dictCache[dictKey];
  let html = '<option value="">-- 请选择 --</option>';
  items.forEach(item => {
    const selected = item.code === selectedCode ? ' selected' : '';
    html += `<option value="${item.code}"${selected}>${item.name}</option>`;
  });
  return html;
}

function resolveDictCode(dictKey, value) {
  if (!value) return null;
  const items = dictCache[dictKey];
  const found = items.find(item => item.code === value || item.name === value);
  return found ? found.code : null;
}

const DICT_FIELD_LABELS = {
  ExecuteDept: '执行科室',
  OutpatientAttr: '门诊归属',
  InpatientAttr: '住院归属',
  MedicalCategory: '病案费用大类',
  MedicalSubCategory: '病案费用小类',
  PricingUnit: '计价单位'
};

const DICT_FIELD_MAP = {
  ExecuteDept: 'dept',
  OutpatientAttr: 'attr',
  InpatientAttr: 'attr',
  MedicalCategory: 'medical',
  MedicalSubCategory: 'medical',
  PricingUnit: 'unit'
};

const FIELD_ELEMENT_MAP = {
  ProjectCode: { type: 'input', index: 0 },
  ProjectName: { type: 'input', index: 1 },
  ExecuteDept: { type: 'select', index: 0 },
  OutpatientAttr: { type: 'select', index: 1 },
  InpatientAttr: { type: 'select', index: 2 },
  MedicalCategory: { type: 'select', index: 3 },
  MedicalSubCategory: { type: 'select', index: 4 },
  ProvincePrice: { type: 'input', index: 2 },
  CityPrice: { type: 'input', index: 3 },
  CountyPrice: { type: 'input', index: 4 },
  Price: { type: 'input', index: 5 },
  PricingUnit: { type: 'select', index: 5 },
  Spec: { type: 'input', index: 6 },
  Model: { type: 'input', index: 7 }
};

function convertImportItems(items) {
  const failedCounts = {};
  const converted = items.map(item => {
    const newItem = { ...item };
    for (const [field, dictKey] of Object.entries(DICT_FIELD_MAP)) {
      const original = item[field];
      if (original) {
        const code = resolveDictCode(dictKey, original);
        if (code === null && original) {
          failedCounts[field] = (failedCounts[field] || 0) + 1;
        }
        newItem[field] = code;
      }
    }
    return newItem;
  });

  const warnings = [];
  for (const [field, count] of Object.entries(failedCounts)) {
    warnings.push(`${DICT_FIELD_LABELS[field]}有${count}条未能正常从名称转编码`);
  }

  return { items: converted, warnings };
}

function clearFieldErrors() {
  document.querySelectorAll('#add-table .field-error').forEach(el => {
    el.classList.remove('field-error');
  });
}

function validateRequiredFields(requiredFields) {
  const emptyLabels = [];
  const rows = document.querySelectorAll('#add-table tbody tr');

  rows.forEach(row => {
    const inputs = row.querySelectorAll('input');
    const selects = row.querySelectorAll('select');

    requiredFields.forEach(field => {
      const mapping = FIELD_ELEMENT_MAP[field];
      if (!mapping) return;

      let element;
      if (mapping.type === 'input') {
        element = inputs[mapping.index];
      } else {
        element = selects[mapping.index];
      }
      if (!element) return;

      const value = element.value.trim();
      if (!value) {
        element.classList.add('field-error');
        const label = window.getFieldLabel ? window.getFieldLabel(field) : field;
        if (!emptyLabels.includes(label)) {
          emptyLabels.push(label);
        }
      }
    });
  });

  return emptyLabels;
}

document.getElementById('add-batch-select').onchange = async (e) => {
  currentAddBatchId = e.target.value ? parseInt(e.target.value) : null;
  if (currentAddBatchId) {
    await loadAllDicts();
    await loadAddItems();
  } else {
    document.querySelector('#add-table tbody').innerHTML = '';
  }
  clearAddDirty();
};

document.getElementById('add-import').onclick = () => {
  if (!currentAddBatchId) {
    showToast('请先选择批次', 'error');
    return;
  }
  document.getElementById('add-file-input').click();
};

document.getElementById('add-file-input').onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const rawItems = await excelHelper.readAddItems(file);
    await loadAllDicts();
    const { items, warnings } = convertImportItems(rawItems);
    renderAddTable(items);
    markAddDirty();
    let msg = `成功导入 ${items.length} 条记录`;
    if (warnings.length > 0) {
      msg += '，注意：' + warnings.join('；') + '……';
    }
    showToast(msg, warnings.length > 0 ? 'warning' : 'success');
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

  clearFieldErrors();

  const requiredFields = window.getRequiredFields ? window.getRequiredFields() : ['ProjectCode', 'ProjectName'];
  const emptyFieldLabels = validateRequiredFields(requiredFields);
  if (emptyFieldLabels.length > 0) {
    showToast(`${emptyFieldLabels.join('、')}不能为空`, 'error');
    return;
  }

  const negativePrice = items.find(item =>
    (item.ProvincePrice !== null && item.ProvincePrice < 0) ||
    (item.CityPrice !== null && item.CityPrice < 0) ||
    (item.CountyPrice !== null && item.CountyPrice < 0) ||
    (item.Price !== null && item.Price < 0)
  );
  if (negativePrice) {
    showToast('单价不能为负数', 'error');
    return;
  }

  try {
    await api.saveAddItems(currentAddBatchId, items);
    clearAddDirty();
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

  if (addDirty) {
    showToast('数据已修改，请先保存再执行', 'error');
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
    clearAddDirty();
  } catch (error) {
    showToast('加载新增项目失败: ' + error.message, 'error');
  }
}

async function renderAddTable(items) {
  await loadAllDicts();

  const tbody = document.querySelector('#add-table tbody');
  tbody.innerHTML = '';

  items.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" class="editable" value="${item.ProjectCode || ''}"></td>
      <td><input type="text" class="editable" value="${item.ProjectName || ''}"></td>
      <td><select class="editable">${buildSelectOptions('dept', item.ExecuteDept)}</select></td>
      <td><select class="editable">${buildSelectOptions('attr', item.OutpatientAttr)}</select></td>
      <td><select class="editable">${buildSelectOptions('attr', item.InpatientAttr)}</select></td>
      <td><select class="editable">${buildSelectOptions('medical', item.MedicalCategory)}</select></td>
      <td><select class="editable">${buildSelectOptions('medical', item.MedicalSubCategory)}</select></td>
      <td><input type="text" class="editable" value="${item.ProvincePrice ?? ''}"></td>
      <td><input type="text" class="editable" value="${item.CityPrice ?? ''}"></td>
      <td><input type="text" class="editable" value="${item.CountyPrice ?? ''}"></td>
      <td><input type="text" class="editable" value="${item.Price ?? ''}"></td>
      <td><select class="editable">${buildSelectOptions('unit', item.PricingUnit)}</select></td>
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
    const selects = row.querySelectorAll('select');
    const projectCode = inputs[0].value.trim();
    if (projectCode) {
      const strOrNull = (v) => v || null;
      const numOrNull = (v) => { const n = parseFloat(v); return isNaN(n) ? null : n; };
      items.push({
        ProjectCode: projectCode,
        ProjectName: strOrNull(inputs[1].value.trim()),
        ExecuteDept: strOrNull(selects[0].value),
        OutpatientAttr: strOrNull(selects[1].value),
        InpatientAttr: strOrNull(selects[2].value),
        MedicalCategory: strOrNull(selects[3].value),
        MedicalSubCategory: strOrNull(selects[4].value),
        ProvincePrice: numOrNull(inputs[2].value),
        CityPrice: numOrNull(inputs[3].value),
        CountyPrice: numOrNull(inputs[4].value),
        Price: numOrNull(inputs[5].value),
        PricingUnit: strOrNull(selects[5].value),
        Spec: strOrNull(inputs[6].value.trim()),
        Model: strOrNull(inputs[7].value.trim())
      });
    }
  });
  return items;
}

loadAllDicts();

document.querySelector('#add-table').addEventListener('input', markAddDirty);
document.querySelector('#add-table').addEventListener('change', markAddDirty);
