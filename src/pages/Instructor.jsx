import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BookOpen, TrendingUp, Users, DollarSign, Plus, Eye,
  Send, Upload, Clock, CheckCircle, ChevronRight,
  BarChart3, Award, Loader2, Globe, Video, Star,
  Trash2, Edit3, GripVertical, ChevronDown, ChevronUp,
  Check, X, AlertCircle, Film, HelpCircle, Save,
  ArrowLeft, Play, Layers, Settings, FileText
} from 'lucide-react';
import { instructorAPI } from '../lib/api';
import api from '../lib/api';
import { Skeleton, Badge, Button, Input, Modal, ProgressBar } from '../components/ui';
import useAuthStore from '../store/auth.store';
import useAppStore  from '../store/app.store';

const LANGS = [
  { code:'english',   label:'English',    flag:'🇬🇧' },
  { code:'swahili',   label:'Kiswahili',  flag:'🇰🇪' },
  { code:'dholuo',    label:'Dholuo',     flag:'🌍' },
  { code:'luhya',     label:'Luhya',      flag:'🌍' },
  { code:'kikuyu',    label:'Kikuyu',     flag:'🌍' },
  { code:'kalenjin',  label:'Kalenjin',   flag:'🌍' },
  { code:'kamba',     label:'Kamba',      flag:'🌍' },
  { code:'kisii',     label:'Kisii',      flag:'🌍' },
  { code:'meru',      label:'Meru',       flag:'🌍' },
  { code:'mijikenda', label:'Mijikenda',  flag:'🌍' },
  { code:'somali',    label:'Somali',     flag:'🌍' },
  { code:'maasai',    label:'Maa',        flag:'🌍' },
  { code:'turkana',   label:'Turkana',    flag:'🌍' },
  { code:'teso',      label:'Ateso',      flag:'🌍' },
  { code:'taita',     label:'Kidawida',   flag:'🌍' },
];

