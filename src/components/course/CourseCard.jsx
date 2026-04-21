import React, { useState } from 'react';
import { Link }           from 'react-router-dom';
import { Heart, Clock, BookOpen, Users, TrendingUp, Play } from 'lucide-react';
import { Badge, SkeletonCard, StarRating } from '../ui';
import useAuthStore  from '../../store/auth.store';
import { bookmarks } from '../../lib/api';

// ── Helpers ───────────────────────────────────────────────────
function formatKes(n) {
  if (!n) return null;
  return n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);
}

function formatDuration(s) {
  if (!s) return null;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}min`;
}

// ── Category fallback images ──────────────────────────────────
const CAT_IMAGES = {
  energy:       'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=340&fit=crop&auto=format',
  technology:   'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&h=340&fit=crop&auto=format',
  textile:      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=340&fit=crop&auto=format',
  fisheries:    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=340&fit=crop&auto=format',
  agriculture:  'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&h=340&fit=crop&auto=format',
  construction: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=340&fit=crop&auto=format',
  beauty:       'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=340&fit=crop&auto=format',
  hospitality:  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=340&fit=crop&auto=format',
  automotive:   'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=340&fit=crop&auto=format',
  business:     'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=340&fit=crop&auto=format',
  default:      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=340&fit=crop&auto=format',
};

// ── Progress bar ──────────────────────────────────────────────
function ProgressBar({ pct }) {
  if (!pct) return null;
  return (
    <div className="mt-2">
      <div className="flex justify-between text-[10px] text-stadi-gray mb-1">
        <span>Progress</span>
        <span className="font-semibold text-stadi-green">{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-stadi-green to-emerald-400 progress-animate"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// COURSE CARD — simplified, clean, with animations
// ══════════════════════════════════════════════════════════════
export function CourseCard({ course, showEarnBadge = true, enrolled = false, progress = 0 }) {
  const { isLoggedIn, openAuth } = useAuthStore();
  const [bookmarked, setBookmarked] = useState(false);
  const [bLoading,   setBLoading]   = useState(false);
  const [imgError,   setImgError]   = useState(false);

  const catSlug = course.categories?.slug || 'default';
  const href    = enrolled ? `/learn/${course.id}` : `/courses/${course.slug}`;
  const imgSrc  = (!imgError && course.thumbnail_url)
    ? course.thumbnail_url
    : CAT_IMAGES[catSlug] || CAT_IMAGES.default;

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
    <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">

      {/* ── Thumbnail ────────────────────────────────────── */}
      <Link to={href} className="block relative overflow-hidden" style={{ height: '168px' }}>
        <img
          src={imgSrc}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={() => setImgError(true)}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* ✅ Earn badge — bottom-left on image */}
        {showEarnBadge && course.income_min_kes && (
          <div className="absolute bottom-2 left-2">
            <span className="flex items-center gap-1 bg-stadi-orange text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
              <TrendingUp size={9} />
              KES {formatKes(course.income_min_kes)}–{formatKes(course.income_max_kes)}/mo
            </span>
          </div>
        )}

        {/* Duration chip — bottom-right on image */}
        {course.total_duration_s > 0 && (
          <div className="absolute bottom-2 right-2">
            <span className="flex items-center gap-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
              <Clock size={9} /> {formatDuration(course.total_duration_s)}
            </span>
          </div>
        )}

        {/* Free badge */}
        {course.is_free && !enrolled && (
          <div className="absolute top-2 right-2">
            <span className="bg-stadi-green text-white text-[10px] font-bold px-2 py-0.5 rounded-full">FREE</span>
          </div>
        )}

        {/* Play button overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <Play size={20} className="text-stadi-green ml-1" fill="currentColor" />
          </div>
        </div>
      </Link>

      {/* ── Bookmark button ───────────────────────────── */}
      <button
        onClick={handleBookmark}
        disabled={bLoading}
        className={`absolute top-2 left-2 p-1.5 rounded-full backdrop-blur-sm transition-all z-10
          ${bookmarked ? 'bg-stadi-orange text-white' : 'bg-white/80 text-gray-400 hover:text-stadi-orange'}`}
        aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
      >
        <Heart size={13} fill={bookmarked ? 'currentColor' : 'none'} />
      </button>

      {/* ── Content ──────────────────────────────────── */}
      <div className="p-4">

        {/* ✅ Category + rating row — simplified */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-stadi-green uppercase tracking-wider">
            {course.categories?.icon_emoji} {course.categories?.name}
          </span>
          {course.avg_rating > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-amber-500 font-semibold">
              ⭐ {course.avg_rating.toFixed(1)}
              <span className="text-gray-400 font-normal">({course.review_count})</span>
            </span>
          )}
        </div>

        {/* ✅ Title with hover animation */}
        <Link to={href}>
          <h3 className="font-bold text-stadi-dark dark:text-white text-sm leading-snug line-clamp-2 mb-1
            group-hover:text-stadi-green transition-colors duration-200">
            {course.title}
          </h3>
        </Link>

        {/* ✅ Subtitle — animated on hover, shows instructor */}
        <p className="text-[11px] text-stadi-gray dark:text-gray-400 mb-3 overflow-hidden transition-all duration-300"
           style={{ maxHeight: '16px' }}>
          {course.users?.name ? `by ${course.users.name}` : ''}
          {course.enrolment_count > 0 && (
            <span className="ml-2 text-[10px]">· {course.enrolment_count.toLocaleString()} learners</span>
          )}
        </p>

        {/* ✅ Progress bar (enrolled) */}
        {enrolled && <ProgressBar pct={progress} />}

        {/* ✅ Price + CTA — clean, no meta chips */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-700">
          <div>
            {course.is_free ? (
              <span className="text-base font-black text-stadi-green">Free</span>
            ) : (
              <span className="text-base font-black text-stadi-dark dark:text-white">
                KES {course.price_kes?.toLocaleString()}
              </span>
            )}
          </div>
          <Link to={href}>
            <button className="text-xs font-bold bg-stadi-green hover:bg-stadi-green/90 text-white py-1.5 px-3 rounded-lg transition-colors">
              {enrolled ? 'Continue →' : 'Enrol'}
            </button>
          </Link>
        </div>

        {/* Weekly social proof */}
        {course.weeklyEnrolments > 0 && (
          <p className="text-[10px] text-stadi-orange font-semibold mt-2">
            🔥 {course.weeklyEnrolments} enrolled this week
          </p>
        )}
      </div>
    </div>
  );
}

// ── Course Grid ───────────────────────────────────────────────
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
        <p className="text-stadi-gray dark:text-gray-400">{emptyMessage || 'No courses found.'}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {courses.map(c => <CourseCard key={c.id} course={c} />)}
    </div>
  );
}

export default CourseCard;
