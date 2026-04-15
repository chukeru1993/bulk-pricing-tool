const API_BASE = 'http://localhost:3000/api';

let configErrorCallback = null;

function setConfigErrorCallback(callback) {
  configErrorCallback = callback;
}

const api = {
  async request(url, options = {}) {
    try {
      const response = await fetch(`${API_BASE}${url}`, {
        headers: {
          'Content-Type': 'application/json'
        },
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 503 && errorData.error === 'database_connection_failed') {
          if (configErrorCallback) {
            configErrorCallback(errorData.message);
          }
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },

  async getBatches() {
    return await this.request('/batches');
  },

  async createBatch(data) {
    return await this.request('/batches', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateBatch(id, data) {
    return await this.request(`/batches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteBatch(id) {
    return await this.request(`/batches/${id}`, {
      method: 'DELETE'
    });
  },

  async getStopItems(batchId) {
    return await this.request(`/stop-items/${batchId}`);
  },

  async saveStopItems(batchId, items) {
    return await this.request(`/stop-items/${batchId}`, {
      method: 'POST',
      body: JSON.stringify({ items })
    });
  },

  async getAddItems(batchId) {
    return await this.request(`/add-items/${batchId}`);
  },

  async saveAddItems(batchId, items) {
    return await this.request(`/add-items/${batchId}`, {
      method: 'POST',
      body: JSON.stringify({ items })
    });
  },

  async executeStop(batchId) {
    return await this.request(`/execute/stop/${batchId}`, {
      method: 'POST'
    });
  },

  async executeAdd(batchId) {
    return await this.request(`/execute/add/${batchId}`, {
      method: 'POST'
    });
  },

  async getLogs(batchId, type) {
    const params = new URLSearchParams();
    if (batchId) params.append('batchId', batchId);
    if (type) params.append('type', type);
    return await this.request(`/logs?${params.toString()}`);
  },

  async getAttrDict() {
    return await this.request('/dict/attr');
  }
};