import { Link } from 'react-router-dom';
import {
  Calendar,
  Shield,
  MessageCircle,
  Leaf,
  Clock,
  Users,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { LOGO_URL, APP_NAME, BRAND_NAME } from '../constants/branding';

const features = [
  {
    icon: Calendar,
    title: 'Easy Booking',
    description: 'Book Ayurvedic consultations in just a few clicks. Choose your preferred date and time slot.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your health data is protected with secure authentication and encrypted connections.',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp Confirmation',
    description: 'Get instant appointment details sent via WhatsApp for quick confirmation and reminders.',
  },
  {
    icon: Leaf,
    title: 'Expert Vaidyas',
    description: 'Connect with experienced Ayurvedic doctors for holistic healing and wellness.',
  },
];

const stats = [
  { value: '1000+', label: 'Appointments Booked' },
  { value: '98%', label: 'Patient Satisfaction' },
  { value: '24/7', label: 'Online Booking' },
];

export default function Landing() {
  return (
    <div className="w-full flex-1 overflow-x-hidden">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <div className="absolute top-10 left-4 sm:left-10 w-48 sm:w-72 h-48 sm:h-72 bg-[#e8c547] rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-4 sm:right-10 w-64 sm:w-96 h-64 sm:h-96 bg-[#d4af37]/25 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#c9a227]/20 rounded-full blur-3xl" />
        </div>
        <div className="relative site-container py-12 sm:py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 xl:gap-24 items-center w-full">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-[#c9a227]/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm mb-6 border border-[#e8c547]/40 text-[#f9f0d5]">
                <CheckCircle className="w-4 h-4 shrink-0 text-[#e8c547]" />
                Trusted Ayurvedic Healthcare
              </div>

              <div className="flex flex-col items-center lg:items-start mb-6 sm:mb-8 lg:mb-10">
                <div className="flex items-center gap-4 sm:gap-5 lg:gap-7 xl:gap-8">
                  <img
                    src={LOGO_URL}
                    alt=""
                    className="navbar-brand-emblem-img !max-h-20 sm:!max-h-28 lg:!max-h-32 xl:!max-h-36 self-center"
                  />
                  <div className="text-left">
                    <h1 className="hero-title text-4xl sm:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl text-white">
                      {BRAND_NAME}
                    </h1>
                    <p className="flex items-center justify-center sm:justify-start gap-2 mt-2 sm:mt-3 lg:mt-4">
                      <span className="h-px w-6 sm:w-10 lg:w-14 bg-gradient-to-r from-[#e8c547] to-transparent" />
                      <span className="text-sm sm:text-base lg:text-lg font-semibold text-[#e8c547] uppercase tracking-[0.25em] lg:tracking-[0.3em]">
                        Ayurveda
                      </span>
                      <span className="h-px w-6 sm:w-10 lg:w-14 bg-gradient-to-l from-[#e8c547] to-transparent" />
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-[#d4cfc7] mb-6 sm:mb-8 lg:mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Book appointments with qualified Ayurvedic doctors, schedule consultations online,
                and receive instant WhatsApp confirmations. Holistic healing made simple.
              </p>
              <div className="flex flex-col xs:flex-row flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 lg:gap-5">
                <Link to="/register" className="btn-gold lg:!px-10 lg:!py-3.5 lg:!text-lg">
                  Book Appointment
                  <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6" />
                </Link>
                <Link to="/login" className="btn-outline-light lg:!px-10 lg:!py-3.5 lg:!text-lg">
                  Login
                </Link>
              </div>
            </div>

            <div className="mt-4 lg:mt-0 w-full">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 sm:p-8 xl:p-10 border border-[#e8c547]/30 w-full shadow-2xl">
                <div className="space-y-3 sm:space-y-4">
                  {[
                    { icon: Users, text: 'Find the right Ayurvedic specialist' },
                    { icon: Clock, text: 'Pick a convenient time slot' },
                    { icon: MessageCircle, text: 'Get WhatsApp confirmation instantly' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 sm:gap-4 bg-white/10 rounded-xl p-3 sm:p-4 xl:p-5 border border-white/10 hover:bg-white/15 transition-colors"
                    >
                      <div className="bg-[#c9a227]/30 p-2 sm:p-2.5 rounded-lg shrink-0">
                        <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#e8c547]" />
                      </div>
                      <span className="font-medium text-sm sm:text-base xl:text-lg">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section w-full">
        <div className="site-container py-10 sm:py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 xl:gap-8 w-full">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <p className="stat-value text-2xl sm:text-3xl xl:text-4xl">{stat.value}</p>
                <p className="text-xs sm:text-sm text-[#6b635a] mt-2 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section w-full py-14 sm:py-24">
        <div className="site-container">
          <div className="text-center mb-10 sm:mb-16">
            <span className="section-badge">
              <Sparkles className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Our Benefits
            </span>
            <h2 className="section-title text-2xl sm:text-3xl xl:text-4xl mb-3 sm:mb-4">
              Why Choose {APP_NAME}?
            </h2>
            <p className="text-sm sm:text-base xl:text-lg text-[#6b635a] mx-auto px-2 max-w-2xl">
              A complete Ayurvedic appointment booking platform for patients and doctors.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 xl:gap-8 w-full">
            {features.map((feature) => (
              <div key={feature.title} className="feature-card-premium group">
                <div className="flex flex-row items-center justify-start gap-2">
                  <div className="feature-icon-wrap">
                    <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-[#e8c547]" />
                  </div>
                  <h3 className="text-base sm:text-lg xl:text-xl font-semibold text-[#2a2420] mb-2 font-serif">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-[#6b635a] text-sm sm:text-base leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
