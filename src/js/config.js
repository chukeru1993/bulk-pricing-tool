let isConfigDialogOpen = false;

async function loadConfig() {
  try {
    const response = await fetch(`${API_BASE}/config`);
    const config = await response.json();
    document.getElementById('config-server').value = config.server || '';
    document.getElementById('config-port').value = config.port || 1433;
    document.getElementById('config-database').value = config.database || '';
    document.getElementById('config-user').value = config.user || '';
    document.getElementById('config-password').value = '';
    document.getElementById('config-trust').checked = config.trustServerCertificate !== false;
  } catch (error) {
    document.getElementById('config-server').value = 'localhost';
    document.getElementById('config-port').value = '1433';
    document.getElementById('config-database').value = 'BulkPricingDB';
    document.getElementById('config-user').value = 'sa';
    document.getElementById('config-password').value = '';
    document.getElementById('config-trust').checked = true;
  }
}

function getConfigFormData() {
  return {
    server: document.getElementById('config-server').value.trim(),
    port: document.getElementById('config-port').value.trim(),
    database: document.getElementById('config-database').value.trim(),
    user: document.getElementById('config-user').value.trim(),
    password: document.getElementById('config-password').value,
    trustServerCertificate: document.getElementById('config-trust').checked
  };
}

function showConfigMessage(message, isError = false) {
  const msgEl = document.getElementById('config-message');
  msgEl.textContent = message;
  msgEl.className = `config-message ${isError ? 'error' : 'success'}`;
  msgEl.style.display = 'block';
  setTimeout(() => {
    msgEl.style.display = 'none';
  }, 5000);
}

function openConfigDialog() {
  isConfigDialogOpen = true;
  loadConfig();
  document.getElementById('config-message').style.display = 'none';
  document.getElementById('config-dialog').classList.add('show');
}

function closeConfigDialog() {
  isConfigDialogOpen = false;
  document.getElementById('config-dialog').classList.remove('show');
}

async function testConnection() {
  const config = getConfigFormData();

  if (!config.server || !config.database || !config.user) {
    showConfigMessage('请填写完整的数据库配置信息', true);
    return;
  }

  const btn = document.getElementById('config-test');
  btn.disabled = true;
  btn.textContent = '测试中...';

  try {
    const response = await fetch(`${API_BASE}/config/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      showConfigMessage('连接成功！', false);
    } else {
      showConfigMessage('连接失败: ' + result.message, true);
    }
  } catch (error) {
    showConfigMessage('连接失败: ' + error.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = '测试连接';
  }
}

async function saveConfig() {
  const config = getConfigFormData();

  if (!config.server || !config.database || !config.user) {
    showConfigMessage('请填写完整的数据库配置信息', true);
    return;
  }

  const btn = document.getElementById('config-save');
  btn.disabled = true;
  btn.textContent = '保存中...';

  try {
    const response = await fetch(`${API_BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });

    const result = await response.json();

    if (response.status === 503) {
      showConfigMessage('配置已保存，但连接失败: ' + result.message, true);
      return;
    }

    if (response.ok) {
      showConfigMessage('配置已保存！', false);
      setTimeout(() => {
        closeConfigDialog();
        loadBatches();
      }, 1000);
    } else {
      showConfigMessage('保存失败: ' + result.error, true);
    }
  } catch (error) {
    showConfigMessage('保存失败: ' + error.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = '保存';
  }
}

document.getElementById('open-config-btn').onclick = openConfigDialog;
document.getElementById('config-cancel').onclick = closeConfigDialog;
document.getElementById('config-test').onclick = testConnection;
document.getElementById('config-save').onclick = saveConfig;

window.checkAndShowConfigDialog = function() {
  return false;
};