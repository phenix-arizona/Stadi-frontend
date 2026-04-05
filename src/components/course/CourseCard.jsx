import React, { useState } from 'react';
import { Link }                     from 'react-router-dom';
import { Heart, Clock, BookOpen, Users, TrendingUp, Star } from 'lucide-react';
import { Badge, SkeletonCard, StarRating, Button } from '../ui';
import useAuthStore   from '../../store/auth.store';
import { bookmarks }  from '../../lib/api';

// ── Helpers ───────────────────────────────────────────────────
function formatKes(n) {
  if (!n) return null;
  return n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n;
}
function formatDuration(seconds) {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}min`;
}

// ── Category gradient themes ──────────────────────────────────
const CATEGORY_THEMES = {
  energy:       { gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 40%, #92400e 100%)', pattern: 'radial',   accent: '#fef3c7' },
  technology:   { gradient: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 50%, #1e1b4b 100%)', pattern: 'grid',     accent: '#e0f2fe' },
  textile:      { gradient: 'linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #6d28d9 100%)', pattern: 'diagonal', accent: '#fdf4ff' },
  fisheries:    { gradient: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 50%, #1e3a5f 100%)', pattern: 'radial',   accent: '#ecfeff' },
  agriculture:  { gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 40%, #14532d 100%)', pattern: 'dots',     accent: '#f0fdf4' },
  construction: { gradient: 'linear-gradient(135deg, #f97316 0%, #c2410c 50%, #431407 100%)', pattern: 'brick',    accent: '#fff7ed' },
  beauty:       { gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 40%, #881337 100%)', pattern: 'radial',   accent: '#fff1f2' },
  hospitality:  { gradient: 'linear-gradient(135deg, #fb923c 0%, #ea580c 50%, #7c2d12 100%)', pattern: 'dots',     accent: '#fff7ed' },
  automotive:   { gradient: 'linear-gradient(135deg, #64748b 0%, #334155 50%, #0f172a 100%)', pattern: 'grid',     accent: '#f1f5f9' },
  business:     { gradient: 'linear-gradient(135deg, #10b981 0%, #059669 40%, #064e3b 100%)', pattern: 'diagonal', accent: '#ecfdf5' },
  default:      { gradient: 'linear-gradient(135deg, #4ade80 0%, #16a34a 50%, #14532d 100%)', pattern: 'dots',     accent: '#f0fdf4' },
};

// ── SVG pattern overlays ──────────────────────────────────────
// Each pattern gets a unique SVG id so multiple cards on the same
// page don't clash (SVG <defs> ids are global in the DOM).
let _patternCounter = 0;

function PatternOverlay({ type, accent }) {
  const [uid] = useState(() => ++_patternCounter);
  const a = accent + '30'; // ~19% opacity

  switch (type) {
    case 'grid':
      return (
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`cc-grid-${uid}`} width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke={a} strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#cc-grid-${uid})`} />
        </svg>
      );
    case 'diagonal':
      return (
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`cc-diag-${uid}`} width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="20" stroke={a} strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#cc-diag-${uid})`} />
        </svg>
      );
    case 'dots':
      return (
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`cc-dots-${uid}`} width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="1.5" fill={a} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#cc-dots-${uid})`} />
        </svg>
      );
    case 'brick':
      return (
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`cc-brick-${uid}`} width="40" height="20" patternUnits="userSpaceOnUse">
              <rect width="40" height="20" fill="none" stroke={a} strokeWidth="0.8" />
              <line x1="20" y1="20" x2="20" y2="40" stroke={a} strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#cc-brick-${uid})`} />
        </svg>
      );
    case 'radial':
    default: {
      const gradId = `cc-rad-${uid}`;
      return (
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id={gradId} cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor={a} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${gradId})`} />
        </svg>
      );
    }
  }
}

// ── Gradient thumbnail (no photo fallback) ────────────────────
function GradientThumbnail({ course, theme }) {
  return (
    <div
      className="relative w-full h-full overflow-hidden flex items-center justify-center"
      style={{ background: theme.gradient }}
    >
      <PatternOverlay type={theme.pattern} accent={theme.accent} />
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.32) 100%)' }}
      />
      <div className="relative z-10 text-center select-none">
        <div
          className="transition-transform duration-300 group-hover:scale-110"
          style={{ fontSize: '2.8rem', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.28))' }}
        >
          {course.categories?.icon_emoji || '📚'}
        </div>
        <div
          className="mt-1 text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.75)', letterSpacing: '0.12em' }}
        >
          {course.categories?.name}
        </div>
      </div>
    </div>
  );
}

// ── Progress strip (enrolled view) ───────────────────────────
function ProgressStrip({ pct }) {
  if (!pct) return null;
  return (
    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mt-2">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #4ade80, #16a34a)' }}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// COURSE CARD
// Props:
//   course        — course object (with categories, users nested)
//   showEarnBadge — bool  (default true)
//   enrolled      — bool  (default false)
//   progress      — 0–100 (default 0, only shown when enrolled)
// ══════════════════════════════════════════════════════════════
export function CourseCard({ course, showEarnBadge = true, enrolled = false, progress = 0 }) {
  const { isLoggedIn, openAuth } = useAuthStore();
  const [bookmarked, setBookmarked] = useState(false);
  const [bLoading,   setBLoading]   = useState(false);

  const slug  = course.categories?.slug || 'default';
  const theme = CATEGORY_THEMES[slug] || CATEGORY_THEMES.default;

  // Smart routing: enrolled → /learn/:id, public → /courses/:slug
  const href = enrolled ? `/learn/${course.id}` : `/courses/${course.slug}`;

  const handleBookmark = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { openAuth(); return; }
    setBLoading(true);
    try {
      if (bookmarked) { await bookmarks.remove(course.id); setBookmarked(false); }
      else            { await bookmarks.add(course.id);    setBookmarked(true);  }
    } finally { setBLoading(false); }
  };

  return (
    <div className="card group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">

      {/* ── Thumbnail ── */}
      <div className="relative overflow-hidden rounded-t-2xl" style={{ height: '176px' }}>
        <Link to={href} className="block w-full h-full">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <GradientThumbnail course={course} theme={theme} />
          )}
        </Link>

        {/* Earn income badge */}
        {showEarnBadge && course.income_min_kes && (
          <div className="absolute top-2 left-2 z-10">
            <span className="flex items-center gap-1 bg-stadi-orange text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
              <TrendingUp size={10} />
              Earn KES {formatKes(course.income_min_kes)}–{formatKes(course.income_max_kes)}/mo
            </span>
          </div>
        )}

        {/* Free badge */}
        {course.is_free && !enrolled && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="green">FREE</Badge>
          </div>
        )}

        {/* Enrolled badge */}
        {enrolled && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="orange">
              {progress > 0 ? `${progress}% done` : '✓ Enrolled'}
            </Badge>
          </div>
        )}

        {/* Bookmark button */}
        <button
          onClick={handleBookmark}
          disabled={bLoading}
          className={`absolute bottom-2 right-2 z-10 p-1.5 rounded-full backdrop-blur-sm transition-all
            ${bookmarked ? 'bg-stadi-orange text-white' : 'bg-white/80 text-gray-400 hover:text-stadi-orange'}`}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark course'}
        >
          <Heart size={14} fill={bookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* ── Content ── */}
      <div className="p-4">
        {/* Category */}
        <div className="text-xs text-stadi-green font-semibold uppercase tracking-wide mb-1">
          {course.categories?.icon_emoji} {course.categories?.name}
        </div>

        {/* Title */}
        <Link to={href}>
          <h3 className="font-bold text-stadi-dark text-sm leading-snug mb-1 line-clamp-2 hover:text-stadi-green transition-colors">
            {course.title}
          </h3>
        </Link>

        {/* Instructor */}
        {course.users && (
          <p className="text-xs text-stadi-gray mb-2">
            by <span className="font-medium">{course.users.name}</span>
          </p>
        )}

        {/* Progress strip (enrolled only) */}
        <ProgressStrip pct={enrolled ? progress : 0} />

        {/* Rating */}
        {course.avg_rating > 0 && (
          <div className="mb-2 mt-2">
            <StarRating rating={course.avg_rating} count={course.review_count} />
          </div>
        )}

        {/* Meta chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {course.total_lessons > 0 && (
            <span className="flex items-center gap-1 text-xs text-stadi-gray bg-gray-50 px-2 py-0.5 rounded-full">
              <BookOpen size={10} /> {course.total_lessons} lessons
            </span>
          )}
          {course.total_duration_s > 0 && (
            <span className="flex items-center gap-1 text-xs text-stadi-gray bg-gray-50 px-2 py-0.5 rounded-full">
              <Clock size={10} /> {formatDuration(course.total_duration_s)}
            </span>
          )}
          {course.enrolment_count > 0 && (
            <span className="flex items-center gap-1 text-xs text-stadi-gray bg-gray-50 px-2 py-0.5 rounded-full">
              <Users size={10} /> {course.enrolment_count.toLocaleString()} learners
            </span>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between gap-2">
          <div>
            {course.is_free ? (
              <span className="text-lg font-bold text-stadi-green">Free</span>
            ) : (
              <span className="text-lg font-bold text-stadi-dark">
                KES {course.price_kes?.toLocaleString()}
              </span>
            )}
          </div>
          <Link to={href}>
            <button className="btn-primary text-xs py-2 px-3 rounded-lg">
              {enrolled ? 'Continue →' : 'Start Earning'}
            </button>
          </Link>
        </div>

        {/* Weekly social proof */}
        {course.weeklyEnrolments > 0 && (
          <p className="text-[10px] text-stadi-orange font-medium mt-2">
            🔥 {course.weeklyEnrolments} students enrolled this week
          </p>
        )}
      </div>
    </div>
  );
}

// ── Course grid ───────────────────────────────────────────────
export function CourseGrid({ courses, loading, emptyMessage }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }
  if (!courses?.length) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-3">📭</div>
        <p className="text-stadi-gray">{emptyMessage || 'No courses found.'}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {courses.map(c => <CourseCard key={c.id} course={c} />)}
    </div>
  );
}

// Default export — supports both import styles:
//   import CourseCard from '...'          ← Dashboard uses this
//   import { CourseCard } from '...'      ← everywhere else
export default CourseCard;