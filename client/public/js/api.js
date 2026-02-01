const API_BASE = '/api';

async function request(endpoint, options = {}) {
    const token = localStorage.getItem('accessToken');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });
    
    if (res.status === 401 && !options._retry) {
        // Try refresh
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, { method: 'POST' });
        if (refreshRes.ok) {
            const data = await refreshRes.json();
            localStorage.setItem('accessToken', data.accessToken);
            return request(endpoint, { ...options, _retry: true });
        } else {
            // Logout
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            window.location.reload();
        }
    }
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API Error');
    return data;
}

const api = {
    login: (email, password) => request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    }),
    signup: (username, email, password) => request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
    }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    
    getProjects: () => request('/projects'),
    createProject: (name) => request('/projects', {
        method: 'POST',
        body: JSON.stringify({ name })
    }),
    getProjectFiles: (id) => request(`/projects/${id}/files`),
    createFile: (projectId, path) => request(`/projects/${projectId}/files`, {
        method: 'POST',
        body: JSON.stringify({ path })
    }),
    getFile: (projectId, fileId) => request(`/projects/${projectId}/files/${fileId}`),
    deleteFile: (projectId, fileId) => request(`/projects/${projectId}/files/${fileId}`, {
        method: 'DELETE'
    })
};
