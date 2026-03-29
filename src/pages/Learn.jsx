import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, ChevronDown, ChevronUp, Check, Loader2 } from 'lucide-react';
import { progress as progressAPI, assessments, certificates } from '../lib/api';
import VideoPlayer from '../components/player/VideoPlayer';
import { ProgressBar, Button, Skeleton, EmptyState } from '../components/ui';
import useAppStore from '../store/app.store';
import api from '../lib/api';

export default function LearnPage() {
  const { courseId } = useParams();
  const qc = useQueryClient();
  const { addToast } = useAppStore();
  const [activeLesson, setActiveLesson] = useState(null);
  const [openModules, setOpenModules] = useState({});
  const [showAssessment, setShowAssessment] = useState(false);
  const [answers, setAnswers] = useState({});
  const [quizzes, setQuizzes] = useState([]);
  const [assResult, setAssResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [certPdfUrl, setCertPdfUrl] = useState(null);

  const { data: courseData, isLoading } = useQuery({
    queryKey: ['course-learn', courseId],
    queryFn: () => api.get(`/courses/learn/${courseId}`).then(r => r).catch(() => api.get(`/courses`).then(r => r)),
    retry: 1,
  });

  const { data: progressData, refetch: refetchProgress } = useQuery({
    queryKey: ['progress', courseId],
    queryFn: () => progressAPI.byCourse(courseId),
    refetchInterval: 20000,
  });

  const { data: assData } = useQuery({
    queryKey: ['assessment', courseId],
    queryFn: () => assessments.result(courseId),
  });

  const course = courseData?.data;
  const progressList = progressData?.data || [];
  const completedIds = new Set(progressList.filter(p => p.completed).map(p => p.lesson_id));
  const previousResult = assData?.data;
  const allLessons = course?.modules?.flatMap(m => (m.lessons || []).map(l => ({ ...l, moduleName: m.title }))) || [];
  const totalLessons = allLessons.length;
  const doneLessons = allLessons.filter(l => completedIds.has(l.id)).length;
  const progressPct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
  const allDone = totalLessons > 0 && doneLessons >= totalLessons;

  useEffect(() => {
    if (course?.modules?.length > 0 && !activeLesson) {
      setOpenModules({ [course.modules[0].id]: true });
      const incomplete = allLessons.find(l => !completedIds.has(l.id));
      setActiveLesson(incomplete || allLessons[0]);
    }
  }, [course?.id]);

  const handleLessonComplete = () => { qc.invalidateQueries(['progress', courseId]); refetchProgress(); };

  const loadQuizzes = async () => {
    try {
      const res = await api.get(`/assessments/${courseId}/questions`);
      setQuizzes(res.data?.data || []);
    } catch { setQuizzes([]); }
    setShowAssessment(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await assessments.submit(courseId, answers);
      setAssResult(res.data);
      if (res.data.passed) {
        addToast('🏆 You passed! Certificate generating...', 'success', 6000);
        qc.invalidateQueries(['assessment', courseId]);
        try {
          const certRes = await certificates.generate(courseId);
          if (certRes.data.pdfUrl) setCertPdfUrl(certRes.data.pdfUrl);
          else {
            let tries = 0;
            const poll = setInterval(async () => {
              tries++;
              const certList = await certificates.list();
              const cert = certList.data?.find(c => c.courses?.id === courseId);
              if (cert?.pdf_url) { setCertPdfUrl(cert.pdf_url); clearInterval(poll); }
              if (tries > 24) clearInterval(poll);
            }, 5000);
          }
        } catch {}
      }
    } catch (e) { addToast(e?.message || 'Submission failed', 'error'); }
    finally { setSubmitting(false); }
  };

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3"><Skeleton className="aspect-video rounded-2xl w-full" /></div>
      <div className="space-y-3">{[1,2,3].map(i=><Skeleton key={i} className="h-16 rounded-xl"/>)}</div>
    </div>
  );

  if (!course) return (
    <div className="max-w-5xl mx-auto px-4 py-20">
      <EmptyState emoji="🔒" title="Course not found or not enrolled"
        action={<Link to="/dashboard"><Button variant="primary">Go to Dashboard</Button></Link>}/>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link to="/dashboard" className="text-xs text-stadi-gray hover:text-stadi-green">← My Courses</Link>
          <h1 className="font-bold text-stadi-dark text-lg line-clamp-1 mt-0.5">{course.title}</h1>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-stadi-gray">{doneLessons}/{totalLessons} lessons</div>
          <div className="text-stadi-green font-bold text-lg">{progressPct}%</div>
        </div>
      </div>
      <ProgressBar value={progressPct} showPct={false} className="mb-5" />

      <div className="grid lg:grid-cols-4 gap-5">
        <div className="lg:col-span-3 space-y-4">
          <VideoPlayer
            lesson={activeLesson} course={course} allLessons={allLessons}
            completedIds={completedIds} onLessonComplete={handleLessonComplete}
            onNavigate={setActiveLesson}
          />

          {/* Assessment CTA */}
          {allDone && !showAssessment && (
            <div className="card p-5 border-l-4 border-stadi-orange bg-stadi-orange-light/20">
              <div className="flex items-start gap-4">
                <span className="text-4xl">🏆</span>
                <div className="flex-1">
                  {previousResult?.passed ? (
                    <>
                      <h3 className="font-bold text-stadi-dark mb-1">Certificate Earned! Score: {previousResult.score_pct}%</h3>
                      {certPdfUrl ? (
                        <div className="flex gap-3 mt-2 flex-wrap">
                          <a href={certPdfUrl} target="_blank" rel="noreferrer"><Button size="sm" variant="primary">📄 Download Certificate</Button></a>
                          <a href={`https://wa.me/?text=${encodeURIComponent(`🏆 I earned my Stadi Certificate in ${course.title}! ${certPdfUrl}`)}`} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="outline">💬 Share WhatsApp</Button>
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-stadi-gray text-sm mt-2"><Loader2 size={14} className="animate-spin text-stadi-green"/>Generating PDF...</div>
                      )}
                    </>
                  ) : previousResult ? (
                    <>
                      <h3 className="font-bold text-stadi-dark mb-1">Score: {previousResult.score_pct}% — Need 75% to pass</h3>
                      <Button size="sm" variant="outline" className="mt-2" onClick={() => { setAssResult(null); setAnswers({}); loadQuizzes(); }}>Retake Assessment</Button>
                    </>
                  ) : (
                    <>
                      <h3 className="font-bold text-stadi-dark mb-1">All lessons done! 🎉 Take the final assessment.</h3>
                      <Button variant="primary" size="sm" className="mt-2" onClick={loadQuizzes}>Start Final Assessment</Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Assessment questions */}
          {showAssessment && !assResult && (
            <div className="card p-5">
              <h2 className="font-bold text-stadi-dark mb-1">Final Assessment</h2>
              <p className="text-stadi-gray text-sm mb-4">Pass mark: 75% · Up to 3 attempts</p>
              {quizzes.length === 0 ? (
                <div className="text-center py-6"><Loader2 size={28} className="animate-spin text-stadi-green mx-auto mb-2"/><p className="text-sm text-stadi-gray">Loading questions...</p></div>
              ) : (
                <div className="space-y-5">
                  {quizzes.map((q, qi) => (
                    <div key={q.id} className="border border-gray-100 rounded-xl p-4">
                      <p className="font-semibold text-stadi-dark text-sm mb-3"><span className="text-stadi-green font-bold mr-2">Q{qi+1}.</span>{q.question}</p>
                      <div className="space-y-2">
                        {(q.options || []).map((opt, oi) => (
                          <label key={oi} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${answers[q.id]===oi?'border-stadi-green bg-stadi-green-light':'border-gray-100 hover:border-stadi-green/30'}`}>
                            <input type="radio" name={q.id} value={oi} checked={answers[q.id]===oi} onChange={()=>setAnswers(a=>({...a,[q.id]:oi}))} className="accent-stadi-green"/>
                            <span className="text-sm">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-3">
                    <Button variant="primary" size="lg" loading={submitting} disabled={Object.keys(answers).length<quizzes.length} onClick={handleSubmit}>
                      Submit ({Object.keys(answers).length}/{quizzes.length} answered)
                    </Button>
                    <Button variant="ghost" onClick={()=>setShowAssessment(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {assResult && (
            <div className={`card p-5 border-l-4 ${assResult.passed?'border-stadi-green':'border-red-400'}`}>
              <div className="flex items-center gap-4">
                <span className="text-5xl">{assResult.passed?'🏆':'📚'}</span>
                <div>
                  <h3 className="font-bold text-stadi-dark text-lg">{assResult.passed?'Passed!':'Not passed yet'}</h3>
                  <p className="text-stadi-gray">Score: <strong className={assResult.passed?'text-stadi-green':'text-red-500'}>{assResult.scorePct}%</strong> ({assResult.correct}/{assResult.total} correct)</p>
                  {!assResult.passed && <Button size="sm" variant="outline" className="mt-2" onClick={()=>{setAssResult(null);setAnswers({});loadQuizzes();}}>Try Again (Attempt {assResult.attemptNumber} of 3)</Button>}
                  {assResult.passed && !certPdfUrl && <div className="flex items-center gap-2 text-sm text-stadi-gray mt-1"><Loader2 size={13} className="animate-spin text-stadi-green"/>Generating certificate PDF...</div>}
                  {assResult.passed && certPdfUrl && <div className="flex gap-2 mt-2"><a href={certPdfUrl} target="_blank" rel="noreferrer"><Button size="sm" variant="primary">📄 Download Certificate</Button></a></div>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          <div className="card p-4">
            <div className="text-xs text-stadi-gray mb-1">{doneLessons}/{totalLessons} completed</div>
            <ProgressBar value={progressPct} showPct />
          </div>
          <div className="card overflow-hidden" style={{maxHeight:'calc(100vh - 220px)',overflowY:'auto'}}>
            {course.modules?.map(mod => (
              <div key={mod.id}>
                <button onClick={()=>setOpenModules(s=>({...s,[mod.id]:!s[mod.id]}))}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100 hover:bg-stadi-green-light transition-colors sticky top-0 z-10">
                  <div className="text-left">
                    <p className="text-xs font-bold text-stadi-green uppercase tracking-wide truncate max-w-[140px]">{mod.title}</p>
                    <p className="text-[10px] text-stadi-gray">{(mod.lessons||[]).filter(l=>completedIds.has(l.id)).length}/{(mod.lessons||[]).length} done</p>
                  </div>
                  {openModules[mod.id]?<ChevronUp size={14} className="text-gray-400 shrink-0"/>:<ChevronDown size={14} className="text-gray-400 shrink-0"/>}
                </button>
                {openModules[mod.id] && (mod.lessons||[]).map(lesson=>{
                  const isDone=completedIds.has(lesson.id);
                  const isActive=activeLesson?.id===lesson.id;
                  return (
                    <button key={lesson.id} onClick={()=>setActiveLesson({...lesson,moduleName:mod.title})}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-gray-50 transition-colors ${isActive?'bg-stadi-green-light border-l-2 border-l-stadi-green':'hover:bg-gray-50'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isDone?'bg-stadi-green':isActive?'border-2 border-stadi-green':'border-2 border-gray-200'}`}>
                        {isDone&&<Check size={11} className="text-white"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-snug truncate ${isActive?'text-stadi-green font-semibold':'text-stadi-dark'}`}>{lesson.title}</p>
                        {lesson.duration_seconds>0&&<p className="text-[10px] text-gray-400">{Math.round(lesson.duration_seconds/60)}min</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
