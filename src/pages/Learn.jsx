import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate }    from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown, ChevronUp, Check, Lock, BookOpen, Award,
  Loader2, Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Globe, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, Clock, Share2, Download, Flame
} from 'lucide-react';
import { progress as progressAPI, assessments, certificates } from '../lib/api';
import { ProgressBar, Button, Badge, Skeleton } from '../components/ui';
import useAuthStore  from '../store/auth.store';
import useAppStore   from '../store/app.store';
import api from '../lib/api';

const LANG_LABELS = {
  english:'English', swahili:'Kiswahili', dholuo:'Dholuo', luhya:'Luhya',
  kikuyu:'Kikuyu', kalenjin:'Kalenjin', kamba:'Kamba', kisii:'Kisii',
  meru:'Meru', mijikenda:'Mijikenda', somali:'Somali', maasai:'Maa',
  turkana:'Turkana', teso:'Ateso', taita:'Kidawida',
};

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
}

// ── Video Player ──────────────────────────────────────────────
function VideoPlayer({ lesson, course, allLessons, completedIds, onComplete, onNavigate }) {
  const { user }     = useAuthStore();
  const { addToast } = useAppStore();
  const vidRef   = useRef(null);
  const barRef   = useRef(null);
  const watchRef = useRef(0);
  const saveRef  = useRef(null);
  const hideRef  = useRef(null);

  const [playing,  setPlaying]  = useState(false);
  const [muted,    setMuted]    = useState(false);
  const [volume,   setVolume]   = useState(1);
  const [current,  setCurrent]  = useState(0);
  const [dur,      setDur]      = useState(0);
  const [fs,       setFs]       = useState(false);
  const [showCtrl, setShowCtrl] = useState(true);
  const [buffering,setBuffering]= useState(false);
  const [langMenu, setLangMenu] = useState(false);
  const [selLang,  setSelLang]  = useState(user?.language || 'english');
  const [done,     setDone]     = useState(false);
  const [saving,   setSaving]   = useState(false);

  const getUrl = useCallback((l) => {
    if (!lesson) return null;
    return lesson[`video_url_${l}`] || lesson.video_url_english || lesson.video_url_swahili || lesson.videoUrl || null;
  }, [lesson]);

  const availLangs = Object.keys(LANG_LABELS).filter(l => getUrl(l));
  const videoUrl   = getUrl(selLang);

  useEffect(() => {
    setDone(completedIds?.has(lesson?.id));
    setCurrent(0); watchRef.current = 0;
  }, [lesson?.id]);

  useEffect(() => {
    const v = vidRef.current; if (!v) return;
    const handlers = {
      timeupdate: () => { setCurrent(v.currentTime); if (v.currentTime > watchRef.current) watchRef.current = v.currentTime; },
      loadedmetadata: () => setDur(v.duration || 0),
      waiting:  () => setBuffering(true),
      playing:  () => { setBuffering(false); setPlaying(true); },
      pause:    () => setPlaying(false),
      ended:    () => { setPlaying(false); handleEnd(); },
    };
    Object.entries(handlers).forEach(([e, h]) => v.addEventListener(e, h));
    return () => Object.entries(handlers).forEach(([e, h]) => v.removeEventListener(e, h));
  }, [lesson?.id]);

  useEffect(() => {
    if (playing) saveRef.current = setInterval(doSave, 15000);
    else clearInterval(saveRef.current);
    return () => clearInterval(saveRef.current);
  }, [playing, lesson?.id]);

  const showControls = () => {
    setShowCtrl(true);
    clearTimeout(hideRef.current);
    hideRef.current = setTimeout(() => { if (playing) setShowCtrl(false); }, 3000);
  };

  const doSave = async () => {
    if (!lesson?.id || watchRef.current < 2) return;
    setSaving(true);
    try { await progressAPI.mark(lesson.id, { watchTimeSeconds: Math.floor(watchRef.current), courseId: course?.id }); }
    finally { setSaving(false); }
  };

  const handleEnd = async () => {
    await doSave();
    const minWatch = (lesson?.duration_seconds || 60) * 0.7;
    if (watchRef.current >= minWatch && !done) {
      try {
        await progressAPI.mark(lesson.id, { watchTimeSeconds: Math.floor(watchRef.current), courseId: course?.id });
        setDone(true);
        onComplete?.(lesson.id);
        addToast('Lesson complete! 🎉', 'success');
      } catch {}
    }
    const idx = allLessons?.findIndex(l => l.id === lesson.id);
    if (idx >= 0 && idx < allLessons.length - 1) setTimeout(() => onNavigate?.(allLessons[idx+1]), 2500);
  };

  const toggle = () => { const v = vidRef.current; if (!v) return; v.paused ? v.play() : v.pause(); showControls(); };
  const skip   = (s) => { if (vidRef.current) vidRef.current.currentTime = Math.max(0, Math.min(dur, vidRef.current.currentTime + s)); };
  const seek   = (e) => {
    if (!barRef.current || !dur) return;
    const r = barRef.current.getBoundingClientRect();
    vidRef.current.currentTime = Math.max(0, Math.min(dur, ((e.clientX - r.left) / r.width) * dur));
  };
  const toggleMute = () => { if (vidRef.current) { vidRef.current.muted = !vidRef.current.muted; setMuted(v => !v); }};
  const changeVol  = (e) => { const vol = parseFloat(e.target.value); if (vidRef.current) { vidRef.current.volume = vol; setVolume(vol); setMuted(vol === 0); }};
  const toggleFs   = () => {
    const el = document.getElementById('stadi-player');
    document.fullscreenElement ? document.exitFullscreen() : el?.requestFullscreen();
    setFs(v => !v);
  };

  const pct     = dur > 0 ? (current / dur) * 100 : 0;
  const minReq  = (lesson?.duration_seconds || 60) * 0.7;
  const watched = dur > 0 ? Math.min(100, (watchRef.current / dur) * 100) : 0;
  const canDone = watchRef.current >= minReq;
  const idx     = allLessons?.findIndex(l => l.id === lesson?.id) ?? -1;

  if (!lesson) return (
    <div className="bg-gray-900 rounded-2xl aspect-video flex items-center justify-center">
      <div className="text-center text-white/40">
        <Play size={48} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">Select a lesson to start learning</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-0">
      {/* Player */}
      <div id="stadi-player" className="relative bg-black rounded-t-2xl overflow-hidden aspect-video group"
           onMouseMove={showControls} onClick={toggle}>
        {videoUrl ? (
          <video ref={vidRef} src={videoUrl} className="w-full h-full object-contain" playsInline preload="metadata"
            onClick={e => e.stopPropagation()} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center text-white/50">
              <Globe size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No video yet in {LANG_LABELS[selLang]}</p>
              {availLangs.length > 0 && <p className="text-xs text-stadi-orange mt-1">Available: {availLangs.map(l => LANG_LABELS[l]).join(', ')}</p>}
            </div>
          </div>
        )}

        {/* Buffering */}
        {buffering && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><Loader2 size={44} className="text-white animate-spin opacity-70" /></div>}

        {/* Controls overlay */}
        <div className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-200 ${showCtrl || !playing ? 'opacity-100' : 'opacity-0'}`}
             onClick={e => e.stopPropagation()}>
          {/* Top bar */}
          <div className="bg-gradient-to-b from-black/60 to-transparent px-4 pt-3 pb-6 flex items-center justify-between">
            <div className="text-white text-sm font-medium truncate max-w-[60%]">{lesson.title}</div>
            <div className="flex items-center gap-2">
              {saving && <span className="text-white/50 text-xs flex items-center gap-1"><Loader2 size={10} className="animate-spin" />Saving</span>}
              {done && <span className="text-xs bg-emerald-500/80 text-white px-2 py-0.5 rounded-full flex items-center gap-1"><Check size={10} />Complete</span>}
            </div>
          </div>

          {/* Centre big play */}
          {!playing && !buffering && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                <Play size={28} className="text-white ml-1" fill="white" />
              </div>
            </div>
          )}

          {/* Bottom controls */}
          <div className="bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-10">
            {/* Seek bar */}
            <div ref={barRef} className="h-1.5 bg-white/25 rounded-full mb-3 cursor-pointer relative group/bar" onClick={seek}>
              <div className="absolute inset-y-0 left-0 bg-white/20 rounded-full" style={{ width: `${watched}%` }} />
              <div className="absolute inset-y-0 left-0 bg-stadi-green rounded-full transition-all" style={{ width: `${pct}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow opacity-0 group-hover/bar:opacity-100 transition-opacity -translate-x-1/2"
                   style={{ left: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {idx > 0 && <button onClick={() => onNavigate?.(allLessons[idx-1])} className="text-white/70 hover:text-white p-1 transition-colors" title="Previous lesson"><SkipBack size={16}/></button>}
                <button onClick={() => skip(-10)} className="text-white/70 hover:text-white p-1 transition-colors" title="Back 10s"><SkipBack size={16}/></button>
                <button onClick={toggle} className="text-white hover:text-stadi-orange p-1 transition-colors">
                  {playing ? <Pause size={22} fill="currentColor"/> : <Play size={22} fill="currentColor"/>}
                </button>
                <button onClick={() => skip(10)} className="text-white/70 hover:text-white p-1 transition-colors" title="Forward 10s"><SkipForward size={16}/></button>
                {idx >= 0 && idx < allLessons.length - 1 && (
                  <button onClick={() => onNavigate?.(allLessons[idx+1])} className="text-white/70 hover:text-white p-1 transition-colors" title="Next lesson"><SkipForward size={16}/></button>
                )}
                <button onClick={toggleMute} className="text-white/70 hover:text-white p-1 transition-colors">
                  {muted || volume === 0 ? <VolumeX size={16}/> : <Volume2 size={16}/>}
                </button>
                <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
                  onChange={changeVol}
                  className="w-16 h-1 hidden sm:block accent-stadi-green cursor-pointer" />
                <span className="text-white/60 text-xs font-mono">{formatTime(current)} / {formatTime(dur)}</span>
              </div>
              <div className="flex items-center gap-2">
                {availLangs.length > 1 && (
                  <div className="relative">
                    <button onClick={e => { e.stopPropagation(); setLangMenu(v => !v); }}
                      className="text-white/70 hover:text-white text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors">
                      <Globe size={14}/> {LANG_LABELS[selLang]?.slice(0, 3)}
                    </button>
                    {langMenu && (
                      <div className="absolute bottom-8 right-0 bg-gray-900 border border-gray-700 rounded-xl py-1.5 z-30 w-36 shadow-xl">
                        {availLangs.map(l => (
                          <button key={l} onClick={() => { setSelLang(l); setLangMenu(false); }}
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-white/10 transition-colors
                              ${l === selLang ? 'text-stadi-green font-semibold' : 'text-white/70'}`}>
                            {LANG_LABELS[l]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <button onClick={toggleFs} className="text-white/70 hover:text-white p-1 transition-colors">
                  {fs ? <Minimize size={16}/> : <Maximize size={16}/>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson info bar */}
      <div className="bg-white rounded-b-2xl border border-t-0 border-gray-100 px-5 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs text-stadi-green font-semibold uppercase tracking-wide mb-0.5">
            Lesson {idx + 1} of {allLessons?.length}
          </div>
          <h2 className="font-bold text-gray-900 text-base truncate">{lesson.title}</h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {done
            ? <Badge variant="green"><Check size={11}/> Complete</Badge>
            : <Button size="sm" variant={canDone ? 'primary' : 'ghost'}
                className={!canDone ? 'border border-gray-200 text-gray-400 cursor-not-allowed' : ''}
                disabled={!canDone} loading={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await progressAPI.mark(lesson.id, { watchTimeSeconds: Math.floor(watchRef.current), courseId: course?.id });
                    setDone(true); onComplete?.(lesson.id); addToast('Marked complete! 🎉', 'success');
                  } finally { setSaving(false); }
                }}>
                <Check size={13}/> {canDone ? 'Mark Complete' : `Watch ${Math.round(minReq / 60)}min min`}
              </Button>
          }
          {idx < allLessons.length - 1 && (
            <Button size="sm" variant="outline" onClick={() => onNavigate?.(allLessons[idx+1])}>
              Next <ChevronRight size={14}/>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Assessment component ──────────────────────────────────────
function Assessment({ courseId, course, onPassed }) {
  const { addToast }   = useAppStore();
  const qc             = useQueryClient();
  const [answers, setAnswers] = useState({});
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [certUrl, setCertUrl] = useState(null);
  const [polling, setPolling] = useState(false);

  const { data: prevResult } = useQuery({
    queryKey: ['assessment', courseId],
    queryFn:  () => assessments.result(courseId),
  });

  const prev = prevResult?.data;

  useEffect(() => {
    if (prev?.passed) {
      // Try to get cert PDF
      certificates.list().then(r => {
        const cert = r.data?.find(c => c.courses?.id === courseId || c.course_id === courseId);
        if (cert?.pdf_url) setCertUrl(cert.pdf_url);
      }).catch(() => {});
    }
  }, [prev?.passed, courseId]);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/assessments/${courseId}/questions`);
      setQuizzes(res.data?.data || res.data || []);
    } catch { setQuizzes([]); }
    finally { setLoading(false); }
  };

  const submitAssessment = async () => {
    setLoading(true);
    try {
      const res = await assessments.submit(courseId, answers);
      const r   = res.data;
      setResult(r);
      qc.invalidateQueries(['assessment', courseId]);

      if (r.passed) {
        addToast('🏆 Assessment passed! Certificate generating...', 'success', 7000);
        onPassed?.();
        // Generate certificate
        try {
          const certRes = await certificates.generate(courseId);
          if (certRes.data?.pdfUrl) { setCertUrl(certRes.data.pdfUrl); return; }
          // Poll for PDF
          setPolling(true);
          let tries = 0;
          const poll = setInterval(async () => {
            tries++;
            try {
              const list = await certificates.list();
              const cert = list.data?.find(c => c.courses?.id === courseId);
              if (cert?.pdf_url) { setCertUrl(cert.pdf_url); clearInterval(poll); setPolling(false); }
            } catch {}
            if (tries > 24) { clearInterval(poll); setPolling(false); }
          }, 5000);
        } catch {}
      }
    } catch (e) { addToast(e?.message || 'Submission failed.', 'error'); }
    finally { setLoading(false); }
  };

  // Already passed
  if (prev?.passed) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-stadi-green-light rounded-2xl flex items-center justify-center shrink-0 text-3xl">🏆</div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Certificate Earned!</h3>
            <p className="text-gray-500 text-sm mb-1">Score: <strong className="text-stadi-green">{prev.score_pct}%</strong> · Passed on attempt {prev.attempt_number}</p>
            <p className="text-gray-400 text-xs mb-4">{new Date(prev.completed_at).toLocaleDateString('en-KE', { year:'numeric', month:'long', day:'numeric' })}</p>
            {certUrl ? (
              <div className="flex flex-wrap gap-3">
                <a href={certUrl} target="_blank" rel="noreferrer">
                  <Button variant="primary" size="sm"><Download size={14}/> Download Certificate PDF</Button>
                </a>
                <a href={`https://wa.me/?text=${encodeURIComponent(`🏆 I just earned my Stadi Certificate in "${course?.title}"!\n\nVerify it: https://stadi.co.ke/certificates/verify\n\nLearn with me on stadi.co.ke`)}`}
                   target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm"><Share2 size={14}/> Share on WhatsApp</Button>
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-stadi-gray text-sm">
                <Loader2 size={14} className="animate-spin text-stadi-green"/> Generating your certificate PDF...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show result after submission
  if (result) {
    return (
      <div className={`bg-white rounded-2xl border shadow-sm p-6 ${result.passed ? 'border-stadi-green/30' : 'border-red-200'}`}>
        <div className="flex items-start gap-4">
          <div className="text-5xl">{result.passed ? '🏆' : '📚'}</div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg">{result.passed ? 'Passed!' : 'Not passed yet'}</h3>
            <p className="text-gray-500 text-sm mt-1">
              Score: <strong className={result.passed ? 'text-stadi-green' : 'text-red-500'}>{result.scorePct}%</strong>
              <span className="text-gray-400 ml-2">({result.correct}/{result.total} correct)</span>
            </p>
            {result.passed ? (
              certUrl ? (
                <div className="flex flex-wrap gap-3 mt-3">
                  <a href={certUrl} target="_blank" rel="noreferrer"><Button variant="primary" size="sm"><Download size={14}/> Download PDF</Button></a>
                  <a href={`https://wa.me/?text=${encodeURIComponent(`🏆 I passed! Stadi Certificate in ${course?.title}!`)}`} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm"><Share2 size={14}/> Share</Button>
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-stadi-gray mt-3">
                  {polling ? <><Loader2 size={14} className="animate-spin text-stadi-green"/> Generating certificate PDF...</> : ''}
                </div>
              )
            ) : (
              <div className="mt-3 flex gap-3">
                <Button variant="primary" size="sm" onClick={() => { setResult(null); setAnswers({}); loadQuizzes(); }}>
                  Try Again (Attempt {result.attemptNumber} of 3)
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Quiz form
  if (quizzes.length > 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Final Assessment</h2>
            <p className="text-gray-500 text-sm mt-0.5">Pass mark: 75% · Up to 3 attempts · {quizzes.length} questions</p>
          </div>
          <Badge variant="orange">{Object.keys(answers).length}/{quizzes.length} answered</Badge>
        </div>
        <div className="p-6 space-y-6">
          {quizzes.map((q, qi) => (
            <div key={q.id} className="border border-gray-100 rounded-xl p-5">
              <p className="font-semibold text-gray-900 mb-4 text-sm leading-relaxed">
                <span className="text-stadi-green font-bold mr-2">Q{qi+1}.</span>{q.question}
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {(q.options || []).map((opt, oi) => (
                  <label key={oi}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all
                      ${answers[q.id] === oi ? 'border-stadi-green bg-stadi-green-light' : 'border-gray-100 hover:border-stadi-green/40 hover:bg-gray-50'}`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                      ${answers[q.id] === oi ? 'border-stadi-green bg-stadi-green' : 'border-gray-300'}`}>
                      {answers[q.id] === oi && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <input type="radio" name={q.id} className="sr-only" onChange={() => setAnswers(a => ({ ...a, [q.id]: oi }))} />
                    <span className="text-sm text-gray-700">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <Button variant="primary" size="lg" loading={loading}
              disabled={Object.keys(answers).length < quizzes.length}
              onClick={submitAssessment}>
              Submit Assessment ({Object.keys(answers).length}/{quizzes.length} answered)
            </Button>
            <Button variant="ghost" onClick={() => setQuizzes([])}>Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  // CTA — start assessment
  return (
    <div className="bg-gradient-to-r from-stadi-orange/10 to-stadi-green/10 rounded-2xl border border-stadi-orange/20 p-6">
      <div className="flex items-start gap-4">
        <div className="text-4xl">🏆</div>
        <div className="flex-1">
          {prev && !prev.passed ? (
            <>
              <h3 className="font-bold text-gray-900 mb-1">Retake Assessment</h3>
              <p className="text-gray-500 text-sm mb-1">Last score: <strong className="text-red-500">{prev.score_pct}%</strong> — you need 75% to pass</p>
              <p className="text-gray-400 text-xs mb-3">Attempt {prev.attempt_number} of 3 used</p>
            </>
          ) : (
            <>
              <h3 className="font-bold text-gray-900 mb-1">All lessons complete! 🎉</h3>
              <p className="text-gray-500 text-sm mb-3">Take the final assessment (75% pass mark) to earn your certificate and prove your skill.</p>
            </>
          )}
          <Button variant="primary" loading={loading} onClick={loadQuizzes}>
            {loading ? <><Loader2 size={14} className="animate-spin"/> Loading...</> : <><Award size={14}/> Start Final Assessment</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Learn page ───────────────────────────────────────────
export default function LearnPage() {
  const { courseId } = useParams();
  const qc           = useQueryClient();
  const { user }     = useAuthStore();
  const { addToast } = useAppStore();
  const [activeLesson, setActiveLesson] = useState(null);
  const [openMods,     setOpenMods]     = useState({});

  // Fetch course with modules + lessons
  const { data: courseRes, isLoading } = useQuery({
    queryKey: ['course-learn', courseId],
    queryFn:  () => api.get(`/courses/by-id/${courseId}`).catch(() => api.get(`/courses/${courseId}`)),
    retry: 1,
  });

  // Fetch progress
  const { data: progressRes, refetch: refetchProgress } = useQuery({
    queryKey: ['progress', courseId],
    queryFn:  () => progressAPI.byCourse(courseId),
    refetchInterval: 30000,
  });

  const course       = courseRes?.data;
  const progressList = progressRes?.data || [];
  const completedIds = new Set(progressList.filter(p => p.completed).map(p => p.lesson_id));
  const allLessons   = (course?.modules || []).flatMap(m => (m.lessons || []).map(l => ({ ...l, moduleName: m.title })));
  const totalLessons = allLessons.length;
  const doneLessons  = allLessons.filter(l => completedIds.has(l.id)).length;
  const progressPct  = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
  const allDone      = totalLessons > 0 && doneLessons >= totalLessons;

  // Auto-open first module and set first incomplete lesson
  useEffect(() => {
    if (course?.modules?.length && !activeLesson) {
      setOpenMods({ [course.modules[0].id]: true });
      const firstIncomplete = allLessons.find(l => !completedIds.has(l.id));
      setActiveLesson(firstIncomplete || allLessons[0] || null);
    }
  }, [course?.id]);

  const handleComplete = useCallback((lessonId) => {
    qc.invalidateQueries(['progress', courseId]);
    refetchProgress();
  }, [courseId]);

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 space-y-3">
        <Skeleton className="w-full aspect-video rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
      <div className="space-y-3">{[1,2,3,4].map(i=><Skeleton key={i} className="h-14 rounded-xl"/>)}</div>
    </div>
  );

  if (!course) return (
    <div className="max-w-5xl mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-4">🔒</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Course not found or not enrolled</h2>
      <p className="text-gray-500 mb-6">You may not be enrolled, or this course doesn't exist.</p>
      <Link to="/dashboard"><Button variant="primary">Go to Dashboard</Button></Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/dashboard" className="text-gray-400 hover:text-stadi-green transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div className="min-w-0">
            <p className="text-xs text-gray-400">My Courses</p>
            <h1 className="font-bold text-gray-900 text-lg truncate">{course.title}</h1>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-bold text-stadi-green">{progressPct}%</div>
          <div className="text-xs text-gray-400">{doneLessons}/{totalLessons} lessons</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-stadi-green rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="grid lg:grid-cols-4 gap-5">
        {/* Video + content */}
        <div className="lg:col-span-3 space-y-4">
          <VideoPlayer
            lesson={activeLesson} course={course}
            allLessons={allLessons} completedIds={completedIds}
            onComplete={handleComplete} onNavigate={setActiveLesson}
          />

          {/* Assessment / Certificate */}
          {allDone && (
            <Assessment courseId={courseId} course={course} onPassed={() => {
              qc.invalidateQueries(['progress', courseId]);
            }} />
          )}
        </div>

        {/* Lesson sidebar */}
        <div className="space-y-3">
          {/* Stats */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-stadi-green">{doneLessons}</div>
              <div className="text-[10px] text-gray-400">Done</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{totalLessons - doneLessons}</div>
              <div className="text-[10px] text-gray-400">Left</div>
            </div>
            <div>
              <div className="text-lg font-bold text-stadi-orange">{progressPct}%</div>
              <div className="text-[10px] text-gray-400">Done</div>
            </div>
          </div>

          {/* Module + lesson list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            {(course.modules || []).map((mod, mi) => {
              const modDone = (mod.lessons || []).filter(l => completedIds.has(l.id)).length;
              const isOpen  = openMods[mod.id] ?? (mi === 0);
              return (
                <div key={mod.id}>
                  <button onClick={() => setOpenMods(s => ({ ...s, [mod.id]: !s[mod.id] }))}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100 hover:bg-stadi-green-light transition-colors sticky top-0 z-10">
                    <div className="text-left min-w-0">
                      <p className="text-xs font-bold text-stadi-green uppercase tracking-wide truncate">{mod.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{modDone}/{(mod.lessons||[]).length} complete</p>
                    </div>
                    {isOpen ? <ChevronUp size={14} className="text-gray-400 shrink-0"/> : <ChevronDown size={14} className="text-gray-400 shrink-0"/>}
                  </button>
                  {isOpen && (mod.lessons || []).map((lesson) => {
                    const isDone   = completedIds.has(lesson.id);
                    const isActive = activeLesson?.id === lesson.id;
                    return (
                      <button key={lesson.id} onClick={() => setActiveLesson({ ...lesson, moduleName: mod.title })}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-gray-50 transition-colors
                          ${isActive ? 'bg-stadi-green-light border-l-2 border-l-stadi-green' : 'hover:bg-gray-50/80'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all
                          ${isDone ? 'bg-stadi-green' : isActive ? 'border-2 border-stadi-green' : 'border-2 border-gray-200'}`}>
                          {isDone
                            ? <Check size={11} className="text-white" />
                            : isActive
                              ? <Play size={8} className="text-stadi-green ml-0.5" fill="currentColor" />
                              : null
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-snug ${isActive ? 'text-stadi-green font-semibold' : isDone ? 'text-gray-500' : 'text-gray-800'}`}>
                            {lesson.title}
                          </p>
                          {lesson.duration_seconds > 0 && (
                            <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                              <Clock size={9} />{Math.round(lesson.duration_seconds/60)}min
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
