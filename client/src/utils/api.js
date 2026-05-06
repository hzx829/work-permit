const API_BASE = '/api';

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
        }
        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

export function logout() {
    localStorage.removeItem('user');
}

export function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// --- Work Permit Functions ---

export async function loadPermits(status = '', search = '', page = 1, pageSize = 10) {
    let url = `${API_BASE}/work-permits?`;
    if (status) url += `status=${encodeURIComponent(status)}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    url += `page=${page}&pageSize=${pageSize}`;
    
    const response = await fetch(url);
    return await response.json();
}

export async function getPermit(id) {
    const response = await fetch(`${API_BASE}/work-permits/${id}`);
    if (!response.ok) throw new Error('Permit not found');
    return await response.json();
}

export async function createPermit(data) {
    const response = await fetch(`${API_BASE}/work-permits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`服务器错误 ${response.status}: ${text.substring(0, 300)}`);
    }
    return await response.json();
}

export async function updatePermitStatus(id, status, signatures = null) {
    const body = { status };
    if (signatures) {
        body.signatures = signatures;
    }

    const response = await fetch(`${API_BASE}/work-permits/${id}/status`, {
        method: 'POST', // Changed from PUT to POST for better proxy compatibility
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`更新状态失败 HTTP ${response.status}: ${text.substring(0, 200)}`);
    }
    return await response.json();
}

export async function updatePermitExtraData(id, data) {
    const response = await fetch(`${API_BASE}/work-permits/${id}/extra`, {
        method: 'POST', // Changed from PUT to POST for better proxy compatibility
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`保存数据失败 HTTP ${response.status}: ${text.substring(0, 200)}`);
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
