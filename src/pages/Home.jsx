import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, Play, TrendingUp, Users, ChevronRight,
  MapPin, Globe, Wifi, Star, Clock,
  Smartphone, BadgeCheck,
  GraduationCap, DollarSign, MessageCircle, Navigation,
  Search, CreditCard, Download, Trophy,
} from 'lucide-react';
import { courses as coursesAPI } from '../lib/api';
import useAuthStore from '../store/auth.store';
import { CourseCard } from '../components/course/CourseCard';
import { SkeletonCard } from '../components/ui';
import { LOGO_FULL } from '../assets/logo';

// ── Person avatar photos (Unsplash faces) ─────────────────────
const AVATARS = {
  'Achieng O.':      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&crop=face&auto=format',
  'Kamau N.':        'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=80&h=80&fit=crop&crop=face&auto=format',
  'Wanjiku M.':      'https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?w=80&h=80&fit=crop&crop=face&auto=format',
  'Ochieng A.':      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face&auto=format',
  'Chebet R.':       'https://images.unsplash.com/photo-1463453091185-61582044d556?w=80&h=80&fit=crop&crop=face&auto=format',
  'Njoki W.':        'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=80&h=80&fit=crop&crop=face&auto=format',
  'Achieng Otieno':  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=96&h=96&fit=crop&crop=face&auto=format',
  'Nyongesa Wafula': 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=96&h=96&fit=crop&crop=face&auto=format',
  'Wanjiku Muthoni': 'https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?w=96&h=96&fit=crop&crop=face&auto=format',
};

// ── Data ──────────────────────────────────────────────────────
const TICKER = [
  { name:'Achieng O.',  county:'Kisumu',   skill:'Solar Installation', earned:'KES 28,000/mo' },
  { name:'Kamau N.',    county:'Kakamega', skill:'Phone Repair',        earned:'KES 22,000/mo' },
  { name:'Wanjiku M.', county:'Siaya',    skill:'Tailoring',           earned:'KES 18,500/mo' },
  { name:'Ochieng A.', county:'Homa Bay', skill:'Fish Processing',     earned:'KES 15,000/mo' },
  { name:'Chebet R.',  county:'Eldoret',  skill:'Boda Mechanics',      earned:'KES 20,000/mo' },
  { name:'Njoki W.',   county:'Muranga',  skill:'Hair Braiding',       earned:'KES 17,000/mo' },
];

const STATS = [
  { value:'5,000+',  label:'Kenyans earning',  Icon: GraduationCap },
  { value:'KES 28M', label:'Paid to graduates', Icon: DollarSign    },
  { value:'42',      label:'Local languages',   Icon: MessageCircle  },
  { value:'47',      label:'Counties reached',  Icon: Navigation     },
];

const TESTIMONIALS = [
  {
    name:'Achieng Otieno', county:'Kisumu', skill:'Solar Installation',
    earned:'KES 28,000/mo', months:3,
    before:'Unemployed, Form 4 leaver', after:'Solar technician + own business',
    quote:'I finished the solar course in 2 weeks. Three days after getting my certificate, I landed my first installation job. I now earn more than I ever imagined.',
  },
  {
    name:'Nyongesa Wafula', county:'Kakamega', skill:'Phone Repair',
    earned:'KES 22,000/mo', months:2,
    before:'Informal phone fixer, no certificate', after:'Certified technician, KES 22K/mo',
    quote:'I used to fix phones with no training and customers haggled my prices. After Stadi, I got certified and doubled my income. The certificate changed everything.',
  },
  {
    name:'Wanjiku Muthoni', county:'Kiambu', skill:'Tailoring',
    earned:'KES 18,500/mo', months:4,
    before:'Stay-at-home mother of three', after:'Tailoring business owner',
    quote:'TVET college was impossible for me as a mother. Stadi let me learn in Swahili, on my phone, during nap time. I now run my own tailoring business from home.',
  },
];

