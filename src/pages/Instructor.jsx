import React, { useState, useRef } from 'react';
import { Link }          from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Upload, Video, Trash2, ChevronDown, ChevronUp,
  Check, AlertCircle, Loader2, BookOpen, TrendingUp, Users, DollarSign
} from 'lucide-react';
import api from '../lib/api';
import { Button, Badge, Skeleton } from '../components/ui';

// ── API helpers ───────────────────────────────────────────────
const instructorAPI = {
  dashboard:      ()             => api.get('/instructor/dashboard'),
  buildCourse:    (courseId)     => api.get(`/instructor/courses/${courseId}/build`),
  createModule:   (courseId, d)  => api.post(`/instructor/courses/${courseId}/modules`, d),
  createLesson:   (moduleId, d)  => api.post(`/instructor/modules/${moduleId}/lessons`, d),
  updateLesson:   (lessonId, d)  => api.patch(`/instructor/lessons/${lessonId}`, d),
  setVideo:       (lessonId, d)  => api.patch(`/instructor/lessons/${lessonId}/video`, d),
  deleteLesson:   (lessonId)     => api.delete(`/instructor/lessons/${lessonId}`),
  deleteModule:   (moduleId)     => api.delete(`/instructor/modules/${moduleId}`),
  uploadSig:      (params)       => api.get('/instructor/upload-signature', { params }),
  submitCourse:   (courseId)     => api.post(`/instructor/courses/${courseId}/submit`),
  updateCourse:   (courseId, d)  => api.patch(`/instructor/courses/${courseId}`, d),
};

const LANGUAGES = [
  'english','swahili','dholuo','luhya','kikuyu',
  'kalenjin','kamba','kisii','meru','mijikenda',
];

