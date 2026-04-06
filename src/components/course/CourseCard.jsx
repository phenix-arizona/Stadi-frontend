import React, { useState } from 'react';
import { Link }                     from 'react-router-dom';
import { Heart, Clock, BookOpen, Users, TrendingUp } from 'lucide-react';
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

// ── Category fallback images (Unsplash, by slug) ──────────────
const CATEGORY_IMAGES = {
  energy:       'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=352&fit=crop&auto=format',
  technology:   'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&h=352&fit=crop&auto=format',
  textile:      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=352&fit=crop&auto=format',
  fisheries:    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=352&fit=crop&auto=format',
  agriculture:  'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&h=352&fit=crop&auto=format',
  construction: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=352&fit=crop&auto=format',
  beauty:       'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=352&fit=crop&auto=format',
  hospitality:  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=352&fit=crop&auto=format',
  automotive:   'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=352&fit=crop&auto=format',
  business:     'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=352&fit=crop&auto=format',
  default:      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=352&fit=crop&auto=format',
};

// Small square version for the category label chip
const CATEGORY_IMAGES_SM = Object.fromEntries(
  Object.entries(CATEGORY_IMAGES).map(([k, v]) => [
    k,
    v.replace('w=600&h=352', 'w=32&h=32'),
  ])
);

// ── Image thumbnail with gradient overlay ─────────────────────
function ImageThumbnail({ course, slug }) {
  const src = CATEGORY_IMAGES[slug] || CATEGORY_IMAGES.default;
  return (
    <div className="relative w-full h-full overflow-hidden">
      <img
        src={src}
        alt={course.categories?.name || course.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.45) 100%)' }}
      />
    </div>
  );
}

// ── Progress strip (enrolled view) ────────────────────────────
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

  const slug = course.categories?.slug || 'default';

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

  // Category label image (small square)
  const categoryImgSm = CATEGORY_IMAGES_SM[slug] || CATEGORY_IMAGES_SM.default;

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
            <ImageThumbnail course={course} slug={slug} />
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

        {/* Category label — small image + name, no emoji */}
        <div className="flex items-center gap-1.5 mb-1">
          <img
            src={categoryImgSm}
            alt={course.categories?.name || ''}
            className="w-4 h-4 rounded object-cover shrink-0"
            loading="lazy"
          />
          <span className="text-xs text-stadi-green font-semibold uppercase tracking-wide">
            {course.categories?.name}
          </span>
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
          <p className="text-[10px] text-stadi-orange font-medium mt-2 flex items-center gap-1">
            <TrendingUp size={10} />
            {course.weeklyEnrolments} students enrolled this week
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
        <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-3">
          <img
            src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=64&h=64&fit=crop&auto=format"
            alt="No courses"
            className="w-full h-full object-cover opacity-40"
          />
        </div>
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