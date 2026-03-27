import React, { useState } from 'react';
import { Link, useNavigate }        from 'react-router-dom';
import { useQuery }                  from '@tanstack/react-query';
import { ArrowRight, Play, TrendingUp, Users, Award, Star, ChevronRight, MapPin, CheckCircle, Zap, Globe, Wifi } from 'lucide-react';
import { courses as coursesAPI }     from '../lib/api';
import useAuthStore                  from '../store/auth.store';
import { CourseCard }                from '../components/course/CourseCard';
import { SkeletonCard, Button }      from '../components/ui';
import { LOGO_FULL }                 from '../assets/logo';

// ── Kenyan testimonials ───────────────────────────────────────
const TESTIMONIALS = [
  {
    name:    'Achieng Otieno',
    county:  'Kisumu',
    skill:   'Solar Installation',
    earned:  'KES 28,000/mo',
    quote:   'Nilimalizia kozi ya solar ndani ya wiki 2. Siku ya tatu baada ya kupata cheti, nilifanya kazi yangu ya kwanza. Stadi ilibadilisha maisha yangu.',
    quoteEn: 'I finished the solar course in 2 weeks. Three days after getting my certificate, I got my first job. Stadi changed my life.',
    avatar:  '👩🏿',
    before:  'Unemployed, Form 4 leaver',
    after:   'Solar technician, own business',
    months:  3,
  },
  {
    name:    'Kamau Njoroge',
    county:  'Kakamega',
    skill:   'Phone Repair',
    earned:  'KES 22,000/mo',
    quote:   'I used to fix phones informally without any training. After Stadi\'s course, I got certified and doubled my income. Customers trust me more now.',
    quoteEn: 'I used to fix phones informally without any training. After Stadi\'s course, I got certified and doubled my income. Customers trust me more now.',
    avatar:  '👨🏿',
    before:  'Informal phone fixer',
    after:   'Certified technician, KES 22K/mo',
    months:  2,
  },
  {
    name:    'Wanjiku Muthoni',
    county:  'Siaya',
    skill:   'Tailoring & Fashion',
    earned:  'KES 18,500/mo',
    quote:   'As a mother of three, I couldn\'t attend TVET college. Stadi let me learn at home in Swahili, on my phone, during nap time. Now I run my own tailoring business.',
    quoteEn: 'As a mother of three, I couldn\'t attend TVET college. Stadi let me learn at home in Swahili, on my phone, during nap time. Now I run my own tailoring business.',
    avatar:  '👩🏾',
    before:  'Stay-at-home mother',
    after:   'Tailoring business owner',
    months:  4,
  },
  {
    name:    'Ochieng Adhiambo',
    county:  'Homa Bay',
    skill:   'Fish Processing',
    earned:  'KES 15,000/mo',
    quote:   'Naishi karibu na Ziwa Victoria. Kozi ya usindikaji wa samaki ilinifundisha kutengeneza bidhaa za thamani. Sasa nauza pakiti za samaki wa moshi.',
    quoteEn: 'I live near Lake Victoria. The fish processing course taught me to make value-added products. I now sell smoked fish packets.',
    avatar:  '👨🏿',
    before:  'Subsistence fisherman',
    after:   'Fish value-addition entrepreneur',
    months:  3,
  },
];

// ── Stats ─────────────────────────────────────────────────────
const STATS = [
  { value: '5,000+',  label: 'Learners trained',    icon: '🎓' },
  { value: 'KES 28M', label: 'Earned by graduates', icon: '💰' },
  { value: '15',      label: 'Local languages',      icon: '🗣️' },
  { value: '47',      label: 'Counties reached',     icon: '📍' },
];

// ── How It Works ──────────────────────────────────────────────
const HOW_IT_WORKS = [
  { step: '1', title: 'Browse & Choose',  desc: 'Pick a skill from 10 categories. See real income potential before you pay.', emoji: '👀' },
  { step: '2', title: 'Pay via M-Pesa',   desc: 'Pay as little as KES 150 — one tap, no bank account needed.', emoji: '💳' },
  { step: '3', title: 'Learn Offline',    desc: 'Download the course on Wi-Fi. Watch anytime, even without internet.', emoji: '📱' },
  { step: '4', title: 'Start Earning',    desc: 'Pass the assessment, get your certificate, and land your first client.', emoji: '🏆' },
];