const CATEGORIES = [
  { name:'Energy',       slug:'energy',       earn:'KES 20K–40K', image:'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=220&fit=crop&auto=format' },
  { name:'Technology',   slug:'technology',   earn:'KES 15K–30K', image:'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=220&fit=crop&auto=format' },
  { name:'Textile',      slug:'textile',      earn:'KES 12K–25K', image:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=220&fit=crop&auto=format' },
  { name:'Fisheries',    slug:'fisheries',    earn:'KES 10K–20K', image:'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=220&fit=crop&auto=format' },
  { name:'Agriculture',  slug:'agriculture',  earn:'KES 8K–18K',  image:'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=220&fit=crop&auto=format' },
  { name:'Construction', slug:'construction', earn:'KES 18K–35K', image:'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=220&fit=crop&auto=format' },
  { name:'Beauty',       slug:'beauty',       earn:'KES 10K–22K', image:'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=220&fit=crop&auto=format' },
  { name:'Hospitality',  slug:'hospitality',  earn:'KES 8K–16K',  image:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=220&fit=crop&auto=format' },
  { name:'Automotive',   slug:'automotive',   earn:'KES 15K–28K', image:'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=220&fit=crop&auto=format' },
  { name:'Business',     slug:'business',     earn:'KES 10K–30K', image:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=220&fit=crop&auto=format' },
];

// HOW steps — image thumbnails instead of emojis
const HOW = [
  {
    step:'1', Icon: Search, title:'Browse free',
    image:'https://images.unsplash.com/photo-1555421689-491a97ff2040?w=120&h=120&fit=crop&auto=format',
    desc:"Explore 35 skills. See exactly what you'll earn before spending a shilling.",
  },
  {
    step:'2', Icon: CreditCard, title:'Pay via M-Pesa',
    image:'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=120&h=120&fit=crop&auto=format',
    desc:'From KES 150. One tap. No bank, no card, no hassle.',
  },
  {
    step:'3', Icon: Download, title:'Learn offline',
    image:'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=120&h=120&fit=crop&auto=format',
    desc:'Download once on Wi-Fi. Watch anytime — no data needed.',
  },
  {
    step:'4', Icon: Trophy, title:'Get certified',
    image:'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=120&h=120&fit=crop&auto=format',
    desc:'Pass the test, earn your KNQA-aligned certificate, show it to clients.',
  },
];

// Income proof rows — small category images instead of emojis
const INCOME_ROWS = [
  { skill:'Solar Installation', county:'Kisumu',   earn:'KES 28,000/mo', time:'2 weeks', image:'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=56&h=56&fit=crop&auto=format' },
  { skill:'Phone Repair',        county:'Kakamega', earn:'KES 22,000/mo', time:'10 days', image:'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=56&h=56&fit=crop&auto=format' },
  { skill:'Tailoring',           county:'Siaya',    earn:'KES 18,500/mo', time:'3 weeks', image:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=56&h=56&fit=crop&auto=format' },
  { skill:'Boda Mechanics',      county:'Eldoret',  earn:'KES 20,000/mo', time:'2 weeks', image:'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=56&h=56&fit=crop&auto=format' },
  { skill:'Hair Braiding',       county:'Nairobi',  earn:'KES 22,000/mo', time:'1 week',  image:'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=56&h=56&fit=crop&auto=format' },
];

const WHY = [
  { icon:Globe,     title:'15 local languages',         desc:'Dholuo, Luhya, Kikuyu, Kalenjin and 11 more. No language barrier.' },
  { icon:Wifi,      title:'Offline — no data bill',     desc:'Download on Wi-Fi, study without data. Built for rural Kenya.' },
  { icon:TrendingUp,title:'Every course shows earnings', desc:'Real income data from graduates in your county before you pay.' },
  { icon:BadgeCheck,title:'KNQA-aligned certificates',  desc:"Recognised by employers. Backed by Kenya's qualifications framework." },
  { icon:Smartphone,title:'M-Pesa, KES 150',            desc:'No bank account needed. Pay the same way you pay for everything else.' },
  { icon:Users,     title:'Kenyan instructors',          desc:'Learn from artisans who know local tools, suppliers, and market rates.' },
];

// ── Avatar component ──────────────────────────────────────────
function Avatar({ name, size = 32, className = '' }) {
  const src = AVATARS[name];
  const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  return src ? (
    <img
      src={src} alt={name} loading="lazy"
      className={`rounded-full object-cover border-2 border-white ${className}`}
      style={{ width: size, height: size, minWidth: size }}
    />
  ) : (
    <div
      className={`rounded-full bg-stadi-orange/30 border-2 border-white flex items-center justify-center text-white font-bold ${className}`}
      style={{ width: size, height: size, minWidth: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

// ── Category card ─────────────────────────────────────────────
function CategoryCard({ category }) {
  return (
    <Link
      to={`/courses?category=${category.slug}`}
      className="group block rounded-xl border border-gray-100 overflow-hidden hover:-translate-y-1 transition-all duration-200 bg-white shadow-sm hover:shadow-md hover:border-stadi-green/30"
    >
      <div className="relative h-28 overflow-hidden">
        <img
          src={category.image}
          alt={category.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm text-stadi-dark mb-1 group-hover:text-stadi-green transition-colors">
          {category.name}
        </p>
        <span className="inline-block text-[10px] bg-stadi-orange/10 text-stadi-orange font-semibold px-2 py-0.5 rounded-full">
          {category.earn}/mo
        </span>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function HomePage() {
  const { isLoggedIn, openAuth } = useAuthStore();
  const navigate    = useNavigate();
  const [searchQ,   setSearchQ]   = useState('');
  const [tickerIdx, setTickerIdx] = useState(0);
  const [activeT,   setActiveT]   = useState(0);

  const { data: featuredData, isLoading } = useQuery({
    queryKey: ['courses', 'featured'],
    queryFn:  () => coursesAPI.list({ limit: 8 }),
  });
  const featured = featuredData?.data || [];

  useEffect(() => {
    const t = setInterval(() => setTickerIdx(i => (i + 1) % TICKER.length), 2800);
    return () => clearInterval(t);
  }, []);

  const tick = TICKER[tickerIdx];

  return (
    <div className="overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-br from-[#0d4a2f] via-[#1A6B4A] to-[#1e7a55] min-h-[92vh] flex items-center overflow-hidden">

        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage:`url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-stadi-orange/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-20 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* LEFT */}
            <div>
              {/* Live ticker pill — avatar photo */}
              <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-2 mb-7 transition-all duration-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stadi-orange opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-stadi-orange" />
                </span>
                <Avatar name={tick.name} size={24} className="border border-white/40" />
                <span className="text-white/90 text-sm">
                  <span className="font-semibold">{tick.name}</span>
                  <span className="text-white/60"> · {tick.county} · </span>
                  <span className="text-stadi-orange font-semibold">{tick.earned}</span>
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-5"
                style={{ fontFamily:'Playfair Display' }}>
                Turn a Skill Into
                <br />
                <span className="text-stadi-orange">KES 20,000/mo</span>
                <br />
                in 4 Weeks.
              </h1>

              <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-lg">
                Practical vocational courses in <strong className="text-white">15 Kenyan languages</strong> —
                offline, via M-Pesa, on any Android phone.
                <br className="hidden sm:block" />
                <span className="text-white/60 text-base mt-1 block">
                  5,000+ Kenyans already earning. First course from KES 150.
                </span>
              </p>

              <form
                onSubmit={e => {
                  e.preventDefault();
                  navigate(searchQ ? `/courses?q=${encodeURIComponent(searchQ)}` : '/courses');
                }}
                className="flex gap-2 mb-6 max-w-md"
              >
                <input
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder="Try: Solar, Tailoring, Phone Repair..."
                  className="flex-1 px-4 py-3.5 rounded-xl text-stadi-dark text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-stadi-orange bg-white shadow-lg"
                />
                <button type="submit"
                  className="bg-stadi-orange hover:bg-opacity-90 text-white font-bold px-5 py-3.5 rounded-xl text-sm transition-all active:scale-95 shadow-lg whitespace-nowrap">
                  Browse Skills →
                </button>
              </form>

              <div className="flex flex-wrap gap-3 mb-8">
                {!isLoggedIn && (
                  <button onClick={openAuth}
                    className="flex items-center gap-2 bg-white text-stadi-green font-bold px-6 py-3.5 rounded-xl text-sm hover:bg-gray-50 transition-all active:scale-95 shadow-lg">
                    Start Free — Browse All Courses
                  </button>
                )}
                <Link to="/courses">
                  <button className="flex items-center gap-2 border-2 border-white/30 text-white font-semibold px-5 py-3.5 rounded-xl text-sm hover:bg-white/10 transition-all">
                    <Play size={15} fill="currentColor" /> See how it works
                  </button>
                </Link>
              </div>

              {/* Trust row — real avatar photos */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <div className="flex -space-x-2">
                  {TICKER.slice(0, 5).map((t, i) => (
                    <Avatar key={i} name={t.name} size={32} />
                  ))}
                </div>
                <div className="text-sm text-white/80">
                  <strong className="text-white">5,000+</strong> Kenyans earning with Stadi
                </div>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={13} className="text-stadi-orange" fill="currentColor" />
                  ))}
                  <span className="text-white/60 text-xs ml-1">4.8/5</span>
                </div>
              </div>
            </div>

            {/* RIGHT — Income proof card with category images */}
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-white/70 text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-stadi-orange" />
                    Graduate Earnings · Kenya
                  </p>
                  <span className="bg-stadi-orange/20 text-stadi-orange text-[10px] font-bold px-2 py-1 rounded-full">VERIFIED</span>
                </div>
                <div className="space-y-3">
                  {INCOME_ROWS.map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all
                      ${i === 0 ? 'bg-white/20 border border-white/20' : 'bg-white/5 hover:bg-white/10'}`}>
                      <img
                        src={item.image}
                        alt={item.skill}
                        className="w-10 h-10 rounded-xl object-cover shrink-0"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-sm truncate">{item.skill}</div>
                        <div className="text-white/50 text-xs flex items-center gap-1.5">
                          <MapPin size={9}/>{item.county}
                          <span>·</span>
                          <Clock size={9}/>{item.time} course
                        </div>
                      </div>
                      <div className="text-stadi-orange font-bold text-sm whitespace-nowrap">{item.earn}</div>
                    </div>
                  ))}
                </div>
                <Link to="/courses"
                  className="mt-4 flex items-center justify-center gap-1 text-xs text-white/50 hover:text-white transition-colors">
                  See all 35 courses and income data <ChevronRight size={12}/>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="white" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,60 C360,0 1080,0 1440,60 L1440,60 L0,60 Z"/>
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS BAR — Lucide icons
      ══════════════════════════════════════════════════════ */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 rounded-xl bg-stadi-green-light flex items-center justify-center">
                  <s.Icon size={20} className="text-stadi-green" />
                </div>
              </div>
              <div className="text-2xl font-bold text-stadi-green">{s.value}</div>
              <div className="text-xs text-stadi-gray mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURED COURSES
      ══════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-end justify-between mb-7">
          <div>
            <h2 className="text-2xl font-bold text-stadi-dark" style={{ fontFamily:'Playfair Display' }}>
              Top Income-Earning Skills
            </h2>
            <p className="text-stadi-gray text-sm mt-1">Courses with verified graduate earnings across Kenya</p>
          </div>
          <Link to="/courses" className="text-sm font-semibold text-stadi-green hover:underline flex items-center gap-1">
            View all <ChevronRight size={14}/>
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i}/>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.map(c => <CourseCard key={c.id} course={c}/>)}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS — step images
      ══════════════════════════════════════════════════════ */}
      <section className="bg-stadi-green-light py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-stadi-dark" style={{ fontFamily:'Playfair Display' }}>
              From Zero to Earning in 4 Steps
            </h2>
            <p className="text-stadi-gray mt-2 text-sm">No complicated sign-ups. No bank account. Just M-Pesa and a phone.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {HOW.map(step => (
              <div key={step.step} className="text-center">
                <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4 shadow-sm">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="text-stadi-green font-bold text-xs uppercase tracking-wider mb-1">Step {step.step}</div>
                <h3 className="font-bold text-stadi-dark text-sm mb-1">{step.title}</h3>
                <p className="text-stadi-gray text-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            {isLoggedIn ? (
              <Link to="/courses">
                <button className="bg-stadi-green text-white font-bold px-8 py-4 rounded-xl text-base hover:bg-opacity-90 transition-all shadow-lg">
                  Browse All 35 Courses <ArrowRight size={18} className="inline ml-1"/>
                </button>
              </Link>
            ) : (
              <button onClick={openAuth}
                className="bg-stadi-green text-white font-bold px-8 py-4 rounded-xl text-base hover:bg-opacity-90 transition-all shadow-lg">
                Get Started — Browse Free <ArrowRight size={18} className="inline ml-1"/>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TESTIMONIALS — real avatar photos
      ══════════════════════════════════════════════════════ */}
      <section className="bg-stadi-dark py-16 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily:'Playfair Display' }}>
              Real People. Real Earnings. Real Kenya.
            </h2>
            <p className="text-gray-400 mt-2 text-sm">Not stock photos — graduates from across all 47 counties</p>
          </div>

          <div className="bg-white/5 rounded-2xl p-6 md:p-8 border border-white/10 mb-5">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="text-stadi-orange text-sm font-bold mb-3 flex items-center gap-2">
                  <Star size={14} fill="currentColor"/>
                  Graduate Story — {TESTIMONIALS[activeT].county} County
                </div>
                <blockquote className="text-white/90 text-base leading-relaxed italic mb-5">
                  "{TESTIMONIALS[activeT].quote}"
                </blockquote>
                <div className="flex items-center gap-3">
                  <Avatar name={TESTIMONIALS[activeT].name} size={48} />
                  <div>
                    <div className="text-white font-bold">{TESTIMONIALS[activeT].name}</div>
                    <div className="text-gray-400 text-xs flex items-center gap-1">
                      <MapPin size={10}/>{TESTIMONIALS[activeT].county} · {TESTIMONIALS[activeT].skill}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-5 space-y-3 border border-white/10">
                <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Income Journey</div>
                <div className="flex items-start gap-3">
                  <div className="text-gray-400 text-sm line-through">{TESTIMONIALS[activeT].before}</div>
                  <ArrowRight size={14} className="text-stadi-orange shrink-0 mt-1"/>
                  <div className="text-white text-sm font-semibold">{TESTIMONIALS[activeT].after}</div>
                </div>
                <div className="text-3xl font-bold text-stadi-orange">{TESTIMONIALS[activeT].earned}</div>
                <div className="text-xs text-gray-400">
                  Achieved in <strong className="text-white">{TESTIMONIALS[activeT].months} months</strong> of completing the course
                </div>
                <div className="pt-1">
                  <div className="h-1.5 bg-white/10 rounded-full">
                    <div className="h-full bg-stadi-orange rounded-full" style={{ width:`${(TESTIMONIALS[activeT].months / 6) * 100}%` }}/>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">{TESTIMONIALS[activeT].months} of 6 months</div>
                </div>
              </div>
            </div>
          </div>

          {/* Selector tabs — avatar photos */}
          <div className="flex gap-3 justify-center flex-wrap">
            {TESTIMONIALS.map((t, i) => (
              <button key={i} onClick={() => setActiveT(i)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${i === activeT ? 'bg-stadi-green text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}>
                <Avatar name={t.name} size={20} className="border-white/40" />
                {t.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CATEGORY GRID
      ══════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-stadi-dark" style={{ fontFamily:'Playfair Display' }}>
            Explore by Category
          </h2>
          <p className="text-stadi-gray mt-2 text-sm">Every category includes real income data from Kenyan graduates</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {CATEGORIES.map(cat => (
            <CategoryCard key={cat.slug} category={cat} />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WHY STADI
      ══════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-stadi-dark" style={{ fontFamily:'Playfair Display' }}>
              Built Specifically for Kenya
            </h2>
            <p className="text-stadi-gray mt-2">Not adapted. Built from scratch for how Kenyans actually learn.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHY.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-5 rounded-2xl bg-white border border-gray-100 hover:border-stadi-green/30 hover:shadow-sm transition-all">
                <div className="w-10 h-10 bg-stadi-green-light rounded-xl flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-stadi-green"/>
                </div>
                <div>
                  <h3 className="font-bold text-stadi-dark text-sm mb-1">{title}</h3>
                  <p className="text-stadi-gray text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          AUTHORITY STRIP
      ══════════════════════════════════════════════════════ */}
      <section className="bg-stadi-green-light py-10 border-y border-stadi-green/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs font-semibold text-stadi-green uppercase tracking-widest mb-5">
            Trusted Standards. Recognised Certificates.
          </p>
          <div className="flex flex-wrap justify-center gap-5">
            {[
              { name:'KNQA', desc:'Kenya National Qualifications Framework' },
              { name:'TVET', desc:'Technical & Vocational Education' },
              { name:'NITA', desc:'National Industrial Training Authority' },
              { name:'ODPC', desc:'Data Protection Commissioner' },
              { name:'KRA',  desc:'Kenya Revenue Authority Registered' },
            ].map(b => (
              <div key={b.name} className="flex flex-col items-center gap-1.5 group">
                <div className="px-4 py-2 bg-white border border-stadi-green/20 rounded-xl font-bold text-stadi-green text-sm shadow-sm group-hover:bg-stadi-green group-hover:text-white transition-all">
                  {b.name}
                </div>
                <p className="text-[10px] text-stadi-gray max-w-[100px] text-center leading-snug">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-r from-stadi-orange to-[#d4811a] py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage:`url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` }}
        />
        <div className="relative max-w-3xl mx-auto px-4 text-center text-white">
          {/* Kenya flag image */}
          <div className="flex justify-center mb-4">
            <img
              src="https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=80&h=52&fit=crop&auto=format"
              alt="Kenya"
              className="rounded-lg shadow-lg"
            />
          </div>
          <h2 className="text-3xl font-bold mb-3" style={{ fontFamily:'Playfair Display' }}>
            Your skill. Your income. Starting today.
          </h2>
          <p className="text-white/90 mb-2 text-lg max-w-xl mx-auto">
            Join 5,000+ Kenyans who picked up a practical skill and turned it into real monthly income.
          </p>
          <p className="text-white/60 text-sm mb-8">
            Free to browse · From KES 500 to enrol · M-Pesa · Works on any Android phone
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {isLoggedIn ? (
              <Link to="/courses">
                <button className="bg-white text-stadi-orange font-bold px-8 py-4 rounded-xl text-base hover:bg-gray-50 transition-all shadow-xl">
                  Browse All 35 Skills <ArrowRight size={18} className="inline ml-1"/>
                </button>
              </Link>
            ) : (
              <button onClick={openAuth}
                className="bg-white text-stadi-orange font-bold px-8 py-4 rounded-xl text-base hover:bg-gray-50 transition-all shadow-xl">
                Start Free — No Card Needed <ArrowRight size={18} className="inline ml-1"/>
              </button>
            )}
            <a href="https://wa.me/254700000000" target="_blank" rel="noreferrer">
              <button className="border-2 border-white text-white font-semibold px-6 py-4 rounded-xl text-base hover:bg-white/10 transition-all">
                Chat on WhatsApp
              </button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}