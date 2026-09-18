const API_BASE_URL = '/api';

const api = {
  getToken() {
    return localStorage.getItem('uchala_token') || localStorage.getItem('udg_token') || localStorage.getItem('token');
  },

  setToken(token) {
    localStorage.setItem('uchala_token', token);
    localStorage.setItem('udg_token', token);
    localStorage.setItem('token', token);
  },

  getUser() {
    const userStr = localStorage.getItem('uchala_user') || localStorage.getItem('currentUser') || localStorage.getItem('udg_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch(e) {
      return null;
    }
  },

  setUser(user) {
    const str = JSON.stringify(user);
    localStorage.setItem('uchala_user', str);
    localStorage.setItem('currentUser', str);
    localStorage.setItem('udg_user', str);
  },

  logout() {
    localStorage.removeItem('uchala_token');
    localStorage.removeItem('uchala_user');
    localStorage.removeItem('udg_token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('udg_user');
    window.location.href = '/login.html';
  },

  requireRole(requiredRole) {
    const token = this.getToken();
    const user = this.getUser();
    if (!token || !user) {
      window.location.replace('/login.html');
      return null;
    }
    if (user.role !== requiredRole) {
      if (user.role === 'owner') window.location.replace('/owner/owner-dashboard.html');
      else if (user.role === 'trainer') window.location.replace('/trainer/trainer-dashboard.html');
      else if (user.role === 'member') window.location.replace('/member/member-dashboard.html');
      else window.location.replace('/login.html');
      return null;
    }
    return user;
  },

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      if (response.status === 401 && !endpoint.includes('/login')) {
        this.logout();
        throw new Error(data.message || 'Session expired. Please log in again.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error(`[API Error] ${endpoint}:`, error.message);
      throw error;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};