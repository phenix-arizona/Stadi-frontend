import React from 'react';
import { useQuery }    from '@tanstack/react-query';
import { instructorAPI } from '../lib/api';
import { Skeleton, Badge, Button } from '../components/ui';
import { Link }  from 'react-router-dom';

// NOTE: instructorAPI is accessed via adminAPI in this build for brevity
// In production this would use a dedicated /instructor endpoint
export default function InstructorPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stadi-dark" style={{ fontFamily: 'Playfair Display' }}>Instructor Portal</h1>
          <p className="text-stadi-gray text-sm mt-1">Manage your courses, track earnings, request payouts.</p>
        </div>
        <Link to="/instructor/new-course">
          <Button variant="primary">+ New Course</Button>
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Courses',    value: '–', icon: '📚' },
          { label: 'Total Enrollments',value: '–', icon: '👥' },
          { label: 'Earnings (KES)',   value: '–', icon: '💰' },
        ].map(s => (
          <div key={s.label} className="card p-5 text-center">
            <div className="text-3xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-stadi-green">{s.value}</div>
            <div className="text-xs text-stadi-gray">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card p-8 text-center">
        <div className="text-5xl mb-4">🎓</div>
        <h2 className="text-xl font-bold text-stadi-dark mb-2">Instructor portal coming in Phase 2</h2>
        <p className="text-stadi-gray text-sm mb-6 max-w-md mx-auto">
          The full instructor portal — course builder, video upload, earnings dashboard, and payout system — launches in Month 6 alongside the Android app.
        </p>
        <a href="mailto:instructors@stadi.co.ke">
          <Button variant="primary">Apply to Become an Instructor</Button>
        </a>
      </div>
    </div>
  );
}
