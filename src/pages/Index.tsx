import { Button } from "@/components/ui/button";
import { Car, Shield, Leaf, ArrowRight, Star, Zap, Navigation, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: "100% Verified",
      desc: "Every user is admin-approved with identity verification. Know exactly who you're riding with.",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      icon: Zap,
      title: "Smart Matching",
      desc: "Algorithm matches you by route, gender preference, and year. Compatible rides every time.",
      gradient: "from-violet-500 to-violet-600",
    },
    {
      icon: Navigation,
      title: "Live Tracking",
      desc: "Real-time GPS tracking with automatic parent notifications the moment your ride begins.",
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      icon: Leaf,
      title: "Eco Dashboard",
      desc: "Track your carbon savings and fuel reduction. See your contribution to a greener campus.",
      gradient: "from-green-500 to-emerald-500",
    },
  ];

  const steps = [
    { n: "01", emoji: "🔐", title: "Sign Up & Get Verified", desc: "Create your account with your college email. Admin verifies your identity within 24 hours." },
    { n: "02", emoji: "🚗", title: "Find or Offer a Ride",   desc: "Browse rides going your way, or post one for your route. Smart matching handles the rest." },
    { n: "03", emoji: "📍", title: "Ride Safe & Track Live",  desc: "Board with OTP verification. Parents get a live tracking link. Arrive together, stress-free." },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "linear-gradient(160deg, #f0fdf8 0%, #f8fafc 42%, #f5f0ff 100%)" }}>

      {/* ── Sticky Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-header">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-2 font-extrabold text-xl">
            <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
              <Car className="h-4 w-4 text-white" />
            </div>
            <span className="gradient-text">RideMate</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="font-semibold text-gray-600 hover:text-gray-900" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button size="sm" className="btn-primary font-semibold px-5 h-9" onClick={() => navigate("/auth")}>
              Get Started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-16 min-h-screen flex items-center relative overflow-hidden">
        {/* Ambient blobs */}
        <div className="absolute top-28 right-16 w-[420px] h-[420px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)" }} />
        <div className="absolute bottom-20 left-12 w-[340px] h-[340px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)" }} />

        <div className="container mx-auto px-4 max-w-6xl py-16 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div className="animate-fadeInUp">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700 mb-6">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Campus-only verified ride sharing
              </div>

              <h1 className="text-5xl lg:text-[4.25rem] font-extrabold leading-[1.04] mb-6 tracking-tight">
                <span style={{ color: "hsl(222, 39%, 11%)" }}>Your Campus,</span>
                <br />
                <span className="gradient-hero-text">Better Connected.</span>
              </h1>

              <p className="text-xl text-gray-500 mb-8 leading-relaxed max-w-lg">
                Share rides safely with verified classmates going your way. Save money, cut emissions, and build real campus community.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Button size="lg" onClick={() => navigate("/auth")} className="btn-primary text-base font-semibold px-8 h-12">
                  Start Riding Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-base font-semibold px-8 h-12 border-2 hover:bg-gray-50 transition-all">
                  Offer a Ride
                </Button>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2.5">
                  {["#10b981","#3b82f6","#8b5cf6","#f59e0b","#ef4444"].map((c, i) => (
                    <div key={i} className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm" style={{ background: c }}>
                      {["A","B","C","D","E"][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 mb-0.5">
                    {[0,1,2,3,4].map(i => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Trusted by 500+ campus students</p>
                </div>
              </div>
            </div>

            {/* Right — floating preview card */}
            <div className="hidden lg:flex justify-center items-center relative stagger-2 animate-fadeInUp">
              {/* Orbit rings */}
              <div className="absolute w-[420px] h-[420px] rounded-full border border-emerald-200/40" style={{ animation: "spin 28s linear infinite" }} />
              <div className="absolute w-[320px] h-[320px] rounded-full border border-violet-200/30" style={{ animation: "spin 20s linear infinite reverse" }} />

              {/* Preview card */}
              <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-[340px] border border-gray-100/80 animate-float">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg shadow-md">R</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">Rahul Sharma</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs text-gray-500">4.9 · Verified · 3rd Year</span>
                    </div>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] rounded-full font-bold border border-emerald-200">Available</span>
                </div>

                {/* Route */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                  <div className="flex gap-3 items-start">
                    <div className="flex flex-col items-center gap-0 mt-0.5 shrink-0">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 ring-[3px] ring-emerald-200" />
                      <div className="w-0.5 h-6 bg-gradient-to-b from-emerald-400 to-red-400 opacity-50" />
                      <div className="w-3 h-3 rounded-full bg-red-500 ring-[3px] ring-red-200" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2.5">
                        <p className="text-xs font-semibold text-gray-800 truncate">Kondapur Metro</p>
                        <p className="text-xs text-gray-400 ml-2 shrink-0">8:30 AM</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-800 truncate">BITS Pilani Campus</p>
                        <p className="text-xs text-gray-400 ml-2 shrink-0">9:15 AM</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mb-4 flex-wrap">
                  {["👥 2 seats left", "📍 12 km", "🌿 Eco ride"].map((chip, i) => (
                    <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[11px] rounded-full font-medium">{chip}</span>
                  ))}
                </div>

                <button className="w-full py-3 rounded-2xl text-white text-sm font-bold shadow-lg shadow-emerald-200/60 btn-primary">
                  Request Ride · ₹96
                </button>
              </div>

              {/* Floating badge — CO₂ */}
              <div className="absolute -top-6 -right-2 bg-white rounded-2xl shadow-xl p-3 border border-gray-100 flex items-center gap-2.5 stagger-3 animate-scaleIn">
                <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                  <Leaf className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 leading-none">2.3 kg CO₂</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Saved this week</p>
                </div>
              </div>

              {/* Floating badge — OTP */}
              <div className="absolute -bottom-4 -left-6 bg-white rounded-2xl shadow-xl p-3 border border-gray-100 flex items-center gap-2.5 stagger-4 animate-scaleIn">
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 leading-none">OTP Verified</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Safe boarding</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="py-14">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { value: "500+",   label: "Campus Students",  icon: "👥" },
              { value: "2,000+", label: "Rides Shared",     icon: "🚗" },
              { value: "200 kg", label: "CO₂ Reduced",      icon: "🌿" },
              { value: "100%",   label: "Verified Users",   icon: "✅" },
            ].map((s, i) => (
              <div key={i} className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center hover:shadow-md hover:-translate-y-0.5 transition-all stagger-${i+1} animate-fadeInUp`}>
                <p className="text-3xl mb-1.5">{s.icon}</p>
                <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{s.value}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-14">
            <p className="text-emerald-600 text-xs font-bold uppercase tracking-widest mb-2">Why RideMate</p>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Built for campus. Built for safety.</h2>
            <p className="text-gray-500 max-w-md mx-auto text-lg">Every feature designed with students and safety at the center.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(({ icon: Icon, title, desc, gradient }, i) => (
              <div key={i} className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 group stagger-${i+1} animate-fadeInUp`}>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works (dark) ── */}
      <section className="py-20 mx-4 rounded-3xl overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(222, 39%, 11%) 0%, hsl(222, 30%, 16%) 100%)" }}>
        <div className="container mx-auto px-8 max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">Simple Process</p>
            <h2 className="text-4xl font-extrabold text-white tracking-tight mb-3">First ride in under 5 minutes</h2>
            <p className="text-gray-400 max-w-sm mx-auto">From sign-up to your first shared campus ride.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-[30%] right-[30%] h-px border-t-2 border-dashed border-emerald-700/50" />

            {steps.map(({ n, emoji, title, desc }, i) => (
              <div key={i} className={`text-center relative stagger-${i+1} animate-fadeInUp`}>
                <div className="relative inline-flex mb-5">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto text-3xl border border-white/10" style={{ background: "rgba(255,255,255,0.06)" }}>
                    {emoji}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                    {i + 1}
                  </div>
                </div>
                <p className="text-emerald-400 font-mono text-xs font-bold mb-2 tracking-widest">{n}</p>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100">
            <div className="w-16 h-16 rounded-3xl bg-gradient-primary flex items-center justify-center mx-auto mb-6 shadow-lg" style={{ boxShadow: "0 8px 24px rgba(16,185,129,0.30)" }}>
              <Car className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Ready to ride smarter?</h2>
            <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto leading-relaxed">
              Join your campus community. Verified rides, shared costs, real connections.
            </p>
            <Button size="lg" onClick={() => navigate("/auth")} className="btn-primary text-base font-semibold px-10 h-12">
              Join RideMate Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="mt-4 text-xs text-gray-400">No credit card · Admin verified · Campus-exclusive</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-8" style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(12px)" }}>
        <div className="container mx-auto px-4 max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-gray-900">
            <div className="w-6 h-6 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Car className="h-3 w-3 text-white" />
            </div>
            RideMate Campus
          </div>
          <p className="text-sm text-gray-400">Making campus commutes safer, greener, and more connected.</p>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-700 text-xs" onClick={() => navigate("/auth")}>Sign In</Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-700 text-xs" onClick={() => navigate("/auth")}>Sign Up</Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
