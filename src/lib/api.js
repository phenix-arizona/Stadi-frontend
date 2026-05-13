import axios from 'axios';

function resolveBaseURL() {
  const raw = import.meta.env.VITE_API_BASE_URL || '/api';
  try {
    const parsed = new URL(raw);
    return parsed.pathname;
  } catch {
    return raw;
  }
}

const BASE_URL = resolveBaseURL();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

const refreshClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

function syncPersistedAuthTokens(token, refreshToken) {
  try {
    const stored = JSON.parse(localStorage.getItem('stadi-auth') || '{}');
    if (!stored.state) return;
    stored.state.token = token;
    stored.state.refreshToken = refreshToken;
    localStorage.setItem('stadi-auth', JSON.stringify(stored));
  } catch {}
}

export async function requestTokenRefresh(refreshToken) {
  const res = await refreshClient.post('/auth/refresh', { refreshToken });
  return res.data;
}

const PUBLIC_ENDPOINTS = [
  '/auth/register', '/auth/login', '/auth/verify-otp',
  '/auth/refresh', '/auth/forgot-password', '/auth/reset-password',
];
const isPublic = (url = '') => PUBLIC_ENDPOINTS.some((p) => url.includes(p));
const PROTECTED_PATH_RE = /^\/(dashboard|admin|instructor|finance|hr|profile|settings|learn(\/|$))/;

