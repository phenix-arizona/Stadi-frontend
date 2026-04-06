// ── InstructorOnboarding.jsx ──────────────────────────────────
// 5-step wizard: Profile → Course → Module → Lesson → Submit
// Drop this into src/pages/InstructorOnboarding.jsx
// Add route: <Route path="/instructor/onboarding" element={<InstructorOnboarding />} />
import React, { useState, useRef } from 'react';
import { useNavigate }              from 'react-router-dom';
import { useMutation }              from '@tanstack/react-query';
import {
  User, BookOpen, Layers, Video, Send,
  ChevronRight, ChevronLeft, Check, AlertCircle,
  Plus, Trash2, Upload, Globe, DollarSign,
} from 'lucide-react';
import { instructorAPI, userAPI } from '../lib/api';
import useAuthStore               from '../store/auth.store';
import useAppStore                from '../store/app.store';

// ── Constants ─────────────────────────────────────────────────
const CATEGORIES = [
  { value:'energy',      label:'Energy' },
  { value:'technology',  label:'Technology' },
  { value:'textile',     label:'Textile' },
  { value:'fisheries',   label:'Fisheries' },
  { value:'agriculture', label:'Agriculture' },
  { value:'construction',label:'Construction' },
  { value:'beauty',      label:'Beauty' },
  { value:'hospitality', label:'Hospitality' },
  { value:'automotive',  label:'Automotive' },
  { value:'business',    label:'Business' },
];

const LANGUAGES = [
  'english','swahili','dholuo','luhya','kikuyu','kalenjin','kamba','kisii',
];

const DIFFICULTY_LEVELS = ['beginner','intermediate','advanced'];

const STEPS = [
  { id:1, label:'Profile',  Icon: User     },
  { id:2, label:'Course',   Icon: BookOpen },
  { id:3, label:'Module',   Icon: Layers   },
  { id:4, label:'Lesson',   Icon: Video    },
  { id:5, label:'Submit',   Icon: Send     },
];

// ── Helpers ───────────────────────────────────────────────────
function Field({ label, error, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-stadi-dark mb-1.5">{label}</label>
      {children}
      {hint  && <p className="text-[11px] text-stadi-gray mt-1">{hint}</p>}
      {error && <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10}/>{error}</p>}
    </div>
  );
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green ${className}`}
      {...props}
    />
  );
}

function Textarea({ className = '', ...props }) {
  return (
    <textarea
      rows={3}
      className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green resize-none ${className}`}
      {...props}
    />
  );
}