// ── Upload video to Cloudinary ────────────────────────────────
async function uploadToCloudinary(file, lessonId, language, onProgress) {
  // 1. Get signed upload params from backend
  const { data: sig } = await instructorAPI.uploadSig({
    folder: `stadi/lessons/${lessonId}`,
  });

  // 2. Upload directly to Cloudinary
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', sig.cloudName ? sig.apiKey : sig.apiKey);
  formData.append('timestamp', sig.timestamp);
  formData.append('signature', sig.signature);
  formData.append('folder', sig.folder);
  formData.append('resource_type', 'video');

  const xhr = new XMLHttpRequest();
  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
  };

  return new Promise((resolve, reject) => {
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`);
    xhr.onload = () => {
      const result = JSON.parse(xhr.responseText);
      if (xhr.status === 200) resolve(result);
      else reject(new Error(result.error?.message || 'Upload failed'));
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}

// ══════════════════════════════════════════════════════════════
// MAIN INSTRUCTOR PORTAL
// ══════════════════════════════════════════════════════════════
export default function InstructorPortal() {
  const [selectedCourse, setSelectedCourse] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['instructor', 'dashboard'],
    queryFn:  instructorAPI.dashboard,
  });

  const dashboard = data?.data || {};
  const courses   = dashboard.courses || [];

  if (isLoading) return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i=><Skeleton key={i} className="h-24 rounded-xl"/>)}</div>
    </div>
  );

  if (selectedCourse) {
    return <CourseBuilder courseId={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stadi-dark" style={{ fontFamily: 'Playfair Display' }}>
            Instructor Portal
          </h1>
          <p className="text-stadi-gray text-sm mt-1">Manage your courses and earnings</p>
        </div>
        <Link to="/instructor/new">
          <Button variant="primary" size="sm"><Plus size={15} /> New Course</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: <BookOpen size={20} className="text-stadi-green" />,   label: 'Courses',      value: dashboard.totalCourses || 0 },
          { icon: <Users size={20} className="text-stadi-orange" />,     label: 'Total Learners', value: courses.reduce((s,c)=>s+(c.enrolment_count||0),0) },
          { icon: <TrendingUp size={20} className="text-stadi-green" />, label: 'Total Earned',  value: `KES ${(dashboard.totalEarned||0).toLocaleString()}` },
          { icon: <DollarSign size={20} className="text-stadi-orange" />,label: 'Pending Payout',value: `KES ${(dashboard.pendingPayout||0).toLocaleString()}` },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className="flex justify-center mb-2">{s.icon}</div>
            <div className="text-xl font-bold text-stadi-dark">{s.value}</div>
            <div className="text-xs text-stadi-gray">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Course list */}
      <h2 className="text-lg font-bold text-stadi-dark mb-4">My Courses</h2>
      {courses.length === 0 ? (
        <div className="text-center py-16 card">
          <div className="text-5xl mb-4">📚</div>
          <h3 className="font-bold text-stadi-dark mb-2">No courses yet</h3>
          <p className="text-stadi-gray text-sm mb-4">Create your first course and start earning!</p>
          <Button variant="primary" size="sm"><Plus size={15} /> Create Course</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map(course => (
            <div key={course.id} className="card p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-stadi-green-light rounded-xl flex items-center justify-center text-xl shrink-0">
                {course.thumbnail_url
                  ? <img src={course.thumbnail_url} className="w-full h-full rounded-xl object-cover" alt={course.title} />
                  : '📚'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-stadi-dark truncate">{course.title}</div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-stadi-gray">{course.total_lessons || 0} lessons</span>
                  <span className="text-xs text-stadi-gray">{course.enrolment_count || 0} learners</span>
                  {course.avg_rating > 0 && <span className="text-xs text-stadi-gray">⭐ {course.avg_rating?.toFixed(1)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant={
                  course.status === 'published' ? 'green' :
                  course.status === 'in_review' ? 'orange' : 'gray'
                }>
                  {course.status}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => setSelectedCourse(course.id)}>
                  Edit Content
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// COURSE BUILDER — modules, lessons, video upload
// ══════════════════════════════════════════════════════════════
function CourseBuilder({ courseId, onBack }) {
  const qc = useQueryClient();
  const [openModule, setOpenModule] = useState(null);
  const [submitMsg,  setSubmitMsg]  = useState('');
  const [submitErr,  setSubmitErr]  = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['instructor', 'course', courseId],
    queryFn:  () => instructorAPI.buildCourse(courseId),
  });

  const course  = data?.data || {};
  const modules = course.modules || [];

  const addModule = async () => {
    const title = prompt('Module title:');
    if (!title?.trim()) return;
    await instructorAPI.createModule(courseId, { title });
    refetch();
  };

  const addLesson = async (moduleId) => {
    const title = prompt('Lesson title:');
    if (!title?.trim()) return;
    await instructorAPI.createLesson(moduleId, { title });
    refetch();
  };

  const deleteModule = async (moduleId) => {
    if (!confirm('Delete this module and all its lessons?')) return;
    await instructorAPI.deleteModule(moduleId);
    refetch();
  };

  const deleteLesson = async (lessonId) => {
    if (!confirm('Delete this lesson?')) return;
    await instructorAPI.deleteLesson(lessonId);
    refetch();
  };

  const submitForReview = async () => {
    setSubmitMsg(''); setSubmitErr('');
    try {
      const res = await instructorAPI.submitCourse(courseId);
      setSubmitMsg(res.data.message);
      refetch();
    } catch (e) {
      setSubmitErr(e?.message || 'Submission failed');
    }
  };

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
      <Skeleton className="h-8 w-64" />
      {[1,2].map(i=><Skeleton key={i} className="h-32 rounded-xl"/>)}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-stadi-gray hover:text-stadi-dark text-sm">← Back</button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-stadi-dark">{course.title}</h1>
          <Badge variant={course.status === 'published' ? 'green' : course.status === 'in_review' ? 'orange' : 'gray'}>
            {course.status}
          </Badge>
        </div>
        {course.status === 'draft' && (
          <Button variant="primary" size="sm" onClick={submitForReview}>
            Submit for Review
          </Button>
        )}
      </div>

      {submitMsg && (
        <div className="mb-4 bg-stadi-green-light border border-stadi-green/30 rounded-xl p-4 text-stadi-green text-sm flex items-center gap-2">
          <Check size={16} /> {submitMsg}
        </div>
      )}
      {submitErr && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {submitErr}
        </div>
      )}

      {/* Modules */}
      <div className="space-y-4">
        {modules.map((mod, mi) => (
          <div key={mod.id} className="card overflow-hidden">
            {/* Module header */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-100">
              <button onClick={() => setOpenModule(openModule === mi ? null : mi)} className="flex-1 flex items-center gap-2 text-left">
                {openModule === mi ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span className="font-semibold text-stadi-dark">{mod.title}</span>
                <span className="text-xs text-stadi-gray">({mod.lessons?.length || 0} lessons)</span>
              </button>
              <button onClick={() => addLesson(mod.id)} className="text-xs text-stadi-green hover:underline flex items-center gap-1">
                <Plus size={12} /> Add Lesson
              </button>
              <button onClick={() => deleteModule(mod.id)} className="text-xs text-red-400 hover:text-red-600">
                <Trash2 size={14} />
              </button>
            </div>

            {/* Lessons */}
            {openModule === mi && (
              <div className="divide-y divide-gray-50">
                {(mod.lessons || []).length === 0 ? (
                  <div className="p-6 text-center text-stadi-gray text-sm">
                    No lessons yet. <button onClick={() => addLesson(mod.id)} className="text-stadi-green underline">Add one</button>
                  </div>
                ) : (
                  mod.lessons.map(lesson => (
                    <LessonRow
                      key={lesson.id}
                      lesson={lesson}
                      onDelete={() => deleteLesson(lesson.id)}
                      onRefetch={refetch}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add module */}
      <button
        onClick={addModule}
        className="mt-4 w-full border-2 border-dashed border-gray-200 rounded-xl py-4 text-stadi-gray hover:border-stadi-green hover:text-stadi-green transition-colors flex items-center justify-center gap-2 text-sm"
      >
        <Plus size={16} /> Add Module
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// LESSON ROW — with Cloudinary video upload
// ══════════════════════════════════════════════════════════════
function LessonRow({ lesson, onDelete, onRefetch }) {
  const [expanded,    setExpanded]    = useState(false);
  const [selLanguage, setSelLanguage] = useState('english');
  const [uploading,   setUploading]   = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [uploadMsg,   setUploadMsg]   = useState('');
  const [uploadErr,   setUploadErr]   = useState('');
  const fileRef = useRef();

  const hasVideo = (lang) => !!lesson[`video_url_${lang}`];

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('video/')) {
      setUploadErr('Please select a video file'); return;
    }
    if (file.size > 500 * 1024 * 1024) {
      setUploadErr('File too large — max 500MB'); return;
    }

    setUploading(true); setProgress(0);
    setUploadMsg(''); setUploadErr('');

    try {
      // Upload to Cloudinary
      setUploadMsg('Uploading to Cloudinary...');
      const result = await uploadToCloudinary(file, lesson.id, selLanguage, setProgress);

      // Save URL to lesson
      setUploadMsg('Saving video URL...');
      await instructorAPI.setVideo(lesson.id, {
        language:        selLanguage,
        videoUrl:        result.secure_url,
        durationSeconds: Math.round(result.duration || 0),
        thumbnailUrl:    result.secure_url.replace(/\.[^/.]+$/, '.jpg'),
      });

      setUploadMsg(`✅ ${selLanguage} video uploaded successfully!`);
      setProgress(100);
      onRefetch();
    } catch (err) {
      setUploadErr(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setExpanded(!expanded)} className="flex-1 flex items-center gap-2 text-left">
          <Video size={14} className="text-stadi-gray shrink-0" />
          <span className="text-sm font-medium text-stadi-dark">{lesson.title}</span>
          {/* Language indicators */}
          <div className="flex gap-1 ml-2">
            {LANGUAGES.slice(0, 5).map(lang => (
              <div key={lang} title={lang}
                className={`w-2 h-2 rounded-full ${hasVideo(lang) ? 'bg-stadi-green' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </button>
        <button onClick={onDelete} className="text-red-400 hover:text-red-600 shrink-0">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Expanded upload panel */}
      {expanded && (
        <div className="mt-4 bg-gray-50 rounded-xl p-4 space-y-4">

          {/* Language video status */}
          <div>
            <p className="text-xs font-semibold text-stadi-dark mb-2">Video status per language:</p>
            <div className="grid grid-cols-5 gap-2">
              {LANGUAGES.map(lang => (
                <div key={lang} className={`text-center p-2 rounded-lg text-xs border
                  ${hasVideo(lang) ? 'bg-stadi-green-light border-stadi-green/30 text-stadi-green' : 'bg-white border-gray-200 text-gray-400'}`}>
                  {hasVideo(lang) ? '✅' : '⬜'}<br />
                  <span className="capitalize">{lang.slice(0,3)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upload section */}
          <div>
            <p className="text-xs font-semibold text-stadi-dark mb-2">Upload video:</p>
            <div className="flex gap-2 mb-3">
              <select
                value={selLanguage}
                onChange={e => setSelLanguage(e.target.value)}
                className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-stadi-green"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>
                    {hasVideo(lang) ? '✅ ' : ''}{lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 bg-stadi-green text-white text-xs px-4 py-2 rounded-lg hover:bg-stadi-green/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                {uploading ? `${progress}%` : 'Choose Video'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Progress bar */}
            {uploading && (
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-stadi-green h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {uploadMsg && <p className="text-xs text-stadi-green">{uploadMsg}</p>}
            {uploadErr && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{uploadErr}</p>}
          </div>

          {/* Video preview */}
          {hasVideo(selLanguage) && (
            <div>
              <p className="text-xs font-semibold text-stadi-dark mb-2">Current {selLanguage} video:</p>
              <video
                src={lesson[`video_url_${selLanguage}`]}
                controls
                className="w-full rounded-lg max-h-48"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}