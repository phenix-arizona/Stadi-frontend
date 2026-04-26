import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Endpoints that must never receive an Authorization header.
// Sending a stale token to these causes a 401 → refresh → 401 death loop.
const PUBLIC_ENDPOINTS = [
  '/auth/register', '/auth/login', '/auth/verify-otp',
  '/auth/refresh',  '/auth/forgot-password', '/auth/reset-password',
];
const isPublic = (url = '') => PUBLIC_ENDPOINTS.some((p) => url.includes(p));

// Routes where being logged-out actually matters. A 401 from a public
// page must NOT redirect the user away.
const PROTECTED_PATH_RE = /^\/(dashboard|admin|instructor|finance|hr|profile|settings|learn(\/|$))/;

// Attach token on every request
api.interceptors.request.use((config) => {
  if (!isPublic(config.url)) {
    const token = localStorage.getItem('stadi_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Shared refresh promise — all concurrent 401s wait on the SAME refresh call
// instead of each firing their own, which caused the request stampede
let refreshPromise = null;

const doLogout = () => {
  localStorage.removeItem('stadi_token');
  localStorage.removeItem('stadi_refresh');
  // ✅ Clear the Zustand persist store too, not just localStorage
  try {
    const stored = JSON.parse(localStorage.getItem('stadi-auth') || '{}');
    stored.state = {
      ...stored.state,
      user: null, token: null, refreshToken: null,
      isLoggedIn: false, isAdmin: false,
      isInstructor: false, isFinance: false, isHR: false,
    };
    localStorage.setItem('stadi-auth', JSON.stringify(stored));
  } catch {}
  window.location.href = '/';
};

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    const original = err.config;

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refresh = localStorage.getItem('stadi_refresh');

      // ✅ No refresh token at all — log out immediately, don't even try
      if (!refresh) {
        doLogout();
        return Promise.reject(err.response?.data || err);
      }

      try {
        // ✅ Reuse an in-flight refresh instead of firing a new one
        if (!refreshPromise) {
          refreshPromise = axios
            .post('/api/auth/refresh', { refreshToken: refresh })
            .finally(() => { refreshPromise = null; }); // ✅ always release
        }

        const res = await refreshPromise;
        const newToken = res.data.data.accessToken;
        localStorage.setItem('stadi_token', newToken);

        // ✅ Also update the Zustand persisted token
        try {
          const stored = JSON.parse(localStorage.getItem('stadi-auth') || '{}');
          if (stored.state) {
            stored.state.token = newToken;
            localStorage.setItem('stadi-auth', JSON.stringify(stored));
          }
        } catch {}

        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        // ✅ Refresh failed — full logout, stop the loop
        doLogout();
        return Promise.reject(err.response?.data || err);
      }
    }

    return Promise.reject(err.response?.data || err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────
export const auth = {
  register:  (phone) => api.post('/auth/register', { phone }),
  login:     (phone) => api.post('/auth/register', { phone }),  // FIX: was /auth/login — blocked new users
  verifyOtp: (phone, otp, referralCode) => api.post('/auth/verify-otp', { phone, otp, referralCode }),
  refresh:   (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout:    () => api.post('/auth/logout'),
  me:        () => api.get('/auth/me'),
};

// ── Courses ───────────────────────────────────────────────────
export const courses = {
  list:            (params) => api.get('/courses', { params }),
  search:          (q, params) => api.get('/courses/search', { params: { q, ...params } }),
  recommendations: () => api.get('/courses/recommendations'),
  bySlug:          (slug) => api.get(`/courses/${slug}`),
  byId:            (id) => api.get(`/courses/by-id/${id}`),
  categories:      () => api.get('/courses/categories'),
  create:          (data) => api.post('/courses', data),
  update:          (id, data) => api.patch(`/courses/${id}`, data),
};

// ── Payments ──────────────────────────────────────────────────
export const payments = {
  initiate: (courseId, phone) => api.post('/payments/initiate', { courseId, phone }),
  retry:    (paymentId)       => api.post(`/payments/retry/${paymentId}`),
  poll:     (id)              => api.get(`/payments/poll/${id}`),
  status:   (id)              => api.get(`/payments/status/${id}`),
  history:  ()                => api.get('/payments/my'),
};

// ── Progress ──────────────────────────────────────────────────
export const progress = {
  mark:             (lessonId, data) => api.post(`/progress/${lessonId}`, data),
  byCourse:         (courseId) => api.get(`/progress/course/${courseId}`),
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
  list:     () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  readAll:  () => api.patch('/notifications/read-all'),
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
  stats:         () => api.get('/admin/stats'),
  users:         (params) => api.get('/admin/users', { params }),
  updateUser:    (id, data) => api.patch(`/admin/users/${id}`, data),
  courses:       (params) => api.get('/admin/courses', { params }),
  updateCourse:  (id, data) => api.patch(`/admin/courses/${id}`, data),
  payments:      (params) => api.get('/admin/payments', { params }),
  refund:        (id, reason) => api.post(`/admin/payments/${id}/refund`, { reason }),
  payouts:       (params) => api.get('/admin/payouts', { params }),
  approvePayout: (id) => api.post(`/payouts/${id}/approve`),
  auditLog:      () => api.get('/admin/audit-log'),
  setInstructor: (data) => api.post('/admin/users/set-instructor', data),
  setFinance:    (id) => api.post(`/admin/users/${id}/set-finance`),
  setHR:         (id) => api.post(`/admin/users/${id}/set-hr`),
};


// ── Instructor ────────────────────────────────────────────────
export const instructorAPI = {
  dashboard:      ()               => api.get('/instructor/dashboard'),
  buildData:      (courseId)       => api.get(`/instructor/courses/${courseId}/build`),
  updateCourse:   (courseId, data) => api.patch(`/instructor/courses/${courseId}`, data),
  submitCourse:   (courseId)       => api.post(`/instructor/courses/${courseId}/submit`),
  createModule:   (courseId, data) => api.post(`/instructor/courses/${courseId}/modules`, data),
  updateModule:   (modId, data)    => api.patch(`/instructor/modules/${modId}`, data),
  deleteModule:   (modId)          => api.delete(`/instructor/modules/${modId}`),
  reorderModules: (courseId, order)=> api.post(`/instructor/courses/${courseId}/modules/reorder`, { order }),
  createLesson:   (modId, data)    => api.post(`/instructor/modules/${modId}/lessons`, data),
  updateLesson:   (lessonId, data) => api.patch(`/instructor/lessons/${lessonId}`, data),
  deleteLesson:   (lessonId)       => api.delete(`/instructor/lessons/${lessonId}`),
  setVideo:       (lessonId, data) => api.patch(`/instructor/lessons/${lessonId}/video`, data),
  removeVideo:    (lessonId, lang) => api.delete(`/instructor/lessons/${lessonId}/video/${lang}`),
  getQuizzes:     (courseId)       => api.get(`/instructor/courses/${courseId}/quizzes`),
  createQuiz:     (courseId, data) => api.post(`/instructor/courses/${courseId}/quizzes`, data),
  updateQuiz:     (quizId, data)   => api.patch(`/instructor/quizzes/${quizId}`, data),
  deleteQuiz:     (quizId)         => api.delete(`/instructor/quizzes/${quizId}`),
  uploadSig:      (params)         => api.get('/instructor/upload-signature', { params }),
  earnings:       ()               => api.get('/payouts/earnings'),
  payouts:        ()               => api.get('/payouts/my'),
};

// ── Finance ───────────────────────────────────────────────────
export const financeAPI = {
  summary:         (period) => api.get('/finance/summary', { params: { period } }),
  revenueByMonth:  () => api.get('/finance/revenue-by-month'),
  revenueByCourse: () => api.get('/finance/revenue-by-course'),
  transactions:    (params) => api.get('/finance/transactions', { params }),
  payouts:         (params) => api.get('/finance/payouts', { params }),
  approvePayout:   (id) => api.post(`/finance/payouts/${id}/approve`),
  rejectPayout:    (id, reason) => api.post(`/finance/payouts/${id}/reject`, { reason }),
  records:         (params) => api.get('/finance/records', { params }),
  addRecord:       (data) => api.post('/finance/records', data),
  exportCsv:       (params) => api.get('/finance/export', { params, responseType: 'blob' }),
};

// ── HR ────────────────────────────────────────────────────────
export const hrAPI = {
  summary:          () => api.get('/hr/summary'),
  staff:            (params) => api.get('/hr/staff', { params }),
  updateStaff:      (id, data) => api.patch(`/hr/staff/${id}`, data),
  addStaff:         (data) => api.post('/hr/staff', data),
  leave:            (params) => api.get('/hr/leave', { params }),
  approveLeave:     (id) => api.post(`/hr/leave/${id}/approve`),
  rejectLeave:      (id, reason) => api.post(`/hr/leave/${id}/reject`, { reason }),
  requestLeave:     (data) => api.post('/hr/leave/request', data),
  jobs:             () => api.get('/hr/jobs'),
  createJob:        (data) => api.post('/hr/jobs', data),
  updateJob:        (id, data) => api.patch(`/hr/jobs/${id}`, data),
  closeJob:         (id) => api.delete(`/hr/jobs/${id}`),
  applications:     (params) => api.get('/hr/applications', { params }),
  updateApplication:(id, data) => api.patch(`/hr/applications/${id}`, data),
};

// ── Careers (public) ──────────────────────────────────────────
export const careersAPI = {
  jobs:  (params) => api.get('/careers/jobs', { params }),
  job:   (id) => api.get(`/careers/jobs/${id}`),
  apply: (data) => api.post('/careers/apply', data),
};

// ── AI Chat (public) ─────────────────────────────────────────
export const aiAPI = {
  chat: (messages) => api.post('/ai/chat', { messages }),
};