// ── Why Stadi ─────────────────────────────────────────────────
const WHY_STADI = [
  { icon: Globe,    title: '15 Local Languages',     desc: 'Learn in Dholuo, Luhya, Kikuyu, Kalenjin, Kamba, Kisii, and more. No language barriers.' },
  { icon: Wifi,     title: 'Offline Learning',        desc: 'Download courses once. Watch without data. Perfect for rural Kenya.' },
  { icon: TrendingUp,title:'Real Income Proof',       desc: 'Every course shows verified earnings from our graduates in your county.' },
  { icon: Award,    title: 'Verified Certificates',   desc: 'Scannable QR certificates aligned with KNQA framework. Respected by employers.' },
  { icon: Zap,      title: 'M-Pesa Payments',        desc: 'From KES 150. No bank account. Pay with M-Pesa in one tap.' },
  { icon: Users,    title: 'Local Instructors',       desc: 'Learn from Kenyan artisans and practitioners who know local tools and context.' },
];

export default function HomePage() {
  const { isLoggedIn, openAuth } = useAuthStore();
  const navigate = useNavigate();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: featuredData, isLoading } = useQuery({
    queryKey: ['courses', 'featured'],
    queryFn:  () => coursesAPI.list({ limit: 8 }),
  });

  const featuredCourses = featuredData?.data || [];

  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-stadi-green via-[#1a5c3e] to-[#0f3d27] text-white overflow-hidden">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white rounded-full" />
          <div className="absolute bottom-10 right-20 w-20 h-20 border-4 border-stadi-orange rounded-full" />
          <div className="absolute top-1/2 right-10 w-48 h-48 border-2 border-white/30 rounded-full" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-stadi-orange/20 rounded-full" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Left */}
            <div className="animate-fade-in">
              {/* Kenya-first badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-5">
                <span>🇰🇪</span> Built for Kenya's 42+ communities
              </div>

              {/* Real logo in hero */}
              <div className="mb-5">
                <img
                  src={LOGO_FULL}
                  alt="Stadi — Learn Skills. Start Earning."
                  className="h-16 w-auto brightness-0 invert drop-shadow-lg"
                  draggable={false}
                />
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4"
                  style={{ fontFamily: 'Playfair Display' }}>
                Learn a Skill.
                <br />
                <span className="text-stadi-orange">Start Earning.</span>
              </h1>

              <p className="text-white/85 text-lg leading-relaxed mb-6 max-w-lg">
                Practical vocational training in <strong>15 Kenyan languages</strong> — offline, on your phone, via WhatsApp. From KES 150.
              </p>

              {/* Search bar */}
              <form
                onSubmit={e => { e.preventDefault(); if (searchQuery) navigate(`/courses?q=${searchQuery}`); }}
                className="flex gap-2 mb-6 max-w-md"
              >
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search Solar, Tailoring, Phone Repair..."
                  className="flex-1 px-4 py-3 rounded-xl text-stadi-dark text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-stadi-orange"
                />
                <button type="submit" className="btn-secondary px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap">
                  Search
                </button>
              </form>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                {isLoggedIn ? (
                  <Link to="/courses">
                    <Button variant="secondary" size="lg">
                      Browse Courses <ArrowRight size={18} />
                    </Button>
                  </Link>
                ) : (
                  <button onClick={openAuth}>
                    <Button variant="secondary" size="lg">
                      Start Earning Today <ArrowRight size={18} />
                    </Button>
                  </button>
                )}
                <Link to="/about">
                  <Button variant="outline" size="lg"
                    className="border-white text-white hover:bg-white/10">
                    <Play size={16} /> Watch how it works
                  </Button>
                </Link>
              </div>

              {/* Mini social proof */}
              <div className="flex items-center gap-3 mt-6">
                <div className="flex -space-x-2">
                  {['👨🏿','👩🏾','👨🏿','👩🏿','👨🏾'].map((em, i) => (
                    <span key={i} className="w-8 h-8 rounded-full bg-stadi-orange/30 border-2 border-white flex items-center justify-center text-sm">
                      {em}
                    </span>
                  ))}
                </div>
                <div className="text-sm text-white/80">
                  <strong className="text-white">5,000+</strong> Kenyans already earning with Stadi
                </div>
              </div>
            </div>

            {/* Right — Earn proof card */}
            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 space-y-4">
                <div className="text-sm font-semibold text-white/70 uppercase tracking-wide">
                  📈 Real Earnings from Our Graduates
                </div>
                {[
                  { skill: 'Solar Installation', county: 'Kisumu', earning: 'KES 28,000/mo', emoji: '☀️' },
                  { skill: 'Phone Repair',        county: 'Kakamega', earning: 'KES 22,000/mo', emoji: '📱' },
                  { skill: 'Tailoring',           county: 'Siaya',    earning: 'KES 18,500/mo', emoji: '✂️' },
                  { skill: 'Boda Mechanics',      county: 'Homa Bay', earning: 'KES 20,000/mo', emoji: '🛵' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                    <span className="text-xl">{item.emoji}</span>
                    <div className="flex-1">
                      <div className="text-white font-semibold text-sm">{item.skill}</div>
                      <div className="text-white/60 text-xs flex items-center gap-1"><MapPin size={9} />{item.county}</div>
                    </div>
                    <div className="text-stadi-orange font-bold text-sm">{item.earning}</div>
                  </div>
                ))}
                <Link to="/courses" className="block text-center text-xs text-white/60 hover:text-white mt-2">
                  See all income opportunities →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,40 C360,0 1080,0 1440,40 L1440,40 L0,40 Z"/>
          </svg>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────── */}
      <section className="bg-white py-10 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label} className="group">
              <div className="text-3xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-stadi-green">{s.value}</div>
              <div className="text-xs text-stadi-gray">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED COURSES ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-end justify-between mb-7">
          <div>
            <h2 className="text-2xl font-bold text-stadi-dark" style={{ fontFamily: 'Playfair Display' }}>
              Top Income-Earning Skills
            </h2>
            <p className="text-stadi-gray text-sm mt-1">Courses with verified graduate earnings across Kenya</p>
          </div>
          <Link to="/courses" className="text-sm font-semibold text-stadi-green hover:underline flex items-center gap-1">
            View all <ChevronRight size={14} />
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredCourses.map(c => <CourseCard key={c.id} course={c} />)}
          </div>
        )}
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="bg-stadi-green-light py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-stadi-dark" style={{ fontFamily: 'Playfair Display' }}>
              From Zero to Earning in 4 Simple Steps
            </h2>
            <p className="text-stadi-gray mt-2">No complicated sign-ups. No bank account. Just M-Pesa and a phone.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative text-center">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-stadi-green/20 z-0 -translate-x-1/2" />
                )}
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-3xl">
                    {step.emoji}
                  </div>
                  <div className="text-stadi-green font-bold text-xs uppercase tracking-wider mb-1">Step {step.step}</div>
                  <h3 className="font-bold text-stadi-dark text-sm mb-1">{step.title}</h3>
                  <p className="text-stadi-gray text-xs leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            {isLoggedIn ? (
              <Link to="/courses"><Button variant="primary" size="lg">Browse Courses Now <ArrowRight size={16} /></Button></Link>
            ) : (
              <button onClick={openAuth}><Button variant="primary" size="lg">Get Started — It's Free to Browse <ArrowRight size={16} /></Button></button>
            )}
          </div>
        </div>
      </section>

      {/* ── WHY STADI ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-stadi-dark" style={{ fontFamily: 'Playfair Display' }}>
            Why Kenyans Choose Stadi
          </h2>
          <p className="text-stadi-gray mt-2">Built from the ground up for Kenya's informal sector</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHY_STADI.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 p-5 rounded-2xl border border-gray-100 hover:border-stadi-green/30 hover:bg-stadi-green-light transition-all duration-200">
              <div className="w-10 h-10 bg-stadi-green-light rounded-xl flex items-center justify-center shrink-0">
                <Icon size={20} className="text-stadi-green" />
              </div>
              <div>
                <h3 className="font-bold text-stadi-dark text-sm mb-1">{title}</h3>
                <p className="text-stadi-gray text-xs leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────── */}
      <section className="bg-stadi-dark py-16 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display' }}>
              Real Stories from Real Kenyans
            </h2>
            <p className="text-gray-400 mt-2 text-sm">Graduates from across all 47 counties, earning real money</p>
          </div>

          {/* Featured testimonial */}
          <div className="bg-white/5 rounded-2xl p-6 md:p-8 border border-white/10 mb-6">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="text-stadi-orange font-bold text-sm mb-3 flex items-center gap-2">
                  <Star size={14} fill="currentColor" />
                  Graduate Story — {TESTIMONIALS[activeTestimonial].county} County
                </div>
                <blockquote className="text-white/90 text-base leading-relaxed italic mb-4">
                  "{TESTIMONIALS[activeTestimonial].quoteEn}"
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-stadi-green rounded-full flex items-center justify-center text-2xl">
                    {TESTIMONIALS[activeTestimonial].avatar}
                  </div>
                  <div>
                    <div className="text-white font-bold">{TESTIMONIALS[activeTestimonial].name}</div>
                    <div className="text-gray-400 text-xs flex items-center gap-1">
                      <MapPin size={10} />{TESTIMONIALS[activeTestimonial].county} · {TESTIMONIALS[activeTestimonial].skill}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-5 space-y-3">
                <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Income Journey</div>
                <div className="flex items-center gap-3">
                  <div className="text-gray-400 text-sm line-through">{TESTIMONIALS[activeTestimonial].before}</div>
                  <ArrowRight size={14} className="text-stadi-orange shrink-0" />
                  <div className="text-white text-sm font-semibold">{TESTIMONIALS[activeTestimonial].after}</div>
                </div>
                <div className="text-2xl font-bold text-stadi-orange">
                  {TESTIMONIALS[activeTestimonial].earned}
                </div>
                <div className="text-xs text-gray-400">
                  Achieved in {TESTIMONIALS[activeTestimonial].months} months of completing the course
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial selector */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${i === activeTestimonial ? 'bg-stadi-green text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
              >
                {t.avatar} {t.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-stadi-dark" style={{ fontFamily: 'Playfair Display' }}>
            Explore by Category
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { emoji:'☀️', name:'Energy',       slug:'energy',      earn:'KES 20K–40K' },
            { emoji:'📱', name:'Technology',   slug:'technology',  earn:'KES 15K–30K' },
            { emoji:'✂️', name:'Textile',      slug:'textile',     earn:'KES 12K–25K' },
            { emoji:'🐟', name:'Fisheries',    slug:'fisheries',   earn:'KES 10K–20K' },
            { emoji:'🌿', name:'Agriculture',  slug:'agriculture', earn:'KES 8K–18K' },
            { emoji:'🧱', name:'Construction', slug:'construction',earn:'KES 18K–35K' },
            { emoji:'💇', name:'Beauty',       slug:'beauty',      earn:'KES 10K–22K' },
            { emoji:'🍳', name:'Hospitality',  slug:'hospitality', earn:'KES 8K–16K' },
            { emoji:'🛵', name:'Automotive',   slug:'automotive',  earn:'KES 15K–28K' },
            { emoji:'💼', name:'Business',     slug:'business',    earn:'KES 10K–30K' },
          ].map(cat => (
            <Link
              key={cat.slug}
              to={`/courses?category=${cat.slug}`}
              className="group bg-white border border-gray-100 rounded-xl p-4 text-center hover:border-stadi-green hover:bg-stadi-green-light transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="text-3xl mb-2">{cat.emoji}</div>
              <div className="font-semibold text-stadi-dark text-xs group-hover:text-stadi-green">{cat.name}</div>
              <div className="text-[10px] text-stadi-orange font-semibold mt-1">{cat.earn}/mo</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TRUST / AUTHORITY ─────────────────────────────────── */}
      <section className="bg-stadi-green-light py-10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-sm font-semibold text-stadi-green uppercase tracking-wider mb-6">
            Trusted Platform, Recognised Standards
          </h3>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { name: 'KNQA', desc: 'Kenya National Qualifications Authority Framework Aligned' },
              { name: 'TVET', desc: 'Technical & Vocational Education & Training Compliant Content' },
              { name: 'NITA', desc: 'National Industrial Training Authority Registered' },
              { name: 'ODPC', desc: 'Office of Data Protection Commissioner Registered' },
              { name: 'KRA',  desc: 'Kenya Revenue Authority Registered Business' },
            ].map(b => (
              <div key={b.name} className="group flex flex-col items-center gap-1">
                <div className="px-4 py-2 bg-white rounded-xl border border-stadi-green/20 font-bold text-stadi-green text-sm group-hover:bg-stadi-green group-hover:text-white transition-all">
                  {b.name}
                </div>
                <p className="text-xs text-stadi-gray max-w-[120px] text-center">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-stadi-orange to-[#e8941a] py-14">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ fontFamily: 'Playfair Display' }}>
            Your skill. Your income. Starting today.
          </h2>
          <p className="text-white/90 mb-7 text-lg">
            Join 5,000+ Kenyans who turned vocational skills into real income with Stadi.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {isLoggedIn ? (
              <Link to="/courses">
                <Button variant="ghost" size="xl" className="bg-white text-stadi-orange hover:bg-white/90">
                  Find Your Course <ArrowRight size={20} />
                </Button>
              </Link>
            ) : (
              <button onClick={openAuth}>
                <Button variant="ghost" size="xl" className="bg-white text-stadi-orange hover:bg-white/90">
                  Join Stadi Free — KES 0 to Browse <ArrowRight size={20} />
                </Button>
              </button>
            )}
            <a href="https://wa.me/254700000000" target="_blank" rel="noreferrer">
              <Button variant="outline" size="xl" className="border-white text-white hover:bg-white/20">
                💬 Chat on WhatsApp
              </Button>
            </a>
          </div>
          <p className="text-white/70 text-xs mt-5">
            Free to browse. First course from KES 150. M-Pesa accepted. Works on any Android phone.
          </p>
        </div>
      </section>
    </div>
  );
}
