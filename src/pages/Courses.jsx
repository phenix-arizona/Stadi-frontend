import React, { useState, useEffect } from 'react';
import { useSearchParams }   from 'react-router-dom';
import { useQuery }          from '@tanstack/react-query';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { courses as coursesAPI }       from '../lib/api';
import { CourseCard }                  from '../components/course/CourseCard';
import { SkeletonCard, Button }        from '../components/ui';

const CATEGORIES = [
  { value: '',           label: 'All Categories' },
  { value: 'energy',     label: '☀️ Energy' },
  { value: 'technology', label: '📱 Technology' },
  { value: 'textile',    label: '✂️ Textile' },
  { value: 'fisheries',  label: '🐟 Fisheries' },
  { value: 'agriculture',label: '🌿 Agriculture' },
  { value: 'construction',label:'🧱 Construction' },
  { value: 'beauty',     label: '💇 Beauty' },
  { value: 'hospitality',label: '🍳 Hospitality' },
  { value: 'automotive', label: '🛵 Automotive' },
  { value: 'business',   label: '💼 Business' },
];
const DIFFICULTIES = [
  { value: '',             label: 'Any Level' },
  { value: 'beginner',     label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced' },
];
const PRICE_RANGES = [
  { value: '',          label: 'Any Price' },
  { value: '0-0',       label: 'Free' },
  { value: '0-200',     label: 'Under KES 200' },
  { value: '200-300',   label: 'KES 200–300' },
  { value: '300-500',   label: 'KES 300–500' },
  { value: '500-9999',  label: 'KES 500+' },
];

export default function CoursesPage() {
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const q          = params.get('q')          || '';
  const category   = params.get('category')   || '';
  const difficulty = params.get('difficulty') || '';
  const priceRange = params.get('price')      || '';
  const language   = params.get('language')   || '';
  const [searchInput, setSearchInput] = useState(q);

  const [minPrice, maxPrice] = priceRange.split('-').map(Number);

  const queryParams = {
    page,
    limit: 12,
    ...(category   && { category }),
    ...(difficulty && { difficulty }),
    ...(priceRange && { minPrice: minPrice || 0, maxPrice: maxPrice || 9999 }),
    ...(language   && { language }),
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: q
      ? ['courses', 'search', q, page]
      : ['courses', 'list', queryParams],
    queryFn: q
      ? () => coursesAPI.search(q, { page, limit: 12 })
      : () => coursesAPI.list(queryParams),
    keepPreviousData: true,
  });

  const courseList = data?.data || [];
  const meta       = data?.meta || {};
  const loading    = isLoading || isFetching;

  const hasFilters = !!(q || category || difficulty || priceRange || language);

  const clearFilters = () => { setParams({}); setSearchInput(''); setPage(1); };

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateParam('q', searchInput);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stadi-dark" style={{ fontFamily: 'Playfair Display' }}>
          {q ? `Results for "${q}"` : category
            ? `${CATEGORIES.find(c => c.value === category)?.label} Courses`
            : 'All Courses'}
        </h1>
        {meta.total > 0 && (
          <p className="text-stadi-gray text-sm mt-1">{meta.total} courses available</p>
        )}
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search skills, e.g. Solar, Tailoring..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green"
            />
          </div>
          <button type="submit" className="btn-primary text-sm py-2.5 px-4 rounded-xl">Search</button>
        </form>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors
            ${showFilters ? 'bg-stadi-green text-white border-stadi-green' : 'border-gray-200 text-stadi-gray hover:border-stadi-green'}`}
        >
          <SlidersHorizontal size={15} />
          Filters {hasFilters && <span className="bg-stadi-orange text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">•</span>}
        </button>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-stadi-gray hover:text-red-500 px-2">
            <X size={13} /> Clear all
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-stadi-green-light rounded-2xl p-5 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-stadi-green mb-1.5">Category</label>
            <select value={category} onChange={e => updateParam('category', e.target.value)}
              className="w-full text-xs border border-stadi-green/30 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-stadi-green">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          {/* Difficulty */}
          <div>
            <label className="block text-xs font-semibold text-stadi-green mb-1.5">Level</label>
            <select value={difficulty} onChange={e => updateParam('difficulty', e.target.value)}
              className="w-full text-xs border border-stadi-green/30 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-stadi-green">
              {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          {/* Price */}
          <div>
            <label className="block text-xs font-semibold text-stadi-green mb-1.5">Price</label>
            <select value={priceRange} onChange={e => updateParam('price', e.target.value)}
              className="w-full text-xs border border-stadi-green/30 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-stadi-green">
              {PRICE_RANGES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          {/* Language */}
          <div>
            <label className="block text-xs font-semibold text-stadi-green mb-1.5">Language</label>
            <select value={language} onChange={e => updateParam('language', e.target.value)}
              className="w-full text-xs border border-stadi-green/30 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-stadi-green">
              <option value="">All Languages</option>
              {['english','swahili','dholuo','luhya','kikuyu','kalenjin','kamba','kisii'].map(l =>
                <option key={l} value={l} className="capitalize">{l.charAt(0).toUpperCase()+l.slice(1)}</option>
              )}
            </select>
          </div>
        </div>
      )}

      {/* Category quick filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => updateParam('category', cat.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all
              ${category === cat.value
                ? 'bg-stadi-green text-white'
                : 'bg-gray-100 text-stadi-gray hover:bg-stadi-green-light hover:text-stadi-green'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Course grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : courseList.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-bold text-stadi-dark mb-2">No courses found</h3>
          <p className="text-stadi-gray text-sm mb-6">Try adjusting your filters or search terms</p>
          <button onClick={clearFilters} className="btn-primary text-sm py-2 px-5">Clear filters</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {courseList.map(c => <CourseCard key={c.id} course={c} />)}
          </div>
          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:border-stadi-green transition-colors">
                ← Previous
              </button>
              <span className="px-4 py-2 text-sm text-stadi-gray">Page {page} of {meta.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(meta.totalPages, p+1))} disabled={page === meta.totalPages}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:border-stadi-green transition-colors">
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