// ── Tiny inline components ────────────────────────────────────
function Section({ title, subtitle, action, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StatusPill({ status }) {
  const m = {
    published:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    in_review:   'bg-amber-50 text-amber-700 border-amber-200',
    draft:       'bg-gray-50 text-gray-600 border-gray-200',
    unpublished: 'bg-gray-50 text-gray-400 border-gray-200',
  };
  const l = { published:'✓ Published', in_review:'⏳ In Review', draft:'✏️ Draft', unpublished:'⏸ Unpublished' };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${m[status] || m.draft}`}>
      {l[status] || status}
    </span>
  );
}

// ════════════════════════════════════════════════════════════════
// COURSE BUILDER — main component
// ════════════════════════════════════════════════════════════════
function CourseBuilder({ courseId, onBack }) {
  const qc = useQueryClient();
  const { addToast } = useAppStore();
  const [activeSection, setActiveSection] = useState('modules'); // modules | quizzes | settings
  const [expandedMod, setExpandedMod] = useState(null);
  const [expandedLesson, setExpandedLesson] = useState(null);

  // Modal states
  const [addModModal,    setAddModModal]    = useState(false);
  const [editModModal,   setEditModModal]   = useState(null); // module object
  const [addLessonMod,   setAddLessonMod]   = useState(null); // moduleId
  const [editLessonData, setEditLessonData] = useState(null); // lesson object
  const [videoModal,     setVideoModal]     = useState(null); // lesson object
  const [addQuizModal,   setAddQuizModal]   = useState(false);
  const [editQuizData,   setEditQuizData]   = useState(null); // quiz object

  // Form states
  const [modForm,   setModForm]   = useState({ title: '', description: '' });
  const [lesForm,   setLesForm]   = useState({ title: '', durationSeconds: '', isPreview: false });
  const [quizForm,  setQuizForm]  = useState({ question: '', options: ['','','',''], correctAnswer: 0, explanation: '' });
  const [uploading, setUploading] = useState({});  // { lessonId_lang: true }
  const fileRefs   = useRef({});

  // Fetch full build data
  const { data: buildRes, isLoading } = useQuery({
    queryKey: ['course-build', courseId],
    queryFn:  () => instructorAPI.buildData(courseId),
  });
  const course  = buildRes?.data;
  const modules = course?.modules || [];
  const quizzes = course?.quizzes || [];

  // Mutations
  const mut = (fn, msg) => useMutation({ mutationFn: fn, onSuccess: () => { qc.invalidateQueries(['course-build', courseId]); if(msg) addToast(msg, 'success'); }, onError: (e) => addToast(e?.message || 'Failed', 'error') });

  const createMod    = useMutation({ mutationFn: (d) => instructorAPI.createModule(courseId, d), onSuccess: () => { qc.invalidateQueries(['course-build',courseId]); addToast('Module added ✓', 'success'); setAddModModal(false); setModForm({title:'',description:''}); }, onError:(e)=>addToast(e?.message||'Failed','error') });
  const updateMod    = useMutation({ mutationFn: ({id,...d}) => instructorAPI.updateModule(id, d), onSuccess: () => { qc.invalidateQueries(['course-build',courseId]); addToast('Module updated ✓', 'success'); setEditModModal(null); }, onError:(e)=>addToast(e?.message||'Failed','error') });
  const deleteMod    = useMutation({ mutationFn: (id) => instructorAPI.deleteModule(id), onSuccess: () => { qc.invalidateQueries(['course-build',courseId]); addToast('Module deleted', 'info'); }, onError:(e)=>addToast(e?.message||'Failed','error') });
  const createLesson = useMutation({ mutationFn: ({modId,...d}) => instructorAPI.createLesson(modId, d), onSuccess: () => { qc.invalidateQueries(['course-build',courseId]); addToast('Lesson added ✓', 'success'); setAddLessonMod(null); setLesForm({title:'',durationSeconds:'',isPreview:false}); }, onError:(e)=>addToast(e?.message||'Failed','error') });
  const updateLesson = useMutation({ mutationFn: ({id,...d}) => instructorAPI.updateLesson(id, d), onSuccess: () => { qc.invalidateQueries(['course-build',courseId]); addToast('Lesson updated ✓', 'success'); setEditLessonData(null); }, onError:(e)=>addToast(e?.message||'Failed','error') });
  const deleteLesson = useMutation({ mutationFn: (id) => instructorAPI.deleteLesson(id), onSuccess: () => { qc.invalidateQueries(['course-build',courseId]); addToast('Lesson deleted', 'info'); }, onError:(e)=>addToast(e?.message||'Failed','error') });
  const createQuiz   = useMutation({ mutationFn: (d) => instructorAPI.createQuiz(courseId, d), onSuccess: () => { qc.invalidateQueries(['course-build',courseId]); addToast('Question added ✓', 'success'); setAddQuizModal(false); setQuizForm({question:'',options:['','','',''],correctAnswer:0,explanation:''}); }, onError:(e)=>addToast(e?.message||'Failed','error') });
  const updateQuiz   = useMutation({ mutationFn: ({id,...d}) => instructorAPI.updateQuiz(id, d), onSuccess: () => { qc.invalidateQueries(['course-build',courseId]); addToast('Question updated ✓', 'success'); setEditQuizData(null); }, onError:(e)=>addToast(e?.message||'Failed','error') });
  const deleteQuiz   = useMutation({ mutationFn: (id) => instructorAPI.deleteQuiz(id), onSuccess: () => { qc.invalidateQueries(['course-build',courseId]); addToast('Question deleted', 'info'); }, onError:(e)=>addToast(e?.message||'Failed','error') });
  const submitCourse = useMutation({ mutationFn: () => instructorAPI.submitCourse(courseId), onSuccess: (r) => { qc.invalidateQueries(['course-build',courseId]); qc.invalidateQueries(['instructor-dashboard']); addToast(r?.data?.message || 'Submitted for review! ✓', 'success'); }, onError:(e)=>addToast(e?.message||'Validation failed','error') });

  // Cloudinary direct upload
  const uploadVideo = async (lessonId, language, file) => {
    const key = `${lessonId}_${language}`;
    setUploading(u => ({ ...u, [key]: 0 }));
    try {
      // Get signed upload params
      const sigRes = await instructorAPI.uploadSig({ folder: `stadi/videos/${courseId}` });
      const { signature, timestamp, cloudName, apiKey, folder } = sigRes.data;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', folder);
      formData.append('resource_type', 'video');

      // Upload via XMLHttpRequest to track progress
      const url = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploading(u => ({ ...u, [key]: Math.round((e.loaded/e.total)*100) }));
        };
        xhr.onload = () => {
          const res = JSON.parse(xhr.responseText);
          if (xhr.status === 200) resolve(res.secure_url);
          else reject(new Error(res.error?.message || 'Upload failed'));
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`);
        xhr.send(formData);
      });

      // Save video URL to lesson
      await instructorAPI.setVideo(lessonId, { language, videoUrl: url });
      qc.invalidateQueries(['course-build', courseId]);
      addToast(`${LANGS.find(l=>l.code===language)?.label} video uploaded ✓`, 'success');
    } catch (e) {
      addToast(e.message || 'Upload failed', 'error');
    } finally {
      setUploading(u => { const n={...u}; delete n[key]; return n; });
    }
  };

  // Completion status
  const totalLessons     = modules.reduce((s,m) => s + (m.lessons?.length||0), 0);
  const lessonsWithVideo = modules.reduce((s,m) =>
    s + (m.lessons||[]).filter(l => l.video_url_english || l.video_url_swahili).length, 0);
  const readyToSubmit = modules.length >= 1 && totalLessons >= 1 && quizzes.length >= 3 && lessonsWithVideo > 0;

  if (isLoading) return (
    <div className="space-y-3 p-6">
      {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
    </div>
  );
  if (!course) return <div className="p-6 text-stadi-gray text-sm">Course not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Builder header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors shrink-0">
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-gray-900 truncate">{course.title}</h1>
                <StatusPill status={course.status} />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {modules.length} modules · {totalLessons} lessons · {quizzes.length} questions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {course.status === 'draft' && (
              <Button variant="primary" size="sm"
                disabled={!readyToSubmit} loading={submitCourse.isPending}
                onClick={() => submitCourse.mutate()}
                title={!readyToSubmit ? 'Add modules, lessons, videos, and 3+ quiz questions first' : ''}>
                <Send size={14} /> Submit for Review
              </Button>
            )}
            {course.status === 'published' && (
              <Link to={`/courses/${course.slug}`} target="_blank">
                <Button variant="outline" size="sm"><Eye size={14} /> View Live</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Section tabs */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1 border-t border-gray-100">
          {[
            { id:'modules',  icon:Layers,     label:'Modules & Lessons' },
            { id:'quizzes',  icon:HelpCircle, label:'Quiz Questions' },
            { id:'settings', icon:Settings,   label:'Course Settings' },
          ].map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all
                ${activeSection===s.id ? 'border-stadi-green text-stadi-green' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
              <s.icon size={13}/>{s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">

        {/* Checklist */}
        {course.status === 'draft' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Completion Checklist</p>
            <div className="grid sm:grid-cols-4 gap-3">
              {[
                { done: modules.length >= 1,       label: `${modules.length} module${modules.length!==1?'s':''}`,   req:'At least 1 module' },
                { done: totalLessons >= 1,          label: `${totalLessons} lesson${totalLessons!==1?'s':''}`,       req:'At least 1 lesson' },
                { done: lessonsWithVideo > 0,       label: `${lessonsWithVideo}/${totalLessons} with video`,         req:'Upload at least 1 video' },
                { done: quizzes.length >= 3,        label: `${quizzes.length}/3+ questions`,                        req:'At least 3 quiz questions' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs
                  ${item.done ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0
                    ${item.done ? 'bg-emerald-500' : 'border-2 border-gray-300'}`}>
                    {item.done && <Check size={11} className="text-white" />}
                  </div>
                  <span className="font-medium">{item.done ? item.label : item.req}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ MODULES & LESSONS ══════════════════════════════════ */}
        {activeSection === 'modules' && (
          <div className="space-y-3">
            {modules.length === 0 && (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
                <Layers size={36} className="mx-auto mb-3 text-gray-300" />
                <h3 className="font-bold text-gray-700 mb-1">No modules yet</h3>
                <p className="text-sm text-gray-400 mb-4">Modules are chapters that group your lessons. Add your first module to start building.</p>
                <Button variant="primary" size="sm" onClick={() => setAddModModal(true)}><Plus size={14}/> Add First Module</Button>
              </div>
            )}

            {modules.map((mod, mi) => (
              <div key={mod.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Module header */}
                <div className="flex items-center gap-3 px-5 py-3.5 bg-gray-50/80 border-b border-gray-100">
                  <GripVertical size={16} className="text-gray-300 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stadi-green uppercase tracking-wider">Module {mi+1}</span>
                      <span className="font-semibold text-gray-900 text-sm">{mod.title}</span>
                    </div>
                    {mod.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{mod.description}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                      {(mod.lessons||[]).length} lesson{(mod.lessons||[]).length!==1?'s':''}
                    </span>
                    <button onClick={() => setEditModModal(mod)}
                      className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-gray-400 hover:text-gray-700 transition-all">
                      <Edit3 size={13}/>
                    </button>
                    <button onClick={() => { if(window.confirm(`Delete module "${mod.title}" and all its lessons?`)) deleteMod.mutate(mod.id); }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all">
                      <Trash2 size={13}/>
                    </button>
                    <button onClick={() => setExpandedMod(expandedMod===mod.id ? null : mod.id)}
                      className="p-1.5 rounded-lg hover:bg-white text-gray-400 transition-all">
                      {expandedMod===mod.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                    </button>
                  </div>
                </div>

                {/* Lessons */}
                {(expandedMod === mod.id || modules.length <= 3) && (
                  <div>
                    {(mod.lessons||[]).length === 0 ? (
                      <div className="px-5 py-6 text-center">
                        <p className="text-sm text-gray-400 mb-3">No lessons in this module yet</p>
                        <Button variant="outline" size="sm" onClick={() => setAddLessonMod(mod.id)}><Plus size={12}/> Add Lesson</Button>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {(mod.lessons||[]).map((lesson, li) => {
                          const videoCount = LANGS.filter(l => lesson[`video_url_${l.code}`]).length;
                          return (
                            <div key={lesson.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                              <GripVertical size={14} className="text-gray-200 shrink-0" />
                              <div className="flex items-center justify-center w-6 h-6 bg-stadi-green-light text-stadi-green rounded-full text-xs font-bold shrink-0">
                                {li+1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 text-sm truncate">{lesson.title}</span>
                                  {lesson.is_preview && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">Preview</span>}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5">
                                  {lesson.duration_seconds > 0 && (
                                    <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock size={9}/>{Math.round(lesson.duration_seconds/60)}min</span>
                                  )}
                                  <span className={`text-[10px] flex items-center gap-1 ${videoCount > 0 ? 'text-emerald-600' : 'text-amber-500'}`}>
                                    <Film size={9}/>{videoCount > 0 ? `${videoCount} video${videoCount>1?'s':''}` : 'No video yet'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button onClick={() => setVideoModal(lesson)}
                                  className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all
                                    ${videoCount > 0 ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' : 'text-stadi-orange bg-stadi-orange-light hover:bg-stadi-orange/20'}`}>
                                  <Upload size={11}/>{videoCount > 0 ? 'Manage Videos' : 'Upload Video'}
                                </button>
                                <button onClick={() => { setEditLessonData(lesson); setLesForm({ title: lesson.title, durationSeconds: lesson.duration_seconds||'', isPreview: lesson.is_preview }); }}
                                  className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-gray-400 hover:text-gray-700 transition-all">
                                  <Edit3 size={13}/>
                                </button>
                                <button onClick={() => { if(window.confirm(`Delete lesson "${lesson.title}"?`)) deleteLesson.mutate(lesson.id); }}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all">
                                  <Trash2 size={13}/>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100">
                      <button onClick={() => setAddLessonMod(mod.id)}
                        className="flex items-center gap-1.5 text-xs text-stadi-green font-medium hover:underline">
                        <Plus size={13}/> Add lesson to this module
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {modules.length > 0 && (
              <button onClick={() => setAddModModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-stadi-green hover:text-stadi-green text-sm font-medium transition-all">
                <Plus size={16}/> Add Another Module
              </button>
            )}
          </div>
        )}

        {/* ══ QUIZZES ════════════════════════════════════════════ */}
        {activeSection === 'quizzes' && (
          <div className="space-y-3">
            <div className="bg-stadi-orange-light rounded-2xl border border-stadi-orange/20 p-4 flex items-start gap-3">
              <HelpCircle size={18} className="text-stadi-orange shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Assessment Quiz Requirements</p>
                <p className="text-xs text-gray-600 mt-0.5">Add <strong>at least 3 questions</strong> (we recommend 5–10). Learners need 75% to pass and earn their certificate. Questions are multiple choice with 4 options.</p>
              </div>
            </div>

            {quizzes.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
                <HelpCircle size={36} className="mx-auto mb-3 text-gray-300" />
                <h3 className="font-bold text-gray-700 mb-1">No questions yet</h3>
                <p className="text-sm text-gray-400 mb-4">Add multiple-choice questions to test what learners have learned.</p>
                <Button variant="primary" size="sm" onClick={() => setAddQuizModal(true)}><Plus size={14}/> Add First Question</Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {quizzes.map((q, qi) => (
                    <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-7 h-7 bg-stadi-green-light text-stadi-green rounded-xl flex items-center justify-center text-sm font-bold shrink-0">
                            {qi+1}
                          </div>
                          <p className="font-semibold text-gray-900 text-sm leading-snug">{q.question}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => { setEditQuizData(q); setQuizForm({ question: q.question, options: [...(q.options||['','','','']), '', '', ''].slice(0,4), correctAnswer: q.correct_answer, explanation: q.explanation||'' }); }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all">
                            <Edit3 size={13}/>
                          </button>
                          <button onClick={() => { if(window.confirm('Delete this question?')) deleteQuiz.mutate(q.id); }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2 ml-10">
                        {(q.options||[]).map((opt, oi) => (
                          <div key={oi} className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border
                            ${oi === q.correct_answer ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium' : 'bg-gray-50 border-gray-100 text-gray-600'}`}>
                            <span className="font-bold">{['A','B','C','D'][oi]}.</span>{opt}
                            {oi === q.correct_answer && <Check size={11} className="ml-auto shrink-0"/>}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="ml-10 mt-2 text-xs text-gray-400 italic">💡 {q.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={() => setAddQuizModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-stadi-green hover:text-stadi-green text-sm font-medium transition-all">
                  <Plus size={16}/> Add Another Question
                </button>
              </>
            )}
          </div>
        )}

        {/* ══ SETTINGS ═══════════════════════════════════════════ */}
        {activeSection === 'settings' && (
          <CourseSettings course={course} courseId={courseId} />
        )}
      </div>

      {/* ════ MODALS ════════════════════════════════════════════ */}

      {/* Add/Edit Module */}
      <Modal isOpen={addModModal || !!editModModal}
        onClose={() => { setAddModModal(false); setEditModModal(null); setModForm({title:'',description:''}); }}
        title={editModModal ? 'Edit Module' : 'Add Module'} size="sm">
        <div className="p-6 space-y-4">
          <Input label="Module title *" value={editModModal ? editModModal.title : modForm.title}
            onChange={e => editModModal ? setEditModModal({...editModModal, title: e.target.value}) : setModForm(f=>({...f,title:e.target.value}))}
            placeholder="e.g. Solar Basics & Safety" autoFocus />
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Description (optional)</label>
            <textarea rows={2} value={editModModal ? (editModModal.description||'') : modForm.description}
              onChange={e => editModModal ? setEditModModal({...editModModal, description: e.target.value}) : setModForm(f=>({...f,description:e.target.value}))}
              placeholder="What will learners cover in this module?"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green resize-none" />
          </div>
          <div className="flex gap-3">
            <Button variant="primary" className="flex-1"
              loading={createMod.isPending || updateMod.isPending}
              disabled={!(editModModal ? editModModal.title : modForm.title).trim()}
              onClick={() => editModModal ? updateMod.mutate({ id: editModModal.id, title: editModModal.title, description: editModModal.description }) : createMod.mutate(modForm)}>
              {editModModal ? 'Save Changes' : 'Add Module'}
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => { setAddModModal(false); setEditModModal(null); setModForm({title:'',description:''}); }}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Lesson */}
      <Modal isOpen={!!addLessonMod || !!editLessonData}
        onClose={() => { setAddLessonMod(null); setEditLessonData(null); setLesForm({title:'',durationSeconds:'',isPreview:false}); }}
        title={editLessonData ? 'Edit Lesson' : 'Add Lesson'} size="sm">
        <div className="p-6 space-y-4">
          <Input label="Lesson title *" value={lesForm.title}
            onChange={e => setLesForm(f=>({...f,title:e.target.value}))}
            placeholder="e.g. How Solar Panels Work" autoFocus />
          <Input label="Duration (seconds)" type="number" value={lesForm.durationSeconds}
            onChange={e => setLesForm(f=>({...f,durationSeconds:e.target.value}))}
            placeholder="e.g. 480 (= 8 minutes)" />
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div onClick={() => setLesForm(f=>({...f,isPreview:!f.isPreview}))}
              className={`w-10 h-6 rounded-full flex items-center transition-all ${lesForm.isPreview ? 'bg-stadi-green' : 'bg-gray-200'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-all ml-1 ${lesForm.isPreview ? 'translate-x-4' : ''}`} />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Free preview lesson</div>
              <div className="text-xs text-gray-400">Non-enrolled users can watch this lesson for free</div>
            </div>
          </label>
          <div className="flex gap-3">
            <Button variant="primary" className="flex-1"
              loading={createLesson.isPending || updateLesson.isPending}
              disabled={!lesForm.title.trim()}
              onClick={() => editLessonData
                ? updateLesson.mutate({ id: editLessonData.id, title: lesForm.title, duration_seconds: parseInt(lesForm.durationSeconds)||0, is_preview: lesForm.isPreview })
                : createLesson.mutate({ modId: addLessonMod, title: lesForm.title, durationSeconds: parseInt(lesForm.durationSeconds)||0, isPreview: lesForm.isPreview })
              }>
              {editLessonData ? 'Save Changes' : 'Add Lesson'}
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => { setAddLessonMod(null); setEditLessonData(null); setLesForm({title:'',durationSeconds:'',isPreview:false}); }}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Video Upload Modal */}
      <Modal isOpen={!!videoModal} onClose={() => setVideoModal(null)}
        title={`Videos — ${videoModal?.title}`} size="lg">
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-5">
            Upload one video per language. Learners will see the video in their selected language.
            <strong className="text-gray-700"> English and Swahili are required</strong> — other languages are optional.
          </p>
          <div className="space-y-2">
            {LANGS.map(lang => {
              const videoUrl = videoModal?.[`video_url_${lang.code}`];
              const uploadKey = `${videoModal?.id}_${lang.code}`;
              const progress  = uploading[uploadKey];
              const isRequired = ['english','swahili'].includes(lang.code);
              return (
                <div key={lang.code} className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all
                  ${videoUrl ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100'}`}>
                  <span className="text-base shrink-0">{lang.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{lang.label}</span>
                      {isRequired && <span className="text-[10px] bg-stadi-orange-light text-stadi-orange px-1.5 py-0.5 rounded font-medium">Required</span>}
                    </div>
                    {progress !== undefined ? (
                      <div className="mt-1.5">
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-stadi-green rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-[10px] text-stadi-green mt-0.5">Uploading {progress}%...</p>
                      </div>
                    ) : videoUrl ? (
                      <a href={videoUrl} target="_blank" rel="noreferrer"
                        className="text-[10px] text-emerald-600 hover:underline truncate block max-w-xs">
                        ✓ Video uploaded — click to preview
                      </a>
                    ) : (
                      <p className="text-[10px] text-gray-400">No video uploaded yet</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {videoUrl && (
                      <button onClick={() => instructorAPI.removeVideo(videoModal.id, lang.code).then(() => qc.invalidateQueries(['course-build',courseId]))}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all" title="Remove video">
                        <Trash2 size={13}/>
                      </button>
                    )}
                    <input type="file" accept="video/*" className="sr-only"
                      ref={el => fileRefs.current[`${videoModal?.id}_${lang.code}`] = el}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) uploadVideo(videoModal.id, lang.code, file);
                        e.target.value = '';
                      }} />
                    <button disabled={progress !== undefined}
                      onClick={() => fileRefs.current[`${videoModal?.id}_${lang.code}`]?.click()}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all
                        ${videoUrl ? 'text-gray-600 bg-white border border-gray-200 hover:border-stadi-green' : 'text-white bg-stadi-green hover:bg-opacity-90'}
                        disabled:opacity-50`}>
                      {progress !== undefined ? <Loader2 size={11} className="animate-spin"/> : <Upload size={11}/>}
                      {videoUrl ? 'Replace' : 'Upload'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">Accepted formats: MP4, MOV, AVI, WebM · Max size: 500MB per file · Recommended: MP4 H.264, 720p or 1080p</p>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Quiz Question */}
      <Modal isOpen={addQuizModal || !!editQuizData}
        onClose={() => { setAddQuizModal(false); setEditQuizData(null); setQuizForm({question:'',options:['','','',''],correctAnswer:0,explanation:''}); }}
        title={editQuizData ? 'Edit Question' : 'Add Quiz Question'} size="md">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Question *</label>
            <textarea rows={2} value={quizForm.question}
              onChange={e => setQuizForm(f=>({...f,question:e.target.value}))}
              placeholder="e.g. What tool is used to measure solar panel output voltage?"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green resize-none"
              autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Answer Options * <span className="text-xs text-gray-400 font-normal">— click a radio to mark as correct</span>
            </label>
            <div className="space-y-2">
              {quizForm.options.map((opt, oi) => (
                <div key={oi} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all
                  ${quizForm.correctAnswer === oi ? 'border-stadi-green bg-stadi-green-light' : 'border-gray-100 bg-gray-50'}`}>
                  <button type="button" onClick={() => setQuizForm(f=>({...f,correctAnswer:oi}))}
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                      ${quizForm.correctAnswer===oi ? 'border-stadi-green bg-stadi-green' : 'border-gray-300'}`}>
                    {quizForm.correctAnswer===oi && <div className="w-1.5 h-1.5 bg-white rounded-full"/>}
                  </button>
                  <span className="text-xs font-bold text-gray-500 w-4 shrink-0">{['A','B','C','D'][oi]}</span>
                  <input value={opt} onChange={e => setQuizForm(f=>{ const o=[...f.options]; o[oi]=e.target.value; return {...f,options:o}; })}
                    placeholder={`Option ${['A','B','C','D'][oi]}`}
                    className="flex-1 bg-transparent text-sm focus:outline-none text-gray-900 placeholder-gray-400" />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Click the circle next to the correct answer ↑</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Explanation (optional)</label>
            <input value={quizForm.explanation}
              onChange={e => setQuizForm(f=>({...f,explanation:e.target.value}))}
              placeholder="Brief explanation shown after the learner answers"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green" />
          </div>
          <div className="flex gap-3">
            <Button variant="primary" className="flex-1"
              loading={createQuiz.isPending || updateQuiz.isPending}
              disabled={!quizForm.question.trim() || quizForm.options.filter(o=>o.trim()).length < 2}
              onClick={() => editQuizData
                ? updateQuiz.mutate({ id: editQuizData.id, ...quizForm, correctAnswer: quizForm.correctAnswer, options: quizForm.options })
                : createQuiz.mutate(quizForm)
              }>
              {editQuizData ? 'Save Changes' : 'Add Question'}
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => { setAddQuizModal(false); setEditQuizData(null); setQuizForm({question:'',options:['','','',''],correctAnswer:0,explanation:''}); }}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Course settings panel ─────────────────────────────────────
function CourseSettings({ course, courseId }) {
  const qc = useQueryClient();
  const { addToast } = useAppStore();
  const [form, setForm] = useState({
    title:        course?.title        || '',
    description:  course?.description  || '',
    price_kes:    course?.price_kes    || '',
    difficulty:   course?.difficulty   || 'beginner',
    income_min:   course?.income_min_kes || '',
    income_max:   course?.income_max_kes || '',
    income_notes: course?.income_notes  || '',
    business_guide: course?.business_guide || '',
  });

  const save = useMutation({
    mutationFn: () => instructorAPI.updateCourse(courseId, {
      title:          form.title,
      description:    form.description,
      price_kes:      parseInt(form.price_kes) || 0,
      difficulty:     form.difficulty,
      income_min_kes: parseInt(form.income_min) || null,
      income_max_kes: parseInt(form.income_max) || null,
      income_notes:   form.income_notes,
      business_guide: form.business_guide,
    }),
    onSuccess: () => { qc.invalidateQueries(['course-build', courseId]); addToast('Course details saved ✓', 'success'); },
    onError:   (e) => addToast(e?.message || 'Save failed', 'error'),
  });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-gray-900">Course Details</h3>
        <Input label="Course Title" value={form.title} onChange={set('title')} />
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">Description</label>
          <textarea rows={4} value={form.description} onChange={set('description')}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {/* BUG FIX: same as new-course form — use a select so instructors
               can only pick the three canonical price points. */}
          <div><label className="block text-sm font-medium text-gray-900 mb-1.5">Price (KES)</label>
            <select value={form.price_kes} onChange={set('price_kes')} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green">
              <option value="0">Free</option>
              <option value="500">KES 500 · Starter</option>
              <option value="1000">KES 1,000 · Standard</option>
              <option value="2000">KES 2,000 · Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Difficulty</label>
            <select value={form.difficulty} onChange={set('difficulty')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
        {/* Pricing guide — shown to instructor while editing */}
        <p className="text-xs text-gray-400 -mt-2">
          Pricing guide: Starter KES 500 · Standard KES 1,000 · Advanced KES 2,000. Use 0 for a free course. {/* BUG FIX: matched to canonical tiers */}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-gray-900">Income Information</h3>
        <p className="text-xs text-gray-500">This is displayed on the course card and detail page — it helps learners see the earning potential.</p>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Min Monthly Earning (KES)" type="number" value={form.income_min} onChange={set('income_min')} placeholder="e.g. 15000" />
          <Input label="Max Monthly Earning (KES)" type="number" value={form.income_max} onChange={set('income_max')} placeholder="e.g. 40000" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">Income Notes</label>
          <textarea rows={2} value={form.income_notes} onChange={set('income_notes')}
            placeholder="e.g. Solar technicians in western Kenya earn KES 20,000–40,000/month..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">Business Guide</label>
          <textarea rows={3} value={form.business_guide} onChange={set('business_guide')}
            placeholder="How can learners turn this skill into a business? What's the first step?..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green resize-none" />
        </div>
      </div>

      <Button variant="primary" size="lg" loading={save.isPending} onClick={() => save.mutate()}>
        <Save size={16}/> Save Course Details
      </Button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// NEW COURSE FORM
// ════════════════════════════════════════════════════════════════
function NewCourseForm({ onSuccess }) {
  const { addToast } = useAppStore();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title:'', categoryId:'', priceKes:'', difficulty:'beginner',
    description:'', incomeMinKes:'', incomeMaxKes:'', languages:['english','swahili'],
  });
  const { data: catsRes } = useQuery({ queryKey:['categories'], queryFn:()=>api.get('/courses/categories') });
  const cats = catsRes?.data || [];
  const createCourse = useMutation({
    mutationFn: () => api.post('/courses', {
      title:form.title, categoryId:form.categoryId, description:form.description,
      priceKes:parseInt(form.priceKes)||0, difficulty:form.difficulty,
      languages:form.languages, incomeMinKes:parseInt(form.incomeMinKes)||null,
      incomeMaxKes:parseInt(form.incomeMaxKes)||null,
    }),
    onSuccess: (res) => { addToast('Course created! Now build your content.', 'success'); qc.invalidateQueries(['instructor-dashboard']); onSuccess?.(res.data); },
    onError: (e) => addToast(e?.message||'Failed to create course','error'),
  });
  const toggleLang = code => setForm(f => ({ ...f, languages: f.languages.includes(code) ? f.languages.filter(l=>l!==code) : [...f.languages,code] }));
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  // BUG FIX: original validation allowed any value >= 500 (e.g. 750, 1300).
  // CORRECT: Only canonical tiers are valid — 0, 500, 1000, 2000.
  const CANONICAL_PRICES = [0, 500, 1000, 2000];
  const priceNum = parseInt(form.priceKes, 10);
  const priceValid = !isNaN(priceNum) && CANONICAL_PRICES.includes(priceNum);
  const valid = form.title && form.categoryId && form.priceKes !== '' && priceValid && form.description;
  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div><h2 className="text-lg font-bold text-gray-900">Create a New Course</h2><p className="text-sm text-gray-500 mt-0.5">Fill in the basics. You'll add videos and lessons in the course builder.</p></div>
        <Input label="Course Title *" value={form.title} onChange={set('title')} placeholder="e.g. Solar Panel Installation & Repair" />
        <div><label className="block text-sm font-medium text-gray-900 mb-1.5">Category *</label>
          <select value={form.categoryId} onChange={set('categoryId')} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green">
            <option value="">Select a category</option>
            {cats.map(c=><option key={c.id} value={c.id}>{c.icon_emoji} {c.name}</option>)}
          </select></div>
        <div className="grid grid-cols-2 gap-4">
          {/* BUG FIX: replaced free-text number input with a select.
               A text box let instructors type arbitrary values (e.g. 750) that
               pass client validation but fail the DB CHECK constraint.
               A select enforces the three canonical tiers at the UI level. */}
          <div><label className="block text-sm font-medium text-gray-900 mb-1.5">Price (KES) *</label>
            <select value={form.priceKes} onChange={set('priceKes')} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green">
              <option value="">Select price</option>
              <option value="0">Free</option>
              <option value="500">KES 500 · Starter</option>
              <option value="1000">KES 1,000 · Standard</option>
              <option value="2000">KES 2,000 · Advanced</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium text-gray-900 mb-1.5">Difficulty</label>
            <select value={form.difficulty} onChange={set('difficulty')} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green">
              <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
            </select></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-900 mb-1.5">Description *</label>
          <textarea value={form.description} onChange={set('description')} rows={3} placeholder="What will learners be able to do after completing this course?"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green resize-none" /></div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Min Monthly Earning (KES)" type="number" value={form.incomeMinKes} onChange={set('incomeMinKes')} placeholder="15000" />
          <Input label="Max Monthly Earning (KES)" type="number" value={form.incomeMaxKes} onChange={set('incomeMaxKes')} placeholder="40000" />
        </div>
        <div><label className="block text-sm font-medium text-gray-900 mb-2">Course Languages</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {LANGS.map(l=>(
              <button key={l.code} type="button" onClick={()=>toggleLang(l.code)}
                className={`px-2.5 py-1.5 text-xs rounded-lg border-2 font-medium transition-all
                  ${form.languages.includes(l.code)?'border-stadi-green bg-stadi-green-light text-stadi-green':'border-gray-200 text-gray-500 hover:border-stadi-green/40'}`}>
                {l.label}
              </button>
            ))}
          </div></div>
        <Button variant="primary" className="w-full" size="lg" loading={createCourse.isPending} disabled={!valid} onClick={()=>createCourse.mutate()}>
          Create Course — Go to Builder
        </Button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN INSTRUCTOR PAGE
// ════════════════════════════════════════════════════════════════
const TABS = [
  { id:'dashboard',icon:BarChart3,label:'Dashboard' },
  { id:'courses',  icon:BookOpen, label:'My Courses' },
  { id:'earnings', icon:TrendingUp,label:'Earnings'  },
  { id:'new',      icon:Plus,     label:'New Course' },
];

export default function InstructorPage() {
  const { user }      = useAuthStore();
  const { addToast }  = useAppStore();
  const qc            = useQueryClient();
  const [tab,      setTab]      = useState('dashboard');
  const [builderCourse, setBuilderCourse] = useState(null); // courseId when in builder mode

  const { data: dashRes, isLoading } = useQuery({
    queryKey: ['instructor-dashboard'],
    queryFn:  () => instructorAPI.dashboard(),
  });
  const { data: earningsRes } = useQuery({
    queryKey: ['instructor-earnings'],
    queryFn:  () => instructorAPI.earnings(),
    enabled:  tab === 'earnings',
  });

  const submitCourse = useMutation({
    mutationFn: (id) => instructorAPI.submitCourse(id),
    onSuccess:  () => { qc.invalidateQueries(['instructor-dashboard']); addToast('Submitted for review! ⏳', 'success'); },
    onError:    (e) => addToast(e?.message || 'Validation failed — open the builder to complete your course', 'error'),
  });
  const requestPayout = useMutation({
    mutationFn: () => api.post('/payouts/request', { phone: user?.phone }),
    onSuccess:  () => addToast('Payout requested ✓ Admin will process within 24 hours', 'success'),
    onError:    (e) => addToast(e?.message || 'Payout request failed', 'error'),
  });

  const dash     = dashRes?.data   || {};
  const courses  = dash.courses    || [];
  const earnings = earningsRes?.data || [];
  const totalStudents = courses.reduce((s,c) => s+(c.enrolment_count||0), 0);
  const avgRating     = courses.length ? (courses.reduce((s,c)=>s+(parseFloat(c.avg_rating)||0),0)/courses.length).toFixed(1) : '—';

  // ── BUILDER MODE ─────────────────────────────────────────────
  if (builderCourse) {
    return <CourseBuilder courseId={builderCourse} onBack={() => setBuilderCourse(null)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-5">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Instructor Portal</h1>
              <p className="text-sm text-gray-500 mt-0.5">Welcome back, {user?.name?.split(' ')[0] || 'Instructor'} 👋</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setTab('new')}><Plus size={14}/> New Course</Button>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all
                  ${tab===t.id?'border-stadi-green text-stadi-green':'border-transparent text-gray-500 hover:text-stadi-green'}`}>
                <t.icon size={15}/>{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* DASHBOARD */}
        {tab==='dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {icon:BookOpen,  label:'Courses',        value:isLoading?null:courses.length,                color:'bg-blue-500'},
                {icon:Users,     label:'Total Students', value:isLoading?null:totalStudents.toLocaleString(),color:'bg-stadi-green'},
                {icon:DollarSign,label:'Total Earned',   value:isLoading?null:`KES ${(dash.totalEarned||0).toLocaleString()}`,color:'bg-stadi-orange'},
                {icon:Star,      label:'Avg Rating',     value:isLoading?null:avgRating,                    color:'bg-purple-500'},
              ].map(s=>(
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-3`}><s.icon size={18} className="text-white"/></div>
                  {isLoading?<Skeleton className="h-7 w-20 mb-1"/>:<div className="text-2xl font-bold text-gray-900">{s.value}</div>}
                  <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            {(dash.pendingPayout||0) > 0 && (
              <div className="bg-stadi-orange-light rounded-2xl border border-stadi-orange/20 p-5 flex items-center justify-between">
                <div><div className="font-bold text-gray-900">Payout Available</div><div className="text-sm text-gray-600 mt-0.5"><strong className="text-stadi-orange">KES {dash.pendingPayout?.toLocaleString()}</strong> ready via M-Pesa</div></div>
                <Button variant="secondary" size="sm" loading={requestPayout.isPending} onClick={()=>requestPayout.mutate()}>Request Payout</Button>
              </div>
            )}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Your Courses</h3>
                <button onClick={()=>setTab('courses')} className="text-sm text-stadi-green hover:underline flex items-center gap-1">View all<ChevronRight size={14}/></button>
              </div>
              {courses.length===0?(
                <div className="text-center py-12"><div className="text-4xl mb-3">📚</div><p className="text-gray-500 text-sm mb-4">No courses yet. Create your first course to start earning!</p><Button variant="primary" size="sm" onClick={()=>setTab('new')}><Plus size={14}/>Create First Course</Button></div>
              ):(
                <div className="divide-y divide-gray-50">
                  {courses.slice(0,5).map(c=>(
                    <div key={c.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 text-sm truncate">{c.title}</div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-400">{c.enrolment_count} students</span>
                          <span className="text-xs text-gray-400">{c.total_lessons||0} lessons</span>
                          {c.avg_rating>0&&<span className="text-xs text-yellow-500">★ {parseFloat(c.avg_rating).toFixed(1)}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        <StatusPill status={c.status}/>
                        <Button size="sm" variant="outline" onClick={()=>setBuilderCourse(c.id)}><Edit3 size={12}/>Build</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* COURSES */}
        {tab==='courses' && (
          <div className="space-y-4">
            {courses.length===0?(
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center"><div className="text-5xl mb-4">📚</div><h3 className="font-bold text-gray-900 mb-2">No courses yet</h3><p className="text-gray-500 text-sm mb-5">Create your first course to reach learners across Kenya.</p><Button variant="primary" onClick={()=>setTab('new')}><Plus size={14}/>Create First Course</Button></div>
            ):(
              <div className="grid sm:grid-cols-2 gap-4">
                {courses.map(c=>(
                  <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="h-24 bg-gradient-to-br from-stadi-green/10 to-stadi-orange/10 flex items-center justify-center overflow-hidden">
                      {c.thumbnail_url?<img src={c.thumbnail_url} className="w-full h-full object-cover" alt=""/>:<BookOpen size={32} className="text-stadi-green/30"/>}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-gray-900 text-sm line-clamp-2 flex-1">{c.title}</h3>
                        <StatusPill status={c.status}/>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                        <span className="flex items-center gap-1"><Users size={11}/>{c.enrolment_count} students</span>
                        <span className="flex items-center gap-1"><BookOpen size={11}/>{c.total_lessons||0} lessons</span>
                        {c.avg_rating>0&&<span className="text-yellow-500">★ {parseFloat(c.avg_rating).toFixed(1)}</span>}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="primary" onClick={()=>setBuilderCourse(c.id)}><Edit3 size={12}/> Open Builder</Button>
                        {c.status==='draft'&&<Button size="sm" variant="outline" loading={submitCourse.isPending} onClick={()=>submitCourse.mutate(c.id)}><Send size={12}/> Submit</Button>}
                        {c.status==='published'&&<Link to={`/courses/${c.slug}`}><Button size="sm" variant="ghost"><Eye size={12}/> View</Button></Link>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EARNINGS */}
        {tab==='earnings' && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center"><div className="text-2xl font-bold text-stadi-green">KES {(dash.totalEarned||0).toLocaleString()}</div><div className="text-sm text-gray-500 mt-1">Total Earned</div></div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center"><div className="text-2xl font-bold text-stadi-orange">KES {(dash.pendingPayout||0).toLocaleString()}</div><div className="text-sm text-gray-500 mt-1">Pending Payout</div></div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center"><div className="text-2xl font-bold text-gray-900">{totalStudents.toLocaleString()}</div><div className="text-sm text-gray-500 mt-1">Total Students</div></div>
            </div>
            {(dash.totalEarned||0)>0&&(
              <div className="bg-stadi-green-light rounded-2xl border border-stadi-green/20 p-5 flex items-center justify-between">
                <div><div className="font-bold text-gray-900">Ready to withdraw</div><div className="text-sm text-gray-600 mt-0.5">Minimum KES 1,000 · M-Pesa to {user?.phone}</div></div>
                <Button variant="primary" loading={requestPayout.isPending} disabled={(dash.totalEarned||0)<1000} onClick={()=>requestPayout.mutate()}>Request Payout</Button>
              </div>
            )}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-900 text-sm">Per-Course Earnings</h3></div>
              {courses.filter(c=>c.status==='published').length===0?(
                <div className="text-center py-10 text-gray-400 text-sm">No published courses yet</div>
              ):(
                <div className="divide-y divide-gray-50">
                  {courses.filter(c=>c.status==='published').map(c=>{
                    const ce = earnings.filter(e=>e.course_id===c.id);
                    const tot = ce.reduce((s,e)=>s+(e.net_amount||0),0);
                    return (
                      <div key={c.id} className="flex items-center justify-between px-5 py-3">
                        <div className="min-w-0"><div className="font-medium text-gray-900 text-sm truncate">{c.title}</div><div className="text-xs text-gray-400">{c.enrolment_count} enrolments</div></div>
                        <div className="text-right ml-4"><div className="font-bold text-stadi-green">KES {tot.toLocaleString()}</div><div className="text-xs text-gray-400">earned</div></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Revenue Share</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2"><CheckCircle size={14} className="text-stadi-green mt-0.5 shrink-0"/>You earn <strong>40%</strong> of every sale · Stadi keeps 60% {/* BUG FIX: was 70/30 — backend credits 40/60 (mpesa.service.js INSTRUCTOR_SHARE_PCT=40) */}</div>
                <div className="flex items-start gap-2"><CheckCircle size={14} className="text-stadi-green mt-0.5 shrink-0"/>Payments processed within <strong>7 days</strong> of month-end</div>
                <div className="flex items-start gap-2"><CheckCircle size={14} className="text-stadi-green mt-0.5 shrink-0"/>Minimum payout <strong>KES 1,000</strong> via M-Pesa B2C</div>
              </div>
            </div>
          </div>
        )}

        {/* NEW COURSE */}
        {tab==='new' && (
          <NewCourseForm onSuccess={(course) => { setBuilderCourse(course?.id); }} />
        )}
      </div>
    </div>
  );
}