api.interceptors.request.use((config) => {
  if (!isPublic(config.url)) {
    const token = localStorage.getItem('stadi_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

const doLogout = () => {
  localStorage.removeItem('stadi_token');
  localStorage.removeItem('stadi_refresh');
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
  if (PROTECTED_PATH_RE.test(window.location.pathname)) {
    window.location.href = '/login';
  }
};

api.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('stadi_refresh');
      if (!refresh) { doLogout(); return Promise.reject(err.response?.data || err); }
      try {
        if (!refreshPromise) {
          refreshPromise = requestTokenRefresh(refresh).finally(() => { refreshPromise = null; });
        }
        const refreshData = await refreshPromise;
        const { accessToken: newToken, refreshToken: newRefresh } = refreshData?.data ?? refreshData;
        if (!newToken) throw new Error('Token refresh response missing accessToken');
        localStorage.setItem('stadi_token', newToken);
        localStorage.setItem('stadi_refresh', newRefresh || refresh);
        syncPersistedAuthTokens(newToken, newRefresh || refresh);
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
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
  login:     (phone) => api.post('/auth/login', { phone }),
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
  // Feature 4: offline manifest for SW caching
  offlineManifest: (courseId) => api.get(`/courses/${courseId}/offline-manifest`),
};

// ── Payments ──────────────────────────────────────────────────
export const payments = {
  initiate:       (courseId, phone)           => api.post('/payments/initiate', { courseId, phone }),
  retry:          (paymentId)                 => api.post(`/payments/retry/${paymentId}`),
  poll:           (id)                        => api.get(`/payments/poll/${id}`),
  status:         (id)                        => api.get(`/payments/status/${id}`),
  history:        ()                          => api.get('/payments/my'),
  // Feature 3: module payments
  initiateModule: (courseId, moduleId, phone) => api.post('/payments/initiate-module', { courseId, moduleId, phone }),
  moduleAccess:   (courseId)                  => api.get(`/payments/module-access/${courseId}`),
};

// ── Progress ──────────────────────────────────────────────────
export const progress = {
  mark:           (lessonId, data) => api.post(`/progress/${lessonId}`, data),
  byCourse:       (courseId)       => api.get(`/progress/course/${courseId}`),
  continuelearning: ()             => api.get('/progress/continue'),
  // Feature 4: sync offline progress batch
  syncBatch:      (records)        => api.post('/progress/sync-batch', { records }),
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
  stats:          () => api.get('/admin/stats'),
  users:          (params) => api.get('/admin/users', { params }),
  updateUser:     (id, data) => api.patch(`/admin/users/${id}`, data),
  courses:        (params) => api.get('/admin/courses', { params }),
  updateCourse:   (id, data) => api.patch(`/admin/courses/${id}`, data),
  payments:       (params) => api.get('/admin/payments', { params }),
  refund:         (id, reason) => api.post(`/admin/payments/${id}/refund`, { reason }),
  payouts:        (params) => api.get('/admin/payouts', { params }),
  approvePayout:  (id) => api.post(`/payouts/${id}/approve`),
  auditLog:       () => api.get('/admin/audit-log'),
  setInstructor:  (data) => api.post('/admin/users/set-instructor', data),
  setFinance:     (id) => api.post(`/admin/users/${id}/set-finance`),
  setHR:          (id) => api.post(`/admin/users/${id}/set-hr`),
  // Feature 8: employer role
  setEmployer:    (id) => api.post(`/admin/users/${id}/set-employer`),
  // Feature 10: CRM dashboard
  crm:            () => api.get('/admin/crm'),
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
  summary:           () => api.get('/hr/summary'),
  staff:             (params) => api.get('/hr/staff', { params }),
  updateStaff:       (id, data) => api.patch(`/hr/staff/${id}`, data),
  addStaff:          (data) => api.post('/hr/staff', data),
  leave:             (params) => api.get('/hr/leave', { params }),
  approveLeave:      (id) => api.post(`/hr/leave/${id}/approve`),
  rejectLeave:       (id, reason) => api.post(`/hr/leave/${id}/reject`, { reason }),
  requestLeave:      (data) => api.post('/hr/leave/request', data),
  jobs:              () => api.get('/hr/jobs'),
  createJob:         (data) => api.post('/hr/jobs', data),
  updateJob:         (id, data) => api.patch(`/hr/jobs/${id}`, data),
  closeJob:          (id) => api.delete(`/hr/jobs/${id}`),
  applications:      (params) => api.get('/hr/applications', { params }),
  updateApplication: (id, data) => api.patch(`/hr/applications/${id}`, data),
};

// ── Careers (public) ──────────────────────────────────────────
export const careersAPI = {
  jobs:  (params) => api.get('/careers/jobs', { params }),
  job:   (id) => api.get(`/careers/jobs/${id}`),
  apply: (data) => api.post('/careers/apply', data),
};

// ── AI Chat ───────────────────────────────────────────────────
export const aiAPI = {
  // Feature 6: courseId optional — scopes AI to course content when provided
  chat: (messages, courseId) => api.post('/ai/chat', { messages, courseId }),
};

// ── Feature 1: Abandoned enrolment tracking ───────────────────
export const abandonedAPI = {
  track: (courseId, step, paymentId) =>
    api.post('/abandoned/track', { courseId, step, paymentId }),
};

// ── Feature 5: Assignments + Portfolio ───────────────────────
export const assignmentsAPI = {
  list:      (courseId)            => api.get(`/assignments/${courseId}`),
  submit:    (id, data)            => api.post(`/assignments/${id}/submit`, data),
  feedback:  (submissionId, data)  => api.patch(`/assignments/submissions/${submissionId}`, data),
  portfolio: (userId)              => api.get(`/assignments/portfolio/${userId}`),
  create:    (data)                => api.post('/assignments', data),
};

// ── Feature 7: Cohort groups ──────────────────────────────────
export const cohortsAPI = {
  my:          ()        => api.get('/cohorts/my'),
  leaderboard: (groupId) => api.get(`/cohorts/${groupId}/leaderboard`),
  members:     (groupId) => api.get(`/cohorts/${groupId}/members`),
};

// ── Feature 8: Job listings ───────────────────────────────────
export const jobsAPI = {
  list:           (params) => api.get('/jobs', { params }),
  get:            (id)     => api.get(`/jobs/${id}`),
  apply:          (id, data) => api.post(`/jobs/${id}/apply`, data),
  myApplications: ()       => api.get('/jobs/my/applications'),
  create:         (data)   => api.post('/jobs', data),
  updateApp:      (id, data) => api.patch(`/jobs/applications/${id}`, data),
};

// ── Feature 9: Learning Paths ─────────────────────────────────
export const pathsAPI = {
  list:   ()             => api.get('/paths'),
  get:    (slug)         => api.get(`/paths/${slug}`),
  enrol:  (slug, phone)  => api.post(`/paths/${slug}/enrol`, { phone }),
  create: (data)         => api.post('/paths', data),
};
