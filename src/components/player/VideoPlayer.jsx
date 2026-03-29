import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings, Download, Check,
  ChevronLeft, ChevronRight, BookOpen, Award, Globe, Loader2
} from 'lucide-react';
import { progress as progressAPI, assessments as assessmentAPI } from '../../lib/api';
import useAuthStore   from '../../store/auth.store';
import useAppStore    from '../../store/app.store';
import { Button, ProgressBar } from '../ui';

const LANGUAGE_LABELS = {
  english: 'English', swahili: 'Kiswahili', dholuo: 'Dholuo',
  luhya: 'Luhya', kikuyu: 'Kikuyu', kalenjin: 'Kalenjin',
  kamba: 'Kamba', kisii: 'Kisii', meru: 'Meru', mijikenda: 'Mijikenda',
  somali: 'Somali', maasai: 'Maasai', turkana: 'Turkana', teso: 'Teso', taita: 'Taita',
};

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Quiz overlay ──────────────────────────────────────────────
function QuizOverlay({ quiz, onAnswer, onSkip }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const handleSubmit = () => {
    if (selected === null) return;
    setRevealed(true);
    setTimeout(() => {
      onAnswer(quiz.id, selected, selected === quiz.correct_answer);
    }, 1500);
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-20 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-slide-up">
        <div className="text-xs font-semibold text-stadi-orange uppercase tracking-wide mb-2">
          Quick Check ✍️
        </div>
        <p className="font-bold text-stadi-dark text-sm mb-4">{quiz.question}</p>
        <div className="space-y-2 mb-4">
          {quiz.options.map((opt, i) => {
            let bg = 'border-gray-200 hover:border-stadi-green';
            if (revealed) {
              if (i === quiz.correct_answer) bg = 'border-stadi-green bg-stadi-green-light';
              else if (i === selected && i !== quiz.correct_answer) bg = 'border-red-400 bg-red-50';
            } else if (selected === i) {
              bg = 'border-stadi-green bg-stadi-green-light';
            }
            return (
              <button
                key={i}
                onClick={() => !revealed && setSelected(i)}
                className={`w-full text-left px-4 py-2.5 rounded-xl border-2 text-sm transition-all ${bg}`}
              >
                <span className="font-semibold mr-2">{['A','B','C','D'][i]}.</span>
                {opt}
              </button>
            );
          })}
        </div>
        {revealed && quiz.explanation && (
          <div className="bg-blue-50 rounded-xl p-3 mb-4">
            <p className="text-xs text-blue-700"><strong>Explanation:</strong> {quiz.explanation}</p>
          </div>
        )}
        <div className="flex gap-2">
          {!revealed ? (
            <>
              <Button size="sm" variant="primary" onClick={handleSubmit} disabled={selected === null} className="flex-1">
                Submit Answer
              </Button>
              <Button size="sm" variant="ghost" onClick={onSkip}>Skip</Button>
            </>
          ) : (
            <p className="text-center text-xs text-stadi-gray w-full">
              {selected === quiz.correct_answer ? '✅ Correct!' : '❌ Incorrect'} Moving to next lesson...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main video player ─────────────────────────────────────────
export default function VideoPlayer({
  lesson,
  course,
  allLessons = [],
  completedIds = new Set(),
  onLessonComplete,
  onNavigate,
}) {
  const { user }     = useAuthStore();
  const { addToast } = useAppStore();
  const videoRef     = useRef(null);
  const containerRef = useRef(null);
  const progressRef  = useRef(null);
  const watchedRef   = useRef(0);
  const saveTimerRef = useRef(null);

  const [playing,     setPlaying]     = useState(false);
  const [muted,       setMuted]       = useState(false);
  const [volume,      setVolume]      = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [fullscreen,  setFullscreen]  = useState(false);
  const [showControls,setShowControls]= useState(true);
  const [buffering,   setBuffering]   = useState(false);
  const [showSettings,setShowSettings]= useState(false);
  const [selectedLang,setSelectedLang]= useState(user?.language || 'english');
  const [activeQuiz,  setActiveQuiz]  = useState(null);
  const [completed,   setCompleted]   = useState(completedIds.has(lesson?.id));
  const [saving,      setSaving]      = useState(false);
  const controlsTimer = useRef(null);

  // Get video URL for selected language
  const getVideoUrl = useCallback((l) => {
    if (!lesson) return null;
    const key = `video_url_${l}`;
    return lesson[key] || lesson.video_url_english || lesson.video_url_swahili || lesson.videoUrl;
  }, [lesson]);

  const videoUrl = getVideoUrl(selectedLang);

  // Available languages for this lesson
  const availableLangs = Object.keys(LANGUAGE_LABELS).filter(l => !!getVideoUrl(l));

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => { if (playing) setShowControls(false); }, 3000);
  }, [playing]);

  useEffect(() => {
    setCompleted(completedIds.has(lesson?.id));
    setCurrentTime(0);
    watchedRef.current = 0;
  }, [lesson?.id, completedIds]);

  // Track watched time
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      setCurrentTime(v.currentTime);
      if (v.currentTime > watchedRef.current) watchedRef.current = v.currentTime;
    };
    const onDuration = () => setDuration(v.duration || 0);
    const onWaiting  = () => setBuffering(true);
    const onPlaying  = () => { setBuffering(false); setPlaying(true); };
    const onPause    = () => setPlaying(false);
    const onEnded    = () => { setPlaying(false); handleLessonEnd(); };

    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onDuration);
    v.addEventListener('waiting', onWaiting);
    v.addEventListener('playing', onPlaying);
    v.addEventListener('pause',   onPause);
    v.addEventListener('ended',   onEnded);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onDuration);
      v.removeEventListener('waiting', onWaiting);
      v.removeEventListener('playing', onPlaying);
      v.removeEventListener('pause',   onPause);
      v.removeEventListener('ended',   onEnded);
    };
  }, [lesson?.id]);

  // Auto-save progress every 15 seconds while playing
  useEffect(() => {
    if (playing) {
      saveTimerRef.current = setInterval(saveProgress, 15000);
    } else {
      clearInterval(saveTimerRef.current);
    }
    return () => clearInterval(saveTimerRef.current);
  }, [playing, lesson?.id]);

  const saveProgress = async () => {
    if (!lesson?.id || watchedRef.current < 2) return;
    setSaving(true);
    try {
      await progressAPI.mark(lesson.id, {
        watchTimeSeconds: Math.floor(watchedRef.current),
        courseId: course?.id,
      });
    } finally { setSaving(false); }
  };

  const handleLessonEnd = async () => {
    await saveProgress();
    const minRequired = (lesson?.duration_seconds || 60) * 0.7;
    if (watchedRef.current >= minRequired && !completed) {
      try {
        await progressAPI.mark(lesson.id, {
          watchTimeSeconds: Math.floor(watchedRef.current),
          courseId: course?.id,
        });
        setCompleted(true);
        onLessonComplete?.(lesson.id);
        addToast('Lesson completed! 🎉', 'success');
      } catch {}
    }
    // Auto-advance to next lesson after 3s
    const currentIdx = allLessons.findIndex(l => l.id === lesson.id);
    if (currentIdx < allLessons.length - 1) {
      setTimeout(() => onNavigate?.(allLessons[currentIdx + 1]), 3000);
    }
  };

  const handleQuizAnswer = async (quizId, answer, isCorrect) => {
    try {
      await assessmentAPI.quiz(course?.id, quizId, answer);
    } catch {}
    setActiveQuiz(null);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else          { v.pause(); setPlaying(false); }
    resetControlsTimer();
  };

  const handleSeek = (e) => {
    const v = videoRef.current;
    if (!v || !progressRef.current) return;
    const rect  = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * duration;
    setCurrentTime(v.currentTime);
  };

  const skip = (secs) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration, v.currentTime + secs));
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const handleVolume = (e) => {
    const v = videoRef.current;
    if (!v) return;
    const vol = parseFloat(e.target.value);
    v.volume = vol;
    setVolume(vol);
    setMuted(vol === 0);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!document.fullscreenElement) {
      el?.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  const currentIdx = allLessons.findIndex(l => l.id === lesson?.id);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const watchedPct  = duration > 0 ? Math.min(100, (watchedRef.current / duration) * 100) : 0;
  const minRequired = (lesson?.duration_seconds || 60) * 0.7;
  const canComplete = watchedRef.current >= minRequired;

  if (!lesson) return (
    <div className="bg-black aspect-video rounded-2xl flex items-center justify-center">
      <div className="text-center text-white/50">
        <BookOpen size={48} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">Select a lesson to begin</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* ── Video Container ──────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative bg-black rounded-2xl overflow-hidden group"
        style={{ aspectRatio: '16/9' }}
        onMouseMove={resetControlsTimer}
        onClick={togglePlay}
      >
        {/* Video element */}
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            playsInline
            preload="metadata"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-white/60">
              <Globe size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Video not available in {LANGUAGE_LABELS[selectedLang]}</p>
              {availableLangs.length > 0 && (
                <p className="text-xs mt-1 text-stadi-orange">
                  Available in: {availableLangs.map(l => LANGUAGE_LABELS[l]).join(', ')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Buffering spinner */}
        {buffering && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Loader2 size={48} className="text-white animate-spin opacity-70" />
          </div>
        )}

        {/* Quiz overlay */}
        {activeQuiz && (
          <QuizOverlay
            quiz={activeQuiz}
            onAnswer={handleQuizAnswer}
            onSkip={() => setActiveQuiz(null)}
          />
        )}

        {/* Controls overlay */}
        <div
          className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${
            showControls || !playing ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={e => e.stopPropagation()}
        >
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-3 flex items-center justify-between">
            <div className="text-white text-sm font-medium truncate max-w-[60%]">{lesson.title}</div>
            <div className="flex items-center gap-2">
              {saving && <span className="text-white/60 text-xs flex items-center gap-1"><Loader2 size={10} className="animate-spin" />Saving...</span>}
              {completed && <span className="flex items-center gap-1 text-xs bg-stadi-green/80 text-white px-2 py-0.5 rounded-full"><Check size={10} />Done</span>}
            </div>
          </div>

          {/* Center play/pause */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {!playing && !buffering && (
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Play size={28} className="text-white ml-1" fill="white" />
              </div>
            )}
          </div>

          {/* Bottom controls */}
          <div className="bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8">
            {/* Progress bar */}
            <div
              ref={progressRef}
              className="h-1 bg-white/30 rounded-full mb-3 cursor-pointer relative group/bar"
              onClick={handleSeek}
            >
              {/* Watched range */}
              <div className="absolute left-0 top-0 h-full bg-white/20 rounded-full" style={{ width: `${watchedPct}%` }} />
              {/* Playback position */}
              <div className="absolute left-0 top-0 h-full bg-stadi-green rounded-full transition-all" style={{ width: `${progressPct}%` }} />
              {/* Thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover/bar:opacity-100 transition-opacity"
                style={{ left: `${progressPct}%`, transform: 'translate(-50%, -50%)' }}
              />
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Skip back */}
                <button onClick={() => skip(-10)} className="text-white hover:text-stadi-orange transition-colors p-1" title="Back 10s">
                  <SkipBack size={18} />
                </button>
                {/* Play/pause */}
                <button onClick={togglePlay} className="text-white hover:text-stadi-orange transition-colors p-1">
                  {playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
                </button>
                {/* Skip forward */}
                <button onClick={() => skip(10)} className="text-white hover:text-stadi-orange transition-colors p-1" title="Forward 10s">
                  <SkipForward size={18} />
                </button>
                {/* Volume */}
                <button onClick={toggleMute} className="text-white hover:text-stadi-orange transition-colors p-1">
                  {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
                  onChange={handleVolume}
                  className="w-16 h-1 appearance-none bg-white/30 rounded cursor-pointer hidden sm:block"
                />
                {/* Time */}
                <span className="text-white/80 text-xs font-mono ml-1">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Language selector */}
                {availableLangs.length > 1 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="text-white hover:text-stadi-orange transition-colors p-1 flex items-center gap-1 text-xs"
                    >
                      <Globe size={16} />
                      <span className="hidden sm:inline">{LANGUAGE_LABELS[selectedLang]}</span>
                    </button>
                    {showSettings && (
                      <div className="absolute bottom-8 right-0 bg-white rounded-xl shadow-xl py-1.5 z-30 w-36">
                        {availableLangs.map(l => (
                          <button
                            key={l}
                            onClick={() => { setSelectedLang(l); setShowSettings(false); }}
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-stadi-green-light transition-colors
                              ${l === selectedLang ? 'text-stadi-green font-semibold' : 'text-stadi-dark'}`}
                          >
                            {LANGUAGE_LABELS[l]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {/* Fullscreen */}
                <button onClick={toggleFullscreen} className="text-white hover:text-stadi-orange transition-colors p-1">
                  {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lesson Info & Actions ─────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-stadi-green font-semibold uppercase tracking-wide mb-1">
              Lesson {currentIdx + 1} of {allLessons.length}
            </div>
            <h2 className="font-bold text-stadi-dark text-lg">{lesson.title}</h2>
          </div>
          {completed && (
            <div className="shrink-0 flex items-center gap-1.5 bg-stadi-green-light text-stadi-green text-xs font-bold px-3 py-1.5 rounded-full">
              <Check size={12} /> Completed
            </div>
          )}
        </div>

        {/* Watched progress */}
        <div className="mt-3 mb-4">
          <ProgressBar value={Math.round(watchedPct)} label="Lesson progress" showPct />
          {!canComplete && watchedPct < 100 && (
            <p className="text-xs text-stadi-gray mt-1">
              Watch at least 70% of this lesson to mark it complete
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Previous */}
          {prevLesson && (
            <Button size="sm" variant="ghost" onClick={() => onNavigate?.(prevLesson)}
              className="border border-gray-200">
              <ChevronLeft size={14} /> Previous
            </Button>
          )}
          {/* Mark complete */}
          {!completed && (
            <Button size="sm" variant="outline"
              disabled={!canComplete}
              onClick={async () => {
                setSaving(true);
                try {
                  await progressAPI.mark(lesson.id, { watchTimeSeconds: Math.floor(watchedRef.current), courseId: course?.id });
                  setCompleted(true);
                  onLessonComplete?.(lesson.id);
                  addToast('Lesson marked complete!', 'success');
                } finally { setSaving(false); }
              }}
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {canComplete ? 'Mark Complete' : 'Keep watching...'}
            </Button>
          )}
          {/* Next */}
          {nextLesson && (
            <Button size="sm" variant="primary" onClick={() => onNavigate?.(nextLesson)}>
              Next <ChevronRight size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
