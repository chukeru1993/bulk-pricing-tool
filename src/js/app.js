function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(`${btn.dataset.tab}-section`).classList.add('active');

    if (btn.dataset.tab === 'add') {
      if (typeof loadAttrDict === 'function' && attrDictItems && attrDictItems.length === 0) {
        loadAttrDict();
      }
    }
    if (btn.dataset.tab === 'record') {
      loadRecords();
    }
  };
});

function updateTime() {
  const now = new Date();
  document.getElementById('time-display').textContent = now.toLocaleString();
}
setInterval(updateTime, 1000);
updateTime();

function setStatus(message) {
  document.getElementById('status-text').textContent = message;
}

async function init() {
  setStatus('正在加载...');

  setConfigErrorCallback((errorMessage) => {
    setStatus('数据库连接失败');
    showToast('数据库连接失败，请配置数据库连接', 'error');
    openConfigDialog();
  });

  try {
    await loadBatches();
    setStatus('就绪');
  } catch (error) {
    setStatus('数据库连接失败');
  }
}

init();