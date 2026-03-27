// ── Learn.jsx ─────────────────────────────────────────────────
import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link }   from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Check, Lock, Play, BookOpen, Award } from 'lucide-react';
import { courses as coursesAPI, progress as progressAPI, assessments as assessmentAPI } from '../lib/api';
import { ProgressBar, Button, Badge } from '../components/ui';
import useAuthStore  from '../store/auth.store';
import useAppStore   from '../store/app.store';

export default function LearnPage() {
  const { courseId } = useParams();
  const { user }     = useAuthStore();
  const { addToast } = useAppStore();
  const [activeLesson, setActiveLesson] = useState(null);
  const [watchTime,    setWatchTime]    = useState(0);
  const videoRef = useRef(null);
  const watchTimer = useRef(null);

  const { data: courseData } = useQuery({
    queryKey: ['course-learn', courseId],
    queryFn: async () => {
      // Fetch course with all modules & lessons
      const { data: c } = await coursesAPI.list({ limit: 1 });
      return c?.[0]; // placeholder; real impl would fetch by ID
    },
  });

  const { data: progressData } = useQuery({
    queryKey: ['progress', courseId],
    queryFn: () => progressAPI.byCourse(courseId),
  });

  const completedSet = new Set(progressData?.data?.filter(p => p.completed).map(p => p.lesson_id));

  const markComplete = useMutation({
    mutationFn: () => progressAPI.mark(activeLesson?.id, { watchTimeSeconds: watchTime, courseId }),
    onSuccess:  () => { addToast('Lesson completed! 🎉', 'success'); },
  });

  const handleTimeUpdate = () => {
    if (videoRef.current) setWatchTime(Math.floor(videoRef.current.currentTime));
  };

  if (!courseData) return (
    <div className="max-w-6xl mx-auto px-4 py-12 text-center">
      <p className="text-stadi-gray">Loading your course...</p>
    </div>
  );

  const allLessons = courseData?.modules?.flatMap(m => m.lessons || []) || [];
  const totalLessons = allLessons.length;
  const doneLessons  = allLessons.filter(l => completedSet.has(l.id)).length;
  const progressPct  = totalLessons ? Math.round(doneLessons / totalLessons * 100) : 0;

  const currentLesson = activeLesson || allLessons[0];
  const langKey = `video_url_${user?.language || 'english'}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-4 gap-6">
      {/* Video area */}
      <div className="lg:col-span-3 space-y-4">
        <div className="card overflow-hidden bg-black">
          {currentLesson?.videoUrl || currentLesson?.[langKey] ? (
            <video
              ref={videoRef}
              src={currentLesson.videoUrl || currentLesson[langKey]}
              controls
              className="w-full aspect-video"
              onTimeUpdate={handleTimeUpdate}
            />
          ) : (
            <div className="aspect-video bg-gradient-to-br from-stadi-green/20 to-stadi-orange/20 flex items-center justify-center">
              <div className="text-center text-white">
                <Play size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm opacity-70">Select a lesson to start learning</p>
              </div>
            </div>
          )}
        </div>

        {currentLesson && (
          <div className="card p-5">
            <h2 className="font-bold text-stadi-dark text-lg mb-2">{currentLesson.title}</h2>
            <div className="flex items-center gap-4">
              <Button
                variant="primary" size="sm"
                loading={markComplete.isPending}
                onClick={() => markComplete.mutate()}
                disabled={completedSet.has(currentLesson.id)}
              >
                {completedSet.has(currentLesson.id) ? <><Check size={14} /> Completed</> : 'Mark Complete'}
              </Button>
              {completedSet.has(currentLesson.id) && <Badge variant="green">✓ Done</Badge>}
            </div>
          </div>
        )}

        {progressPct >= 100 && (
          <div className="card p-5 bg-stadi-green-light border border-stadi-green/30 text-center">
            <Award size={32} className="text-stadi-green mx-auto mb-2" />
            <h3 className="font-bold text-stadi-dark">All lessons complete!</h3>
            <p className="text-sm text-stadi-gray mb-3">Take the final assessment to earn your certificate</p>
            <Link to={`/assessment/${courseId}`}><Button variant="primary">Take Final Assessment</Button></Link>
          </div>
        )}
      </div>

      {/* Lesson sidebar */}
      <div className="space-y-4">
        <div className="card p-4">
          <ProgressBar value={progressPct} label="Course Progress" />
          <p className="text-xs text-stadi-gray mt-1">{doneLessons}/{totalLessons} lessons completed</p>
        </div>
        <div className="card overflow-hidden">
          <div className="max-h-[60vh] overflow-y-auto">
            {courseData?.modules?.map((mod, mi) => (
              <div key={mod.id}>
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 sticky top-0">
                  <p className="text-xs font-semibold text-stadi-green uppercase tracking-wide">{mod.title}</p>
                </div>
                {mod.lessons?.map(lesson => (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-gray-50 hover:bg-stadi-green-light transition-colors
                      ${currentLesson?.id === lesson.id ? 'bg-stadi-green-light' : ''}`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5
                      ${completedSet.has(lesson.id) ? 'bg-stadi-green' : 'border-2 border-gray-300'}`}>
                      {completedSet.has(lesson.id) && <Check size={11} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium leading-snug ${currentLesson?.id === lesson.id ? 'text-stadi-green' : 'text-stadi-dark'}`}>
                        {lesson.title}
                      </p>
                      {lesson.duration_seconds > 0 && (
                        <p className="text-[10px] text-gray-400">{Math.round(lesson.duration_seconds/60)}min</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
