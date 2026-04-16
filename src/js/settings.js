const ALL_ADD_FIELDS = [
  { key: 'ProjectCode', label: '项目编码' },
  { key: 'ProjectName', label: '项目名称' },
  { key: 'ExecuteDept', label: '执行科室' },
  { key: 'OutpatientAttr', label: '门诊归属' },
  { key: 'InpatientAttr', label: '住院归属' },
  { key: 'MedicalCategory', label: '病案费用大类' },
  { key: 'MedicalSubCategory', label: '病案费用小类' },
  { key: 'ProvincePrice', label: '省单价' },
  { key: 'CityPrice', label: '市单价' },
  { key: 'CountyPrice', label: '县单价' },
  { key: 'Price', label: '单价' },
  { key: 'PricingUnit', label: '计价单位' },
  { key: 'Spec', label: '规格' },
  { key: 'Model', label: '型号' }
];

let currentRequiredFields = ['ProjectCode', 'ProjectName', 'PricingUnit'];

async function loadRequiredFields() {
  try {
    const result = await api.getRequiredFields();
    currentRequiredFields = result.requiredFields || ['ProjectCode', 'ProjectName', 'PricingUnit'];
  } catch (e) {
    currentRequiredFields = ['ProjectCode', 'ProjectName', 'PricingUnit'];
  }
}

function renderRequiredFieldsCheckboxes() {
  const container = document.getElementById('required-fields-checkboxes');
  container.innerHTML = '';
  ALL_ADD_FIELDS.forEach(field => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = field.key;
    checkbox.checked = currentRequiredFields.includes(field.key);
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(field.label));
    container.appendChild(label);
  });
}

function openSettingsDialog() {
  loadRequiredFields().then(() => {
    renderRequiredFieldsCheckboxes();
    document.getElementById('settings-message').style.display = 'none';
    document.getElementById('settings-dialog').classList.add('show');
  });
}

function closeSettingsDialog() {
  document.getElementById('settings-dialog').classList.remove('show');
}

async function saveSettings() {
  const checkboxes = document.querySelectorAll('#required-fields-checkboxes input[type="checkbox"]');
  const selected = [];
  checkboxes.forEach(cb => {
    if (cb.checked) selected.push(cb.value);
  });

  if (selected.length === 0) {
    showSettingsMessage('至少选择一个必填字段', true);
    return;
  }

  try {
    await api.saveRequiredFields(selected);
    currentRequiredFields = selected;
    showSettingsMessage('设置已保存', false);
    setTimeout(() => closeSettingsDialog(), 1000);
  } catch (error) {
    showSettingsMessage('保存失败: ' + error.message, true);
  }
}

function showSettingsMessage(message, isError) {
  const msgEl = document.getElementById('settings-message');
  msgEl.textContent = message;
  msgEl.className = `config-message ${isError ? 'error' : 'success'}`;
  msgEl.style.display = 'block';
  setTimeout(() => { msgEl.style.display = 'none'; }, 5000);
}

document.getElementById('open-settings-btn').onclick = openSettingsDialog;
document.getElementById('settings-cancel').onclick = closeSettingsDialog;
document.getElementById('settings-save').onclick = saveSettings;

window.getRequiredFields = function() {
  return currentRequiredFields;
};

window.getFieldLabel = function(key) {
  const found = ALL_ADD_FIELDS.find(f => f.key === key);
  return found ? found.label : key;
};

loadRequiredFields();
