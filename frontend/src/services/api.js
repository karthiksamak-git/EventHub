import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 15000,
});

API.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

API.interceptors.response.use(
    res => res,
    err => {
        if (err.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export const authAPI = {
    register: (data) => API.post('/auth/register', data),
    login: (data) => API.post('/auth/login', data),
    getMe: () => API.get('/auth/me'),
    updateProfile: (data) => API.put('/auth/profile', data),
    setUpiId: (upiId) => API.put('/auth/upi', { upiId }),
    changePassword: (data) => API.put('/auth/password', data),
};

export const eventsAPI = {
    getAll: (params = {}) => API.get('/events', { params }),
    getOne: (id) => API.get(`/events/${id}`),
    create: (data) => API.post('/events', data),
    update: (id, data) => API.put(`/events/${id}`, data),
    delete: (id) => API.delete(`/events/${id}`),
    like: (id) => API.post(`/events/${id}/like`),
    comment: (id, text) => API.post(`/events/${id}/comments`, { text }),
    getCalendar: (params) => API.get('/events/calendar', { params }),
    getMyEvents: () => API.get('/events/my'),
};

export const ticketsAPI = {
    book: (data) => API.post('/tickets/book', data),
    getMyTickets: () => API.get('/tickets/my'),
    getOne: (id) => API.get(`/tickets/${id}`),
    cancel: (id) => API.delete(`/tickets/${id}`),
    submitPayment: (id, upiTransactionRef) => API.post(`/tickets/${id}/submit-payment`, { upiTransactionRef }),
    confirmPayment: (id) => API.post(`/tickets/${id}/confirm-payment`),
    rejectPayment: (id) => API.post(`/tickets/${id}/reject-payment`),
    getEventTickets: (eventId) => API.get(`/tickets/event/${eventId}`),
};

export const venuesAPI = {
    getAll: (params = {}) => API.get('/venues', { params }),
    getOne: (id) => API.get(`/venues/${id}`),
    create: (data) => API.post('/venues', data),
    update: (id, data) => API.put(`/venues/${id}`, data),
    delete: (id) => API.delete(`/venues/${id}`),
    addReview: (id, data) => API.post(`/venues/${id}/review`, data),
    like: (id) => API.post(`/venues/${id}/like`),
};

export const usersAPI = {
    getAll: (params = {}) => API.get('/users', { params }),
    getOne: (id) => API.get(`/users/${id}`),
};

export const checkinAPI = {
    scan: (data) => API.post('/checkin/scan', data),
    getStats: (eventId) => API.get(`/checkin/stats/${eventId}`),
};

export const networkAPI = {
    getSuggestions: () => API.get('/network/suggestions'),
    connect: (userId) => API.post(`/network/connect/${userId}`),
    accept: (userId) => API.post(`/network/accept/${userId}`),
    disconnect: (userId) => API.delete(`/network/disconnect/${userId}`),
    getConnections: () => API.get('/network/connections'),
    getEventAttendees: (eventId) => API.get(`/network/event/${eventId}`),
};

export const statsAPI = {
    get: () => API.get('/stats'),
};

export default API;