function Select({ children, className = '', ...props }) {
  return (
    <select
      className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green bg-white ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

// ── Step indicator ────────────────────────────────────────────
function StepBar({ current }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((step, i) => {
        const done    = step.id < current;
        const active  = step.id === current;
        const { Icon } = step;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all
                ${done   ? 'bg-stadi-green text-white'
                : active ? 'bg-stadi-green/10 border-2 border-stadi-green text-stadi-green'
                :          'bg-gray-100 text-gray-400'}`}>
                {done ? <Check size={16} /> : <Icon size={16} />}
              </div>
              <span className={`text-[10px] font-medium hidden sm:block
                ${active ? 'text-stadi-green' : done ? 'text-stadi-dark' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 transition-all ${done ? 'bg-stadi-green' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Step 1: Instructor Profile ────────────────────────────────
function StepProfile({ data, onChange, errors }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-stadi-dark" style={{ fontFamily:'Playfair Display' }}>
          Your instructor profile
        </h2>
        <p className="text-stadi-gray text-sm mt-1">
          Learners see this on every course you publish. Fill it out carefully.
        </p>
      </div>

      <Field label="Full name" error={errors.name}>
        <Input
          value={data.name}
          onChange={e => onChange('name', e.target.value)}
          placeholder="e.g. Achieng Otieno"
        />
      </Field>

      <Field label="Bio" error={errors.bio} hint="Describe your expertise, experience, and why you teach this skill. 50–300 words.">
        <Textarea
          rows={4}
          value={data.bio}
          onChange={e => onChange('bio', e.target.value)}
          placeholder="I have 8 years of experience in solar installation across Western Kenya. I've trained over 200 technicians..."
        />
      </Field>

      <Field label="County" error={errors.county}>
        <Input
          value={data.county}
          onChange={e => onChange('county', e.target.value)}
          placeholder="e.g. Kisumu"
        />
      </Field>

      <Field label="WhatsApp number" error={errors.whatsapp} hint="Learners may reach you for post-course support.">
        <Input
          value={data.whatsapp}
          onChange={e => onChange('whatsapp', e.target.value)}
          placeholder="+254712345678"
          type="tel"
        />
      </Field>

      <Field label="Years of experience in this skill" error={errors.experience}>
        <Input
          value={data.experience}
          onChange={e => onChange('experience', e.target.value)}
          placeholder="e.g. 5"
          type="number"
          min={0}
        />
      </Field>

      <Field label="Teaching language" error={errors.language} hint="The primary language you'll record lessons in.">
        <Select value={data.language} onChange={e => onChange('language', e.target.value)}>
          <option value="">Select a language</option>
          {LANGUAGES.map(l => (
            <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
          ))}
        </Select>
      </Field>
    </div>
  );
}

// ── Step 2: Course Details ────────────────────────────────────
function StepCourse({ data, onChange, errors }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-stadi-dark" style={{ fontFamily:'Playfair Display' }}>
          Course details
        </h2>
        <p className="text-stadi-gray text-sm mt-1">
          Tell learners what this course teaches and what they'll earn from it.
        </p>
      </div>

      <Field label="Course title" error={errors.title} hint="Be specific. Good: 'Solar Panel Installation & Repair' — not just 'Solar'.">
        <Input
          value={data.title}
          onChange={e => onChange('title', e.target.value)}
          placeholder="e.g. Solar Panel Installation & Repair"
        />
      </Field>

      <Field label="Short description" error={errors.description} hint="2–3 sentences. What will learners be able to do after completing this course?">
        <Textarea
          rows={3}
          value={data.description}
          onChange={e => onChange('description', e.target.value)}
          placeholder="Learn to install, wire, and maintain solar PV systems from scratch. By the end you'll be ready to take on residential and commercial installations."
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Category" error={errors.category}>
          <Select value={data.category} onChange={e => onChange('category', e.target.value)}>
            <option value="">Select category</option>
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Difficulty level" error={errors.difficulty}>
          <Select value={data.difficulty} onChange={e => onChange('difficulty', e.target.value)}>
            <option value="">Select level</option>
            {DIFFICULTY_LEVELS.map(d => (
              <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Price (KES)" error={errors.price_kes} hint="Minimum KES 150.">
          <Input
            value={data.price_kes}
            onChange={e => onChange('price_kes', e.target.value)}
            placeholder="e.g. 300"
            type="number"
            min={0}
          />
        </Field>
        <Field label="Free course?" error={null}>
          <div className="flex items-center gap-2 h-10">
            <input
              type="checkbox"
              id="is_free"
              checked={data.is_free}
              onChange={e => onChange('is_free', e.target.checked)}
              className="w-4 h-4 accent-stadi-green"
            />
            <label htmlFor="is_free" className="text-sm text-stadi-gray">Offer for free</label>
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Min monthly earnings (KES)" error={errors.income_min_kes} hint="What a new graduate typically earns.">
          <Input
            value={data.income_min_kes}
            onChange={e => onChange('income_min_kes', e.target.value)}
            placeholder="e.g. 20000"
            type="number"
            min={0}
          />
        </Field>
        <Field label="Max monthly earnings (KES)" error={errors.income_max_kes} hint="What an experienced graduate earns.">
          <Input
            value={data.income_max_kes}
            onChange={e => onChange('income_max_kes', e.target.value)}
            placeholder="e.g. 40000"
            type="number"
            min={0}
          />
        </Field>
      </div>

      <Field label="What learners will achieve (one per line)" error={errors.what_you_learn} hint="List 4–8 concrete skills or outcomes.">
        <Textarea
          rows={5}
          value={data.what_you_learn}
          onChange={e => onChange('what_you_learn', e.target.value)}
          placeholder={`Install and wire a solar PV system\nSize a system for a home or business\nTroubleshoot common faults\nQuote clients and price your work`}
        />
      </Field>

      <Field label="Business guide" error={null} hint="Optional: How can a graduate turn this skill into income or a business?">
        <Textarea
          rows={3}
          value={data.business_guide}
          onChange={e => onChange('business_guide', e.target.value)}
          placeholder="After completing this course, you can register with REREC Kenya and tender for government solar contracts starting from KES 200,000..."
        />
      </Field>
    </div>
  );
}

// ── Step 3: Module structure ──────────────────────────────────
function StepModules({ modules, setModules, errors }) {
  const addModule = () => setModules(m => [
    ...m,
    { id: Date.now(), title: '', description: '' },
  ]);

  const removeModule = (id) => setModules(m => m.filter(x => x.id !== id));

  const updateModule = (id, key, val) => setModules(m =>
    m.map(x => x.id === id ? { ...x, [key]: val } : x)
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-stadi-dark" style={{ fontFamily:'Playfair Display' }}>
          Course modules
        </h2>
        <p className="text-stadi-gray text-sm mt-1">
          Modules are chapters. Most courses have 3–6 modules. Each module contains several lessons.
        </p>
      </div>

      {errors.modules && (
        <p className="text-[11px] text-red-500 flex items-center gap-1">
          <AlertCircle size={10}/>{errors.modules}
        </p>
      )}

      <div className="space-y-3">
        {modules.map((mod, i) => (
          <div key={mod.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stadi-green uppercase tracking-wider">
                Module {i + 1}
              </span>
              {modules.length > 1 && (
                <button
                  onClick={() => removeModule(mod.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <Field label="Module title" error={null}>
              <Input
                value={mod.title}
                onChange={e => updateModule(mod.id, 'title', e.target.value)}
                placeholder={`e.g. ${['Introduction to Solar PV', 'System Design & Sizing', 'Installation & Wiring', 'Troubleshooting & Maintenance'][i] || 'Module title'}`}
              />
            </Field>
            <Field label="Short description (optional)" error={null}>
              <Input
                value={mod.description}
                onChange={e => updateModule(mod.id, 'description', e.target.value)}
                placeholder="What will learners cover in this module?"
              />
            </Field>
          </div>
        ))}
      </div>

      <button
        onClick={addModule}
        className="flex items-center gap-2 text-sm font-medium text-stadi-green border border-stadi-green/40 rounded-xl px-4 py-2.5 hover:bg-stadi-green-light transition-colors w-full justify-center"
      >
        <Plus size={15} /> Add module
      </button>

      <div className="bg-stadi-green-light rounded-xl p-4 text-xs text-stadi-gray">
        <p className="font-semibold text-stadi-green mb-1">Tips for good module structure</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Start with an intro module explaining tools and safety</li>
          <li>Each module should cover one clear topic</li>
          <li>End with a practical/business module</li>
          <li>Aim for 3–5 lessons per module</li>
        </ul>
      </div>
    </div>
  );
}

// ── Step 4: First lesson ──────────────────────────────────────
function StepLesson({ data, onChange, errors, modules }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-stadi-dark" style={{ fontFamily:'Playfair Display' }}>
          Your first lesson
        </h2>
        <p className="text-stadi-gray text-sm mt-1">
          Add your intro lesson now. You'll add the rest from your instructor dashboard after your course is approved.
        </p>
      </div>

      <Field label="Which module does this lesson belong to?" error={errors.lesson_module}>
        <Select value={data.lesson_module} onChange={e => onChange('lesson_module', e.target.value)}>
          <option value="">Select module</option>
          {modules.map((m, i) => (
            <option key={m.id} value={m.id}>
              Module {i + 1}: {m.title || '(untitled)'}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Lesson title" error={errors.lesson_title}>
        <Input
          value={data.lesson_title}
          onChange={e => onChange('lesson_title', e.target.value)}
          placeholder="e.g. What is Solar PV and How Does It Work?"
        />
      </Field>

      <Field label="Lesson description" error={null}>
        <Textarea
          value={data.lesson_description}
          onChange={e => onChange('lesson_description', e.target.value)}
          placeholder="A 3–5 minute introduction to photovoltaic technology, covering how sunlight is converted into electricity..."
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Duration (minutes)" error={null}>
          <Input
            value={data.lesson_duration}
            onChange={e => onChange('lesson_duration', e.target.value)}
            type="number"
            min={1}
            placeholder="e.g. 8"
          />
        </Field>
        <Field label="Free preview?" error={null} hint="Learners can watch this before paying.">
          <div className="flex items-center gap-2 h-10">
            <input
              type="checkbox"
              id="is_preview"
              checked={data.lesson_is_preview}
              onChange={e => onChange('lesson_is_preview', e.target.checked)}
              className="w-4 h-4 accent-stadi-green"
            />
            <label htmlFor="is_preview" className="text-sm text-stadi-gray">Make free preview</label>
          </div>
        </Field>
      </div>

      <Field
        label="Video URL"
        error={errors.lesson_video}
        hint="Paste a Cloudinary, YouTube, or direct MP4 URL. You can add more videos from your dashboard after approval."
      >
        <Input
          value={data.lesson_video}
          onChange={e => onChange('lesson_video', e.target.value)}
          placeholder="https://res.cloudinary.com/... or https://youtube.com/..."
          type="url"
        />
      </Field>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
        <p className="font-semibold mb-1">Recording tips for Kenya</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Record in a quiet space with good daylight — no studio needed</li>
          <li>Keep lessons 5–15 minutes each for offline learners</li>
          <li>Speak slowly and clearly — many learners will be watching on 2G</li>
          <li>Compress videos below 80 MB per lesson for easy download</li>
        </ul>
      </div>
    </div>
  );
}

// ── Step 5: Review & Submit ───────────────────────────────────
function StepSubmit({ profile, course, modules, lesson, submitting, submitError, onSubmit }) {
  const previewCount = lesson.lesson_is_preview ? 1 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-stadi-dark" style={{ fontFamily:'Playfair Display' }}>
          Review & submit
        </h2>
        <p className="text-stadi-gray text-sm mt-1">
          Our team reviews every course before it goes live. This usually takes 1–2 business days.
        </p>
      </div>

      {/* Summary cards */}
      <div className="space-y-3">
        <div className="border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-bold text-stadi-green uppercase tracking-wider mb-2">Instructor</p>
          <p className="font-semibold text-stadi-dark text-sm">{profile.name || '—'}</p>
          <p className="text-xs text-stadi-gray">{profile.county} · {profile.language}</p>
        </div>
        <div className="border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-bold text-stadi-green uppercase tracking-wider mb-2">Course</p>
          <p className="font-semibold text-stadi-dark text-sm">{course.title || '—'}</p>
          <p className="text-xs text-stadi-gray">
            {CATEGORIES.find(c => c.value === course.category)?.label || '—'}
            {' · '}
            {course.is_free ? 'Free' : `KES ${Number(course.price_kes).toLocaleString()}`}
            {' · '}
            Earn KES {Number(course.income_min_kes).toLocaleString()}–{Number(course.income_max_kes).toLocaleString()}/mo
          </p>
        </div>
        <div className="border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-bold text-stadi-green uppercase tracking-wider mb-2">Structure</p>
          <p className="text-xs text-stadi-gray">
            {modules.length} module{modules.length !== 1 ? 's' : ''} ·
            {' '}1 lesson submitted · {previewCount} free preview
          </p>
          <ul className="mt-2 space-y-0.5">
            {modules.map((m, i) => (
              <li key={m.id} className="text-xs text-stadi-dark">
                {i + 1}. {m.title || '(untitled)'}
              </li>
            ))}
          </ul>
        </div>
        <div className="border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-bold text-stadi-green uppercase tracking-wider mb-2">First lesson</p>
          <p className="font-semibold text-stadi-dark text-sm">{lesson.lesson_title || '—'}</p>
          <p className="text-xs text-stadi-gray">
            {lesson.lesson_duration ? `${lesson.lesson_duration} min` : ''}
            {lesson.lesson_is_preview ? ' · Free preview' : ''}
          </p>
        </div>
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 flex items-start gap-2">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {submitError}
        </div>
      )}

      <div className="bg-stadi-green-light rounded-xl p-4 text-xs text-stadi-gray">
        <p className="font-semibold text-stadi-green mb-1">What happens next?</p>
        <ol className="space-y-1 list-decimal list-inside">
          <li>We review your course for quality and compliance (1–2 days)</li>
          <li>You'll receive an SMS/email with approval or feedback</li>
          <li>Once approved, add the remaining lessons from your dashboard</li>
          <li>Your course goes live and learners can enrol immediately</li>
        </ol>
      </div>

      <button
        onClick={onSubmit}
        disabled={submitting}
        className="w-full bg-stadi-green text-white font-bold py-3.5 rounded-xl text-sm hover:bg-opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Submitting for review…
          </>
        ) : (
          <>
            <Send size={16} /> Submit Course for Review
          </>
        )}
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// MAIN WIZARD
// ═════════════════════════════════════════════════════════════
export default function InstructorOnboarding() {
  const navigate    = useNavigate();
  const { user }    = useAuthStore();
  const { addToast }= useAppStore();

  const [step, setStep] = useState(1);

  // Step data
  const [profile, setProfile] = useState({
    name:       user?.name || '',
    bio:        user?.bio  || '',
    county:     '',
    whatsapp:   user?.phone || '',
    experience: '',
    language:   '',
  });

  const [course, setCourse] = useState({
    title:          '',
    description:    '',
    category:       '',
    difficulty:     'beginner',
    price_kes:      '',
    is_free:        false,
    income_min_kes: '',
    income_max_kes: '',
    what_you_learn: '',
    business_guide: '',
  });

  const [modules, setModules] = useState([
    { id: 1, title: '', description: '' },
    { id: 2, title: '', description: '' },
  ]);

  const [lesson, setLesson] = useState({
    lesson_module:      '',
    lesson_title:       '',
    lesson_description: '',
    lesson_duration:    '',
    lesson_is_preview:  true,
    lesson_video:       '',
  });

  const [errors,      setErrors]      = useState({});
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState('');

  // ── Field updaters ─────────────────────────────────────────
  const updateProfile = (k, v) => setProfile(p => ({ ...p, [k]: v }));
  const updateCourse  = (k, v) => setCourse(c  => ({ ...c, [k]: v }));
  const updateLesson  = (k, v) => setLesson(l  => ({ ...l, [k]: v }));

  // ── Validation per step ────────────────────────────────────
  const validate = () => {
    const e = {};
    if (step === 1) {
      if (!profile.name.trim())    e.name     = 'Name is required';
      if (!profile.bio.trim())     e.bio      = 'Bio is required';
      if (!profile.county.trim())  e.county   = 'County is required';
      if (!profile.language)       e.language = 'Select a teaching language';
    }
    if (step === 2) {
      if (!course.title.trim())    e.title    = 'Course title is required';
      if (!course.description.trim()) e.description = 'Description is required';
      if (!course.category)        e.category = 'Select a category';
      if (!course.is_free && !course.price_kes) e.price_kes = 'Set a price or mark as free';
      if (!course.income_min_kes)  e.income_min_kes = 'Enter min monthly earnings';
      if (!course.income_max_kes)  e.income_max_kes = 'Enter max monthly earnings';
      if (!course.what_you_learn.trim()) e.what_you_learn = 'Add at least 2 learning outcomes';
    }
    if (step === 3) {
      if (modules.some(m => !m.title.trim())) e.modules = 'All modules need a title';
    }
    if (step === 4) {
      if (!lesson.lesson_module)     e.lesson_module = 'Select a module';
      if (!lesson.lesson_title.trim()) e.lesson_title = 'Lesson title is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => { setErrors({}); setStep(s => s - 1); };

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');

    try {
      // 1. Update instructor profile
      await userAPI.updateProfile({
        name:       profile.name,
        bio:        profile.bio,
        county:     profile.county,
        phone:      profile.whatsapp,
        experience_years: Number(profile.experience),
        teaching_language: profile.language,
      });

      // 2. Create the course (draft)
      const courseRes = await instructorAPI.updateCourse('new', {
        title:          course.title,
        description:    course.description,
        category_slug:  course.category,
        difficulty:     course.difficulty,
        price_kes:      course.is_free ? 0 : Number(course.price_kes),
        is_free:        course.is_free,
        income_min_kes: Number(course.income_min_kes),
        income_max_kes: Number(course.income_max_kes),
        what_you_learn: course.what_you_learn.split('\n').filter(Boolean),
        business_guide: course.business_guide,
        status:         'draft',
      });

      const courseId = courseRes?.data?.id;
      if (!courseId) throw new Error('Course creation failed');

      // 3. Create modules (in order)
      const moduleIds = {};
      for (let i = 0; i < modules.length; i++) {
        const m = modules[i];
        const modRes = await instructorAPI.createModule(courseId, {
          title:       m.title,
          description: m.description,
          position:    i + 1,
        });
        moduleIds[m.id] = modRes?.data?.id;
      }

      // 4. Create first lesson
      const targetModuleId = moduleIds[lesson.lesson_module];
      if (targetModuleId && lesson.lesson_title.trim()) {
        await instructorAPI.createLesson(targetModuleId, {
          title:           lesson.lesson_title,
          description:     lesson.lesson_description,
          duration_seconds: Number(lesson.lesson_duration || 0) * 60,
          is_preview:      lesson.lesson_is_preview,
          video_url:       lesson.lesson_video || null,
          position:        1,
        });
      }

      // 5. Submit for review
      await instructorAPI.submitCourse(courseId);

      addToast('Course submitted for review! We\'ll be in touch within 2 business days.', 'success', 7000);
      navigate('/instructor/dashboard');

    } catch (e) {
      const msg = e?.message || e?.error || 'Submission failed. Please check your details and try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-stadi-dark" style={{ fontFamily:'Playfair Display' }}>
            Become a Stadi Instructor
          </h1>
          <p className="text-stadi-gray text-sm mt-1">
            Share your skill. Earn KES 70–100 per enrolment.
          </p>
        </div>

        <StepBar current={step} />

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          {step === 1 && <StepProfile  data={profile} onChange={updateProfile} errors={errors} />}
          {step === 2 && <StepCourse   data={course}  onChange={updateCourse}  errors={errors} />}
          {step === 3 && <StepModules  modules={modules} setModules={setModules} errors={errors} />}
          {step === 4 && <StepLesson   data={lesson}  onChange={updateLesson}  errors={errors} modules={modules} />}
          {step === 5 && (
            <StepSubmit
              profile={profile}
              course={course}
              modules={modules}
              lesson={lesson}
              submitting={submitting}
              submitError={submitError}
              onSubmit={handleSubmit}
            />
          )}
        </div>

        {/* Navigation */}
        {step < 5 && (
          <div className="flex justify-between">
            {step > 1 ? (
              <button
                onClick={back}
                className="flex items-center gap-1.5 text-sm font-medium text-stadi-gray hover:text-stadi-dark transition-colors"
              >
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={next}
              className="flex items-center gap-1.5 bg-stadi-green text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-opacity-90 transition-all"
            >
              {step === 4 ? 'Review & Submit' : 'Continue'} <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Progress */}
        <p className="text-center text-xs text-stadi-gray mt-6">
          Step {step} of {STEPS.length}
        </p>
      </div>
    </div>
  );
}