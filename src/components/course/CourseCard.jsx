import React, { useState } from 'react';
import { Link }                     from 'react-router-dom';
import { Heart, Clock, BookOpen, Users, TrendingUp, Star } from 'lucide-react';
import { Badge, SkeletonCard, StarRating, Button } from '../ui';
import useAuthStore   from '../../store/auth.store';
import { bookmarks }  from '../../lib/api';

function formatKes(n) {
  if (!n) return null;
  return n >= 1000 ? `${(n/1000).toFixed(0)}K` : n;
}
function formatDuration(seconds) {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}min`;
}

export function CourseCard({ course, showEarnBadge = true, enrolled = false }) {
  const { isLoggedIn, openAuth } = useAuthStore();
  const [bookmarked, setBookmarked] = useState(false);
  const [bLoading,   setBLoading]   = useState(false);

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
      {/* Thumbnail */}
      <div className="relative overflow-hidden">
        <Link to={`/courses/${course.slug}`}>
          <div className="h-44 bg-gradient-to-br from-stadi-green/20 to-stadi-orange/20 flex items-center justify-center overflow-hidden">
            {course.thumbnail_url ? (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-1">{course.categories?.icon_emoji || '📚'}</div>
                <div className="text-xs text-stadi-green font-semibold">{course.categories?.name}</div>
              </div>
            )}
          </div>
        </Link>

        {/* Earn income badge — the key differentiator */}
        {showEarnBadge && course.income_min_kes && (
          <div className="absolute top-2 left-2">
            <span className="flex items-center gap-1 bg-stadi-orange text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
              <TrendingUp size={10} />
              Earn KES {formatKes(course.income_min_kes)}–{formatKes(course.income_max_kes)}/mo
            </span>
          </div>
        )}

        {/* Free badge */}
        {course.is_free && (
          <div className="absolute top-2 right-2">
            <Badge variant="green">FREE</Badge>
          </div>
        )}

        {/* Enrolled badge */}
        {enrolled && (
          <div className="absolute top-2 right-2">
            <Badge variant="orange">✓ Enrolled</Badge>
          </div>
        )}

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          disabled={bLoading}
          className={`absolute bottom-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-all
            ${bookmarked ? 'bg-stadi-orange text-white' : 'bg-white/80 text-gray-400 hover:text-stadi-orange'}`}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark course'}
        >
          <Heart size={14} fill={bookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <div className="text-xs text-stadi-green font-semibold uppercase tracking-wide mb-1">
          {course.categories?.icon_emoji} {course.categories?.name}
        </div>

        {/* Title */}
        <Link to={`/courses/${course.slug}`}>
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

        {/* Rating */}
        {course.avg_rating > 0 && (
          <div className="mb-2">
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
          <Link to={`/courses/${course.slug}`}>
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
