const API_BASE = '/api';

// --- Token Management ---

function getToken() {
    return localStorage.getItem('token');
}

function getAuthHeaders() {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function getErrorMessage(response, fallback) {
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text().catch(() => '');

    if (contentType.includes('application/json') && text) {
        try {
            const data = JSON.parse(text);
            return data.message || data.error || fallback;
        } catch (error) {
            console.error('Failed to parse error response:', error);
        }
    }

    const cleanText = text.replace(/\0/g, '').trim();
    if (!cleanText) return `${fallback} HTTP ${response.status}`;

    return `${fallback} HTTP ${response.status}: ${cleanText.substring(0, 200)}`;
}

// 带认证的 fetch 封装：自动附加 Token，401 时跳转登录页
export async function authFetch(url, options = {}) {
    const headers = {
        ...getAuthHeaders(),
        ...(options.headers || {})
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('未授权，请重新登录');
    }
    return response;
}

// --- Auth Functions ---

export async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (data.success) {
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
        }
        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

export function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
}

export function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// --- Smart Watch Functions ---

export async function loadWatchSnapshot() {
    const response = await authFetch(`${API_BASE}/watches/latest`);
    if (!response.ok) {
        throw new Error(await getErrorMessage(response, '手表数据加载失败'));
    }
    return await response.json();
}

// --- Emergency Response Functions ---

export async function loadEmergencyMonitoring() {
    const response = await authFetch(`${API_BASE}/emergency-monitoring`);
    if (!response.ok) throw new Error(await getErrorMessage(response, '应急联动数据加载失败'));
    return await response.json();
}

export async function loadEmergencySimulation() {
    const response = await authFetch(`${API_BASE}/emergency-simulation`);
    if (!response.ok) throw new Error(await getErrorMessage(response, '模拟开关状态加载失败'));
    return await response.json();
}

export async function setEmergencySimulation(active) {
    const response = await authFetch(`${API_BASE}/emergency-simulation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
    });
    if (!response.ok) throw new Error(await getErrorMessage(response, '应急事故模拟开关更新失败'));
    return await response.json();
}

export async function loadEmergencyEvents(status = '') {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const response = await authFetch(`${API_BASE}/emergency-events${query}`);
    if (!response.ok) throw new Error(await getErrorMessage(response, '应急事件加载失败'));
    return await response.json();
}

export async function getEmergencyEvent(id) {
    const response = await authFetch(`${API_BASE}/emergency-events/${id}`);
    if (!response.ok) throw new Error(await getErrorMessage(response, '应急事件加载失败'));
    return await response.json();
}

export async function createEmergencyEvent(data) {
    const response = await authFetch(`${API_BASE}/emergency-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await getErrorMessage(response, '应急事件建档失败'));
    return await response.json();
}

export async function updateEmergencyEvent(id, data) {
    const response = await authFetch(`${API_BASE}/emergency-events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await getErrorMessage(response, '应急处置保存失败'));
    return await response.json();
}

export async function uploadEmergencyAttachment(eventId, kind, file) {
    const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('附件读取失败'));
        reader.readAsDataURL(file);
    });
    const response = await authFetch(`${API_BASE}/emergency-events/${eventId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, filename: file.name, mimeType: file.type, dataUrl }),
    });
    if (!response.ok) throw new Error(await getErrorMessage(response, '附件上传失败'));
    return await response.json();
}

// --- Work Permit Functions ---

export async function loadPermits(status = '', search = '', page = 1, pageSize = 10) {
    let url = `${API_BASE}/work-permits?`;
    if (status) url += `status=${encodeURIComponent(status)}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    url += `page=${page}&pageSize=${pageSize}`;
    
    const response = await authFetch(url);
    return await response.json();
}

export async function getPermit(id) {
    const response = await authFetch(`${API_BASE}/work-permits/${id}`);
    if (!response.ok) throw new Error('Permit not found');
    return await response.json();
}

export async function createPermit(data) {
    const response = await authFetch(`${API_BASE}/work-permits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        throw new Error(await getErrorMessage(response, '提交失败'));
    }
    return await response.json();
}

export async function updatePermitStatus(id, status, signatures = null) {
    const body = { status };
    if (signatures) {
        body.signatures = signatures;
    }

    const response = await authFetch(`${API_BASE}/work-permits/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        throw new Error(await getErrorMessage(response, '更新状态失败'));
    }
    return await response.json();
}

export async function updatePermitExtraData(id, data) {
    const response = await authFetch(`${API_BASE}/work-permits/${id}/extra`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        throw new Error(await getErrorMessage(response, '保存数据失败'));
    }
    return await response.json();
}

// --- UI Helpers ---

export function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });
}

export function getStatusColor(status) {
    const colors = {
        '待审批': 'bg-yellow-100 text-yellow-700',
        '已批准': 'bg-blue-100 text-blue-700',
        '作业进行中': 'bg-green-100 text-green-700',
        '作业中': 'bg-green-100 text-green-700',
        '作业已完成': 'bg-gray-100 text-gray-700',
        '已完工': 'bg-gray-100 text-gray-700',
        '已驳回': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
}
