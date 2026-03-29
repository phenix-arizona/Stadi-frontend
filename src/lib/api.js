import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('stadi_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('stadi_refresh');
        if (!refresh) throw new Error('No refresh token');
        const res = await axios.post('/api/auth/refresh', { refreshToken: refresh });
        const newToken = res.data.data.accessToken;
        localStorage.setItem('stadi_token', newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('stadi_token');
        localStorage.removeItem('stadi_refresh');
        window.location.href = '/';
      }
    }
    return Promise.reject(err.response?.data || err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────
export const auth = {
  register:   (phone) => api.post('/auth/register', { phone }),
  login:      (phone) => api.post('/auth/login', { phone }),
  verifyOtp:  (phone, otp, referralCode) => api.post('/auth/verify-otp', { phone, otp, referralCode }),
  refresh:    (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout:     () => api.post('/auth/logout'),
  me:         () => api.get('/auth/me'),
};

// ── Courses ───────────────────────────────────────────────────
export const courses = {
  list:            (params) => api.get('/courses', { params }),
  search:          (q, params) => api.get('/courses/search', { params: { q, ...params } }),
  recommendations: () => api.get('/courses/recommendations'),
  bySlug:          (slug) => api.get(`/courses/${slug}`),
  byId:            (id) => api.get(`/courses/by-id/${id}`),
  create:          (data) => api.post('/courses', data),
  update:          (id, data) => api.patch(`/courses/${id}`, data),
};

// ── Payments ──────────────────────────────────────────────────
export const payments = {
  initiate: (courseId, phone) => api.post('/payments/initiate', { courseId, phone }),
  poll:     (id) => api.get(`/payments/poll/${id}`),
  status:   (id) => api.get(`/payments/status/${id}`),
  history:  () => api.get('/payments/my'),
};

// ── Progress ──────────────────────────────────────────────────
export const progress = {
  mark:           (lessonId, data) => api.post(`/progress/${lessonId}`, data),
  byCourse:       (courseId) => api.get(`/progress/course/${courseId}`),
  continuelearning: () => api.get('/progress/continue'),
};

// ── Assessments ───────────────────────────────────────────────
export const assessments = {
  submit: (courseId, answers) => api.post(`/assessments/${courseId}`, { answers }),
  quiz:   (courseId, quizId, selectedAnswer) => api.post(`/assessments/${courseId}/quiz/${quizId}`, { selectedAnswer }),
  result: (courseId) => api.get(`/assessments/${courseId}`),
};

// ── Certificates ──────────────────────────────────────────────
export const certificates = {
  list:     () => api.get('/certificates/my'),
  verify:   (num) => api.get(`/certificates/verify/${num}`),
  generate: (courseId) => api.post(`/certificates/generate/${courseId}`),
  pollPdf:  (certId) => api.get(`/certificates/${certId}/pdf`),
};

// ── Bookmarks ─────────────────────────────────────────────────
export const bookmarks = {
  list:   () => api.get('/bookmarks'),
  add:    (courseId) => api.post(`/bookmarks/${courseId}`),
  remove: (courseId) => api.delete(`/bookmarks/${courseId}`),
};

// ── Streaks ───────────────────────────────────────────────────
export const streaks = {
  get: () => api.get('/streaks/my'),
};

// ── Referrals ─────────────────────────────────────────────────
export const referrals = {
  get: () => api.get('/referrals/my'),
};

// ── Notifications ─────────────────────────────────────────────
export const notifications = {
  list:    () => api.get('/notifications'),
  markRead:(id) => api.patch(`/notifications/${id}/read`),
  readAll: () => api.patch('/notifications/read-all'),
};

// ── User ──────────────────────────────────────────────────────
export const userAPI = {
  updateProfile: (data) => api.patch('/users/me', data),
  stats:         () => api.get('/users/stats'),
  enrollments:   () => api.get('/users/enrollments'),
};

// ── Payouts ───────────────────────────────────────────────────
export const payouts = {
  request:  (phone) => api.post('/payouts/request', { phone }),
  history:  () => api.get('/payouts/my'),
  earnings: () => api.get('/payouts/earnings'),
};

// ── Admin ─────────────────────────────────────────────────────
export const adminAPI = {
  stats:        () => api.get('/admin/stats'),
  users:        (params) => api.get('/admin/users', { params }),
  updateUser:   (id, data) => api.patch(`/admin/users/${id}`, data),
  courses:      (params) => api.get('/admin/courses', { params }),
  updateCourse: (id, data) => api.patch(`/admin/courses/${id}`, data),
  payments:     (params) => api.get('/admin/payments', { params }),
  refund:       (id, reason) => api.post(`/admin/payments/${id}/refund`, { reason }),
  payouts:      (params) => api.get('/admin/payouts', { params }),
  approvePayout:(id) => api.post(`/payouts/${id}/approve`),
  auditLog:     () => api.get('/admin/audit-log'),
};
